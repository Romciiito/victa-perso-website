import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BentoShell, BentoCard } from './bento';

/* ============================================================
   OfferingSection — D-008 D-008 refactor
   Public API preserved. Internal layout: 380px feature card (left)
   + AsymmetricalBento-like 2-col items grid (right). Mobile collapses
   to single column with feature on top.
   Per spec §5: Homepage offerings → Asymmetrical Bento, feature 2fr.
   ============================================================ */

export type OfferingItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href?: string;
};

export type OfferingSectionProps = {
  sidebarIcon: LucideIcon;
  sidebarHeadline: string;
  sidebarDescription: string;
  sidebarCtaLabel: string;
  sidebarCtaHref: string;
  items: ReadonlyArray<OfferingItem>;
  id?: string;
};

export function OfferingSection({
  sidebarIcon: SidebarIcon,
  sidebarHeadline,
  sidebarDescription,
  sidebarCtaLabel,
  sidebarCtaHref,
  items,
  id,
}: OfferingSectionProps) {
  return (
    <section
      id={id}
      className="relative px-6 py-24 md:px-8 md:py-32"
      style={{ borderTop: '1px solid var(--line)' }}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid gap-4 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-6">
          {/* Feature intro card */}
          <BentoShell>
            <BentoCard padding="loose">
              <div className="flex flex-col gap-6">
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <SidebarIcon size={22} strokeWidth={1.5} aria-hidden />
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(24px, 2.4vw, 32px)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.035em',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  {sidebarHeadline}
                </h2>
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.55,
                    color: 'var(--ink-muted)',
                  }}
                >
                  {sidebarDescription}
                </p>
                <Link
                  href={sidebarCtaHref}
                  className="inline-flex items-center gap-2 self-start font-medium transition-colors duration-200"
                  style={{
                    fontSize: '14px',
                    color: 'var(--ink)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  <span style={{ borderBottom: '1px solid var(--ink)' }}>
                    {sidebarCtaLabel}
                  </span>
                  <CtaArrow />
                </Link>
              </div>
            </BentoCard>
          </BentoShell>

          {/* Items grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            {items.map((item) => (
              <OfferingItemCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   OfferingItemCard — single item in the offerings grid
   Wraps BentoShell + BentoCard. Becomes a Link when item.href set.
   ============================================================ */
function OfferingItemCard({ item }: { item: OfferingItem }) {
  const Icon = item.icon;
  const inner = (
    <BentoShell>
      <BentoCard padding="compact">
        <div className="flex flex-col gap-2">
          <Icon
            size={20}
            strokeWidth={1.5}
            aria-hidden
            style={{ color: 'var(--ink-muted)' }}
          />
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: '-0.015em',
              color: 'var(--ink)',
              marginTop: '8px',
            }}
          >
            {item.title}
          </h3>
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.55,
              color: 'var(--ink-muted)',
            }}
          >
            {item.subtitle}
          </p>
        </div>
      </BentoCard>
    </BentoShell>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ============================================================
   CtaArrow — inline SVG arrow (replaces lucide ArrowRight)
   ============================================================ */
function CtaArrow() {
  return (
    <svg
      viewBox="0 0 14 14"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7h8M8 3l4 4-4 4" />
    </svg>
  );
}
