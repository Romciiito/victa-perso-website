import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/button';
import { Eyebrow } from '@/components/eyebrow';
import { EditorialSplit } from '@/components/editorial-split';
import { BentoShell, BentoCard } from '@/components/bento';
import { EnglishStub } from '@/components/en-stub';
import { Link } from '@/i18n/navigation';
import { getServiceCategories, type Service, type ServiceCategory } from '@/lib/content';

type Props = { params: Promise<{ locale: string }> };

/* ============================================================
   /[locale]/sluzby — Services overview page
   D-008 refactor: EditorialSplit hero + 3 category sections,
   each with bento grid of items linking to /sluzby/[slug] detail.
   ============================================================ */

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Services." pathLabel="/en/sluzby" />;
  }
  const t = await getTranslations('sluzby');
  const categories = getServiceCategories();

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
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                maxWidth: '52ch',
              }}
            >
              {t('hero.subhead')}
            </p>

            {/* Category jump nav — anchor pills */}
            <nav className="flex flex-wrap" style={{ gap: '8px' }}>
              {categories.map((cat) => (
                <a
                  key={cat.key}
                  href={`#${cat.key}`}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-200"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  <span className="font-mono" style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>
                    {cat.label.split(' ')[0]}
                  </span>
                  <span style={{ borderLeft: '1px solid var(--line)', height: '14px' }} />
                  <span>{cat.items.length} {cat.items.length < 5 ? 'služeb' : 'služeb'}</span>
                </a>
              ))}
            </nav>
          </>
        }
        right={
          <BentoShell>
            <BentoCard padding="loose">
              <div
                className="font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
              >
                Aktuálně nabízíme
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
                {categories.reduce((sum, c) => sum + c.items.length, 0)}
              </div>
              <div style={{ fontSize: '15px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                služeb napříč 3 oblastmi — IT vývoj, AI & data, marketing. Každá modulární, lze kombinovat.
              </div>
            </BentoCard>
          </BentoShell>
        }
      />

      {/* Category sections */}
      {categories.map((cat) => (
        <CategorySection key={cat.key} category={cat} />
      ))}

      {/* Bottom CTA */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 56px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                color: 'var(--ink)',
                maxWidth: '24ch',
              }}
            >
              {t('ctaLine')}
            </h2>
            <Button href="/spoluprace" variant="primary" size="md">
              {t('ctaButton')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   CategorySection — single category block with bento grid
   ============================================================ */
function CategorySection({ category }: { category: ServiceCategory }) {
  return (
    <section
      id={category.key}
      className="scroll-mt-32 relative px-6 py-24 md:px-8 md:py-32"
      style={{ borderTop: '1px solid var(--line)' }}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-12 max-w-[760px]">
          <div
            className="mb-4 font-mono uppercase"
            style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--accent)' }}
          >
            {category.label}
          </div>
          <p style={{ fontSize: '19px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
            {category.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {category.items.map((item, i) => (
            <ServiceItemCard key={item.slug} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   ServiceItemCard — single service in the category grid
   Links to /sluzby/[slug] detail page.
   ============================================================ */
function ServiceItemCard({ item, index }: { item: Service; index: number }) {
  return (
    <Link href={`/sluzby/${item.slug}`} className="block">
      <BentoShell>
        <BentoCard padding="standard">
          <div className="flex items-center justify-between">
            <div
              className="font-mono"
              style={{ fontSize: '11px', color: 'var(--ink-soft)', letterSpacing: '0.04em' }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
            <ArrowRight
              size={14}
              weight="light"
              aria-hidden
              style={{ color: 'var(--ink-soft)' }}
            />
          </div>
          <h3
            style={{
              fontSize: '17px',
              lineHeight: 1.25,
              letterSpacing: '-0.015em',
              fontWeight: 500,
              color: 'var(--ink)',
              marginTop: '8px',
            }}
          >
            {item.name}
          </h3>
          <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
            {item.desc.length > 140 ? item.desc.slice(0, 137) + '…' : item.desc}
          </p>
        </BentoCard>
      </BentoShell>
    </Link>
  );
}
