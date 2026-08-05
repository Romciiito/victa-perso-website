# Setup: chatbot activation (Vlna 5)

**Status**: chatbot is fully coded and shipped, but **DORMANT**. This doc is the exact sequence to bring it live — do not skip steps, do not reorder them.

**Reference**: vision.md §14 bod 12 (launch-gate) · CLAUDE.md chatbot rules · `decisions.md` D-018/D-019 · `docs/superpowers/plans/2026-08-03-vlna-5-chatbot.md`

---

## Why it's dormant

Two independent gates block the chatbot from ever answering a real visitor, even though every line of code exists:

1. **Runtime config gate** (`src/lib/chat/config-gate.ts`) — `/api/chat` returns `503 {disabled:true}` before touching origin, Zod, or Redis whenever `AI_MODEL`, `UPSTASH_REDIS_REST_URL`, or `UPSTASH_REDIS_REST_TOKEN` are missing. This is automatic and requires no action to stay safe.
2. **Widget mount gate** (`src/components/chat/chat-launcher.tsx`) — the floating button (and everything behind it) renders `null` — no DOM node at all — unless `NEXT_PUBLIC_CHATBOT_ENABLED === '1'`. Verified by the build-time dormance check (see `superpowers:verification-before-completion` evidence in the PR).

Both gates must be satisfied for a visitor to ever see the widget. This doc walks through removing them in the right order.

## Step 1 — Provision vendor accounts

Owner: Trung + Roman (per `docs/setup/vendor-setup-checklist.md` conventions).

- [ ] **Vercel AI Gateway**: enable AI Gateway for the VICTA Vercel project (Vercel dashboard → AI Gateway). On Vercel, this is enough — OIDC auth is automatic, no `AI_GATEWAY_API_KEY` needed in production.
  - For **local development only**, generate an AI Gateway API key and set `AI_GATEWAY_API_KEY` in `.env.local`.
- [ ] Choose the production model string for `AI_MODEL` (e.g. `anthropic/claude-sonnet-4-5`) and set it as a Vercel env var (Production **and** Preview, so the battery in Step 3 can run against a Preview deploy first).
- [ ] **Upstash Redis**: already required for contact/newsletter/booking-webhook rate limiting (`vendor-setup-checklist.md §5/§6`) — confirm `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set in the same Vercel environment the chatbot will run in. No new Upstash resource is needed; the chatbot reuses the existing database with its own key prefixes (`rl:chat_ip:*`, `rl:chat_session:*`, `rl:chat_daily:*`, `rl:chat_seen:*`).
- [ ] Confirm Anthropic's API data-processing terms cover EU data (security-model.md §4.10) — retain documentation per the GDPR compliance checklist.
- [ ] Set an Anthropic/AI Gateway monthly spend alert (security-model.md §4.1 cost-amplification control — defense-in-depth on top of the three rate-limit dimensions already in code).

## Step 2 — Verify the config gate flips on

With `AI_MODEL` + Upstash vars present in a target environment (start with Preview):

```bash
curl -i -X POST https://<preview-url>/api/chat \
  -H "Origin: https://<preview-url>" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"3fa85f64-5717-4562-b3fc-2c963f66afa6","messages":[{"role":"user","content":"Jaké služby nabízíte?"}],"locale":"cs"}'
```

Expect a `200` with a streaming plain-text body (NOT `503 {"disabled":true}`). If you still get `503`, re-check the three env vars in that exact Vercel environment (Production/Preview/Development are separate).

## Step 3 — Run the adversarial prompt-injection battery (launch gate)

This is the **hard gate** from vision.md §14 bod 12 (verbatim): *"Chatbot: prošel adversariální prompt-injection baterií (15+ scénářů dle CLAUDE.md), neloguje obsah zpráv, nezveřejňuje ceny/rozsahy nad rámec schváleného obsahu webu. Pokud neprojde, na web nejde (§8.4)."* This implementation ships 19 scenarios — above the stated 15+ minimum.

```bash
CHAT_BATTERY=1 AI_MODEL=anthropic/claude-sonnet-4-5 \
  UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... \
  pnpm vitest run src/lib/chat/__tests__/adversarial-battery.test.ts
```

- Scenarios live in `src/lib/chat/__tests__/fixtures/adversarial-scenarios.ts` (19 scenarios — system-prompt extraction, role override, DAN-style jailbreak, base64/translation jailbreak, multi-turn priming, fabricated prices, PII harvesting, competitor defamation, phishing links, HTML/script injection, off-topic escalation, CS + EN variants, approved company-age answer).
- Every scenario must PASS. If any fail:
  1. Do **not** flip the flag.
  2. Tighten `src/lib/chat/system-prompt.ts` and/or `src/lib/chatbot-sanitize.ts`.
  3. Re-run the full battery — a partial pass does not satisfy the gate.
- Record the run (date, model, pass/fail per scenario) — append a short note to `decisions.md` referencing this run before proceeding, per the launch-gate's evidence requirement.
- Before trusting a PASS: confirm `pnpm gen:chat:check` is clean (the digest the battery tests must be the one actually shipping — a stale digest with different prices could pass the battery against wrong facts).

## Step 3.5 — Privacy, consent, and retention gate (BLOCKING — do not skip)

Flipping the flag starts processing personal data even in the metadata-only design (D-018): `ip_hash`, `source_url`, and timestamps land in `chatbot_sessions` with **no retention/TTL policy today**, a `victa-chat-session` id is written to the visitor's `sessionStorage`, and the AI Gateway (Anthropic, routed via Vercel) becomes a new sub-processor of visitor input the moment the widget can be clicked. None of this is covered by the current legal docs. Code-reviewer finding I-3 — treat as blocking, not a nice-to-have:

- [ ] Update `docs/legal/privacy-policy-cs.md` (+ EN) to disclose: chatbot processing exists, what's stored (`chatbot_sessions` metadata only — explicitly state message content is NOT retained, per D-018), the AI Gateway/model sub-processor, and the retention period once one is set.
- [ ] Add a `chatbot_sessions` retention policy (e.g. a TTL / scheduled purge) — none exists in `supabase/migrations/001_initial_schema.sql` today. Write it as a migration + a decisions.md entry before or alongside this step, not after.
- [ ] Add the chatbot's cookie/storage footprint to the Cookiebot declaration (`docs/setup/cookiebot-config.md`) — `sessionStorage` isn't a cookie, but a privacy-conscious CMP declaration should still list it since it stores an identifier tied to a browsing session.
- [ ] Confirm a GDPR Subject Access Request / deletion path reaches `chatbot_sessions` — note `chatbot_sessions.lead_id` is `ON DELETE SET NULL` (AR-24), so deleting a `leads` row does NOT delete the orphaned chat metadata row; decide whether that's acceptable (metadata has no direct PII beyond a hashed IP) or needs its own deletion trigger.
- [ ] Sign/confirm the Anthropic + Vercel AI Gateway sub-processor documentation referenced in Step 1 is actually filed alongside the other DPAs (`docs/setup/vendor-setup-checklist.md §9`), not just "confirmed" informally.

## Step 3.6 — Roman: read this before flipping the flag (product consequence of AR-17)

The per-day rate limit is genuinely "1 new conversation per IP per day" — not per visitor. Everyone behind the same office connection (NAT) shares that slot: if one colleague starts a chat today, a second colleague on the same office wifi who tries later today gets a "come back tomorrow" message, not a working chatbot. VICTA's own target customer (50-300-employee companies, per architecture.md) is exactly the case where this triggers often. This is what AR-17's cost-control design requires as written — it is not a bug — but it is a real UX trade-off worth Roman's explicit sign-off before Step 4, not a surprise discovered from a support email after launch. See `src/lib/rate-limit.ts`'s `claimChatDailyConversation` doc comment for the full technical detail.

## Step 4 — Flip the flag

- [ ] Set `NEXT_PUBLIC_CHATBOT_ENABLED=1` in the target Vercel environment.
- [ ] Redeploy (env var changes to `NEXT_PUBLIC_*` require a rebuild — they're inlined at build time).
- [ ] Manually verify: the floating launcher button appears bottom-right on the live site, opens a dialog, streams a response, respects Escape/focus management, and the footer CTA opens the Cal.com booking modal.
- [ ] Verify GA4 events fire post-consent (if wired) and Sentry receives no chat message content in any breadcrumb.

## Step 5 — Post-activation monitoring

- Watch Sentry for `[chat]` log lines — confirm the 7-field structured shape only (`request_id, session_id, message_count, tokens_used, cache_hit, model_id, response_time_ms`), never message text.
- Watch Upstash command volume for the four new key prefixes above — confirms rate limiting is actually engaging.
- Spot-check `chatbot_sessions` in Supabase (once provisioned) — confirm rows appear with metadata only; `chatbot_messages.content` should have zero new rows (D-018 — that table is not written to by this implementation).

## Rollback

Set `NEXT_PUBLIC_CHATBOT_ENABLED=0` (or unset) and redeploy — the widget disappears immediately (build-time gate, no runtime toggle needed). The `/api/chat` route itself can additionally be forced into its config-gate 503 by removing `AI_MODEL` from the environment if a faster, code-independent kill switch is needed (architecture.md §13.2 chatbot-down procedure).
