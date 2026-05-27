import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { ServiceBody, type ServiceDetailItem } from './service-body';
import data from '../../../../../content/cs/strings/common.json';

/* ============================================================
   /cs/sluzby/[slug] · Service detail route
   Flat slug namespace (all 18 services from 3 categories under
   one /sluzby/ prefix). categorySlug preserved on each item for
   breadcrumb context.
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

// Flatten all services from 3 categories into a single array.
const ITEMS: ReadonlyArray<ServiceDetailItem> = (
  Object.values(data.sluzby.categories) as ReadonlyArray<{
    label: string;
    items: ReadonlyArray<ServiceDetailItem>;
  }>
).flatMap((cat) => cat.items.map((it) => ({ ...it, categoryLabel: cat.label })));

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of ['cs', 'en']) {
    for (const it of ITEMS) {
      params.push({ locale, slug: it.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) return { title: 'Služby — VICTA' };
  return {
    title: `${item.name} — VICTA`,
    description: item.desc,
    alternates: { canonical: `https://victaagency.com/${locale}/sluzby/${slug}` },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) notFound();

  if (locale === 'en') {
    return (
      <EnglishStub
        title={`Service — ${item.name}`}
        pathLabel={`/en/sluzby/${slug}`}
      />
    );
  }

  return <ServiceBody item={item} />;
}
