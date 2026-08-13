# VICTA — API abuse surface & DDoS/abuse defenses (Vlna 7)

> Read this before touching rate limits, the Vercel Firewall, or any `/api/*` route. Companion to `security-model.md` §4 (attack surface mapping) and `claude-rules.md` — this doc is the concrete, current-state map those two describe in the abstract.
>
> Zadání (verbatim, Roman, 2026-08-13): *"dej prosím i na stránku limity, proti ddos a dalšímu napadením."*

Last verified against: HEAD `9fa1717` + uncommitted `redis.ts`/`config-gate.ts` (Vercel Marketplace `KV_REST_API_*` support) + this wave's changes, including a `code-reviewer` fix round (C1/I1–I4/M1–M4/M6/M8 fixed — see `decisions.md` D-022's "Code-review fix round"), 2026-08-13.

---

## 1. Exposure map — every `/api/*` route

All routes run on Vercel Functions, region `fra1` only (AR-13). None are cookie/session-authenticated — "authenticated" below means "the request must prove it holds a server-side secret," not "a logged-in user."

| Route | Method | Auth | Real cost per call | Limiters active TODAY | New this wave (Vlna 7) | What 10k req/min does |
|---|---|---|---|---|---|---|
| `/api/contact` | POST | None (Origin + Turnstile* + honeypot; BotID coded but DORMANT — see §2/§5) | Up to 2 Resend sends + 1 Supabase insert + 1 upsert | Origin allowlist; honeypot; Turnstile (**not provisioned — currently a no-op**, see §2); rate limit 5/600s/IP, **fail-open** | Content-Length guard (413 fast-path); BotID Basic, shipped **inert** behind `NEXT_PUBLIC_BOTID_ENABLED` (unset by default — code-review finding C1, §5.2) | Per-IP capped at 5/10min once past honeypot; **today's real gate is honeypot + the per-IP limiter**, not Turnstile or BotID — see §2/§5. WAF 60/60s/IP (staged, not live) adds an edge backstop once published. |
| `/api/newsletter` | POST | None (Origin + Turnstile* + honeypot; BotID coded but DORMANT — see §2/§5) | 1 Resend send (double opt-in — **no DB write**, D-014) | Same as contact; rate limit 3/3600s/IP, fail-open | Content-Length guard; BotID Basic, shipped inert (same flag) | Worst case with rotated IPs is inbox-spam of a third party with confirm-link emails (never an actual subscription — double opt-in means nothing is written until the link is clicked), bounded by Resend's own account sending limits. |
| `/api/newsletter/confirm` | GET | **Token** (HMAC-SHA256, 48h expiry, stateless) | 1 Supabase insert (first click only) + best-effort Resend audience add + welcome email | HMAC-signed token is the real boundary; rate limit 10/3600s/IP, fail-open; Supabase unique-constraint dedupes replays of a captured valid token to a free 302 | None needed — already low-risk (token-gated) | An invalid/guessed token 302s immediately with **zero** DB/email cost. A flood of the SAME valid token dedupes to one real write; only the *first* click ever costs anything. |
| `/api/booking-webhook` | POST | **HMAC-SHA256** (`CALCOM_WEBHOOK_SECRET`) + 5-min replay window + idempotency claim | 1 Supabase insert + optional lead upsert | Signature check runs BEFORE rate limit (unsigned floods rejected almost for free); rate limit 60/60s/IP, fail-open (defense-in-depth, legit volume is far lower) | Content-Length guard (413 before `req.text()` buffers the body) | Without the secret: every request 401s on signature mismatch before any DB/rate-limit cost. With the secret compromised, this becomes a secret-rotation incident, not a volumetric one — out of this wave's scope. |
| `/api/company-lookup` | GET | None (Origin only) | **1–2 external API calls** — ARES ~1s, RPO up to 12s (see `company-lookup.ts`) | Origin allowlist; rate limit 30/60s/IP, fail-open; CDN cache (`s-maxage=300`, D-021) absorbs repeated popular queries at the edge | **Global circuit breaker** (new, `circuit-breaker.ts`) — 5 failures/60s trips a 2-min skip-the-call cooldown per source; halved timeout while a source shows any recent trouble; `dynamic = 'force-dynamic'` made explicit | **This is the flagged expensive path.** Before this wave, many concurrent requests (few IPs or a botnet) could each hold a Function open up to 12s waiting on a struggling RPO — real compute-seconds cost and a path toward exhausting concurrent-function capacity. After this wave: once the upstream shows real trouble, new calls skip the wait entirely (near-0ms reject) for 2 minutes instead of every request paying the full timeout. WAF 45/60s/IP (staged) adds an edge cap in front of the function. |
| `/api/chat` | POST | None (Origin + Zod `.strict()`) — **DORMANT** (`config-gate.ts` fails closed 503 without `AI_MODEL` + Upstash; widget doesn't mount without `NEXT_PUBLIC_CHATBOT_ENABLED=1`) | **LLM tokens via AI Gateway (real money) once active** — today: none, config gate short-circuits before any spend | Config gate (503 today, zero cost); Origin; Zod `.strict()`; 3 INDEPENDENT Redis limiters — 10/60s IP, 20/session, 1 new-conv/IP/day — all **fail CLOSED** (AR-17) | Content-Length guard; `Retry-After` header added to all three 429 branches (previously missing — see §4) | **Today**: negligible — config gate rejects before Redis/AI Gateway are touched. **After activation**: this is the single most expensive path in the app. The three fail-closed limiters mean a Redis outage is itself the fail-safe (503, never a silent bypass to the paid model call). WAF 20/60s/IP (staged) rejects before the Function even starts. |
| `/api/cron/keepalive` | GET | **Bearer token** (`CRON_SECRET`, `timingSafeEqual`) | 1 cheap Supabase `SELECT` | Constant-time bearer check — no rate limiter (not needed; unauthenticated calls reject almost for free) | Explicitly **excluded** from the new global WAF rate-limit rule (path-neq condition) so Vercel Cron's own daily ping is never at risk of being edge-limited | Negligible at any volume — auth check rejects before DB. |

`*` Turnstile: see §2 — it is currently a documented no-op, not a bug, but it means **honeypot + the per-IP Redis limiter are today's actual bot defense** on the two form routes (BotID is coded but ships dormant — see §5.2 for why).

---

## 2. Turnstile's current state (context, not a Vlna 7 change)

`src/lib/turnstile.ts`'s `verifyTurnstileToken` is fail-**open** when `TURNSTILE_SECRET_KEY` is absent or doesn't look like a real Cloudflare key (D-011) — this is deliberate, documented, pre-existing behavior so the forms work before the vendor account is provisioned, not something this wave introduced or is fixing. It means, as of this doc, on `/api/contact` and `/api/newsletter`, TODAY's actual defense is:

1. Honeypot catches unsophisticated bots that fill every field.
2. The per-IP Redis limiter (fail-open) caps sustained abuse from any single IP.

**BotID Basic (new this wave, `botid` npm package) ships coded but DORMANT** (`NEXT_PUBLIC_BOTID_ENABLED` unset — see §5.2 for why) — it is NOT part of "today's" defense until Roman flips that flag after the §5.4 verification step. Once enabled, it would catch automated HTTP clients that never run the page's JS at all (curl/scripts) and low-effort headless-browser bots.

Provisioning real Turnstile keys (docs/setup/turnstile-config.md, workplan §0.7) closes the remaining gap once BotID is also active — a sophisticated bot that runs real JS convincingly enough to pass BotID Basic but hasn't solved a CAPTCHA challenge. **Turnstile provisioning is a pre-existing Phase 0 gap, not new in Vlna 7** — flagged here because it directly changes what "today's defenses" means in the table above.

---

## 3. Vercel-platform layer (WAF / Firewall)

### 3.1 What's automatic (every plan, zero config)

Vercel's platform-wide DDoS mitigation (L3/L4/L7) is on by default for every project on every plan, including Hobby — confirmed via `vercel firewall overview`: `System Mitigations: Active`. Nothing to configure; nothing billed for traffic it blocks.

### 3.2 What's staged this wave (custom WAF rules — NOT live yet)

CLI reality check (per the task brief's own instruction to verify before assuming): the **project's pinned Vercel CLI (50.44.0)** only exposes `vercel firewall rules list|inspect` — `rules add/edit/...` don't exist in that build. `npx vercel@latest` (58.11.0, same authenticated session — `vercel whoami` confirms `romciiito` either way) does support the full `rules add` surface and was used to stage the rules below. No project dependency was changed to do this; it's a one-off CLI invocation, not a code change.

Four custom rules are **staged as drafts** (confirmed via `vercel firewall diff` — see below) and are **NOT live**. `vercel.json` has no schema field for WAF rules — this layer is managed entirely outside it, via the `vercel firewall` CLI or the dashboard's Firewall tab, which is why none of this wave's `vercel.json` diff touches headers/functions/crons/redirects.

**Evaluation order matters and is set deliberately** (code-review finding I4): Vercel WAF custom rules evaluate top-to-bottom, and a broader rule matching first can neuter a narrower one behind it. The two path-specific rate limits are staged AHEAD of the global one — `vercel firewall rules list --expand` confirms this order — so `/api/chat` and `/api/company-lookup` actually get their tighter limits instead of every request being caught (and counted against) the 60/60s global rule first.

| Priority | Name | Match | Action (staged) | Why |
|---|---|---|---|---|
| 1 | `Vlna7: chat rate limit` | `path` starts with `/api/chat` | `rate_limit` 20 req/60s per IP, **breach action = log** | Tighter-than-global cap on the most expensive path once active (LLM tokens) — layers with app-level 10/60s+session+daily; the edge rule fires before the Function even starts. Evaluated FIRST so it isn't shadowed by the global rule below. |
| 2 | `Vlna7: company-lookup rate limit` | `path` starts with `/api/company-lookup` | `rate_limit` 45 req/60s per IP, **breach action = log** | Tighter-than-global cap on the slow-upstream path, edge-layer companion to the new circuit breaker (§1) and the existing 30/60s app-level limiter. Evaluated SECOND for the same reason. |
| 3 | `Vlna7: API rate limit global` | `path` starts with `/api` AND `path` ≠ `/api/cron/keepalive` | `rate_limit` 60 req/60s per IP, **breach action = log** | Blanket edge-layer backstop over every OTHER route's own app-level limiter, catching a request BEFORE it spends any Function compute. Cron excluded by name so Vercel's own daily ping is never at risk from an unrelated `/api/*` abuse spike sharing the same edge PoP. |
| 4 | `Vlna7: API method allowlist` | `path` starts with `/api` AND `method` NOT IN `{GET, POST, HEAD}` | `log` | Every route in the table above only defines `GET` or `POST` handlers; Next.js already 405s undefined methods, this is a cheaper edge-layer version of the same allowlist plus visibility into who's probing with `DELETE`/`PATCH`/`TRACE`/etc. |

**Why staged in `log` mode, not enforcing, and why NOT published**: this mirrors the CSP report-only→enforce pattern this codebase already uses for header changes (D-015) — the mechanical bar for "stage a firewall rule" (per Vercel's own CLI, `add`/`edit` always land as an unpublished draft) is separate from "put it in front of real traffic," and the second step deserves a look at real traffic data first, not a guess about legitimate request volume baked into a limit picked without evidence. Per this agent's own operating rules, publishing a change that affects live production traffic needs a manual confirmation step — that step is Roman's, not automated here.

**Manual steps for Roman** (dashboard Firewall tab or CLI — either works). This follows Vercel's own recommended staged rollout (log everywhere → review → block in preview → block in production), not just a two-step log→production jump:

```bash
# 1. Review exactly what's staged (safe, read-only):
npx vercel@latest firewall diff
npx vercel@latest firewall rules list --expand   # confirm the priority order above

# 2. Publish so the rules start LOGGING real traffic (still not blocking anything):
npx vercel@latest firewall publish --yes

# 3. Watch matches for a few days:
#    Dashboard: https://vercel.com/romciiito/victa-perso-website/firewall/traffic?filter=<ruleId>
#    (rule IDs: npx vercel@latest firewall rules list --json)
#    Or, if the project is on Observability Plus:
npx vercel@latest metrics vercel.firewall_action.count --group-by waf_rule_id --group-by waf_action --since 3d --granularity 4h
#    Confirm ONLY abuse-shaped traffic is matching — no real users, no the
#    uptime monitor from §6.1, no search-engine crawlers hitting /api/* by mistake.

# 4. Block in PREVIEW first (Vercel's own recommended staging step, not skipped
#    here) — add an `environment = preview` condition and flip to the real
#    enforcing action, leaving PRODUCTION still in `log`. Repeat once per rule
#    (each `edit --condition` REPLACES all conditions, so restate every one):
npx vercel@latest firewall rules edit "Vlna7: chat rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/chat"}' \
  --condition '{"type":"environment","op":"eq","value":"preview"}' \
  --rate-limit-action rate_limit \
  --yes

npx vercel@latest firewall rules edit "Vlna7: company-lookup rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/company-lookup"}' \
  --condition '{"type":"environment","op":"eq","value":"preview"}' \
  --rate-limit-action rate_limit \
  --yes

npx vercel@latest firewall rules edit "Vlna7: API rate limit global" \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --condition '{"type":"path","op":"eq","value":"/api/cron/keepalive","neg":true}' \
  --condition '{"type":"environment","op":"eq","value":"preview"}' \
  --rate-limit-action rate_limit \
  --yes

npx vercel@latest firewall rules edit "Vlna7: API method allowlist" \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --condition '{"type":"method","op":"inc","value":["GET","POST","HEAD"],"neg":true}' \
  --condition '{"type":"environment","op":"eq","value":"preview"}' \
  --action deny \
  --yes

npx vercel@latest firewall publish --yes
# Then hit a preview deployment's /api/* routes past each threshold and
# confirm the block actually fires there (production traffic is unaffected
# in this step — still `log`).

# 5. Block in PRODUCTION — repeat step 4's four commands with the
#    `environment = preview` condition REMOVED (back to the original
#    two-condition / one-condition matches from the table above):
npx vercel@latest firewall rules edit "Vlna7: chat rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/chat"}' \
  --rate-limit-action rate_limit \
  --yes

npx vercel@latest firewall rules edit "Vlna7: company-lookup rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/company-lookup"}' \
  --rate-limit-action rate_limit \
  --yes

npx vercel@latest firewall rules edit "Vlna7: API rate limit global" \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --condition '{"type":"path","op":"eq","value":"/api/cron/keepalive","neg":true}' \
  --rate-limit-action rate_limit \
  --yes

npx vercel@latest firewall rules edit "Vlna7: API method allowlist" \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --condition '{"type":"method","op":"inc","value":["GET","POST","HEAD"],"neg":true}' \
  --action deny \
  --yes

npx vercel@latest firewall publish --yes
```

**If a rule turns out to be too tight** (blocks a real uptime monitor, a partner integration, etc.): `npx vercel@latest firewall rules edit "<name>" --condition '<same condition(s) as the table above>' --rate-limit-action log --yes` (or `--action log` for rule 4) `&& npx vercel@latest firewall publish --yes` reverts it to observe-only in under a minute — far faster than a code deploy. Remember `edit --condition` replaces ALL conditions on the rule, so restate every one, not just the one you're changing.

**Per-region caveat**: Vercel counts these rate-limit windows PER EDGE REGION, not globally — a request volume spread across N regions can collectively exceed the configured limit by roughly N×. Size any incident response against that, not against the raw number in the table.

### 3.3 Attack Challenge Mode — manual emergency procedure ONLY

Vercel Firewall's Attack Mode challenges every visitor with a verification page. It is **not** something this task can enable — the CLI itself blocks it for non-interactive/agent use (`vercel firewall attack-mode enable` requires an interactive confirmation), and pausing/resuming automatic DDoS mitigation is similarly blocked. This is intentional on Vercel's part; treat it the same way here.

**When to use it** (see the runbook, §6, for the full decision tree): a confirmed, ongoing volumetric attack where the WAF rules in §3.2 (once enforcing) are not enough — e.g., an attacker rotating through thousands of IPs faster than any per-IP rate limit can track.

**Exact steps** (Roman, dashboard or CLI):

- Dashboard: Project → **Firewall** tab → **Attack Mode** → toggle on, pick a duration (1h/6h/24h).
- CLI: `vercel firewall attack-mode enable --duration 1h --yes` (asks for confirmation; verified bots/search crawlers are exempted automatically).
- **To turn off**: `vercel firewall attack-mode disable --yes`, or the dashboard toggle. Auto-expires after the chosen duration if forgotten.

### 3.4 Bot management — BotID (implemented this wave, code-level)

See §5 below — this is a code integration (`checkBotId()` in the two form routes), not a Firewall CLI configuration, so it's covered in the code section rather than here.

---

## 4. Application-level hardening (this wave, all shipped in code)

1. **Global circuit breaker for `/api/company-lookup`** (`src/lib/circuit-breaker.ts`) — see §1's table row for the rationale. Tracks ARES and RPO **independently**; global (not per-IP), because the problem it solves (many different clients each waiting on one struggling upstream) isn't visible to a per-IP limiter. Fails open on any Redis error — it's a resilience/cost optimization, not a security control, so a Redis hiccup must not disable the anti-fake-lead feature. Only counts GENUINE upstream-health signals (network error, timeout, 5xx, 429) toward the trip counter — never a 4xx caused by the caller's own query, which would otherwise let any single visitor degrade the feature for everyone (code-review finding I3). 13 tests (`circuit-breaker.test.ts`) + 9 integration tests (`company-lookup.test.ts`).

2. **Content-Length body-size guard** (`src/lib/body-size-guard.ts`) — a header-only check (no body read) returning 413 before `req.json()`/`req.text()` ever runs, applied to every POST route with a body: `/api/contact` (20KB), `/api/newsletter` (10KB), `/api/booking-webhook` (256KB — checked BEFORE `req.text()` buffers the raw body for HMAC verification), `/api/chat` (350KB — sized against `chatSchema`'s true worst case in UTF-8 BYTES, not its 40×2000-CHARACTER ceiling; Zod's `.max()` counts UTF-16 code units, and the original 120KB here silently conflated the two, code-review finding M1). Explicitly **not** a replacement for Vercel's platform body-size limit — a request lying about or omitting `Content-Length` (chunked transfer) falls through to that. 6 new tests (`body-size-guard.test.ts`).

3. **Vercel BotID (Basic tier)** on `/api/contact` + `/api/newsletter` (`checkBotId()` from the `botid` npm package, additive to Turnstile per §2, not a replacement) — coded and ready, but shipped **DORMANT** behind `NEXT_PUBLIC_BOTID_ENABLED` (unset by default). See §5 for the full integration, why it's inert by default (code-review finding C1), and the activation checklist.

4. **`export const dynamic = 'force-dynamic'` consistency pass** — every route in §1 now declares it explicitly, including `/api/company-lookup` which previously omitted it. Verified this does NOT conflict with that route's intentional CDN caching (D-021): `dynamic` controls Next's own build-time/Data-Cache behavior for the handler, not the `Cache-Control` header the response sets — the two are independent. `/api/newsletter/confirm` is a `GET` that redirects, not JSON — left as-is (already implicitly dynamic via `req.nextUrl.searchParams`, matching its pre-existing pattern).

5. **429 response unification** — audited every rate-limit branch across all 7 routes:
   - `contact`, `newsletter`, `company-lookup`: already `429` + `Retry-After` + generic `{ error: 'rate-limit' }` body. **No change.**
   - `booking-webhook`: already correct. **No change.**
   - `chat`: **fixed this wave** — all three 429 branches (`rate-limit`/`daily-limit`/`session-limit`) were missing `Retry-After` entirely. Added, matched to each dimension's actual window (60s / 86400s / 86400s — the session cap has no natural "window," so its session TTL is used as the closest honest answer).
   - `newsletter/confirm`: **intentionally left as a 302 redirect on limit breach, not a raw 429**, because this route is a browser-navigated `GET` from a clicked email link, not a `fetch()`-consumed API — showing a human a bare JSON 429 after they click a link in their inbox would be a UX regression the task's own "no invention" spirit argues against introducing without being asked. Documented here as a deliberate, reasoned deviation.
   - **On "never leak internal details"**: `retryAt: rl.reset` (an Upstash-computed epoch timestamp) appears in `contact`/`newsletter`/`company-lookup`'s 429 bodies. This is not treated as an internal-details leak — it's the same category of information as the `Retry-After` header itself (standard practice, e.g. GitHub's API), not a stack trace, secret, or system-internal value. No change made; noted here so the reasoning is explicit rather than silently assumed.

---

## 5. Bot protection — Vercel BotID

### 5.1 What was checked before implementing

- **Availability**: `botid` npm package (Vercel's own, proprietary, current version `1.5.11`) — confirmed installable (`pnpm add botid`, no `--force`/`--legacy-peer-deps`).
- **Plan/cost**: fetched Vercel's own docs (`/docs/botid`, `/docs/botid/get-started`) directly rather than assuming. **Basic tier is free on every plan** (Hobby through Enterprise) — the tier this wave implements. **Deep Analysis** (ML-based, Kasada-powered) costs **$1 per 1,000 `checkBotId()` calls on Pro** and requires an explicit opt-in dashboard toggle (Firewall → Rules → "Vercel BotID Deep Analysis") — **not enabled this wave**, since it's a real, ongoing cost decision that belongs to Roman, not something to switch on silently while implementing a free-tier feature. Flagged as a future option, not implemented.

### 5.2 What's implemented — and why it ships DORMANT (code-review finding C1)

- `next.config.ts` wraps the config with `withBotId(...)` — this adds first-party rewrite rules so BotID's client challenge is served from VICTA's own domain (the specific mechanism that keeps it effective against ad-blockers per Vercel's docs), which is also why **no CSP change was needed**: no new third-party domain is introduced, so AR-20 ("every new third-party domain needs a `decisions.md` justification before the `vercel.json` CSP change ships") doesn't apply — there is no CSP change to justify.
- `instrumentation-client.ts` (new, project root, Next.js 15.3+ auto-loaded convention) calls `initBotId({ protect: [...] })` — **but only when `NEXT_PUBLIC_BOTID_ENABLED === '1'`**. `src/app/api/contact/route.ts` and `src/app/api/newsletter/route.ts` each call `checkBotId()` under the same flag check, positioned AFTER Zod/honeypot/rate-limit and BEFORE Turnstile (code-review finding I1 — the two outbound-network checks, BotID and Turnstile, run only once every free-to-reject path has already had its chance, so a garbage request doesn't pay for an external HTTPS round trip it would previously have avoided).
- **Why the flag, and why it also gates the CLIENT-side `initBotId()` call, not just the server-side `checkBotId()` calls**: `initBotId()` patches `window.fetch` globally, and its challenge-script loader has no error handling of its own — if that script fails to load for ANY reason (an ad-blocker heuristic, `api.vercel.com` being degraded, a corporate proxy, the BotID rewrite not applying for some reason), a protected `fetch('/api/contact')` call REJECTS instead of completing. On the actual conversion path, that's a silently lost lead, with no kill switch short of a code deploy — and this integration has never been exercised against a real browser session (§5.4). Gating `initBotId()` itself, not just the server-side check, means when the flag is off `window.fetch` is never patched at all: the forms behave EXACTLY as they did before this wave. Same "ship inert, flip a flag after verification" pattern D-019 already uses for the chatbot (`NEXT_PUBLIC_CHATBOT_ENABLED`).
- On a clean `isBot: true` classification (once enabled): `403 { error: 'bot' }`. **On any thrown error (misconfiguration, BotID temporarily unavailable, etc.): fail OPEN** — logs a warning and continues to the rest of the pipeline unaffected. This mirrors the existing Turnstile-not-provisioned skip pattern (D-011).
- **`checkBotId()`'s OIDC prerequisite — verify before enabling** (code-review finding I2): reading `botid`'s server implementation, `checkBotId()` resolves Vercel's identity token from the `x-vercel-oidc-token` request header (or `VERCEL_OIDC_TOKEN` env var) and **throws** if neither is present, with a message pointing at the project's OIDC ("Secure Backend Access") setting. The fail-open above catches that throw — the route stays working — but it also means BotID would provide **zero actual protection** if OIDC isn't enabled on `victa-perso-website`, while silently looking configured. **Before flipping the flag**: confirm OIDC/Secure Backend Access is enabled for this Vercel project (dashboard → Project Settings), or check for a `[contact] BotID check failed` / `[newsletter] BotID check failed` warning in the Function logs after a real test submission — its absence is the actual evidence protection is live, not just the code being present.
- **Not applied** to `/api/company-lookup`, `/api/booking-webhook`, or `/api/chat` — out of the task's explicit scope (`"formulářové routy (/api/contact, /api/newsletter)"`), and `booking-webhook` already has a stronger boundary (HMAC signature) that BotID's browser-challenge model doesn't fit (Cal.com's server calls it, not a browser).

### 5.3 Measured bundle-size impact

This wave measured the actual bundle delta rather than assuming it's negligible — same `git stash` / `pnpm build` / `git stash pop` / `pnpm build` A/B methodology this codebase already uses (D-021), re-run after the C1 fix (flag-gating `initBotId()`):

- Pre-Vlna-7 baseline: `.next/static/chunks` total **1,688 KB**. With this wave's changes and `NEXT_PUBLIC_BOTID_ENABLED` unset (the default): **1,692 KB (+4 KB, +0.24%)**, raw (uncompressed) bytes across every route's code-split output combined.
- **Confirmed BotID's client runtime is fully dead-code-eliminated when disabled**: `grep -rl "initBotId\|checkChallenge\|bot-protection" .next/static/chunks/` returns zero matches — the `if (process.env.NEXT_PUBLIC_BOTID_ENABLED === '1')` guard around `initBotId()` in `instrumentation-client.ts` gets constant-folded away at build time (`NEXT_PUBLIC_*` vars are inlined literals), so the whole call and its import are tree-shaken out, not merely inert at runtime.
- The remaining +4KB is therefore NOT from BotID's client code — most likely the `withBotId()` `next.config.ts` wrapper itself contributing a small amount of rewrite-manifest/build glue, or ordinary inter-build chunk-boundary variance. Either way it's `checkBotId()` (server), the circuit breaker, and the body-size guard are all `server-only`-guarded and never reach a client component, so none of this wave's server-side code contributes to this number at all.

+4KB raw across the whole app — from a source that isn't even BotID's own runtime — is well inside any reasonable interpretation of the 260KB-gzip-per-page budget (REQ-NF-006). Once `NEXT_PUBLIC_BOTID_ENABLED=1` is actually flipped (§5.4), re-measure — the real BotID client runtime will land in the bundle at that point, not before.

### 5.4 Activation checklist — how Roman turns BotID ON

This wave verified: package installs cleanly, `next.config.ts`/`instrumentation-client.ts` wiring compiles, `pnpm build` succeeds end-to-end, the code's fail-open behavior passes `tsc`/`lint`/unit tests, and — critically — that with the flag unset, `initBotId()` never runs and both routes skip `checkBotId()` entirely (zero behavior change from pre-Vlna-7). What this sandboxed session structurally CANNOT do: run a real Chrome browser against a live Vercel preview (BotID's own docs are explicit that `curl` or a direct visit to the protected route is blocked in production — only a genuine `fetch()` from a loaded page passes the challenge), and firewall-config publishing was blocked by this environment's own permission classifier as a production-affecting action requiring a human.

**Steps, in order, before setting `NEXT_PUBLIC_BOTID_ENABLED=1` anywhere real traffic reaches**:

1. **Confirm OIDC/Secure Backend Access is enabled** on the `victa-perso-website` Vercel project (dashboard → Project Settings) — §5.2's OIDC prerequisite. If it's off, `checkBotId()` will fail-open silently forever; turn it on first.
2. Set `NEXT_PUBLIC_BOTID_ENABLED=1` in a **Preview** environment only (Vercel dashboard → Environment Variables, scoped to Preview) — not Production yet.
3. Deploy, open the preview URL in a real browser, submit `/kontakt`'s contact form and the newsletter form once each. Confirm both succeed (200, the expected success UI) — NOT a 403 or a network error.
4. Check the Function logs for that deployment for `[contact] BotID check failed` / `[newsletter] BotID check failed` — their ABSENCE is the actual evidence OIDC is wired up and BotID ran a real check, not just "the code didn't crash."
5. Check Vercel's Firewall traffic tab (filter: BotID) for the classification on those two test submissions.
6. Only after 3–5 pass: set `NEXT_PUBLIC_BOTID_ENABLED=1` in **Production** too, redeploy, and repeat step 3 once against the live site.

**Rollback**: unset (or set to `0`) `NEXT_PUBLIC_BOTID_ENABLED` in the affected environment and redeploy — reverts to today's exact behavior (honeypot + rate limit only), no other code change needed.

---

## 6. Runbook — "we think we're under attack"

### 6.1 How to tell

1. **Vercel Observability** (dashboard → project → Observability): a spike in Function invocations or error rate on one or more `/api/*` routes, concentrated in a short window.
2. **Vercel Firewall traffic tab** (`/firewall/traffic`, or `vercel firewall overview` for a quick CLI summary): once the §3.2 rules are published, a spike in `waf_action: rate_limit` or `log` hits on one rule tells you which route and roughly what shape (IP concentration, geo).
3. **Upstash dashboard** (console.upstash.io): a spike in commands/sec on the Redis database — every rate limiter and the circuit breaker live there, so this is a decent proxy for "how much abuse traffic is even reaching the point of being counted."
4. **Sentry**: a burst of `[contact] resend error`, `[company-lookup] source failed`, or similar warn/error logs; P1 alert (>10 errors/5min) should already be firing per `architecture.md` §11.1 if one is configured.

### 6.2 What to do first (in order)

1. **Confirm it's actually abuse, not a legitimate traffic spike** (a launch announcement, a press mention) — check the geo/UA/path distribution in the Firewall traffic tab or Vercel Observability before touching anything. Blocking a real traffic spike is worse than the attack.
2. **If the §3.2 WAF rules are still in `log` mode**, promote the relevant one(s) to enforcing NOW — during an active incident, skip straight to §3.2's step 5 (production) rather than the preview-first staging in step 4, which is for calm, planned rollouts, not live attacks. Fastest lever available, doesn't require a code deploy, and is reversible in under a minute.
3. **If it's a distributed, high-IP-cardinality attack the per-IP rules can't keep up with**: enable Attack Mode (§3.3) — dashboard or `vercel firewall attack-mode enable --duration 1h --yes`. This challenges ALL visitors, so expect a real UX cost for legitimate traffic; it's the "stop the bleeding" lever, not a permanent posture.
4. **If `/api/company-lookup` specifically is the target** (slow-upstream exhaustion): the circuit breaker (§1, §4.1) should already be self-limiting once ARES/RPO show distress — check `cb:ares:open` / `cb:rpo:open` in the Upstash console (`GET` those keys — presence means that source is currently breaker-tripped and calls are being skipped). If it's NOT tripping and the upstream itself looks fine but request volume is still hammering the route, that points to the attack being volumetric rather than upstream-exhaustion-shaped — treat as a normal rate-limit case (step 2/3), not a breaker-tuning problem.
5. **If a specific IP or narrow CIDR is clearly the source**: `vercel firewall ip-blocks block <ip> --notes "<reason>" --yes` then `vercel firewall publish --yes`. Narrower and less disruptive than Attack Mode when the source is concentrated.
6. **Identify the source** — Firewall traffic tab filtered by the matching rule ID gives IP/geo/UA/path. Cross-reference with the ip-hash values in Supabase (`contact_submissions.ip_hash`, etc.) if correlating with a specific captured submission — remember these are salted SHA-256 hashes (`hashIp`), not raw IPs, by design (GDPR); you cannot reverse one back to an IP, only confirm whether two log entries share the same source.

### 6.3 What NOT to do

- **Do not raise `maxDuration`** on any Function in `vercel.json` (`10` on contact/newsletter/booking-webhook/cron, `15` on company-lookup, `30` on chat) as a response to slowness/timeouts during an incident. A longer timeout under attack means each malicious request ties up compute for LONGER, not less — the opposite of what you want. If a route is timing out because of a legitimately slow upstream (e.g. ARES/RPO), the circuit breaker (§4.1) is the correct lever, not a longer clock.
- **Do not disable/pause Vercel's automatic system mitigations** (`vercel firewall system-mitigations pause`) during an actual attack — that command exists for debugging false positives when things are otherwise calm, not as an attack response; pausing it removes DDoS protection for 24h. The CLI itself blocks this for non-interactive use for exactly this reason.
- **Do not loosen or remove a rate limiter** to "see if that fixes it" — if a limiter is falsely blocking real users, narrow the diagnosis (which rule, which IP/UA) before touching the limit value; a blanket loosening during an active incident is how the incident gets worse.
- **Do not manually rotate `CALCOM_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`, or any Upstash/Resend credential as a first response** unless there's specific evidence of a LEAKED secret (not just high traffic) — rotating credentials with no evidence of compromise breaks legitimate integrations (Cal.com webhooks, the rate limiters themselves) for zero benefit against a volumetric attack, which doesn't need a valid secret to be a nuisance in the first place (see §1: unsigned/invalid-secret traffic already rejects cheaply).
- **Do not add a wildcard or `unsafe-inline`/`unsafe-eval` CSP exception** under time pressure to "just make an error go away" — route any such need through `code-reviewer` + Roman per AR-20, attack or not.

### 6.4 Cost/limit quick reference

| Layer | Limit | Behavior on breach |
|---|---|---|
| Vercel platform DDoS mitigation | Automatic, all plans | Blocks before billing; free |
| WAF custom rules (§3.2, staged) | 60/60s global `/api`, 20/60s `/chat`, 45/60s `/company-lookup`, per IP | Currently `log` only — see §3.2 to promote |
| `contact` app limiter | 5/600s/IP | 429, fail-open on Redis error |
| `newsletter` app limiter | 3/3600s/IP | 429, fail-open |
| `newsletter_confirm` app limiter | 10/3600s/IP | 302→`error` state, fail-open |
| `booking_webhook` app limiter | 60/60s/IP | 429, fail-open, checked AFTER signature verify |
| `company_lookup` app limiter | 30/60s/IP | 429, fail-open |
| `company_lookup` circuit breaker | 5 genuine upstream-health failures/60s per source (ares/rpo independently — a caller's own 4xx never counts, code-review finding I3) | Skips the call entirely for 120s cooldown, fail-open |
| `chat` IP limiter | 10/60s/IP | 429, **fail-closed** |
| `chat` session limiter | 20 messages/session | 429, **fail-closed** |
| `chat` daily limiter | 1 new conversation/IP/day | 429, **fail-closed** |
| Anthropic Console (once chatbot active) | Alert 50%, hard cap €75/month | Key auto-disabled at cap (vendor-side, not app-side) |
| BotID (Basic) | NOT enabled — `NEXT_PUBLIC_BOTID_ENABLED` unset by default | Code shipped, dormant; see §5.4 activation checklist |
| BotID Deep Analysis | NOT enabled | N/A — Basic tier only, free, and only once Basic itself is activated |

---

## 7. What is explicitly NOT done this wave (and why)

- **WAF rules are staged, not published/enforcing** — a production-traffic-affecting change needs Roman's manual confirmation per this agent's operating rules; §3.2 has the exact promotion steps, including a preview-first stage, in the correct evaluation order (specific rules ahead of the global one).
- **Attack Mode / system-mitigations pause** were not touched — the Vercel CLI itself refuses these for non-interactive/agent use; they're pure runbook items (§3.3, §6.3).
- **BotID is shipped coded but DORMANT** (`NEXT_PUBLIC_BOTID_ENABLED` unset) — not just Deep Analysis (real ongoing cost, $1/1000 calls on Pro, a dashboard opt-in belonging to Roman as a budget decision) but the free Basic tier too, because it's the one change in this wave that sits directly on the contact-form conversion path and has never been exercised against a real browser session. §5.4 has the exact activation checklist (confirm OIDC → enable in Preview → verify → enable in Production). This was a code-review finding (C1) fixed during this same wave, not deferred.
- **A real-browser BotID smoke test against a live preview** — §5.4 step 3; this sandboxed session structurally cannot perform it (no interactive browser against a live deployment, and `vercel deploy` itself was blocked by this environment's own permission classifier as a production-affecting action). This is why BotID ships dormant rather than enabled-by-default.
- **Turnstile provisioning** — pre-existing Phase 0 gap (§2), not created or fixed by this wave; still needs real keys before the "sophisticated bot passes BotID Basic but never solves a CAPTCHA" gap closes (itself contingent on BotID being activated first).
- **`vercel firewall publish`** (making the staged WAF rules live, even in `log` mode) was not run — same category as the BotID deploy above: a live-traffic-affecting platform action needing a human, not something to run from this session.
- **`docs/claude/env-vars.md`** was not touched — this wave introduces exactly one new env var (`NEXT_PUBLIC_BOTID_ENABLED`, added to `.env.example`); the circuit breaker and body-size guard reuse existing Upstash credentials and need none. That file is observed to already be a stale generic scaffold (still listing `JWT_SECRET`/`OPENAI_API_KEY` placeholders, missing most of VICTA's real vars including the pre-existing `NEXT_PUBLIC_CHATBOT_ENABLED`) — a pre-existing gap unrelated to this wave, and this wave's new flag follows that same existing (if imperfect) project precedent rather than being the one flag singled out for a fix to an otherwise-untouched file.
