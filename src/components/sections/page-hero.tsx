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
type Cta =
  | { label: string; href: string; onClick?: never; primary?: boolean }
  | { label: string; href?: never; onClick: () => void | Promise<void>; primary?: boolean };

type Props = {
  status?: string;
  eyebrow?: string;
  headline: string;
  sub?: string;
  ctas?: ReadonlyArray<Cta>;
  anchors?: ReadonlyArray<AnchorLink>;
  anchorNavLabel?: string;
};

export function PageHero({ status, eyebrow, headline, sub, ctas, anchors, anchorNavLabel = 'Sekce stránky' }: Props) {
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
              {ctas.map((cta, i) =>
                'onClick' in cta && cta.onClick ? (
                  <MagneticCta key={`${cta.label}-${i}`} onClick={cta.onClick} primary={cta.primary}>
                    {cta.label}
                  </MagneticCta>
                ) : (
                  <MagneticCta key={cta.href} href={cta.href!} primary={cta.primary}>
                    {cta.label}
                  </MagneticCta>
                ),
              )}
            </motion.div>
          )}

          {anchors && anchors.length > 0 && (
            <motion.nav
              aria-label={anchorNavLabel}
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
