import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { DetailPageTemplate } from '@/components/detail-page-template';
import { getAllIndustrySlugs, getIndustryBySlug } from '@/lib/content';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/* ============================================================
   /[locale]/odvetvi/[slug] — Industry detail page
   SSG: 8 industries × CS generated at build time.
   ============================================================ */

export function generateStaticParams() {
  const csSlugs = getAllIndustrySlugs();
  return csSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== 'cs') {
    return { title: 'VICTA — Industry detail' };
  }
  const industry = getIndustryBySlug(slug);
  if (!industry) {
    return { title: 'VICTA — stránka nenalezena' };
  }
  return {
    title: `${industry.name} — VICTA`,
    description: industry.body.slice(0, 158),
  };
}

export default async function IndustryDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (locale !== 'cs') {
    notFound();
  }

  const industry = getIndustryBySlug(slug);
  if (!industry) {
    notFound();
  }

  // Build content sections from industry.sections (PR 6d content)
  const sections = industry.sections
    ? [
        {
          id: 'problem',
          label: 'Problém',
          heading: 'Co řeší.',
          body: industry.sections.problem,
        },
        {
          id: 'approach',
          label: 'Přístup',
          heading: 'Jak to děláme.',
          body: industry.sections.approach,
        },
        {
          id: 'process',
          label: 'Proces',
          heading: 'Krok za krokem.',
          body: (
            <ol className="list-none" style={{ display: 'grid', gap: '24px', maxWidth: '70ch' }}>
              {industry.sections.process.map((step, i) => (
                <li
                  key={step.title}
                  className="grid"
                  style={{ gridTemplateColumns: '48px 1fr', gap: '20px', alignItems: 'start' }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '12px',
                      letterSpacing: '0.06em',
                      color: 'var(--accent)',
                      paddingTop: '6px',
                      borderTop: '2px solid var(--accent)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: '19px',
                        fontWeight: 500,
                        letterSpacing: '-0.015em',
                        lineHeight: 1.3,
                        color: 'var(--ink)',
                        marginBottom: '6px',
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '15px',
                        lineHeight: 1.55,
                        color: 'var(--ink-muted)',
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ),
        },
      ]
    : [];

  return (
    <DetailPageTemplate
      eyebrow={`Odvětví · ${industry.name}`}
      title={industry.name}
      description={industry.body}
      sections={sections}
    />
  );
}

export const dynamicParams = false;
