import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Lead notifikace do Discordu + Telegramu (`src/lib/lead-notify.ts`).
 *
 * Stejný fake-Redis harness jako `circuit-breaker.test.ts` / `rate-limit.test.ts`
 * — viz hlavička `rate-limit.test.ts`, proč se `server-only` stubuje.
 *
 * `fetch` je stubnutý globálně: testy ověřují, CO by se odeslalo (URL, tělo,
 * escaping), aniž by kdy sáhly na síť.
 */

function createFakeRedis() {
  const store = new Map<string, string>();
  let shouldThrow = false;
  return {
    store,
    setShouldThrow(v: boolean) {
      shouldThrow = v;
    },
    async incr(key: string): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      const next = Number(store.get(key) ?? 0) + 1;
      store.set(key, String(next));
      return next;
    },
    async expire(key: string, _seconds: number): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      return store.has(key) ? 1 : 0;
    },
    async decr(key: string): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      const next = Number(store.get(key) ?? 0) - 1;
      store.set(key, String(next));
      return next;
    },
  };
}

const fakeRedis = createFakeRedis();
const captureMessage = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('../redis', () => ({ redis: fakeRedis }));
vi.mock('@sentry/nextjs', () => ({ captureMessage: (...a: unknown[]) => captureMessage(...a) }));

const {
  notifyNewLead,
  buildTelegramText,
  buildDiscordPayload,
  defangDeceptiveUrls,
  escapeDiscordMarkdown,
  escapeTelegramHtml,
  truncate,
  truncateEscapedHtml,
  redactSecrets,
} = await import('../lead-notify');

const DISCORD_URL = 'https://discord.com/api/webhooks/123/abc';
const ENV_KEYS = [
  'DISCORD_LEAD_WEBHOOK_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'LEAD_NOTIFY_PII',
] as const;

let fetchMock: ReturnType<typeof vi.fn>;

const LEAD = {
  kind: 'contact' as const,
  email: 'jan@acme.cz',
  name: 'Jan Novák',
  phone: '+420123456789',
  company: 'ACME s.r.o.',
  companyIco: '12345678',
  companyCountry: 'CZ' as const,
  budgetTier: '100k+',
  serviceInterest: 'ai',
  locale: 'cs',
  message: 'Potřebujeme AI asistenta do interního systému.',
};

/** Těla všech odchozích requestů rozparsovaná z JSON. */
function bodies(): Record<string, unknown>[] {
  return fetchMock.mock.calls.map(
    ([, init]) => JSON.parse((init as RequestInit).body as string) as Record<string, unknown>,
  );
}

function urls(): string[] {
  return fetchMock.mock.calls.map(([url]) => String(url));
}

beforeEach(() => {
  fakeRedis.store.clear();
  fakeRedis.setShouldThrow(false);
  captureMessage.mockClear();
  for (const k of ENV_KEYS) delete process.env[k];
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('provisioning gate', () => {
  it('bez jediného kanálu neodešle nic a nesáhne ani na Redis', async () => {
    const delivered = await notifyNewLead(LEAD);
    expect(delivered).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeRedis.store.size).toBe(0);
  });

  it('samotný TELEGRAM_BOT_TOKEN bez CHAT_ID kanál neaktivuje', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
    const delivered = await notifyNewLead(LEAD);
    expect(delivered).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posílá do obou kanálů, když jsou oba nakonfigurované', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    process.env.TELEGRAM_BOT_TOKEN = '123:ABC';
    process.env.TELEGRAM_CHAT_ID = '-1001234';

    const delivered = await notifyNewLead(LEAD);

    expect(delivered).toBe(2);
    expect(urls()).toEqual([DISCORD_URL, 'https://api.telegram.org/bot123:ABC/sendMessage']);
    expect(bodies()[1]).toMatchObject({ chat_id: '-1001234', parse_mode: 'HTML' });
  });
});

describe('odolnost — nikdy nevyhodí a nikdy neshodí volajícího', () => {
  beforeEach(() => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
  });

  it('HTTP chyba kanálu vrátí 0 a nevyhodí', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', { status: 429 }));
    await expect(notifyNewLead(LEAD)).resolves.toBe(0);
  });

  it('vyhozený fetch (timeout) vrátí 0 a nevyhodí', async () => {
    fetchMock.mockRejectedValue(new Error('The operation was aborted due to timeout'));
    await expect(notifyNewLead(LEAD)).resolves.toBe(0);
  });

  it('hlásí do Sentry, až když selhal každý nakonfigurovaný kanál', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));
    await notifyNewLead(LEAD);
    expect(captureMessage).toHaveBeenCalledTimes(1);
  });

  it('selhání jednoho ze dvou kanálů do Sentry nejde (druhý doručil)', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:ABC';
    process.env.TELEGRAM_CHAT_ID = '-1001234';
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await expect(notifyNewLead(LEAD)).resolves.toBe(1);
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('nedostupný Redis notifikaci NEZTLUMÍ (fail-open)', async () => {
    fakeRedis.setShouldThrow(true);
    await expect(notifyNewLead(LEAD)).resolves.toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('globální flood cap', () => {
  beforeEach(() => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
  });

  it('pustí prvních 60 notifikací v okně', async () => {
    for (let i = 0; i < 60; i++) await notifyNewLead(LEAD);
    expect(fetchMock).toHaveBeenCalledTimes(60);
    // 60. zpráva je pořád normální lead (embed), ne varování.
    expect(bodies()[59]).toHaveProperty('embeds');
  });

  it('61. odešle JEDNO varování místo leadu a 62. už mlčí', async () => {
    for (let i = 0; i < 61; i++) await notifyNewLead(LEAD);
    const warning = bodies()[60];
    expect(warning).not.toHaveProperty('embeds');
    expect(String(warning.content)).toContain('Strop notifikací');

    await notifyNewLead(LEAD);
    expect(fetchMock).toHaveBeenCalledTimes(61);
  });
});

describe('escaping a neutralizace nepřátelského vstupu', () => {
  it('Telegram: HTML z formuláře se escapuje, ampersand jako první', () => {
    expect(escapeTelegramHtml('<b>Zlý</b> & spol.')).toBe('&lt;b&gt;Zlý&lt;/b&gt; &amp; spol.');
  });

  it('Telegram: injektovaný tag ve jméně nerozbije značkování zprávy', () => {
    const text = buildTelegramText({ ...LEAD, name: '<b>PING</b>' });
    expect(text).toContain('&lt;b&gt;PING&lt;/b&gt;');
    // Jediné <b> tagy ve zprávě jsou ty naše (nadpis + názvy polí).
    expect(text).not.toContain('<b>PING</b>');
  });

  it('Discord: allowed_mentions vypíná zmínky, takže @everyone ve jméně neping', () => {
    const payload = buildDiscordPayload({ ...LEAD, name: '@everyone' });
    expect(payload.allowed_mentions).toEqual({ parse: [] });
  });
});

describe('obsah zprávy', () => {
  it('ořízne dlouhou zprávu na náhled', () => {
    const long = 'a'.repeat(2000);
    const payload = buildDiscordPayload({ ...LEAD, message: long });
    expect(String((payload.embeds as { description: string }[])[0].description).length).toBe(600);
  });

  it('truncate nechá krátký text beze změny', () => {
    expect(truncate('ahoj', 10)).toBe('ahoj');
  });

  it('ověřenou firmu odliší od neověřené', () => {
    expect(buildTelegramText(LEAD)).toContain('ověřeno v registru (IČO 12345678, CZ)');
    expect(buildTelegramText({ ...LEAD, companyIco: null })).toContain('neověřeno');
  });

  it('přeloží rozpočet a službu na čitelné štítky', () => {
    const text = buildTelegramText(LEAD);
    expect(text).toContain('nad 100 000 €');
    expect(text).toContain('AI a automatizace');
  });

  it('neznámé rozpočtové pásmo zobrazí syrově místo vymyšleného štítku', () => {
    expect(buildTelegramText({ ...LEAD, budgetTier: 'enterprise_xxl' })).toContain('enterprise_xxl');
  });

  it('rezervace má vlastní nadpis a termín', () => {
    const text = buildTelegramText({
      ...LEAD,
      kind: 'booking',
      scheduledFor: '2026-08-20T09:00:00Z',
    });
    expect(text).toContain('Nová rezervace');
    expect(text).toContain('2026-08-20T09:00:00Z');
  });
});

describe('regresní pojistky (nálezy z adversariálního review)', () => {
  it('ořez nikdy nerozsekne HTML entitu', () => {
    // Přesná rovnost, ne negativní regex: původní assertion `/&[a-z]*$/`
    // nemohla nikdy sednout, protože za entitou vždy visí `…` — test prošel
    // i s odstraněnou opravou (nález B2 review gate).
    expect(truncateEscapedHtml(`${'x'.repeat(10)}&amp;`, 13)).toBe(`${'x'.repeat(10)}…`);
  });

  it('ořez nerozsekne ani HTML tag', () => {
    expect(truncateEscapedHtml(`${'x'.repeat(10)}<b>ahoj`, 13)).toBe(`${'x'.repeat(10)}…`);
  });

  it('zpráva plná ampersandů: ořez proběhne a žádná entita nezůstane rozseknutá', () => {
    // Vstup MUSÍ strop reálně překročit, jinak se `truncateEscapedHtml` vůbec
    // nespustí a test nic netestuje (druhá polovina nálezu B2). Všechna pole
    // jsou v mezích, které pustí contactSchema.
    const text = buildTelegramText({
      ...LEAD,
      name: '&'.repeat(100),
      company: '&'.repeat(120),
      sourceUrl: `https://e.cz/${'&'.repeat(300)}`,
      message: '&'.repeat(600),
    });
    expect(text.endsWith('…'), 'k ořezu vůbec nedošlo — test by byl prázdný').toBe(true);
    expect(text.length).toBeLessThanOrEqual(4000);
    for (const m of text.matchAll(/&[^;\s]*/g)) {
      expect(m[0], `nedokončená entita: ${m[0]}`).toMatch(/^&(amp|lt|gt)$/);
    }
  });

  it('ořez nerozsekne emoji na osamocený surrogate', () => {
    // `slice` po UTF-16 jednotkách umí rozpůlit emoji; výsledek nejde
    // zakódovat do UTF-8 (regrese P2-01, nález D1 review gate).
    const text = buildTelegramText({ ...LEAD, message: `${'a'.repeat(598)}😀${'b'.repeat(200)}` });
    expect(Buffer.from(text, 'utf8').toString('utf8'), 'osamocený surrogate').toBe(text);
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(text)).toBe(false);
  });

  it('Discord: markdown z formuláře se escapuje — žádný maskovaný odkaz', () => {
    // allowed_mentions řeší jen pingy; embed pořád renderuje markdown včetně
    // [text](url). Bez escapu by šlo poslat phishing do důvěryhodného kanálu.
    const payload = buildDiscordPayload({
      ...LEAD,
      message: 'Faktura: [victaagency.com/faktura](https://evil.tld)',
    });
    const desc = String((payload.embeds as { description: string }[])[0].description);
    expect(desc).not.toMatch(/\[[^\]]*\]\([^)]*\)/);
    expect(desc).toContain('\\[');
  });

  it('Discord: markdown se escapuje i v HODNOTÁCH POLÍ, nejen v popisu', () => {
    // Jméno, firma i Stránka jsou řízené útočníkem a Discord v nich markdown
    // renderuje — maskovaný odkaz ve jméně je týž nález D3. Test na `description`
    // to nezachytí: odstranění escapu jen u polí přežilo všech 40 testů
    // (3. kolo review gate, NOVÝ-2).
    const payload = buildDiscordPayload({
      ...LEAD,
      name: '[victaagency.com](https://evil.tld)',
      company: '||skryté||',
    });
    const fields = (payload.embeds as { fields: { value: string }[] }[])[0].fields;
    const joined = fields.map((f) => f.value).join('\n');
    expect(joined).not.toMatch(/\[[^\]]*\]\([^)]*\)/);
    expect(joined).not.toContain('||skryté||');
    expect(joined).toContain('\\[');
  });

  it('Discord: nadpis ani subtext nejde podvrhnout', () => {
    const payload = buildDiscordPayload({
      ...LEAD,
      message: '# Faktura po splatnosti\n-# automatická zpráva systému VICTA',
    });
    const desc = String((payload.embeds as { description: string }[])[0].description);
    expect(desc).not.toMatch(/^#/m);
    expect(desc).not.toContain('-# ');
    // Datum se naopak escapovat NESMÍ — pomlčka zůstává čitelná.
    expect(String((buildDiscordPayload({ ...LEAD, kind: 'booking', scheduledFor: '2026-09-01' })
      .embeds as { fields: { value: string }[] }[])[0].fields.map((f) => f.value).join())).toContain(
      '2026-09-01',
    );
  });

  it('Telegram: neuzavřený tag se dorovná, nezůstane rozbité značkování', () => {
    // Řez ZA `<b>Telefon:` ale PŘED `</b>` nechá tag syntakticky celý, takže
    // guard na řez uvnitř tagu nesepne — Telegram přesto vrátí 400
    // „Unclosed start tag" a notifikace zmizí (3. kolo review gate, NOVÝ-1).
    for (let len = 3900; len <= 4100; len += 7) {
      const text = buildTelegramText({ ...LEAD, kind: 'booking', name: 'x'.repeat(len) });
      const open = (text.match(/<b>/g) ?? []).length;
      const close = (text.match(/<\/b>/g) ?? []).length;
      expect(open, `nevyvážený tag při délce ${len}`).toBe(close);
    }
  });

  it('nedostupný Redis nesmí vést k dekrementu neexistujícího čítače', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    // Reálný scénář: INCR selže (fail-open, notifikace projde), ale Redis se
    // během odeslání vzpamatuje, takže DECR by prošel — a založil klíč na −1
    // bez TTL, protože `EXPIRE` běží jen při n === 1. Kdyby selhalo obojí,
    // test by byl prázdný a mutaci by přežil.
    const brokenIncr = vi.spyOn(fakeRedis, 'incr').mockRejectedValue(new Error('redis down'));
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));

    await notifyNewLead(LEAD);

    expect(fakeRedis.store.size, 'vznikl osiřelý klíč na −1').toBe(0);
    brokenIncr.mockRestore();
  });

  it('Telegram: náhled zprávy je omezený stejně jako u Discordu', () => {
    const text = buildTelegramText({ ...LEAD, message: 'm'.repeat(2000) });
    expect(text).not.toContain('m'.repeat(700));
  });

  it('Discord: hodnota pole nepřeteče limit 1024', () => {
    const payload = buildDiscordPayload({ ...LEAD, company: 'c'.repeat(5000) });
    for (const f of (payload.embeds as { fields: { value: string }[] }[])[0].fields) {
      expect(f.value.length).toBeLessThanOrEqual(1024);
    }
  });

  it('každý odchozí požadavek má timeout signál', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    await notifyNewLead(LEAD);
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.signal, 'bez signálu drží zaseknutý kanál celou invocation').toBeDefined();
  });

  it('LEAD_NOTIFY_PII se normalizuje — selhání nesmí vést k VÍCE údajům', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    process.env.LEAD_NOTIFY_PII = '  Minimal  ';
    await notifyNewLead(LEAD);
    expect(JSON.stringify(bodies()[0])).not.toContain('jan@acme.cz');
  });

  it('mezera místo webhook URL neplatí jako nakonfigurovaný kanál', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = '   ';
    await expect(notifyNewLead(LEAD)).resolves.toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mezera místo Discord webhooku neaktivuje kanál ani vedle živého Telegramu', async () => {
    // Test výše sem nedosáhne: bez Telegramu utne odeslání už `anyConfigured`.
    // Teprve tahle kombinace (jeden kanál nastavený, druhý „vyplněný" mezerou)
    // dojde do `sendDiscord` — a tam bez `?.trim()` poletí `fetch("   ")`,
    // takže nenaprovisionovaný kanál se tváří jako rozbitý.
    process.env.DISCORD_LEAD_WEBHOOK_URL = '   ';
    process.env.TELEGRAM_BOT_TOKEN = '123:ABC';
    process.env.TELEGRAM_CHAT_ID = '-1001234';
    await expect(notifyNewLead(LEAD)).resolves.toBe(1);
    expect(urls()).toEqual(['https://api.telegram.org/bot123:ABC/sendMessage']);
  });

  it('ořez drží strop i pro nulový a záporný limit', () => {
    // Samotná výpustka je 1 znak, takže pro `max <= 0` neexistuje neprázdný
    // výstup, který by se do stropu vešel — dosud vracely obě funkce `…`,
    // tedy o znak víc, než samy slibují.
    expect(truncate('ahoj', 0)).toBe('');
    expect(truncate('ahoj', -5)).toBe('');
    expect(truncateEscapedHtml('<b>ahoj</b>', 0)).toBe('');
    expect(truncateEscapedHtml('&amp;x', -1)).toBe('');
    // Nejmenší strop, do kterého se výpustka vejde, ji pořád vrátí.
    expect(truncate('ahoj', 1)).toBe('…');
  });

  it('nedoručená notifikace nespotřebuje kvótu', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));
    for (let i = 0; i < 5; i++) await notifyNewLead(LEAD);
    // Pět selhání = čítač zpátky na nule, jinak by výpadek kanálu vyčerpal
    // strop a po obnově by kanál mlčel.
    expect(Number([...fakeRedis.store.values()][0])).toBe(0);
  });

  it('ořez drží svůj strop i u emoji (kódové body vs. UTF-16 jednotky)', () => {
    // truncateAtCodePoint splňovalo „žádný osamocený surrogate", ale rozbíjelo
    // „délka ≤ max": u samých emoji vracelo dvojnásobek (nález N-1, 2. kolo).
    expect(truncate('😀'.repeat(2000), 600).length).toBeLessThanOrEqual(600);
    expect(truncateEscapedHtml('😀'.repeat(2500), 4000).length).toBeLessThanOrEqual(4000);
    const tg = buildTelegramText({ ...LEAD, message: `😀`.repeat(1000), name: '😀'.repeat(50) });
    expect(tg.length).toBeLessThanOrEqual(4000);
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(tg)).toBe(false);
  });

  it('escapovaný obsah pole se vejde do Discord limitu i po escapu', () => {
    // Escape probíhá PO ořezu a délku zvětšuje — bez rezervy by hodnota
    // samých metaznaků přetekla 1024 a Discord embed odmítl.
    const payload = buildDiscordPayload({ ...LEAD, company: '*'.repeat(5000) });
    for (const f of (payload.embeds as { fields: { value: string }[] }[])[0].fields) {
      expect(f.value.length).toBeLessThanOrEqual(1024);
    }
  });

  it('minimal režim odstraní i Stránku a Termín, jak slibuje dokumentace', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    process.env.LEAD_NOTIFY_PII = 'minimal';
    await notifyNewLead({
      ...LEAD,
      kind: 'booking',
      // `LEAD` sourceUrl nemá — bez tohohle byla assertion prázdná a mutace
      // ji přežila (2. kolo review gate, nález N-4).
      sourceUrl: 'https://victaagency.com/cs/kontakt?utm_source=tajne',
      scheduledFor: '2026-09-01T08:00:00Z',
    });
    const sent = JSON.stringify(bodies()[0]);
    expect(sent, 'pole Stránka nesmí v minimal režimu odejít').not.toContain('utm_source');
    expect(sent, 'pole Termín nesmí v minimal režimu odejít').not.toContain('2026-09-01');
    // Kvalifikační údaje naopak zůstávají.
    expect(sent).toContain('ACME');
  });

  it('dekrement kvóty trefí klíč VLASTNÍHO okna i při přetečení přes hranici', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    const WINDOW_MS = 3_600_000;
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Start jednu sekundu před koncem okna.
    vi.setSystemTime(new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS + WINDOW_MS - 1_000));
    // Odeslání trvá 5 s → dokončí se až v dalším okně, a selže → dekrement.
    fetchMock.mockImplementation(async () => {
      vi.setSystemTime(new Date(Date.now() + 5_000));
      return new Response('', { status: 500 });
    });

    await notifyNewLead(LEAD);

    // Dekrement musí trefit týž klíč jako inkrement: jeden klíč, hodnota 0.
    // Jinak vznikne klíč dalšího okna na −1, na který se EXPIRE už nikdy
    // nezavolá, a zůstane v Redisu navždy.
    const entries = [...fakeRedis.store.entries()];
    expect(entries).toHaveLength(1);
    expect(entries[0]![1]).toBe('0');
    vi.useRealTimers();
  });

  it('redakce zvládne verzovaný Discord endpoint i hodnotu z prostředí', () => {
    expect(redactSecrets('https://discord.com/api/v10/webhooks/123/SEKRET-TOKEN')).not.toContain(
      'SEKRET-TOKEN',
    );
    process.env.DISCORD_LEAD_WEBHOOK_URL = 'https://example.invalid/nestandardni/TAJEMSTVI123';
    expect(redactSecrets('selhalo: https://example.invalid/nestandardni/TAJEMSTVI123')).not.toContain(
      'TAJEMSTVI123',
    );
  });

  it('flood cap se sám zotaví, i když EXPIRE trvale selhává', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    // INCR funguje, EXPIRE ne — u statického klíče by čítač přerostl strop
    // a kanál by oněměl navždy. Časový klíč to nesmí dopustit.
    const brokenExpire = vi
      .spyOn(fakeRedis, 'expire')
      .mockRejectedValue(new Error('expire failed'));

    for (let i = 0; i < 61; i++) await notifyNewLead(LEAD);
    // Klíč musí mít v sobě číslo okna, ne být statický.
    expect([...fakeRedis.store.keys()][0]).toMatch(/^notify:lead:\d+$/);

    // Simulace posunu do dalšího okna: klíč se přejmenuje sám podle času.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(Date.now() + 3_600_000));
    fetchMock.mockClear();
    await notifyNewLead(LEAD);
    expect(fetchMock, 'nové okno musí zase pouštět notifikace').toHaveBeenCalledTimes(1);

    vi.useRealTimers();
    brokenExpire.mockRestore();
  });

  it('z logované chyby zmizí Discord webhook i Telegram token', () => {
    const msg =
      'fetch failed: https://discord.com/api/webhooks/123456/aBcDeF-gHiJkL and ' +
      'https://api.telegram.org/bot1234567:AAEsecrettoken/sendMessage';
    const out = redactSecrets(msg);
    expect(out).not.toContain('aBcDeF-gHiJkL');
    expect(out).not.toContain('AAEsecrettoken');
    expect(out).toContain('[redacted]');
  });

  it('přerostlý referer se ořízne, útočník neurčuje velikost notifikace', () => {
    const payload = buildDiscordPayload({ ...LEAD, sourceUrl: `https://e.cz/${'a'.repeat(5000)}` });
    const field = (payload.embeds as { fields: { name: string; value: string }[] }[])[0].fields.find(
      (f) => f.name === 'Stránka',
    );
    expect(field!.value.length).toBeLessThanOrEqual(200);
  });
});

describe('maskované odkazy — phishing přes userinfo a homoglyfy', () => {
  /** `victaagency.com` je jen USERINFO, skutečný host je `evil.tld`. */
  const PHISH = 'https://victaagency.com@evil.tld/faktura';

  it('Discord: odkaz s userinfo v popisu se nahradí skutečným cílem', () => {
    const payload = buildDiscordPayload({ ...LEAD, message: `Faktura ke schválení: ${PHISH}` });
    const desc = String((payload.embeds as { description: string }[])[0].description);
    // Escape markdownu tenhle tvar nezachytí (žádný metaznak), takže by URL
    // došla do kanálu byte po bytu a klient by ji sám proklikl.
    expect(desc, 'klikatelný phishing odešel do kanálu').not.toContain('victaagency.com@evil.tld');
    expect(desc).toContain('skutečný cíl evil.tld');
  });

  it('Discord: totéž v HODNOTÁCH POLÍ, nejen v popisu', () => {
    const payload = buildDiscordPayload({ ...LEAD, company: PHISH, name: `Jan ${PHISH}` });
    const joined = (payload.embeds as { fields: { value: string }[] }[])[0].fields
      .map((f) => f.value)
      .join('\n');
    expect(joined).not.toContain('victaagency.com@evil.tld');
    expect(joined).toContain('skutečný cíl evil.tld');
  });

  it('Telegram: nahradí se i v poli Stránka — `referer` posílá klient', () => {
    const text = buildTelegramText({ ...LEAD, sourceUrl: PHISH, message: PHISH });
    expect(text).not.toContain('victaagency.com@evil.tld');
    expect(text.match(/skutečný cíl evil\.tld/g) ?? [], 'obě pole musí být ošetřená').toHaveLength(
      2,
    );
  });

  it('unicode homoglyf v hostu se odhalí punycodem', () => {
    // Cyrilické „а" (U+0430) místo latinského „a" — text vypadá jako naše
    // doména, `URL` ho normalizuje na punycode (změřeno).
    const text = buildTelegramText({ ...LEAD, message: 'Podklady: https://victаagency.com/f' });
    expect(text).toContain('skutečný cíl xn--victagency-2qi.com');
  });

  it('desítkový zápis IP se přepíše na skutečnou adresu', () => {
    const text = buildTelegramText({ ...LEAD, message: 'http://3232235777/faktura' });
    expect(text).toContain('skutečný cíl 192.168.1.1');
  });

  it('legitimní odkaz zůstane nedotčený — notifikace se musí dál číst na jeden pohled', () => {
    const text = buildTelegramText({
      ...LEAD,
      sourceUrl: 'https://victaagency.com/cs/kontakt?utm_source=google',
      // Port i verzálky jsou běžné zápisy, které `URL` normalizuje — obrana je
      // nesmí prohlásit za maskovaný odkaz, jinak zmizí odkaz na web zájemce.
      message: 'Náš web: https://example.cz:443/portfolio a https://EXAMPLE.cz/x',
    });
    expect(text).toContain('https://victaagency.com/cs/kontakt?utm_source=google');
    expect(text).toContain('https://example.cz:443/portfolio');
    expect(text).toContain('https://EXAMPLE.cz/x');
    expect(text).not.toContain('maskovaný odkaz');
  });

  /**
   * Vstupy, na kterých `new URL` VYHODÍ (změřeno, Node 20.20.1). Všechny sednou
   * na `URL_TOKEN_RE`, takže se k `new URL` vůbec dostanou — a všechny projdou
   * `sanitizeFormString` beze změny (ta strhává jen `<…>` a řídicí znaky, `[`
   * ani `%` mezi nimi nejsou), takže doteče z pole „Zpráva" až sem. `sourceUrl`
   * je na tom hůř: syrová hlavička `referer` se nesanitizuje vůbec.
   */
  const UNPARSEABLE = [
    'https://[bad',
    'https://%zz.com/',
    'http://192.168.0.1:99999/',
    'https://[::1',
    'https://victaagency.com%40evil.tld/x',
  ];

  it.each(UNPARSEABLE)('neparsovatelný token %s projde beze změny, ne výjimkou', (raw) => {
    // Neparsovatelná URL není cíl, na který by šlo kliknout — nechat ji být je
    // záměr. Podstatné je, že se to NEDĚLÁ výjimkou: ta by cestou ven zmizela
    // v catch-allu `notifyNewLead` (viz oba testy níž).
    expect(defangDeceptiveUrls(`Faktura ${raw} díky`)).toBe(`Faktura ${raw} díky`);
  });

  it('neparsovatelná URL ve zprávě notifikaci neshodí — musí dorazit do OBOU kanálů', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    process.env.TELEGRAM_BOT_TOKEN = '123:ABC';
    process.env.TELEGRAM_CHAT_ID = '-1001234';

    // Bez pojistky vyhodí `defangDeceptiveUrls` už při sestavování payloadu,
    // catch-all v `notifyNewLead` výjimku spolkne a PLATNÝ lead zmizí beze stopy
    // z obou kanálů — v logu zůstane jen „neočekávaná chyba (potlačeno)".
    const delivered = await notifyNewLead({ ...LEAD, message: 'Faktura https://[bad' });

    expect(delivered, 'notifikace tiše zmizela z obou kanálů').toBe(2);
    expect(String(bodies()[1].text)).toContain('https://[bad');
  });

  it('neparsovatelná URL v `referer` notifikaci neshodí — hlavička nemá žádnou sanitizaci', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:ABC';
    process.env.TELEGRAM_CHAT_ID = '-1001234';

    // Druhá vstupní cesta: `sourceUrl` jde přes `leadLines`, ne přes větev
    // `n.message` — tu první test neprojde.
    const delivered = await notifyNewLead({ ...LEAD, sourceUrl: 'https://%zz.com/x' });

    expect(delivered, 'notifikace tiše zmizela').toBe(1);
    expect(String(bodies()[0].text)).toContain('https://%zz.com/x');
  });

  it('náhrada nepřeroste strop pole Stránka', () => {
    // Náhrada je delší než krátký token, takže ořez musí běžet až po ní.
    const payload = buildDiscordPayload({
      ...LEAD,
      sourceUrl: `${'https://a@b.cz '.repeat(13)}`.slice(0, 200),
    });
    const field = (payload.embeds as { fields: { name: string; value: string }[] }[])[0].fields.find(
      (f) => f.name === 'Stránka',
    );
    expect(field!.value.length).toBeLessThanOrEqual(200);
  });
});

/**
 * Pět pojistek, které v produkčním kódu FUNGUJÍ, ale nedržel je žádný test —
 * mutace je odstranila a všech 317 testů dál prošlo. Odhalila je až mutační
 * dávka ve 4. kole gate (90 mutací, 65 zabitých). Kód se kvůli nim neměnil,
 * mění se jen to, že jsou nově pojištěné.
 */
describe('pojistky bez testu (4. kolo gate)', () => {
  it('mezera v telegramských proměnných neposílá zmrzačenou URL ani chat_id', async () => {
    // `vercel env add` umí vložit hodnotu s mezerou — a `new URL` mezeru
    // NEZAHODÍ (na rozdíl od `\n`), takže požadavek skutečně odejde na síť,
    // Telegram vrátí 404 a notifikace tiše zmizí u KAŽDÉHO leadu. Discordí
    // dvojče `?.trim()` test mělo, tohle ne — přitom je horší.
    process.env.TELEGRAM_BOT_TOKEN = ' 123456789:AAH-xyz ';
    process.env.TELEGRAM_CHAT_ID = ' -1001234 ';

    await notifyNewLead(LEAD);

    expect(urls()[0]).toBe('https://api.telegram.org/bot123456789:AAH-xyz/sendMessage');
    expect(bodies()[0]!.chat_id).toBe('-1001234');
  });

  it('nevyhodí, ani když sestavení payloadu selže', async () => {
    // Nejvíc dokumentovaná invarianta modulu (3× v komentářích, a obě volací
    // místa na ni spoléhají — `after(() => notifyNewLead(...))` bez `.catch()`).
    // Bez ní by z toho byl unhandled rejection u požadavku, kterému už dávno
    // odešla odpověď 200.
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    const boom = {
      kind: 'contact',
      get email(): string {
        throw new Error('boom');
      },
    };
    await expect(notifyNewLead(boom as never)).resolves.toBe(0);
  });

  it('z logu selhaného kanálu zmizí webhook token', async () => {
    // Jediná zábrana mezi chybou z `fetch` a tajemstvím ve Vercel logu.
    // Reálná hláška: `Failed to parse URL from <celá URL i s tokenem>`.
    process.env.DISCORD_LEAD_WEBHOOK_URL = 'discord.com/api/webhooks/1234567890/SUPER-SECRET';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockRejectedValue(
      new TypeError('Failed to parse URL from discord.com/api/webhooks/1234567890/SUPER-SECRET'),
    );

    await notifyNewLead(LEAD);

    expect(JSON.stringify(warn.mock.calls)).not.toContain('SUPER-SECRET');
  });

  it('redakce funguje i pro odsazenou hodnotu z prostředí', () => {
    // Vrstva „chytne tajemství v JAKÉMKOLI obalu" stojí na porovnání se
    // skutečnou hodnotou z env. Bez `.trim()` u odsazené hodnoty tiše přestane
    // fungovat — a tvarové vzory netvarovou URL nechytnou.
    process.env.DISCORD_LEAD_WEBHOOK_URL = '  https://relay.example/hook/AbCdEf123456  ';
    expect(redactSecrets('selhalo: https://relay.example/hook/AbCdEf123456')).toBe(
      'selhalo: [redacted]',
    );
  });

  it('branka obrany chytne verzálky ve schématu i znak hned za URL', () => {
    // `URL_TOKEN_RE` je vstup do celé obrany proti maskovaným odkazům. Pět
    // stávajících testů ověřovalo jen chování callbacku, ne to, co ho spouští:
    // bez `i` projde `HTTPS://`, se širší třídou pohltí token i `<b>` a
    // `new URL` pak vyhodí → maskovaný odkaz projde nezměněný.
    expect(defangDeceptiveUrls('HTTPS://victaagency.com@evil.tld/faktura')).toContain(
      'skutečný cíl evil.tld',
    );
    expect(defangDeceptiveUrls('text https://a@b.cz<b>konec')).toContain('skutečný cíl b.cz');
    expect(defangDeceptiveUrls('"https://a@b.cz"')).toContain('skutečný cíl b.cz');
  });
});

describe('pojistky bez testu (5. kolo gate)', () => {
  it('legitimní odkaz v českých uvozovkách se NESMÍ označit za maskovaný', () => {
    // Blokující nález 5. kola: uvozovka se nacucla do tokenu, WHATWG ji
    // zaIDNAtil do hostu → `firma.xn--cz-x2t` ≠ `firma.cz` → poctivý zájemce
    // dostal obvinění z phishingu a zakladatel přišel o odkaz.
    const out = defangDeceptiveUrls('Náš web je „https://firma.cz“ — mrkněte');
    expect(out).toContain('https://firma.cz');
    expect(out).not.toContain('maskovaný odkaz');
    expect(defangDeceptiveUrls('Web: https://firma.cz.')).toContain('https://firma.cz');
    expect(defangDeceptiveUrls('(https://firma.cz)')).not.toContain('maskovaný odkaz');
  });

  it('odříznutí ocasu nesmí vyrobit falešně negativní výsledek', () => {
    // Útok s tímtéž ocasem musí být pořád odhalen — a ocas se vrátí do textu.
    const out = defangDeceptiveUrls('„https://victaagency.com@evil.tld/faktura“');
    expect(out).toContain('skutečný cíl evil.tld');
    expect(out).toContain('“');
  });

  it('surrogate guard chytá i horní konec rozsahu high surrogate', () => {
    // Mez 0xdbff: rozšíření na 0xdfff mutaci přežilo, protože emoji testy
    // trefovaly jen spodní část rozsahu.
    const out = truncate('😀'.repeat(400), 601);
    expect(out.length).toBeLessThanOrEqual(601);
    expect(Buffer.from(out, 'utf8').toString('utf8')).toBe(out);
  });

  it('authority končí i na ? a #, nejen na lomítku', () => {
    expect(defangDeceptiveUrls('https://victaagency.com?utm_source=google')).not.toContain(
      'maskovaný odkaz',
    );
    expect(defangDeceptiveUrls('https://firma.cz#kontakt')).not.toContain('maskovaný odkaz');
  });

  it('náhrada odkazu ve zprávě nesmí přerůst náhledový strop', () => {
    // Defang musí běžet PŘED ořezem: prohození pořadí mutaci přežilo a
    // 600znaková zpráva narostla na 1560 znaků.
    const many = Array.from({ length: 40 }, () => 'https://a.com@evil.tld/x').join(' ');
    const payload = buildDiscordPayload({ ...LEAD, message: many });
    const desc = String((payload.embeds as { description: string }[])[0].description);
    expect(desc.length).toBeLessThanOrEqual(600);
    const tg = buildTelegramText({ ...LEAD, message: many });
    expect(tg.length).toBeLessThanOrEqual(4000);
  });

  it('poloviční telegramská konfigurace nespotřebuje ani Redis round-trip', async () => {
    // `anyConfigured` musí u Telegramu vyžadovat OBOJE. Se záměnou na OR by
    // se na každém odeslání formuláře pálil INCR do Redisu zbytečně.
    process.env.TELEGRAM_BOT_TOKEN = '123:ABC';
    await notifyNewLead(LEAD);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeRedis.store.size, 'branka pustila volání do Redisu').toBe(0);
  });

  it('redakce zvládne DVA výskyty tajemství v jedné hlášce', () => {
    // `split`/`join`; se záměnou za `replace(secret, …)` uteče druhý výskyt.
    process.env.DISCORD_LEAD_WEBHOOK_URL = 'https://relay.example/hook/TAJNE123456';
    const out = redactSecrets(
      'pokus 1: https://relay.example/hook/TAJNE123456, pokus 2: https://relay.example/hook/TAJNE123456',
    );
    expect(out).not.toContain('TAJNE123456');
  });

  it('escape neutralizuje i samotné zpětné lomítko', () => {
    // Přímo na funkci, ne přes payload: přes payload byl výsledek `\\[` vs
    // `\\\[` a obojí sedělo na `startsWith('\\')` — prázdná assertion.
    expect(escapeDiscordMarkdown('\\')).toBe('\\\\');
    expect(escapeDiscordMarkdown('\\[x](y)')).toBe('\\\\\\[x\\]\\(y\\)');
  });

  it('Telegram nemá stahovat náhledy útočníkových URL', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:ABC';
    process.env.TELEGRAM_CHAT_ID = '-100';
    await notifyNewLead(LEAD);
    expect(bodies()[0]!.disable_web_page_preview).toBe(true);
  });

  it('minimal režim drží i samotné pole Stránka', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    process.env.LEAD_NOTIFY_PII = 'minimal';
    await notifyNewLead({ ...LEAD, sourceUrl: 'https://victaagency.com/x?utmsource=tajnehodnota' });
    // POZOR na escapovaný tvar: `utm_source` by se do payloadu dostalo jako
    // `utm\_source` a `toContain('utm_source')` by neseděla ani s vypnutou
    // ochranou — prázdná assertion. Proto hodnota bez metaznaků.
    expect(JSON.stringify(bodies()[0])).not.toContain('tajnehodnota');
  });
});

describe('LEAD_NOTIFY_PII=minimal', () => {
  it('vyhodí e-mail, telefon i text zprávy z payloadu', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    process.env.LEAD_NOTIFY_PII = 'minimal';

    await notifyNewLead(LEAD);

    const sent = JSON.stringify(bodies()[0]);
    expect(sent).not.toContain('jan@acme.cz');
    expect(sent).not.toContain('+420123456789');
    expect(sent).not.toContain('AI asistenta');
    // Kvalifikační údaje pro posouzení leadu zůstávají.
    expect(sent).toContain('ACME');
    expect(sent).toContain('100 000');
  });

  it('výchozí režim (bez proměnné) posílá plné kontakty', async () => {
    process.env.DISCORD_LEAD_WEBHOOK_URL = DISCORD_URL;
    await notifyNewLead(LEAD);
    expect(JSON.stringify(bodies()[0])).toContain('jan@acme.cz');
  });
});
