'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { m, useScroll, useTransform, type Variants } from 'framer-motion';

/* ============================================================
   page-hero-client.tsx
   ----------------------------------------------------------------
   Client leaves for PageHero (audit P0-21 + P0-22). PageHero itself
   is a Server Component — only the scroll-driven parallax wrapper
   and the small entrance-reveal wrapper need the browser, so they
   live here as their own 'use client' boundary. The H1 headline is
   rendered directly by PageHero (server) and is NEVER passed through
   either of these — it must be visible in the very first paint,
   with no opacity/blur/scale animation (LCP fix).

   Uses `m.*` (not `motion.*`) so it benefits from the LazyMotion
   `domAnimation` provider set up in the root layout (P1-15).
   ============================================================ */

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

/** Section wrapper + scroll-linked parallax. Renders the actual <section>/<div> shell so it can attach the scroll ref; server-rendered content (incl. the static H1) passes through untouched as `children`. */
export function HeroParallax({ children }: { children: ReactNode }) {
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
        <m.div style={{ y }} className="flex flex-col">
          {children}
        </m.div>
      </div>
    </section>
  );
}

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'nav';
  'aria-label'?: string;
};

/** Entrance fade/blur reveal for accompanying hero elements (status badge, eyebrow, sub, CTAs, anchors) — never used for the H1 itself. */
export function HeroReveal({ children, delay = 0, className, as = 'div', ...rest }: RevealProps) {
  const MotionTag = as === 'nav' ? m.nav : m.div;
  return (
    <MotionTag
      initial="hidden"
      animate="visible"
      transition={{ ...SPRING, delay }}
      variants={REVEAL}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
