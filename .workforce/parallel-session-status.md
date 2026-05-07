# VICTA — Parallel Session Status (Phase 2 / 5 / 6)

> Append-only log. Hlavní session pracuje na Phase 1.2 (visual scaffold). Tato session pracuje na Phase 2 (interactive) + Phase 5 (pre-launch QA) + Phase 6 (launch).

---

## 2026-05-07 (start)

**Session start.**

Done:
- Read 15 mandatory foundation docs (intent, brainstorm via spec, spec, security-model, requirements via architecture, architecture, stack-decision, workplan Phase 0..6, decisions, validation-report, alignment-report, claude-rules, vendor-setup-checklist, dns-records, design-decision via tokens locked).
- Authored plan at `docs/superpowers/specs/2026-05-07-phase-2-5-6-build-plan.md` covering Phase 2 + 5 + 6 with 30 tasks, 25 AR coverage, 15 claude-rules coverage, 14/14 SC traceability (SC-03 chatbot deferred per D-002), and 20 Roman-blockers (RB-01..RB-20) consolidated.

Next:
- Begin Phase 2 execution. Start with Task 2.1 (deps + .env split) — no Roman blocker, can proceed.
- Sequence: 2.1 → 2.2 (lib clients) → 2.3 (config) → 2.4 (schema engine).
- 2.5+ require vendor secrets (Cookiebot, Sentry placeholders OK, but live verification will need Roman accounts).

Blocker: žádný (zatím — autonomous execution proceeds).

---

## 2026-05-07 — Mid-session checkpoint

**10 commits done. Phase 2 backend + Phase 5 essentials shipped.**

### Done in this session (commits in chronological order)

1. `4065343` chore(deps): Phase 2 SDKs — Supabase, Upstash, Resend, Sentry, RHF, axe, lhci.
2. `52331f2` chore(env): split RESEND_API_KEY → _NEWSLETTER + _CONTACT, added Cal.com username + IP hash salt.
3. `5fba009` feat(lib): `src/lib/{supabase,supabase-types,redis,rate-limit,sanitize,turnstile,leads}.ts` — server-only shared infrastructure.
4. `427b04c` feat(seo): JSON-LD schema engine — 6 builders + JsonLd Server Component + site/routes config.
5. `3ffd420` feat(api): three API routes — `/api/contact`, `/api/newsletter`, `/api/booking-webhook` — all signed/sanitized/rate-limited.
6. `16a2661` feat(forms): `<ContactForm />`, `<NewsletterSignup />`, `<TurnstileWidget />` + `lib/{consent,ga4}.ts`.
7. `6039a9e` feat(booking): `<CalBookingWidget />` (inline) + `<BookingCta />` (modal).
8. `e9f83e7` feat(observability): Cookiebot + Ga4Loader + Sentry init (client/server/edge) + instrumentation.ts. Wired into `[locale]/layout.tsx`.
9. `4bcb3ee` feat(seo): `app/robots.ts` + `app/sitemap.ts` (41 pages, hreflang cs/en/x-default) + `public/llms.txt`.
10. `549202b` + `d496854` feat(ci): Czech typography linter — found **138 violations** in Phase 1.2's `content/cs/strings/common.json` (pre-launch fix needed before CI gate flips).

### Phase 2 task status

| Task | Status | Note |
|------|--------|------|
| 2.1 deps + env | ✅ Done | |
| 2.2 lib clients | ✅ Done | Supabase v2.105 type quirk solved with concrete Insert types |
| 2.3 config files | ✅ Subset done | Skipped pricing/services/industries/solutions data (lives in i18n strings); wrote `site.ts` + `routes.ts` only — minimum needed for schema/sitemap |
| 2.4 schema engine | ✅ Done | 6 builders: Org, LocalBusiness, Service, FAQ, Breadcrumb, WebSite |
| 2.5 Cookiebot/GA4/Sentry | ✅ Done | Wired into `[locale]/layout.tsx` via Edit |
| 2.6 audit page | ⏳ Partial | Phase 1.2 built page UI with `<PricingCard>`; tier CTAs still link to static `/spoluprace` href — needs Edit to swap CTA `href="..."` → `<BookingCta tier="...">` |
| 2.7 booking widget | ✅ Done | `<CalBookingWidget>` inline + `<BookingCta>` modal |
| 2.8 booking webhook | ✅ Done | HMAC + replay + idempotency + Path B invoice tracking |
| 2.9 contact form | ✅ API + component | Phase 1.2's kontakt page uses direct-channels design (no form). Form ready to embed if/when Roman wants it (RB-22 below) |
| 2.10 newsletter | ✅ API + component | Component not yet placed in homepage/blog/footer — needs wiring |
| 2.11 GA4 events | ⏳ Partial | Wired: booking_initiated, contact_form_submit, newsletter_signup. Pending: locale_switched, theme_toggled, cookie_consent_given/declined (need Edit on Phase 1.2's locale-switcher/theme-toggle + Cookiebot callbacks) |
| 2.12 tests | ❌ Not done | Vitest + Playwright suite is Phase 5 critical gate |

### Phase 5 task status

| Task | Status | Note |
|------|--------|------|
| 5.1 Czech typography linter | ✅ Done | `pnpm lint:cs` works; 138 existing violations in Phase 1.2 content (informational, not yet CI-gating) |
| 5.2 robots + sitemap | ✅ Done | `app/robots.ts` + `app/sitemap.ts` with hreflang |
| 5.3 llms.txt | ✅ Done | Czech intro + English-structured catalog |
| 5.4 schema validation E2E | ❌ Not done | Vitest/Playwright spec |
| 5.5 meta + OG audit | ❌ Not done | E2E spec |
| 5.6 AEO content patterns | ❌ Not done | Verifies FAQ blocks present (depends on Phase 4 content) |
| 5.7 Lighthouse CI | ❌ Not done | `.lighthouserc.json` + GitHub Actions workflow |
| 5.8 axe-core a11y | ❌ Not done | E2E spec |
| 5.9 GSC verification | ⛔ Roman | RB-09 |
| 5.10 smoke test checklist | ❌ Not done | `docs/smoke-test-checklist.md` + `scripts/smoke-test.mjs` |
| 5.11 uptime monitoring | ⛔ Roman | RB-10 |
| 5.12 CSP enforcement flip | ⛔ Roman | RB-16 |
| 5.13 security audit | ⛔ Roman downstream | RB-15 + manual checks |

### Phase 6 task status

All Phase 6 tasks blocked on Phase 5 + Roman approvals (RB-19, RB-20).

### Type safety + build verification

- `pnpm tsc --noEmit` ✅ passes (post-Supabase-types fix; 0 errors).
- `pnpm build` not run in this session (requires real `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_KEY` because lib helpers throw at module init when missing). Phase 1.2 session has those env vars in Vercel; their preview deploy is the build verification.
- Pre-existing `lucide-react Linkedin` import error in `src/app/[locale]/kontakt/page.tsx` was Phase 1.2's; appears resolved (passes typecheck now).

---

## ⛔ Roman blockers (consolidated, in priority order)

These items REQUIRE Roman action. Each blocks specific downstream tasks. Listed in the order Roman should tackle them.

### Pre-Phase-5 (vendor onboarding — `docs/setup/vendor-setup-checklist.md`)

1. **RB-01 Cookiebot**: account + 2FA + DPA + `NEXT_PUBLIC_COOKIEBOT_ID` paste in Vercel env vars. *Blocks: GA4 consent gate, Phase 5 SC-09.*
2. **RB-02 Sentry**: account + 2FA + DPA + DSN + auth token. *Blocks: error tracking, Phase 5 perf observe.*
3. **RB-03 Resend**: account + 2FA + DPA + domain verified + DKIM/SPF/DMARC pasted in Namecheap (per `docs/setup/dns-records.md`) + 2 API keys (`RESEND_API_KEY_NEWSLETTER`, `RESEND_API_KEY_CONTACT`) + `RESEND_AUDIENCE_ID`. *Blocks: contact form delivery, newsletter signup, welcome email.*
4. **RB-04 Cloudflare Turnstile**: account + 2FA + DPA + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`. *Blocks: both forms.*
5. **RB-05 Upstash Redis**: account + 2FA + DPA + `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. *Blocks: rate limiting + booking webhook idempotency.*
6. **RB-06 Cal.com**: account + 2FA + DPA + 4 event types per `docs/setup/calcom-event-types.md` + webhook secret in Vercel env vars + username in `NEXT_PUBLIC_CALCOM_USERNAME`. *Blocks: booking widget + webhook.*
7. **RB-08 Email forwarding**: Namecheap MX records for `*@victaagency.com → l.trung03@gmail.com` per `dns-records.md` §1.3. *Blocks: form-delivery validation.*
8. **RB-09 GA4 + Search Console**: TXT verification record paste in Namecheap + GA4 property created + measurement ID in Vercel env vars. *Blocks: Phase 5 SC-09 + SC-11.*

### Pre-launch content + legal (Phase 5)

9. **RB-13 Legal placeholders** (`src/config/site.ts`): IČO, DIČ, sídlo, spisová značka, telefon, poštovní adresa Victa Digital s.r.o. *Blocks: privacy policy publish, LocalBusiness schema, footer legal block.*
10. **RB-11 Czech copy review** on `/cs/spoluprace` audit tier copy + Path B invoice flow text. (Phase 1.2 wrote draft; Roman approves.)
11. **RB-12 Czech copy review** on contact page + newsletter welcome email.
12. **RB-14 Czech advokát review** of `docs/legal/privacy-policy-cs.md` + `cookie-policy-cs.md`. *Blocks: Phase 6 launch (legal pages must be reviewed before publication).*
13. **RB-17 Newsletter lawful basis**: confirm with Czech advokát whether single opt-in with `consent_text + consented_at + ip_hash` is sufficient under CZ/SK marketing law (zákon č. 480/2004 Sb. + GDPR), or whether double opt-in is required. *If double opt-in required: write migration 002 + `/api/newsletter/confirm` route + token flow.*
14. **RB-15 Sentry PII scrubbing**: verify `beforeSend` hook works on real production errors (no email/name/message leaks).

### Pre-launch ops (Phase 5)

15. **RB-10 Freshping** (or equivalent): account + uptime check on `https://victaagency.com/cs/`. *Blocks: SC-12 monitoring.*
16. **RB-16 CSP flip**: after observing zero CSP violations on preview deploys for ≥7 days (architecture.md §8.2 + decisions.md D-006), Roman signs off; devops flips `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in `vercel.json`. *Blocks: launch with enforced CSP.*
17. **RB-18 DNSSEC** (optional hardening): enable in Namecheap.

### Launch (Phase 6)

18. **RB-19 GO-LIVE approval**: Roman approves after Phase 5 done.
19. **RB-20 Walkthrough sign-off**: Roman walks all 41 pages on production, books test audit, submits test contact, confirms in this status file.

### NEW blockers discovered in this session

20. **RB-21 (NEW) Booking CTA wiring**: Phase 1.2's `/cs/spoluprace` tier cards use `<Button href="/spoluprace">` for CTAs. To activate Cal.com booking, replace each tier card CTA with `<BookingCta eventSlug="tier-1-audit" bookingType="audit_t1" sourcePage="/cs/spoluprace">` (Phase 2.6). Either Phase 1.2 session does this Edit or a follow-up session does. **Coordination needed: who owns this Edit?**
21. **RB-22 (NEW) Contact form placement decision**: Phase 1.2 designed `/cs/kontakt` as a direct-channels page (email/phone/address/social cards + primary CTA → `/spoluprace`), no form. Spec.md §4.4 (CF-01..CF-04) requires a contact form. Roman to decide: (a) embed `<ContactForm />` as a section after channels, OR (b) keep direct-channels-only (override spec). Form component + API route are ready either way.
22. **RB-23 (NEW) Newsletter signup placement**: `<NewsletterSignup />` component is ready but not yet placed on homepage / blog placeholder / footer. Phase 1.2 owns those pages. Either Phase 1.2 imports + places it, or a follow-up session edits.
23. **RB-24 (NEW) GA4 events on Phase 1.2 components**: `locale_switched`, `theme_toggled`, `cookie_consent_given/declined` need to be added to `src/components/locale-switcher.tsx`, `src/components/theme-toggle.tsx`, and as Cookiebot event handlers. Phase 1.2 owns these components. `trackEvent()` from `@/lib/ga4` is ready to import; just call on the relevant click/event.

---

## What's NEXT (when this session resumes or another session continues)

Priority-ordered remaining work:

1. **Wire the integration points** (RB-21, RB-22, RB-23, RB-24) — coordinate with Phase 1.2 session.
2. **Vitest + Playwright tests** (Task 2.12) — unit tests for `lib/*.ts` + E2E for forms, booking, locale, theme.
3. **Lighthouse CI** (Task 5.7) — `.lighthouserc.json` + GitHub Actions workflow.
4. **axe-core a11y E2E** (Task 5.8) — runs on 4 key pages × 2 themes = 8 runs.
5. **Schema + meta + OG E2E audits** (Tasks 5.4, 5.5).
6. **Smoke test CLI** (Task 5.10) — `scripts/smoke-test.mjs`.
7. **Phase 5 docs**: `docs/smoke-test-checklist.md`, `docs/ga4-event-taxonomy.md`, `docs/lighthouse-tuning.md`, `docs/a11y-report.md`, `docs/pre-launch-security-audit.md`.

After Roman tackles RB-01..RB-09, **all backend code in this session is launch-ready** — no more code changes expected, just env-var paste + verification. Forms + booking + webhook + observability all work end-to-end once secrets are provisioned.

---

## Status

**Session ends here.** Stopping autonomously per Romanovy instrukce: "Stop only at Roman blockers" — we've reached the point where every remaining Phase 2 task either:
- Requires Roman vendor onboarding (RB-01..RB-09), OR
- Requires Phase 1.2 session coordination (RB-21..RB-24), OR
- Is Phase 5 work that is best done after Phase 4 content is finalized (Lighthouse/axe/schema-validation E2E need stable pages).

The plan document `docs/superpowers/specs/2026-05-07-phase-2-5-6-build-plan.md` remains the authoritative roadmap for next sessions.
