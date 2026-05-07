import { site, sameAs, type Locale } from '@/config/site';
import type { JsonLdNode } from './schema-types';

/**
 * JSON-LD schema engine for VICTA (AR-07, REQ-F-085..REQ-F-088).
 * Single source of truth for all structured data — pages call these builders rather than
 * inlining JSON-LD by hand. Locale-aware where applicable; org-level metadata is locale-
 * independent and lives in `config/site.ts`.
 *
 * Validate output via Google Rich Results Test or Schema Markup Validator before launch
 * (Phase 5 §5.4 docs/schema-validation-report.md).
 */

export function buildOrganizationSchema(locale: Locale): JsonLdNode {
  const node: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: site.logo,
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
