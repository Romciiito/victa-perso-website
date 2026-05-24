import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { DetailPageTemplate } from '@/components/detail-page-template';
import { getAllSolutionSlugs, getSolutionBySlug } from '@/lib/content';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/* ============================================================
   /[locale]/reseni/[slug] — Solution detail page
   SSG: 5 solutions × CS generated at build time.
   ============================================================ */

export function generateStaticParams() {
  const csSlugs = getAllSolutionSlugs();
  return csSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== 'cs') {
    return { title: 'VICTA — Solution detail' };
  }
  const solution = getSolutionBySlug(slug);
  if (!solution) {
    return { title: 'VICTA — stránka nenalezena' };
  }
  return {
    title: `${solution.name} — VICTA`,
    description: solution.body.slice(0, 158),
  };
}

export default async function SolutionDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (locale !== 'cs') {
    notFound();
  }

  const solution = getSolutionBySlug(slug);
  if (!solution) {
    notFound();
  }

  return (
    <DetailPageTemplate
      eyebrow={`Řešení · ${solution.label}`}
      title={solution.name}
      description={solution.body}
      fit={solution.audience}
      sections={[]}
    />
  );
}

export const dynamicParams = false;
