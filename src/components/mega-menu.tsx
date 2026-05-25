'use client';

import { useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import type { OfferingData } from '@/lib/offerings-data';
import { BentoShell, BentoCard } from './bento';

/* ============================================================
   MegaMenu — D-008 dropdown panel below the Fluid Island Nav.

   Visual contract (mirrors OfferingSection, PR 4 commit 6f14c9c):
   ──────────────────────────────────────────────────────────────
   - Outer panel: glass backdrop (bg-elevated + backdrop-blur),
     1px line border, rounded var(--radius-xl), centered max-w.
   - Layout: 380px feature card sidebar + 2-col items grid.
   - Sidebar: BentoShell + BentoCard padding=loose, accent-soft
     icon circle, h2, description, underlined CTA + inline arrow.
   - Items: BentoShell + BentoCard padding=compact, Phosphor icon
     (weight="light"), title, subtitle.
   - Replaces the previous D-001 Atol pattern (6-cell light grid
     + dark sidebar) so the dropdown reads as a natural extension
     of the homepage offering sections.

   Behaviour
   ─────────
   - `open=false` → returns null (zero DOM cost when closed).
   - `open=true`  → fixed panel fades + slides in.
   - Click outside (backdrop) → onClose.
   - Esc keypress → onClose.
   - Any link click inside → onClose (auto-close on navigation).
   ============================================================ */

export type MegaMenuProps = {
  open: boolean;
  onClose: () => void;
  data: OfferingData;
  /** id used for aria-labelledby from the trigger */
  panelId: string;
};

export function MegaMenu({ open, onClose, data, panelId }: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const SidebarIcon = data.sidebarIcon;

  return (
    <>
      {/* Click-outside backdrop. Sits below the panel but above page.
          The Fluid Island Nav sits at top:22px with ~52px height, so the
          panel starts at ~88px to leave a visual gap between pill + panel. */}
      <button
        type="button"
        aria-label="Zavřít menu"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default"
        style={{ background: 'transparent' }}
      />

      {/* The panel itself — centered, glass shell, BentoShell grid inside. */}
      <div
        ref={panelRef}
        id={panelId}
        role="menu"
        aria-orientation="vertical"
        className="megamenu-panel fixed left-1/2 z-50 -translate-x-1/2"
        style={{
          top: '88px',
          width: 'min(1200px, calc(100vw - 32px))',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px -16px rgba(10,11,14,0.18), 0 8px 32px -12px rgba(10,11,14,0.10)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="p-3 md:p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-4">
            {/* Feature intro card — sidebar */}
            <BentoShell>
              <BentoCard padding="loose">
                <div className="flex flex-col gap-5">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    <SidebarIcon size={22} weight="light" aria-hidden />
                  </div>
                  <h2
                    style={{
                      fontSize: 'clamp(22px, 2vw, 28px)',
                      lineHeight: 1.1,
                      letterSpacing: '-0.035em',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {data.sidebarHeadline}
                  </h2>
                  <p
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.55,
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {data.sidebarDescription}
                  </p>
                  <Link
                    href={data.sidebarCtaHref}
                    role="menuitem"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 self-start font-medium transition-colors duration-200"
                    style={{
                      fontSize: '14px',
                      color: 'var(--ink)',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    <span style={{ borderBottom: '1px solid var(--ink)' }}>
                      {data.sidebarCtaLabel}
                    </span>
                    <CtaArrow />
                  </Link>
                </div>
              </BentoCard>
            </BentoShell>

            {/* Items grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-3">
              {data.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${idx}-${item.title}`}
                    href={item.href}
                    role="menuitem"
                    onClick={onClose}
                    className="block"
                  >
                    <BentoShell>
                      <BentoCard padding="compact">
                        <div className="flex flex-col gap-2">
                          <Icon
                            size={20}
                            weight="light"
                            aria-hidden
                            style={{ color: 'var(--ink-muted)' }}
                          />
                          <h3
                            style={{
                              fontSize: '15px',
                              fontWeight: 500,
                              lineHeight: 1.25,
                              letterSpacing: '-0.015em',
                              color: 'var(--ink)',
                              marginTop: '4px',
                            }}
                          >
                            {item.title}
                          </h3>
                          <p
                            style={{
                              fontSize: '12.5px',
                              lineHeight: 1.5,
                              color: 'var(--ink-muted)',
                            }}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                      </BentoCard>
                    </BentoShell>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles — scoped via class. */}
      <style jsx global>{`
        .megamenu-panel {
          animation: megamenu-in 180ms cubic-bezier(0.32, 0.72, 0, 1);
        }
        @keyframes megamenu-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .megamenu-panel {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

/* ============================================================
   CtaArrow — inline SVG arrow (mirrors offering-section.tsx).
   No external icon dep so this client component stays minimal.
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
