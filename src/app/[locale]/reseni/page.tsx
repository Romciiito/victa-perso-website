import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/button';
import { Eyebrow } from '@/components/eyebrow';
import { EditorialSplit } from '@/components/editorial-split';
import { BentoShell, BentoCard } from '@/components/bento';
import { EnglishStub } from '@/components/en-stub';
import { Link } from '@/i18n/navigation';
import { getAllSolutions, type Solution } from '@/lib/content';

type Props = { params: Promise<{ locale: string }> };

/* ============================================================
   /[locale]/reseni — Solutions overview page (5 turnkey AI solutions)
   D-008: EditorialSplit hero + 2-col bento grid linking to detail.
   ============================================================ */

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Solutions." pathLabel="/en/reseni" />;
  }
  const t = await getTranslations('reseni');
  const solutions = getAllSolutions();

  return (
    <>
      {/* HERO */}
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
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                maxWidth: '52ch',
              }}
            >
              {t('hero.subhead')}
            </p>

            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              <Button href="/spoluprace#audit" variant="primary" size="md">
                Rezervovat audit
              </Button>
              <Button href="/kontakt" variant="ghost" size="md">
                Domluvit konzultaci
              </Button>
            </div>
          </>
        }
        right={
          <BentoShell>
            <BentoCard padding="loose">
              <div
                className="font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
              >
                Aktuálně k nasazení
              </div>
              <div
                style={{
                  fontSize: 'clamp(48px, 5vw, 72px)',
                  fontWeight: 500,
                  letterSpacing: '-0.045em',
                  lineHeight: 1,
                  color: 'var(--ink)',
                }}
              >
                {solutions.length}
              </div>
              <div style={{ fontSize: '15px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                hotových AI řešení. Každé adaptovatelné na vaši doménu — od znalostní báze po
                autonomní agenty.
              </div>
            </BentoCard>
          </BentoShell>
        }
      />

      {/* Solutions grid */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {solutions.map((sol) => (
              <SolutionCard key={sol.slug} solution={sol} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <p
              style={{
                fontSize: 'clamp(28px, 3vw, 44px)',
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                fontWeight: 600,
                color: 'var(--ink)',
                maxWidth: '28ch',
              }}
            >
              {t('ctaLine')}
            </p>
            <Button href="/kontakt" variant="primary" size="md">
              {t('ctaButton')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SolutionCard({ solution }: { solution: Solution }) {
  return (
    <Link href={`/reseni/${solution.slug}`} className="block">
      <BentoShell>
        <BentoCard padding="loose">
          <div className="flex items-center justify-between">
            <div
              className="font-mono uppercase"
              style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.16em' }}
            >
              {solution.label}
            </div>
            <ArrowRight size={16} weight="light" aria-hidden style={{ color: 'var(--ink-soft)' }} />
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.4vw, 28px)',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              fontWeight: 600,
              color: 'var(--ink)',
              marginTop: '4px',
            }}
          >
            {solution.name}
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--ink-muted)' }}>
            {solution.body}
          </p>
          <p
            className="font-mono"
            style={{
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'var(--ink-soft)',
              letterSpacing: '-0.005em',
              borderTop: '1px solid var(--line)',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            {solution.audience}
          </p>
        </BentoCard>
      </BentoShell>
    </Link>
  );
}
