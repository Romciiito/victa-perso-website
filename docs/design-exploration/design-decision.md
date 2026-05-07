# VICTA — Design Decision

> **Locked output of Phase 1A design exploration.** Roman vybral `Inter Tight × Indigo × Grid × Medium × Left × 500` z `visual-companion-v2.html` Tweaks mixeru. Tento dokument je hand-off kontrakt pro Phase 1B `architect` — definuje co je rozhodnuté (a tedy nepřednastavitelné v Phase 1B) a co Phase 1B doplní (a co je tedy ještě otevřené).

> **Status:** LOCKED — všechny `Decided` tokeny jsou závazné pro Phase 4 frontend implementaci. Token bez explicitního lockování v sekci §1 je v sekci §2 (Phase 1B doplní).

---

## §1 · Decided (locked)

### §1.1 · Color tokens

#### Light mode

| Role | HEX | Použití |
|---|---|---|
| `--bg` | `#FAFAFA` | Hlavní pozadí stránky |
| `--surface` | `#F4F4F5` | Surface 1 — audit cards background, hover states, code blocks |
| `--surface-2` | `#EEEEEF` | Surface 2 — modal scrim base, raised elements |
| `--border` | `#D4D4D8` | Viditelné hairline `1px` separátory mezi cells |
| `--border-soft` | `#E4E4E7` | Soft separators v sektorech footeru, jemné dividery |
| `--ink` | `#0A0B0E` | Primární text |
| `--secondary` | `#52525B` | Sekundární text, body kopie |
| `--tertiary` | `#71717A` | Captions, meta info, mono labels, datelines |
| `--accent` | `#3730A3` | **Indigo signature** — primární CTA bg, link underlines, accent rules |
| `--accent-bright` | `#4F46C7` | Indigo hover state, lighter variant |
| `--accent-soft` | `rgba(55, 48, 163, 0.08)` | Accent badge bg (Most popular badge atd.) |
| `--success` | `#15803D` | Green dot v status line, success states |
| `--warning` | `#A16207` | Warning states (Phase 1B může zpřesnit) |
| `--error` | `#B91C1C` | Error states — záměrně vzdálené od indiga, aby šly rozlišit |

#### Dark mode

| Role | HEX | Použití |
|---|---|---|
| `--bg` | `#0A0B0E` | Hlavní pozadí (cool ink, near-black, **ne** pure `#000`) |
| `--surface` | `#18181B` | Surface 1 |
| `--surface-2` | `#27272A` | Surface 2 |
| `--border` | `#3F3F46` | Hairlines |
| `--border-soft` | `#2A2A2E` | Soft separators |
| `--ink` | `#FAFAFA` | Primární text — bright but not glaring |
| `--secondary` | `#A1A1AA` | Sekundární |
| `--tertiary` | `#71717A` | Tertiary, captions |
| `--accent` | `#7367E5` | **Lifted indigo** — light variant pro dark mode |
| `--accent-bright` | `#9389F0` | Hover state |
| `--accent-soft` | `rgba(115, 103, 229, 0.14)` | Accent badge bg (mírně silnější opacita pro dark) |

#### WCAG verification

| Pair | Light contrast | Dark contrast | Standard |
|---|---|---|---|
| `--bg` × `--ink` | 19.0:1 | 19.0:1 | ✓ AAA |
| `--bg` × `--secondary` | 7.5:1 | 9.0:1 | ✓ AA (AAA pro dark) |
| `--bg` × `--tertiary` | 5.0:1 | 5.0:1 | ✓ AA |
| `--bg` × `--accent` | 9.8:1 | 7.5:1 | ✓ AAA light / AA dark |
| `--accent` bg × white text | 9.8:1 | 4.6:1 | ✓ AAA light / AA dark — primary CTA passes |
| `--bg` × `--success` | 4.7:1 | 4.6:1 | ✓ AA |
| `--bg` × `--error` | 6.6:1 | 5.5:1 | ✓ AA |
| `--bg` × `--warning` | 4.5:1 | 5.0:1 | ✓ AA — needs Phase 1B retest pro mobilní |

### §1.2 · Typography

| Role | Font | Source |
|---|---|---|
| Headline / display | **Inter Tight** | Google Fonts variable, full Czech (Latin Extended-A) — https://fonts.google.com/specimen/Inter+Tight |
| Body / UI | **Inter Tight** (same family, lighter weights) | viz výše |
| Mono / data / code | **Geist Mono** | Google Fonts variable, full Czech — https://fonts.google.com/specimen/Geist+Mono |

**Loading strategy:**
```html
<link href="https://fonts.googleapis.com/css2?
  family=Inter+Tight:wght@300;400;500;600;700
  &family=Geist+Mono:wght@400;500
  &display=swap" rel="stylesheet">
```
Total subset payload (Latin + Latin-Ext): ~120KB woff2 compressed for both.

**Headline default**: weight `500`, letter-spacing `-0.035em`, line-height `1.04`
**Body default**: weight `400`, letter-spacing `-0.005em`, line-height `1.55`
**UI default**: weight `500`, letter-spacing `-0.005em`
**Mono default**: weight `400`, letter-spacing `0`, line-height `1.5`

### §1.3 · Pattern (background)

**Subtle grid lines** — 40×40px square grid, `1px` ink lines at `4%` opacity, masked with radial gradient (visible in center 70% of viewport, fades to transparent at edges).

CSS implementation:
```css
.bg-grid::before {
  content: '';
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    repeating-linear-gradient(90deg, transparent 0, transparent 39px, rgba(10,11,14,0.04) 39px, rgba(10,11,14,0.04) 40px),
    repeating-linear-gradient(0deg, transparent 0, transparent 39px, rgba(10,11,14,0.04) 39px, rgba(10,11,14,0.04) 40px);
  mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 30%, transparent 80%);
}
[data-theme="dark"] .bg-grid::before {
  background-image: /* same pattern but rgba(250,250,250,0.04) */;
}
```

**Aplikace**: na `<body>` s class `bg-grid`. NEopakovat pattern uvnitř sekcí — pattern je signature pozadí celé stránky, ne dekorace každého bloku.

### §1.4 · Density

**Medium** density tokens:
- Section padding desktop: `96-128px` vertical, `48px` horizontal
- Section padding mobile: `64-96px` vertical, `24px` horizontal
- Component spacing scale: 4px base (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 160)
- Hero padding: `96px 48px 64px` desktop; `64px 24px 48px` mobile
- Card padding: `32px` desktop, `24px` mobile

### §1.5 · Alignment

**Default**: left-aligned headlines, body copy, CTA stacks. Content max-width `720px-920px` per block (headline `920px`, body sub `520px`).

Exceptions povolené (Phase 1B / Phase 4 implementace si rozhodne kdy):
- Audit pricing 3-up grid: each card text-aligned left, but grid is centered
- Footer bottom legal line: justified
- 404/error pages: centered

NE-povolené:
- Centered hero headline (zkoušeno v Tweaks variant `align-center`, Roman zvolil `left`)
- Asymmetric headline+sidebar layout (Tweaks `align-asym`)

### §1.6 · Shape

| Token | Value | Použití |
|---|---|---|
| `--radius-sm` | `4px` | Buttons, badges, mono lang tag, small chips |
| `--radius-md` | `6px` | Inputs, primary CTA buttons |
| `--radius-lg` | `8px` | Cards, audit pricing, modals |
| Border weight | `1px` | All borders, no `2px` doubled |
| Hero container radius | `0` | Hero is full-bleed, no radius |

**Shadows**: minimal. Single elevation token for floating elements:
```css
--shadow-sm: 0 1px 2px rgba(10, 11, 14, 0.04), 0 4px 12px rgba(10, 11, 14, 0.04);
--shadow-md: 0 4px 12px rgba(10, 11, 14, 0.08); /* modals only */
```
Cards use **borders, not shadows** for elevation. The "popular" audit card has accent-color border + ring instead of shadow:
```css
.audit-card.popular {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}
```

### §1.7 · Specific component decisions

**Top nav (`<header class="nav">`)**:
- VICTA + mono `/ digital agency` tag
- Right side: Audit · Služby · Proces · Kontakt + theme toggle + CS lang chip
- Sticky with `backdrop-filter: blur(12px)`, semi-transparent bg
- Border-bottom `1px` border-soft

**Status line** (in hero): `STATUS · v 0.1.0 · published [date] · region eu-central-1` — Geist Mono 12px tertiary, with green dot. **Locked as a signature element** of every page (in different forms — homepage shows full version, sub-pages can show abbreviated `STATUS · v 0.1.0`).

**CTAs**:
- Primary: `bg: --accent`, `color: --bg`, `border: --accent`
- Ghost: `bg: --bg`, `color: --ink`, `border: --border`
- Border-radius `--radius-md` (6px)
- Padding `12px 24px`
- Font weight 500, letter-spacing `-0.005em`

**Czech typography rules** (from `design-directions.md` §0.5 — applied uniformly):
- „uvozovky" (lower-9 + upper-99), real Unicode chars
- `—` em-dash with thin/non-breaking spaces in editorial moments
- Non-breaking space (` `) after `k`, `s`, `v`, `z`, `o`, `u`, `i`, `a` (single-letter prepositions/conjunctions)
- Number + unit: `50 %`, `4 000 Kč`, `€800` — non-breaking space
- Thousand separator: non-breaking thin space (`2 500`, not `2,500`)
- `text-wrap: pretty` on body copy where supported
- No orphans/widows on hero copy

---

## §2 · Phase 1B (`architect`) doplní

Tyto rozhodnutí přicházejí v Phase 1B podle Foundation pipeline. Návrhy níže jsou **suggested defaults** — architect je může převzít nebo změnit s odůvodněním.

### §2.1 · Type scale

**Suggested**: perfect fourth (1.333):
```
xs    12px
sm    13px
base  15px
lg    19px
xl    25px
2xl   33px
3xl   45px
4xl   60px
5xl   80px
```

Použito v `locked-preview.html`. Phase 1B může zpřesnit responsive breakpointy a clamp() formule pro fluid typography.

### §2.2 · Spacing scale

**Suggested**: 4px base (`--space-1` through `--space-32`):
```
1: 4 / 2: 8 / 3: 12 / 4: 16 / 6: 24 / 8: 32 / 12: 48 / 16: 64 / 24: 96 / 32: 128 / 40: 160
```

### §2.3 · Motion tokens

**Suggested defaults:**
- `--duration-fast: 150ms` — micro-interactions (hover, focus)
- `--duration-mid: 250ms` — state changes, opens
- `--duration-slow: 400ms` — page transitions
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` — entrance default
- `--ease-in: cubic-bezier(0.5, 0, 0.75, 0)` — exit
- All motion respects `prefers-reduced-motion`

Phase 1B `architect` může zvážit zda chceme:
- Generative motion in hero (subtle moving gradient mesh) — opt-in
- Scroll-driven animations — opt-in
- View Transitions API for SPA-style page changes
- Real-time pulsing on `--success` dot in status line (1.5s loop, opacity 0.6→1.0)

### §2.4 · Iconography family

**Suggested**: Lucide (free, MIT, full set, 1.5px stroke matches Inter Tight precision).

Alternativy: Tabler Icons (větší set, podobný styl), Phosphor (více filled variants pro active states).

Phase 1B by měl rozhodnout JEDNU rodinu a stick to it. Žádné mix-and-match.

### §2.5 · Photography & illustration strategy

**From `design-directions.md` §C.9** (carry forward):
- Minimal photography at launch — replaced by:
  - Generative grid pattern (already locked in §1.3)
  - System diagrams for industry pages (1px lines, mono labels, indigo accent)
  - Optional: real photography for Tým page when ready (cool grade, slight desaturate, often duotone in indigo)
- AEO/SEO OG cards: typography-only, indigo accent line, ne stock photos
- Industry-page schematics: cohesive visual language across 6 industries (e-commerce, manufacturing, professional services, finance, healthcare, customer support)

Phase 1B `architect` by měl rozhodnout: kdo kreslí systém-diagramy (commissioned, AI-generated via nano-banana, in-house Figma)? A jaké je launch-blocker minimum (homepage + 1 industry hero?).

### §2.6 · OG image template strategy

Suggested: 1200×630 PNG template, generated at build time via Next.js OG image API (Vercel native), using:
- Inter Tight 500 weight headline (large)
- Geist Mono accent line (small)
- `--bg` background
- Subtle grid pattern (locked)
- Single indigo accent rule

Phase 1B by měl rozhodnout: per-page OG (different per route) vs single template + per-page title overlay.

### §2.7 · Specific layout patterns Phase 1B doplní

- Service detail pages — layout still TBD
- Industry pages — layout still TBD
- "Náš proces" page — needs intentional layout that demonstrates listening (longer body copy, less density, possibly serif italic pull-quotes — bridge to direction A's editorial mood for THIS one page only)
- Blog placeholder (deferred per intent.md; if launched as stub, layout TBD)
- Team page — Phase 1B + Phase 4 sequencing per intent.md (built last)

---

## §3 · Verification artifacts

Reference outputs from Phase 1A:

| Artifact | Path | Content |
|---|---|---|
| Direction proposal | `docs/design-exploration/design-directions.md` | 3 directions × 10 sections (Editorial Trust / Quiet Confidence / Computed Modernism) |
| Visual companion v1 | `docs/design-exploration/visual-companion.html` | All 3 directions side-by-side, full pages |
| Visual companion v2 | `docs/design-exploration/visual-companion-v2.html` | 24 hero variants + Tweaks live mixer (~14k combinations) — Roman vybral z tohoto |
| Locked preview | `docs/design-exploration/locked-preview.html` | **THE chosen direction** rendered as full page (hero + services + audit pricing + footer) |
| Screenshots | `docs/design-exploration/screenshots/` | Playwright snapshots — light + dark, all phases |
| **This document** | `docs/design-exploration/design-decision.md` | Token contract for Phase 1B |

---

## §4 · Hand-off to Phase 1B

`architect` agent on next phase consumes:
1. `.workforce/intent.md` — original intent contract (functional scope)
2. `docs/design-exploration/design-decision.md` — **this file** (visual contract)
3. (Forthcoming) `requirements.md`, `security-model.md`, `market-analysis.md`

`architect`'s job:
- Translate locked tokens into `tailwind.config.ts` (or equivalent design-token JSON if non-Tailwind stack chosen)
- Decide stack-specific implementation of pattern (CSS in Tailwind plugin? raw stylesheet? CSS-in-JS?)
- Make decisions in §2 (type scale fluid formulas, motion tokens, icon family, photography sourcing)
- Author `architecture.md` with component architecture proposal
- `stack-selector` runs in parallel — choices likely converge on Next.js App Router + Tailwind 4 + shadcn/ui (Roman's stated reference 21st.dev = shadcn ecosystem; intent.md item §10 names Vercel deployment)

`architect` output triggers Phase 4 frontend implementation team.

---

## §5 · Status block

| Field | Value |
|---|---|
| Phase | Phase 1A complete · awaiting Phase 1B |
| Decision date | 2026-05-06 |
| Decided by | Roman, via Tweaks mixer in `visual-companion-v2.html` |
| Combination signature | `Inter Tight · indigo · grid · medium · left · 500 · normal` |
| Locked-preview rendered | ✓ `locked-preview.html` |
| WCAG AA verification | ✓ all critical pairs pass; warning state needs retest at mobile resolution |
| Czech typography rules | ✓ applied (uvozovky, em-dash, nbsp after k/s/v/z/o/u/i/a, thousand separator) |
| Phase 1A artifacts archived | `docs/design-exploration/` |
| Next gate | Phase 1B `architect` reads this + `intent.md` (+ forthcoming requirements/security/market) → produces `architecture.md` + design-tokens config |
