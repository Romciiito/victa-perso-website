import type { ReactNode } from 'react';

type AsymmetricalBentoProps = {
  /** Children — typically BentoShell elements; first one can be span={2} (feature) */
  children: ReactNode;
  /** Number of columns at desktop. Default 3. */
  cols?: 2 | 3 | 4;
  /** Gap between cells. */
  gap?: 'tight' | 'standard' | 'loose';
  className?: string;
};

/**
 * AsymmetricalBento — soft-skill §3.B.1 layout archetype.
 * Grid container supporting feature cards spanning 2 columns via BentoShell span prop.
 * Mobile fallback: single column below 768px.
 *
 * Usage:
 *   <AsymmetricalBento cols={3}>
 *     <BentoShell span={2}>...</BentoShell>  // feature
 *     <BentoShell>...</BentoShell>
 *     <BentoShell>...</BentoShell>
 *     <BentoShell>...</BentoShell>
 *   </AsymmetricalBento>
 */
export function AsymmetricalBento({
  children,
  cols = 3,
  gap = 'standard',
  className = '',
}: AsymmetricalBentoProps) {
  const gapClass = {
    tight: 'gap-3',
    standard: 'gap-4',
    loose: 'gap-6',
  }[gap];

  const colClass = {
    2: 'asymmetrical-bento-2',
    3: 'asymmetrical-bento-3',
    4: 'asymmetrical-bento-4',
  }[cols];

  return (
    <div className={`asymmetrical-bento ${colClass} grid ${gapClass} ${className}`}>
      {children}
    </div>
  );
}
