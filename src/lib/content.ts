/* ============================================================
   content.ts — lookup helpers for sluzby / reseni / odvetvi
   detail pages. Reads common.json directly (synchronous import)
   so generateStaticParams() can resolve at build time.
   Per spec D-008 §2.2 + workplan §4.3-§4.5.
   ============================================================ */

import csContent from '../../content/cs/strings/common.json';

/* ============================================================
   Types
   ============================================================ */

export type ServiceFaq = {
  q: string;
  a: string;
};

export type ServiceProcessStep = {
  title: string;
  body: string;
};

export type ServiceSections = {
  problem: string;
  approach: string;
  process: ReadonlyArray<ServiceProcessStep>;
};

export type Service = {
  slug: string;
  categorySlug: string;
  name: string;
  desc: string;
  fit: string;
  faq: ReadonlyArray<ServiceFaq>;
  /** PR 6b content — narratives for detail page. Optional during transition. */
  sections?: ServiceSections;
};

export type ServiceCategory = {
  key: string;
  label: string;
  intro: string;
  items: ReadonlyArray<Service>;
};

export type Solution = {
  slug: string;
  key: string;
  label: string;
  name: string;
  body: string;
  audience: string;
};

export type Industry = {
  slug: string;
  key: string;
  icon: string;
  name: string;
  body: string;
};

/* ============================================================
   Service lookups
   ============================================================ */

/** All service categories with their items, preserving declaration order. */
export function getServiceCategories(): ReadonlyArray<ServiceCategory> {
  const cats = csContent.sluzby.categories as Record<
    string,
    { label: string; intro: string; items: ReadonlyArray<Service> }
  >;
  return Object.entries(cats).map(([key, cat]) => ({
    key,
    label: cat.label,
    intro: cat.intro,
    items: cat.items,
  }));
}

/** Flat list of all service slugs across all categories. */
export function getAllServiceSlugs(): ReadonlyArray<string> {
  const out: string[] = [];
  for (const cat of getServiceCategories()) {
    for (const item of cat.items) {
      out.push(item.slug);
    }
  }
  return out;
}

/** Look up a service by slug across all categories. */
export function getServiceBySlug(slug: string): Service | null {
  for (const cat of getServiceCategories()) {
    const found = cat.items.find((it) => it.slug === slug);
    if (found) return found;
  }
  return null;
}

/* ============================================================
   Solution lookups
   ============================================================ */

export function getAllSolutions(): ReadonlyArray<Solution> {
  return csContent.reseni.items as ReadonlyArray<Solution>;
}

export function getAllSolutionSlugs(): ReadonlyArray<string> {
  return getAllSolutions().map((s) => s.slug);
}

export function getSolutionBySlug(slug: string): Solution | null {
  return getAllSolutions().find((s) => s.slug === slug) ?? null;
}

/* ============================================================
   Industry lookups
   ============================================================ */

export function getAllIndustries(): ReadonlyArray<Industry> {
  return csContent.odvetvi.items as ReadonlyArray<Industry>;
}

export function getAllIndustrySlugs(): ReadonlyArray<string> {
  return getAllIndustries().map((i) => i.slug);
}

export function getIndustryBySlug(slug: string): Industry | null {
  return getAllIndustries().find((i) => i.slug === slug) ?? null;
}
