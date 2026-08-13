import * as Sentry from '@sentry/nextjs';
import { isSecretBearingUrl } from '@/lib/redact-secrets';
import { redactBreadcrumb, redactSpan, scrubEvent } from '@/lib/sentry-redaction';

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

    // Těla hooků žijí v `@/lib/sentry-redaction` — jako čisté funkce jdou
    // testovat, zavřená uvnitř `Sentry.init` by nešla (viz komentář tam).
    beforeBreadcrumb: redactBreadcrumb,
    beforeSendSpan: redactSpan,
    beforeSend: scrubEvent,
  });
}
