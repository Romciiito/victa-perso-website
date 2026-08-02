import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { site } from '@/config/site';
import { metaDescription } from '@/lib/meta';
import { ServiceBody, type ServiceDetailItem } from './service-body';
import data from '../../../../../content/cs/strings/common.json';

/* ============================================================
   /cs/sluzby/[slug] · Service detail route
   Flat slug namespace (all 18 services from 3 categories under
   one /sluzby/ prefix). categorySlug preserved on each item for
   breadcrumb context.
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Intent-mapped `<title>` per service (SEO audit P1-20, seo-visibility.md §3).
 * `${item.name} — VICTA` alone doesn't match what people actually search —
 * each entry below extends the bare service name with the buyer intent /
 * cluster keyword it should rank for. Falls back to the mechanical pattern
 * for any slug not (yet) mapped.
 */
const TITLE_INTENT: Readonly<Record<string, string>> = {
  'weby-na-miru': 'Web na míru pro firmy — vývoj a SEO',
  'e-shopy-na-miru': 'E-shop na míru — Shopify Plus a Medusa.js',
  'prezentacni-weby-a-microsite': 'Prezentační web a microsite pro kampaně',
  'sprava-webu-a-e-shopu': 'Správa a údržba webu nebo e-shopu',
  'integrace-systemu': 'Integrace ERP a CRM systémů pro firmy',
  'webove-aplikace-a-custom-vyvoj': 'Webové aplikace a custom vývoj na míru',
  'ai-chatboti': 'AI chatboti napojení na vaše systémy',
  'automatizace-procesu': 'Automatizace procesů a AI zpracování dat',
  'ai-konzultace-audit-strategie': 'AI konzultace, audit a strategie pro firmy',
  'datova-platforma-integrace': 'Datová platforma a integrace dat',
  'mlops-provoz-ai-systemu': 'MLOps — provoz AI systémů v produkci',
  seo: 'SEO pro firmy — technické SEO a obsah',
  'aeo-answer-engine-optimization': 'AEO — optimalizace pro ChatGPT a AI vyhledávače',
  'ppc-kampane': 'PPC kampaně s reportingem na revenue',
  'social-media-management': 'Správa sociálních sítí pro firmy',
  'tvorba-kreativ': 'Tvorba kreativ — grafika, video, Reels',
  'e-commerce-management': 'E-commerce management — CRO a retence',
  'marketing-strategy-plan': 'Marketingová strategie a plán pro firmy',
};

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
  const intentTitle = TITLE_INTENT[slug] ?? item.name;
  return {
    title: `${intentTitle} — VICTA`,
    description: metaDescription(item.desc),
    alternates: { canonical: `${site.url}/${locale}/sluzby/${slug}` },
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
