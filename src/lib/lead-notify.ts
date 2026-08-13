import 'server-only';
import { redis } from './redis';
import { redactSecrets } from './redact-secrets';

export { redactSecrets };

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

/**
 * Ořez na `maxUnits` UTF-16 jednotek, který nikdy nenechá osamocený surrogate.
 *
 * Musí platit OBĚ invarianty současně:
 *  - délka výstupu ≤ `maxUnits` — všechny stropy tady (Telegram 4096, Discord
 *    1024 na pole) počítají UTF-16 jednotky, ne kódové body;
 *  - žádný osamocený surrogate — `slice` umí rozpůlit emoji, výsledek pak není
 *    platné UTF-16 a nejde zakódovat do UTF-8 (třída vady P2-01).
 *
 * První pokus o opravu použil `truncateAtCodePoint` ze `sanitize.ts`, čímž
 * splnil druhou invariantu a rozbil první: ta funkce ořezává na `max` KÓDOVÝCH
 * BODŮ, takže řetězec samých emoji vrátila až dvojnásobně dlouhý
 * (změřeno: `truncate('😀'×2000, 600)` → délka 1199). Druhé kolo review gate,
 * nález N-1. Řešení je useknout po jednotkách a zahodit případný osamocený
 * high surrogate na konci — o jednu jednotku kratší výstup nikomu nevadí.
 */
function cutUnits(s: string, maxUnits: number): string {
  if (s.length <= maxUnits) return s;
  // `Math.max(0, ·)` je po doplnění `max <= 0` bran u obou volajících MRTVÝ —
  // vědomě se nechává. Bez něj by záporný `maxUnits` znamenal `slice(0, -1)`,
  // tedy TICHÉ vrácení skoro celého řetězce místo prázdného; to je horší třída
  // chyby než pád. Cena je jedno volání navíc (4. kolo gate).
  let cut = s.slice(0, Math.max(0, maxUnits));
  const last = cut.charCodeAt(cut.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1);
  return cut;
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  // Bez tohohle vrátí `max <= 0` řetězec `…` délky 1, tedy o víc, než kolik
  // strop dovoluje — funkce by porušila jedinou invariantu, kvůli které
  // existuje. Dnes to žádné volání nespustí (všechna předávají konstanty
  // ≥ 200), takže jde o obranu do hloubky: strop se jednou může začít počítat
  // (zbytek rozpočtu zprávy) a záporná hodnota je pak na jeden překlep.
  if (max <= 0) return '';
  return `${cutUnits(s, max - 1)}…`;
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
  // Týž strop jako u `truncate`: samotná výpustka je 1 znak, takže pro
  // `max <= 0` neexistuje neprázdný výstup, který by se do stropu vešel.
  if (max <= 0) return '';
  let cut = cutUnits(s, max - 1);
  const amp = cut.lastIndexOf('&');
  // `&` bez následné `;` v ocasu = rozseknutá entita.
  if (amp !== -1 && !cut.slice(amp).includes(';')) cut = cut.slice(0, amp);
  // Totéž pro tag: řez uvnitř `<b>` dá `…<b` a Telegram odpoví 400. Dnes to
  // z kontaktního formuláře nejde (hlavičkový blok s tagy má při Zod stropech
  // max ~2,6 tis. znaků, řez padne vždy do těla zprávy), ale u booking cesty
  // jdou pole z Cal.com payloadu bez stropu — a stačilo by zvednout jeden
  // limit, aby to platit přestalo (nález N1 review gate).
  const lt = cut.lastIndexOf('<');
  if (lt !== -1 && !cut.slice(lt).includes('>')) cut = cut.slice(0, lt);
  // Řez UVNITŘ tagu je jen půlka problému. Druhá je NEUZAVŘENÝ tag: když řez
  // padne za `<b>Telefon:` ale před `</b>`, je tag syntakticky celý a guard
  // výše nesepne — Telegram přesto odpoví „can't parse entities: Unclosed
  // start tag" a notifikace tiše zmizí. Doměřeno ve 3. kole review gate:
  // 23 z 201 délek jména v pásmu 3900–4100 znaků dá nevyvážený tag.
  // Dosažitelné jen booking cestou (pole z Cal.com payloadu nemají Zod strop),
  // což je přesně cesta, kvůli které tenhle guard vznikl.
  const openTags = (cut.match(/<b>/g) ?? []).length - (cut.match(/<\/b>/g) ?? []).length;
  // `Math.max(0, ·)` je taky mrtvý (uživatelský obsah je escapovaný, takže
  // `</b>` navíc nemůže vzniknout, a řez ubírá jen z konce) — a taky se
  // vědomě nechává: `repeat(-1)` vyhazuje RangeError, což by celou notifikaci
  // zabilo, jen kdyby se ta úvaha jednou přestala držet.
  return `${cut}…${'</b>'.repeat(Math.max(0, openTags))}`;
}

/**
 * Escape markdownu pro Discord. `allowed_mentions` řeší jen pingy, ale embed
 * pořád renderuje markdown — VČETNĚ maskovaných odkazů `[text](url)`.
 *
 * Scénář, kvůli kterému to tu je (nález D3 review gate): útočník odešle
 * formulář se zprávou `Faktura ke schválení: [victaagency.com/faktura](https://evil.tld)`.
 * Zakladateli přijde do vlastního kanálu notifikace s hlavičkou „Nová
 * poptávka", brandingem „VICTA leads" a klikatelným odkazem, který vypadá
 * jako jeho doména. Důvěryhodný kanál je pro phishing ideální kontext.
 */
export function escapeDiscordMarkdown(s: string): string {
  // `#` escapujeme: na začátku řádku dělá nadpis a ve dvojici `-#` šedý
  // „systémový" subtext — tím sice nejde podvrhnout CÍL odkazu, ale jde
  // podvrhnout VZHLED zprávy uvnitř embedu, který má titulek „Nová poptávka"
  // a branding „VICTA leads" (3. kolo review gate).
  // `-` naopak ZÁMĚRNĚ neescapujeme: sám o sobě udělá nanejvýš odrážku, nic
  // nepodvrhne, a escapování by zmršilo každé datum v notifikaci (`2026\-09\-01`).
  return s.replace(/([\\`*_~|>[\]()#])/g, '\\$1');
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

/** Holá URL v textu od útočníka. Konec tokenu = bílý znak nebo uvozovka/špičatá
 *  závorka, tedy vše, co ani jeden klient do odkazu nezahrne. */
const URL_TOKEN_RE = /https?:\/\/[^\s<>"']+/gi;

/**
 * Zneškodní odkazy, jejichž ČITELNÁ podoba neodpovídá skutečnému cíli.
 *
 * Scénář: útočník pošle v poli „Zpráva" nebo „Firma" text
 * `https://victaagency.com@evil.tld/faktura`. Je to platná URL, ve které je
 * `victaagency.com` jen USERINFO — skutečný host je `evil.tld` (změřeno:
 * `new URL(...).hostname === 'evil.tld'`). Escape markdownu ji nezachytí: není
 * to `[text](url)` a token neobsahuje jediný escapovaný metaznak, takže do
 * payloadu projde byte po bytu (změřeno mutací — s vypnutou obranou je celé
 * `victaagency.com@evil.tld` v odchozím tělu). Holou URL si pak oba klienti
 * proklikají sami; to je jejich známé chování, ne něco, co by šlo z payloadu
 * ověřit — invarianta níž ale platí bez ohledu na ně: notifikace prostě nesmí
 * nést text, jehož čtený host lže o cíli. Zakladateli by jinak do vlastního
 * kanálu s hlavičkou „Nová poptávka" a brandingem „VICTA leads" přišel odkaz,
 * který na první pohled vede na jeho doménu — týž phishingový kontext jako
 * u maskovaných odkazů (nález D3), jinými dveřmi.
 *
 * Kritérium je JEDNA invarianta, ne seznam triků: text, který člověk přečte
 * jako host (co stojí mezi `://` a prvním `/`, `?` nebo `#`), se musí rovnat
 * hostu, na který se klient skutečně připojí. Jedna podmínka tím pokrývá
 * userinfo, unicode homoglyfy (cyrilické „а" ve `victаagency.com` → `hostname`
 * se normalizuje na punycode `xn--victagency-2qi.com`, změřeno — a punycode je
 * přesně to, co homoglyf odhalí) i desítkový zápis IP (`http://3232235777/` →
 * `192.168.1.1`). Nezachytí `https://victaagency.com.evil.tld/` — tam se ale
 * čtený host se skutečným SHODUJE, takže zobrazený text nelže; víc než tohle
 * neukáže ani adresní řádek prohlížeče.
 *
 * Proč nahradit, a ne jen označit: nechat vedle varování i původní URL by
 * klikatelný phishing zachovalo (rozbít autolink jde jen neviditelnými znaky
 * nebo změnou schématu, což je horší než ztráta informace). O nic se nepřichází
 * — notifikace je jen rychlostní vrstva, plný text leadu je v Supabase i
 * v primárním e-mailu.
 *
 * Legitimní odkaz projde BEZE ZMĚNY — notifikace se musí dát přečíst na jeden
 * pohled a odkaz na web zájemce má zůstat klikatelný. Dřívější verze tohohle
 * komentáře tvrdila, že falešný poplach nastat NEMŮŽE; to byla nepravda, kterou
 * odhalilo až 5. kolo gate (viz `TRAILING_JUNK_RE`). Přesná formulace:
 *
 * ZŮSTÁVÁ jeden vědomý falešný poplach — doména s diakritikou
 * (`https://háčky.cz`). `hostname` ji normalizuje na punycode, takže se čtená
 * podoba liší a odkaz se nahradí varováním. Neopravuje se schválně: jediný
 * způsob, jak to odlišit, je normalizovat i čtenou podobu — a tím by přestaly
 * jít poznat homoglyfy (`victаagency.com` s cyrilickým „а" se normalizuje na
 * punycode úplně stejně). Mezi „IDN doména v poptávce dostane varování" a
 * „homoglyfový phishing projde" volíme první; české firmy IDN domény skoro
 * nepoužívají, kdežto homoglyf je aktivní útok.
 */
/**
 * Interpunkce, která v běžném textu URL UKONČUJE, ale do ní nepatří.
 *
 * Bez tohohle obrana ničila LEGITIMNÍ odkazy (změřeno, 5. kolo gate — 14 z 180
 * kombinací): `URL_TOKEN_RE` nevylučuje ne-ASCII znaky, takže česká uvozovka
 * kolem odkazu se nacucne do tokenu, WHATWG parser ji zaIDNAtí do hostu a
 * čtená podoba se přestane rovnat skutečné:
 *
 *   vstup   Náš web je „https://firma.cz“ — mrkněte
 *   výstup  Náš web je „⚠️ maskovaný odkaz — skutečný cíl firma.xn--cz-x2t — …
 *
 * Zakladateli by přišlo obvinění, že poctivý zájemce maskoval odkaz, a o samotný
 * odkaz by přišel. V českém formuláři jsou uvozovky kolem URL běžné, takže to
 * nebyl okrajový případ.
 *
 * Je to záměrně DENYLIST, ne allowlist povolených znaků: minout nový druh
 * uvozovky znamená falešný poplach (nepříjemné), zatímco useknout znak, který
 * do URL patřil, by mohlo změnit posuzovaný host (nebezpečné). Odříznutí navíc
 * nemůže vyrobit falešně NEGATIVNÍ výsledek — `evil.tld“` i `evil.tld` se
 * vyhodnotí stejně.
 */
const TRAILING_JUNK_RE = /[\s.,;:!?)\]}>"'„“”‚‘’»«…—–]+$/u;

export function defangDeceptiveUrls(s: string): string {
  return s.replace(URL_TOKEN_RE, (rawToken) => {
    // Ocas se odřízne jen pro POSOUZENÍ; do textu se vrací beze změny, ať už
    // odkaz projde, nebo se nahradí varováním.
    const junk = TRAILING_JUNK_RE.exec(rawToken)?.[0] ?? '';
    const raw = junk ? rawToken.slice(0, -junk.length) : rawToken;

    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      // Neparsovatelná URL není cíl, na který by šlo kliknout — nechat ji být
      // je poctivější než hádat, co si z ní klient poskládá.
      return rawToken;
    }
    // Bez fallbacku na `''` záměrně: `raw` sedl na `URL_TOKEN_RE`, takže `://`
    // v něm JE, a `split` vrací vždy aspoň jeden prvek (změřeno i pro `''`,
    // `'/'`, `'#'`) — `[0]` tedy nemůže být `undefined` a `?? ''` by byla
    // pojistka, kterou žádný vstup nespustí a žádný test nedokáže ověřit.
    // Táž úvaha jako u `toLowerCase()` níž. Kdyby se zaplo
    // `noUncheckedIndexedAccess`, tsc si o fallback řekne sám — hlasitě.
    const authority = raw.slice(raw.indexOf('://') + 3).split(/[/?#]/)[0];
    // Port se odřezává, protože `hostname` ho nikdy nenese a výchozí port navíc
    // WHATWG parser zahazuje (změřeno: `https://example.cz:443/` → `example.cz`).
    // Bez tohohle by legitimní URL s portem spadla do „maskovaný odkaz".
    const shown = authority.replace(/:\d*$/, '').toLowerCase();
    // Na `u.hostname` se `toLowerCase()` ZÁMĚRNĚ nevolá. `URL_TOKEN_RE` pouští
    // jen http(s), a u těchhle „special" schémat parser host vždycky sám
    // znormalizuje na malá písmena (resp. punycode) — změřeno na 94 940
    // náhodně vygenerovaných parsovatelných URL, ani jedna `hostname` s velkým
    // písmenem nevrátila. Byla by to tedy pojistka, kterou žádný vstup nespustí
    // a žádný test nedokáže ověřit. Kdyby se výraz rozšířil na další schémata,
    // tahle úvaha padá — pak se `toLowerCase()` musí vrátit.
    if (shown === u.hostname) return rawToken;
    return `⚠️ maskovaný odkaz — skutečný cíl ${u.hostname}${junk}`;
  });
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
  // Normalizace je tu záměrně: striktní porovnání selhávalo směrem k VÍCE
  // osobním údajům a tiše. Hodnota `minimal ` s koncovou mezerou nebo
  // `Minimal` (obojí vznikne běžným copy-paste do Vercel dialogu) by režim
  // nezapnula a do kanálů by dál tekly kontakty, zatímco zakladatel věří, že
  // expozici snížil. Neznámá hodnota se hlásí — mlčky jet FULL je horší než
  // hlučně (nález D2 review gate).
  const mode = process.env.LEAD_NOTIFY_PII?.trim().toLowerCase();
  if (mode !== 'minimal') {
    if (mode) console.warn(`[lead-notify] neznámá hodnota LEAD_NOTIFY_PII, jedu v režimu FULL`);
    return n;
  }
  // `sourceUrl` odchází taky: `referer` nese query a UTM, tedy potenciálně
  // osobní údaje. `scheduledFor` je čas termínu — sám o sobě identifikátor
  // schůzky, v minimálním režimu nemá co dělat.
  return { ...n, email: '—', phone: null, message: null, sourceUrl: null, scheduledFor: null };
}

/* ---------------------------------------------------------------------------
 * Flood cap
 * ------------------------------------------------------------------------- */

type FloodState = 'ok' | 'cap-reached' | 'suppressed' | 'unavailable';

/**
 * Fail-OPEN: když je Redis nedostupný, notifikace projde. Stejná úvaha jako u
 * form limiterů (REQ-I-020) — výpadek Redisu nesmí utnout upozornění na
 * skutečný lead. Riziko, které tím zůstává (spamová vlna PŘESNĚ během výpadku
 * Redisu), není nová třída rizika: mailová schránka dostane stejnou vlnu.
 */
async function floodState(key: string): Promise<FloodState> {
  try {
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
    // Fail-open, ale odlišené od úspěchu: notifikace projde, jen se pak nesmí
    // dekrementovat čítač, který se nikdy neinkrementoval. Jinak by při
    // výpadku Redisu vznikl klíč na −1, na který se `EXPIRE` už nezavolá
    // (běží jen při n === 1) — táž porucha jako N-2, jinými dveřmi
    // (3. kolo review gate, NOVÝ-5).
    console.warn('[lead-notify] flood cap fail-open:', (err as Error).message);
    return 'unavailable';
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
  // Obrana proti maskovaným odkazům běží u `Stránka` PŘED ořezem: náhrada je
  // delší než krátký token, takže po ní by strop 200 znaků už neplatil.
  if (n.sourceUrl) {
    lines.push({ name: 'Stránka', value: truncate(defangDeceptiveUrls(n.sourceUrl), SOURCE_URL_MAX) });
  }
  // Každá hodnota pochází z formuláře, z hlavičky `referer` nebo z Cal.com
  // payloadu — tedy od potenciálního útočníka (i `Rozpočet` a `Služba`: `label`
  // neznámý kód propouští syrový). Obranu proto dostane úplně každá, ne jen ta,
  // u které nás to zrovna napadne — týž důvod, proč se markdown escapuje i
  // v hodnotách polí, ne jen v popisu (nález NOVÝ-2). U `Stránka` je funkce
  // aplikovaná podruhé; je idempotentní (náhrada už žádnou URL neobsahuje).
  return lines.map((l) => ({ ...l, value: defangDeceptiveUrls(l.value) }));
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
    // Obrana proti maskovaným odkazům PŘED ořezem, aby strop náhledu platil na
    // výsledný text (náhrada je delší než původní token).
    parts.push('', escapeTelegramHtml(truncate(defangDeceptiveUrls(n.message), MESSAGE_PREVIEW_CHARS)));
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
          // Escape AŽ po ořezu: escapování délku zvětšuje, ale Discord počítá
          // limit na výsledný řetězec, takže ořez musí být poslední slovo —
          // proto se strop krátí na polovinu, aby escapovaná verze prošla.
          value: escapeDiscordMarkdown(truncate(l.value, DISCORD_FIELD_MAX / 2)),
          inline: l.inline ?? false,
        })),
        ...(n.message
          ? {
              // Pořadí je stejné jako u Telegramu: obrana proti maskovaným
              // odkazům → ořez → escape.
              description: escapeDiscordMarkdown(
                truncate(defangDeceptiveUrls(n.message), MESSAGE_PREVIEW_CHARS),
              ),
            }
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
  // Nevypadá to jako duplikát `anyConfigured` v `notifyNewLead`, ale není:
  // ta podmínka je OR přes oba kanály, takže sem se dojde i s prázdným (nebo
  // jen mezerou vyplněným) DISCORD_LEAD_WEBHOOK_URL, když je nastavený Telegram
  // — a to je běžný stav, protože kanály se provisionují každý zvlášť.
  // Bez `?.trim()` je hodnota " " truthy, poletí `fetch(" ")`, ta odmítne
  // TypeErrorem „Failed to parse URL" (změřeno — `post` ho odchytí, ven jde
  // 'failed') a nenaprovisionovaný kanál se pak tváří jako rozbitý: zbytečné
  // volání u každého leadu a při souběžném výpadku Telegramu falešná Sentry
  // hláška „všechny kanály selhaly" (nález N3 review gate).
  const url = process.env.DISCORD_LEAD_WEBHOOK_URL?.trim();
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
      Boolean(process.env.DISCORD_LEAD_WEBHOOK_URL?.trim()) ||
      Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
    // Bez jediného kanálu se ani nesahá na Redis — nenaprovisionovaný projekt
    // nesmí kvůli vypnuté funkci utrácet round-trip na každé odeslání formuláře.
    if (!anyConfigured) return 0;

    // Klíč se počítá JEDNOU a drží se přes celé odeslání. Kdyby se počítal
    // znovu až po `Promise.all`, mohlo by odeslání trvající přes hranici
    // hodiny (timeout je 3 s) dekrementovat čítač NÁSLEDUJÍCÍHO okna — ten by
    // pak vznikl na −1, `EXPIRE` už by se na něj nikdy nezavolal (běží jen
    // při n === 1) a klíč by v Upstash zůstal navždy. Přesně ta porucha,
    // kterou má časový klíč vyloučit (nález N-2, 2. kolo review gate).
    const key = floodKey();
    const flood = await floodState(key);
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

    // Kvótu spotřebovává jen DORUČENÁ notifikace. Bez tohohle by hodinový
    // výpadek Discordu vyčerpal strop šedesáti nedoručenými pokusy a kanál by
    // po obnově do konce okna mlčel, přestože nedorazilo nic (nález N4 review
    // gate). Dekrement místo „nejdřív zjisti, pak zvyš" — INCR je atomický,
    // takže souběžné požadavky se nepřepočítají.
    if (ok === 0 && flood !== 'unavailable') {
      try {
        await redis.decr(key);
      } catch {
        // Nevadí: strop se pak jen dřív naplní, notifikace se neztrácí.
      }
    }

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
