/**
 * Organization-level metadata used by the JSON-LD schema engine, sitemap, OG defaults,
 * and the legal-page boilerplate. Page copy lives in `content/{cs,en}/strings/common.json`
 * (next-intl); this file holds machine-readable identity that is locale-independent.
 *
 * ⛔ ROMAN-BLOCKER markers below — Roman fills before launch (see plan RB-13).
 */

export const site = {
  name: 'VICTA',
  legalName: 'Victa Digital s.r.o.',
  url: 'https://victaagency.com',
  logo: 'https://victaagency.com/logo.png',
  ogImage: 'https://victaagency.com/og/default.png',
  defaultLocale: 'cs' as const,
  locales: ['cs', 'en'] as const,
  contact: {
    email: 'hello@victaagency.com',
    phone: '+420 777 933 112',
    /** Sídlo (matches content/cs/strings/common.json kontakt.channels.address). */
    addressLine1: 'Haškova 1238/8',
    addressLocality: 'Hradec Králové',
    postalCode: '500 02',
    country: 'CZ' as const,
    ico: '28859511',
    /** ⛔ ROMAN-BLOCKER (RB-13): DIČ */
    dic: '[ROMAN-BLOCKER: DIČ]',
    /** ⛔ ROMAN-BLOCKER (RB-13): spisová značka u soudu */
    spisovaZnacka: '[ROMAN-BLOCKER: spisová značka]',
  },
  social: {
    /** ⛔ Optional — fill if VICTA has a public LinkedIn page */
    linkedin: '',
  },
  area: {
    countries: ['CZ', 'SK'] as const,
  },
} as const;

/** sameAs list for Organization schema — only includes filled URLs. */
export const sameAs: string[] = [site.social.linkedin].filter((u) => u.length > 0);

export type Locale = (typeof site.locales)[number];
