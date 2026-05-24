'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { List, X } from '@phosphor-icons/react/dist/ssr';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';

type NavItem = {
  href: string;
  key: 'services' | 'solutions' | 'industries' | 'collaboration' | 'about' | 'contact';
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/sluzby', key: 'services' },
  { href: '/reseni', key: 'solutions' },
  { href: '/odvetvi', key: 'industries' },
  { href: '/spoluprace', key: 'collaboration' },
  { href: '/o-nas', key: 'about' },
  { href: '/kontakt', key: 'contact' },
];

/**
 * Nav — Fluid Island floating pill on desktop, classic drawer on mobile.
 * Soft-skill §5.A. Skip-to-content link preserved for accessibility.
 *
 * Mobile fullscreen overlay with hamburger morph + staggered link reveal
 * is deferred to PR 2.
 */
export function Nav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Skip-to-content link — visible only on focus (a11y) */}
      <a
        href="#main"
        className="sr-only fixed left-3 top-3 z-[60] rounded-md px-3 py-2 text-sm focus:not-sr-only"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {t('skipToContent')}
      </a>

      {/* Desktop Fluid Island */}
      <nav
        className="fluid-island fixed left-1/2 top-[22px] z-40 hidden -translate-x-1/2 items-center gap-7 rounded-full py-2 pl-[18px] pr-2 backdrop-blur-[20px] md:flex"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 32px -12px rgba(10,11,14,0.08)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          transition: 'background 600ms var(--ease)',
        }}
      >
        <Link href="/" className="text-[16px] font-semibold tracking-[-0.025em]" style={{ color: 'var(--ink)' }}>
          VICTA
        </Link>
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className="nav-link relative text-[14px] font-medium transition-colors duration-200"
              style={{ color: active ? 'var(--ink)' : 'var(--ink-muted)' }}
            >
              {t(item.key)}
              {active ? (
                <span
                  aria-hidden
                  className="absolute -bottom-[6px] left-0 right-0 h-px"
                  style={{ background: 'var(--accent)' }}
                />
              ) : null}
            </Link>
          );
        })}
        <span className="ml-1 inline-flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </span>
        {/* Contact CTA pill */}
        <Link
          href="/kontakt"
          className="ml-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-transform duration-300 hover:-translate-y-[1px]"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
          }}
        >
          {t('contact')}
          <span
            aria-hidden
            className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--bg) 12%, transparent)' }}
          >
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6h7M6 3l3 3-3 3" />
            </svg>
          </span>
        </Link>
      </nav>

      {/* Mobile bar — minimal, drawer preserved */}
      <header
        className="mobile-bar fixed left-0 right-0 top-0 z-40 md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
          borderBottom: '1px solid var(--line)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/" className="text-[16px] font-semibold tracking-[-0.025em]" style={{ color: 'var(--ink)' }}>
            VICTA
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
            <button
              type="button"
              aria-label={open ? t('close') : t('open')}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200"
              style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)' }}
            >
              {open ? <X size={16} weight="regular" /> : <List size={16} weight="regular" />}
            </button>
          </div>
        </div>

        {open ? (
          <nav
            id="mobile-menu"
            style={{ background: 'var(--bg)', borderTop: '1px solid var(--line)' }}
          >
            <ul className="mx-auto flex flex-col gap-1 px-6 py-4">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-base transition-colors duration-200"
                      style={{
                        background: active ? 'var(--bg-deep)' : 'transparent',
                        color: active ? 'var(--ink)' : 'var(--ink-muted)',
                      }}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </header>
    </>
  );
}
