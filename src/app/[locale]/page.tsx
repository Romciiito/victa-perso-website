import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { StatusLine } from '@/components/status-line';
import { HomeBody } from './home-body';

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') return <EnglishStub />;
  return <HomeBody />;
}

/* ============================================================
   ENGLISH STUB
   ============================================================ */
async function EnglishStub() {
  const t = await getTranslations('home');
  return (
    <section className="relative px-6 pb-24 pt-16 md:px-12 md:pb-32 md:pt-24">
      <div className="mx-auto w-full max-w-[920px]">
        <div className="mb-8">
          <StatusLine>{t('hero.status')}</StatusLine>
        </div>
        <p
          className="mb-4 font-mono text-xs uppercase text-tertiary"
          style={{ letterSpacing: '0.12em' }}
        >
          {t('stub.label')}
        </p>
        <h1
          className="mb-6 text-ink"
          style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 1.04,
            letterSpacing: '-0.04em',
            fontWeight: 500,
          }}
        >
          {t('hero.headline')}
        </h1>
        <p
          className="mb-10 text-secondary"
          style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '640px' }}
        >
          {t('hero.subhead')}
        </p>

        <div
          className="my-12 rounded-card border p-8 md:p-10"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2
            className="mb-4 text-ink"
            style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
          >
            {t('stub.headline')}
          </h2>
          <p className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
            {t('stub.body')}
          </p>
        </div>

        <div className="mb-12">
          <h2
            className="mb-4 text-ink"
            style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
          >
            {t('stub.contactHeadline')}
          </h2>
          <p className="mb-6 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
            {t('stub.body')}
          </p>
          <a
            href={`mailto:${t('stub.email')}`}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors duration-150 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              letterSpacing: '-0.005em',
            }}
          >
            {t('stub.email')}
            <ArrowRight size={16} aria-hidden />
          </a>
        </div>

        <p className="font-mono text-sm">
          <Link
            href="/"
            locale="cs"
            className="text-accent"
            style={{ borderBottom: '1px solid var(--accent)', paddingBottom: '2px', color: 'var(--accent)' }}
          >
            {t('stub.fullCs')}
          </Link>
        </p>
      </div>
    </section>
  );
}
