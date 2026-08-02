'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';
import { useCalModal } from '@/components/booking/use-cal-modal';
import {
  OFFERING_MAP,
  type OfferingData,
  type OfferingKey,
} from '@/lib/offerings-data';

/* ============================================================
   Nav · D-008 taste-skill aesthetic
   - 3 dropdown triggers (Služby / Řešení / Odvětví) → mega-menu
   - 3 plain links (Spolupráce / O nás / Kontakt)
   - Hover-with-180ms-delay open, 120ms grace on leave, click toggle
   - Mobile: hamburger → accordion drawer
   - Mega-menu panel positioned absolute (does not push page content)
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

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const HOVER_OPEN_DELAY_MS = 180;
const HOVER_CLOSE_GRACE_MS = 120;

export function Nav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const locale = useLocale();
  // usePathname z next-intl vrací cestu BEZ locale prefixu — GA4 source_page
  // taxonomie ale všude jinde používá '/cs/...' (KPI atribuce, vision §2).
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}${pathname === '/' ? '' : pathname}`,
  });
  const [openDropdown, setOpenDropdown] = useState<OfferingKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<OfferingKey | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idPrefix = useId();
  const panelId = `${idPrefix}-megamenu`;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}#`);

  const cancelHover = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const closeDropdown = () => {
    cancelHover();
    setOpenDropdown(null);
  };

  const scheduleOpen = (key: OfferingKey) => {
    cancelHover();
    if (openDropdown && openDropdown !== key) {
      setOpenDropdown(key);
      return;
    }
    hoverTimer.current = setTimeout(() => setOpenDropdown(key), HOVER_OPEN_DELAY_MS);
  };

  const toggleDropdown = (key: OfferingKey) => {
    cancelHover();
    setOpenDropdown((cur) => (cur === key ? null : key));
  };

  // Auto-close on navigation
  useEffect(() => {
    // Deferred via queueMicrotask rather than called synchronously in the
    // effect body — satisfies `react-hooks/set-state-in-effect` (ESLint gate
    // fix, audit Vlna 3A). No behavior change: still fires exactly once per
    // pathname change, a microtask later.
    queueMicrotask(() => {
      closeDropdown();
      setMobileOpen(false);
      setMobileExpanded(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cleanup
  useEffect(() => () => cancelHover(), []);

  // Body scroll lock when mobile drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-md focus:border focus:border-border focus:bg-bg focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-sm"
      >
        {t('skipToContent')}
      </a>

      <div
        className="relative border-b border-border bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] backdrop-blur-xl"
        onMouseLeave={() => {
          cancelHover();
          hoverTimer.current = setTimeout(() => setOpenDropdown(null), HOVER_CLOSE_GRACE_MS);
        }}
        onMouseEnter={cancelHover}
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-6 py-4 md:px-10">
          {/* Logo */}
          <Link href="/" className="inline-flex items-baseline gap-3">
            <span
              className="display text-[20px] font-medium tracking-[-0.02em] text-ink"
              style={{ lineHeight: 1 }}
            >
              VICTA
            </span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-tertiary sm:inline">
              {t('tag')}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.filter((i) => i.kind === 'dropdown').map((item) => {
              if (item.kind !== 'dropdown') return null;
              const isOpen = openDropdown === item.key;
              const active = isActive(item.href);
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
                  className={`tactile relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] ${
                    isOpen || active ? 'bg-surface text-ink' : 'text-secondary hover:bg-surface hover:text-ink'
                  }`}
                >
                  <span>{t(item.key)}</span>
                  <m.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={SPRING}
                    aria-hidden
                    className="inline-flex"
                  >
                    <ChevronDown size={13} strokeWidth={1.75} />
                  </m.span>
                </button>
              );
            })}

            <span aria-hidden className="mx-2 h-4 w-px bg-border" />

            {NAV_ITEMS.filter((i) => i.kind === 'link').map((item) => {
              if (item.kind !== 'link') return null;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`tactile rounded-full px-4 py-2 text-[13.5px] ${
                    active ? 'bg-surface text-ink' : 'text-secondary hover:bg-surface hover:text-ink'
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          {/* Right — locale + CTA + mobile hamburger */}
          <div className="flex items-center gap-2 md:gap-3">
            <LocaleSwitcher />
            <button
              type="button"
              onClick={() => {
                void openCal();
              }}
              className="tactile hidden items-center gap-2 rounded-full border border-accent bg-accent px-5 py-2 text-[13px] font-medium text-bg md:inline-flex"
            >
              Chci konzultaci
              <ArrowUpRight size={14} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={mobileOpen ? t('close') : t('open')}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="tactile grid size-9 place-items-center rounded-full border border-border text-ink hover:border-ink md:hidden"
            >
              {mobileOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
            </button>
          </div>
        </div>

        <MegaMenuPanel
          openKey={openDropdown}
          panelId={panelId}
          onClose={closeDropdown}
        />
      </div>

      <MobileDrawer
        id="mobile-menu"
        open={mobileOpen}
        expanded={mobileExpanded}
        onToggle={(k) => setMobileExpanded((cur) => (cur === k ? null : k))}
        onClose={() => {
          setMobileOpen(false);
          setMobileExpanded(null);
        }}
        onBookCta={openCal}
      />
    </header>
  );
}

/* ------------------------------------------------------------ */
/*  Mega-menu panel · asymmetric, stagger reveal                 */
/* ------------------------------------------------------------ */

function MegaMenuPanel({
  openKey,
  panelId,
  onClose,
}: {
  openKey: OfferingKey | null;
  panelId: string;
  onClose: () => void;
}) {
  const data: OfferingData | null = openKey ? OFFERING_MAP[openKey] : null;

  return (
    <AnimatePresence mode="wait">
      {data && (
        <m.div
          key={openKey}
          id={panelId}
          role="region"
          initial={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
          transition={SPRING}
          className="absolute inset-x-0 top-full z-40 border-t border-b border-border-soft bg-[color-mix(in_oklab,var(--surface)_95%,transparent)] shadow-card backdrop-blur-xl"
        >
          <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-10 px-6 py-12 md:px-10 md:py-14">
            <m.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING, delay: 0.04 }}
              className="col-span-12 md:col-span-4"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-tertiary">
                {data.sidebarHeadline.split(' ')[0]}
              </span>
              <h3 className="display mt-3 max-w-[14ch] text-[clamp(28px,2.6vw,40px)] text-ink">
                {data.sidebarHeadline}
              </h3>
              <p className="mt-3 max-w-[40ch] text-[14.5px] leading-[1.55] text-secondary">
                {data.sidebarDescription}
              </p>
              <Link
                href={data.sidebarCtaHref}
                onClick={onClose}
                className="tactile mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] text-ink hover:border-accent hover:text-accent"
              >
                {data.sidebarCtaLabel}
                <ArrowUpRight size={14} strokeWidth={1.75} />
              </Link>
            </m.div>

            <ul className="col-span-12 grid grid-cols-1 gap-1 md:col-span-8 md:grid-cols-2">
              {data.items.map((item, i) => (
                <MegaItem
                  key={item.title}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  index={i}
                  onClick={onClose}
                />
              ))}
            </ul>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

function MegaItem({
  icon: Icon,
  title,
  subtitle,
  href,
  index,
  onClick,
}: {
  icon: OfferingData['items'][number]['icon'];
  title: string;
  subtitle: string;
  href: string;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(false);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--mx', `${x}%`);
    ref.current?.style.setProperty('--my', `${y}%`);
  }

  return (
    <m.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.06 + index * 0.03 }}
    >
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="spotlight tactile group relative grid grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[12px] p-4 hover:bg-[color-mix(in_oklab,var(--bg)_60%,transparent)]"
      >
        <m.div
          animate={{
            borderColor: hover ? 'var(--accent)' : 'var(--border)',
            color: hover ? 'var(--accent)' : 'var(--ink)',
          }}
          transition={SPRING}
          aria-hidden
          className="grid size-9 place-items-center rounded-md border"
        >
          <Icon size={17} strokeWidth={1.5} />
        </m.div>

        <div className="min-w-0">
          <div className="display text-[15.5px] font-medium leading-tight text-ink">
            {title}
          </div>
          <div className="mt-1 text-[13px] leading-[1.45] text-secondary">
            {subtitle}
          </div>
        </div>

        <m.span
          animate={{ x: hover ? 4 : 0, opacity: hover ? 1 : 0.35 }}
          transition={SPRING}
          aria-hidden
          className="self-center text-tertiary group-hover:text-accent"
        >
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </m.span>
      </Link>
    </m.li>
  );
}

/* ------------------------------------------------------------ */
/*  Mobile drawer                                                */
/* ------------------------------------------------------------ */

function MobileDrawer({
  id,
  open,
  expanded,
  onToggle,
  onClose,
  onBookCta,
}: {
  id: string;
  open: boolean;
  expanded: OfferingKey | null;
  onToggle: (k: OfferingKey) => void;
  onClose: () => void;
  onBookCta: () => void | Promise<void>;
}) {
  const t = useTranslations('nav');

  return (
    <AnimatePresence>
      {open && (
        <m.nav
          id={id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={SPRING}
          className="border-t border-border bg-bg md:hidden"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <ul className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-6 py-4">
            {NAV_ITEMS.map((item) => {
              if (item.kind === 'link') {
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block rounded-md px-3 py-3.5 text-[16px] text-secondary hover:bg-surface hover:text-ink"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              }

              const data = OFFERING_MAP[item.key];
              const isExpanded = expanded === item.key;
              return (
                <li key={item.key} className="border-b border-border-soft last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => onToggle(item.key)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3.5 text-[16px] text-ink"
                  >
                    <span>{t(item.key)}</span>
                    <m.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={SPRING}
                      aria-hidden
                      className="inline-flex text-tertiary"
                    >
                      <ChevronDown size={16} strokeWidth={1.75} />
                    </m.span>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <m.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SPRING}
                        className="overflow-hidden pb-3 pl-3 pr-1"
                      >
                        {data.items.map((child, idx) => {
                          const Icon = child.icon;
                          return (
                            <li key={`${idx}-${child.title}`}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-surface"
                              >
                                <Icon
                                  size={17}
                                  strokeWidth={1.5}
                                  aria-hidden
                                  className="mt-1 shrink-0 text-tertiary"
                                />
                                <span className="flex flex-col">
                                  <span className="text-[14.5px] font-medium leading-tight text-ink">
                                    {child.title}
                                  </span>
                                  <span className="text-[12.5px] leading-[1.45] text-secondary">
                                    {child.subtitle}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                        <li className="mt-2">
                          <Link
                            href={data.sidebarCtaHref}
                            onClick={onClose}
                            className="block rounded-md px-3 py-2 text-[13.5px] text-accent"
                          >
                            {data.sidebarCtaLabel}
                          </Link>
                        </li>
                      </m.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}

            <li className="mt-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  void onBookCta();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-accent bg-accent px-5 py-3 text-[14px] text-bg"
              >
                Chci konzultaci
                <ArrowUpRight size={15} strokeWidth={1.75} />
              </button>
            </li>
          </ul>
        </m.nav>
      )}
    </AnimatePresence>
  );
}
