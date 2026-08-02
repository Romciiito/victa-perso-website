import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { site } from '@/config/site';
import { metaDescription } from '@/lib/meta';
import { JsonLd } from '@/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema';
import { IndustryBody, type IndustryItem } from './industry-body';
import csData from '../../../../../content/cs/strings/common.json';
import enData from '../../../../../content/en/strings/common.json';

/* ============================================================
   /odvetvi/[slug] · Industry detail route
   Locale-aware (Vlna 2b-EN parity): slugs are shared 1:1 between
   /cs and /en, item text (incl. problem/approach/process) comes
   from the matching locale's JSON.
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

const ITEMS_BY_LOCALE: Record<string, ReadonlyArray<IndustryItem>> = {
  cs: csData.odvetvi.items as ReadonlyArray<IndustryItem>,
  en: enData.odvetvi.items as ReadonlyArray<IndustryItem>,
};

function itemsFor(locale: string): ReadonlyArray<IndustryItem> {
  return ITEMS_BY_LOCALE[locale] ?? ITEMS_BY_LOCALE.cs;
}

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of ['cs', 'en']) {
    for (const it of ITEMS_BY_LOCALE.cs) {
      params.push({ locale, slug: it.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const item = itemsFor(locale).find((i) => i.slug === slug);
  if (!item) return { title: locale === 'en' ? 'Industries — VICTA' : 'Odvětví — VICTA' };
  return {
    title: `${item.name} — VICTA`,
    description: metaDescription(item.body),
    alternates: { canonical: `${site.url}/${locale}/odvetvi/${slug}` },
  };
}

export default async function IndustryDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = itemsFor(locale).find((i) => i.slug === slug);
  if (!item) notFound();

  const t = await getTranslations({ locale, namespace: 'common' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: t('breadcrumbHome'), url: `${site.url}/${locale}` },
          { name: tNav('industries'), url: `${site.url}/${locale}/odvetvi` },
          { name: item.name, url: `${site.url}/${locale}/odvetvi/${slug}` },
        ])}
      />
      <IndustryBody item={item} />
    </>
  );
}
