import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/button';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type ServiceItem = { name: string; desc: string };
type Category = {
  label: string;
  intro: string;
  items: ReadonlyArray<ServiceItem>;
};

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Services." pathLabel="/en/sluzby" />;
  }
  const t = await getTranslations('sluzby');
  const tRaw = (k: string) => t.raw(k) as unknown;

  const itDev = tRaw('categories.itDev') as Category;
  const aiData = tRaw('categories.aiData') as Category;
  const marketing = tRaw('categories.marketing') as Category;

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
              maxWidth: '720px',
            }}
          >
            {t('hero.headline')}
          </h1>
          <p
            className="mb-8 text-secondary"
            style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '720px' }}
          >
            {t('hero.subhead')}
          </p>
          <nav className="flex flex-wrap gap-3 text-sm">
            <a href="#it-vyvoj" className="rounded-md border border-border px-4 py-2 text-ink transition-colors duration-150 hover:bg-surface">
              {itDev.label}
            </a>
            <a href="#ai-data" className="rounded-md border border-border px-4 py-2 text-ink transition-colors duration-150 hover:bg-surface">
              {aiData.label}
            </a>
            <a href="#marketing" className="rounded-md border border-border px-4 py-2 text-ink transition-colors duration-150 hover:bg-surface">
              {marketing.label}
            </a>
          </nav>
        </div>
      </section>

      <CategorySection id="it-vyvoj" category={itDev} />
      <CategorySection id="ai-data" category={aiData} surface />
      <CategorySection id="marketing" category={marketing} />

      {/* CTA */}
      <section
        className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
            <h2
              className="text-ink"
              style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500, maxWidth: '720px' }}
            >
              {t('ctaLine')}
            </h2>
            <div>
              <Button href="/spoluprace" variant="primary" size="md" showArrow>
                {t('ctaButton')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CategorySection({
  id,
  category,
  surface = false,
}: {
  id: string;
  category: Category;
  surface?: boolean;
}) {
  return (
    <section
      id={id}
      className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24"
      style={{ backgroundColor: surface ? 'var(--surface)' : 'var(--bg)' }}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-12 max-w-[760px]">
          <div
            className="mb-4 font-mono text-xs uppercase text-accent"
            style={{ letterSpacing: '0.12em' }}
          >
            {category.label}
          </div>
          <p className="text-secondary" style={{ fontSize: '19px', lineHeight: 1.55 }}>
            {category.intro}
          </p>
        </div>
        <div
          className="grid grid-cols-1 overflow-hidden rounded-lg border-l border-t md:grid-cols-2 lg:grid-cols-3"
          style={{ borderColor: 'var(--border)' }}
        >
          {category.items.map((item, i) => (
            <article
              key={`${i}-${item.name}`}
              className="border-b border-r p-6 transition-colors duration-150 hover:bg-bg md:p-8"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: surface ? 'var(--bg)' : 'var(--surface)',
              }}
            >
              <div
                className="mb-3 font-mono text-xs text-tertiary"
                style={{ letterSpacing: '0.04em' }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3
                className="mb-3 text-ink"
                style={{ fontSize: '19px', lineHeight: 1.25, letterSpacing: '-0.015em', fontWeight: 500 }}
              >
                {item.name}
              </h3>
              <p className="mb-6 text-secondary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                {item.desc}
              </p>
              <a
                href="#"
                className="font-mono text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                Detail →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
