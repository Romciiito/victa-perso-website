import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  PenNib,
  Robot,
  Scales,
  ChartBar,
  MagnifyingGlass,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/button';
import { Eyebrow } from '@/components/eyebrow';
import { EditorialSplit } from '@/components/editorial-split';
import { BentoShell, BentoCard } from '@/components/bento';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type TopicItem = { label: string; headline: string; body: string };

/* ============================================================
   /[locale]/blog — Blog overview (D-008)
   No posts yet — placeholder layout teasing upcoming topics.
   EditorialSplit hero + BentoShell stat + 4 topic placeholders.
   ============================================================ */

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Blog." pathLabel="/en/blog" />;
  }
  const t = await getTranslations('blog');
  const topicItems = t.raw('topics.items') as ReadonlyArray<TopicItem>;
  // Icons paired with topics by index — see content/cs/strings/common.json `blog.topics.items`.
  const topicIcons = [
    MagnifyingGlass, // AI ROADMAP
    Scales, // AI LEGISLATIVA
    ChartBar, // CASE STUDIES
    Robot, // AEO A SEO
  ];

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
                maxWidth: '12ch',
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
              <Button
                href={`mailto:hello@victaagency.com?subject=${encodeURIComponent('Blog notify')}`}
                variant="primary"
                size="md"
                external
              >
                {t('newsletter.cta')}
              </Button>
            </div>
          </>
        }
        right={
          <BentoShell>
            <BentoCard padding="loose">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <PenNib size={20} weight="light" aria-hidden />
                </span>
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
                >
                  {t('heroStat.label')}
                </span>
              </div>
              <div
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 40px)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.05,
                  color: 'var(--ink)',
                }}
              >
                {t('heroStat.value')}
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
                {t('heroStat.note')}
              </p>
            </BentoCard>
          </BentoShell>
        }
      />

      {/* COMING SOON intro + TOPICS grid */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          {/* Section intro */}
          <div className="mb-12 max-w-[760px] md:mb-16">
            <div
              className="mb-4 font-mono uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--accent)' }}
            >
              {t('topics.label')}
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
              {t('topics.headline')}
            </h2>
            <p style={{ fontSize: '19px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
              {t('topics.intro')}
            </p>
          </div>

          {/* Topics grid — 4 placeholder cards (2-col on md, 1-col on mobile) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {topicItems.map((item, i) => {
              const Icon = topicIcons[i] ?? PenNib;
              return (
                <BentoShell key={item.label}>
                  <BentoCard padding="loose">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        <Icon size={20} weight="light" aria-hidden />
                      </span>
                      <span
                        className="font-mono uppercase"
                        style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '20px',
                        lineHeight: 1.25,
                        letterSpacing: '-0.02em',
                        fontWeight: 500,
                        color: 'var(--ink)',
                      }}
                    >
                      {item.headline}
                    </h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
                      {item.body}
                    </p>
                  </BentoCard>
                </BentoShell>
              );
            })}
          </div>

          {/* Coming-soon note */}
          <div className="mt-12 md:mt-16">
            <p
              className="max-w-[60ch]"
              style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--ink-muted)' }}
            >
              {t('comingSoon.body')}
            </p>
          </div>
        </div>
      </section>

      {/* NEWSLETTER CTA — bottom */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[920px]">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <div>
              <div
                className="mb-4 font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--ink-soft)' }}
              >
                {t('newsletter.label')}
              </div>
              <h2
                className="mb-4"
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 48px)',
                  lineHeight: 1.06,
                  letterSpacing: '-0.04em',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  maxWidth: '22ch',
                }}
              >
                {t('newsletter.headline')}
              </h2>
              <p
                style={{
                  fontSize: '17px',
                  lineHeight: 1.55,
                  color: 'var(--ink-muted)',
                  maxWidth: '60ch',
                }}
              >
                {t('newsletter.body')}
              </p>
            </div>
            <Button
              href="mailto:hello@victaagency.com"
              variant="primary"
              size="md"
              external
            >
              {t('newsletter.cta')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
