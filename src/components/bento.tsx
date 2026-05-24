import type { ReactNode } from 'react';

type BentoShellProps = {
  /** Children: typically one BentoCard */
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
      className={`bento-shell-hover p-1.5 ${span === 2 ? 'col-span-2' : ''} ${className}`}
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
 * Has its own background, border, inner highlight, and hover lift via
 * parent BentoShell.bento-shell-hover:hover descendant selector.
 */
export function BentoCard({ children, padding = 'standard', className = '' }: BentoCardProps) {
  const padClass = {
    compact: 'px-5 py-5',
    standard: 'px-6 py-7',
    loose: 'px-7 py-8',
  }[padding];

  return (
    <div
      className={`bento-card-inner relative grid h-full content-between gap-4 overflow-hidden ${padClass} ${className}`}
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
