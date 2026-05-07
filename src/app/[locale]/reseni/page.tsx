import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/button';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type SolutionItem = {
  key: string;
  label: string;
  name: string;
  body: string;
  audience: string;
};

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Solutions." pathLabel="/en/reseni" />;
  }
  const t = await getTranslations('reseni');
  const items = t.raw('items') as ReadonlyArray<SolutionItem>;

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
            className="mb-8 text-secondary"
            style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '720px' }}
          >
            {t('hero.subhead')}
          </p>
        </div>
      </section>

      {/* Solution cards */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-6 lg:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.key}
                className="flex flex-col rounded-lg border p-6 md:p-8"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
              >
                <div
                  className="mb-4 font-mono text-xs uppercase text-accent"
                  style={{ letterSpacing: '0.12em' }}
                >
                  {item.label}
                </div>
                <h2
                  className="mb-4 text-ink"
                  style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
                >
                  {item.name}
                </h2>
                <p className="mb-6 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                  {item.body}
                </p>
                <p
                  className="mb-6 flex-1 font-mono text-xs text-tertiary"
                  style={{ letterSpacing: '0.02em', lineHeight: 1.55 }}
                >
                  {item.audience}
                </p>
                <a
                  href="#"
                  className="font-mono text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  Zjistit víc →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
            <p
              className="text-ink"
              style={{ fontSize: 'clamp(20px, 2.4vw, 28px)', lineHeight: 1.3, letterSpacing: '-0.02em', fontWeight: 500, maxWidth: '760px' }}
            >
              {t('ctaLine')}
            </p>
            <div>
              <Button href="/kontakt" variant="primary" size="md" showArrow>
                {t('ctaButton')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
