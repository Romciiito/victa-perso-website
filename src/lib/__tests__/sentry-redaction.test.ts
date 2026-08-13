import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  redactBreadcrumb,
  redactSpan,
  scrubEvent,
  type SentryBreadcrumb,
  type SentrySpanJson,
  type SentryErrorEvent,
} from '../sentry-redaction';
import { isSecretBearingUrl } from '../redact-secrets';

/**
 * Testy obrany proti úniku webhook tokenů do Sentry.
 *
 * Proč existují: dokud hooky žily uvnitř `Sentry.init` v `sentry.server.config.ts`,
 * nešlo je zavolat — celá obrana byla netestovatelná (výhrada 1 review gate).
 *
 * Každý test je psaný tak, aby SPADL, když se příslušná pojistka odstraní
 * (ověřeno mutačně, viz zápis v předávce). Test, který mutaci přežije,
 * pojistku neověřuje.
 */

/** Tvar Discord webhooku: tajemství je přímo v cestě, ne v query. */
const DISCORD_URL = 'https://discord.com/api/webhooks/1234567890/aBcDeF-gHiJkL_MNO';
/** Holá cesta — přesně to, co Sentry ukládá do `url.path` / `http.target`. */
const DISCORD_PATH = '/api/webhooks/1234567890/aBcDeF-gHiJkL_MNO';
const DISCORD_TOKEN = 'aBcDeF-gHiJkL_MNO';
const TELEGRAM_URL = 'https://api.telegram.org/bot123456789:AA-SECRET-TOKEN/sendMessage';
/** Historická doména Discordu — týž endpoint, jiný zápis hostu. */
const DISCORDAPP_URL = 'https://discordapp.com/api/webhooks/1234567890/aBcDeF-gHiJkL_MNO';

/** Minimální span v tom tvaru, v jakém ho `beforeSendSpan` dostává. */
function span(data: Record<string, unknown>, description?: string): SentrySpanJson {
  return {
    span_id: 'abc123',
    trace_id: 'def456',
    start_timestamp: 0,
    data,
    ...(description === undefined ? {} : { description }),
  } as unknown as SentrySpanJson;
}

/**
 * Minimální event. `ErrorEvent` má povinné `type: undefined` (rozlišovač proti
 * transakčnímu eventu), který by se v každém testu musel opisovat.
 */
function event(fields: Record<string, unknown>): SentryErrorEvent {
  return fields as unknown as SentryErrorEvent;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

/**
 * `isSecretBearingUrl` má v obraně dvě role: rozhoduje, které odchozí volání
 * Sentry vůbec nezaznamená (`ignoreOutgoingRequests`), a které drobky se
 * zahodí celé. Tvarová redakce je až druhá vrstva pod ní.
 */
describe('isSecretBearingUrl', () => {
  it('sepne na obou podobách domény Discordu', () => {
    // Vzor `discord(?:app)?\.com` pokrývá i historický `discordapp.com`.
    // Bez té alternativy vrací funkce na `discordapp.com` FALSE (změřeno),
    // takže se volání normálně trasuje a drobek se místo zahození uloží —
    // první vrstva obrany na tom hostu prostě neexistuje.
    expect(isSecretBearingUrl(DISCORD_URL)).toBe(true);
    expect(isSecretBearingUrl(DISCORDAPP_URL)).toBe(true);
  });

  it('sepne na Telegram API', () => {
    expect(isSecretBearingUrl(TELEGRAM_URL)).toBe(true);
  });

  it('nesepne na běžné odchozí volání', () => {
    // Přestřelená podmínka by z Sentry vyřadila trasování ARES/RPO i Resendu,
    // což jsou volání, kvůli kterým se do Sentry vůbec kouká.
    expect(isSecretBearingUrl('https://ares.gov.cz/ekonomicke-subjekty/12345678')).toBe(false);
    expect(isSecretBearingUrl('https://api.resend.com/emails')).toBe(false);
  });
});

describe('redactBreadcrumb', () => {
  it('zahodí celý drobek s Discord webhook URL', () => {
    const out = redactBreadcrumb({
      category: 'http',
      data: { url: DISCORD_URL, status_code: 500 },
    } as SentryBreadcrumb);
    expect(out).toBeNull();
  });

  it('zahodí celý drobek i na historické doméně discordapp.com', () => {
    const out = redactBreadcrumb({
      category: 'http',
      data: { url: DISCORDAPP_URL, status_code: 500 },
    } as SentryBreadcrumb);
    expect(out).toBeNull();
  });

  it('zahodí celý drobek s Telegram URL', () => {
    const out = redactBreadcrumb({
      category: 'http',
      data: { url: TELEGRAM_URL, status_code: 400 },
    } as SentryBreadcrumb);
    expect(out).toBeNull();
  });

  it('drobek na jiný host projde, ale URL se redaguje (tvarový vzor)', () => {
    // Cizí proxy s telegramským tokenem v cestě: `isSecretBearingUrl` nesepne
    // (není to api.telegram.org), takže drobek musí projít — a přesto se
    // token nesmí odeslat.
    const out = redactBreadcrumb({
      category: 'http',
      data: { url: 'https://relay.example.com/bot123456789:AA-SECRET-TOKEN/send', status_code: 200 },
    } as SentryBreadcrumb);
    expect(out).not.toBeNull();
    expect(out!.data!.url).toBe('https://relay.example.com/bot[redacted]/send');
    // Ostatní pole drobku zůstávají — redakce nesmí být záminka k jejich ztrátě.
    expect(out!.data!.status_code).toBe(200);
  });

  it('drobek na jiný host projde, ale doslovná hodnota z prostředí se redaguje', () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'NESTANDARDNI-HODNOTA-XYZ');
    const out = redactBreadcrumb({
      category: 'http',
      data: { url: 'https://relay.example.com/x/NESTANDARDNI-HODNOTA-XYZ' },
    } as SentryBreadcrumb);
    expect(out).not.toBeNull();
    expect(out!.data!.url).toBe('https://relay.example.com/x/[redacted]');
  });

  it('krátkou hodnotu z prostředí za jehlu NEPOVAŽUJE', () => {
    // Doslovná redakce porovnává celou hodnotu proměnné, takže krátká výplň
    // (`none`, `test`, `TODO` — tím se v lokálním .env nebo v preview umlčí
    // kontrola konfigurace) by se stala jehlou pro `split`/`join` a smazala
    // KAŽDÝ svůj výskyt v běžném textu. Z hlášky v Sentry by zbyla mozaika a
    // diagnostika, kvůli které se tam kouká, by přestala fungovat.
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'none');
    const out = redactBreadcrumb({
      category: 'console',
      message: 'lead-notify: none of the channels responded',
    } as SentryBreadcrumb);
    expect(out!.message).toBe('lead-notify: none of the channels responded');
  });

  it('hodnotu dost dlouhou na to, aby byla tajemstvím, redaguje i tak', () => {
    // Druhá strana téhož prahu: osm znaků už není náhodná výplň a redigovat se
    // musí, i když nemá tvar žádného známého webhooku.
    vi.stubEnv('DISCORD_LEAD_WEBHOOK_URL', 'S3KRET-X');
    const out = redactBreadcrumb({
      category: 'console',
      message: 'lead-notify: discord selhalo pro S3KRET-X',
    } as SentryBreadcrumb);
    expect(out!.message).toBe('lead-notify: discord selhalo pro [redacted]');
  });

  it('redaguje text zprávy drobku', () => {
    const out = redactBreadcrumb({
      category: 'console',
      level: 'warning',
      message: `[lead-notify] discord selhalo: fetch failed ${DISCORD_URL}`,
    } as SentryBreadcrumb);
    expect(out).not.toBeNull();
    expect(out!.message).not.toContain(DISCORD_TOKEN);
    expect(out!.message).toContain('[redacted]');
  });

  it('drobek bez `data` projde beze změny', () => {
    const out = redactBreadcrumb({ category: 'navigation' } as SentryBreadcrumb);
    expect(out).not.toBeNull();
    expect(out!.category).toBe('navigation');
  });
});

describe('redactSpan', () => {
  it('redaguje `url.full`', () => {
    const out = redactSpan(span({ 'url.full': `${DISCORD_URL}?wait=true` }));
    expect(out.data['url.full']).not.toContain(DISCORD_TOKEN);
    expect(out.data['url.full']).toContain('[redacted]');
  });

  it('redaguje `url.path` (u Discordu je celé tajemství právě v cestě)', () => {
    const out = redactSpan(span({ 'url.path': DISCORD_PATH }));
    expect(out.data['url.path']).not.toContain(DISCORD_TOKEN);
    expect(out.data['url.path']).toBe('/api/webhooks/[redacted]');
  });

  it('redaguje `http.url` (nastavuje ho node:http klient, ne undici)', () => {
    const out = redactSpan(span({ 'http.url': DISCORD_URL }));
    expect(out.data['http.url']).not.toContain(DISCORD_TOKEN);
    expect(out.data['http.url']).toContain('[redacted]');
  });

  it('redaguje `http.target` (cesta + query odchozího node:http požadavku)', () => {
    const out = redactSpan(span({ 'http.target': `${DISCORD_PATH}?wait=true` }));
    expect(out.data['http.target']).not.toContain(DISCORD_TOKEN);
    expect(out.data['http.target']).toBe('/api/webhooks/[redacted]?wait=true');
  });

  it('redaguje `url` — atribut, který span dostává až při převodu na JSON', () => {
    const out = redactSpan(span({ url: DISCORD_URL }));
    expect(out.data.url).not.toContain(DISCORD_TOKEN);
    expect(out.data.url).toContain('[redacted]');
  });

  it('redaguje `description` spanu', () => {
    const out = redactSpan(span({}, `GET ${DISCORD_PATH}`));
    expect(out.description).not.toContain(DISCORD_TOKEN);
    expect(out.description).toBe('GET /api/webhooks/[redacted]');
  });

  it('nechá nedotčené atributy, které URL nenesou', () => {
    const out = redactSpan(span({ 'http.method': 'POST', 'http.response.status_code': 204 }));
    expect(out.data['http.method']).toBe('POST');
    expect(out.data['http.response.status_code']).toBe(204);
  });

  it('zvládne span bez `description` i bez URL atributů', () => {
    const out = redactSpan(span({ 'sentry.op': 'db' }));
    expect(out.data['sentry.op']).toBe('db');
    expect(out.description).toBeUndefined();
  });
});

describe('scrubEvent', () => {
  it('zahodí `user` (PII)', () => {
    const out = scrubEvent(event({ user: { email: 'lead@example.com', ip_address: '1.2.3.4' } }));
    expect(out.user).toBeUndefined();
  });

  it('zahodí cookies z requestu', () => {
    const out = scrubEvent(event({ request: { cookies: { session: 'abc' } } }));
    expect(out.request!.cookies).toBeUndefined();
  });

  it('nahradí tělo requestu značkou místo jeho odeslání', () => {
    const out = scrubEvent(
      event({ request: { data: { email: 'lead@example.com', message: 'text z formuláře' } } }),
    );
    expect(out.request!.data).toBe('[REDACTED]');
  });

  it('zahodí hlavičky `cookie` a `authorization`, ostatní nechá', () => {
    const out = scrubEvent(
      event({
        request: {
          headers: {
            cookie: 'session=abc',
            authorization: 'Bearer secret-token',
            'content-type': 'application/json',
          },
        },
      }),
    );
    expect(out.request!.headers!['cookie']).toBeUndefined();
    expect(out.request!.headers!['authorization']).toBeUndefined();
    expect(out.request!.headers!['content-type']).toBe('application/json');
  });

  it('redaguje `message` eventu', () => {
    const out = scrubEvent(event({ message: `lead-notify: POST ${DISCORD_URL} failed` }));
    expect(out.message).not.toContain(DISCORD_TOKEN);
    expect(out.message).toContain('[redacted]');
  });

  it('redaguje text KAŽDÉ výjimky v eventu', () => {
    const out = scrubEvent(
      event({
        exception: {
          values: [
            { type: 'TypeError', value: `Failed to parse URL from ${DISCORD_URL}` },
            { type: 'Error', value: `fetch failed: ${TELEGRAM_URL}` },
          ],
        },
      }),
    );
    expect(out.exception!.values![0].value).not.toContain(DISCORD_TOKEN);
    expect(out.exception!.values![0].value).toContain('[redacted]');
    expect(out.exception!.values![1].value).not.toContain('AA-SECRET-TOKEN');
    expect(out.exception!.values![1].value).toContain('bot[redacted]');
  });

  it('zvládne event bez `request` i bez `exception`', () => {
    const out = scrubEvent(event({ level: 'error' }));
    expect(out.level).toBe('error');
  });
});
