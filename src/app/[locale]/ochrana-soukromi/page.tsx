import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/eyebrow';
import { BentoShell, BentoCard } from '@/components/bento';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

type LegalSection = { heading: string; body: string };

/* ============================================================
   /[locale]/ochrana-soukromi — Privacy policy (D-008)
   Single column max-w-3xl + sticky TOC right per spec §5.
   All legal text preserved verbatim via t() calls.
   ============================================================ */

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Privacy policy." pathLabel="/en/ochrana-soukromi" />;
  }
  const t = await getTranslations('legal.privacy');
  const sections = t.raw('sections') as ReadonlyArray<LegalSection>;
  const sectionItems = sections.map((s, i) => ({
    id: sectionId(s.heading, i),
    heading: s.heading,
    body: s.body,
  }));

  return (
    <>
      {/* HERO — single column legal layout */}
      <section
        className="relative px-6 pb-12 pt-32 md:px-8 md:pb-16 md:pt-[168px]"
      >
        <div className="mx-auto w-full max-w-[920px] grid gap-8">
          <Eyebrow>{t('version')}</Eyebrow>
          <h1
            className="text-ink"
            style={{
              fontSize: 'clamp(44px, 6vw, 80px)',
              lineHeight: 0.98,
              letterSpacing: '-0.045em',
              fontWeight: 600,
              maxWidth: '18ch',
            }}
          >
            {t('title')}
          </h1>
          <BentoShell>
            <BentoCard padding="loose">
              <div
                className="font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
              >
                {t('noteTitle')}
              </div>
              <p style={{ fontSize: '15px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
                {t('noteBody')}
              </p>
            </BentoCard>
          </BentoShell>
          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.55,
              color: 'var(--ink-muted)',
              maxWidth: '70ch',
            }}
          >
            {t('intro')}
          </p>
        </div>
      </section>

      {/* SECTIONS — single column + sticky TOC right (desktop) */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-16">
            {/* Main content */}
            <div className="grid gap-12">
              {sectionItems.map((s) => (
                <article
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-32"
                >
                  <h2
                    className="mb-4"
                    style={{
                      fontSize: 'clamp(22px, 2.6vw, 30px)',
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.15,
                      color: 'var(--ink)',
                    }}
                  >
                    {s.heading}
                  </h2>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: 1.7,
                      color: 'var(--ink-muted)',
                      maxWidth: '70ch',
                    }}
                  >
                    {s.body}
                  </p>
                </article>
              ))}

              {/* Footer note */}
              <BentoShell>
                <BentoCard padding="loose">
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
                    {t('fullVersionNote')}
                  </p>
                </BentoCard>
              </BentoShell>
            </div>

            {/* Sticky TOC on desktop */}
            <aside className="hidden md:block md:order-last">
              <div className="sticky top-[120px] grid gap-6">
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.16em',
                    color: 'var(--ink-soft)',
                  }}
                >
                  Na této stránce
                </div>
                <nav>
                  <ol className="list-none" style={{ display: 'grid', gap: '10px' }}>
                    {sectionItems.map((s, i) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="block transition-colors duration-200 hover:text-ink"
                          style={{
                            fontSize: '14px',
                            color: 'var(--ink-muted)',
                            letterSpacing: '-0.005em',
                            lineHeight: 1.4,
                          }}
                        >
                          <span
                            className="font-mono"
                            style={{ color: 'var(--ink-soft)', marginRight: '8px' }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {stripNumberPrefix(s.heading)}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

/** Derive stable anchor ID from heading. Headings are numbered ("1. Foo"), so we
 *  use the index as primary key and a tiny slug suffix for human readability. */
function sectionId(heading: string, index: number): string {
  const slug = heading
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/^\d+\.\s*/, '') // drop leading "1. "
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `s-${String(index + 1).padStart(2, '0')}-${slug}`;
}

/** Drop leading "1. " prefix for cleaner TOC labels (the index is already shown). */
function stripNumberPrefix(heading: string): string {
  return heading.replace(/^\d+\.\s*/, '');
}
