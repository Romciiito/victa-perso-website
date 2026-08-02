import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { site } from '@/config/site';
import { metaDescription } from '@/lib/meta';
import { JsonLd } from '@/components/seo/json-ld';
import { buildServiceSchema, buildBreadcrumbSchema, buildFaqSchema } from '@/lib/schema';
import { ServiceBody, type ServiceDetailItem } from './service-body';
import csData from '../../../../../content/cs/strings/common.json';
import enData from '../../../../../content/en/strings/common.json';

/* ============================================================
   /sluzby/[slug] · Service detail route
   Flat slug namespace (all 18 services from 3 categories under
   one /sluzby/ prefix). categorySlug preserved on each item for
   breadcrumb context.

   Content is locale-aware (Vlna 2b-EN parity): slugs are shared
   1:1 between /cs and /en (URL structure locked, architecture.md
   §4.2), but the item text (name/desc/fit/faq) comes from the
   matching locale's content JSON.
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Intent-mapped `<title>` per service (SEO audit P1-20, seo-visibility.md §3).
 * `${item.name} — VICTA` alone doesn't match what people actually search —
 * each entry below extends the bare service name with the buyer intent /
 * cluster keyword it should rank for. Falls back to the mechanical pattern
 * for any slug not (yet) mapped. EN entries are for due-diligence readers,
 * not an SEO investment (vision §10) — kept simple and accurate.
 */
const TITLE_INTENT_CS: Readonly<Record<string, string>> = {
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

const TITLE_INTENT_EN: Readonly<Record<string, string>> = {
  'weby-na-miru': 'Custom Websites for Companies — Development & SEO',
  'e-shopy-na-miru': 'Custom E-commerce — Shopify Plus & Medusa.js',
  'prezentacni-weby-a-microsite': 'Landing Pages & Microsites for Campaigns',
  'sprava-webu-a-e-shopu': 'Website & E-commerce Maintenance',
  'integrace-systemu': 'ERP & CRM Systems Integration for Companies',
  'webove-aplikace-a-custom-vyvoj': 'Custom Web Applications & Development',
  'ai-chatboti': 'AI Chatbots Connected to Your Systems',
  'automatizace-procesu': 'Process Automation & AI Data Processing',
  'ai-konzultace-audit-strategie': 'AI Consulting, Audit & Strategy for Companies',
  'datova-platforma-integrace': 'Data Platform & Data Integration',
  'mlops-provoz-ai-systemu': 'MLOps — Running AI Systems in Production',
  seo: 'SEO for Companies — Technical SEO & Content',
  'aeo-answer-engine-optimization': 'AEO — Optimization for ChatGPT & AI Search',
  'ppc-kampane': 'PPC Campaigns with Revenue Reporting',
  'social-media-management': 'Social Media Management for Companies',
  'tvorba-kreativ': 'Creative Production — Graphics, Video, Reels',
  'e-commerce-management': 'E-commerce Management — CRO & Retention',
  'marketing-strategy-plan': 'Marketing Strategy & Plan for Companies',
};

function flattenServices(
  data: typeof csData | typeof enData,
): ReadonlyArray<ServiceDetailItem> {
  return (
    Object.values(data.sluzby.categories) as ReadonlyArray<{
      label: string;
      items: ReadonlyArray<ServiceDetailItem>;
    }>
  ).flatMap((cat) => cat.items.map((it) => ({ ...it, categoryLabel: cat.label })));
}

const ITEMS_BY_LOCALE: Record<string, ReadonlyArray<ServiceDetailItem>> = {
  cs: flattenServices(csData),
  en: flattenServices(enData),
};

function itemsFor(locale: string): ReadonlyArray<ServiceDetailItem> {
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
  if (!item) return { title: locale === 'en' ? 'Services — VICTA' : 'Služby — VICTA' };
  const intentTitle =
    (locale === 'en' ? TITLE_INTENT_EN[slug] : TITLE_INTENT_CS[slug]) ?? item.name;
  return {
    title: `${intentTitle} — VICTA`,
    description: metaDescription(item.desc),
    alternates: { canonical: `${site.url}/${locale}/sluzby/${slug}` },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = itemsFor(locale).find((i) => i.slug === slug);
  if (!item) notFound();

  const t = await getTranslations({ locale, namespace: 'common' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <JsonLd
        data={[
          buildServiceSchema({ slug, name: item.name, description: item.desc }, locale === 'en' ? 'en' : 'cs'),
          buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), url: `${site.url}/${locale}` },
            { name: tNav('services'), url: `${site.url}/${locale}/sluzby` },
            { name: item.name, url: `${site.url}/${locale}/sluzby/${slug}` },
          ]),
          ...(item.faq && item.faq.length > 0 ? [buildFaqSchema(item.faq)] : []),
        ]}
      />
      <ServiceBody item={item} />
    </>
  );
}
