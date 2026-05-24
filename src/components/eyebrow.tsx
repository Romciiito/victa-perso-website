import type { ReactNode } from 'react';

type EyebrowProps = {
  /** Status indicator: 'ok' shows green breathing dot. 'none' hides dot. */
  status?: 'ok' | 'none';
  /** Children: typically text content like "VICTA Digital · česká digitální agentura" */
  children: ReactNode;
  className?: string;
};

/**
 * Eyebrow — status pill above H1 sections (soft-skill §4.C "Eyebrow Tags").
 * Renders as fit-content pill with optional breathing dot indicator.
 * All colors via CSS tokens — no hardcoded values.
 */
export function Eyebrow({ status = 'ok', children, className = '' }: EyebrowProps) {
  return (
    <div
      className={`inline-flex w-fit items-center gap-2.5 rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--line)',
        color: 'var(--ink-muted)',
        boxShadow: 'var(--shadow-sm)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {status === 'ok' ? <EyebrowDot /> : null}
      <span>{children}</span>
    </div>
  );
}

function EyebrowDot() {
  return (
    <span
      aria-hidden
      className="inline-block h-[5px] w-[5px] rounded-full"
      style={{
        background: 'var(--status-ok)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--status-ok) 18%, transparent)',
        animation: 'eyebrow-breathe 2.6s cubic-bezier(0.32, 0.72, 0, 1) infinite',
      }}
    />
  );
}
