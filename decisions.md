# Decisions Journal: VICTA

This file records non-obvious implementation decisions made by build agents.
Read by the orchestrator on startup to give all agents cross-session continuity.

**Format:** Append new entries at the bottom. Never edit or delete existing entries.

---

## D-001 · Design system locked (2026-05-06)

**Decision**: Design tokens locked via Roman's choice in parallel design-exploration session.

**Combination signature**: `Inter Tight · indigo · grid · medium · left · 500 · normal`

**Canonical source**: `docs/design-exploration/design-decision.md` (visual contract for Phase 1B + Phase 4)

**Locked tokens**:
- Typography: Inter Tight (headlines + body) + Geist Mono (mono/data/code)
- Primary accent: Indigo `#3730A3` (light) / `#7367E5` (dark)
- Background pattern: 40×40px subtle grid at 4% opacity, radial mask
- Density: Medium (96-128px section padding desktop)
- Alignment: Left
- Headline weight: 500
- Light bg `#FAFAFA` / Dark bg `#0A0B0E`
- WCAG AA verified all critical pairs (AAA on key text/bg)
- Czech typography rules applied (uvozovky „...", em-dash, nbsp after k/s/v/z/o/u/i/a)

**Rendered preview**: `docs/design-exploration/locked-preview.html` (full page: hero + services + audit pricing + footer)

**Hand-off**: Phase 1B `architect` integrated into `architecture.md` §7.1 (LOCKED tokens). Phase 4 `frontend-developer` translates to `tokens/light.css` + `tokens/dark.css` + tailwind.config.

**Reason**: Roman ran a structured design exploration with `huashu-design` + Tweaks mixer (visual-companion-v2.html, ~14k combinations) and locked this combination. WCAG verified, Czech typography verified. Locked-preview rendered as proof-of-design.

## D-002 · Chatbot deferred to post-launch (2026-05-07)

**Decision**: AI chatbot moved out of launch scope. Site launches without chatbot.

**Reason**: Roman's strategic call — focus launch energy on the 13 other Concrete Success criteria; activate chatbot post-launch as first enhancement.

**Affected**: SC-03 deferred; Phase 3 (entire) → post-launch backlog; Anthropic DPA + key creation deferred; chatbot adversarial test suite deferred.

**Preserved for post-launch reactivation**: architecture.md §7 (chatbot architecture), AR-01/AR-15..AR-19 (chatbot rules), Supabase tables `chatbot_sessions` + `chatbot_messages` (schema migrated, no rows yet), all chatbot REQs in requirements.md, full chatbot spec in spec.md §7.

## D-003 · Path B invoice via Roman's existing accounting tool (2026-05-07)

**Decision**: Paid audit payments via Path B (invoice/bank transfer). Roman uses his **existing accounting program** (no Fakturoid integration).

**Reason**: Roman has established invoicing workflow. Adding Fakturoid integration would create unnecessary tooling overhead.

**Affected**: REQ-C-006 (Fakturoid removed from DPA list — 11 → 10 launch DPAs). `booking_events.invoice_id` becomes free-form text reference into Roman's tool. `booking_events.invoice_status` updated by Roman via Supabase Studio (no admin endpoint at launch).

## D-004 · Public GitHub repo + standard secrets pattern (2026-05-07)

**Decision**: VICTA repo is **public on GitHub** (free unlimited Actions credits on public repos).

**Reason**: GitHub Actions free credits exhausted on private repos (limited tier). Public repo unlocks unlimited Actions; standard secrets-management pattern keeps API keys secure.

**Pattern**:
- `.env*` in `.gitignore` (verified before first push)
- `.env.example` only placeholders ("your-X-here")
- Production secrets in **Vercel env vars** (encrypted, scoped per environment)
- CI test secrets in **GitHub Actions Secrets** (encrypted, not in logs)
- Pre-commit hook: `gitleaks` with VICTA-specific patterns (`sk-ant-`, `re_`, `sb-`, etc.)
- GitHub Secret Scanning + Push Protection enabled (free on public repos)
- Anthropic test key separate from production with €5/mo cap

**Production secrets NEVER in GitHub Secrets** — only in Vercel env vars.

## D-005 · 2FA priority gate (2026-05-07)

**Decision**: 2FA enforced on tiered priority basis, not all-at-once.

**Status**:
- ✅ Namecheap (already enabled by Roman)
- ✅ GitHub (already enabled by Roman)
- ⏳ **Before first deploy**: Vercel + Supabase (Roman + I together)
- ⏳ **Before launch traffic**: Resend, Cal.com, Cookiebot, Sentry, Upstash, Google (GA4)
- ❌ Anthropic deferred (chatbot post-launch)

**Reason**: Pragmatic prioritization. Namecheap (DNS hijack) + GitHub (supply chain) are most critical; Roman already has them. Vercel + Supabase = highest infra risk during dev (env var leak, deploy hijack); enabled before any deploy. Lower-stake vendors deferred to launch traffic milestone.

## D-006 · CSP shipped as Report-Only through Phase 4; enforced in Phase 5 (2026-05-07)

**Decision**: `vercel.json` uses `Content-Security-Policy-Report-Only` (not `Content-Security-Policy`) from Wave 1 through end of Phase 4.

**Enforcement plan**: Phase 5 pre-launch QA task — after observing zero CSP violations on Vercel preview deployments (violations surface in Sentry CSP reporting endpoint), change the header key to `Content-Security-Policy`. Requires Roman sign-off before the header change ships to production.

**Reason**: Shipping an enforced CSP before all third-party integrations (Cookiebot, Cloudflare Turnstile, Cal.com embed, GA4 post-consent) are exercised on a real preview URL risks breaking the site silently. Report-only mode captures violations without breaking anything. Architecture.md §8.2 and devops-engineer.md §8.3 specify this pattern explicitly. AR-20 requires all CSP exceptions to be documented before enforcement.

**Current report-only CSP exceptions and justifications**:
- `script-src 'unsafe-inline'`: Required by next-themes inline style injection and Cookiebot script loading pattern. To be replaced with nonce strategy in Phase 5 if next-themes 15 supports it (architecture.md §8.2 note).
- `script-src https://consent.cookiebot.com https://consentcdn.cookiebot.com`: Cookiebot CMP (REQ-I-014, OI-B).
- `script-src https://www.googletagmanager.com`: GA4 via GTM, loaded only post-consent (architecture.md §8.2 GA4 note).
- `script-src https://challenges.cloudflare.com`: Cloudflare Turnstile widget (REQ-I-013).
- `img-src https://imgsct.cookiebot.com`: Cookiebot consent pixel.
- `img-src https://www.google-analytics.com`: GA4 measurement pixel, post-consent.
- `connect-src https://consent.cookiebot.com https://www.google-analytics.com`: CMP API + GA4 reporting.
- `connect-src https://*.supabase.co`: Supabase Postgres (server-side only via Functions, but listed defensively).
- `connect-src https://*.upstash.io`: Upstash Redis REST API (server-side only, listed defensively).
- `frame-src https://app.cal.com`: Cal.com booking embed (BK-01, OI-C, architecture.md §8.2).
- `frame-src https://challenges.cloudflare.com`: Cloudflare Turnstile iframe.

**HSTS note**: `preload` is intentionally absent from the HSTS header. Post-launch task at day 60+: add `preload` and submit to hstspreload.org (architecture.md §8.3, security-model.md §7 Rule 5, devops-engineer.md "What you don't do").

## D-007 · Accent color updated indigo → ferro-rust + density updated medium → whitespace (2026-05-07)

**Decision**: Final locked combination updated from `Inter Tight · indigo · grid · medium · left · 500` to `Inter Tight · ferro-rust · grid · low (whitespace) · left · 500`.

**Reason**: Roman re-tested combinations in `visual-companion-v2.html` Tweaks mixer. Ferro-rust (#B53C16) gives warmer, more distinctive editorial feel vs cool corporate-tech indigo. Whitespace (low) density gives more breathing room and editorial mood — closer to atolsolutions.cz reference.

**New token values**:
- Light accent: `#B53C16` (was `#3730A3`)
- Dark accent: `#FF6B3A` (was `#7367E5`)
- Section padding: 120px y / 56px x (was 64px / 48px)
- Content gap: 36px (was 24px)
- Headline scale: 1.1× (was 1×)

**Affected**: `src/styles/globals.css`, `architecture.md` §7.1, all CTA + accent visuals on every page.

**Verification**: `docs/design-exploration/visual-companion-v2.html` — selected combination preview matches new tokens.

**Supersedes (does not delete)**: D-001's combination signature. D-001 remains as historical record of first lock; D-007 supersedes for runtime token values.

**Atol-style stack-on-scroll**: Same revision adds CSS `position: sticky; top: 0` to each `<OfferingSection>` so the three offering blocks stack on top of each other as the user scrolls, matching atolsolutions.cz reference. Sections must keep opaque `bg-bg` so stacking obscures the previous block. No JS animation library — pure CSS sticky.


## D-008 · REVERTED — taste-skill redesign rolled back (2026-05-25)

**Decision**: D-008 (taste-skill production redesign: Geist + slate/lavender + mesh orbs + Editorial Split + Asymmetrical Bento + Newsreader italic + Double-Bezel cards + pill CTAs) is reverted. D-007 reinstated as the active production design system.

**Reason**: After living with D-008 on `main` for ~18 days (2026-05-07 to 2026-05-25), Roman determined the fonts and layout elements do not match the intended VICTA brand feel. The original D-007 combination (Inter Tight, ferro-rust, 40×40 grid, single-col left, custom locked-preview homepage, OfferingSection sticky stack, PricingCard, dedicated MegaMenu component) is the canonical brand expression.

**Implementation**: New branch `revert/d008-to-d007-pre-may7` was hard-reset to commit `2f03059` (last commit before `d922d86` — the D-008 migration commit on 2026-05-07 at 17:59 CEST). Branch opened as a PR for review and explicit merge into `main`.

**Scope of revert** (77 commits removed from main when branch merges):
- Design system: `docs/claude/design-decisions-v2.md` (deleted), `globals.css` reverts to ferro-rust + grid
- Layout primitives: `EditorialSplit`, `AsymmetricalBento`, `BentoShell`, `VisualCanvas`, `BodyOrbs`, `SectionHeader`, `StickyTierStack`, `MagneticIslandNav` (all removed)
- Restored components: `OfferingSection`, `PricingCard`, `MegaMenu`, `ThemeProvider`, `ThemeToggle`, `anti-flash.ts`
- Restored sandbox: `/redesign-preview` route + `preview-client.tsx`
- Detail page routes (`/sluzby/[slug]`, `/reseni/[slug]`, `/odvetvi/[slug]`) and their 31 translated content sets — **removed** in revert (they were authored against D-008 templates). To be re-added in a future phase against D-007 templates.
- Phase 3 page-body migrations (taste-skill bodies for o-nas, blog, kontakt, spoluprace, cookies, ochrana-soukromi) — all reverted to D-001/D-007 scaffold versions.

**Content note**: Bod 11 (hero tags) and Bod 12 (hodnoty) merged from `content-only` branch (PR #27) used D-008 styling. Their translation strings can be cherry-picked back into D-007 templates if Roman wants to preserve them — flagged for a follow-up task, not done automatically.

**Supersedes**: This entry supersedes the D-008 lock declaration that lived in `docs/claude/design-decisions-v2.md` (now deleted). D-007 is the active design system again. Inter Tight is unlocked-for-use, Geist is no longer the locked sans.

**Re-decision path**: If Roman wants to re-attempt a taste-skill / soft-skill direction later, open a new D-### entry and a fresh feature branch — do not resurrect the D-008 commits, since they conflict with restored D-007 components.


## D-009 · D-008 REVIVED — retroactive record (2026-07-20, event 2026-05-26)

**Decision**: The D-008 taste-skill design system is the ACTIVE production design. Commit `f114e34` (2026-05-26, branch `claude/d008-revival-may11`) revived D-008 wholesale per Roman's instruction dated 2026-05-11 — the instruction predated the 2026-05-25 revert but was executed after it. All subsequent work (content restoration, detail routes `/sluzby|reseni|odvetvi/[slug]`, booking wiring, contact-flow v2) is built on revived D-008, and production victaagency.com deploys from this branch.

**Why this entry exists**: The D-008 entry above instructed "do not resurrect the D-008 commits" and no decision record was written when the revival happened anyway — so this file misrepresented the live design system for ~8 weeks. Recorded retroactively during contact-flow v2 (2026-07-20). D-007 is NOT the active design; treat the "Scope of revert" list above as historical only.


## D-010 · Booking embed = embed.js modal; Cal.com slugs canonical in code (2026-07-20)

**Decision**: Booking uses the raw Cal.com `embed.js` + `window.Cal('modal')` API via the single `useCalModal` hook — NOT `@calcom/atoms` as older docs/workplan §2.2 specified. Resolves spec.md OQ-07 (chosen: modal, shipped in commit `0428f52`).

**Slug convention**: `src/config/booking.ts` (`CAL_EVENTS`) is the single source of truth: `tier-1-audit`, `tier-2-audit`, `tier-3-audit`, `free-scoping-call`. Frontend CTAs, the `/api/booking-webhook` tier mapping, and `docs/setup/calcom-event-types.md` all derive from it (pre-v2 they disagreed three ways and paid tiers had no booking path). Paid tier cards on `/spoluprace` now open per-tier Cal.com events with contact-form fallback. CSP `script-src` includes `https://app.cal.com` (the embed script; `frame-src` already allowed it).

**Cleanup**: `CalBookingWidget`, `BookingCta` (parallel dead implementations) and the orphaned `Button` component were deleted.


## D-011 · Contact-flow v2: resilience policies + conversion IA (2026-07-20)

**Context**: Production forms were non-functional (Turnstile token never reached react-hook-form state → every submit failed silently; optional selects rejected their own default value). Full analysis in `docs/contact-flow-v2.md`.

**Decisions**:
1. **Turnstile provisioning-aware skip**: when `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are absent or not real Cloudflare keys (real keys start `0x`–`3x`), verification is skipped (client supplies sentinel token, server logs a warning) so forms work before provisioning; with real keys both sides are fail-closed as before. Honeypot + rate limiting always active.
2. **Partial-failure delivery**: a form submission succeeds if at least one sink (Resend email OR Supabase row) persisted it; partial failures raise a Sentry warning. Hard 500 only when both fail.
3. **Unified CTA taxonomy**: "Rezervovat audit" (paid tiers / spoluprace), "Domluvit konzultaci" (free scoping call — always a real booking trigger, never a plain anchor), newsletter as the low-intent path (footer sitewide + /kontakt + /blog). The /kontakt hero no longer links to /spoluprace#audit (loop removed); its booking CTA falls back to the on-page form (`#form`).
4. **routes.ts slug sync**: sitemap/robots/llms.txt slug arrays now mirror `content/cs/strings/common.json` (they had a third, diverged slug set → sitemap listed 404s).
5. **GA4**: `booking_initiated` fires only on real modal opens; unprovisioned fallback tracks `booking_fallback_contact`.

