import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type FooterLink = { href: string; key: string };

const SERVICES: ReadonlyArray<FooterLink> = [
  { href: '/sluzby', key: 'webDevelopment' },
  { href: '/sluzby', key: 'aiChatbots' },
  { href: '/sluzby', key: 'aiAutomation' },
  { href: '/sluzby', key: 'seoAeo' },
  { href: '/sluzby', key: 'ppc' },
  { href: '/spoluprace', key: 'audit' },
];

const COMPANY: ReadonlyArray<FooterLink> = [
  { href: '/spoluprace', key: 'collaboration' },
  { href: '/o-nas', key: 'about' },
  { href: '/kontakt', key: 'contact' },
  { href: '/blog', key: 'blog' },
];

const LEGAL: ReadonlyArray<FooterLink> = [
  { href: '/ochrana-soukromi', key: 'privacy' },
  { href: '/cookies', key: 'cookies' },
];

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer
      className="relative border-t border-border-soft px-6 py-16 md:px-12 md:pb-8 md:pt-16"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Top grid */}
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12">
          {/* Brand */}
          <div>
            <div className="mb-2 text-lg font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
              VICTA
            </div>
            <p className="mb-4 max-w-[320px] text-sm leading-[1.6] text-secondary">{t('tagline')}</p>
            <div className="font-mono text-xs text-tertiary">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block size-[6px] rounded-full"
                  style={{ backgroundColor: 'var(--success)' }}
                />
                {t('status')}
              </span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-tertiary">
              {t('servicesHeading')}
            </h4>
            <ul className="flex flex-col gap-2">
              {SERVICES.map((item, i) => (
                <li key={`${item.key}-${i}`}>
                  <Link
                    href={item.href}
                    className="text-sm text-secondary transition-colors duration-150 hover:text-ink"
                  >
                    {t(`links.${item.key}` as 'links.webDevelopment')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-tertiary">
              {t('companyHeading')}
            </h4>
            <ul className="flex flex-col gap-2">
              {COMPANY.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-secondary transition-colors duration-150 hover:text-ink"
                  >
                    {t(`links.${item.key}` as 'links.collaboration')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-tertiary">
              {t('legalHeading')}
            </h4>
            <ul className="flex flex-col gap-2">
              {LEGAL.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-secondary transition-colors duration-150 hover:text-ink"
                  >
                    {t(`links.${item.key}` as 'links.privacy')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border-soft pt-6">
          <p className="flex flex-wrap justify-between gap-4 font-mono text-xs text-tertiary">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{t('bottom.copyright')}</span>
              <span aria-hidden>·</span>
              <span>{t('bottom.ico')}</span>
              <span aria-hidden>·</span>
              <span>{t('bottom.city')}</span>
              <span aria-hidden>·</span>
              <span>{t('bottom.country')}</span>
            </span>
            <span>v 0.1.0 · 2026-05-07</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
