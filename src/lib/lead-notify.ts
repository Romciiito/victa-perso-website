import 'server-only';
import { redis } from './redis';

/**
 * Lead notifikace do Discordu a Telegramu — okamžitý ping, když dorazí nová
 * poptávka (`/api/contact`) nebo rezervace (`/api/booking-webhook`).
 *
 * Vztah k e-mailu: e-mail přes Resend zůstává PRIMÁRNÍM a autoritativním
 * doručením leadu (contact route ho posílá do `CONTACT_DESTINATION_EMAIL` a
 * partial-failure policy podle D-011 na něm stojí). Tenhle modul je čistě
 * rychlostní vrstva navrch — push do telefonu dřív, než člověk otevře mail.
 * Proto je celý best-effort a `notifyNewLead` NIKDY nevyhodí výjimku: selhání
 * notifikace nesmí ovlivnit odpověď návštěvníkovi ani status kód route.
 *
 * ⚠️ GDPR (rozhodnutí zakladatele 2026-08-13): payload obsahuje PLNÉ kontaktní
 * údaje včetně e-mailu a telefonu. Discord Inc. (US) i Telegram jsou tím pádem
 * NOVÍ PŘÍJEMCI osobních údajů. Nasazení do produkce je podmíněno doplněním
 * obou do seznamu příjemců v zásadách ochrany osobních údajů a do záznamu o
 * činnostech zpracování (čl. 13 + čl. 30 GDPR) — viz vision.md §14 a
 * docs/setup/lead-notifications.md §4. Kdo chce snížit expozici, nastaví
 * `LEAD_NOTIFY_PII=minimal` (viz `redactForChannel` níže) — kód to podporuje
 * bez dalšího zásahu.
 *
 * Provisioning: každý kanál je nezávisle gated svými env proměnnými. Když
 * chybí, kanál se tiše přeskočí — stejná „degradace bez chyby" jako u
 * Turnstile před provisioningem (D-011), aby projekt fungoval i bez nich.
 */

/** Rozpočtová pásma — štítky převzaté 1:1 z `contact-form.tsx` (CS varianta). */
const BUDGET_LABELS: Record<string, string> = {
  under_5k: 'do 5 000 €',
  '5k-25k': '5 000 – 25 000 €',
  '25k-100k': '25 000 – 100 000 €',
  '100k+': 'nad 100 000 €',
};

/** Služby — štítky převzaté 1:1 z `contact-form.tsx` (CS varianta). */
const SERVICE_LABELS: Record<string, string> = {
  comprehensive: 'Komplexní transformace',
  web: 'Web / E-shop',
  marketing: 'Marketing / SEO / PPC',
  ai: 'AI a automatizace',
  other: 'Něco jiného',
};

export interface LeadNotification {
  kind: 'contact' | 'booking';
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  /** Vyplněné jen u ověřeného výběru z ARES/RPO (anti-fake-lead signál, Vlna 6). */
  companyIco?: string | null;
  companyCountry?: 'CZ' | 'SK' | null;
  budgetTier?: string | null;
  serviceInterest?: string | null;
  locale?: string | null;
  message?: string | null;
  /** Jen u `kind: 'booking'` — ISO datum termínu z Cal.com. */
  scheduledFor?: string | null;
  sourceUrl?: string | null;
}

/* ---------------------------------------------------------------------------
 * Limity a konstanty
 * ------------------------------------------------------------------------- */

/** Timeout na kanál. Krátký záměrně: notifikace běží v `after()`, ale pořád drží
 *  function invocation naživu a účtuje compute — zaseknutý Discord nesmí platit. */
const TIMEOUT_MS = 3_000;

/** Zpráva z formuláře může mít až 2000 znaků; do notifikace jde jen náhled. */
const MESSAGE_PREVIEW_CHARS = 600;

/** Tvrdý strop na celou Telegram zprávu (API limit je 4096 znaků). */
const TELEGRAM_MAX_CHARS = 4_000;

/** Discord embed field value limit. */
const DISCORD_FIELD_MAX = 1_024;

/** Strop na `referer` — viz komentář u jeho použití v `leadLines`. */
const SOURCE_URL_MAX = 200;

/**
 * GLOBÁLNÍ (ne per-IP) strop notifikací v okně. Per-IP limiter na
 * `/api/contact` (5/600 s) ohlídá jednoho útočníka, ale ne distribuovanou
 * vlnu z mnoha IP — ta by zaplavila kanál a v šumu by zapadl skutečný lead.
 * Leady samotné se NEZTRATÍ: pořád se ukládají do Supabase a posílají mailem,
 * tichne jen notifikační kanál.
 */
const FLOOD_MAX = 60;
const FLOOD_WINDOW_S = 3_600;

/**
 * Klíč nese POŘADOVÉ ČÍSLO okna, takže se sám rotuje. Statický klíč
 * (`notify:lead:count`) měl kritickou poruchu: když projde `INCR` a selže
 * `EXPIRE`, zůstane klíč bez TTL, čítač roste donekonečna a po 60 notifikacích
 * kanál oněmí NATRVALO — tichá, sama se neopravující ztráta všech leadů.
 * S časovým klíčem je `EXPIRE` jen úklid, ne podmínka správnosti.
 */
function floodKey(): string {
  return `notify:lead:${Math.floor(Date.now() / (FLOOD_WINDOW_S * 1_000))}`;
}

/** Barva Discord embedu podle rozpočtu — vyšší pásmo = teplejší barva. */
const EMBED_COLORS: Record<string, number> = {
  '100k+': 0xdc2626,
  '25k-100k': 0xea580c,
  '5k-25k': 0xca8a04,
  under_5k: 0x64748b,
};
const EMBED_COLOR_DEFAULT = 0x475569;
const EMBED_COLOR_BOOKING = 0x16a34a;

/* ---------------------------------------------------------------------------
 * Pomocné funkce
 * ------------------------------------------------------------------------- */

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * Ořez řetězce, který UŽ je HTML-escapovaný, tak aby se nikdy nerozsekla entita.
 *
 * Proč to nestačí řešit obyčejným `truncate`: escapování délku násobí (`&` →
 * `&amp;`, tedy 5×). Zpráva o 600 znacích samých ampersandů naroste na 3000 a
 * celá zpráva pak strop 4000 překročí — řez spadne doprostřed `&amp;`, vznikne
 * `&am`, Telegram odpoví HTTP 400 „can't parse entities" a notifikace zmizí
 * BEZE STOPY (kanál je pryč, návštěvník o ničem neví, v logu jen status).
 * Proto se useknutý ocas s nedokončenou entitou uřízne celý.
 */
export function truncateEscapedHtml(s: string, max: number): string {
  if (s.length <= max) return s;
  let cut = s.slice(0, Math.max(0, max - 1));
  const amp = cut.lastIndexOf('&');
  // `&` bez následné `;` v ocasu = rozseknutá entita.
  if (amp !== -1 && !cut.slice(amp).includes(';')) cut = cut.slice(0, amp);
  return `${cut}…`;
}

/**
 * Odstraní z textu cokoli, co vypadá jako Discord webhook nebo Telegram bot
 * token. Chyby z `fetch` (undici) umí do zprávy vložit celou cílovou URL —
 * a ta u Discordu tajemství PŘÍMO OBSAHUJE, takže by se bez tohohle
 * dostalo do produkčních logů. Vzory jsou obecné schválně: chytnou i případ,
 * kdy je v hlášce jen část URL.
 */
export function redactSecrets(msg: string): string {
  return msg
    .replace(/(discord(?:app)?\.com\/api\/webhooks\/)\d+\/[\w-]+/gi, '$1[redacted]')
    .replace(/\bbot\d{6,}:[\w-]+/gi, 'bot[redacted]');
}

/**
 * Escape pro Telegram `parse_mode: 'HTML'`. Text pochází z formuláře, tedy od
 * potenciálního útočníka — bez escapu by `<b>` v poli „jméno" buď rozbilo
 * formátování zprávy, nebo (u nevalidního tagu) shodilo celý sendMessage na
 * HTTP 400 a notifikace by tiše zmizela.
 *
 * `&` MUSÍ být první, jinak by se escapovaly už vygenerované entity.
 */
export function escapeTelegramHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function label(map: Record<string, string>, value: string | null | undefined): string | null {
  if (!value) return null;
  // Fallback na surovou hodnotu: booking payload z Cal.comu může nést pásmo,
  // které v mapě není (jiná sada custom otázek). Radši zobrazit syrový kód než
  // si vymýšlet štítek nebo údaj zahodit.
  return map[value] ?? value;
}

/**
 * `LEAD_NOTIFY_PII=minimal` vyhodí e-mail, telefon a text zprávy z payloadu —
 * úniková cesta, když se doplnění zásad ochrany osobních údajů protáhne nebo
 * když se rozhodnutí o rozsahu PII otočí. Default je `full` podle rozhodnutí
 * zakladatele.
 */
function redactForChannel(n: LeadNotification): LeadNotification {
  if (process.env.LEAD_NOTIFY_PII !== 'minimal') return n;
  return { ...n, email: '—', phone: null, message: null };
}

/* ---------------------------------------------------------------------------
 * Flood cap
 * ------------------------------------------------------------------------- */

type FloodState = 'ok' | 'cap-reached' | 'suppressed';

/**
 * Fail-OPEN: když je Redis nedostupný, notifikace projde. Stejná úvaha jako u
 * form limiterů (REQ-I-020) — výpadek Redisu nesmí utnout upozornění na
 * skutečný lead. Riziko, které tím zůstává (spamová vlna PŘESNĚ během výpadku
 * Redisu), není nová třída rizika: mailová schránka dostane stejnou vlnu.
 */
async function floodState(): Promise<FloodState> {
  try {
    const key = floodKey();
    const n = await redis.incr(key);
    // TTL je jen úklid starých oken (klíč se rotuje sám, viz `floodKey`) —
    // proto smí selhat bez následku a nečeká se na něj v kritické cestě.
    if (n === 1) await redis.expire(key, FLOOD_WINDOW_S * 2);
    if (n <= FLOOD_MAX) return 'ok';
    // Přesně na hranici pošleme JEDNO upozornění, že se kanál ztišuje. Bez něj
    // by ticho v kanálu bylo nerozlišitelné od „nikdo se neozval" — to je horší
    // než šum, protože vypadá jako klid.
    return n === FLOOD_MAX + 1 ? 'cap-reached' : 'suppressed';
  } catch (err) {
    console.warn('[lead-notify] flood cap fail-open:', (err as Error).message);
    return 'ok';
  }
}

/* ---------------------------------------------------------------------------
 * Sestavení zpráv
 * ------------------------------------------------------------------------- */

interface Line {
  name: string;
  value: string;
  inline?: boolean;
}

/** Společný pohled na lead — obě šablony (Discord i Telegram) z něj vychází. */
function leadLines(n: LeadNotification): Line[] {
  const lines: Line[] = [];
  if (n.name) lines.push({ name: 'Jméno', value: n.name });
  lines.push({ name: 'E-mail', value: n.email });
  if (n.phone) lines.push({ name: 'Telefon', value: n.phone });

  if (n.company) {
    // Ověřeno v registru = silný anti-fake-lead signál, patří na první pohled.
    const verified = n.companyIco
      ? ` ✅ ověřeno v registru (IČO ${n.companyIco}, ${n.companyCountry ?? '?'})`
      : ' ⚠️ neověřeno';
    lines.push({ name: 'Firma', value: `${n.company}${verified}` });
  }

  const budget = label(BUDGET_LABELS, n.budgetTier);
  if (budget) lines.push({ name: 'Rozpočet', value: budget, inline: true });
  const service = label(SERVICE_LABELS, n.serviceInterest);
  if (service) lines.push({ name: 'Služba', value: service, inline: true });
  if (n.locale) lines.push({ name: 'Jazyk', value: n.locale, inline: true });
  if (n.scheduledFor) lines.push({ name: 'Termín', value: n.scheduledFor });
  // `sourceUrl` je hlavička `referer` od klienta — JEDINÉ pole, které nemá
  // délkový strop ze Zod schématu. Bez ořezu by útočník sám rozhodoval o
  // velikosti notifikace (Discord embed má strop 6000 znaků na celý embed).
  if (n.sourceUrl) lines.push({ name: 'Stránka', value: truncate(n.sourceUrl, SOURCE_URL_MAX) });
  return lines;
}

function title(n: LeadNotification): string {
  return n.kind === 'booking' ? '📅 Nová rezervace' : '🔔 Nová poptávka';
}

export function buildTelegramText(n: LeadNotification): string {
  const parts = [`<b>${escapeTelegramHtml(title(n))}</b>`];
  for (const l of leadLines(n)) {
    parts.push(`<b>${escapeTelegramHtml(l.name)}:</b> ${escapeTelegramHtml(l.value)}`);
  }
  if (n.message) {
    parts.push('', escapeTelegramHtml(truncate(n.message, MESSAGE_PREVIEW_CHARS)));
  }
  // Závěrečná pojistka na celkovou délku. MUSÍ být entity-safe: escapování
  // délku násobí, takže tenhle strop je dosažitelný i legitimní zprávou plnou
  // `&`, a rozseknutá entita by znamenala HTTP 400 a tichou ztrátu notifikace.
  return truncateEscapedHtml(parts.join('\n'), TELEGRAM_MAX_CHARS);
}

export function buildDiscordPayload(n: LeadNotification): Record<string, unknown> {
  return {
    username: 'VICTA leads',
    // Bez tohohle by útočník poslal `@everyone` v poli „jméno" a webhook by
    // pingnul celý server. `parse: []` vypíná VŠECHNY zmínky — text se vykreslí
    // doslova. Nutné právě proto, že obsah je uživatelský vstup.
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: title(n),
        color:
          n.kind === 'booking'
            ? EMBED_COLOR_BOOKING
            : (EMBED_COLORS[n.budgetTier ?? ''] ?? EMBED_COLOR_DEFAULT),
        fields: leadLines(n).map((l) => ({
          name: truncate(l.name, 256),
          value: truncate(l.value, DISCORD_FIELD_MAX),
          inline: l.inline ?? false,
        })),
        ...(n.message
          ? { description: truncate(n.message, MESSAGE_PREVIEW_CHARS) }
          : {}),
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/* ---------------------------------------------------------------------------
 * Odesílání
 * ------------------------------------------------------------------------- */

/**
 * Tři stavy místo booleanu: „nenakonfigurováno" a „selhalo" se musí rozlišit,
 * jinak nejde poznat rozdíl mezi tichem z volby a tichem z poruchy.
 */
export type SendResult = 'skipped' | 'ok' | 'failed';

async function post(url: string, body: unknown, channel: string): Promise<SendResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) {
      // Logujeme jen status. Tělo odpovědi ani payload se nelogují — obsahují
      // osobní údaje leadu (stejná politika jako u chatbota, claude-rules §13).
      console.warn(`[lead-notify] ${channel} HTTP ${res.status}`);
      return 'failed';
    }
    return 'ok';
  } catch (err) {
    console.warn(`[lead-notify] ${channel} selhalo:`, redactSecrets((err as Error).message));
    return 'failed';
  }
}

async function sendDiscord(payload: Record<string, unknown>): Promise<SendResult> {
  const url = process.env.DISCORD_LEAD_WEBHOOK_URL;
  if (!url) return 'skipped';
  return post(url, payload, 'discord');
}

async function sendTelegram(text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return 'skipped';
  return post(
    `https://api.telegram.org/bot${token}/sendMessage`,
    { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true },
    'telegram',
  );
}

/**
 * Odešle notifikaci do všech nakonfigurovaných kanálů paralelně.
 *
 * NIKDY nevyhodí výjimku — volá se z `after()` v route handleru, kde by
 * neodchycená chyba znamenala hlášku v logu u požadavku, který návštěvníkovi
 * už dávno odpověděl 200.
 *
 * @returns počet kanálů, kterým se doručení povedlo (0 když žádný není
 *          nakonfigurovaný) — návratová hodnota slouží testům a diagnostice,
 *          volající ji ignoruje.
 */
export async function notifyNewLead(input: LeadNotification): Promise<number> {
  try {
    const anyConfigured =
      Boolean(process.env.DISCORD_LEAD_WEBHOOK_URL) ||
      Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
    // Bez jediného kanálu se ani nesahá na Redis — nenaprovisionovaný projekt
    // nesmí kvůli vypnuté funkci utrácet round-trip na každé odeslání formuláře.
    if (!anyConfigured) return 0;

    const flood = await floodState();
    if (flood === 'suppressed') return 0;

    let discordPayload: Record<string, unknown>;
    let telegramText: string;

    if (flood === 'cap-reached') {
      const warning =
        `⚠️ Strop notifikací (${FLOOD_MAX}/h) vyčerpán — další upozornění jsou ` +
        'do konce hodiny ztišena. Leady se dál ukládají a chodí e-mailem, ' +
        'zkontrolujte Supabase a schránku.';
      discordPayload = { username: 'VICTA leads', allowed_mentions: { parse: [] }, content: warning };
      telegramText = escapeTelegramHtml(warning);
    } else {
      const n = redactForChannel(input);
      discordPayload = buildDiscordPayload(n);
      telegramText = buildTelegramText(n);
    }

    const results = await Promise.all([sendDiscord(discordPayload), sendTelegram(telegramText)]);
    const ok = results.filter((r) => r === 'ok').length;
    const failed = results.filter((r) => r === 'failed').length;

    // Do Sentry jde jen úplné selhání: aspoň jeden kanál byl nastavený a ANI
    // JEDEN nedoručil. Selhání jednoho ze dvou je šum (lead notifikaci dostal
    // druhým kanálem), tiché rozbití obou je ale nerozlišitelné od „nikdo
    // nepíše" — a přesně to by zakladatel zjistil až po týdnech.
    if (ok === 0 && failed > 0) {
      console.error('[lead-notify] žádný nakonfigurovaný kanál nedoručil notifikaci');
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureMessage('lead-notify: all configured channels failed', {
        level: 'error',
        extra: { kind: input.kind, failed },
      });
    }
    return ok;
  } catch (err) {
    console.error('[lead-notify] neočekávaná chyba (potlačeno):', (err as Error).message);
    return 0;
  }
}
