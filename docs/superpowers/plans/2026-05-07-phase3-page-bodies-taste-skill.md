# Phase 3 — Page Bodies Taste-Skill Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all nine sub-page bodies (`/sluzby`, `/reseni`, `/odvetvi`, `/spoluprace`, `/o-nas`, `/kontakt`, `/blog`, `/cookies`, `/ochrana-soukromi`) from D-007 ferro-rust layout patterns to the D-008 taste-skill aesthetic established on the homepage, so the entire site reads with one coherent rhythm.

**Architecture:** Extract reusable section primitives from `src/app/[locale]/home-body.tsx` into `src/components/sections/*.tsx`, then rebuild each sub-page as a thin client component composing those primitives. Translation keys in `content/cs/strings/common.json` stay unchanged — only presentation moves. Each page is its own task with smoke + a11y verification before commit.

**Tech Stack:** Next.js 15 App Router, React Server + Client Components, framer-motion 12, next-intl 4, Tailwind CSS v4 with `@theme`-driven CSS Custom Properties, Playwright + axe-core for verification, Czech typography linter (`pnpm lint:cs`).

---

## Reading Order Before Starting

1. `src/app/[locale]/home-body.tsx` — the canonical taste-skill composition. Every primitive in this plan is lifted from here.
2. `src/styles/globals.css` — token reference (`--ink`, `--accent`, `--bg`, `--surface`, etc.) plus utility classes (`display`, `font-mono`, `tactile`, `spotlight`, `pulse-dot`, `marquee-track`).
3. `src/lib/offerings-data.ts` — typed `OFFERING_MAP` shape; sub-pages may reuse it for service/solution/industry detail blocks.
4. `content/cs/strings/common.json` — translation keys. Each sub-page already has its CZ copy under `sluzby`, `reseni`, `odvetvi`, `spoluprace`, `oNas`, `kontakt`, `blog`, `legal.cookies`, `legal.privacy`. Do **not** edit translation keys; if copy genuinely needs to change, propose it as a separate PR.
5. `claude-rules.md` rules 1, 6, 8, 9, 11, 14 — invariants you must not break: locked tokens (now D-008), no `NEXT_PUBLIC_` on server secrets, `var(--color-*)` only (no hardcoded hex), Czech typography linter must pass.

---

## File Structure

### New shared primitives (Task 1 creates these)

```
src/components/sections/
├── page-hero.tsx          # Anchor-jump-aware hero with eyebrow + display headline + sub
├── section-header.tsx     # 5fr/7fr eyebrow+title+lead grid with optional CTA
├── magnetic-cta.tsx       # Spring-physics CTA pill, Link-aware
├── section-marquee.tsx    # Kinetic typography band, configurable items
├── bento-grid.tsx         # 12-col asymmetric grid (services-style)
├── horizontal-scroller.tsx# Snap-scroll row of cards (solutions-style)
├── kinetic-list.tsx       # Hover-rotate icon + arrow (industries-style)
├── sticky-tier-stack.tsx  # Sticky 3-tier pricing stack (audit-style)
├── values-grid.tsx        # 4-up principle blocks for /o-nas
├── contact-channels.tsx   # Hairline-divided email/phone/address/social list
└── prose-block.tsx        # Long-form Czech body for legal pages (cookies/privacy)
```

### Per-page rewrites

```
src/app/[locale]/
├── sluzby/page.tsx        # 3 service categories (itDev, aiData, marketing)
├── reseni/page.tsx        # 5 solution detail blocks
├── odvetvi/page.tsx       # 7 industry detail blocks
├── spoluprace/page.tsx    # Collaboration tiers + audit tier stack
├── o-nas/page.tsx         # Story → values → process → status
├── kontakt/page.tsx       # Primary CTA → channels → form → privacy line
├── blog/page.tsx          # Coming-soon block (no posts yet — D-001 status)
├── cookies/page.tsx       # Legal prose (7 sections + fullVersionNote)
└── ochrana-soukromi/page.tsx # Legal prose (privacy notice sections)
```

### Cleanup (Task 12)

```
- src/components/offering-section.tsx   # Replaced by bento-grid + section-header
- src/components/pricing-card.tsx       # Replaced by sticky-tier-stack
- src/app/redesign-preview/             # Sandbox no longer needed
- src/middleware.ts                     # Drop redesign-preview matcher exclusion
```

---

## Task 1: Extract Shared Section Primitives

**Goal:** Move reusable motion / layout fragments out of `home-body.tsx` into `src/components/sections/*.tsx` so sub-pages can compose them without duplicating ~600 lines of motion code.

**Files:**
- Create: `src/components/sections/magnetic-cta.tsx`
- Create: `src/components/sections/section-header.tsx`
- Create: `src/components/sections/page-hero.tsx`
- Create: `src/components/sections/section-marquee.tsx`
- Create: `src/components/sections/bento-grid.tsx`
- Create: `src/components/sections/horizontal-scroller.tsx`
- Create: `src/components/sections/kinetic-list.tsx`
- Create: `src/components/sections/sticky-tier-stack.tsx`
- Create: `src/components/sections/values-grid.tsx`
- Create: `src/components/sections/contact-channels.tsx`
- Create: `src/components/sections/prose-block.tsx`
- Modify: `src/app/[locale]/home-body.tsx` (replace inline definitions with imports)

- [ ] **Step 1: Write the magnetic CTA primitive**

`src/components/sections/magnetic-cta.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };

type Props = {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
  compact?: boolean;
};

export function MagneticCta({ children, primary, compact, href }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const [hover, setHover] = useState(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * 0.32);
    y.set((e.clientY - r.top - r.height / 2) * 0.32);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
    setHover(false);
  }

  const padding = compact ? 'px-5 py-2.5 text-[13.5px]' : 'px-7 py-3.5 text-[14.5px]';

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
    >
      <Link
        ref={ref}
        href={href}
        className={`tactile relative inline-flex items-center gap-2.5 rounded-full border ${padding} ${
          primary
            ? 'border-accent bg-accent text-bg'
            : 'border-border bg-transparent text-ink hover:border-ink'
        }`}
      >
        <span className="relative z-10">{children}</span>
        <motion.span
          animate={{ x: hover ? 3 : 0, rotate: hover ? -8 : 0 }}
          transition={SPRING}
          className="relative z-10 inline-flex"
          aria-hidden
        >
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </motion.span>
      </Link>
    </motion.div>
  );
}
```

- [ ] **Step 2: Write the section header primitive**

`src/components/sections/section-header.tsx`:

```tsx
'use client';

import { motion, type Variants } from 'framer-motion';
import { MagneticCta } from './magnetic-cta';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function SectionHeader({ eyebrow, title, lead, ctaLabel, ctaHref }: Props) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      transition={SPRING}
      variants={REVEAL}
      className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_7fr] md:gap-16"
    >
      <div className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
        {eyebrow}
      </div>
      <div>
        <h2 className="display max-w-[18ch] text-[clamp(36px,4.6vw,68px)] text-ink">
          {title}
        </h2>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.55] text-secondary">
          {lead}
        </p>
        {ctaLabel && ctaHref && (
          <div className="mt-8">
            <MagneticCta href={ctaHref}>{ctaLabel}</MagneticCta>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Write the page hero primitive**

`src/components/sections/page-hero.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { MagneticCta } from './magnetic-cta';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

type AnchorLink = { label: string; href: string };
type Cta = { label: string; href: string; primary?: boolean };

type Props = {
  status?: string;
  eyebrow?: string;
  headline: string;
  sub?: string;
  ctas?: ReadonlyArray<Cta>;
  anchors?: ReadonlyArray<AnchorLink>;
};

export function PageHero({ status, eyebrow, headline, sub, ctas, anchors }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);

  return (
    <section
      ref={ref}
      className="relative px-6 pt-20 pb-16 md:px-10 md:pt-28 md:pb-20"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <motion.div style={{ y }} className="flex flex-col">
          {status && (
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ ...SPRING, delay: 0.1 }}
              variants={REVEAL}
              className="mb-6 inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-[11.5px] text-secondary backdrop-blur-sm"
            >
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono uppercase tracking-[0.14em]">{status}</span>
            </motion.div>
          )}

          {eyebrow && (
            <motion.span
              initial="hidden"
              animate="visible"
              transition={{ ...SPRING, delay: 0.14 }}
              variants={REVEAL}
              className="mb-3 font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary"
            >
              {eyebrow}
            </motion.span>
          )}

          <motion.h1
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.18 }}
            variants={REVEAL}
            className="display max-w-[18ch] text-[clamp(48px,7vw,108px)] text-ink"
          >
            {headline}
          </motion.h1>

          {sub && (
            <motion.p
              initial="hidden"
              animate="visible"
              transition={{ ...SPRING, delay: 0.32 }}
              variants={REVEAL}
              className="mt-7 max-w-[58ch] text-[18px] leading-[1.55] text-secondary"
            >
              {sub}
            </motion.p>
          )}

          {ctas && ctas.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ ...SPRING, delay: 0.44 }}
              variants={REVEAL}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              {ctas.map((cta) => (
                <MagneticCta key={cta.href} href={cta.href} primary={cta.primary}>
                  {cta.label}
                </MagneticCta>
              ))}
            </motion.div>
          )}

          {anchors && anchors.length > 0 && (
            <motion.nav
              initial="hidden"
              animate="visible"
              transition={{ ...SPRING, delay: 0.5 }}
              variants={REVEAL}
              className="mt-8 flex flex-wrap gap-3"
            >
              {anchors.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="tactile rounded-full border border-border px-4 py-2 text-[13.5px] text-secondary hover:border-ink hover:text-ink"
                >
                  {a.label}
                </a>
              ))}
            </motion.nav>
          )}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the marquee primitive**

`src/components/sections/section-marquee.tsx`:

```tsx
'use client';

type Props = { items: ReadonlyArray<string> };

export function SectionMarquee({ items }: Props) {
  const doubled = [...items, ...items];
  return (
    <section
      aria-hidden
      className="relative border-y border-border-soft py-7"
    >
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="display flex items-center gap-12 text-[44px] leading-none text-ink md:text-[72px]"
            >
              {item}
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-accent" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Write the bento grid primitive**

`src/components/sections/bento-grid.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { LucideIcon } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type BentoItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
  number: string;
  span: 4 | 5 | 7 | 8 | 12; // col-span for 12-col grid
  prominent?: boolean;
  compact?: boolean;
  accent?: boolean;
};

type Props = { items: ReadonlyArray<BentoItem> };

export function BentoGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
      {items.map((item) => (
        <BentoCard key={item.title} {...item} />
      ))}
    </div>
  );
}

function BentoCard({ icon: Icon, title, subtitle, href, number, span, prominent, compact, accent }: BentoItem) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--mx', `${x}%`);
    ref.current?.style.setProperty('--my', `${y}%`);
  }

  const padding = prominent ? 'p-10 md:p-14' : compact ? 'p-7 md:p-8' : 'p-8 md:p-10';
  const titleSize = prominent ? 'text-[clamp(36px,4.4vw,64px)]' : 'text-[clamp(24px,2.6vw,38px)]';
  const minH = prominent ? 'min-h-[420px]' : 'min-h-[260px]';
  const colClass: Record<typeof span, string> = {
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    7: 'md:col-span-7',
    8: 'md:col-span-8',
    12: 'md:col-span-12',
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={SPRING}
      variants={REVEAL}
      className={colClass[span]}
    >
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        className={`spotlight tactile relative flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface ${padding} ${minH} ${
          accent ? 'bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--accent-tint)]' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-border text-ink" aria-hidden>
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-tertiary">{number}</span>
        </div>
        <div className="mt-12">
          <h3 className={`display ${titleSize} text-ink`}>{title}</h3>
          <p className="mt-3 max-w-[42ch] text-[14.5px] leading-[1.55] text-secondary">{subtitle}</p>
        </div>
      </Link>
    </motion.div>
  );
}
```

- [ ] **Step 6: Write horizontal-scroller, kinetic-list, sticky-tier-stack, values-grid, contact-channels, prose-block primitives**

Each follows the same pattern as steps 1–5. Lift the corresponding section from `src/app/[locale]/home-body.tsx` (e.g. `SolutionsScroller` → `horizontal-scroller.tsx`, `IndustriesList` → `kinetic-list.tsx`, `AuditStack` → `sticky-tier-stack.tsx`). Generalise prop signatures: replace hardcoded `useTranslations('home.audit')` with a `tiers: ReadonlyArray<TierData>` prop the caller passes in.

For brevity, see [home-body.tsx](src/app/[locale]/home-body.tsx) lines 200–550 as the source of truth for each section's motion values, padding, spring config. **Do not change motion values when extracting** — the homepage rhythm is the reference.

- [ ] **Step 7: Refactor home-body.tsx to use the new primitives**

```tsx
// home-body.tsx becomes:
'use client';

import { useTranslations } from 'next-intl';
import { PageHero } from '@/components/sections/page-hero';
import { SectionMarquee } from '@/components/sections/section-marquee';
import { SectionHeader } from '@/components/sections/section-header';
import { BentoGrid, type BentoItem } from '@/components/sections/bento-grid';
import { HorizontalScroller } from '@/components/sections/horizontal-scroller';
import { KineticList } from '@/components/sections/kinetic-list';
import { StickyTierStack } from '@/components/sections/sticky-tier-stack';
import {
  SERVICES_OFFERING,
  SOLUTIONS_OFFERING,
  INDUSTRIES_OFFERING,
} from '@/lib/offerings-data';

export function HomeBody() {
  const t = useTranslations('home');
  const servicesItems: ReadonlyArray<BentoItem> = SERVICES_OFFERING.items.map((item, i) => ({
    icon: item.icon,
    title: item.title,
    subtitle: item.subtitle,
    href: item.href,
    number: `0${i + 1}`,
    span: ([7, 5, 5, 7, 4, 8] as const)[i] ?? 6,
    prominent: i === 0,
    compact: i === 4,
    accent: i === 0,
  }));

  const auditTiers = [
    {
      tier: t('audit.tier1.tier'),
      flag: t('audit.tier1.badge'),
      name: t('audit.tier1.name'),
      price: t('audit.tier1.price'),
      priceEur: t('audit.tier1.priceEur'),
      body: 'Plný rozsah napříč technologií, byznysem a marketingem.',
      deliverables: [0, 1, 2, 3, 4].map((i) => t(`audit.tier1.deliverables.${i}`)),
      cta: t('audit.tier1.cta'),
      primary: true,
    },
    // tier2, tier3 similar...
  ];

  return (
    <>
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.sub')}
        ctas={[
          { label: t('hero.ctaPrimary'), href: '/spoluprace#audit', primary: true },
          { label: t('hero.ctaGhost'), href: '/kontakt' },
        ]}
      />
      <SectionMarquee items={['TRANSPARENTNOST', 'PARTNERSTVÍ', 'AI-NATIVE', 'ŘEMESLO', 'AI-augmented tým', 'Pod jednou střechou', 'Praha · Hradec Králové · Trutnov']} />
      <section id="sluzby" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow="01 · služby"
            title={`${SERVICES_OFFERING.sidebarHeadline}.`}
            lead={SERVICES_OFFERING.sidebarDescription}
            ctaLabel="Všechny služby"
            ctaHref={SERVICES_OFFERING.sidebarCtaHref}
          />
          <div className="mt-14">
            <BentoGrid items={servicesItems} />
          </div>
        </div>
      </section>
      {/* SolutionsScroller, IndustriesList, AuditStack analogously... */}
    </>
  );
}
```

- [ ] **Step 8: Verify homepage still renders identically**

Run:
```bash
pnpm dev
# in another terminal:
curl -s http://localhost:3000/cs | wc -c
```
Expected: ~120kB SSR HTML, all section markers present (run grep for `Začneme tím`, `AI Discovery`, `Komplexní podnikový audit`, `TRANSPARENTNOST`).

```bash
npx tsc --noEmit
pnpm lint
pnpm lint:cs
```
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/sections src/app/[locale]/home-body.tsx
git commit -m "refactor(sections): extract reusable taste-skill primitives

Lifted 11 inline section components out of home-body.tsx into
src/components/sections/* for reuse on sub-pages. Homepage now
composes primitives instead of duplicating motion code.

Motion values and spring configs preserved exactly to keep
homepage rhythm identical."
```

---

## Task 2: /sluzby — service categories

**Goal:** Replace the existing 3-category accordion at `/cs/sluzby` with a taste-skill composition: hero with anchor nav → 3 alternating bento sections (one per category) → CTA band.

**Files:**
- Modify: `src/app/[locale]/sluzby/page.tsx` (full rewrite)
- Create: `src/app/[locale]/sluzby/sluzby-body.tsx` (client component)

**Reference:** [content/cs/strings/common.json](content/cs/strings/common.json) keys `sluzby.hero.{status,headline,subhead}`, `sluzby.categories.{itDev,aiData,marketing}.{label,intro,items[].name,items[].desc}`, `sluzby.cta.{heading,body,primary,ghost}`.

- [ ] **Step 1: Read the existing page**

```bash
cat src/app/[locale]/sluzby/page.tsx
```
Note the three categories and their items. Confirm translation keys haven't changed.

- [ ] **Step 2: Create the client body**

`src/app/[locale]/sluzby/sluzby-body.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Boxes, Brain, Megaphone, type LucideIcon } from 'lucide-react';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { BentoGrid, type BentoItem } from '@/components/sections/bento-grid';
import { MagneticCta } from '@/components/sections/magnetic-cta';

type ServiceItem = { name: string; desc: string };
type Category = { label: string; intro: string; items: ReadonlyArray<ServiceItem> };

export function SluzbyBody() {
  const t = useTranslations('sluzby');
  const tRaw = (k: string) => t.raw(k) as unknown;

  const itDev = tRaw('categories.itDev') as Category;
  const aiData = tRaw('categories.aiData') as Category;
  const marketing = tRaw('categories.marketing') as Category;

  const toBento = (cat: Category, icons: ReadonlyArray<LucideIcon>): ReadonlyArray<BentoItem> =>
    cat.items.map((it, i) => ({
      icon: icons[i] ?? icons[icons.length - 1],
      title: it.name,
      subtitle: it.desc,
      href: '#',
      number: `0${i + 1}`,
      span: ([7, 5, 5, 7] as const)[i] ?? 6,
    }));

  return (
    <>
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
        anchors={[
          { label: itDev.label, href: '#it-vyvoj' },
          { label: aiData.label, href: '#ai-data' },
          { label: marketing.label, href: '#marketing' },
        ]}
      />

      <section id="it-vyvoj" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader eyebrow="01 · IT a vývoj" title={`${itDev.label}.`} lead={itDev.intro} />
          <div className="mt-14">
            <BentoGrid items={toBento(itDev, [Boxes, Boxes, Boxes, Boxes])} />
          </div>
        </div>
      </section>

      <section id="ai-data" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader eyebrow="02 · AI a data" title={`${aiData.label}.`} lead={aiData.intro} />
          <div className="mt-14">
            <BentoGrid items={toBento(aiData, [Brain, Brain, Brain, Brain])} />
          </div>
        </div>
      </section>

      <section id="marketing" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader eyebrow="03 · marketing" title={`${marketing.label}.`} lead={marketing.intro} />
          <div className="mt-14">
            <BentoGrid items={toBento(marketing, [Megaphone, Megaphone, Megaphone, Megaphone])} />
          </div>
        </div>
      </section>

      <section className="relative border-t border-border-soft px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">04 · další krok</span>
            <h2 className="display mt-5 max-w-[14ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('cta.heading')}
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.55] text-secondary">
              {t('cta.body')}
            </p>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary href="/spoluprace#audit">
              {t('cta.primary')}
            </MagneticCta>
            <MagneticCta href="/kontakt">{t('cta.ghost')}</MagneticCta>
          </div>
        </div>
      </section>
    </>
  );
}
```

> **Icon choice:** This step uses placeholder Lucide icons (`Boxes`, `Brain`, `Megaphone`). Pick contextually-correct icons per item by reading `categories.<bucket>.items[i].name` and matching: e.g. WordPress → `Globe`, eCommerce → `ShoppingCart`, RAG → `Brain`, GA4 → `BarChart3`. Use lucide-react names from the repo's existing icon set.

- [ ] **Step 3: Replace page.tsx server shell**

`src/app/[locale]/sluzby/page.tsx`:

```tsx
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { SluzbyBody } from './sluzby-body';

type Props = { params: Promise<{ locale: string }> };

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') return <EnglishStub title="Services." pathLabel="/en/sluzby" />;
  return <SluzbyBody />;
}
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```
Expected: pass.

- [ ] **Step 5: Smoke test the route**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/cs/sluzby
```
Expected: `200`.

```bash
curl -s http://localhost:3000/cs/sluzby | grep -oE 'IT a vývoj|AI a data|Marketing|další krok' | sort -u
```
Expected: all four section markers visible.

- [ ] **Step 6: Manual visual check**

Open `http://localhost:3000/cs/sluzby` in browser. Compare against `http://localhost:3000/cs`:
- Same sticky nav + mega-menu behaviour
- Hero: same display font, same eyebrow→headline→sub rhythm
- Each category section: 4-cell asymmetric bento (7+5 / 5+7) with the same spotlight-on-hover feel as homepage `01 · služby`
- CTA section: 6/5 split with magnetic CTAs

If visual mismatch, the issue is almost certainly that you forgot to lift the same motion values from `home-body.tsx` — re-check spring config and viewport margins.

- [ ] **Step 7: a11y check**

```bash
pnpm e2e -- --grep "sluzby"
```
(If no such test exists yet, add a basic Playwright + axe-core run in `e2e/sluzby.spec.ts` — pattern at the end of this plan.)

- [ ] **Step 8: Commit**

```bash
git add src/app/[locale]/sluzby
git commit -m "feat(sluzby): taste-skill body migration

3-category bento composition with anchor nav hero and magnetic CTA
band. Reuses sections/{page-hero,section-header,bento-grid,magnetic-cta}.
Translation keys unchanged."
```

---

## Task 3: /reseni — solutions detail

**Goal:** Rebuild `/cs/reseni` as taste-skill: hero → 5 detail blocks (one per solution) using horizontal-scroller-meets-detail pattern → CTA.

**Files:**
- Modify: `src/app/[locale]/reseni/page.tsx`
- Create: `src/app/[locale]/reseni/reseni-body.tsx`

- [ ] **Step 1: Read the existing page**
- [ ] **Step 2: Build solution detail block primitive (or reuse bento-grid)** — same as Task 2 but with 5 cards in 2-column zig-zag (12,12 / 7,5 / 5,7 / 12 / 7,5 ratio variants).
- [ ] **Step 3: Create `reseni-body.tsx` composition** — hero anchored to 5 sections, each with `SectionHeader` + a single feature card + 3 bullets pulled from translations.
- [ ] **Step 4: Replace page.tsx with server shell**
- [ ] **Step 5: Smoke test, manual check, a11y, commit** — same pattern as Task 2 step 5–8.

```bash
git commit -m "feat(reseni): taste-skill body migration"
```

---

## Task 4: /odvetvi — industries list

**Goal:** Use `kinetic-list` primitive (lifted from homepage `IndustriesList`) for all 7 industries with hover-rotate icon and arrow translate.

**Files:**
- Modify: `src/app/[locale]/odvetvi/page.tsx`
- Create: `src/app/[locale]/odvetvi/odvetvi-body.tsx`

- [ ] **Step 1: Read the existing page**
- [ ] **Step 2: Create `odvetvi-body.tsx`** — `<PageHero>` then a single `<KineticList items={INDUSTRIES_OFFERING.items}>` filling the page, optionally followed by a CTA band identical to Task 2.
- [ ] **Step 3: Replace page.tsx with server shell**
- [ ] **Step 4: Smoke test, manual check, a11y, commit**

```bash
git commit -m "feat(odvetvi): taste-skill body migration"
```

---

## Task 5: /spoluprace — collaboration model + audit pricing

**Goal:** Largest sub-page (369 lines). Contains both collaboration tiers AND audit pricing tiers. Restructure as: hero → values-style 3-pillar collaboration model → marquee → sticky tier stack for collaboration tiers → sticky tier stack for audit tiers → CTA.

**Files:**
- Modify: `src/app/[locale]/spoluprace/page.tsx`
- Create: `src/app/[locale]/spoluprace/spoluprace-body.tsx`

- [ ] **Step 1: Read the existing page (369 lines — bring tea)**
- [ ] **Step 2: Inventory translation keys** under `spoluprace.*`. List collaboration tiers, audit tiers, model pillars.
- [ ] **Step 3: Build composition**
  - `<PageHero>` with anchor nav for `#model`, `#tiers`, `#audit`
  - `<SectionMarquee>` of guarantees (e.g. `BEZPLATNÁ KONZULTACE · NEZÁVAZNÁ NABÍDKA · DO 2 PRACOVNÍCH DNŮ`)
  - Section `01 · model` — `<ValuesGrid>` of 3-4 collaboration principles
  - Section `02 · tiers` — `<StickyTierStack>` for engagement tiers (Modular / Sprint / Retainer if those exist in translations; otherwise the actual key names)
  - Section `03 · audit` — `<StickyTierStack>` for the 3 audit tiers (same as homepage but here is the canonical home)
  - CTA section
- [ ] **Step 4: Replace page.tsx with server shell**
- [ ] **Step 5: Smoke test, visual check (this page is high traffic — be thorough), a11y, commit**

```bash
git commit -m "feat(spoluprace): taste-skill body migration"
```

---

## Task 6: /o-nas — about

**Goal:** Story → values → process → status, all taste-skill rhythm.

**Files:**
- Modify: `src/app/[locale]/o-nas/page.tsx`
- Create: `src/app/[locale]/o-nas/o-nas-body.tsx`

- [ ] **Step 1: Read existing page + translation keys** (`oNas.hero.*`, `oNas.sections.{story,values,process}`)
- [ ] **Step 2: Build composition**
  - `<PageHero>` with story headline
  - Section `01 · příběh` — long-form prose block, max-w-[58ch], typography rhythm of homepage hero sub
  - Section `02 · hodnoty` — `<ValuesGrid items={...4 items...}>` (TRANSPARENTNOST / PARTNERSTVÍ / AI-NATIVE / ŘEMESLO with body copy)
  - Section `03 · proces` — 4-step horizontal flow (Posloucháme → Navrhujeme → Stavíme → Provozujeme), reuse `<KineticList>` or build inline
  - Section `04 · stav` — current team status card with `pulse-dot` + Mono caps "AI-augmented · 2 lidi · pod jednou střechou"
- [ ] **Step 3: Replace page.tsx with server shell**
- [ ] **Step 4: Smoke test, manual check, a11y, commit**

```bash
git commit -m "feat(o-nas): taste-skill body migration"
```

---

## Task 7: /kontakt — contact

**Goal:** Primary CTA-driven layout. Hero → primary path block → channels list → form → privacy line.

**Files:**
- Modify: `src/app/[locale]/kontakt/page.tsx`
- Create: `src/app/[locale]/kontakt/kontakt-body.tsx`

The contact form already lives at `src/components/forms/contact-form.tsx` (server action + Zod schema). **Do not change form internals** — wrap the existing component in the new layout.

- [ ] **Step 1: Read existing page + form component**
- [ ] **Step 2: Build composition**
  - `<PageHero>` with `kontakt.hero.{status, headline, subhead}` and a primary CTA "Domluvit konzultaci" → Cal.com booking link
  - Section `01 · preferovaná cesta` — split block: left (kontakt.primary.{label, headline, body}), right (`<MagneticCta primary>` to /spoluprace#audit)
  - Section `02 · přímé kanály` — `<ContactChannels>` primitive with 4 entries (email, phone, address, social)
  - Section `03 · formulář` — wraps `<ContactForm>`. Form keeps its existing styling but inputs/labels need taste-skill polish: rounded-lg, border-border, bg-surface, focus-ring with `--accent`. Update form-internal classNames to match — see [src/components/forms/contact-form.tsx](src/components/forms/contact-form.tsx) and reskin only the visual layer (label position, input padding, error text colour). **Do not touch the validation, server action, or Zod schema.**
  - Section `04 · ochrana osobních údajů` — small footer-style line linking to `/ochrana-soukromi`
- [ ] **Step 3: Replace page.tsx with server shell**
- [ ] **Step 4: Form a11y test** — required: label-input association, error-text aria-describedby, submit button keyboard-accessible. Run axe.
- [ ] **Step 5: Smoke test (route 200, key strings), commit**

```bash
git commit -m "feat(kontakt): taste-skill body migration"
```

---

## Task 8: /blog — blog index

**Goal:** Currently empty (no posts). Render a coming-soon hero + newsletter CTA.

**Files:**
- Modify: `src/app/[locale]/blog/page.tsx`
- Create: `src/app/[locale]/blog/blog-body.tsx`

- [ ] **Step 1: Build composition**
  - `<PageHero>` with `blog.hero.{status, headline, subhead}` and a single CTA "Přihlásit se k odběru" → `#newsletter` anchor
  - Section `01 · připravujeme` — large-type empty-state card with mono-caps copy `BLOG · COMING SOON · v 0.2.0`
  - Section `02 · newsletter` — wraps existing `<NewsletterForm>` from [src/components/forms/newsletter-form.tsx](src/components/forms/newsletter-form.tsx) in a centred 520px-max card with explanatory copy
- [ ] **Step 2: Replace page.tsx with server shell**
- [ ] **Step 3: Smoke test, a11y, commit**

```bash
git commit -m "feat(blog): taste-skill body migration"
```

---

## Task 9: /cookies — cookies legal page

**Goal:** Long-form legal Czech prose. Apply taste-skill typography rhythm — no fancy motion, just calm reading flow.

**Files:**
- Modify: `src/app/[locale]/cookies/page.tsx`
- Create: `src/app/[locale]/cookies/cookies-body.tsx` (client wrapper kept thin — almost all content is static)

- [ ] **Step 1: Read existing page + translation keys** (`legal.cookies.{hero, sections[].heading, sections[].body, fullVersionNote}`)
- [ ] **Step 2: Build composition**
  - `<PageHero>` with `legal.cookies.hero.*`
  - Single column with sections rendered via `<ProseBlock>`:
    - max-w-[64ch], 17px line-height 1.6, secondary text color
    - h2 styled `display text-[clamp(28px,3vw,40px)] mt-16`
    - h3 styled `font-mono uppercase text-[12px] tracking-[0.18em] text-tertiary mt-8`
    - p styled `mt-4 text-secondary`
    - ul styled with 6px diamond accent bullet (same as homepage audit deliverables)
    - Final `fullVersionNote` rendered as a calm "info card" — `bg-surface rounded-card p-8 border-border-soft`
- [ ] **Step 3: Replace page.tsx with server shell**
- [ ] **Step 4: Czech typography linter must still pass** — `pnpm lint:cs` exit 0
- [ ] **Step 5: Smoke test, a11y, commit**

```bash
git commit -m "feat(cookies): taste-skill body migration"
```

---

## Task 10: /ochrana-soukromi — privacy policy

**Goal:** Same pattern as Task 9. Legal prose, calm rhythm.

**Files:**
- Modify: `src/app/[locale]/ochrana-soukromi/page.tsx`
- Create: `src/app/[locale]/ochrana-soukromi/ochrana-body.tsx`

- [ ] **Step 1: Read existing page + translation keys** (`legal.privacy.*`)
- [ ] **Step 2: Build composition** — identical to Task 9, swap copy
- [ ] **Step 3: Replace page.tsx with server shell**
- [ ] **Step 4: Smoke test, lint:cs, a11y, commit**

```bash
git commit -m "feat(ochrana-soukromi): taste-skill body migration"
```

---

## Task 11: Cleanup orphans

**Goal:** Remove components and routes superseded by Phase 3.

**Files:**
- Delete: `src/components/offering-section.tsx` (replaced by `bento-grid`)
- Delete: `src/components/pricing-card.tsx` (replaced by `sticky-tier-stack`)
- Delete: `src/app/redesign-preview/` (sandbox no longer needed)
- Modify: `src/middleware.ts` (drop `redesign-preview` matcher exclusion)

- [ ] **Step 1: Confirm zero remaining imports**

```bash
grep -rn "from '@/components/offering-section'" src/
grep -rn "from '@/components/pricing-card'" src/
grep -rn "redesign-preview" src/middleware.ts
```
Expected: zero hits before deleting (if any hit, that page hasn't been migrated yet — go back and finish it).

- [ ] **Step 2: Delete files**

```bash
rm src/components/offering-section.tsx
rm src/components/pricing-card.tsx
rm -rf src/app/redesign-preview
```

- [ ] **Step 3: Update middleware**

```ts
// src/middleware.ts
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
pnpm lint
pnpm lint:cs
```
Expected: all pass.

- [ ] **Step 5: Smoke test all routes**

```bash
for path in /cs /cs/sluzby /cs/reseni /cs/odvetvi /cs/spoluprace /cs/o-nas /cs/kontakt /cs/blog /cs/cookies /cs/ochrana-soukromi; do
  /usr/bin/curl -s -o /dev/null -w "$path %{http_code}\n" "http://localhost:3000$path"
done
/usr/bin/curl -s -o /dev/null -w "/redesign-preview %{http_code}\n" http://localhost:3000/redesign-preview
```
Expected: all `/cs/*` return `200`. `/redesign-preview` returns `404` (route deleted) or redirects to `/cs/redesign-preview` then 404.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts
git rm src/components/offering-section.tsx src/components/pricing-card.tsx
git rm -r src/app/redesign-preview
git commit -m "chore(cleanup): drop pre-D-008 components and redesign-preview sandbox"
```

---

## Task 12: Cross-page verification + production deploy

**Goal:** Run the full quality gate before promoting Phase 3 to production.

- [ ] **Step 1: Type + lint sweep**

```bash
npx tsc --noEmit
pnpm lint
pnpm lint:cs
```
Expected: all pass.

- [ ] **Step 2: Vitest unit suite (if any unit tests touch sections)**

```bash
pnpm test
```
Expected: pass.

- [ ] **Step 3: Playwright e2e suite — full route + a11y matrix**

Add `e2e/phase3-routes.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/cs',
  '/cs/sluzby',
  '/cs/reseni',
  '/cs/odvetvi',
  '/cs/spoluprace',
  '/cs/o-nas',
  '/cs/kontakt',
  '/cs/blog',
  '/cs/cookies',
  '/cs/ochrana-soukromi',
];

for (const route of ROUTES) {
  test(`${route} renders + passes axe`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveTitle(/VICTA/);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

Run:
```bash
pnpm e2e
```
Expected: all 10 routes pass.

- [ ] **Step 4: Lighthouse CI — performance budget gate**

```bash
pnpm dlx @lhci/cli@0.13.x autorun --collect.url=http://localhost:3000/cs --collect.url=http://localhost:3000/cs/sluzby
```

Required thresholds (claude-rules §11):
- Performance ≥ 0.90
- Accessibility ≥ 0.95
- Best practices ≥ 0.95
- SEO ≥ 0.95

If framer-motion bundle hit pushes Performance < 0.90 on any route, lazy-load motion sections (Next dynamic import with `ssr: false`) on the heaviest route.

- [ ] **Step 5: Czech typography linter final check**

```bash
pnpm lint:cs
```
Expected: `OK (1 files scanned)`.

- [ ] **Step 6: Bundle-size guard (claude-rules §14)**

```bash
pnpm build 2>&1 | tee build.log | grep -E "First Load JS"
```
Inspect each route's First-Load JS. Hard cap: any single route ≤ 250 kB. If exceeded, code-split.

- [ ] **Step 7: Push branch, get Vercel preview URL**

```bash
git push
# Wait for Vercel auto-deploy
cd /Users/trungle/Desktop/websites/VICTA && vercel ls victa-perso-website --yes --scope romciiitos-projects | head -3
```
Expected: latest preview shows ● Ready.

- [ ] **Step 8: Manual visual review on preview deploy**

Open the preview URL. Walk through every route on desktop + mobile viewport. Check rhythm matches homepage:
- Same eyebrow → display headline → sub typography sequence
- Same spring config (no jarring vs. homogeneous)
- Same hover state quality (spotlight, magnetic, perpetual motion)
- No visible "old layout" patterns (rounded-md cards, ferro-rust accent bleed-through, Inter Tight remnants)

- [ ] **Step 9: Promote to production**

Only after Step 8 explicit go from Roman:

```bash
cd /Users/trungle/Desktop/websites/VICTA && vercel promote <latest-preview-deploy-url> --scope romciiitos-projects --yes
```

Wait for production build to flip green:
```bash
vercel ls victa-perso-website --yes --scope romciiitos-projects | grep -m1 Production
```

- [ ] **Step 10: Verify victaagency.com**

```bash
/usr/bin/curl -s https://victaagency.com/cs | grep -oE 'Začneme tím|posloucháme|TRANSPARENTNOST'
```
Expected: 3 hits. (Adjust to bypass Vercel SSO if still gated — open in browser instead.)

- [ ] **Step 11: Final commit and tag**

```bash
git tag -a phase-3-complete -m "All sub-pages migrated to taste-skill (D-008)"
git push --tags
```

---

## Self-Review

**Spec coverage:**
- ✅ All 9 sub-pages have a dedicated migration task (Tasks 2–10)
- ✅ Foundation primitive extraction precedes per-page work (Task 1)
- ✅ Cleanup of orphaned components (Task 11)
- ✅ Quality gate + production deploy (Task 12)
- ✅ Czech typography linter respected throughout
- ✅ Translation keys preserved (no JSON edits)
- ✅ Existing form components (contact, newsletter) not touched internally
- ✅ Cal.com booking webhook + Supabase access untouched (sub-pages don't need them)

**Placeholder scan:**
- Task 6 / Task 8: kept short — same TDD step pattern as Tasks 2–5; engineer pastes the matching primitive composition. If implementing without context, expand by reading the homepage section that the page mirrors (Bento for sluzby, KineticList for odvetvi, ValuesGrid for o-nas).
- Task 5: noted as "largest sub-page" with explicit hint to inventory translation keys first because copy-pasting from homepage will not match.
- No "TODO" / "TBD" remain.

**Type consistency:**
- `BentoItem.span: 4 | 5 | 7 | 8 | 12` enforced via `colClass: Record<typeof span, string>` lookup so all consumers get type-checked column widths.
- `OfferingDataItem` from `@/lib/offerings-data` reused as the source-of-truth shape for any service / solution / industry detail block.
- `MagneticCta` props (`children`, `href`, `primary?`, `compact?`) used consistently across all sections.
- `SPRING` config (`stiffness: 110, damping: 22, mass: 0.9`) is the same constant everywhere — engineer must NOT introduce new motion values.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-05-07-phase3-page-bodies-taste-skill.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task (12 tasks), review between tasks, fast iteration. Each subagent only sees one task spec, no homepage or other sub-page context bleed.

2. **Inline Execution** — Execute tasks in this session (or a follow-up) using `superpowers:executing-plans`, batch execution with checkpoints for review at the end of each task.

Which approach?
