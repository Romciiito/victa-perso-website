/**
 * Canonical page slugs used by sitemap.ts, robots.ts, and llms.txt.
 * URL structure is locked at launch (architecture.md §4.2 + REQ-NF-031).
 *
 * Total: 41 pages — 39 Czech + 1 EN stub + 1 utility 404.
 */

/** 18 service slugs (architecture.md §4.2 + spec.md §5). */
export const serviceSlugs = [
  // IT & Vývoj (4)
  'weby-na-miru',
  'eshopy-na-miru',
  'integrace',
  'custom-vyvoj',
  // AI & Data (5)
  'ai-chatboti',
  'ai-automatizace',
  'ai-konzultace',
  'datova-platforma',
  'mlops',
  // Marketing & Obsah (7)
  'seo',
  'aeo',
  'ppc-kampane',
  'social-media',
  'tvorba-kreativ',
  'ecommerce-management',
  'marketingova-strategie',
  // Cross-team (2)
  'komplexni-transformace',
  'dlouhodoba-sprava',
] as const;

/** 5 packaged solution slugs. */
export const solutionSlugs = [
  'znalostni-asistent',
  'autonomni-agenti',
  'ai-podpora',
  'dashboardy',
  'ai-infrastruktura',
] as const;

/** 5 industry vertical slugs (zdravotnictvi removed 2026-05-07 per Roman). */
export const industrySlugs = [
  'ecommerce',
  'vyroba-logistika',
  'profesionalni-sluzby',
  'finance',
  'zakaznicka-podpora',
] as const;

/** Top-level Czech routes (excluding nested service/solution/industry paths). */
export const topLevelCsRoutes = [
  '/',
  '/sluzby',
  '/reseni',
  '/odvetvi',
  '/spoluprace',
  '/o-nas',
  '/kontakt',
  '/blog',
  '/ochrana-soukromi',
  '/cookies',
] as const;

/** All canonical Czech paths (relative to /cs prefix). */
export function allCsPaths(): readonly string[] {
  return [
    ...topLevelCsRoutes,
    ...serviceSlugs.map((s) => `/sluzby/${s}`),
    ...solutionSlugs.map((s) => `/reseni/${s}`),
    ...industrySlugs.map((s) => `/odvetvi/${s}`),
  ];
}

/** EN-locale paths shipped at launch (just the stub per intent.md §7.7). */
export const enPaths: readonly string[] = ['/'];

export type ServiceSlug = (typeof serviceSlugs)[number];
export type SolutionSlug = (typeof solutionSlugs)[number];
export type IndustrySlug = (typeof industrySlugs)[number];
