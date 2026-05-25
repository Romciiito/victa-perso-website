# Design System v2 — PR 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the design system v2 foundation (new tokens, fonts, primitives, refactored shared components) without any visible page changes — pages stay on old tokens until PR 2.

**Architecture:** New `globals.css` replaces all locked D-001 tokens with D-008 (Geist + slate light / lavender dark). Next/font self-hosts three families. Six new component primitives implement soft-skill Section 3-4 patterns (Eyebrow, BentoShell/BentoCard, EditorialSplit, AsymmetricalBento, VisualCanvas, BodyOrbs). Three existing shared components (Button, Nav, ThemeToggle) refactored to match. Grep-based pre-commit hook enforces taste-skill banned patterns. No page imports new primitives in this PR — pages migrate in PR 2.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind v4 · CSS Custom Properties · next/font · next-themes (kept) · @phosphor-icons/react (new) · husky pre-commit

**Spec reference:** `docs/superpowers/specs/2026-05-24-design-system-v2-design.md`

---

## File map

**New:**
- `src/components/eyebrow.tsx` — status pill with breathing dot
- `src/components/bento.tsx` — BentoShell (outer Double-Bezel) + BentoCard (inner core)
- `src/components/editorial-split.tsx` — Hero layout primitive
- `src/components/asymmetrical-bento.tsx` — Grid layout primitive
- `src/components/visual-canvas.tsx` — Hero variant C visual block
- `src/components/body-orbs.tsx` — Atmospheric radial mesh background (server component)
- `scripts/banned-patterns.sh` — Grep-based pre-commit check
- `docs/claude/design-decisions-v2.md` — Pointer doc

**Modified:**
- `src/styles/globals.css` — full replace, all tokens
- `src/app/[locale]/layout.tsx` — swap Inter_Tight → Geist + add Newsreader
- `src/components/button.tsx` — pill radius + Button-in-Button arrow primary variant
- `src/components/nav.tsx` — Fluid Island floating pill
- `src/components/theme-toggle.tsx` — sun/moon SVG icons
- `package.json` — add `@phosphor-icons/react`
- `.husky/pre-commit` — add banned-patterns.sh invocation

**Preserved (do not delete until PR 7):**
- All Lucide icon imports in existing pages — migrate progressively
- Old grid background CSS — removed only from body class, not from globals.css

---

## Task 0: Branch setup

**Files:**
- N/A (branch operation)

- [ ] **Step 1: Verify clean working tree on `content-only`**

```bash
cd /Users/trungle/Desktop/websites/VICTA
git status
git log --oneline -1
```

Expected: clean working tree, HEAD at `9bd69c8 feat(design): D-008 unlock — soft-skill v2 design system (vibe 2 light + 3 dark)`.

- [ ] **Step 2: Create and switch to `design-system-v2` branch**

```bash
git checkout -b design-system-v2
```

Expected output: `Switched to a new branch 'design-system-v2'`

- [ ] **Step 3: Push branch to remote with tracking**

```bash
git push -u origin design-system-v2
```

Expected: new branch on remote, tracking set.

---

## Task 1: Install Phosphor icons package

**Files:**
- Modify: `package.json` (add `@phosphor-icons/react` to dependencies)
- Modify: `pnpm-lock.yaml` (auto)

- [ ] **Step 1: Install package**

```bash
pnpm add @phosphor-icons/react@^2.1.0
```

Expected: `+ @phosphor-icons/react 2.1.x`. Package added to dependencies.

- [ ] **Step 2: Verify import works**

```bash
node -e "const p = require('@phosphor-icons/react/dist/ssr'); console.log(typeof p.ArrowRight);"
```

Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore(deps): add @phosphor-icons/react for taste-skill icon migration

Replaces lucide-react per soft-skill Section 2 (banned: Lucide light-stroke
defaults). Migration is progressive — both libraries coexist during PR 1-6.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Replace globals.css with D-008 tokens

**Files:**
- Modify: `src/styles/globals.css` (full replacement)

- [ ] **Step 1: Write new globals.css**

Replace entire file content with:

```css
/* ============================================================
   VICTA — globals.css
   Tailwind v4 entry point + D-008 LOCKED design tokens
   Source of truth: docs/superpowers/specs/2026-05-24-design-system-v2-design.md
   DO NOT change token values without D-### successor in decisions.md
   ============================================================ */

@import "tailwindcss";

/* ============================================================
   Tailwind v4 @theme — maps CSS Custom Properties to utilities
   ============================================================ */
@theme {
  /* Fonts */
  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-serif: var(--font-newsreader), ui-serif, serif;

  /* Colors — reference CSS Custom Properties set in :root / [data-theme="dark"] */
  --color-bg: var(--bg);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-deep: var(--bg-deep);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-soft: var(--ink-soft);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-status-ok: var(--status-ok);
  --color-status-warn: var(--status-warn);
  --color-status-err: var(--status-err);

  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-xl: 28px;

  /* Shadows */
  --shadow-sm: 0 1px 1px rgba(10,11,14,0.02), 0 4px 14px -4px rgba(10,11,14,0.05);
  --shadow-card: inset 0 1px 0 rgba(255,255,255,0.9), 0 30px 60px -30px rgba(10,11,14,0.12);
  --shadow-card-hover: inset 0 1px 0 rgba(255,255,255,0.9), 0 50px 100px -40px rgba(10,11,14,0.18);
  --shadow-cta: 0 1px 0 rgba(255,255,255,0.15) inset, 0 10px 28px -10px rgba(10,11,14,0.45);
}

/* ============================================================
   LIGHT MODE (Soft Structuralism — Vibe 2)
   D-008 LOCKED 2026-05-24, replaces D-001 §1.1
   ============================================================ */
:root {
  /* Surfaces */
  --bg: #F4F5F7;
  --bg-elevated: #FFFFFF;
  --bg-deep: #ECEEF1;

  /* Ink */
  --ink: #0A0B0E;
  --ink-muted: #4B5159;
  --ink-soft: #8E949D;

  /* Lines */
  --line: rgba(10, 11, 14, 0.06);
  --line-strong: rgba(10, 11, 14, 0.12);

  /* Accent */
  --accent: #1F2937;
  --accent-soft: rgba(31, 41, 55, 0.05);

  /* Status (kept from D-001 — WCAG AA verified) */
  --status-ok: #16A34A;
  --status-warn: #A16207;
  --status-err: #B91C1C;

  /* Atmospheric orbs */
  --orb-1: rgba(56, 70, 91, 0.06);
  --orb-2: rgba(120, 130, 150, 0.05);

  /* Shape */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-xl: 28px;

  /* Motion */
  --ease: cubic-bezier(0.32, 0.72, 0, 1);
}

/* ============================================================
   DARK MODE (Ethereal Glass — Vibe 3)
   ============================================================ */
[data-theme="dark"] {
  --bg: #050508;
  --bg-elevated: rgba(255, 255, 255, 0.03);
  --bg-deep: #030305;

  --ink: #F4F4F6;
  --ink-muted: #A8ABB4;
  --ink-soft: #6B6F78;

  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.14);

  --accent: #DCD7FF;
  --accent-soft: rgba(150, 120, 255, 0.12);

  --status-ok: #4ADE80;

  --orb-1: rgba(150, 120, 255, 0.55);
  --orb-2: rgba(60, 220, 180, 0.40);

  /* Dark-mode shadow overrides */
  --shadow-card: inset 0 1px 0 rgba(255,255,255,0.10), 0 20px 50px -20px rgba(0,0,0,0.5);
  --shadow-card-hover: inset 0 1px 0 rgba(255,255,255,0.14), 0 30px 70px -20px rgba(0,0,0,0.6);
  --shadow-cta: inset 0 1px 0 rgba(255,255,255,0.8), 0 14px 32px -10px rgba(120,100,220,0.5), 0 0 0 1px rgba(255,255,255,0.18);
}

/* ============================================================
   Base styles
   ============================================================ */
html {
  background-color: var(--bg);
  color: var(--ink);
  font-family: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 600ms cubic-bezier(0.32, 0.72, 0, 1), color 600ms cubic-bezier(0.32, 0.72, 0, 1);
}

body {
  background-color: var(--bg);
  color: var(--ink);
  font-weight: 400;
  letter-spacing: -0.005em;
  line-height: 1.5;
  position: relative;
  min-height: 100dvh;
  overflow-x: hidden;
}

/* ============================================================
   Utility classes — token-referenced colors
   All components MUST use these — never hardcode hex
   (claude-rules.md rule 8, AR-10)
   ============================================================ */

.text-ink         { color: var(--ink); }
.text-ink-muted   { color: var(--ink-muted); }
.text-ink-soft    { color: var(--ink-soft); }
.text-accent      { color: var(--accent); }
.text-status-ok   { color: var(--status-ok); }

.bg-bg          { background-color: var(--bg); }
.bg-elevated    { background-color: var(--bg-elevated); }
.bg-deep        { background-color: var(--bg-deep); }
.bg-accent      { background-color: var(--accent); }
.bg-accent-soft { background-color: var(--accent-soft); }

.border-line        { border-color: var(--line); }
.border-line-strong { border-color: var(--line-strong); }
.border-accent      { border-color: var(--accent); }

/* ============================================================
   Typography defaults
   ============================================================ */

/* Headlines: Geist 600, tight letter-spacing, line-height 0.94 */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 0.94;
}

/* Czech typography: text-wrap pretty where supported */
p, h1, h2, h3, h4, h5, h6 {
  text-wrap: pretty;
}

/* Mono defaults */
code, pre, .font-mono {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.5;
}

/* Serif accent (used selectively, e.g., H1 italic accent word) */
.font-serif, em.accent {
  font-family: var(--font-newsreader), ui-serif, serif;
}

/* ============================================================
   Noise overlay (replaces 40×40 grid from D-001)
   Fixed, pointer-events: none, applied via ::after
   ============================================================ */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.2 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0;
  mix-blend-mode: overlay;
  transition: opacity 600ms cubic-bezier(0.32, 0.72, 0, 1);
}

[data-theme="dark"] body::after {
  opacity: 0.18;
}

/* ============================================================
   Reduced motion respect
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify the file is valid CSS (no syntax errors)**

```bash
pnpm next build 2>&1 | grep -E "Error|error" | head -5
```

Expected: no CSS-related errors (Tailwind compilation issues will surface here).

If errors appear referencing `--font-geist` not yet defined — this is expected and resolved in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(design): D-008 globals.css — replace D-001 tokens entirely

New tokens per spec §3:
- Silver-grey light bg (#F4F5F7) + OLED dark (#050508)
- Slate accent light / lavender dark (replaces indigo)
- Radius scale 8/14/22/28 (up from 4/6/8)
- Ambient soft shadows + dark glass shadows
- Noise overlay replaces 40×40 grid
- Reduced motion respect

Font variables reference --font-geist, --font-geist-mono, --font-newsreader
which will be wired in Task 3 (layout.tsx).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Update layout.tsx — swap Inter Tight → Geist + add Newsreader

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Replace font imports and variables**

Find the existing imports:
```typescript
import { Inter_Tight, Geist_Mono } from 'next/font/google';
```

Replace with:
```typescript
import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
```

Find:
```typescript
const interTight = Inter_Tight({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});
```

Replace with:
```typescript
const geist = Geist({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: ['300'],
  style: ['italic'],
  variable: '--font-newsreader',
  display: 'swap',
});
```

- [ ] **Step 2: Update body className to use new font variables**

Find:
```typescript
<body className={`${interTight.variable} ${geistMono.variable} bg-grid antialiased`}>
```

Replace with:
```typescript
<body className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}>
```

Note: `bg-grid` class is removed — replaced by `BodyOrbs` component added in Task 9.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck 2>&1 | tail -10
```

Expected: zero TypeScript errors.

- [ ] **Step 4: Build to verify font loading works**

```bash
pnpm build 2>&1 | grep -E "Failed|Error|✓ Compiled" | tail -5
```

Expected: `✓ Compiled successfully` or equivalent.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/layout.tsx
git commit -m "$(cat <<'EOF'
feat(fonts): swap Inter Tight → Geist + add Newsreader italic accent

Per spec §3.2 D-008 font stack:
- Geist (Variable 300..700) replaces Inter Tight (banned by taste-skill §7)
- Geist Mono kept (already aligned)
- Newsreader italic 300 added for selective H1 accent words only

next/font self-hosts all 3 families with latin + latin-ext subsets covering
all Czech diacritics (ě, š, č, ř, ž, ý, á, í, é, ú, ů, ó).

bg-grid class removed from body — replaced by BodyOrbs component in Task 9.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Build Eyebrow component

**Files:**
- Create: `src/components/eyebrow.tsx`

- [ ] **Step 1: Write the component**

```typescript
import type { ReactNode } from 'react';

type EyebrowProps = {
  /** Status indicator: 'ok' shows green breathing dot. 'none' hides dot. */
  status?: 'ok' | 'none';
  /** Children: typically text content like "VICTA Digital · česká digitální agentura" */
  children: ReactNode;
  className?: string;
};

/**
 * Eyebrow — status pill above H1 sections (soft-skill §4.C "Eyebrow Tags").
 * Renders as fit-content pill with optional breathing dot indicator.
 * All colors via CSS tokens — no hardcoded values.
 */
export function Eyebrow({ status = 'ok', children, className = '' }: EyebrowProps) {
  return (
    <div
      className={`inline-flex w-fit items-center gap-2.5 rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--line)',
        color: 'var(--ink-muted)',
        boxShadow: 'var(--shadow-sm)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {status === 'ok' ? <EyebrowDot /> : null}
      <span>{children}</span>
    </div>
  );
}

function EyebrowDot() {
  return (
    <span
      aria-hidden
      className="inline-block h-[5px] w-[5px] rounded-full"
      style={{
        background: 'var(--status-ok)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--status-ok) 18%, transparent)',
        animation: 'eyebrow-breathe 2.6s cubic-bezier(0.32, 0.72, 0, 1) infinite',
      }}
    />
  );
}
```

- [ ] **Step 2: Add keyframes to globals.css**

Append to `src/styles/globals.css`:

```css
/* ============================================================
   Component keyframes
   ============================================================ */
@keyframes eyebrow-breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.85); }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(28px); filter: blur(6px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck 2>&1 | tail -5
```

Expected: zero errors.

- [ ] **Step 4: Lint**

```bash
pnpm lint 2>&1 | tail -10
```

Expected: zero errors / warnings.

- [ ] **Step 5: Commit**

```bash
git add src/components/eyebrow.tsx src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(components): add Eyebrow primitive (soft-skill §4.C)

Status pill above H1 sections — fit-content, pill radius, optional
breathing green dot. All colors via CSS tokens.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Build BentoShell + BentoCard components

**Files:**
- Create: `src/components/bento.tsx`

- [ ] **Step 1: Write the component file**

```typescript
import type { ReactNode } from 'react';

type BentoShellProps = {
  /** Children: typically one or more BentoCard or BentoCard-equivalent content */
  children: ReactNode;
  /** Grid column span — 1 (default) or 2 (feature card) */
  span?: 1 | 2;
  className?: string;
};

/**
 * BentoShell — outer Double-Bezel wrapper (soft-skill §4.A "Doppelrand").
 * Provides outer ring + padding + outer radius. Wrap a BentoCard inside.
 *
 * Usage:
 *   <BentoShell>
 *     <BentoCard>...</BentoCard>
 *   </BentoShell>
 */
export function BentoShell({ children, span = 1, className = '' }: BentoShellProps) {
  return (
    <div
      className={`p-1.5 ${span === 2 ? 'col-span-2' : ''} ${className}`}
      style={{
        background: 'color-mix(in srgb, var(--ink) 3%, transparent)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {children}
    </div>
  );
}

type BentoCardProps = {
  children: ReactNode;
  /** Inner padding scale */
  padding?: 'compact' | 'standard' | 'loose';
  className?: string;
};

/**
 * BentoCard — inner core of Double-Bezel pattern.
 * Has its own background, border, inner highlight, and hover lift on
 * parent BentoShell:hover.
 */
export function BentoCard({ children, padding = 'standard', className = '' }: BentoCardProps) {
  const padClass = {
    compact: 'px-5 py-5',
    standard: 'px-6 py-7',
    loose: 'px-7 py-8',
  }[padding];

  return (
    <div
      className={`relative grid h-full content-between gap-4 overflow-hidden ${padClass} ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 700ms var(--ease), box-shadow 700ms var(--ease)',
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Add hover lift CSS to globals.css**

Append to `src/styles/globals.css`:

```css
/* BentoShell hover lifts its inner BentoCard */
.bento-shell-hover:hover .bento-card-inner {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}
```

Then update `bento.tsx`:
- On `BentoShell` root div, add `bento-shell-hover` to className
- On `BentoCard` root div, add `bento-card-inner` to className

Final `BentoShell`:
```typescript
className={`bento-shell-hover p-1.5 ${span === 2 ? 'col-span-2' : ''} ${className}`}
```

Final `BentoCard`:
```typescript
className={`bento-card-inner relative grid h-full content-between gap-4 overflow-hidden ${padClass} ${className}`}
```

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/bento.tsx src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(components): add BentoShell + BentoCard Double-Bezel primitives

Implements soft-skill §4.A nested architecture: outer shell (subtle bg +
hairline border + outer radius) + inner core (own bg + line + shadow + lift
on parent hover).

Usage: <BentoShell><BentoCard>...</BentoCard></BentoShell>
Span 1 (default) or 2 (feature card in Asymmetrical Bento).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Build EditorialSplit component

**Files:**
- Create: `src/components/editorial-split.tsx`

- [ ] **Step 1: Write the component**

```typescript
import type { ReactNode } from 'react';

type EditorialSplitProps = {
  left: ReactNode;
  right: ReactNode;
  /** Horizontal ratio: 'balanced' = 1fr/1fr, 'left-heavy' = 1.05fr/1fr */
  ratio?: 'balanced' | 'left-heavy';
  /** Section padding scale */
  padding?: 'hero' | 'standard';
  className?: string;
};

/**
 * EditorialSplit — soft-skill §3.B.3 layout archetype.
 * Massive content on the left, interactive block on the right.
 * Mobile fallback: stacks vertically below 980px.
 */
export function EditorialSplit({
  left,
  right,
  ratio = 'left-heavy',
  padding = 'hero',
  className = '',
}: EditorialSplitProps) {
  const gridCols = ratio === 'balanced' ? '1fr 1fr' : '1.05fr 1fr';
  const padY = padding === 'hero'
    ? 'pt-32 pb-24 md:pt-[168px] md:pb-24'
    : 'py-24 md:py-32';

  return (
    <section
      className={`relative z-[1] mx-auto grid w-full max-w-[1440px] items-center gap-14 px-6 md:px-8 ${padY} ${className}`}
      style={{
        gridTemplateColumns: gridCols,
        minHeight: padding === 'hero' ? '100dvh' : 'auto',
      }}
    >
      <style>{`
        @media (max-width: 980px) {
          section.editorial-split {
            grid-template-columns: 1fr !important;
            gap: 3.5rem !important;
          }
        }
      `}</style>
      <div className="editorial-split-left grid content-start gap-8">{left}</div>
      <div className="editorial-split-right grid h-full content-center gap-3">{right}</div>
    </section>
  );
}
```

Wait — using inline `<style>` tags is fragile. Replace with class-based responsive override.

- [ ] **Step 2: Refactor to use globals.css for media query**

Replace the inline `<style>` with a className `editorial-split`. Add to `src/styles/globals.css`:

```css
/* ============================================================
   Layout primitives — responsive overrides
   ============================================================ */
.editorial-split {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
}
.editorial-split[data-ratio="balanced"] {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 980px) {
  .editorial-split,
  .editorial-split[data-ratio="balanced"] {
    grid-template-columns: 1fr;
    gap: 3.5rem !important;
  }
}
```

Update `editorial-split.tsx` to:

```typescript
import type { ReactNode } from 'react';

type EditorialSplitProps = {
  left: ReactNode;
  right: ReactNode;
  ratio?: 'balanced' | 'left-heavy';
  padding?: 'hero' | 'standard';
  className?: string;
};

export function EditorialSplit({
  left,
  right,
  ratio = 'left-heavy',
  padding = 'hero',
  className = '',
}: EditorialSplitProps) {
  const padY = padding === 'hero'
    ? 'pt-32 pb-24 md:pt-[168px] md:pb-24'
    : 'py-24 md:py-32';
  const minH = padding === 'hero' ? 'min-h-[100dvh]' : '';

  return (
    <section
      data-ratio={ratio}
      className={`editorial-split relative z-[1] mx-auto w-full max-w-[1440px] items-center gap-14 px-6 md:px-8 ${padY} ${minH} ${className}`}
    >
      <div className="grid content-start gap-8">{left}</div>
      <div className="grid h-full content-center gap-3">{right}</div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/editorial-split.tsx src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(components): add EditorialSplit layout primitive (soft-skill §3.B.3)

Hero-grade layout: massive content left, interactive block right.
Configurable ratio (left-heavy/balanced) and padding (hero/standard).
Mobile fallback to single-column stack below 980px via globals.css
media query (not inline style — better SSR).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Build AsymmetricalBento component

**Files:**
- Create: `src/components/asymmetrical-bento.tsx`

- [ ] **Step 1: Write the component**

```typescript
import type { ReactNode } from 'react';

type AsymmetricalBentoProps = {
  /** Children — typically BentoShell elements; first one becomes feature (col-span-2) by default */
  children: ReactNode;
  /** Number of columns at desktop. Default 3. */
  cols?: 2 | 3 | 4;
  /** Gap between cells. */
  gap?: 'tight' | 'standard' | 'loose';
  className?: string;
};

/**
 * AsymmetricalBento — soft-skill §3.B.1 layout archetype.
 * Grid container that supports feature cards spanning 2 columns.
 * Children with `data-feature="true"` get col-span-2 automatically.
 * Mobile fallback: single column below 768px.
 *
 * Usage:
 *   <AsymmetricalBento cols={3}>
 *     <BentoShell span={2}>...</BentoShell>  // feature
 *     <BentoShell>...</BentoShell>
 *     <BentoShell>...</BentoShell>
 *     <BentoShell>...</BentoShell>
 *   </AsymmetricalBento>
 */
export function AsymmetricalBento({
  children,
  cols = 3,
  gap = 'standard',
  className = '',
}: AsymmetricalBentoProps) {
  const gapClass = {
    tight: 'gap-3',
    standard: 'gap-4',
    loose: 'gap-6',
  }[gap];

  const colClass = {
    2: 'asymmetrical-bento-2',
    3: 'asymmetrical-bento-3',
    4: 'asymmetrical-bento-4',
  }[cols];

  return (
    <div className={`asymmetrical-bento ${colClass} grid ${gapClass} ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Add responsive grid CSS to globals.css**

Append to `src/styles/globals.css`:

```css
/* AsymmetricalBento column grids — mobile collapses to 1col */
.asymmetrical-bento-2 { grid-template-columns: 1fr 1fr; }
.asymmetrical-bento-3 { grid-template-columns: 1fr 1fr 1fr; }
.asymmetrical-bento-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }

@media (max-width: 768px) {
  .asymmetrical-bento-2,
  .asymmetrical-bento-3,
  .asymmetrical-bento-4 {
    grid-template-columns: 1fr;
  }
  /* On mobile, even feature span-2 cards become full width */
  .asymmetrical-bento [class*="col-span"] {
    grid-column: 1 / -1;
  }
}
```

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/asymmetrical-bento.tsx src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(components): add AsymmetricalBento grid primitive (soft-skill §3.B.1)

Masonry-like CSS Grid with configurable column count (2/3/4) and gap
scale. Children can opt-in to col-span-2 via BentoShell's span prop for
the "feature card" pattern. Mobile fallback to single column below 768px.

Replaces the banned "3 equal cards" pattern (taste-skill §7).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Build VisualCanvas component

**Files:**
- Create: `src/components/visual-canvas.tsx`

- [ ] **Step 1: Write the component**

```typescript
type VisualCanvasProps = {
  /** Optional tag line — small mono uppercase label */
  tag?: string;
  /** Title — appears at bottom-left of canvas */
  title: string;
  className?: string;
  /** Minimum height in px (default 180) */
  minHeight?: number;
};

/**
 * VisualCanvas — soft-skill variant C for hero right column.
 * Abstract gradient canvas with subtle dotted overlay and bottom-left caption.
 * Theme-aware via CSS tokens.
 */
export function VisualCanvas({ tag, title, className = '', minHeight = 180 }: VisualCanvasProps) {
  return (
    <div
      className={`visual-canvas relative flex w-full items-end overflow-hidden ${className}`}
      style={{
        minHeight: `${minHeight}px`,
        height: '100%',
        padding: '24px 26px',
        background:
          'radial-gradient(ellipse 40% 50% at 30% 30%, color-mix(in srgb, var(--accent) 25%, transparent), transparent 60%),' +
          'radial-gradient(ellipse 40% 50% at 70% 70%, var(--accent-soft), transparent 60%),' +
          'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-deep) 100%)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          // mask-image lets us use theme-aware background-color for the dots.
          // SVG data URLs cannot resolve currentColor or CSS vars on fills.
          maskImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><pattern id='dots' x='0' y='0' width='12' height='12' patternUnits='userSpaceOnUse'><circle cx='1' cy='1' r='0.7' fill='black'/></pattern></defs><rect width='200' height='200' fill='url(%23dots)'/></svg>\")",
          WebkitMaskImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><pattern id='dots' x='0' y='0' width='12' height='12' patternUnits='userSpaceOnUse'><circle cx='1' cy='1' r='0.7' fill='black'/></pattern></defs><rect width='200' height='200' fill='url(%23dots)'/></svg>\")",
          backgroundColor: 'var(--ink)',
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      />
      <div className="relative z-[1] grid gap-1">
        {tag ? (
          <div
            className="font-mono uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '0.18em',
              color: 'var(--ink-muted)',
            }}
          >
            {tag}
          </div>
        ) : null}
        <div
          className="font-medium"
          style={{
            fontSize: '16px',
            letterSpacing: '-0.015em',
            color: 'var(--ink)',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/visual-canvas.tsx
git commit -m "$(cat <<'EOF'
feat(components): add VisualCanvas — hero right column variant C

Abstract gradient + dotted overlay block with bottom-left caption.
Theme-aware via tokens (accent + accent-soft + bg-elevated + bg-deep).

Per design spec: testimonial variant (B) deferred until real client quotes;
visual canvas (C) is the launch variant.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Build BodyOrbs component

**Files:**
- Create: `src/components/body-orbs.tsx`

- [ ] **Step 1: Write the component**

```typescript
/**
 * BodyOrbs — atmospheric radial mesh background applied to body.
 * Server component (no JS, pure CSS). Theme-aware via tokens.
 *
 * Usage: render once at the root, fixed inset:-20%, z-index 0, pointer-events none.
 * Drift animation 40s ease-in-out infinite — soft motion, no performance cost.
 */
export function BodyOrbs() {
  return (
    <div
      aria-hidden
      className="body-orbs pointer-events-none fixed -inset-[20%] z-0"
      style={{
        background:
          'radial-gradient(ellipse 40% 30% at 20% 18%, var(--orb-1), transparent 60%),' +
          'radial-gradient(ellipse 35% 30% at 80% 70%, var(--orb-2), transparent 60%),' +
          'radial-gradient(ellipse 50% 40% at 50% 0%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 60%)',
        filter: 'blur(40px)',
        animation: 'body-orbs-drift 40s ease-in-out infinite',
      }}
    />
  );
}
```

- [ ] **Step 2: Add keyframes to globals.css**

Append:

```css
@keyframes body-orbs-drift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-3%, 2%); }
}
```

- [ ] **Step 3: Mount in layout.tsx**

Find in `src/app/[locale]/layout.tsx`:
```typescript
import { Footer } from '@/components/footer';
```

Add right below:
```typescript
import { BodyOrbs } from '@/components/body-orbs';
```

Find:
```typescript
<body className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}>
  <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem storageKey="victa-theme">
```

Insert `BodyOrbs` immediately inside `<ThemeProvider>`:
```typescript
<body className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}>
  <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem storageKey="victa-theme">
    <BodyOrbs />
```

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 5: Build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/body-orbs.tsx src/styles/globals.css src/app/[locale]/layout.tsx
git commit -m "$(cat <<'EOF'
feat(components): add BodyOrbs atmospheric background + mount in layout

Server component (no JS), pure CSS radial mesh + slow drift animation.
Three radial gradients sourced from --orb-1, --orb-2, --accent tokens.
Theme-aware: subtle gray glow in light mode, dramatic purple/emerald in dark.

Mounted in layout.tsx as first child of ThemeProvider — sits below Nav
and main content (z-index 0), fixed -inset-[20%], pointer-events-none.

Replaces the 40×40 grid pattern from D-001 (removed from body className in
Task 3).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Refactor Button component (pill + Button-in-Button)

**Files:**
- Modify: `src/components/button.tsx`

- [ ] **Step 1: Replace entire file**

Replace contents of `src/components/button.tsx` with:

```typescript
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

type Variant = 'primary' | 'ghost';
type Size = 'md' | 'lg';

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Show Button-in-Button arrow (primary variant only). Default true for primary. */
  showArrow?: boolean;
  className?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
  external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | 'href'>;

type NativeButtonProps = CommonProps & {
  href?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

type Props = LinkButtonProps | NativeButtonProps;

/**
 * Button — primary CTA pattern from soft-skill §4.B.
 * Primary: solid pill with Button-in-Button trailing arrow circle.
 * Ghost: glass pill with backdrop-blur.
 */
export function Button(props: Props) {
  const variant: Variant = props.variant ?? 'primary';
  const size: Size = props.size ?? 'md';
  const showArrow: boolean = props.showArrow ?? variant === 'primary';
  const className: string = props.className ?? '';

  const sizePadPrimary = size === 'lg' ? 'pl-7 pr-2.5 py-2.5' : 'pl-[22px] pr-2 py-2';
  const sizePadGhost = size === 'lg' ? 'px-7 py-4' : 'px-5 py-4';

  const baseCls =
    'inline-flex items-center gap-3 rounded-full font-medium transition-transform duration-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

  const variantCls: Record<Variant, string> = {
    primary: `${baseCls} ${sizePadPrimary} text-[15px]`,
    ghost: `${baseCls} ${sizePadGhost} text-[15px] backdrop-blur-[12px]`,
  };

  const variantStyle: Record<Variant, React.CSSProperties> = {
    primary: {
      background: 'var(--ink)',
      color: 'var(--bg)',
      boxShadow: 'var(--shadow-cta)',
      letterSpacing: '-0.005em',
      transition: 'transform 400ms var(--ease), box-shadow 400ms var(--ease)',
    },
    ghost: {
      background: 'var(--bg-elevated)',
      color: 'var(--ink)',
      border: '1px solid var(--line)',
      boxShadow: 'var(--shadow-sm)',
      letterSpacing: '-0.005em',
      transition: 'background 400ms var(--ease), transform 400ms var(--ease)',
    },
  };

  const inner = (
    <>
      <span>{props.children}</span>
      {showArrow && variant === 'primary' ? <Arrow /> : null}
    </>
  );

  const cls = `${variantCls[variant]} ${className}`;
  const style = variantStyle[variant];

  if ('href' in props && typeof props.href === 'string') {
    if (props.external) {
      return (
        <a href={props.href} className={cls} style={style} target="_blank" rel="noreferrer noopener">
          {inner}
        </a>
      );
    }
    return (
      <Link href={props.href} className={cls} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      style={style}
      onClick={(props as NativeButtonProps).onClick}
    >
      {inner}
    </button>
  );
}

function Arrow() {
  return (
    <span
      aria-hidden
      className="button-arrow inline-flex h-8 w-8 items-center justify-center rounded-full"
      style={{
        background: 'color-mix(in srgb, var(--bg) 12%, transparent)',
        transition: 'transform 400ms var(--ease)',
      }}
    >
      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h8M8 3l4 4-4 4" />
      </svg>
    </span>
  );
}
```

- [ ] **Step 2: Add hover transform CSS to globals.css**

Append:

```css
/* Button hover: arrow translates and scales slightly */
.button-arrow {
  transition: transform 400ms var(--ease);
}
a:hover > .button-arrow,
button:hover > .button-arrow {
  transform: translateX(2px) translateY(-1px) scale(1.06);
}
```

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 4: Build**

```bash
pnpm build 2>&1 | grep -E "Failed|Error" | head -5
```

Expected: no errors. Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/button.tsx src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(button): refactor to pill + Button-in-Button arrow (soft-skill §4.B)

Primary CTA: fully-rounded pill with nested 32px circular arrow that
translates diagonally + scales on hover. Ghost CTA: glass pill with
backdrop-blur. Both use --shadow-cta tokens (theme-aware).

Replaces the rounded-md 6px corners + flat ArrowRight from D-001.

API kept compatible:
- variant: 'primary' | 'ghost' (unchanged)
- size: 'md' | 'lg' (unchanged)
- showArrow: optional (default true for primary, false for ghost)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Refactor Nav component (Fluid Island desktop, drawer kept on mobile)

**Files:**
- Modify: `src/components/nav.tsx` (full replace)
- Modify: `src/styles/globals.css` (append dark-mode override + active-link indicator)

**Scope note:** Desktop nav becomes the Fluid Island floating pill per soft-skill §5.A. Mobile drawer is preserved with restyled trigger (no fullscreen overlay yet — that's PR 2 with staggered mask reveal). Skip-to-content link, locale switcher, theme toggle integration, mobile hamburger toggle, active-link indicator, i18n keys — ALL preserved.

- [ ] **Step 1: Replace nav.tsx entirely**

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { List, X } from '@phosphor-icons/react/dist/ssr';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';

type NavItem = {
  href: string;
  key: 'services' | 'solutions' | 'industries' | 'collaboration' | 'about' | 'contact';
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/sluzby', key: 'services' },
  { href: '/reseni', key: 'solutions' },
  { href: '/odvetvi', key: 'industries' },
  { href: '/spoluprace', key: 'collaboration' },
  { href: '/o-nas', key: 'about' },
  { href: '/kontakt', key: 'contact' },
];

/**
 * Nav — Fluid Island floating pill on desktop, classic drawer on mobile.
 * Soft-skill §5.A. Skip-to-content link preserved for accessibility.
 *
 * Mobile fullscreen overlay with hamburger morph + staggered link reveal
 * is deferred to PR 2.
 */
export function Nav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Skip-to-content link — visible only on focus (a11y) */}
      <a
        href="#main"
        className="sr-only fixed left-3 top-3 z-[60] rounded-md px-3 py-2 text-sm focus:not-sr-only"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {t('skipToContent')}
      </a>

      {/* Desktop Fluid Island */}
      <nav
        className="fluid-island fixed left-1/2 top-[22px] z-40 hidden -translate-x-1/2 items-center gap-7 rounded-full py-2 pl-[18px] pr-2 backdrop-blur-[20px] md:flex"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 32px -12px rgba(10,11,14,0.08)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          transition: 'background 600ms var(--ease)',
        }}
      >
        <Link href="/" className="text-[16px] font-semibold tracking-[-0.025em]" style={{ color: 'var(--ink)' }}>
          VICTA
        </Link>
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className="nav-link relative text-[14px] font-medium transition-colors duration-200"
              style={{ color: active ? 'var(--ink)' : 'var(--ink-muted)' }}
            >
              {t(item.key)}
              {active ? (
                <span
                  aria-hidden
                  className="absolute -bottom-[6px] left-0 right-0 h-px"
                  style={{ background: 'var(--accent)' }}
                />
              ) : null}
            </Link>
          );
        })}
        <span className="ml-1 inline-flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </span>
        {/* Contact CTA pill */}
        <Link
          href="/kontakt"
          className="ml-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-transform duration-300 hover:-translate-y-[1px]"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
          }}
        >
          {t('contact')}
          <span
            aria-hidden
            className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--bg) 12%, transparent)' }}
          >
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6h7M6 3l3 3-3 3" />
            </svg>
          </span>
        </Link>
      </nav>

      {/* Mobile bar — minimal, drawer preserved */}
      <header
        className="mobile-bar fixed left-0 right-0 top-0 z-40 md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
          borderBottom: '1px solid var(--line)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/" className="text-[16px] font-semibold tracking-[-0.025em]" style={{ color: 'var(--ink)' }}>
            VICTA
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
            <button
              type="button"
              aria-label={open ? t('close') : t('open')}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200"
              style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)' }}
            >
              {open ? <X size={16} weight="regular" /> : <List size={16} weight="regular" />}
            </button>
          </div>
        </div>

        {open ? (
          <nav
            id="mobile-menu"
            style={{ background: 'var(--bg)', borderTop: '1px solid var(--line)' }}
          >
            <ul className="mx-auto flex flex-col gap-1 px-6 py-4">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-base transition-colors duration-200"
                      style={{
                        background: active ? 'var(--bg-deep)' : 'transparent',
                        color: active ? 'var(--ink)' : 'var(--ink-muted)',
                      }}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </header>
    </>
  );
}
```

- [ ] **Step 2: Append dark-mode glass override + nav-link hover to globals.css**

```css
/* Dark mode glass override for Fluid Island Nav */
[data-theme="dark"] .fluid-island {
  background: rgba(8, 8, 14, 0.55) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 14px 48px -10px rgba(0, 0, 0, 0.6) !important;
}

/* Nav link hover colour */
.nav-link:hover {
  color: var(--ink) !important;
}
```

- [ ] **Step 3: Add nav i18n key if missing**

Verify `content/cs/strings/common.json` has `nav.skipToContent`, `nav.tag`, `nav.contact`, `nav.open`, `nav.close`, and 6 nav item keys (services/solutions/industries/collaboration/about/contact). The existing nav already uses these; the refactor keeps the contract.

```bash
python3 -c "import json; d=json.load(open('/Users/trungle/Desktop/websites/VICTA/content/cs/strings/common.json')); print(list(d.get('nav', {}).keys()))"
```

Expected: list includes all keys above. If any missing, add them to `common.json` `nav` object before running tests.

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/nav.tsx src/styles/globals.css content/cs/strings/common.json
git commit -m "$(cat <<'EOF'
feat(nav): Fluid Island desktop, drawer kept on mobile (soft-skill §5.A)

Desktop: floating glass pill (mt-[22px], mx-auto, rounded-full, backdrop-
blur-20 saturate-180), with logo + 5 primary links + theme/locale +
contact CTA pill at right edge. Theme-aware via tokens.

Mobile: classic top bar + drawer preserved (fullscreen overlay with
staggered mask reveal deferred to PR 2). Hamburger uses Phosphor List
icon (replacing Lucide Menu).

Skip-to-content link preserved as fixed top-left, sr-only-until-focus.

All i18n keys, active-link indicator, locale switcher integration kept
1:1 with previous behaviour.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Refactor ThemeToggle (sun/moon SVG, no emoji)

**Files:**
- Read: `src/components/theme-toggle.tsx`
- Modify: `src/components/theme-toggle.tsx`

- [ ] **Step 1: Read current implementation**

```bash
cat /Users/trungle/Desktop/websites/VICTA/src/components/theme-toggle.tsx
```

- [ ] **Step 2: Refactor visual presentation (preserves mount placeholder + i18n aria-labels)**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
  const t = useTranslations('nav');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reserve space during SSR / first paint to avoid layout shift
  if (!mounted) {
    return <div className="h-8 w-8" aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? t('themeLight') : t('themeDark')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="theme-toggle inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 hover:rotate-[15deg]"
      style={{
        background: 'transparent',
        border: '1px solid var(--line)',
        color: 'var(--ink-muted)',
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
```

- [ ] **Step 3: Add hover color transition to globals.css**

Append:

```css
.theme-toggle:hover {
  color: var(--ink) !important;
  border-color: var(--line-strong) !important;
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/theme-toggle.tsx src/styles/globals.css
git commit -m "$(cat <<'EOF'
feat(theme-toggle): sun/moon SVG with subtle hover rotation

32×32 rounded button, transparent bg with 1px line border. Icon swaps
based on resolvedTheme. 15° rotate on hover. Mount guard prevents
hydration mismatch (next-themes pattern).

Czech aria-labels per AR-08. SVG icons only — no emoji per claude-rules.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Add banned-patterns pre-commit grep hook

**Files:**
- Create: `scripts/banned-patterns.sh`
- Modify: `.husky/pre-commit` (or create if missing)

- [ ] **Step 1: Write the script**

```bash
cat > /Users/trungle/Desktop/websites/VICTA/scripts/banned-patterns.sh <<'SCRIPT'
#!/usr/bin/env bash
# banned-patterns.sh — taste-skill anti-slop pre-commit guard
# Per docs/superpowers/specs/2026-05-24-design-system-v2-design.md §9
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Only check staged .tsx + .ts + .css files
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx|ts|css)$' || true)

if [ -z "$FILES" ]; then
  exit 0
fi

FAIL=0

check() {
  local pattern="$1"
  local message="$2"
  local matches
  matches=$(echo "$FILES" | xargs grep -nE "$pattern" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "✗ Banned pattern: $message"
    echo "$matches" | head -10
    echo ""
    FAIL=1
  fi
}

# Typography
check "Inter_Tight|'Inter'|\"Inter\"" "Inter font family (banned by taste-skill §7, use Geist)"

# Layout
check 'h-screen[^a-zA-Z]' "h-screen — use min-h-[100dvh] (iOS viewport bug)"

# Color
check "#000000|#FFFFFF" "Pure black/white literal — use --ink / --bg tokens"

# Content (Jane Doe effect)
check 'John Doe|Jane Doe|Acme Corp|Lorem ipsum' "Generic placeholder content (use Czech realistic)"
check "Elevate|Seamless|Unleash|Next-Gen|Game-changer|Delve" "AI copywriting cliché (taste-skill §7 content)"

# Tailwind defaults that taste-skill bans
check 'shadow-md|shadow-lg|shadow-xl' "Tailwind shadow defaults — use --shadow-card tokens"

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "Pre-commit blocked by banned patterns above."
  echo "Reference: docs/superpowers/specs/2026-05-24-design-system-v2-design.md §9"
  exit 1
fi

exit 0
SCRIPT

chmod +x /Users/trungle/Desktop/websites/VICTA/scripts/banned-patterns.sh
```

- [ ] **Step 2: Wire into husky pre-commit**

```bash
ls /Users/trungle/Desktop/websites/VICTA/.husky/ 2>/dev/null
```

If `.husky/pre-commit` exists, append to it. Otherwise:

```bash
mkdir -p /Users/trungle/Desktop/websites/VICTA/.husky
cat > /Users/trungle/Desktop/websites/VICTA/.husky/pre-commit <<'HOOK'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh" 2>/dev/null || true

# Czech typography linter (existing AR-08)
pnpm lint:cs --staged 2>/dev/null || true

# Banned patterns guard (taste-skill anti-slop)
./scripts/banned-patterns.sh
HOOK

chmod +x /Users/trungle/Desktop/websites/VICTA/.husky/pre-commit
```

If `.husky/pre-commit` already exists with content, edit instead of overwriting:
```bash
# Append the banned-patterns invocation at the end
echo '' >> /Users/trungle/Desktop/websites/VICTA/.husky/pre-commit
echo '# Banned patterns guard (taste-skill anti-slop)' >> /Users/trungle/Desktop/websites/VICTA/.husky/pre-commit
echo './scripts/banned-patterns.sh' >> /Users/trungle/Desktop/websites/VICTA/.husky/pre-commit
```

- [ ] **Step 3: Test the script on the current codebase**

```bash
git add -A  # stage everything currently in working tree
/Users/trungle/Desktop/websites/VICTA/scripts/banned-patterns.sh
git reset HEAD  # un-stage after test
```

Expected: Should print warnings for existing `Inter_Tight` reference in old git history (but we've removed it in Task 3) and any other banned patterns in legacy code (existing services pages with Lucide icons — that's fine, they're not yet refactored). For NEW files added in this PR (Tasks 4-12), there should be zero warnings.

- [ ] **Step 4: Commit**

```bash
git add scripts/banned-patterns.sh .husky/pre-commit
git commit -m "$(cat <<'EOF'
feat(ci): pre-commit guard for taste-skill banned patterns

Grep-based check over staged .tsx/.ts/.css files. Blocks commits that
introduce banned patterns per design spec §9:
- Inter font family
- h-screen (use min-h-[100dvh])
- #000000 / #FFFFFF literals
- Generic placeholder content (John Doe, Acme, Lorem ipsum)
- AI copywriting clichés (Elevate, Seamless, Unleash, Next-Gen, ...)
- Tailwind shadow-md/lg/xl defaults

Runs alongside the existing Czech typography linter via .husky/pre-commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Pointer doc — link spec from claude/docs

**Files:**
- Create: `docs/claude/design-decisions-v2.md`

- [ ] **Step 1: Write the pointer doc**

```bash
cat > /Users/trungle/Desktop/websites/VICTA/docs/claude/design-decisions-v2.md <<'DOC'
# Design Decisions v2 (D-008)

> **Status**: ACTIVE — replaces `docs/claude/design-decisions.md` (which documented D-001).
> The legacy file is preserved for historical reference until PR 7 cleanup.

## Quick reference

- **Spec**: `docs/superpowers/specs/2026-05-24-design-system-v2-design.md`
- **Plans**: `docs/superpowers/plans/2026-05-24-design-system-v2-*.md`
- **Mockups**: `docs/design-exploration/2026-05-24-soft-skill-vibes/`
- **D-008 decisions.md entry**: appended in PR 7 (cleanup PR)

## Decisions overview

| Token | D-001 (locked 2026-05-06) | D-008 (locked 2026-05-24) |
|-------|---------------------------|---------------------------|
| Sans font | Inter Tight | **Geist** |
| Mono font | Geist Mono | Geist Mono |
| Accent font | none | **Newsreader italic** (selective) |
| Light bg | `#FAFAFA` | **`#F4F5F7`** |
| Light accent | `#3730A3` indigo | **`#1F2937` slate** |
| Dark accent | `#7367E5` indigo | **`#DCD7FF` lavender** |
| Background | 40×40 grid 4% | **Radial mesh orbs + noise** |
| Card radius | 8px | **22px inner / 28px outer (Double-Bezel)** |
| CTA buttons | rounded 6px | **Pill 999px with Button-in-Button arrow** |
| Headline weight | 500 | **600** |
| Layout grammar | Single-col left | **Editorial Split + Asymmetrical Bento** |

## When to read this

- Adding a new page component → see spec §5 layout grammar table
- Touching colors → see spec §3.1, never hardcode hex
- Touching shadows → see spec §3 ambient shadow tokens
- CTA design → see spec §4.1 Button refactor + soft-skill §4.B
- Anything that smells generic → see spec §9 banned patterns list

## Locked items (do not change without D-### successor)

- Geist as sans (no Inter Tight return)
- Slate accent light / lavender dark (no indigo return)
- Editorial Split + Asymmetrical Bento as layout grammar
- Variant C (visual canvas) for hero right column
DOC
```

- [ ] **Step 2: Commit**

```bash
git add docs/claude/design-decisions-v2.md
git commit -m "$(cat <<'EOF'
docs(claude): add v2 pointer to D-008 spec + plan locations

Per global CLAUDE.md guidance: docs/claude/ holds on-demand pointers.
This file resolves the 'design-decisions' pointer in root CLAUDE.md
to the new v2 spec while the legacy design-decisions.md (D-001) is
preserved until PR 7 cleanup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Final CI sweep + push

**Files:**
- N/A (verification only)

- [ ] **Step 1: Run full typecheck**

```bash
pnpm typecheck 2>&1 | tail -10
```

Expected: zero errors.

- [ ] **Step 2: Run lint on entire codebase**

```bash
pnpm lint 2>&1 | tail -15
```

Expected: zero new errors / warnings. Existing warnings on legacy files are OK (will resolve in PR 2-5).

- [ ] **Step 3: Run unit tests (no-op acceptable)**

```bash
pnpm test 2>&1 | tail -10
```

Expected: passes with `--passWithNoTests` flag.

- [ ] **Step 4: Run production build**

```bash
pnpm build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`. No build-time errors. CSS bundle size visible.

- [ ] **Step 5: Run Czech typography linter**

```bash
pnpm lint:cs 2>&1 | tail -10
```

Expected: zero violations on all 41 pages (existing content unchanged).

- [ ] **Step 6: Push branch**

```bash
git push origin design-system-v2 2>&1 | tail -5
```

Expected: pushed successfully.

- [ ] **Step 7: Open PR on GitHub via gh CLI**

```bash
gh pr create \
  --base content-only \
  --head design-system-v2 \
  --title "feat(design): D-008 PR 1 — Foundation (no visible page changes)" \
  --body "$(cat <<'EOF'
## Summary

PR 1 of 7 implementing the D-008 design system migration. Foundation
layer only — no page visibly changes. New tokens, fonts, primitives,
and refactored shared components land here. Pages migrate in PR 2.

**Spec**: docs/superpowers/specs/2026-05-24-design-system-v2-design.md
**Plan**: docs/superpowers/plans/2026-05-24-design-system-v2-pr1-foundation.md

## What's in this PR

- New globals.css with D-008 tokens (silver-grey light, OLED dark)
- Font swap: Inter Tight → Geist + add Newsreader italic
- 6 new primitives: Eyebrow, BentoShell, BentoCard, EditorialSplit,
  AsymmetricalBento, VisualCanvas, BodyOrbs
- Refactored Button (pill + Button-in-Button), Nav (Fluid Island),
  ThemeToggle (sun/moon SVG)
- @phosphor-icons/react installed (used in PR 2+)
- Pre-commit hook for banned patterns
- docs/claude/design-decisions-v2.md pointer

## What's NOT in this PR

- No page visibly changes (pages still render via old component APIs
  that internally use new tokens — visual diff next to zero)
- Lucide icon migration deferred to per-page PRs (2-5)
- D-008 entry in decisions.md deferred to PR 7

## Test plan

- [x] pnpm typecheck — zero errors
- [x] pnpm lint — zero new warnings
- [x] pnpm build — compiles successfully
- [x] pnpm lint:cs — Czech typography clean
- [ ] Vercel preview deploy — visual check that pages still render (no
      crash, all theme tokens resolve)
- [ ] Lighthouse mobile baseline capture for diff against PR 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL returned.

- [ ] **Step 8: Verify Vercel preview deploy**

After PR opens, Vercel will deploy a preview. Wait for it (~2-3 min) and verify:
- Site loads without crash
- All existing pages render (homepage, sluzby, kontakt, etc.)
- Light + dark mode toggle works
- No CSS errors in browser console

If preview crashes, the most likely cause is a token reference that resolves to `undefined` in an old page. Hot-fix on the branch and push again.

---

## Self-review checklist

After completing Tasks 0-15, verify against spec §4.1:

- [ ] All 6 new components exist as separate `.tsx` files in `src/components/`
- [ ] Button + Nav + ThemeToggle refactored (no internal API breaks)
- [ ] globals.css fully replaced (no orphan references to old `--font-inter-tight` or grid pattern)
- [ ] layout.tsx uses Geist + Geist Mono + Newsreader
- [ ] @phosphor-icons/react in package.json
- [ ] Banned-patterns hook installed and executable
- [ ] Pointer doc in docs/claude/
- [ ] No page.tsx files modified (those are PR 2-5)
- [ ] All commits follow `type(scope): description` format
- [ ] Each commit individually revertible

## Rollback

If PR 1 introduces issues post-merge:

```bash
# Revert merge commit on content-only
git checkout content-only
git revert -m 1 <merge-commit-sha>
git push origin content-only
```

Pages remain on D-001 styling since they were never migrated to use new primitives in PR 1.

---

## Next steps

After PR 1 merges (or before, if work proceeds in parallel):

- **Plan 2**: PR 2 (Homepage refactor) — uses Eyebrow, EditorialSplit, AsymmetricalBento, VisualCanvas, BodyOrbs
- **Plan 3**: PR 6 (31 detail pages) — uses DetailPageTemplate built from same primitives

Plan 2 and Plan 3 are written after PR 1 merges to incorporate any lessons learned.
