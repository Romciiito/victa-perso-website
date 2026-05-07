'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
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

export function Nav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border-soft backdrop-blur-[12px]"
      style={{ backgroundColor: 'color-mix(in oklab, var(--bg) 88%, transparent)' }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-md focus:border focus:border-border focus:bg-bg focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-sm"
      >
        {t('skipToContent')}
      </a>

      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4 md:px-12">
        {/* Logo + tag */}
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="text-base font-semibold tracking-[-0.01em] text-ink">VICTA</span>
          <span className="font-mono text-xs text-secondary">{t('tag')}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative rounded-sm px-3 py-2 text-sm transition-colors duration-150 ${
                  active
                    ? 'text-ink'
                    : 'text-secondary hover:bg-surface hover:text-ink'
                }`}
              >
                {t(item.key)}
                {active ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 -bottom-px h-px"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                ) : null}
              </Link>
            );
          })}
          <span className="ml-2 inline-flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
          </span>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <LocaleSwitcher />
          <button
            type="button"
            aria-label={open ? t('close') : t('open')}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-md border border-border text-ink transition-colors duration-150 hover:bg-surface"
          >
            {open ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <nav
          id="mobile-menu"
          className="border-t border-border-soft md:hidden"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <ul className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-6 py-4">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-sm px-3 py-3 text-base transition-colors duration-150 ${
                      active ? 'bg-surface text-ink' : 'text-secondary hover:bg-surface hover:text-ink'
                    }`}
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
  );
}
