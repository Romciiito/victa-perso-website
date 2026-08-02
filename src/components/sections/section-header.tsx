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
