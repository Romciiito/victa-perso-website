import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { SolutionBody, type SolutionItem } from './solution-body';
import data from '../../../../../content/cs/strings/common.json';

/* ============================================================
   /cs/reseni/[slug] · Solution detail route
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

const ITEMS = data.reseni.items as ReadonlyArray<SolutionItem>;

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
  if (!item) return { title: 'Řešení — VICTA' };
  return {
    title: `${item.name} — VICTA`,
    description: item.body,
    alternates: { canonical: `https://victaagency.com/${locale}/reseni/${slug}` },
  };
}

export default async function SolutionDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) notFound();

  if (locale === 'en') {
    return (
      <EnglishStub
        title={`Solution — ${item.name}`}
        pathLabel={`/en/reseni/${slug}`}
      />
    );
  }

  return <SolutionBody item={item} />;
}
