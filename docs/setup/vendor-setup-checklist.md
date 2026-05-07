# Setup: master vendor checklist

**Last updated**: 2026-05-07
**Owner**: Roman (account creation + 2FA + DPA signing) · devops-engineer (env-var wiring + verification)
**Reference**: `requirements.md` REQ-I-001..021, REQ-C-006 · `decisions.md` D-005 (2FA gate) · `workplan.md` §0.2

This is the **master index** for Wave 2 vendor onboarding. Walk through each vendor in order. Tick the boxes as you go. When the steps say *"see detailed doc"*, open the linked file in `docs/setup/` for paste-ready code, Czech UI strings, and configuration snippets.

---

## Walk order (recommended sequence)

| # | Vendor | Phase needed | Free tier OK? | Time | Detailed doc |
|---|--------|--------------|---------------|------|--------------|
| 1 | DNS records (Namecheap) | Phase 0 | Already paid | 30 min | [`dns-records.md`](./dns-records.md) |
| 2 | Cookiebot (CMP) | Phase 1 | ✅ <100K pv/mo | 15 min | [`cookiebot-config.md`](./cookiebot-config.md) |
| 3 | Sentry (errors) | Phase 1 (first deploy) | ✅ 5K errors/mo | 10 min | [`sentry-config.md`](./sentry-config.md) |
| 4 | Resend (email) | Phase 2 | ✅ 3K emails/mo | 15 min | this doc §1 below |
| 5 | Cloudflare Turnstile (bot) | Phase 2 | ✅ unlimited | 10 min | [`turnstile-config.md`](./turnstile-config.md) |
| 6 | Upstash Redis (rate limit) | Phase 2 | ✅ 10K cmd/day | 10 min | this doc §5 below |
| 7 | Cal.com (booking) | Phase 2 | ✅ free tier | 15 min | [`calcom-event-types.md`](./calcom-event-types.md) |
| 8 | GA4 + Search Console | Phase 5 (pre-launch) | ✅ always free | 15 min | this doc §7 below |
| 9 | DPA signing checklist | Pre-launch | n/a | 30 min | this doc §9 below |

**Total time**: ~2.5 hours of Roman's clicking, spread across Phases 0, 1, 2, 5.

---

## Pre-flight: 2FA priority gate (D-005)

Before creating *any* vendor account, confirm 2FA is enabled on the upstream platforms. If it isn't, an attacker who phishes the Vercel or Supabase password can steal everything else.

- [x] Namecheap 2FA (already enabled by Roman)
- [x] GitHub 2FA (already enabled by Roman)
- [ ] Vercel 2FA (TOTP, **not** SMS — claude-rules AR-14)
- [ ] Supabase 2FA (TOTP)
- [ ] All vendors below: enable 2FA at account creation

---

## 1. Resend (email + newsletter)

**URL**: https://resend.com
**Account tier**: Free (3,000 emails/month, 100/day) — sufficient for launch
**Phase needed**: 2 (contact form Phase 2.4, newsletter Phase 2.5)
**DPA**: https://resend.com/legal/dpa

### Steps

- [ ] Sign up at https://resend.com with `hello@victaagency.com` (or Roman's primary work email — easier 2FA recovery)
- [ ] **Enable 2FA immediately** (Settings → Security → Two-factor authentication, TOTP via authenticator app)
- [ ] Add domain `victaagency.com`: Domains → Add domain → enter `victaagency.com` → region `eu-west-1` (Ireland — closest to Frankfurt)
- [ ] Resend will display **3 DKIM CNAME records + 1 SPF TXT + 1 DMARC TXT placeholder**. Copy these into Namecheap (see [`dns-records.md`](./dns-records.md))
- [ ] Wait for verification (typically 10-30 min after DNS propagates). Domain status must show "Verified" before any email can send
- [ ] Create **two API keys** (separation of concerns per security-model.md §4.10):
  - `victa-newsletter-prod` — full access (audience CRUD + send) — paste into Vercel env var `RESEND_API_KEY_NEWSLETTER`
  - `victa-contact-prod` — sending-only (no audience access) — paste into Vercel env var `RESEND_API_KEY_CONTACT`
- [ ] Note: `.env.example` currently has a single `RESEND_API_KEY_PROD` placeholder. Phase 2 build agent will split this into the two keys above when implementing forms (workplan.md §0.2 line 164).
- [ ] Create **Audience**: Audiences → Create audience → name "VICTA Newsletter (Czech)" → copy ID into Vercel env var `RESEND_AUDIENCE_ID`
- [ ] Set From address: `hello@victaagency.com` → Vercel env var `RESEND_FROM_EMAIL` (already in `.env.example`)
- [ ] **Sign DPA** (link above) — countersign and store PDF in Roman's private drive (NOT in repo per `devops-engineer.md` constraint)

### Required Vercel env vars after this section

```
RESEND_API_KEY_NEWSLETTER     (server-only, sensitive)
RESEND_API_KEY_CONTACT        (server-only, sensitive)
RESEND_AUDIENCE_ID            (server-only, not secret but not public-bundled)
RESEND_FROM_EMAIL             (server-only, not secret)
```

---

## 2. Cookiebot (cookie consent CMP)

**URL**: https://www.cookiebot.com
**Account tier**: Free (sites with <100K page views/month, single domain) — sufficient for launch
**Phase needed**: 1 (consent gate must exist before GA4 fires — REQ-C-003)
**DPA**: https://www.cookiebot.com/en/dpa/
**Detailed doc**: [`cookiebot-config.md`](./cookiebot-config.md)

### Steps

- [ ] Sign up at https://www.cookiebot.com
- [ ] **Enable 2FA**
- [ ] Add managed domain: `victaagency.com`
- [ ] Set primary language **Czech (cs)**, additional language English (en)
- [ ] Configure banner template + Google Consent Mode v2 — **see [`cookiebot-config.md`](./cookiebot-config.md) §2-3 for paste-ready Czech UI strings**
- [ ] Copy **CBID** (visible in dashboard → Settings → Your Cookiebot ID) → Vercel env var `NEXT_PUBLIC_COOKIEBOT_ID`
- [ ] **Sign DPA** (link above)

### Required Vercel env vars

```
NEXT_PUBLIC_COOKIEBOT_ID      (public-safe, embedded in <script> tag)
```

---

## 3. Cloudflare Turnstile (bot defense for forms)

**URL**: https://www.cloudflare.com/products/turnstile/
**Account tier**: Free, unlimited usage — recommended over hCaptcha/reCAPTCHA (no cookie, no fingerprinting, GDPR-friendly)
**Phase needed**: 2 (forms ship Phase 2.4 + 2.5)
**DPA**: https://www.cloudflare.com/cloudflare-customer-dpa/
**Detailed doc**: [`turnstile-config.md`](./turnstile-config.md)

### Steps

- [ ] Sign up at Cloudflare (free account — Turnstile works without a Cloudflare-proxied DNS zone, so no impact on Namecheap setup)
- [ ] **Enable 2FA**
- [ ] Turnstile dashboard → Add site — **see [`turnstile-config.md`](./turnstile-config.md) for full config**
- [ ] Copy site key + secret key → Vercel env vars
- [ ] **Sign DPA** (link above — Cloudflare's Customer DPA is a self-execute checkbox in account settings → Account Home → Configurations → Privacy)

### Required Vercel env vars

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY    (public-safe, embedded in widget)
TURNSTILE_SECRET_KEY              (server-only, sensitive)
```

---

## 4. Sentry (error tracking)

**URL**: https://sentry.io
**Account tier**: Developer (free) — 5,000 errors/month, 10,000 performance events/month — sufficient for launch
**Phase needed**: 1 (must capture errors from first preview deployment)
**DPA**: https://sentry.io/legal/dpa/
**Detailed doc**: [`sentry-config.md`](./sentry-config.md)

### Steps

- [ ] Sign up at https://sentry.io
- [ ] **Enable 2FA**
- [ ] Create organization (e.g., `victa`)
- [ ] Create project: name `victa-website`, platform **Next.js**, alert settings = "Alert me on every new issue"
- [ ] Copy DSN from Settings → Projects → victa-website → Client Keys → DSN
- [ ] Create auth token (Settings → Account → API → Auth Tokens) with scopes `project:releases`, `org:read`, `project:read` — used for source map upload
- [ ] Paste DSN + auth token into Vercel env vars
- [ ] **Sign DPA** (link above)
- [ ] Configure PII scrubbing — **see [`sentry-config.md`](./sentry-config.md) for paste-ready `beforeSend` hook (REQ-NF-046)**

### Required Vercel env vars

```
SENTRY_DSN                    (server-only — keep treated as sensitive)
NEXT_PUBLIC_SENTRY_DSN        (public-safe — same value, exposed to client)
SENTRY_AUTH_TOKEN             (sensitive — for source-map upload during build)
SENTRY_ORG                    (org slug, e.g., "victa")
SENTRY_PROJECT                (project slug, e.g., "victa-website")
```

---

## 5. Upstash Redis (rate-limit state)

**URL**: https://upstash.com
**Account tier**: Free — 10,000 commands/day, 256 MB max — sufficient for forms-only rate limiting (chatbot deferred per D-002 reduces Redis load to ~5% of original projection)
**Phase needed**: 2 (form rate limiting per workplan §0.7)
**DPA**: https://upstash.com/dpa

### Steps

- [ ] Sign up at https://upstash.com (use Google or GitHub SSO if Roman prefers — both are 2FA-secured upstream)
- [ ] **Enable 2FA on Upstash account** even if SSO is enabled
- [ ] Console → Redis → Create Database
  - Name: `victa-prod`
  - Region: **eu-west-1 (Ireland)** — closest Upstash region to Frankfurt; Upstash does not currently offer eu-central-1
  - Type: **Regional** (not Global — Global costs more, no benefit for our use case)
  - TLS: enabled (default)
  - Eviction: noeviction (default — we want INCR/EXPIRE to fail loudly if quota exceeded, not silently evict counters)
- [ ] Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Database → REST API tab → paste into Vercel env vars
- [ ] **Sign DPA** (link above) — the Upstash DPA is a self-service download from account settings → Compliance

### Required Vercel env vars

```
UPSTASH_REDIS_REST_URL        (server-only)
UPSTASH_REDIS_REST_TOKEN      (server-only, sensitive)
```

### Failure mode (REQ-I-020)

Forms **fail open** if Upstash is unreachable (don't block legitimate submissions just because rate-limit DB is down). Sentry alert fires so we know to investigate. Per security-model.md §4.3, this is acceptable for non-cost-amplifying endpoints. (The chatbot, when reactivated post-launch, will fail closed instead — see D-002.)

---

## 6. Cal.com (booking)

**URL**: https://cal.com
**Account tier**: Free cloud (cal.com/your-username) — sufficient for launch (4 event types, unlimited bookings, webhook included)
**Phase needed**: 2 (booking widget on `/spoluprace` ships Phase 2.2)
**DPA**: https://cal.com/dpa (or via Settings → Security → Sign DPA)
**Detailed doc**: [`calcom-event-types.md`](./calcom-event-types.md)

### Steps

- [ ] Sign up at https://cal.com — choose username (recommended `victa` → booking URL `cal.com/victa`)
- [ ] **Enable 2FA**
- [ ] Set timezone: **Europe/Prague**
- [ ] Configure availability windows (Roman's working hours)
- [ ] Create 4 event types — **see [`calcom-event-types.md`](./calcom-event-types.md) §2 for paste-ready Czech titles, descriptions, booking questions**
- [ ] Configure webhook → `/api/booking-webhook` — **see [`calcom-event-types.md`](./calcom-event-types.md) §3**
- [ ] Copy webhook signing secret → Vercel env var `CALCOM_WEBHOOK_SECRET`
- [ ] Customize email templates (Czech) — **see [`calcom-event-types.md`](./calcom-event-types.md) §5**
- [ ] **Sign DPA** (link above)

### Required Vercel env vars

```
CALCOM_WEBHOOK_SECRET             (server-only, sensitive)
NEXT_PUBLIC_CALCOM_USERNAME       (public — used to construct embed URL)
```

---

## 7. Google Analytics 4 + Search Console

**URL**: https://analytics.google.com + https://search.google.com/search-console
**Account tier**: Free always
**Phase needed**: 5 (analytics verification before launch, REQ-I-004 + REQ-I-005)
**DPA**: Accepted in GA4 admin (Account → Account settings → Data sharing settings → tick "Data Processing Terms")

### Steps

- [ ] Sign in to Google with **Roman's primary Google account** (must NOT be a Google Workspace account owned by a third-party agency — REQ-I-004)
- [ ] **Enable 2FA on Google account** (Security → 2-Step Verification, TOTP via authenticator)
- [ ] Create GA4 property: Admin → Create Property → name `VICTA — victaagency.com` → reporting time zone `Europe/Prague` → currency `CZK`
- [ ] Create Web data stream: URL `https://victaagency.com`, name `VICTA web`
- [ ] Copy Measurement ID (`G-XXXXXXXXXX`) → Vercel env var `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- [ ] Configure data retention: Admin → Data Settings → Data Retention → **14 months** (max under GDPR consent-mode setup)
- [ ] Enable IP anonymization: Admin → Data Streams → click stream → Configure tag settings → Define internal traffic / IP anonymization (anonymized by default in GA4 but verify)
- [ ] Accept GA4 Data Processing Terms: Admin → Account → Account settings → Data sharing settings → tick all DPA boxes
- [ ] Configure Consent Mode v2 — handled by Cookiebot integration (see [`cookiebot-config.md`](./cookiebot-config.md) §4 for the gtag wrapper)

### Search Console steps

- [ ] Add property: **Domain property** type (preferred — covers all subdomains + www) → enter `victaagency.com`
- [ ] Verify via DNS TXT record — Google provides a TXT value, paste into Namecheap (see [`dns-records.md`](./dns-records.md) §1.5)
- [ ] After DNS propagates and verification succeeds: Sitemap → Add new sitemap → enter `https://victaagency.com/sitemap.xml`
- [ ] Add `r.trung@victaagency.com` (or Roman's preferred admin email) as Owner

### Required Vercel env vars

```
NEXT_PUBLIC_GA4_MEASUREMENT_ID    (public)
```

---

## 8. Vercel + Supabase (already provisioned — verification only)

These are already set up but verify a few items before Phase 2 starts.

### Vercel checks

- [ ] Project region in `vercel.json`: `"regions": ["fra1"]` (AR-13)
- [ ] 2FA enabled on Roman's Vercel account (TOTP)
- [ ] Custom domain `victaagency.com` added in Vercel project → Settings → Domains
- [ ] DPA accepted: https://vercel.com/legal/dpa (Vercel auto-applies for Pro/Team — for free Hobby, Roman accepts terms at signup; the platform DPA is included in standard ToS)

### Supabase checks

- [ ] 2FA enabled on Roman's Supabase account
- [ ] Project region: Frankfurt (eu-central-1) — visible in project Settings → General
- [ ] All 8 tables migrated; RLS enabled on each (verify with: SQL editor → `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';` — every row should show `rowsecurity = t`)
- [ ] DPA signed: https://supabase.com/dpa — countersigned PDF stored in Roman's private drive

---

## 9. DPA signing checklist (REQ-C-006 — 10 vendors at launch)

Per D-003 (Path B invoice via Roman's accounting tool), Fakturoid is removed. Per D-002 (chatbot deferred), Anthropic moves to post-launch. **Total: 10 DPAs at launch.**

Each DPA must be signed/accepted **before launch traffic begins**. Store countersigned PDFs in Roman's private drive (NEVER in the public GitHub repo per `devops-engineer.md` constraint). Maintain a one-line note per DPA in Roman's private compliance log: `vendor | URL | date signed | location of PDF`.

| # | Vendor | DPA URL | Signed? | Date | Notes |
|---|--------|---------|---------|------|-------|
| 1 | Vercel | https://vercel.com/legal/dpa | [ ] | | Auto-included in ToS for Hobby; explicit DPA available for Pro |
| 2 | Supabase | https://supabase.com/dpa | [ ] | | Self-execute PDF; requires legal entity name |
| 3 | Resend | https://resend.com/legal/dpa | [ ] | | Self-execute via account |
| 4 | Cal.com | https://cal.com/dpa | [ ] | | Available in Settings → Security → Sign DPA |
| 5 | Cookiebot | https://www.cookiebot.com/en/dpa/ | [ ] | | Self-execute PDF |
| 6 | Cloudflare | https://www.cloudflare.com/cloudflare-customer-dpa/ | [ ] | | Auto-applies once accepted in dashboard |
| 7 | Sentry | https://sentry.io/legal/dpa/ | [ ] | | Self-execute via Settings → Legal & Compliance |
| 8 | Upstash | https://upstash.com/dpa | [ ] | | Available in account settings → Compliance |
| 9 | Google (GA4) | Accept in GA4 Admin → Account settings → Data sharing | [ ] | | Tick all DPA boxes |
| 10 | Namecheap (registrar) | https://www.namecheap.com/legal/general/agreements/ | [ ] | | Auto-accepted at registration; verify by re-reading current ToS |
| — | ~~Anthropic~~ | DEFERRED post-launch (chatbot deferred D-002) | n/a | n/a | Sign when chatbot reactivates |
| — | ~~Fakturoid~~ | REMOVED (D-003) | n/a | n/a | Roman uses own accounting tool |

---

## Cross-reference

- **Env vars**: This checklist enumerates every env var to be added to Vercel. Maintain `/.env.example` as the canonical names list (already created Wave 1). Update `/docs/claude/env-vars.md` description table after every vendor added (devops-engineer.md "How you work" item 4 — three-file lockstep).
- **Phase 0 workplan tracking**: As each vendor is provisioned, tick the matching item in `workplan.md` §0.2 / §0.4 / §0.7 / §0.8 / §0.9 / §0.10. Don't update workplan during build — update immediately after the vendor task completes (devops-engineer.md item 8).
- **Decision log**: If any non-obvious choice is made during setup (e.g., picked one Upstash region over another for a documented reason), append to `decisions.md` per claude-rules.md.

---

## When you finish

After all 10 vendors are provisioned, all 10 DPAs are signed, and all env vars are pasted into Vercel:

- [ ] Run secret-grep audit locally: `grep -r "NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*TOKEN" . --include="*.{ts,tsx,js,jsx}"` → must return zero results (security-model.md §4.1, AR-09)
- [ ] Trigger preview deploy on Vercel; confirm build succeeds with all env vars resolved
- [ ] Walk the post-deploy smoke-test list (devops-engineer.md "What you do" item 8 / REQ-O-012)
- [ ] Mark Phase 0 §0.2 complete in `workplan.md`
- [ ] Confirm Roman has access to a single private location with all 10 countersigned DPA PDFs

You're ready for Phase 1 build.
