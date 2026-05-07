'use client';

import { motion } from 'framer-motion';
import { MagneticCta } from './magnetic-cta';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };

export type TierData = {
  tier: string;
  flag?: string;
  name: string;
  price: string;
  priceEur: string;
  body: string;
  deliverables: string[];
  cta: string;
  ctaHref: string;
  primary?: boolean;
};

type Props = {
  tiers: ReadonlyArray<TierData>;
  scopingNote?: React.ReactNode;
};

export function StickyTierStack({ tiers, scopingNote }: Props) {
  return (
    <>
      <div className="mt-16 space-y-6 md:space-y-10">
        {tiers.map((tier, i) => (
          <StickyTier key={tier.name} tier={tier} index={i} />
        ))}
      </div>
      {scopingNote && (
        <p className="mt-10 text-center font-mono text-[12.5px] text-tertiary">
          {scopingNote}
        </p>
      )}
    </>
  );
}

function StickyTier({ tier, index }: { tier: TierData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.05 }}
      className="sticky border border-border bg-surface"
      style={{
        top: `calc(80px + ${index * 16}px)`,
        borderRadius: '20px',
      }}
    >
      <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-[2fr_3fr_2fr] md:gap-12 md:p-12">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-tertiary">
              {tier.tier}
            </span>
            {tier.flag && (
              <span
                className="rounded-full border border-accent px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-accent"
                style={{ backgroundColor: 'var(--accent-soft)' }}
              >
                {tier.flag}
              </span>
            )}
          </div>
          <h3 className="display mt-3 text-[clamp(32px,3.6vw,56px)] text-ink">
            {tier.name}
          </h3>
        </div>

        <div>
          <p className="text-[16px] leading-[1.6] text-secondary">{tier.body}</p>
          <ul className="mt-6 space-y-2.5">
            {tier.deliverables.map((d, di) => (
              <li
                key={di}
                className="flex items-start gap-3 text-[14.5px] text-ink"
              >
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 rotate-45 shrink-0 bg-accent"
                />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-8 md:items-end">
          <div className="text-left md:text-right">
            <div className="font-mono text-[26px] font-medium leading-tight text-ink md:text-[32px]">
              {tier.price}
            </div>
            <div className="mt-1 font-mono text-[13px] text-tertiary">
              {tier.priceEur}
            </div>
          </div>
          <MagneticCta primary={tier.primary} compact href={tier.ctaHref}>
            {tier.cta}
          </MagneticCta>
        </div>
      </div>
    </motion.div>
  );
}
