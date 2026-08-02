import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { site } from '@/config/site';
import { SolutionBody, type SolutionItem } from './solution-body';
import data from '../../../../../content/cs/strings/common.json';

/* ============================================================
   /cs/reseni/[slug] · Solution detail route
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

const ITEMS = data.reseni.items as ReadonlyArray<SolutionItem>;

/**
 * Intent-mapped `<title>` per solution (SEO audit P1-20, seo-visibility.md §3,
 * cluster 1 "AI agenti a asistenti pro firmy"). Extends the bare package name
 * with the buyer-intent phrase it should rank for.
 */
const TITLE_INTENT: Readonly<Record<string, string>> = {
  'znalostni-asistent': 'Znalostní asistent nad firemními daty',
  agenti: 'Autonomní AI agenti pro firmy',
  podpora: 'AI podpora zákazníků — chatbot 24/7',
  dashboardy: 'Datové dashboardy — jeden přehled pro firmu',
  infrastruktura: 'AI infrastruktura pro víc AI projektů najednou',
};

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
  const intentTitle = TITLE_INTENT[slug] ?? item.name;
  return {
    title: `${intentTitle} — VICTA`,
    description: item.body,
    alternates: { canonical: `${site.url}/${locale}/reseni/${slug}` },
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
