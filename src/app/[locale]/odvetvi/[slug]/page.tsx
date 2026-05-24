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

  return (
    <DetailPageTemplate
      eyebrow={`Odvětví · ${industry.name}`}
      title={industry.name}
      description={industry.body}
      sections={[]}
    />
  );
}

export const dynamicParams = false;
