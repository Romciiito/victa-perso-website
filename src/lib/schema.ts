import { site, sameAs, type Locale } from '@/config/site';
import type { JsonLdNode, JsonLdValue } from './schema-types';

/**
 * JSON-LD schema engine for VICTA (AR-07, REQ-F-085..REQ-F-088).
 * Single source of truth for all structured data — pages call these builders rather than
 * inlining JSON-LD by hand. Locale-aware where applicable; org-level metadata is locale-
 * independent and lives in `config/site.ts`.
 *
 * Validate output via Google Rich Results Test or Schema Markup Validator before launch
 * (Phase 5 §5.4 docs/schema-validation-report.md).
 */

/**
 * Legal-identity fields shared by Organization + LocalBusiness. `ico` (IČO) is
 * always real; `dic` (DIČ → vatID) and `spisovaZnacka` are still `[ROMAN-BLOCKER:
 * ...]` placeholders in config/site.ts as of this wave (R4, open item) — they're
 * wired in here so they appear automatically, with no further code change, the
 * moment Roman fills the real values. Until then the `JsonLd` render component's
 * guard (components/seo/json-ld.tsx) strips any field containing the
 * ROMAN-BLOCKER marker before it reaches the DOM (audit P0-23, launch-gate §14
 * bullets 3+9).
 */
function legalIdentityFields(): Record<string, JsonLdValue | undefined> {
  // Gate opravy (Vlna 3B): IČO je registrační číslo, ne daňové — patří do
  // `identifier` (PropertyValue), NE do `taxID` (to je v ČR DIČ). Blokované
  // hodnoty se nevydávají vůbec (žádný osiřelý PropertyValue bez `value` —
  // nekompletní uzel je horší než jeho absence); generický ROMAN-BLOCKER
  // filtr v json-ld.tsx zůstává jako backstop.
  const identifiers: JsonLdValue[] = [
    { '@type': 'PropertyValue', name: 'IČO', value: site.contact.ico },
  ];
  if (!site.contact.spisovaZnacka.includes('ROMAN-BLOCKER')) {
    identifiers.push({
      '@type': 'PropertyValue',
      name: 'Spisová značka',
      value: site.contact.spisovaZnacka,
    });
  }
  return {
    ...(site.contact.dic.includes('ROMAN-BLOCKER') ? {} : { taxID: site.contact.dic, vatID: site.contact.dic }),
    identifier: identifiers.length === 1 ? identifiers[0] : identifiers,
  };
}

export function buildOrganizationSchema(locale: Locale): JsonLdNode {
  const node: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: site.logo,
    ...legalIdentityFields(),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: site.contact.email,
      availableLanguage: ['cs', 'en'] as const,
    },
    areaServed: site.area.countries.map((code) => ({ '@type': 'Country', name: code })),
    inLanguage: locale,
  };
  if (sameAs.length > 0) node.sameAs = sameAs;
  return node;
}

export function buildLocalBusinessSchema(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url: site.url,
    logo: site.logo,
    email: site.contact.email,
    telephone: site.contact.phone,
    ...legalIdentityFields(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.addressLine1,
      addressLocality: site.contact.addressLocality,
      postalCode: site.contact.postalCode,
      addressCountry: site.contact.country,
    },
    areaServed: site.area.countries.map((code) => ({ '@type': 'Country', name: code })),
  };
}

export interface ServiceSchemaInput {
  slug: string;
  name: string;
  description: string;
}

export function buildServiceSchema(input: ServiceSchemaInput, locale: Locale): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    provider: { '@type': 'Organization', name: site.name, url: site.url },
    areaServed: site.area.countries.map((code) => ({ '@type': 'Country', name: code })),
    inLanguage: locale,
    url: `${site.url}/${locale}/sluzby/${input.slug}`,
  };
}

export interface FaqEntry {
  q: string;
  a: string;
}

export function buildFaqSchema(faqs: readonly FaqEntry[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: readonly BreadcrumbItem[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function buildWebSiteSchema(locale: Locale): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
  };
}
