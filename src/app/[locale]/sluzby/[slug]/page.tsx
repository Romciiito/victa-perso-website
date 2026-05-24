import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { DetailPageTemplate } from '@/components/detail-page-template';
import {
  getAllServiceSlugs,
  getServiceBySlug,
  getServiceCategories,
} from '@/lib/content';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/* ============================================================
   /[locale]/sluzby/[slug] — Service detail page
   SSG: 18 services × 2 locales generated at build time.
   English currently 404s for all detail slugs (EN stub policy).
   ============================================================ */

export function generateStaticParams() {
  // Czech: all 18 slugs. English: empty (EN stub at /en/sluzby/ only).
  const csSlugs = getAllServiceSlugs();
  return csSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== 'cs') {
    return { title: 'VICTA — Service detail' };
  }
  const service = getServiceBySlug(slug);
  if (!service) {
    return { title: 'VICTA — stránka nenalezena' };
  }
  return {
    title: `${service.name} — VICTA`,
    description: service.desc.slice(0, 158),
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // EN currently returns 404 for detail slugs (EN stub serves only /en/)
  if (locale !== 'cs') {
    notFound();
  }

  const service = getServiceBySlug(slug);
  if (!service) {
    notFound();
  }

  // Lookup category label for eyebrow breadcrumb
  const category = getServiceCategories().find((c) => c.key === service.categorySlug);
  const eyebrow = category ? `Služby · ${category.label}` : 'Služby';

  return (
    <DetailPageTemplate
      eyebrow={eyebrow}
      title={service.name}
      description={service.desc}
      fit={service.fit}
      sections={[]}
      faq={service.faq}
    />
  );
}

export const dynamicParams = false;
