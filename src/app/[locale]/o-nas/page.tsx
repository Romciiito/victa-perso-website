import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/button';
import { Eyebrow } from '@/components/eyebrow';
import { EditorialSplit } from '@/components/editorial-split';
import { BentoShell, BentoCard } from '@/components/bento';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type Value = { label: string; body: string };
type Step = { label: string; title: string; body: string };

/* ============================================================
   /[locale]/o-nas — About page (D-008)
   Per spec §5: Editorial Split intro + masonry hodnoty + process
   timeline; team section = stub (SC-14 sequencing rule).
   ============================================================ */

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="About VICTA." pathLabel="/en/o-nas" />;
  }
  const t = await getTranslations('oNas');
  const values = t.raw('sections.values.items') as ReadonlyArray<Value>;
  const steps = t.raw('sections.process.steps') as ReadonlyArray<Step>;

  return (
    <>
      {/* HERO — Editorial Split */}
      <EditorialSplit
        padding="hero"
        left={
          <>
            <Eyebrow>{t('hero.status')}</Eyebrow>
            <h1
              className="text-ink"
              style={{
                fontSize: 'clamp(52px, 7vw, 96px)',
                lineHeight: 0.96,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                maxWidth: '14ch',
              }}
            >
              {t('hero.headline')}
            </h1>
            <p
              style={{
                fontSize: '19px',
                lineHeight: 1.55,
                color: 'var(--ink-muted)',
                maxWidth: '52ch',
              }}
            >
              {t('hero.subhead')}
            </p>
            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              <Button href="/spoluprace" variant="primary" size="md">
                {t('cta.button').replace(/\s*→\s*$/, '')}
              </Button>
              <Button href="/kontakt" variant="ghost" size="md">
                Kontakt
              </Button>
            </div>
          </>
        }
        right={
          <BentoShell>
            <BentoCard padding="loose">
              <div
                className="font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--accent)' }}
              >
                {t('hero.statLabel')}
              </div>
              <div
                style={{
                  fontSize: 'clamp(36px, 4vw, 56px)',
                  fontWeight: 500,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: 'var(--ink)',
                }}
              >
                {t('hero.statValue')}
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
                {t('hero.statNote')}
              </p>
            </BentoCard>
          </BentoShell>
        }
      />

      {/* STORY — Editorial Split (text left + principle right) */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-12 md:grid-cols-[1.05fr_1fr] md:gap-16">
            <div>
              <div
                className="mb-4 font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--accent)' }}
              >
                {t('sections.story.label')}
              </div>
              <h2
                className="mb-6"
                style={{
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  lineHeight: 1.04,
                  letterSpacing: '-0.045em',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  maxWidth: '20ch',
                }}
              >
                {t('sections.story.headline')}
              </h2>
              <p
                style={{
                  fontSize: '17px',
                  lineHeight: 1.65,
                  color: 'var(--ink-muted)',
                  maxWidth: '60ch',
                }}
              >
                {t('sections.story.body')}
              </p>
            </div>
            <div className="grid content-center">
              <BentoShell>
                <BentoCard padding="loose">
                  <div
                    className="font-mono uppercase"
                    style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
                  >
                    {t('sections.story.principleLabel')}
                  </div>
                  <p
                    style={{
                      fontSize: '18px',
                      lineHeight: 1.45,
                      letterSpacing: '-0.015em',
                      color: 'var(--ink)',
                      fontWeight: 500,
                    }}
                  >
                    {t('sections.story.principleBody')}
                  </p>
                </BentoCard>
              </BentoShell>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES — bento grid */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px] md:mb-16">
            <div
              className="mb-4 font-mono uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--accent)' }}
            >
              {t('sections.values.label')}
            </div>
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 56px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                color: 'var(--ink)',
                maxWidth: '22ch',
              }}
            >
              {t('sections.values.headline')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {values.map((v) => (
              <BentoShell key={v.label}>
                <BentoCard padding="loose">
                  <div
                    className="font-mono uppercase"
                    style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--accent)' }}
                  >
                    {v.label}
                  </div>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: 1.6,
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {v.body}
                  </p>
                </BentoCard>
              </BentoShell>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS — numbered step timeline */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="mb-12 md:mb-16">
            <div
              className="mb-4 font-mono uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--accent)' }}
            >
              {t('sections.process.label')}
            </div>
            <h2
              className="mb-4"
              style={{
                fontSize: 'clamp(32px, 4vw, 56px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                color: 'var(--ink)',
                maxWidth: '22ch',
              }}
            >
              {t('sections.process.headline')}
            </h2>
            <p
              style={{
                fontSize: '19px',
                lineHeight: 1.55,
                color: 'var(--ink-muted)',
                maxWidth: '60ch',
              }}
            >
              {t('sections.process.body')}
            </p>
          </div>

          <ol className="list-none" style={{ display: 'grid', gap: '0' }}>
            {steps.map((step, i) => (
              <li
                key={step.label}
                style={{
                  borderTop: '1px solid var(--line)',
                  borderBottom: i === steps.length - 1 ? '1px solid var(--line)' : undefined,
                }}
              >
                <div
                  className="grid items-start gap-6 py-8 md:grid-cols-[80px_minmax(0,0.9fr)_minmax(0,1.4fr)] md:gap-10"
                >
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '13px',
                      color: 'var(--ink-soft)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div
                      className="mb-2 font-mono uppercase"
                      style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--accent)' }}
                    >
                      {step.label}
                    </div>
                    <h3
                      style={{
                        fontSize: '24px',
                        lineHeight: 1.2,
                        letterSpacing: '-0.025em',
                        fontWeight: 500,
                        color: 'var(--ink)',
                      }}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: 1.6,
                      color: 'var(--ink-muted)',
                      maxWidth: '60ch',
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TEAM — stub per SC-14 sequencing rule */}
      <section
        id="tym"
        className="scroll-mt-32 relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[920px]">
          <div className="grid gap-8">
            <div
              className="font-mono uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--accent)' }}
            >
              {t('sections.team.label')}
            </div>
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 56px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                color: 'var(--ink)',
                maxWidth: '20ch',
              }}
            >
              {t('sections.team.headline')}
            </h2>
            <BentoShell>
              <BentoCard padding="loose">
                <div
                  className="font-mono uppercase"
                  style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
                >
                  Stav · připravujeme
                </div>
                <p
                  style={{
                    fontSize: '17px',
                    lineHeight: 1.65,
                    color: 'var(--ink-muted)',
                    maxWidth: '60ch',
                  }}
                >
                  {t('sections.team.body')}
                </p>
              </BentoCard>
            </BentoShell>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <div>
              <h2
                className="mb-4"
                style={{
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  lineHeight: 1.04,
                  letterSpacing: '-0.045em',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  maxWidth: '22ch',
                }}
              >
                {t('cta.headline')}
              </h2>
              <p
                style={{
                  fontSize: '19px',
                  lineHeight: 1.55,
                  color: 'var(--ink-muted)',
                  maxWidth: '46ch',
                }}
              >
                {t('cta.body')}
              </p>
            </div>
            <Button href="/spoluprace" variant="primary" size="md">
              {t('cta.button').replace(/\s*→\s*$/, '')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
