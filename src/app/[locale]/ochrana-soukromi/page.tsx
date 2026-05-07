import { setRequestLocale, getTranslations } from 'next-intl/server';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type LegalSection = { heading: string; body: string };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Privacy policy." pathLabel="/en/ochrana-soukromi" />;
  }
  const t = await getTranslations('legal.privacy');
  const sections = t.raw('sections') as ReadonlyArray<LegalSection>;

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pb-12 pt-16 md:px-12 md:pb-16 md:pt-24">
        <div className="mx-auto w-full max-w-[920px]">
          <div className="mb-8">
            <StatusLine>{t('version')}</StatusLine>
          </div>
          <h1
            className="mb-6 text-ink"
            style={{
              fontSize: 'clamp(40px, 5vw, 64px)',
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              fontWeight: 500,
            }}
          >
            {t('title')}
          </h1>
          <div
            className="mb-8 rounded-lg border p-6"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <div
              className="mb-2 font-mono text-xs uppercase text-tertiary"
              style={{ letterSpacing: '0.12em' }}
            >
              {t('noteTitle')}
            </div>
            <p className="text-secondary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
              {t('noteBody')}
            </p>
          </div>
          <p className="text-secondary" style={{ fontSize: '17px', lineHeight: 1.6 }}>
            {t('intro')}
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto w-full max-w-[920px]">
          <div className="space-y-12">
            {sections.map((s) => (
              <article key={s.heading}>
                <h2
                  className="mb-3 text-ink"
                  style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
                >
                  {s.heading}
                </h2>
                <p className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.7 }}>
                  {s.body}
                </p>
              </article>
            ))}
          </div>
          <div
            className="mt-16 rounded-lg border p-6"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <p className="text-secondary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
              {t('fullVersionNote')}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
