import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { site } from '@/config/site';
import { metaDescription } from '@/lib/meta';
import { JsonLd } from '@/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/lib/schema';
import { SolutionBody, type SolutionItem } from './solution-body';
import csData from '../../../../../content/cs/strings/common.json';
import enData from '../../../../../content/en/strings/common.json';

/* ============================================================
   /reseni/[slug] · Solution detail route
   Locale-aware (Vlna 2b-EN parity): slugs are shared 1:1 between
   /cs and /en, item text comes from the matching locale's JSON.
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

const ITEMS_BY_LOCALE: Record<string, ReadonlyArray<SolutionItem>> = {
  cs: csData.reseni.items as ReadonlyArray<SolutionItem>,
  en: enData.reseni.items as ReadonlyArray<SolutionItem>,
};

function itemsFor(locale: string): ReadonlyArray<SolutionItem> {
  return ITEMS_BY_LOCALE[locale] ?? ITEMS_BY_LOCALE.cs;
}

/**
 * Intent-mapped `<title>` per solution (SEO audit P1-20, seo-visibility.md §3,
 * cluster 1 "AI agenti a asistenti pro firmy"). Extends the bare package name
 * with the buyer-intent phrase it should rank for. EN entries serve due-diligence
 * readers, not an SEO investment (vision §10).
 */
const TITLE_INTENT_CS: Readonly<Record<string, string>> = {
  'znalostni-asistent': 'Znalostní asistent nad firemními daty',
  agenti: 'Autonomní AI agenti pro firmy',
  podpora: 'AI podpora zákazníků — chatbot 24/7',
  dashboardy: 'Datové dashboardy — jeden přehled pro firmu',
  infrastruktura: 'AI infrastruktura pro víc AI projektů najednou',
};

const TITLE_INTENT_EN: Readonly<Record<string, string>> = {
  'znalostni-asistent': 'Knowledge Assistant Over Company Data',
  agenti: 'Autonomous AI Agents for Business',
  podpora: 'AI Customer Support — 24/7 Chatbot',
  dashboardy: 'Data Dashboards — One View for Your Business',
  infrastruktura: 'AI Infrastructure for Multiple AI Projects at Once',
};

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
  if (!item) return { title: locale === 'en' ? 'Solutions — VICTA' : 'Řešení — VICTA' };
  const intentTitle =
    (locale === 'en' ? TITLE_INTENT_EN[slug] : TITLE_INTENT_CS[slug]) ?? item.name;
  return {
    title: `${intentTitle} — VICTA`,
    description: metaDescription(item.body),
    alternates: { canonical: `${site.url}/${locale}/reseni/${slug}` },
  };
}

export default async function SolutionDetailPage({ params }: Props) {
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
          { name: tNav('solutions'), url: `${site.url}/${locale}/reseni` },
          { name: item.name, url: `${site.url}/${locale}/reseni/${slug}` },
        ])}
      />
      <SolutionBody item={item} />
    </>
  );
}
