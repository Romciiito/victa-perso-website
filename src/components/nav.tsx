'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';
import { MegaMenu } from './mega-menu';
import {
  OFFERING_MAP,
  type OfferingData,
  type OfferingKey,
} from '@/lib/offerings-data';

/* ============================================================
   Nav — top header with desktop mega-menu + mobile accordion drawer.

   Desktop
   ───────
   - "Služby", "Řešení", "Odvětví" are dropdown triggers (button).
     Hover-with-delay or click toggles the corresponding mega-menu.
     Hover delay (180ms) prevents accidental opens; switching between
     triggers swaps panels instantly (no flicker).
   - "Spolupráce", "O nás", "Kontakt" remain plain links.
   - Theme toggle + locale switcher stay rightmost.

   Mobile
   ──────
   - Hamburger toggles a sheet. Inside the sheet, the same three
     items become accordion rows that expand inline to show the 6/5/7
     offering items as a list (icon + title + subtitle), with a
     "Zobrazit vše" link at the bottom of each section.
   - Plain link items stay simple links.
   ============================================================ */

type DropdownItem = { kind: 'dropdown'; key: OfferingKey; href: string };
type LinkItem = {
  kind: 'link';
  href: string;
  key: 'collaboration' | 'about' | 'contact';
};
type NavItem = DropdownItem | LinkItem;

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { kind: 'dropdown', key: 'services', href: '/sluzby' },
  { kind: 'dropdown', key: 'solutions', href: '/reseni' },
  { kind: 'dropdown', key: 'industries', href: '/odvetvi' },
  { kind: 'link', key: 'collaboration', href: '/spoluprace' },
  { kind: 'link', key: 'about', href: '/o-nas' },
  { kind: 'link', key: 'contact', href: '/kontakt' },
];

const HOVER_OPEN_DELAY_MS = 180;

export function Nav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<OfferingKey | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<OfferingKey | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idPrefix = useId();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}#`);

  const closeDropdown = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setOpenDropdown(null);
  };

  // Close any open dropdown when the route changes (auto-close on navigation).
  useEffect(() => {
    closeDropdown();
    setMobileOpen(false);
    setMobileExpanded(null);
    // intentionally listening to pathname only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cleanup timer on unmount.
  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const scheduleOpen = (key: OfferingKey) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // If another dropdown is already open, switch instantly.
    if (openDropdown && openDropdown !== key) {
      setOpenDropdown(key);
      return;
    }
    hoverTimer.current = setTimeout(() => {
      setOpenDropdown(key);
    }, HOVER_OPEN_DELAY_MS);
  };

  const cancelScheduledOpen = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const toggleDropdown = (key: OfferingKey) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setOpenDropdown((cur) => (cur === key ? null : key));
  };

  const activeData: OfferingData | null = openDropdown ? OFFERING_MAP[openDropdown] : null;
  const panelId = `${idPrefix}-megamenu`;

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
        <nav
          className="hidden items-center gap-1 md:flex"
          onMouseLeave={() => {
            cancelScheduledOpen();
            // Mouse left the trigger row — close after a short grace window
            // so users moving toward the panel below aren't punished.
            hoverTimer.current = setTimeout(() => setOpenDropdown(null), 120);
          }}
          onMouseEnter={cancelScheduledOpen}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);

            if (item.kind === 'link') {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative rounded-sm px-3 py-2 text-sm transition-colors duration-150 ${
                    active ? 'text-ink' : 'text-secondary hover:bg-surface hover:text-ink'
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
            }

            const isOpen = openDropdown === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleDropdown(item.key)}
                onMouseEnter={() => scheduleOpen(item.key)}
                onFocus={() => setOpenDropdown(item.key)}
                className={`relative inline-flex items-center gap-1 rounded-sm px-3 py-2 text-sm transition-colors duration-150 ${
                  active || isOpen ? 'text-ink' : 'text-secondary hover:bg-surface hover:text-ink'
                }`}
              >
                <span>{t(item.key)}</span>
                <ChevronDown
                  size={14}
                  aria-hidden
                  className="transition-transform duration-150"
                  style={{ transform: isOpen ? 'rotate(180deg)' : undefined, opacity: 0.7 }}
                />
                {active ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 -bottom-px h-px"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                ) : null}
              </button>
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
            aria-label={mobileOpen ? t('close') : t('open')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-md border border-border text-ink transition-colors duration-150 hover:bg-surface"
          >
            {mobileOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Desktop mega-menu panel */}
      {activeData ? (
        <div
          // Keep the panel "alive" on hover so it doesn't close before a click.
          onMouseEnter={cancelScheduledOpen}
        >
          <MegaMenu
            open={openDropdown !== null}
            onClose={closeDropdown}
            data={activeData}
            panelId={panelId}
          />
        </div>
      ) : null}

      {/* Mobile drawer */}
      {mobileOpen ? (
        <nav
          id="mobile-menu"
          className="border-t border-border-soft md:hidden"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <ul className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-6 py-4">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);

              if (item.kind === 'link') {
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-sm px-3 py-3 text-base transition-colors duration-150 ${
                        active ? 'bg-surface text-ink' : 'text-secondary hover:bg-surface hover:text-ink'
                      }`}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              }

              const data = OFFERING_MAP[item.key];
              const isExpanded = mobileExpanded === item.key;
              const accordionId = `${idPrefix}-mobile-${item.key}`;
              return (
                <li key={item.key} className="border-b border-border-soft last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={accordionId}
                    onClick={() =>
                      setMobileExpanded((cur) => (cur === item.key ? null : item.key))
                    }
                    className={`flex w-full items-center justify-between rounded-sm px-3 py-3 text-base transition-colors duration-150 ${
                      active || isExpanded
                        ? 'text-ink'
                        : 'text-secondary hover:bg-surface hover:text-ink'
                    }`}
                  >
                    <span>{t(item.key)}</span>
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className="transition-transform duration-150"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, opacity: 0.7 }}
                    />
                  </button>
                  {isExpanded ? (
                    <ul
                      id={accordionId}
                      className="flex flex-col gap-1 pb-3 pl-3 pr-1 pt-1"
                    >
                      {data.items.map((child, idx) => {
                        const Icon = child.icon;
                        return (
                          <li key={`${idx}-${child.title}`}>
                            <Link
                              href={child.href}
                              onClick={() => {
                                setMobileOpen(false);
                                setMobileExpanded(null);
                              }}
                              className="flex items-start gap-3 rounded-sm px-3 py-2 transition-colors duration-150 hover:bg-surface"
                            >
                              <Icon
                                size={18}
                                strokeWidth={1.5}
                                aria-hidden
                                className="mt-1 shrink-0 text-tertiary"
                              />
                              <span className="flex flex-col">
                                <span
                                  className="text-ink"
                                  style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.3 }}
                                >
                                  {child.title}
                                </span>
                                <span
                                  className="text-secondary"
                                  style={{ fontSize: '12px', lineHeight: 1.45 }}
                                >
                                  {child.subtitle}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                      <li>
                        <Link
                          href={data.sidebarCtaHref}
                          onClick={() => {
                            setMobileOpen(false);
                            setMobileExpanded(null);
                          }}
                          className="block rounded-sm px-3 py-2 text-sm font-medium transition-opacity duration-150 hover:opacity-80"
                          style={{ color: 'var(--accent)' }}
                        >
                          {data.sidebarCtaLabel}
                        </Link>
                      </li>
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
