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


## D-008 · Design system v2: soft-skill Soft Structuralism + Ethereal Glass (2026-05-25)

**Decision**: D-001 (2026-05-06) explicitly UNLOCKED. New design system locked
via Roman's choice using Leonxlnx/taste-skill framework — combination of
soft-skill principles (Section 3.A high-end agency vibe + Section 3.B
Editorial Split layout) with vibe 2 (Soft Structuralism) for light mode
and vibe 3 (Ethereal Glass) for dark mode.

**Combination signature**: `Geist · slate-light / lavender-dark · ambient
shadows · glass-bento · Editorial Split hero · Asymmetrical Bento sections ·
medium · left · 600`

**What changes from D-001**:

| Token | D-001 (2026-05-06) | D-008 (2026-05-25) |
|-------|---------------------|---------------------|
| Sans font | Inter Tight | Geist (Variable 300..800) |
| Mono font | Geist Mono | Geist Mono (kept) |
| Accent font | none | Newsreader italic (selective H1 only) |
| Light bg | #FAFAFA | #F4F5F7 (silver-grey) |
| Light accent | #3730A3 (indigo) | #1F2937 (slate) |
| Dark accent | #7367E5 (indigo lift) | #DCD7FF (lavender) |
| Background | 40×40 grid 4% opacity | Radial mesh orbs + noise overlay |
| Card radius | 8px | 22px inner / 28px outer (Double-Bezel) |
| CTA buttons | rounded 6px | Pill 999px with Button-in-Button arrow |
| Headline weight | 500 | 600 |
| Layout grammar | Single-column left | Editorial Split + Asymmetrical Bento |
| Icon library | lucide-react | @phosphor-icons/react (weight="light") |

**Canonical sources**:
- Visual mockups: `docs/design-exploration/2026-05-24-soft-skill-vibes/*.html`
- Skill specs: `.claude/skills/{taste,soft,redesign,minimalist}-skill/SKILL.md`
- Full design spec: `docs/superpowers/specs/2026-05-24-design-system-v2-design.md`
- Implementation plan PR 1: `docs/superpowers/plans/2026-05-24-design-system-v2-pr1-foundation.md`

**Reason**: Roman determined the D-001 system, while WCAG-compliant and
Czech-typography-correct, read as "safe minimalist template" rather than
"$150k agency build" per soft-skill anti-slop criteria. Indigo + Inter
combination falls into "AI default" signature per taste-skill Section 7.
The new system commits to a clear visual point of view (tech-credible light +
glass dark mode) that differentiates VICTA from template-based competitors.

**Hand-off** (PRs landed 2026-05-24..2026-05-25):
- PR #16: PR 1 Foundation (globals.css + 6 component primitives + Button/Nav/ThemeToggle refactor + Phosphor install + banned-patterns hook)
- PR #17: PR 2 Homepage (EditorialSplit hero + bento offerings + audit pricing on Double-Bezel)
- PR #18: PR 6a Detail page template + 31 SSG routes (18 services + 5 solutions + 8 industries)
- PR #19: PR 4 Overviews refactor (/sluzby /reseni /odvetvi) + homepage href migration
- PR #20: PR 3 Conversion pages refactor (/spoluprace + /kontakt + PricingCard rebuild)
- PR #21: PR 6b Czech content for 18 service detail pages (+ Magento typo fix)
- PR #22: PR 6c Czech content for 5 solution detail pages
- PR #23: PR 6d Czech content for 8 industry detail pages (+ Upgates + Packeta typo fixes)
- PR #24: PR 5 Content pages refactor (/o-nas with team stub + /blog + legal pages)
- PR #25 (this PR): PR 7 Cleanup — D-008 entry + lucide-react removal + archive legacy mockups

**Locked items (do not change without D-### successor)**:
- Geist as sans (replaces Inter Tight permanently)
- Slate accent light / lavender dark (no return to indigo)
- Editorial Split + Asymmetrical Bento as layout grammar
- Variant C (visual canvas) for hero right column — Variant B (testimonial)
  deferred until 3-5 real client testimonials available from medium+ business
  clients
- Phosphor icons (`weight="light"`) for all new code

**Backwards-compat aliases (D-001 utility names) remain in globals.css**:
- `--secondary`, `--tertiary`, `--surface`, `--surface-2`, `--border`,
  `--border-soft`, `--success`, `--warning`, `--error`
- `.text-secondary`, `.text-tertiary`, `.bg-surface`, `.bg-surface-2`,
  `.border-border`, `.border-border-soft`
- `.audit-card.popular` (D-001 §1.6 emphasis ring)

These will be removed in a future PR after all 48 active usages across
refactored pages are migrated to D-008 utility names (`.text-ink-muted`,
`.bg-elevated`, `.border-line`, etc.).
