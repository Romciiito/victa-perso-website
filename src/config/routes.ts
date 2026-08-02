/**
 * Canonical page slugs used by sitemap.ts, robots.ts, and llms.txt.
 * URL structure is locked at launch (architecture.md §4.2 + REQ-NF-031).
 *
 * ⚠️ These arrays MUST mirror the slugs in content/cs/strings/common.json
 * (`sluzby.categories.*.items`, `reseni.items`, `odvetvi.items`) — that JSON
 * is what the [slug] detail routes actually render. Before contact-flow v2
 * this file carried an older, diverged slug set, so the sitemap listed 404
 * URLs and missed the real pages.
 *
 * Total: 43 pages — 41 Czech (10 top-level + 18 + 5 + 8) + 1 EN stub + 1 utility 404.
 */

/** 18 service slugs (content/cs/strings/common.json `sluzby.categories`). */
export const serviceSlugs = [
  // IT & Vývoj (6)
  'weby-na-miru',
  'e-shopy-na-miru',
  'prezentacni-weby-a-microsite',
  'sprava-webu-a-e-shopu',
  'integrace-systemu',
  'webove-aplikace-a-custom-vyvoj',
  // AI & Data (5)
  'ai-chatboti',
  'automatizace-procesu',
  'ai-konzultace-audit-strategie',
  'datova-platforma-integrace',
  'mlops-provoz-ai-systemu',
  // Marketing & Obsah (7)
  'seo',
  'aeo-answer-engine-optimization',
  'ppc-kampane',
  'social-media-management',
  'tvorba-kreativ',
  'e-commerce-management',
  'marketing-strategy-plan',
] as const;

/** 5 packaged solution slugs (content/cs/strings/common.json `reseni.items`). */
export const solutionSlugs = [
  'znalostni-asistent',
  'agenti',
  'podpora',
  'dashboardy',
  'infrastruktura',
] as const;

/** 8 industry vertical slugs (content/cs/strings/common.json `odvetvi.items`). */
export const industrySlugs = [
  'ecommerce',
  'vyroba',
  'logistika',
  'profesionalni-sluzby',
  'finance',
  'energetika',
  'zdravotnictvi',
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
