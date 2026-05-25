import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/* ============================================================
   OfferingSection — Atol-style 6-cell light grid + dark sticky sidebar
   Used on homepage to display three "offering" sections:
     1. Services for the AI journey
     2. Turnkey AI solutions
     3. AI solutions per industry
   Layout: cells LEFT, dark card RIGHT on desktop;
           dark card on TOP, cells below on mobile.

   D-007 update (2026-05-07): outer <section> is now `position: sticky;
   top: 0` so successive offering sections stack on top of each other
   while the user scrolls (atolsolutions.cz cascade reference).
   `bg-bg` is mandatory on the section so each new block opaquely
   obscures the previous one as it pins. The hairline `border-t` reads
   as the seam between stacked cards. Section vertical padding is
   `py-24 md:py-32` (96 / 128 px) per low-density token (D-007 §1.4).
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
      className="sticky top-0 bg-bg border-t border-border-soft px-7 py-24 md:px-14 md:py-32"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid gap-9 md:grid-cols-[1fr_320px] md:gap-12 lg:grid-cols-[1fr_360px]">
          {/* Cells grid (left on desktop, below on mobile) */}
          <div
            className="order-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:order-1"
            style={{
              borderTop: '1px solid var(--border-soft)',
              borderLeft: '1px solid var(--border-soft)',
            }}
          >
            {items.map((item, idx) => (
              <OfferingCell key={`${idx}-${item.title}`} item={item} />
            ))}
          </div>

          {/* Dark sidebar (right on desktop, above on mobile) */}
          <aside
            className="order-1 self-start rounded-lg p-8 md:order-2 md:p-10 md:sticky md:top-24"
            style={{ backgroundColor: 'var(--ink)', color: 'var(--bg)' }}
          >
            <SidebarIcon
              size={32}
              strokeWidth={1.5}
              aria-hidden
              className="mb-6"
              style={{ color: 'var(--bg)', opacity: 0.9 }}
            />
            <h2
              className="mb-4"
              style={{
                fontSize: 'clamp(24px, 2.4vw, 28px)',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                fontWeight: 500,
                color: 'var(--bg)',
              }}
            >
              {sidebarHeadline}
            </h2>
            <p
              className="mb-8"
              style={{
                fontSize: '15px',
                lineHeight: 1.55,
                color: 'var(--bg)',
                opacity: 0.7,
              }}
            >
              {sidebarDescription}
            </p>
            <Link
              href={sidebarCtaHref}
              className="inline-flex items-center gap-2 transition-opacity duration-150 hover:opacity-80"
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--bg)',
                letterSpacing: '-0.005em',
                borderBottom: '1px solid transparent',
              }}
            >
              <span>{sidebarCtaLabel}</span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   OfferingCell — single light cell on the offering grid.
   Borders are uniform: top + left applied to grid container,
   each cell adds its own bottom + right hairline → forms a
   clean 3-col table look without doubled borders.
   ============================================================ */
function OfferingCell({ item }: { item: OfferingItem }) {
  const Icon = item.icon;
  const cellClass =
    'flex h-full flex-col gap-1 px-5 py-6 transition-colors duration-150 hover:bg-surface md:px-7 md:py-8';
  const cellStyle = {
    borderRight: '1px solid var(--border-soft)',
    borderBottom: '1px solid var(--border-soft)',
  } as const;

  const inner = (
    <>
      <Icon
        size={20}
        strokeWidth={1.5}
        aria-hidden
        className="mb-3 text-tertiary"
      />
      <h3
        className="text-ink"
        style={{
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '-0.005em',
          marginBottom: '4px',
        }}
      >
        {item.title}
      </h3>
      <p
        className="text-secondary"
        style={{ fontSize: '13px', lineHeight: 1.55 }}
      >
        {item.subtitle}
      </p>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={cellClass} style={cellStyle}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={cellClass} style={cellStyle}>
      {inner}
    </div>
  );
}
