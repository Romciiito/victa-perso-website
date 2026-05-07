import type { ReactNode } from 'react';

type Props = { children: ReactNode };

/**
 * Status line signature element (LOCKED §1.7).
 * Geist Mono 12px tertiary with green dot. Appears on every page.
 */
export function StatusLine({ children }: Props) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-xs text-tertiary">
      <span
        aria-hidden
        className="inline-block size-[6px] rounded-full"
        style={{ backgroundColor: 'var(--success)' }}
      />
      {children}
    </p>
  );
}
