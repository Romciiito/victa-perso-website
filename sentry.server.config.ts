import * as Sentry from '@sentry/nextjs';
import { redactSecrets, isSecretBearingUrl } from '@/lib/redact-secrets';

const dsn = process.env.SENTRY_DSN;

if (dsn && !dsn.startsWith('https://your-')) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,

    /**
     * Odchozí volání na Discord/Telegram se do Sentry nesmí dostat vůbec
     * (nález B1 review gate, 2026-08-13). Node SDK má
     * `nativeNodeFetchIntegration` mezi VÝCHOZÍMI integracemi a ta ke každému
     * `fetch` přidává breadcrumb s URL — a `getSanitizedUrlString` odstraní
     * jen query a userinfo, cestu vrátí doslova. U Discordu je ale tajemství
     * přímo v cestě (`/api/webhooks/{id}/{token}`), u Telegramu taky
     * (`/bot{token}/…`). Bez tohohle by se při každém selhání notifikace —
     * a u 10 % úspěšných díky `tracesSampleRate` — poslal webhook token
     * třetí straně a zůstal tam trvale uložený.
     */
    integrations: (defaults) => [
      ...defaults,
      Sentry.nativeNodeFetchIntegration({
        ignoreOutgoingRequests: isSecretBearingUrl,
      }),
    ],

    /**
     * Záchranná síť pod integrací výše: kdyby se tajemství dostalo do drobku
     * jinou cestou (jiná integrace, jiná verze SDK, ruční `addBreadcrumb`),
     * projde ještě redakcí. Levnější než spoléhat na jeden mechanismus.
     */
    beforeBreadcrumb(breadcrumb) {
      if (typeof breadcrumb.message === 'string') {
        breadcrumb.message = redactSecrets(breadcrumb.message);
      }
      const url = breadcrumb.data?.url;
      if (typeof url === 'string') {
        if (isSecretBearingUrl(url)) return null;
        breadcrumb.data = { ...breadcrumb.data, url: redactSecrets(url) };
      }
      return breadcrumb;
    },

    /**
     * Redakce VŠECH míst, kam undici instrumentace URL ukládá — nejen
     * `url.full`, ale i `url.path` (u Discordu je celé tajemství právě
     * v cestě) a `description`, kterou si Sentry z URL staví. Neúplná
     * záchranná síť by měla díru přesně tam, kde je nejvíc potřeba
     * (nález N-3, 2. kolo review gate).
     */
    beforeSendSpan(span) {
      const data = { ...span.data };
      for (const k of ['url.full', 'url.path', 'http.url', 'http.target']) {
        if (typeof data[k] === 'string') data[k] = redactSecrets(data[k]);
      }
      span.data = data;
      if (typeof span.description === 'string') {
        span.description = redactSecrets(span.description);
      }
      return span;
    },

    beforeSend(event) {
      // Server-side PII scrub: never log form bodies (REQ-NF-046, claude-rules §13).
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
    },
  });
}
