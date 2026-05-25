# Design System v2 — soft-skill Soft Structuralism + Ethereal Glass

**Status**: APPROVED (Roman, 2026-05-24, brainstorming session)
**Replaces**: D-001 (2026-05-06 design system lock)
**Effective**: From PR 1 merge onward
**Owner**: Roman (decisions) + Claude Code (implementation)

---

## 1. Decisions recap

| Decision | Value | Reference |
|----------|-------|-----------|
| Source framework | `Leonxlnx/taste-skill` (commit on `main` as of 2026-05-24) | `.claude/skills/{taste,soft,redesign,minimalist}-skill/SKILL.md` |
| Workflow skill | `redesign-skill` (audit existing → fix progressively) | `.claude/skills/redesign-skill/SKILL.md` |
| Visual skill | `soft-skill` Section 3.A | `.claude/skills/soft-skill/SKILL.md` |
| Light mode vibe | Soft Structuralism (silver-grey, Geist 600, ambient shadows) | mockup: `docs/design-exploration/2026-05-24-soft-skill-vibes/vibe-2-soft-structuralism.html` |
| Dark mode vibe | Ethereal Glass (OLED `#050508`, radial orbs, vantablack glass bento) | mockup: `docs/design-exploration/2026-05-24-soft-skill-vibes/vibe-3-ethereal-glass.html` |
| Theme switching | `prefers-color-scheme` auto-detect + manual toggle (`localStorage('victa-theme')`) | mockup: `docs/design-exploration/2026-05-24-soft-skill-vibes/vibe-2-3-combined.html` |
| Hero right area | Variant C · Visual (gradient canvas + caption) | mockup combined.html with `data-variant="C"` |
| Hero right future | Variant B (testimonials) — deferred until 3-5 real client quotes from medium+ business clients | — |
| D-001 status | UNLOCKED (formal entry in decisions.md as D-008) | §10 below |

---

## 2. Scope

### 2.1 In scope (refactor)

10 existing page.tsx files under `src/app/[locale]/`:

1. `page.tsx` — homepage (582 lines)
2. `kontakt/page.tsx` — contact (209 lines)
3. `sluzby/page.tsx` — services overview (165 lines)
4. `reseni/page.tsx` — solutions overview (121 lines)
5. `odvetvi/page.tsx` — industries overview (124 lines)
6. `o-nas/page.tsx` — about (186 lines)
7. `spoluprace/page.tsx` — cooperation/audit booking (369 lines)
8. `blog/page.tsx` — blog placeholder
9. `ochrana-soukromi/page.tsx` — privacy
10. `cookies/page.tsx` — cookies

Plus shared infrastructure:
- `src/styles/globals.css` — full replace
- `src/app/layout.tsx` — anti-flash script + font loading
- `src/components/` — Button, Nav, theme-toggle, footer, OfferingSection, StatusLine, PricingCard refactor

### 2.2 In scope (new builds — Phase 4 detail pages)

31 detail pages built on the new design system directly (no double-build):
- 18 services under `/sluzby/[slug]`
- 5 solutions under `/reseni/[slug]`
- 8 industries under `/odvetvi/[slug]` (per `llms.txt` 2026-05-23 sync)

### 2.3 Out of scope

- Chatbot UI (deferred per D-002)
- Team section (`/o-nas/#tym`) — built last per workplan §4.12 sequencing rule
- A/B testing infrastructure
- Multi-tenant features
- E-commerce checkout
- Native mobile apps

---

## 3. Design tokens

### 3.1 Color tokens — full CSS

```css
/* ============================================================
   LIGHT MODE (Soft Structuralism)
   Replaces locked tokens from D-001 §1.1 entirely
   ============================================================ */
:root {
  /* Surfaces */
  --bg:           #F4F5F7;
  --bg-elevated:  #FFFFFF;
  --bg-deep:      #ECEEF1;

  /* Ink */
  --ink:          #0A0B0E;   /* kept from D-001 — WCAG AAA pairs */
  --ink-muted:    #4B5159;
  --ink-soft:     #8E949D;

  /* Lines (hairline + soft) */
  --line:         rgba(10, 11, 14, 0.06);
  --line-strong:  rgba(10, 11, 14, 0.12);

  /* Accent — slate replaces indigo */
  --accent:       #1F2937;
  --accent-soft:  rgba(31, 41, 55, 0.05);

  /* Status (kept from D-001 — already WCAG AA) */
  --status-ok:    #16A34A;
  --status-warn:  #A16207;
  --status-err:   #B91C1C;

  /* Atmospheric orbs */
  --orb-1: rgba(56, 70, 91, 0.06);
  --orb-2: rgba(120, 130, 150, 0.05);

  /* Radius scale */
  --radius-sm:    8px;
  --radius-md:    14px;
  --radius-lg:    22px;
  --radius-xl:    28px;
  --radius-pill:  999px;

  /* Shadow scale */
  --shadow-sm:           0 1px 1px rgba(10,11,14,0.02), 0 4px 14px -4px rgba(10,11,14,0.05);
  --shadow-card:         inset 0 1px 0 rgba(255,255,255,0.9), 0 30px 60px -30px rgba(10,11,14,0.12);
  --shadow-card-hover:   inset 0 1px 0 rgba(255,255,255,0.9), 0 50px 100px -40px rgba(10,11,14,0.18);
  --shadow-cta:          0 1px 0 rgba(255,255,255,0.15) inset, 0 10px 28px -10px rgba(10,11,14,0.45);

  /* Motion */
  --ease:         cubic-bezier(0.32, 0.72, 0, 1);
}

/* ============================================================
   DARK MODE (Ethereal Glass)
   ============================================================ */
[data-theme="dark"] {
  --bg:           #050508;
  --bg-elevated:  rgba(255, 255, 255, 0.03);
  --bg-deep:      #030305;

  --ink:          #F4F4F6;
  --ink-muted:    #A8ABB4;
  --ink-soft:     #6B6F78;

  --line:         rgba(255, 255, 255, 0.08);
  --line-strong:  rgba(255, 255, 255, 0.14);

  --accent:       #DCD7FF;
  --accent-soft:  rgba(150, 120, 255, 0.12);

  --status-ok:    #4ADE80;

  --orb-1: rgba(150, 120, 255, 0.55);
  --orb-2: rgba(60, 220, 180, 0.40);

  --shadow-card:         inset 0 1px 0 rgba(255,255,255,0.10), 0 20px 50px -20px rgba(0,0,0,0.5);
  --shadow-card-hover:   inset 0 1px 0 rgba(255,255,255,0.14), 0 30px 70px -20px rgba(0,0,0,0.6);
  --shadow-cta:          inset 0 1px 0 rgba(255,255,255,0.8), 0 14px 32px -10px rgba(120,100,220,0.5), 0 0 0 1px rgba(255,255,255,0.18);
}
```

### 3.2 Typography stack

```
--font-sans:    'Geist' (Variable, weight 300..800)        ← replaces 'Inter Tight'
--font-mono:    'Geist Mono' (Variable, weight 400..600)   ← kept
--font-serif:   'Newsreader' italic (Variable, ital,wght@1,300) ← NEW (selective accent only)
```

**Self-hosting (per AR-23 — fonts in repo, not Google CDN)**:
- All 3 families self-hosted via `next/font/google` with `display: swap`
- Subset to Latin Extended (covers Czech: ě, š, č, ř, ž, ý, á, í, é, ú, ů, etc.)
- Preload `Geist 400` + `Geist 600` (Czech body + headlines)
- `Newsreader` loaded but not preloaded (used only on H1 accent word)

**Defaults**:
```
Body:       Geist 400, letter-spacing -0.005em, line-height 1.5
Headlines:  Geist 600, letter-spacing -0.045em, line-height 0.94
Mono:       Geist Mono 400, letter-spacing 0.05em (for tags), 0 (for prices)
Accent:     Newsreader italic 300, used for ONE word in H1 maximum
```

### 3.3 Spacing

```
Section padding:      py-24 mobile (96px), py-32 desktop (128px)
Hero top padding:     pt-32 mobile (128px), pt-[168px] desktop
Container:            max-w-[1440px] mx-auto
Gutters:              px-6 mobile (24px), px-8 desktop (32px)
Inter-section gap:    96px desktop, 56px mobile
Bento gap (inside grid): 12px-16px tight, 24px loose
```

### 3.4 Motion timing

```
Hover transitions:    200ms cubic-bezier(0.32, 0.72, 0, 1)
Button states:        400ms ease
Card lifts:           700ms ease
Scroll-entry fade:    1000ms ease (with 80ms..760ms stagger across siblings)
Theme switch:         600ms ease (bg-color + color)
```

---

## 4. Component library

### 4.1 Refactor inventory

| Component | Status | Notes |
|-----------|--------|-------|
| `Button` | REFACTOR | Pill 999px radius, Button-in-Button arrow for primary, ghost variant with backdrop-blur |
| `Nav` | REFACTOR | Fluid Island floating pill, fixed top, glass backdrop-filter, theme toggle inline |
| `ThemeToggle` | REFACTOR | Sun/Moon SVG (Phosphor weight 1.5), 32×32 button, 15° rotate on hover |
| `Footer` | REFACTOR | Reduce link farm from 4-col to 2-col + legal; matches new spacing rhythm |
| `OfferingSection` | REFACTOR | Migrate from 3-equal-cards to Asymmetrical Bento (feature 2fr + 1fr others) |
| `PricingCard` | REFACTOR | Apply Double-Bezel (outer shell + inner core); recommended tier via color emphasis, not extra height (per redesign-skill) |
| `StatusLine` | KEEP | Mono "VICTA · 2026" line, minor color token swap |
| `LocaleSwitcher` | KEEP | Functional; visual swap to match new pill style |

### 4.2 New components

| Component | Purpose | Location |
|-----------|---------|----------|
| `Eyebrow` | Status pill above H1 (breathing dot + label) | `src/components/eyebrow.tsx` |
| `BentoShell` | Double-Bezel outer wrapper for bento cards | `src/components/bento.tsx` |
| `BentoCard` | Inner core with default padding + shadow + hover lift | `src/components/bento.tsx` |
| `EditorialSplit` | Hero layout primitive (1.05fr / 1fr grid) | `src/components/editorial-split.tsx` |
| `AsymmetricalBento` | Grid primitive with auto feature-card 2fr | `src/components/asymmetrical-bento.tsx` |
| `VisualCanvas` | Hero right-column variant C (gradient + dotted pattern + caption) | `src/components/visual-canvas.tsx` |
| `BodyOrbs` | Body-level radial mesh orbs (theme-aware) | `src/components/body-orbs.tsx` (server component, no JS) |
| `NoiseOverlay` | Fixed pointer-events-none noise filter | already in `globals.css` `::after` |

### 4.3 Iconography migration

- **Current**: `lucide-react` (12+ icons in homepage; used in OfferingSection, PricingCard, page heroes)
- **New**: `@phosphor-icons/react/dist/ssr` (light weight, stroke 1.5)
- **Migration strategy**: Find-replace per-PR (homepage in PR 2, then progressively); both libraries can coexist during transition

### 4.4 Banned patterns (CI-checked where possible)

Build will FAIL if any of these appear in a refactored file:

```
✗ Generic 3-equal-card grid    (grid-cols-3 with identical card heights — replace with bento)
✗ Centered hero text           (text-center on hero H1 — split-screen mandatory)
✗ h-screen                     (use min-h-[100dvh] — iOS viewport bug)
✗ #000000 / #ffffff            (use --bg / --ink tokens)
✗ "John Doe" / "Acme Corp"     (Czech realistic names + brands)
✗ "Elevate" / "Seamless" / "Unleash" / "Next-Gen"  (taste-skill content rules)
✗ lucide-react import in NEW component files (existing during migration ok)
✗ shadow-md / shadow-lg / shadow-xl Tailwind defaults (use --shadow-card tokens)
✗ rounded-full on large containers > 200px wide   (use --radius-xl)
✗ z-50 / z-[9999] arbitrary    (z-index scale in theme only)
```

ESLint custom rules + grep-based pre-commit hook enforce these where statically detectable.

---

## 5. Layout grammar per page type

| Page type | Layout archetype | Hero | Body | Right column / aside |
|-----------|------------------|------|------|----------------------|
| Homepage | Editorial Split → 3× Asymmetrical Bento | Variant C visual canvas + 2 bentos | 3 offering sections (services 18, solutions 5, industries 8) | n/a |
| Sluzby overview | Editorial Split intro + Bento grid | H1 left, CTA right | 18 service tiles in bento (1 feature + 17 standard) | sticky filter (future) |
| Sluzby/[slug] | Editorial Split intro | H1 + sub left, audit CTA right card | content sections: problem → approach → process → outcomes → FAQ | sticky TOC right |
| Reseni overview | Same as Sluzby overview | | 5 solution tiles | |
| Reseni/[slug] | Same as Sluzby/[slug] | | | |
| Odvetvi overview | Same as Sluzby overview | | 8 industry tiles | |
| Odvetvi/[slug] | Same as Sluzby/[slug] | | | |
| O nás | Editorial Split intro + masonry hodnoty + process timeline | H1 left, year/founded right | hodnoty masonry, process numbered steps | team section stub last |
| Kontakt | Focused single column form + side card | H1 above form | form with floating labels | address + hours + response time card |
| Spoluprace (audit) | Hero Editorial Split + 3-tier pricing bento | Headline + sub left, calendar CTA right | 3 pricing cards (Double-Bezel, recommended via color emphasis) | Cal.com booking embed |
| Blog index | Asymmetrical masonry | featured post 2× + 6 standard tiles | | |
| Legal pages | Single column max-w-3xl | H1 + last-updated date | long-form content | sticky TOC right |
| 404 | Centered minimal | "404" massive + 1-line message | back to homepage CTA | n/a |

---

## 6. Rollout plan

### 6.1 Branch + PR sequence

```
content-only ──[rebase + new branch]──> design-system-v2
                                            │
                                            ├── PR 1: Foundation
                                            ├── PR 2: Homepage
                                            ├── PR 3: Conversion (spoluprace + kontakt)
                                            ├── PR 4: Overview pages (sluzby + reseni + odvetvi)
                                            ├── PR 5: Content pages (o-nas + blog + legal)
                                            ├── PR 6: 31 detail pages (sluzby/[slug] + reseni/[slug] + odvetvi/[slug])
                                            └── PR 7: D-008 + cleanup (delete legacy tokens, locked-preview.html archive)
```

### 6.2 Per-PR contents

**PR 1 — Foundation (no visual page changes)**
- `src/styles/globals.css` → fully replaced
- `src/app/layout.tsx` → font loading (Geist + Geist Mono + Newsreader self-hosted via next/font), anti-flash script
- `src/components/` → 8 new primitives (Eyebrow, BentoShell, BentoCard, EditorialSplit, AsymmetricalBento, VisualCanvas, BodyOrbs, NoiseOverlay)
- `src/components/button.tsx` → refactor (pill + Button-in-Button arrow)
- `src/components/nav.tsx` → refactor (Fluid Island)
- `src/components/theme-toggle.tsx` → refactor (sun/moon SVG)
- `@phosphor-icons/react` added to package.json
- Czech typography linter unchanged (still enforces ě/š/č/ř/ž rules)
- Lighthouse score baseline captured pre-PR
- Vercel preview deploy — visual diff captured but UI doesn't change yet (pages still on old tokens until PR 2)

**PR 2 — Homepage**
- `src/app/[locale]/page.tsx` → refactor to EditorialSplit hero (variant C) + 3 AsymmetricalBento offering sections
- `OfferingSection` component → migrated to AsymmetricalBento
- All Lucide icons in homepage → Phosphor swap
- Screenshot diff: light + dark, mobile + desktop
- Roman approval gate

**PR 3 — Conversion pages**
- `src/app/[locale]/spoluprace/page.tsx` → EditorialSplit hero + 3-tier PricingCard with Double-Bezel
- `src/app/[locale]/kontakt/page.tsx` → focused form + side info card
- Form components (contact form, newsletter signup) → restyle (label-above-input, no `window.alert`, inline error states)
- Cal.com embed iframe styling — `frame-src https://app.cal.com` per AR-11 unchanged
- Roman approval gate

**PR 4 — Overview pages**
- `src/app/[locale]/sluzby/page.tsx` → EditorialSplit intro + bento grid placeholder (cards will resolve to detail pages once PR 6 ships)
- `src/app/[locale]/reseni/page.tsx` → same pattern
- `src/app/[locale]/odvetvi/page.tsx` → same pattern, accommodate 8 industries (not 6 — per llms.txt sync commit `58c30eb`)
- Roman approval gate

**PR 5 — Content pages**
- `src/app/[locale]/o-nas/page.tsx` → EditorialSplit intro + hodnoty masonry + process timeline; team section stays as stub per §4.12
- `src/app/[locale]/blog/page.tsx` → asymmetrical masonry placeholder (no blog posts yet)
- `src/app/[locale]/ochrana-soukromi/page.tsx` → single column + sticky TOC
- `src/app/[locale]/cookies/page.tsx` → same
- Roman approval gate

**PR 6 — 31 detail pages**
- New directory `src/app/[locale]/sluzby/[slug]/page.tsx` (18 services)
- New directory `src/app/[locale]/reseni/[slug]/page.tsx` (5 solutions)
- New directory `src/app/[locale]/odvetvi/[slug]/page.tsx` (8 industries)
- Single shared `DetailPageTemplate` component (EditorialSplit intro + content sections + sticky TOC)
- MDX content files in `content/cs/sluzby/{slug}.mdx` etc., OR continue with common.json + dynamic params
- Roman approval gate per section (services → solutions → industries) — milestone-batch per workplan OI-W07

**PR 7 — D-008 + cleanup**
- Append D-008 entry to `decisions.md`
- Delete legacy `docs/design-exploration/locked-preview.html` (preserve in git history)
- Delete obsolete `docs/design-exploration/visual-companion.html` + `visual-companion-v2.html`
- Update `docs/claude/design-decisions.md` pointer table
- Update `architecture.md §7.1` LOCKED tokens block
- Remove unused dependencies (`lucide-react` if fully migrated; otherwise defer)
- Final Lighthouse audit per page

### 6.3 CI quality gates per PR

Every PR must pass:
- Czech typography linter (AR-08 unchanged)
- ESLint with new banned-pattern rules
- `pnpm typecheck`
- `pnpm test` (Vitest unit tests)
- `pnpm test:e2e` (Playwright)
- Lighthouse mobile ≥ 90 on every modified page (per SC-12)
- axe-core: zero violations on key pages (per SC-13)
- Bundle size guard: no >5% regression
- Screenshot diff review (Playwright capture) — required for visual PRs (2, 3, 4, 5)
- `grep -r "NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*SECRET" src/` returns nothing (AR-12)

### 6.4 Rollback plan

- Each PR atomically revertible via `git revert <sha>`
- Legacy `tokens/light.css` + `tokens/dark.css` PRESERVED in repo until PR 7
- Vercel preview URL per PR — Roman reviews before promoting to production
- Sentry error spike monitoring post-deploy:
  - Threshold: > 5 errors / 5 minutes triggers Slack alert
  - If spike within 30 minutes of production deploy → auto-rollback via Vercel deployment promotion to previous

### 6.5 Estimated effort

| PR | Effort estimate |
|----|-----------------|
| PR 1 — Foundation | 1-2 days |
| PR 2 — Homepage | 1 day |
| PR 3 — Conversion (spoluprace + kontakt) | 1-2 days |
| PR 4 — Overviews | 1 day |
| PR 5 — Content (o-nas + blog + legal) | 1 day |
| PR 6 — 31 detail pages | 4-7 days (heaviest) |
| PR 7 — D-008 + cleanup | 0.5 day |
| **Total** | **9-15 days** |

---

## 7. Risk mitigation

### 7.1 Identified risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Font swap breaks Czech diacritics rendering | Low | High | Subset Geist to Latin Extended; visual verify all 17 Czech-specific chars on light + dark before PR 1 merge |
| Lighthouse score drops below 90 (per SC-12) | Medium | High | Preload Geist 400 + 600; defer Newsreader; verify INP < 200ms on backdrop-blur components (use `transform`/`opacity` only) |
| Theme flash on first paint | Low | Medium | Anti-flash inline script in `<head>` (mirrors current D-001 implementation); script reads localStorage before paint |
| `content-only` branch merge conflicts | High | Medium | Rebase `design-system-v2` weekly against `content-only`; coordinate with content team via PR comments |
| Czech typography linter breaks on new components | Low | Low | Linter operates on string content only, not CSS; new components unaffected |
| Backdrop-blur kills mobile perf | Medium | High | Apply blur ONLY to fixed elements (Fluid Island nav, glass bento on dark mode); never on scrolling containers (soft-skill §6 rule) |
| 31 detail pages overwhelm review | High | Medium | Milestone-batch review per section (per OI-W07); Roman reviews services together, then solutions, then industries |
| Cookiebot CMP breaks with new CSS variables | Low | Medium | CMP is loaded post-consent and injected as iframe; isolated from our CSS |

### 7.2 Verification gates

Before merging PR 2 (first user-visible change):

- [ ] All 17 Czech diacritics render correctly on light + dark (manual verify list: ě, š, č, ř, ž, ý, á, í, é, ú, ů, Ě, Š, Č, Ř, Ž, ó)
- [ ] Theme toggle works: light ↔ dark with no flash
- [ ] Theme persists across navigation (localStorage)
- [ ] OS preference respected on first visit
- [ ] Manual override beats OS preference
- [ ] Lighthouse mobile ≥ 90 on homepage
- [ ] axe-core: zero violations on homepage
- [ ] Roman walks through homepage on Vercel preview, approves visual + interaction

Before merging PR 6 (detail pages):

- [ ] DetailPageTemplate renders correctly for at least 3 services + 1 solution + 1 industry on Vercel preview
- [ ] SEO: every detail page has unique `<title>` + meta (per SC-10)
- [ ] Schema.org JSON-LD: Service schema on services, FAQPage on solutions where FAQ exists

---

## 8. Open questions (resolve during implementation)

| ID | Question | Owner | When |
|----|----------|-------|------|
| Q-01 | MDX content for detail pages or extend `common.json`? | Roman + Claude | Before PR 6 |
| Q-02 | Sticky TOC on detail pages: custom or `@radix-ui/react-scroll-area` | Claude | PR 6 |
| Q-03 | Audit pricing tier display: 3 horizontal cards (per current `spoluprace`) or vertical comparison table | Roman | Before PR 3 |
| Q-04 | Footer link reduction (4-col → 2-col): which links cut | Roman | Before PR 1 |
| Q-05 | Blog posts: defer entirely or add MDX template now | Roman | Before PR 5 |

---

## 9. Banned patterns reference (taste-skill anti-slop checklist)

Inline reference — used by ESLint custom rules + manual review:

**Visual/CSS:**
- ✗ Neon/outer glows (`box-shadow: 0 0 N #color`)
- ✗ Pure `#000000` (use `#050508` for dark bg, `--ink` for text)
- ✗ Oversaturated accents (saturation < 80% required)
- ✗ Text-fill gradients on large headers (allowed only on H1 accent word in dark mode)
- ✗ Custom mouse cursors

**Typography:**
- ✗ Inter font family anywhere
- ✗ Oversized H1 that "screams" — control hierarchy via weight + color, not just scale
- ✗ Serif on dashboard contexts (Newsreader allowed ONLY on marketing-page H1 accent word)
- ✗ Orphaned words on last line of paragraph (use `text-wrap: pretty` per kept rule from D-001)

**Layout/Spacing:**
- ✗ 3 equal cards in a row
- ✗ `h-screen` (use `min-h-[100dvh]`)
- ✗ Complex flexbox % math (use CSS Grid)
- ✗ No max-width container on wide screens (must constrain to 1440px)
- ✗ Centered hero text
- ✗ Cards forced to equal height by flexbox where content varies

**Content (Jane Doe effect):**
- ✗ "John Doe", "Jane Smith", "Sarah Chan" — use realistic Czech names
- ✗ "Acme Corp", "Nexus", "SmartFlow" — use realistic Czech company names
- ✗ Round numbers (`99.99%`, `50%`, `$100.00`) — use organic (`47.2%`, `20 000 Kč`, `47+`)
- ✗ AI clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Game-changer", "Delve"
- ✗ Exclamation marks in success messages
- ✗ "Oops!" / "Mistakes were made" — direct active voice
- ✗ Lorem ipsum

**Components:**
- ✗ Generic card (border + shadow + white bg) — use Double-Bezel or remove border
- ✗ Always one filled + one ghost button — vary
- ✗ Pill "New"/"Beta" badges — use square or plain text
- ✗ 3-card carousel testimonials with dots — replace with masonry wall or single rotating quote
- ✗ Pricing 3-tower — emphasize via color, not extra height
- ✗ Modals for simple actions — use inline editing
- ✗ Sun/moon toggle as ONLY theme indicator — also expose in settings (current toggle kept as accessible affordance)

**Iconography:**
- ✗ Lucide / Feather icons in NEW components — use `@phosphor-icons/react`
- ✗ Cliche metaphors (rocket for "launch", shield for "security") — use abstract (bolt, fingerprint, vault)
- ✗ Inconsistent stroke widths — standardize to 1.5

---

## 10. D-008 decisions.md entry (full text to append)

```markdown
## D-008 · Design system v2: soft-skill Soft Structuralism + Ethereal Glass (2026-05-24)

**Decision**: D-001 (2026-05-06) explicitly UNLOCKED. New design system locked
via Roman's choice using Leonxlnx/taste-skill framework — combination of
soft-skill principles (Section 3.A high-end agency vibe + Section 3.B
Editorial Split layout) with vibe 2 (Soft Structuralism) for light mode
and vibe 3 (Ethereal Glass) for dark mode.

**Combination signature**: `Geist · slate-light / lavender-dark · ambient
shadows · glass-bento · Editorial Split hero · Asymmetrical Bento sections ·
medium · left · 600`

**What changes from D-001**:

| Token | D-001 (2026-05-06) | D-008 (2026-05-24) |
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

**Canonical sources**:
- Visual mockups: `docs/design-exploration/2026-05-24-soft-skill-vibes/*.html`
- Skill specs: `.claude/skills/{taste,soft,redesign,minimalist}-skill/SKILL.md`
- Full design spec: `docs/superpowers/specs/2026-05-24-design-system-v2-design.md`

**Reason**: Roman determined the D-001 system, while WCAG-compliant and
Czech-typography-correct, read as "safe minimalist template" rather than
"$150k agency build" per soft-skill anti-slop criteria. Indigo + Inter
combination falls into "AI default" signature per taste-skill Section 7.
The new system commits to a clear visual point of view (tech-credible light +
glass dark mode) that differentiates VICTA from template-based competitors.

**Hand-off**:
- Phase 1B globals.css fully replaced (no rebuild — refactor in place)
- 7 PRs as per docs/superpowers/specs/2026-05-24-design-system-v2-design.md §6
- Existing 10 page.tsx files refactored; 31 future detail pages built on
  the new component library directly (no double-build)

**Locked items (do not change without D-### successor)**:
- Geist as sans (replaces Inter Tight permanently)
- Slate accent light / lavender dark (no return to indigo)
- Editorial Split + Asymmetrical Bento as layout grammar
- Variant C (visual canvas) for hero right column — Variant B (testimonial)
  deferred until 3-5 real client testimonials available from medium+ business clients
```

---

## 11. Approval

- [x] Roman approval — Section A recap (2026-05-24, conversation)
- [x] Roman approval — Sections B/C/D/E (2026-05-24, conversation)
- [ ] Spec self-review (placeholder scan, contradictions, scope) — Claude
- [ ] Roman review of this written spec
- [ ] Transition to writing-plans skill → implementation plan

---

## 12. References

- `Leonxlnx/taste-skill` repository: https://github.com/Leonxlnx/taste-skill
- Installed skills: `.claude/skills/{taste,redesign,minimalist,soft,brutalist,output}-skill/SKILL.md`
- Visual mockups: `docs/design-exploration/2026-05-24-soft-skill-vibes/`
  - `index.html` — comparison view
  - `vibe-1-editorial-luxury.html` — rejected (Editorial Luxury, lifestyle feel)
  - `vibe-2-soft-structuralism.html` — accepted as LIGHT MODE
  - `vibe-3-ethereal-glass.html` — accepted as DARK MODE
  - `vibe-2-3-combined.html` — final combined demo (variant C selected)
- Previous design decision (now unlocked): `decisions.md` D-001
- Project rules: `CLAUDE.md`, `claude-rules.md` (15 rules)
- Architecture rules: `architecture.md` (AR-01..AR-25)
- Workplan rollout context: `workplan.md` Phase 4 §4.2-§4.12
- Soft-skill spec: `.claude/skills/soft-skill/SKILL.md`
- Redesign-skill spec: `.claude/skills/redesign-skill/SKILL.md`
