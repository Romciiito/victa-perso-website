'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { OfferingData } from '@/lib/offerings-data';

/* ============================================================
   MegaMenu — Atol-style dropdown panel below the nav.
   Reuses the same 6-cell light grid + dark sticky sidebar
   pattern as <OfferingSection> on the homepage, but rendered
   in a fixed-positioned dropdown that anchors below the header.

   Behaviour
   ─────────
   - `open=false` → returns null (no DOM cost when closed).
   - `open=true`  → fixed full-width panel, fades + slides in.
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
      {/* Click-outside backdrop. Sits below the panel but above page. */}
      <button
        type="button"
        aria-label="Zavřít menu"
        onClick={onClose}
        className="fixed inset-x-0 bottom-0 z-40 cursor-default"
        style={{
          top: '64px', // sits below nav so hover-bridge still works
          backgroundColor: 'transparent',
        }}
      />

      {/* The panel itself. Full viewport width, internal max-w to match nav. */}
      <div
        ref={panelRef}
        id={panelId}
        role="menu"
        aria-orientation="vertical"
        className="megamenu-panel fixed inset-x-0 z-50 border-b border-border-soft"
        style={{
          top: '64px',
          backgroundColor: 'var(--bg)',
          boxShadow: 'var(--shadow-md, 0 12px 32px rgba(0,0,0,0.08))',
        }}
        onMouseLeave={onClose}
      >
        <div className="mx-auto w-full max-w-[1440px] px-6 py-8 md:px-12 md:py-10">
          <div className="grid gap-6 md:grid-cols-[1fr_320px] md:gap-8 lg:grid-cols-[1fr_360px]">
            {/* Cells grid — left on desktop */}
            <div
              className="order-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:order-1"
              style={{
                borderTop: '1px solid var(--border-soft)',
                borderLeft: '1px solid var(--border-soft)',
              }}
            >
              {data.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${idx}-${item.title}`}
                    href={item.href}
                    role="menuitem"
                    onClick={onClose}
                    className="flex h-full flex-col gap-1 px-5 py-5 transition-colors duration-150 hover:bg-surface md:px-6 md:py-6"
                    style={{
                      borderRight: '1px solid var(--border-soft)',
                      borderBottom: '1px solid var(--border-soft)',
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      aria-hidden
                      className="mb-2 text-tertiary"
                    />
                    <h3
                      className="text-ink"
                      style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        lineHeight: 1.25,
                        letterSpacing: '-0.005em',
                        marginBottom: '2px',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-secondary"
                      style={{ fontSize: '12px', lineHeight: 1.55 }}
                    >
                      {item.subtitle}
                    </p>
                  </Link>
                );
              })}
            </div>

            {/* Dark sidebar — right on desktop */}
            <aside
              className="order-1 self-start rounded-lg p-7 md:order-2 md:p-8"
              style={{ backgroundColor: 'var(--ink)', color: 'var(--bg)' }}
            >
              <SidebarIcon
                size={28}
                strokeWidth={1.5}
                aria-hidden
                className="mb-5"
                style={{ color: 'var(--bg)', opacity: 0.9 }}
              />
              <h2
                className="mb-3"
                style={{
                  fontSize: 'clamp(20px, 2vw, 24px)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  fontWeight: 500,
                  color: 'var(--bg)',
                }}
              >
                {data.sidebarHeadline}
              </h2>
              <p
                className="mb-6"
                style={{
                  fontSize: '14px',
                  lineHeight: 1.55,
                  color: 'var(--bg)',
                  opacity: 0.7,
                }}
              >
                {data.sidebarDescription}
              </p>
              <Link
                href={data.sidebarCtaHref}
                role="menuitem"
                onClick={onClose}
                className="inline-flex items-center gap-2 transition-opacity duration-150 hover:opacity-80"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--bg)',
                  letterSpacing: '-0.005em',
                }}
              >
                <span>{data.sidebarCtaLabel}</span>
                <ArrowRight size={16} aria-hidden />
              </Link>
            </aside>
          </div>
        </div>
      </div>

      {/* Animation styles — scoped via class. */}
      <style jsx global>{`
        .megamenu-panel {
          animation: megamenu-in 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes megamenu-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
