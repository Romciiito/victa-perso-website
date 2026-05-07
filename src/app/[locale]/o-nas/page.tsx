import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type Value = { label: string; body: string };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="About VICTA." pathLabel="/en/o-nas" />;
  }
  const t = await getTranslations('oNas');
  const values = t.raw('sections.values.items') as ReadonlyArray<Value>;

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

      {/* Story */}
      <SectionBlock>
        <Eyebrow>{t('sections.story.label')}</Eyebrow>
        <Headline>{t('sections.story.headline')}</Headline>
        <Body>{t('sections.story.body')}</Body>
      </SectionBlock>

      {/* Values */}
      <SectionBlock surface>
        <Eyebrow>{t('sections.values.label')}</Eyebrow>
        <Headline>{t('sections.values.headline')}</Headline>
        <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-10">
          {values.map((v) => (
            <div key={v.label} className="border-l pl-6" style={{ borderColor: 'var(--accent)' }}>
              <div
                className="mb-3 font-mono text-xs uppercase text-tertiary"
                style={{ letterSpacing: '0.12em' }}
              >
                {v.label}
              </div>
              <p
                className="text-ink"
                style={{ fontSize: '17px', lineHeight: 1.5, fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* Process */}
      <SectionBlock>
        <Eyebrow>{t('sections.process.label')}</Eyebrow>
        <Headline>{t('sections.process.headline')}</Headline>
        <Body>{t('sections.process.body')}</Body>
      </SectionBlock>

      {/* Team placeholder */}
      <SectionBlock surface>
        <Eyebrow>{t('sections.team.label')}</Eyebrow>
        <Headline>{t('sections.team.headline')}</Headline>
        <Body>{t('sections.team.body')}</Body>
      </SectionBlock>

      {/* CTA */}
      <section
        className="px-6 py-20 md:px-12 md:py-32"
        style={{ backgroundColor: 'var(--ink)', color: 'var(--bg)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <h2
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              maxWidth: '760px',
              color: 'var(--bg)',
              marginBottom: '20px',
            }}
          >
            {t('cta.headline')}
          </h2>
          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.55,
              maxWidth: '640px',
              color: 'var(--bg)',
              opacity: 0.85,
              marginBottom: '32px',
            }}
          >
            {t('cta.body')}
          </p>
          <Link
            href="/spoluprace"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors duration-150 hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--ink)',
              letterSpacing: '-0.005em',
            }}
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionBlock({
  children,
  surface = false,
}: {
  children: React.ReactNode;
  surface?: boolean;
}) {
  return (
    <section
      className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24"
      style={{ backgroundColor: surface ? 'var(--surface)' : 'var(--bg)' }}
    >
      <div className="mx-auto w-full max-w-[920px]">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4 font-mono text-xs uppercase text-accent"
      style={{ letterSpacing: '0.12em' }}
    >
      {children}
    </div>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-6 text-ink"
      style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
    >
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-secondary" style={{ fontSize: '17px', lineHeight: 1.6 }}>
      {children}
    </p>
  );
}
