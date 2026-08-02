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
2. **Partial-failure delivery** *(amended 2026-07-21 after adversarial review)*: applies to the **contact form only** — its submission succeeds if at least one sink (Resend email OR Supabase row) persisted it; partial failures raise a Sentry warning. The **newsletter is exempt**: the `newsletter_subscribers` consent-proof row (consented_at, consent_text, ip_hash — REQ-F-055) is the authoritative gate written FIRST; if it fails (non-duplicate), the route returns 500 and does NOT enroll the address in Resend or send the welcome email. Marketing enrollment without a consent record is a GDPR risk we do not take. Corollary: newsletter signup requires a provisioned Supabase.
   *(Also amended: the Turnstile skip is now symmetric-aware — keys are trimmed and validated via the shared `src/lib/turnstile-shared.ts` helper; if the PUBLIC site key looks real while the SECRET is missing/malformed (or vice-versa via the bypass sentinel), the server fails CLOSED with a Sentry error instead of silently accepting — the skip applies only when NEITHER side is provisioned.)*
3. **Unified CTA taxonomy**: "Rezervovat audit" (paid tiers / spoluprace), "Domluvit konzultaci" (free scoping call — always a real booking trigger, never a plain anchor), newsletter as the low-intent path (footer sitewide + /kontakt + /blog). The /kontakt hero no longer links to /spoluprace#audit (loop removed); its booking CTA falls back to the on-page form (`#form`).
4. **routes.ts slug sync**: sitemap/robots/llms.txt slug arrays now mirror `content/cs/strings/common.json` (they had a third, diverged slug set → sitemap listed 404s).
5. **GA4**: `booking_initiated` fires only on real modal opens; unprovisioned fallback tracks `booking_fallback_contact`.

---

## D-012 · Copy audit Vlna 2a: shared `common.ctaBand` i18n namespace (2026-08-02)

**Context**: `docs/audit/copy-rewrites.md` §1–§5,§8,§9 rollout (sitewide meta, homepage hero, /o-nas, /spoluprace, /kontakt, řešení balíčky, odvětví unsupported-number cleanup) plus the cross-cutting i18n-migration task from vision.md §11. Full scope: sitewide meta + `layout.tsx` description now sourced from `site.*` via `getTranslations` instead of a hardcoded string; homepage hero rewrite + removal of 13 dead `home.hero.*` keys (`visualTag`, `leadAudit*`, `leadConsult*`, `headlineLead/Accent` — confirmed zero renders via grep before deletion); `/o-nas` team section + "AI DRŽÍ DETAILY" value rewritten without the unsupported "3× faster" claim; `/spoluprace` hero repositions the audit as a product, not a sales gate; `/kontakt` response-time copy unified to "1 pracovní den" (previously contradicted itself: 1 day in one field, 2 days in another).

**Decisions**:
1. **`common.ctaBand` namespace** (`content/{cs,en not touched}/strings/common.json` → `common.ctaBand.*`): the CTA-band block ("Nejdřív bezplatný hovor." + body + "Chci konzultaci" + "Nebo rovnou placený audit →") was previously a literal, near-identical JSX string block copy-pasted across `service-body.tsx`, `solution-body.tsx`, `industry-body.tsx`, and the "Chci konzultaci" primary label was separately hardcoded in all hub bodies (`sluzby-body`, `reseni-body`, `odvetvi-body`), `o-nas-body`, `spoluprace-body`, and `blog-body`. All nine now read from `useTranslations('common.ctaBand')`. `bodySolution` uses an ICU placeholder (`{name}`) interpolated with `item.name.toLowerCase()` per solution. `nav.tsx`'s two "Chci konzultaci" instances were deliberately left out of scope (shared nav component, not named in the task).
2. **`oNas.sections.process.steps`**: the `PROCESS_STEPS` array (4 steps) moved from a local hardcoded const in `o-nas-body.tsx` into JSON — it's now Czech-typography-linted (it wasn't before, since the linter only scans `content/cs/**/*.json`+`.mdx`, not `.tsx`) and edits no longer require a code deploy.
3. **`blog.comingSoon.badge`**: replaces the `` `BLOG · ${t('comingSoon.label')}` `` string-concat pattern with one linted JSON key.
4. **Unsupported-number redactions** (vision §6/§8, R4 branch active): `odvetvi.items[].sections.*` — profesionalni-sluzby "30–40 %" → qualitative; zakaznicka-podpora "50–70 %" → qualitative + pilot-verification caveat; logistika "Zaplaceno za 6–12 měsíců" → outcome-without-number framing; vyroba "2 500 Kč za hodinu" (competitor pricing claim) → removed. Same pattern applied to `reseni.items[support].body` and its `SOLUTION_META[2].bentoBody` duplicate on `/reseni` (not explicitly named in the audit doc but same unverifiable "70 %" claim, visible on the same page — fixed for consistency). `offerings-data.ts` `INDUSTRIES_OFFERING` subtitles for výroba/finance/energetika/zdravotnictví de-emphasize regulatory acronym name-dropping (SAP/OEE, ČNB/DORA/AML, ERÚ, FotoFinder/HL7) per the same rule; the other 4 industries were untouched per spec.
5. **9 top-level `generateMetadata` additions** (P0-11): homepage, `/sluzby`, `/reseni`, `/odvetvi`, `/o-nas`, `/spoluprace`, `/blog` (description only — title already existed), `/cookies`, `/ochrana-soukromi`. All use `site.url` (not a hardcoded literal) for `alternates.canonical`, mirroring the detail-page pattern — and the two detail-page files (`sluzby/[slug]`, `reseni/[slug]`) were opportunistically switched from a hardcoded `https://victaagency.com` literal to `site.url` too while already being edited for item 6 below.
6. **Title-intent maps** (P1-20): `TITLE_INTENT: Record<string,string>` in `sluzby/[slug]/page.tsx` (18 entries) and `reseni/[slug]/page.tsx` (5 entries) replace the mechanical `` `${item.name} — VICTA` `` pattern with buyer-intent phrasing per seo-visibility.md §1/§3 clusters, falling back to `item.name` for any unmapped slug (none currently unmapped).

**NBSP gotcha for future edits**: `content/cs/strings/common.json` already contains real U+00A0 (NBSP) characters mid-sentence (Czech typography rule), and — discovered during this wave — so do several "hardcoded" CTA-band strings inside `service-body.tsx` / `solution-body.tsx` / `industry-body.tsx` / `reseni-body.tsx` that predate this change (never linted, since the linter only scans `content/cs/**`). NBSP is visually indistinguishable from a regular space in any editor/terminal, so a plain-space `old_string` in a find-replace will silently fail to match. When editing existing Czech strings in either location, extract the exact current bytes via `python3 -c "print(repr(...))"` first rather than retyping from a visual read.

---

## D-013 · Copy audit Vlna 2b: 18-service deep rewrite + hub H1 realignment (2026-08-02)

**Context**: `docs/audit/copy-rewrites.md` §7 (18 services in `sluzby.categories.*.items`) + `seo-visibility.md` §1 (pillar H1s) + the EN-stub positioning gate (V8). All 18 services now carry a bolest→řešení→výsledek `desc`, a `fit` sentence, and ≥2 FAQ entries (previously only 8/18 had `fit`/`faq`; 10 were desc-only). 3 exemplars (`ai-chatboti`, `weby-na-miru` desc, `seo`) deployed verbatim from the audit doc per its explicit "NASAĎ DOSLOVA" instruction; the other 15 authored fresh against the pain-point table in copy-rewrites.md §7.

**Decisions**:
1. **Exemplar desc length overrides the ~300-char meta-description guideline — flagged, not silently fixed.** copy-rewrites.md §7 gives two instructions that conflict for exactly 3 fields: "NASAĎ DOSLOVA" (deploy verbatim) for `ai-chatboti`/`weby-na-miru`/`seo` desc, vs. the general rule (§0/§1c) that `desc` doubles as `page.tsx`'s `description` and should stay ~150–300 chars. The exemplar desc texts as written are full paragraphs (526/556/474 chars). Resolution: literal content wins for these 3 named, pre-approved ("HOTOVÝ PŘEPIS") texts — they ship unedited — while the general length rule was enforced strictly on the 15 services this wave authored fresh (all landed 236–283 chars, comfortably under the 320 hard cap). Practical impact is limited to how much of the meta description Google displays in the SERP snippet (it truncates around ~155–160 chars regardless of source length); nothing breaks technically. Follow-up: if Roman/the audit owner wants these 3 trimmed for stricter SERP-snippet control, that's a scoped follow-up, not a Wave 2b blocker.
2. **NBSP convention confirmed empirically before writing any new copy**: grepped the existing file for `\xa0` adjacency around all 8 single-letter prepositions/conjunctions (k/s/v/z/o/u/i/a) — 505 instances place the NBSP *after* the preposition (binding it to the following word, e.g. `k\xa0prodeji`), only 3 counter-examples. All new/edited text in this wave follows the after-only convention to match house style and avoid unrelated diff noise on adjacent, untouched text.
3. **Editing technique**: bulk edits to `common.json` went through `json.load` → mutate → `json.dump(ensure_ascii=False, indent=2)`, verified beforehand to be a byte-identical round-trip of the untouched file (confirms the existing file has no exotic formatting `json.dump` would silently normalize). This avoids the Edit tool's `old_string`/`new_string` NBSP-invisibility trap called out in D-012 entirely for bulk changes — but the *insertion* side still needs care: an early draft of the helper script defined `NBSP = " "` by typing the literal character into a heredoc, which silently landed as a plain ASCII space (not caught until the linter re-run flagged 37 violations). Fixed by writing the constant as `" "` and verifying the resulting byte sequence (`\xc2\xa0`) with `xxd` before trusting any script that inserts NBSP programmatically — never trust a literal-typed NBSP character in a heredoc; always use the escape and verify bytes.
4. **`integrace-systemu` FAQ was extended, not replaced**: its one pre-existing FAQ entry (monitoring/alerting) stayed untouched; two new entries (price, no-API systems) were appended per the copy-rewrites.md §7 pain-point table.
5. **`webove-aplikace-a-custom-vyvoj` kept the "20 % pracovního času" heuristic** (moved from FAQ into the `desc` opening per the table) but the accompanying unproven ROI claim ("custom řešení zpravidla levnější za 18–24 měsíců") was dropped when rewriting the FAQ answer — the 20% figure is a reader self-diagnostic threshold, not a claim about VICTA's own results, so it doesn't fall under the vision.md §8 "no result claims without evidence" ban the way a payback-period promise would.
6. **Hub H1s realigned to their `generateMetadata` titles** (gate V5): `/reseni` "Řešení" → "AI agenti a asistenti pro firmy" (exact title match), `/sluzby` "Služby" → "Vývoj, AI a marketing pod jednou střechou" (keyword-aligned variant of the title, not exact — title includes "18 služeb:" framing that reads awkwardly as an H1), `/odvetvi` "Odvětví" → "Odvětví, kterým rozumíme" (exact title match). Subheads were lightly adjusted on all three to avoid the new headline creating an immediate repeated phrase with the subhead's opening words (e.g. odvetvi subhead's "Osm oborů, kterým rozumíme" → "Osm oborů, ve kterých jsme doma" once the H1 itself says "kterým rozumíme") — not explicitly requested but a direct, low-risk consequence of the H1 change.


---

## D-014 · Newsletter stateless double opt-in — closes RB-17 (2026-08-02)

**Context**: audit finding P1-07. `newsletter-schema.ts` had carried an open question (RB-17) since launch about whether single opt-in plus a stored consent-text/timestamp/IP-hash row was legally sufficient under CZ/SK marketing law (zákon č. 480/2004 Sb. + GDPR), or whether double opt-in was required. The audit treated this as a launch-gate blocker (GDPR consent-proof).

**Decision — stateless double opt-in, not a `confirmation_token`/`confirmed_at` column pair**: the RB-17 comment's original sketch assumed adding two columns to `newsletter_subscribers` and writing a pending row at signup that a confirm step later updates. Implemented differently: `POST /api/newsletter` no longer writes to Supabase at all — it validates the request (origin, Zod, honeypot, Turnstile, rate limit) and emails a signed, self-contained confirmation link. `GET /api/newsletter/confirm?token=...` verifies the signature + a 48h freshness window (`src/lib/newsletter-confirm-token.ts`), and is the ONLY place that writes `newsletter_subscribers` — `consented_at` is set to the moment the link is clicked, not the original signup moment, since the click is what proves the visitor controls the inbox.

**Why stateless over a pending-row design**: no `newsletter_subscribers` row exists until consent is actually proven, so there's nothing to clean up for abandoned/never-confirmed signups, no "pending" state to reconcile, and — as a side effect — `POST /api/newsletter` no longer depends on Supabase being provisioned at all (it only needs Turnstile + Upstash + Resend + `NEWSLETTER_CONFIRM_SECRET`), which decouples newsletter signup from the Supabase provisioning blocker tracked elsewhere in the audit (P0-05). The token is HMAC-SHA256 signed (same hex-digest + `timingSafeEqual` pattern as the Cal.com webhook verifier) over `{email, locale, ts, utm_source?, utm_medium?, utm_campaign?, source_url?}`, base64url-encoded — everything the confirm step needs travels in the link itself.

**New env var**: `NEWSLETTER_CONFIRM_SECRET` (server-only, added to `.env.example` with a comment — never `NEXT_PUBLIC_`). Not yet provisioned; generate with `openssl rand -hex 32` and set a distinct value per Vercel environment.

**Behavior on the sending side**: the confirmation email send is now the entire action of `POST /api/newsletter` (there's no DB write to fall back on), so — unlike the contact form's best-effort confirmation email (P1-06 below) — a failed Resend send here returns 500 rather than silently reporting success. Honeypot hits still return the generic success message without sending any email.

**Redirect target**: `GET /api/newsletter/confirm` redirects to `/{locale}/kontakt?newsletter={confirmed|invalid|expired|error}`. The frontend does not currently render anything different per query-param value — out of scope for this task per the parent instruction ("frontend nemusíš řešit — jen ať redirect cíl existuje"). Follow-up: `/kontakt`'s page component could read `searchParams.newsletter` and show a banner; flagged, not implemented.

**RB-17: CLOSED.** `newsletter-schema.ts`'s comment updated to point here instead of carrying the open question forward.

**Provisioning still required before this is live**: `NEWSLETTER_CONFIRM_SECRET` value, `RESEND_API_KEY_NEWSLETTER`, `SUPABASE_SERVICE_KEY` (for the confirm step's writes) — same outstanding vendor-account blockers as the rest of the form stack (P0-05).

---

## D-015 · CSP promoted to enforcing; connect-src narrowed; dead report-to removed (2026-08-02)

**Context**: audit finding P0-16. `vercel.json` shipped `Content-Security-Policy-Report-Only` since D-006 (2026-05-07), with a plan to promote to enforcing in Phase 5 after observing zero violations on preview deploys. That observation step never actually happened because the header also referenced `report-to csp-endpoint` with no `Reporting-Endpoints` header and no `/api/csp-report` route ever defined — violations were never collected anywhere, so "Report-Only" was reporting to nobody. The audit correctly flagged this as effectively no CSP protection at all in a project whose CLAUDE.md claims "no unsafe-inline permitted."

**Decision 1 — promote to enforcing now**: `vercel.json`'s header key changed from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`. Given the report-only period never produced any usable violation data to review, waiting longer wouldn't have produced a more informed decision — Vlnas 0–2b are already live/tested on this branch, so the realistic risk of enforcement breaking something is assessed as low and worth taking now rather than continuing to ship a CSP that protects nothing.

**Decision 2 — `'unsafe-inline'` stays in `script-src`/`style-src`, nowhere else**: all 39+ Czech content pages are SSG — the HTML is prebuilt at deploy time, not rendered per-request, so there is no request-scoped nonce to inject into Next.js's own inline bootstrap `<script>` tags (a nonce-based CSP requires per-response generation, which SSG doesn't do). The two alternatives considered:
  - **Nonce via Edge Middleware**: would require converting every SSG page's rendering to go through middleware-injected nonces, which either forces those pages off static generation (defeating the point of SSG for a 41-page marketing site) or requires a more complex nonce-into-static-HTML rewrite at the edge — not attempted here, flagged as the eventual path if inline scripts become a real attack-surface concern.
  - **Hash-based CSP** (`script-src 'sha256-...'` per exact inline script content): technically works with SSG since the hashes are computed once at build time, but Next.js's own emitted inline bootstrap scripts are not currently pinned in this codebase's build tooling, so the hash list would silently go stale (and start blocking the app entirely) on every Next.js version bump unless a CI step regenerates and verifies it. **This is the intended path out** — a follow-up task should add a build step that extracts inline `<script>`/`<style>` content from the SSG output, computes SHA-256 hashes, and fails CI if `vercel.json`'s CSP doesn't match, before removing `'unsafe-inline'`. Not implemented in this pass — scoped as a Vlna 3A finding, not a Vlna 3A deliverable.
  - No other directive (`img-src`, `connect-src`, `frame-src`, `font-src`, `object-src`, `base-uri`, `form-action`, `frame-ancestors`) uses `'unsafe-inline'`.

**Decision 3 — `connect-src` narrowed**: removed `https://*.supabase.co` and `https://*.upstash.io`. Both were listed "defensively" per D-006, but AR-21 already establishes that public clients never call Supabase or Upstash directly — every write goes through a Vercel Function using the service-role key. Confirmed by grep: no client component in `src` imports `@supabase/supabase-js` or `@upstash/*`. Keeping them in `connect-src` only widened the XSS-driven exfiltration surface (an injected script could otherwise `fetch()` those origins) for zero functional benefit. Added `https://challenges.cloudflare.com` to `connect-src` (was previously only in `script-src`/`frame-src`) because the Turnstile widget itself makes a network call to that origin to submit the challenge response, not just load a script and render an iframe.

**Decision 4 — dead `report-to csp-endpoint` removed, not replaced with a `Reporting-Endpoints` header**: the task allowed either fix. Chose removal over standing up a real reporting endpoint because (a) no `/api/csp-report` route exists to receive reports and building one is out of scope for this pass, and (b) Sentry is already the project's error-reporting surface (see `sentry.client.config.ts`) — a future task should evaluate Sentry's own CSP-report-to integration rather than hand-rolling a new endpoint. Flagged as a follow-up, not implemented here.

**CLAUDE.md updated to match** (P1-17, same pass): the CSP rule now describes enforcing (not report-only) status, references this entry for the `'unsafe-inline'` rationale, and states the actual `connect-src` allowlist instead of the stale "no external API calls" framing.

---

## D-016 · Wave 3B technical fixes: PageHero server/client split, LazyMotion, JSON-LD wiring (2026-08-02)

**Context**: audit findings P0-21, P0-22, P0-23, P0-24, P1-03, P1-05, P1-15, P1-16, P2-06, P2-09, P2-10, P2-11.

**Decision 1 — PageHero split into a Server Component shell + two client leaves, not a parallel "LegalHero"** (P0-21 + P0-22). `page-hero.tsx` no longer has `'use client'`; the scroll-linked parallax and the entrance-reveal animation each moved into their own tiny client component in the new `page-hero-client.tsx` (`HeroParallax`, `HeroReveal`), both taking server-rendered JSX as `children`. The H1 itself is now plain static markup rendered directly by the server component — never wrapped in either client leaf — so it can never carry an `opacity:0`/`blur()` initial state into the first paint. This is the "ideal" option the audit named as a fallback-if-invasive; it turned out tractable because `MagneticCta` (already `'use client'`) can be instantiated from a Server Component without changes, and because passing pre-rendered JSX as `children` into a client component doesn't require serializable props. Result: `cookies-body.tsx`/`ochrana-body.tsx` reuse the *same* `PageHero` as every other template (no forked "legal-only" hero component to keep in sync), while the 10 other `*-body.tsx` templates that still need `'use client'` for `useCalModal` are unaffected — `PageHero` just runs as an ordinary function within their existing client tree.

**Decision 2 — `ProseBlock` made fully static (no motion at all), not given its own reveal leaf**: it's used only by the two legal pages (confirmed via grep — no other consumer). Legal content is low-traffic and the audit explicitly sanctioned "no framer-motion" there as an acceptable simplification, so rather than mirror the `HeroReveal` pattern for it, the scroll-triggered fade was dropped entirely and `ProseBlock` is a plain server component now. `cookies-body.tsx`/`ochrana-body.tsx` themselves lost `'use client'` and switched from `useTranslations` (next-intl client hook) to `await getTranslations()` (next-intl/server) — both are now `async function` Server Components, which Next.js renders fine as ordinary JSX (`<CookiesBody />`) with no caller-side `await` needed.

**Decision 3 — LazyMotion (`domAnimation`, non-strict) wired via a client `MotionProvider` wrapping `[locale]/layout.tsx`'s body, `motion.*` → `m.*` converted in exactly the 5 files the task named** (nav.tsx, magnetic-cta.tsx, the new page-hero-client.tsx, values-grid.tsx, section-header.tsx) **— measured bundle impact was flat, not a reduction, and that's reported honestly rather than rounded up.** `.next/static/chunks` total: 1516 KB before → 1556 KB after (byte-precise: 1,477,994 B after). ~12 other client files (`home-body.tsx`, `kontakt-body.tsx`, `service-body.tsx`, `solution-body.tsx`, `industry-body.tsx`, `o-nas-body.tsx`, `blog-body.tsx`, `kinetic-list.tsx`, `bento-grid.tsx`, `contact-channels.tsx`, `sticky-tier-stack.tsx`, `horizontal-scroller.tsx`) still import `{ motion }` directly. Because `motion.*` always bundles framer-motion's full sync animation engine regardless of whether `LazyMotion`/`m` is also present in the tree, a partial conversion doesn't remove that engine from the bundle — it only adds the small provider/`m` plumbing on top. The size win requires converting the remaining files too; flagged as a fast-follow, not attempted here (task explicitly named this reduced scope as acceptable: "pokud je plošná náhrada riskantní, proveď ji aspoň v [5 files]"). `LazyMotion` is intentionally non-`strict` so the still-`motion.*` files keep working unchanged in the meantime.

**Decision 4 — ROMAN-BLOCKER guard lives in `JsonLd` (the single render funnel), not duplicated per builder** (P0-23): `components/seo/json-ld.tsx` recursively strips any field whose value contains the literal string `ROMAN-BLOCKER` before `JSON.stringify`, walking arbitrarily nested objects/arrays. `lib/schema.ts`'s `buildOrganizationSchema`/`buildLocalBusinessSchema` were *also* extended to actually reference `site.contact.dic` (→ `vatID`) and `site.contact.spisovaZnacka` (→ an `identifier: {@type: PropertyValue}` node) — they weren't wired into the schema at all before this wave, which would have made the guard untestable dead code (grepping `.next` for `ROMAN-BLOCKER` would trivially return 0 regardless of whether the filter worked). `site.contact.ico` (real value, not blocked) was added alongside as `taxID` so the built output demonstrates both the pass-through and the strip cases side by side. Verified in built HTML: `taxID:"28859511"` present, `vatID` key absent entirely, `identifier` present with `name` but no `value` key. The one known rough edge: a still-blocked `identifier` renders as a valueless `PropertyValue` object rather than being omitted outright (the generic filter strips the leaf field, not the parent object) — harmless (nothing leaks) but not maximally clean; would need builder-level awareness of the guard to fix, which was deliberately kept out of the builders per the task's ask to centralize the filter in one place.

**Decision 5 — `reseni-body.tsx`'s `SOLUTION_META` ids now match the real `/reseni/[slug]` routes** (P2-11): `genai-rag` → `znalostni-asistent`, `zakaznicka-podpora` → `podpora`, `prediktivni-analytika` → `dashboardy` (`agenti`/`infrastruktura` were already correct). Anchor hrefs in the page's own `PageHero` `anchors` prop updated to match. Grepped all of `src/` + `content/` for the old ids first: `routes.ts`/`offerings-data.ts`/`common.json` each have an unrelated `'zakaznicka-podpora'` industry slug under the *`/odvetvi/`* namespace — confirmed distinct from the `/reseni/` id being renamed here, left untouched. `content/en/strings/common.json` still has the old ids in dead, never-imported JSON (grepped — nothing in `src/` reads that file; EN sub-pages render `<EnglishStub>` instead); left alone per the "don't touch the EN stub" instruction.

**Decision 6 — root `src/app/not-found.tsx` renders its own complete `<html>/<body>`, not just body content**: `src/app/layout.tsx` is a plain passthrough (`return children`) — the real document shell lives in `[locale]/layout.tsx`, which the root-level 404 sits outside of. Also added `export const metadata = { metadataBase: new URL(site.url) }` to the root layout — without it, Next.js warned and fell back to `localhost:3000` when resolving the new root-level `icon.tsx`/`opengraph-image.tsx`/`apple-icon.tsx` file-convention images (none of those existed before this wave, so the warning is new, caused by this wave's own files, and fixed in the same pass). `[locale]/not-found.tsx` needs no such shell (Next nests it inside the segment's own layout, so Nav/Footer/tokens are already present) but, per `not-found.js` not receiving route params even for nested segments, can't detect which locale 404'd — both files hardcode Czech copy and link to `/cs` + `/kontakt#form` rather than attempting locale detection, matching the task's explicit "cs default" instruction.

**Deviation — OG image tagline text**: the task's prompt suggested "Aplikace, AI a systémy, které vydělávají." for `opengraph-image.tsx`. That exact sentence doesn't exist anywhere in the approved copy and asserts an unproven outcome ("that make money") the same wave of fixes elsewhere is actively removing per R4/P0-12 (unsubstantiated claims policy). Used the already-approved `site.title` fragment instead — "VICTA" + "Aplikace, AI a systémy pro růst firem." (verbatim from `content/cs/strings/common.json` `site.title`, also used site-wide as the `<title>` fallback) — so the OG image doesn't introduce new, unreviewed marketing copy.

**`site.ts` `ogImage` field removed** (P1-03): was dead (grepped — never referenced anywhere) and pointed at a file that was never created; superseded by the `opengraph-image.tsx` file convention, which has its own auto-injected URL.

**vercel.json cleanup (P1-17, same file)**: removed the `"app/api/chat/route.ts"` entry from the `functions` block — no `/api/chat` route exists yet (chatbot is deferred to Phase 5 per D-002); the config entry predates the route and will be re-added when the chatbot ships. Added `"app/api/newsletter/confirm/route.ts"` (new in this pass, D-014) with the same `maxDuration: 10` as its siblings.

---

## D-017 · Vlna 2b-EN: full English content parity, EnglishStub removed (2026-08-02)

**Context**: audit-report.md Vlna 2b (vision §10 — EN reaches full content parity, indexable without its own SEO investment). `content/en/strings/common.json` had 121 leaf keys against CS's 815; `<EnglishStub>` rendered on all ~15 EN sub-routes; several *-body.tsx components and a shared data module (`lib/offerings-data.ts`) held Czech text hardcoded outside of any i18n mechanism, so even the nav/mega-menu and homepage bento/scroller sections rendered in Czech on the nominally-English `/en` stub.

**Decision 1 — `lib/offerings-data.ts` converted from a static Czech data module into a locale-aware hook (`useOfferingData(key)` / `useOfferingsMap()`)**: it fed `nav.tsx`'s mega-menu, `home-body.tsx`'s three bento/scroller sections, and `odvetvi-body.tsx`'s hub cards — all three consumed it as a plain module-level constant, so the mega-menu and homepage were hardcoded Czech regardless of locale even *before* this wave (a pre-existing bug the audit's `en-stub.tsx` removal made newly visible: the stub only replaced page *bodies*, never the shared Nav/Footer chrome). Icons and hrefs stay in a locale-independent `META_MAP` (URL structure is locale-independent per architecture.md §4.2); title/subtitle/headline/description/CTA text now comes from `home.offerings.<key>` via `useTranslations`, merged at render time. `home.offerings.services`/`.solutions` CS JSON already matched the rendered `offerings-data.ts` text (dead but accurate); `.industries` was stale (6 items, old subtitles, pre-R2) — replaced with the real 8-item content taken verbatim from the code that was actually rendering on screen, so the CS visual output is unchanged and the JSON simply became the accurate source of truth it should have been.

**Decision 2 — the 3 detail-route `page.tsx` files (`sluzby/[slug]`, `reseni/[slug]`, `odvetvi/[slug]`) each imported `content/cs/strings/common.json` directly and unconditionally**, even in the `locale === 'en'` branch (which only mattered because that branch rendered `<EnglishStub>` instead of using the data — removing the stub without fixing the import would have made every EN detail page render Czech `item.name`/`item.desc`/`item.fit`/`item.faq`/`item.sections`). Each file now imports both `content/cs/...` and `content/en/...` and selects by locale (`ITEMS_BY_LOCALE[locale] ?? ITEMS_BY_LOCALE.cs`); `generateStaticParams` still enumerates slugs from the CS array only, since slugs are shared 1:1 across locales by design. `TITLE_INTENT` (SEO-audit P1-20 intent-keyword titles) split into `TITLE_INTENT_CS`/`TITLE_INTENT_EN` sibling maps rather than a single locale-keyed structure, matching the existing flat-map style. Breadcrumb schema previously hardcoded `"Domů"`/`"Služby"`/`"Odvětví"`/`"Řešení"` and `${site.url}/cs` regardless of locale — now reads `common.breadcrumbHome` + `nav.services`/`.solutions`/`.industries` and builds the URL from the actual request locale.

**Decision 3 — legal-page mailto/uoou.cz links (`ochrana-body.tsx`, `cookies-body.tsx`) split into `*Pre`/`*Mid`/`*Post` JSON string fragments** (`legal.privacy.controllerPre`/`controllerPost`, `.rightsPre`/`.rightsMid`/`.rightsPost`, `.fullVersionNotePre`/`.fullVersionNotePost`; `legal.cookies.contactPre`/`.contactPost`, `.fullVersionNotePre`/`.fullVersionNotePost`) rather than moving the whole sentence into one key, because the component needs a live `<a href="mailto:...">`/`<a href="https://uoou.cz">` in the middle of the sentence and JSON strings can't carry JSX. Splitting at the link boundary is the same pattern the file already used for its hardcoded version; the fix was translating each fragment independently rather than one opaque blob.

**Bug found and fixed, not just translated — `ochrana-body.tsx`'s `sections[0]`/`fullVersionNote` hardcoded text still said "se sídlem v Praze, IČO [doplnit]"**, i.e., the pre-NAP-fix placeholder address and a literal `[doplnit]` (TODO) IČO, even though `legal.privacy.sections.0.body` in `common.json` already had the corrected text (Hradec Králové, real IČO 28859511) from the Vlna 0 NAP fix (P0-06/P0-07) — the component simply never read that JSON key, it re-declared the sentence inline with a JSX-wrapped mailto link and nobody re-synced it. Fixed by making the component consume the JSON fragments (see Decision 3) instead of its own stale copy — `/cs/ochrana-soukromi` now renders the corrected address on both locales. Verified in built HTML: 0 occurrences of "Praha" or "[doplnit]" on either `/cs/ochrana-soukromi` or `/en/ochrana-soukromi`.

**Decision 4 — `common.json` gained ~15 new small namespaces** (`common.notFound`, `common.breadcrumbHome`, `common.pageSectionsNavLabel`, `home.marquee`, `home.sections`, `sluzby.sectionEyebrows`/`.ctaEyebrow`/`.detail`, `reseni.meta`/`.anchors`/`.ctaEyebrow`/`.detail`, `odvetvi.sectionEyebrow`/`.ctaEyebrow`/`.detail`, `oNas.anchors`/`.ctaEyebrow`/`.statusLinePrefix`, `kontakt.anchors`/`.formSection`/`.newsletterEyebrow`, `spoluprace.marquee`/`.heroExtraCta`/`.anchors`/`.sectionEyebrows`/`.scopingEyebrow`/`.finalCta`/`.faq.lead`, `blog.hero.subscribeCta`/`.anchors`) — these were section eyebrows, anchor-nav labels, marquee items, and a 404 page that were JSX string literals in `*-body.tsx`/`not-found.tsx`, invisible to next-intl and therefore rendered in Czech on every EN route once the stub was removed. Moved byte-identical (CS wording unchanged) into both locale JSON files. `[locale]/not-found.tsx` changed from a deliberately-static, hook-free component (it predates next-intl locale detection working reliably inside `not-found.js`) to an `async` Server Component using `getLocale()`/`getTranslations()` from `next-intl/server` — confirmed this resolves correctly without route params because `[locale]/layout.tsx`'s `setRequestLocale()` already populates next-intl's request-scoped locale before the not-found boundary renders (same mechanism `cookies-body.tsx`/`ochrana-body.tsx` already relied on).

**Decision 5 — `fit`/`audience` prefix-stripping regexes widened to accept both languages**: `service-body.tsx` and `solution-body.tsx` strip a leading "Hodí se pro: " label so the section can render its own heading; the EN JSON writes the equivalent field as "Fits: ...". Regex changed from `/^Hodí se pro:\s*/i` to `/^(Hodí se pro|Fits):\s*/i` in both files rather than adding a second locale-specific code path.

**Deviation — "CHCI RŮST" marquee item**: per the task's explicit instruction, translated to "READY TO GROW" rather than left untranslated as a brand slogan. Rationale given: the brand identity is "VICTA" itself, not this particular Czech phrase, and a due-diligence reader skimming the marquee gets more signal from a translated growth-positioning phrase than an untranslated Czech string they can't parse. Flagged here for Roman's review per the escalation path (design/positioning calls route to Roman) — reversible by editing `home.marquee[0]` in `content/en/strings/common.json` alone if he prefers to keep the Czech slogan untranslated.

**Deviation — number/dash formatting in EN body copy**: Kč amounts kept as `20,000–90,000 Kč` (US thousands separators, en-dash range per standard US number-range typography) rather than converting to EUR-primary or adding NBSP (task explicitly waives NBSP rules for EN — `lint:cs` only scans `content/cs/`). Sentence-level em-dashes use `—` with no surrounding spaces (US style) throughout, replacing CS's `word — word` spaced em-dash convention.

**Locale prop bugs fixed in passing**: `kontakt-body.tsx` and `blog-body.tsx` hardcoded `<ContactForm locale="cs" />`/`<NewsletterSignup locale="cs" .../>` regardless of the actual page locale — both components already fully supported an `en` branch internally (built in Vlna 3A) but nothing on the `/kontakt` or `/blog` pages ever passed `locale="en"` through. Now read `useLocale()` and pass it through. Also fixed: every `useCalModal({ sourcePage: '/cs/...' })` call across the 13 client `*-body.tsx` templates hardcoded the `/cs` prefix for GA4 `source_page` attribution — harmless while EN was a stub nobody booked from, but would have silently misattributed 100% of EN-page bookings to CS traffic once EN pages went live with real booking CTAs. Changed to `` `/${locale}/...` `` using `useLocale()`, matching the pattern `nav.tsx` already used.

**Files deleted**: `src/components/en-stub.tsx` (after confirming zero remaining imports via `grep -rl "EnglishStub|en-stub" src`).

**Not changed, in scope of "nešahej"**: `src/lib/schema.ts`, `vercel.json`, all `src/app/api/*` routes. `buildServiceSchema(input, locale)` already accepted a `Locale` param — the 3 detail `page.tsx` files now pass the request's actual locale instead of the hardcoded `'cs'` literal they used before, which is a caller-side fix (what data gets passed in), not a change to the schema builder itself.
