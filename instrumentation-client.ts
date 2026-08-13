import { initBotId } from 'botid/client/core';

/**
 * Vercel BotID client-side init (Vlna 7 — docs/security/abuse-surface.md).
 * Next.js 15.3+ convention: this file (at the project root, alongside
 * `instrumentation.ts`) is auto-loaded before the app boots — no manual
 * import anywhere else is needed.
 *
 * DORMANT by default (code-review finding C1) — `initBotId()` patches
 * `window.fetch` globally and its challenge-script loader has no error
 * handling of its own; if that script fails to load for ANY reason
 * (ad-blocker heuristic, `api.vercel.com` degraded, a corporate proxy, the
 * BotID rewrite not applying) a protected `fetch()` call REJECTS instead of
 * completing, which on `/api/contact`/`/api/newsletter` means a silently
 * lost lead — with no kill switch short of a code deploy. This has never
 * been exercised against a real browser session (docs/security/abuse-surface.md
 * §5.4 states that gap explicitly). Gating the call itself behind this flag
 * — not just the server-side `checkBotId()` calls — means when the flag is
 * off, `initBotId()` never runs and `window.fetch` is never patched: the
 * forms behave EXACTLY as they did before this wave, zero added risk. Same
 * "ship inert, flip a flag after verification" pattern D-019 uses for the
 * chatbot (`NEXT_PUBLIC_CHATBOT_ENABLED`).
 *
 * `protect` MUST list every route `checkBotId()` is called from server-side
 * (`/api/contact`, `/api/newsletter`) — BotID's own docs are explicit that a
 * route missing from this list makes `checkBotId()` fail server-side. Keep
 * this array and the `checkBotId()` call sites in
 * `src/app/api/{contact,newsletter}/route.ts` in lockstep.
 *
 * Basic-tier only (free on every Vercel plan) — Deep Analysis (paid,
 * $1/1000 calls on Pro) is NOT enabled; that would require an explicit
 * dashboard toggle (Vercel Firewall → Rules → "Vercel BotID Deep Analysis")
 * this wave deliberately does not flip. See docs/security/abuse-surface.md
 * for the cost rationale and the manual step if Roman later wants it.
 */
if (process.env.NEXT_PUBLIC_BOTID_ENABLED === '1') {
  initBotId({
    protect: [
      { path: '/api/contact', method: 'POST' },
      { path: '/api/newsletter', method: 'POST' },
    ],
  });
}
