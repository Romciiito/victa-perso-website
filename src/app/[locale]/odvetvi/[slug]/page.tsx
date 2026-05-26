import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { IndustryBody, type IndustryItem } from './industry-body';
import data from '../../../../../content/cs/strings/common.json';

/* ============================================================
   /cs/odvetvi/[slug] · Industry detail route
   Reads odvetvi.items from CS translations (single source).
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

const ITEMS = data.odvetvi.items as ReadonlyArray<IndustryItem>;

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
  if (!item) return { title: 'Odvětví — VICTA' };
  return {
    title: `${item.name} — VICTA`,
    description: item.body,
    alternates: { canonical: `https://victaagency.com/${locale}/odvetvi/${slug}` },
  };
}

export default async function IndustryDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) notFound();

  if (locale === 'en') {
    return (
      <EnglishStub
        title={`Industry — ${item.name}`}
        pathLabel={`/en/odvetvi/${slug}`}
      />
    );
  }

  return <IndustryBody item={item} />;
}
