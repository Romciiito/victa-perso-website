# VICTA

Marketing website for VICTA — Czech/Slovak full-service digital agency targeting medium businesses. Includes AI chatbot, paid audit booking, contact form, newsletter. Next.js 15 App Router on Vercel.

**Stack:** nextjs-fullstack

---

## Behavioral Rules (mandatory every session)

1. **Workplan tracking** — Update `workplan.md` checkboxes immediately when any task completes. When all items in a phase are done, add ✅ to the phase header and the summary table. Never defer tracking to a later session.
2. **Security is non-negotiable** — Security items in workplan Phase 0 must be completed before Phase 1 begins. Never defer or skip them.
3. **Read before acting** — Before starting any task, read the relevant doc in `docs/claude/` listed in the pointer table below. Do not rely on memory.
4. **No secrets in code** — Credentials and keys live only in `.env` (gitignored). Never hard-code them, never commit them.
5. **Prefer editing over creating** — Always edit an existing file rather than creating a new one when possible.

---

## Pointer Table

| Doc | Read when you're about to... |
|-----|------------------------------|
| `docs/claude/architecture.md` | Understand the system, add a component, trace a data flow |
| `docs/claude/development.md` | Run locally, write a test, add a route/model/page, deploy |
| `docs/claude/design-decisions.md` | Question why something is built a certain way, propose alternatives |
| `docs/claude/env-vars.md` | Add a new config value, debug a missing env var, set up a new environment |

---

## Critical Gotchas

- All env vars use the `VICTA_` prefix — never use bare names.
- Check `docs/claude/development.md` for exact run commands before assuming defaults.
- See `docs/claude/design-decisions.md` before proposing a stack or architecture change.


---

## Project-Specific Rules

- **AI calls**: Never import `@anthropic-ai/sdk` directly — all chatbot inference MUST go through the Vercel AI SDK + Vercel AI Gateway using `process.env.AI_MODEL` (AR-01, security-model.md Rule 2); direct Anthropic SDK calls bypass spend controls and model abstraction.
- **API key exposure**: Every server-only secret (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY_*`, `UPSTASH_REDIS_REST_TOKEN`, `CALCOM_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`) must NEVER carry the `NEXT_PUBLIC_` prefix — grep for `NEXT_PUBLIC_` before every PR merge.
- **Currency**: Currency is derived server-side from the validated locale route segment only — never from a client cookie, query param, or user input; do not add a currency switcher or perform any client-side currency calculation (AR-04, AR-06).
- **i18n routing**: The locale middleware MUST validate against the allowlist `['cs', 'en']` — never pass raw URL path segments to any downstream function; unlisted locales return 404 (security-model.md §4.6, AR-03).
- **Rate limiting**: The chatbot API endpoint enforces three independent limits via Upstash Redis: per-IP (10 req/60s), per-session (20 messages/conversation), per-day (1 new conversation/IP/day) — do not collapse these into a single counter (AR-17, REQ-F-066).
- **Supabase access**: Client components must never call Supabase directly — all writes go through Vercel Functions using `SUPABASE_SERVICE_KEY`; RLS on all 8 tables enforces this server-side (AR-21).
- **Webhook security**: The Cal.com webhook handler MUST verify HMAC-SHA256 signature using `CALCOM_WEBHOOK_SECRET` AND reject timestamps older than 5 minutes (replay protection) before processing any payload (AR-11, security-model.md §4.3).
- **Theme tokens**: Never hardcode hex values in component files — all colors reference `var(--color-*)` CSS Custom Properties from `tokens/light.css` and `tokens/dark.css`; the anti-flash inline script in `<head>` reads `localStorage('victa-theme')` before first paint (AR-10, REQ-F-074).
- **GA4 consent gate**: GA4 must NOT initialize until Cookiebot fires the analytics consent event — no `gtag()` calls, no `<script>` tag for GA4 before consent; verify this on every new page that adds analytics events (security-model.md §4.5, REQ-C-003).
- **Czech typography**: All Czech content strings must pass the build-time typography linter before merge — Czech quotation marks („ "), em-dashes, non-breaking spaces after single-letter prepositions, and number+unit spacing are enforced; a linter failure blocks the build (AR-08, REQ-NF-036).
- **CSP headers**: Defined in `vercel.json` — no `unsafe-inline` permitted; `frame-src` exception exists for Cal.com embed only; `connect-src 'self'` means all external API calls go through same-origin Vercel Functions (security-model.md Rule 4, AR-07).
- **Chatbot message logging**: Never log chatbot message content — log only `{ request_id, session_id, message_count, tokens_used, cache_hit, model_id, response_time_ms }`; logging user message text is a GDPR violation (architecture.md §3.2).
- **Rendering strategy**: All 39 Czech content pages are SSG (built at deploy time); homepage uses ISR with `s-maxage=86400`; API routes (`/api/chat`, `/api/contact`, `/api/newsletter`, `/api/booking-webhook`) use `Cache-Control: no-store` — never add caching to API routes without security review (architecture.md §3.1).
- **Team section**: Build `/cs/o-nas/#tym` LAST in Phase 4, after all other 40 pages are complete and approved — this sequencing rule exists to prevent team content from blocking launch (SC-14, workplan.md Phase 4 §P-34).
- **Vercel region**: Set deployment region to `fra1` (Frankfurt) in `vercel.json` — GDPR data residency requirement; do not change without Roman's approval and a privacy policy update (AR-13, security-model.md §3.4).

