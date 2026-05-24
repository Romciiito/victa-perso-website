import { Button } from './button';
import { BentoShell, BentoCard } from './bento';

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
 * PricingCard — D-008 refactor using BentoShell + BentoCard Double-Bezel.
 * Popular variant wraps in .audit-card.popular for the accent ring
 * (D-001 alias still active per spec §10).
 *
 * API preserved — call sites (spoluprace) unchanged.
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
    <div
      className={popular ? 'audit-card popular' : 'audit-card'}
      style={popular ? { borderRadius: 'var(--radius-xl)' } : undefined}
    >
      <BentoShell>
        <BentoCard padding="loose">
          {/* Tier row */}
          <div className="flex items-center justify-between" style={{ gap: '12px' }}>
            <span
              className="font-mono uppercase"
              style={{
                color: 'var(--ink-soft)',
                fontSize: '11px',
                letterSpacing: '0.16em',
              }}
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
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontWeight: 500,
                }}
              >
                {badge}
              </span>
            ) : null}
          </div>

          {/* Name */}
          <h3
            style={{
              fontSize: 'clamp(22px, 2.2vw, 26px)',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              color: 'var(--ink)',
              marginTop: '4px',
            }}
          >
            {name}
          </h3>

          {ideal ? (
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.55,
                color: 'var(--ink-muted)',
              }}
            >
              {ideal}
            </p>
          ) : null}

          {/* Price block */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-geist), system-ui, sans-serif',
                fontSize: 'clamp(28px, 3.2vw, 40px)',
                fontWeight: 500,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: 'var(--ink)',
                marginBottom: '6px',
              }}
            >
              {price}
            </div>
            {priceSecondary ? (
              <div
                className="font-mono"
                style={{ fontSize: '12px', color: 'var(--ink-muted)' }}
              >
                {priceSecondary}
              </div>
            ) : null}
            {duration ? (
              <div
                className="font-mono"
                style={{
                  fontSize: '11px',
                  color: 'var(--ink-soft)',
                  letterSpacing: '0.06em',
                  marginTop: '8px',
                }}
              >
                {duration}
              </div>
            ) : null}
          </div>

          {/* Divider */}
          <hr
            className="border-0 border-t"
            style={{ borderColor: 'var(--line)', margin: '4px 0' }}
          />

          {/* Bullets label */}
          <div
            className="font-mono uppercase"
            style={{
              color: 'var(--ink-soft)',
              fontSize: '10px',
              letterSpacing: '0.18em',
            }}
          >
            {bulletsLabel ?? 'Zahrnuje'}
          </div>

          {/* Bullets */}
          <ul className="list-none" style={{ display: 'grid', gap: '8px' }}>
            {bullets.map((b, i) => (
              <li
                key={`${i}-${b.slice(0, 16)}`}
                className="relative"
                style={{
                  fontSize: '13px',
                  lineHeight: 1.55,
                  color: 'var(--ink)',
                  paddingLeft: '20px',
                }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0"
                  style={{ color: 'var(--accent)', fontWeight: 600 }}
                >
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          {/* CTA — bottom-aligned */}
          <div style={{ marginTop: 'auto' }}>
            <Button
              href={ctaHref}
              variant={popular ? 'primary' : 'ghost'}
              className="w-full justify-center"
            >
              {ctaLabel}
            </Button>
          </div>
        </BentoCard>
      </BentoShell>
    </div>
  );
}
