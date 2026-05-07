import type { ReactNode } from 'react';
import { Button } from './button';

type Props = {
  tier: string;
  name: string;
  price: string;
  priceSecondary?: string;
  duration?: string;
  bullets: ReadonlyArray<string>;
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
  badge?: string;
  ideal?: string;
  bulletsLabel?: string;
};

/**
 * Pricing card for audit tiers.
 * Borders, not shadows (LOCKED §1.6). Popular variant gets accent ring.
 */
export function PricingCard({
  tier,
  name,
  price,
  priceSecondary,
  duration,
  bullets,
  ctaLabel,
  ctaHref,
  popular = false,
  badge,
  ideal,
  bulletsLabel,
}: Props) {
  return (
    <article
      className={`flex h-full flex-col rounded-lg border p-6 md:p-8 ${popular ? 'audit-card popular' : ''}`}
      style={{
        backgroundColor: 'var(--bg)',
        borderColor: popular ? 'var(--accent)' : 'var(--border)',
        boxShadow: popular ? '0 0 0 1px var(--accent)' : undefined,
      }}
    >
      {/* Tier row */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <span
          className="font-mono text-xs uppercase"
          style={{ color: 'var(--tertiary)', letterSpacing: '0.12em' }}
        >
          {tier}
        </span>
        {popular && badge ? (
          <span
            className="font-mono uppercase"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>

      {/* Name */}
      <h3
        className="mb-4 text-xl text-ink"
        style={{ fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2 }}
      >
        {name}
      </h3>

      {/* Ideal-for */}
      {ideal ? (
        <p className="mb-6 text-sm leading-[1.6] text-secondary">{ideal}</p>
      ) : null}

      {/* Price */}
      <div
        className="font-mono text-ink"
        style={{ fontSize: 'var(--text-2xl, 33px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}
      >
        {price}
      </div>
      {priceSecondary ? (
        <div className="font-mono text-sm text-secondary">{priceSecondary}</div>
      ) : null}
      {duration ? (
        <div className="mt-2 font-mono text-xs text-tertiary" style={{ letterSpacing: '0.04em' }}>
          {duration}
        </div>
      ) : null}

      {/* Divider */}
      <hr className="my-6 border-0 border-t" style={{ borderColor: 'var(--border)' }} />

      {/* Bullets label */}
      <div
        className="mb-3 font-mono text-xs uppercase"
        style={{ color: 'var(--tertiary)', letterSpacing: '0.12em' }}
      >
        {bulletsLabel ?? 'Zahrnuje'}
      </div>

      {/* Bullets */}
      <ul className="mb-8 flex-1 list-none space-y-2">
        {bullets.map((b, i) => (
          <li
            key={`${i}-${b.slice(0, 12)}`}
            className="relative pl-6 text-sm leading-[1.7] text-ink"
          >
            <Check />
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        href={ctaHref}
        variant={popular ? 'primary' : 'ghost'}
        className="w-full"
      >
        {ctaLabel}
      </Button>
    </article>
  );
}

function Check(): ReactNode {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-0 select-none font-semibold"
      style={{ color: 'var(--accent)' }}
    >
      ✓
    </span>
  );
}
