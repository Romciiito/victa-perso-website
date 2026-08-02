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

