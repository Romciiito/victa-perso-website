import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Blog." pathLabel="/en/blog" />;
  }
  const t = await getTranslations('blog');

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
        </div>
      </section>

      {/* Coming soon */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[920px]">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <article>
              <div
                className="mb-4 font-mono text-xs uppercase text-accent"
                style={{ letterSpacing: '0.12em' }}
              >
                {t('comingSoon.label')}
              </div>
              <h2
                className="mb-4 text-ink"
                style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
              >
                {t('comingSoon.headline')}
              </h2>
              <p className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                {t('comingSoon.body')}
              </p>
            </article>

            <article
              className="rounded-lg border p-6 md:p-8"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <div
                className="mb-4 font-mono text-xs uppercase text-tertiary"
                style={{ letterSpacing: '0.12em' }}
              >
                {t('newsletter.label')}
              </div>
              <h3
                className="mb-4 text-ink"
                style={{ fontSize: '19px', lineHeight: 1.25, letterSpacing: '-0.015em', fontWeight: 500 }}
              >
                {t('newsletter.headline')}
              </h3>
              <p className="mb-6 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                {t('newsletter.body')}
              </p>
              <a
                href="mailto:hello@victaagency.com"
                className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-bg"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--ink)',
                  backgroundColor: 'var(--bg)',
                  letterSpacing: '-0.005em',
                }}
              >
                {t('newsletter.cta')}
                <ArrowRight size={16} aria-hidden />
              </a>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
