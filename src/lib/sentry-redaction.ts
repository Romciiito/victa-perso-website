import type * as SentryTypes from '@sentry/nextjs';
import { redactSecrets, isSecretBearingUrl } from './redact-secrets';

/**
 * Hooky, které `sentry.server.config.ts` předává do `Sentry.init` — vytažené
 * sem jako čisté funkce.
 *
 * Proč mimo konfigurák: `sentry.server.config.ts` jde jen SPUSTIT. Jeho
 * vyhodnocení zavolá `Sentry.init` a hooky zůstanou zavřené uvnitř SDK, takže
 * na ně testovací suita nedosáhne — obrana proti úniku webhook tokenů do
 * Sentry byla neověřitelná (výhrada 1 review gate, 2026-08-13). Tady jsou to
 * obyčejné exportované funkce, které jde volat s ručně sestaveným drobkem,
 * spanem a eventem.
 *
 * Modul je záměrně bez `import 'server-only'` — stejně jako `redact-secrets.ts`
 * ho musí umět načíst `sentry.server.config.ts`, který leží mimo `src/`, a je
 * to čistá práce s daty bez přístupu k prostředkům.
 */

/**
 * Typy se odvozují ze signatur `Sentry.init`, ne z pojmenovaných exportů —
 * `SpanJSON` @sentry/nextjs vůbec nereexportuje (změřeno tsc) a odvození navíc
 * pohlídá, že funkce níž půjdou do `Sentry.init` dosadit i po upgradu SDK.
 */
type InitOptions = NonNullable<Parameters<typeof SentryTypes.init>[0]>;
export type SentryBreadcrumb = Parameters<NonNullable<InitOptions['beforeBreadcrumb']>>[0];
export type SentrySpanJson = Parameters<NonNullable<InitOptions['beforeSendSpan']>>[0];
export type SentryErrorEvent = Parameters<NonNullable<InitOptions['beforeSend']>>[0];

/**
 * Atributy spanu, do kterých se URL odchozího volání skutečně dostane.
 *
 * ZMĚŘENO na @sentry/node@10.53.1, ne odvozeno z dokumentace: probe s reálným
 * `http.get` na `…/api/webhooks/1234567890/SUPER-SECRET-TOKEN` vrátil do
 * `beforeSendSpan` span, který nesl tajemství v PĚTI atributech současně —
 * `url.full`, `url.path`, `http.url`, `http.target` a `url`.
 *
 * Kdo je nastavuje:
 *  - `url.full` / `url.path` — vendorovaná undici instrumentace (cesta přes
 *    `fetch`, což je cesta lead notifikací) i `getHttpSpanDetailsFromUrlObject`
 *    u node:http klienta;
 *  - `http.url` / `http.target` — `getOutgoingRequestSpanData`
 *    (@sentry/core/integrations/http/get-outgoing-span-data.js) u KAŽDÉHO
 *    odchozího node:http/https požadavku. Review gate je označila za mrtvé
 *    klíče, protože hledala jen ve vendorované undici instrumentaci; probe
 *    obojí našel na skutečném spanu, takže v seznamu zůstávají.
 *  - `url` — dopisuje @sentry/opentelemetry při převodu spanu na JSON
 *    (`data.url = getSanitizedUrlString(url)`, `resource-*.js`). Ten sice
 *    odstraní query a userinfo, ale CESTU vrátí doslova, takže Discord token
 *    projde celý. V seznamu dřív CHYBĚL — jediná měřená díra v této síti.
 */
export const SPAN_URL_ATTRIBUTES = [
  'url',
  'url.full',
  'url.path',
  'http.url',
  'http.target',
] as const;

/**
 * Záchranná síť pod `ignoreOutgoingRequests`: kdyby se tajemství dostalo do
 * drobku jinou cestou (jiná integrace, jiná verze SDK, ruční `addBreadcrumb`),
 * projde ještě redakcí. Levnější než spoléhat na jeden mechanismus.
 *
 * Drobek s URL na Discord/Telegram se zahazuje CELÝ — u něj nemá smysl řešit,
 * co dalšího by v něm mohlo být, protože sám o sobě nenese nic, co by za to
 * riziko stálo.
 */
export function redactBreadcrumb(breadcrumb: SentryBreadcrumb): SentryBreadcrumb | null {
  if (typeof breadcrumb.message === 'string') {
    breadcrumb.message = redactSecrets(breadcrumb.message);
  }
  const url = breadcrumb.data?.url;
  if (typeof url === 'string') {
    if (isSecretBearingUrl(url)) return null;
    breadcrumb.data = { ...breadcrumb.data, url: redactSecrets(url) };
  }
  return breadcrumb;
}

/**
 * Redakce VŠECH míst na spanu, kam se URL ukládá (viz `SPAN_URL_ATTRIBUTES`),
 * plus `description`, kterou si Sentry z URL staví. Neúplná záchranná síť by
 * měla díru přesně tam, kde je nejvíc potřeba (nález N-3, 2. kolo review gate).
 */
export function redactSpan(span: SentrySpanJson): SentrySpanJson {
  const data = { ...span.data };
  for (const k of SPAN_URL_ATTRIBUTES) {
    if (typeof data[k] === 'string') data[k] = redactSecrets(data[k]);
  }
  span.data = data;
  if (typeof span.description === 'string') {
    span.description = redactSecrets(span.description);
  }
  return span;
}

/**
 * Serverový PII scrub: tělo formuláře se do Sentry nesmí dostat nikdy
 * (REQ-NF-046, claude-rules §13).
 */
export function scrubEvent(event: SentryErrorEvent): SentryErrorEvent {
  if (event.user) delete event.user;
  if (event.request?.cookies) delete event.request.cookies;
  if (event.request?.data) {
    event.request.data = '[REDACTED]';
  }
  if (event.request?.headers) {
    delete event.request.headers['cookie'];
    delete event.request.headers['authorization'];
  }
  // Poslední síť — tajemství může nést zpráva eventu i text výjimky
  // (`TypeError: Failed to parse URL from https://discord.com/api/…`).
  if (typeof event.message === 'string') {
    event.message = redactSecrets(event.message);
  }
  for (const ex of event.exception?.values ?? []) {
    if (typeof ex.value === 'string') ex.value = redactSecrets(ex.value);
  }
  return event;
}
