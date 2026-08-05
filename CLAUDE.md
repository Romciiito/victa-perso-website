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

## Ultracode Agentic Team (model tiering)

When orchestrating multi-agent work (Workflow tool or subagents), assign models by role:

- **Orchestrator** — Fable 5 at `xhigh` effort: runs the main loop only — decomposition, dispatch, synthesis, final decisions. Never delegate orchestration downward.
- **Review Gate** — Opus at `xhigh` effort (`model: 'opus', effort: 'xhigh'`): adversarial verification and PASS/FAIL verdicts on every substantive deliverable; on FAIL, the work goes back into the loop for rework — never merge past a failed gate.
- **Research / Explore / Discovery** — Sonnet 5 at `high` effort (`model: 'sonnet', effort: 'high'`): web/e-research, codebase exploration, discovery sweeps, scouting before implementation.

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

- **AI calls**: Never import `@anthropic-ai/sdk` or `@ai-sdk/anthropic` directly — all chatbot inference (code shipped, `/api/chat` exists — see below) MUST go through the Vercel AI SDK + Vercel AI Gateway using `process.env.AI_MODEL` (AR-01, security-model.md Rule 2); direct Anthropic SDK calls bypass spend controls and model abstraction.
- **API key exposure**: Every server-only secret (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY_*`, `UPSTASH_REDIS_REST_TOKEN`, `CALCOM_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`) must NEVER carry the `NEXT_PUBLIC_` prefix — grep for `NEXT_PUBLIC_` before every PR merge.
- **Currency**: Currency is derived server-side from the validated locale route segment only — never from a client cookie, query param, or user input; do not add a currency switcher or perform any client-side currency calculation (AR-04, AR-06).
- **i18n routing**: The locale middleware MUST validate against the allowlist `['cs', 'en']` — never pass raw URL path segments to any downstream function; unlisted locales return 404 (security-model.md §4.6, AR-03).
- **Rate limiting**: `/api/chat` (code shipped, DORMANT — see below) enforces three independent limits via Upstash Redis: per-IP (10 req/60s), per-session (20 messages/conversation), per-day (1 new conversation/IP/day) — do not collapse these into a single counter (AR-17, REQ-F-066); unlike the forms below, all three FAIL CLOSED on a Redis error (`src/lib/rate-limit.ts` "Chatbot rate limiting" section — cost control is the point of the limits). The `booking_webhook` limiter (IP-keyed, 60 req/60s, fail-open on Redis outage) is live today on `/api/booking-webhook`, checked after HMAC verification.
- **Supabase access**: Client components must never call Supabase directly — all writes go through Vercel Functions using `SUPABASE_SERVICE_KEY`; RLS on all 8 tables enforces this server-side (AR-21).
- **Webhook security**: The Cal.com webhook handler MUST verify HMAC-SHA256 signature using `CALCOM_WEBHOOK_SECRET` AND reject timestamps older than 5 minutes (replay protection) before processing any payload (AR-11, security-model.md §4.3).
- **Theme tokens**: Dark-only theme (D-008, revived per D-009) — there is no light variant, no `tokens/light.css`/`tokens/dark.css`, and no anti-flash inline script (nothing to flash between, since there's only one palette). Never hardcode hex values in component files — all colors reference the `var(--*)` CSS Custom Properties defined in `src/styles/globals.css` `:root` (AR-10).
- **GA4 consent gate**: GA4 must NOT initialize until Cookiebot fires the analytics consent event — no `gtag()` calls, no `<script>` tag for GA4 before consent; verify this on every new page that adds analytics events (security-model.md §4.5, REQ-C-003).
- **Czech typography**: All Czech content strings must pass the build-time typography linter before merge — Czech quotation marks („ "), em-dashes, non-breaking spaces after single-letter prepositions, and number+unit spacing are enforced; a linter failure blocks the build (AR-08, REQ-NF-036).
- **CSP headers**: Defined in `vercel.json` as an *enforcing* `Content-Security-Policy` (promoted from Report-Only in D-015, Vlna 3A — the report-only period never collected any violation data since it referenced a `report-to` endpoint that was never wired up). `script-src`/`style-src` keep `'unsafe-inline'` — no other directive may — because the site's pages are SSG (prebuilt HTML, no per-request nonce available); see D-015 for the hash-based path out. `frame-src` exception exists for Cal.com embed + Cloudflare Turnstile only. `connect-src` is `'self'` + Cookiebot + GA4 + Cloudflare Turnstile — Supabase and Upstash are called only from Vercel Functions, never the browser, so neither appears in `connect-src` (security-model.md Rule 4, AR-07).
- **Chatbot message logging**: `/api/chat` (code shipped, DORMANT — see below) never logs chatbot message content — log only `{ request_id, session_id, message_count, tokens_used, cache_hit, model_id, response_time_ms }` (`src/lib/chat/log-turn.ts`); logging user message text would be a GDPR violation (architecture.md §3.2). `chatbot_messages.content` is likewise never written to Supabase (D-018 — strictest reading; metadata-only persistence in `chatbot_sessions`).
- **Rendering strategy**: All Czech + English pages are SSG (built at deploy time) — there is currently no ISR anywhere in the app; update this line if that changes. API routes (`/api/contact`, `/api/newsletter`, `/api/newsletter/confirm`, `/api/booking-webhook`, `/api/chat`) use `Cache-Control: no-store` — never add caching to API routes without security review (architecture.md §3.1).
- **Chatbot dormancy (Vlna 5, D-019)**: the chatbot is FULLY BUILT — `/api/chat`, sanitization, rate limiting, system prompt + generated knowledge digest, adversarial battery, widget — but ships INERT. The widget (`src/components/chat/chat-launcher.tsx`) mounts nothing at all (no DOM node) unless `NEXT_PUBLIC_CHATBOT_ENABLED === '1'`; `/api/chat` independently fails closed (`503 {disabled:true}`) unless `AI_MODEL` + Upstash env are present (`src/lib/chat/config-gate.ts`). Do NOT set `NEXT_PUBLIC_CHATBOT_ENABLED=1` until vendor provisioning is complete AND the adversarial prompt-injection battery (`CHAT_BATTERY=1 pnpm vitest run src/lib/chat/__tests__/adversarial-battery.test.ts`) has been run and every scenario passes (vision.md §14 bod 12). Exact sequence: `docs/setup/chatbot-activation.md`.
- **Team section**: Build `/cs/o-nas/#tym` LAST in Phase 4, after all other 40 pages are complete and approved — this sequencing rule exists to prevent team content from blocking launch (SC-14, workplan.md Phase 4 §P-34).
- **Vercel region**: Set deployment region to `fra1` (Frankfurt) in `vercel.json` — GDPR data residency requirement; do not change without Roman's approval and a privacy policy update (AR-13, security-model.md §3.4).

