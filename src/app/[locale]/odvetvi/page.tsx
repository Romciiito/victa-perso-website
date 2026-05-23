import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  ShoppingCart,
  Factory,
  Truck,
  Briefcase,
  Landmark,
  Zap,
  Stethoscope,
  HeartPulse,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type FaqItem = { q: string; a: string };
type IndustryItem = {
  key: string;
  icon: keyof typeof iconMap;
  name: string;
  intro: string;
  useCases?: ReadonlyArray<string>;
  targetClients?: string;
  faq?: ReadonlyArray<FaqItem>;
};

const iconMap = {
  ShoppingCart,
  Factory,
  Truck,
  Briefcase,
  Landmark,
  Zap,
  Stethoscope,
  HeartPulse,
  Headphones,
} satisfies Record<string, LucideIcon>;

export default async function IndustriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Industries." pathLabel="/en/odvetvi" />;
  }
  const t = await getTranslations('odvetvi');
  const items = t.raw('items') as ReadonlyArray<IndustryItem>;

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pb-12 pt-16 md:px-12 md:pb-16 md:pt-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-8">
            <StatusLine>{t('hero.status')}</StatusLine>
          </div>
          <h1
            className="mb-6 text-ink"
            style={{
              fontSize: 'clamp(48px, 6vw, 80px)',
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              maxWidth: '920px',
            }}
          >
            {t('hero.headline')}
          </h1>
          <p
            className="mb-6 text-secondary"
            style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '720px' }}
          >
            {t('hero.subhead')}
          </p>
          <p className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.6, maxWidth: '720px' }}>
            {t('intro')}
          </p>
        </div>
      </section>

      {/* Industries grid */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div
            className="grid grid-cols-1 overflow-hidden rounded-lg border-l border-t md:grid-cols-2 lg:grid-cols-3"
            style={{ borderColor: 'var(--border)' }}
          >
            {items.map((item) => {
              const Icon = iconMap[item.icon] ?? Briefcase;
              return (
                <article
                  key={item.key}
                  id={item.key}
                  className="flex flex-col border-b border-r p-6 transition-colors duration-150 md:p-8"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
                >
                  <div
                    className="mb-6 flex size-12 items-center justify-center rounded-md"
                    style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    <Icon size={20} aria-hidden />
                  </div>
                  <h2
                    className="mb-3 text-ink"
                    style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
                  >
                    {item.name}
                  </h2>
                  <p className="mb-4 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                    {item.intro}
                  </p>
                  {item.useCases && item.useCases.length > 0 && (
                    <ul
                      className="mb-4 flex-1 space-y-2 text-secondary"
                      style={{ fontSize: '14px', lineHeight: 1.55 }}
                    >
                      {item.useCases.map((uc, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span
                            aria-hidden
                            style={{ color: 'var(--accent)', flexShrink: 0 }}
                          >
                            ·
                          </span>
                          <span>{uc}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.targetClients && (
                    <p
                      className="mt-auto pt-4 font-mono text-secondary"
                      style={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        borderTop: '1px solid var(--border-soft)',
                      }}
                    >
                      {item.targetClients}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
