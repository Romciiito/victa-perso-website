import type { ReactNode } from 'react';

type EditorialSplitProps = {
  left: ReactNode;
  right: ReactNode;
  /** Horizontal ratio: 'balanced' = 1fr/1fr, 'left-heavy' = 1.05fr/1fr */
  ratio?: 'balanced' | 'left-heavy';
  /** Section padding scale */
  padding?: 'hero' | 'standard';
  className?: string;
};

/**
 * EditorialSplit — soft-skill §3.B.3 layout archetype.
 * Massive content left, interactive block right.
 * Mobile fallback: single-column stack below 980px (via globals.css media query).
 */
export function EditorialSplit({
  left,
  right,
  ratio = 'left-heavy',
  padding = 'hero',
  className = '',
}: EditorialSplitProps) {
  const padY = padding === 'hero'
    ? 'pt-32 pb-24 md:pt-[168px] md:pb-24'
    : 'py-24 md:py-32';
  const minH = padding === 'hero' ? 'min-h-[100dvh]' : '';

  return (
    <section
      data-ratio={ratio}
      className={`editorial-split relative z-[1] mx-auto w-full max-w-[1440px] items-center gap-14 px-6 md:px-8 ${padY} ${minH} ${className}`}
    >
      <div className="grid content-start gap-8">{left}</div>
      <div className="grid h-full content-center gap-3">{right}</div>
    </section>
  );
}
