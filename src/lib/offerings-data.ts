'use client';

/* ============================================================
   offerings-data.ts
   ----------------------------------------------------------------
   Single source of truth for the three "offering" sections shown
   on the homepage and inside the desktop mega-menu.

   Icons and hrefs are locale-independent (URL structure is locked
   per architecture.md §4.2, so a slug is shared by /cs and /en).
   Title/subtitle/headline/description text is NOT locale-independent
   — it comes from `content/{locale}/strings/common.json`
   `home.offerings.<key>` via next-intl, so EN visitors see English
   copy instead of the previously-hardcoded Czech (Vlna 2b-EN parity
   fix — this file used to export static CS strings consumed
   unconditionally by nav.tsx, home-body.tsx and odvetvi-body.tsx
   regardless of locale).

   Use `useOfferingData(key)` from a Client Component to get the
   merged, locale-correct `OfferingData` shape.
   ============================================================ */

import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Code2,
  Factory,
  Headphones,
  Landmark,
  Layers,
  MessageCircle,
  MessageSquare,
  Package,
  Search,
  Server,
  Settings,
  ShoppingCart,
  Stethoscope,
  Target,
  TrendingUp,
  Truck,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type OfferingDataItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
};

export type OfferingData = {
  sidebarIcon: LucideIcon;
  sidebarHeadline: string;
  sidebarDescription: string;
  sidebarCtaLabel: string;
  sidebarCtaHref: string;
  items: ReadonlyArray<OfferingDataItem>;
};

type OfferingMeta = {
  sidebarIcon: LucideIcon;
  sidebarCtaHref: string;
  items: ReadonlyArray<{ icon: LucideIcon; href: string }>;
};

export type OfferingKey = 'services' | 'solutions' | 'industries';

/* ---------- A · Three competencies, one agency (6 items) ---------- */
const SERVICES_META: OfferingMeta = {
  sidebarIcon: Layers,
  sidebarCtaHref: '/sluzby',
  items: [
    { icon: Code2, href: '/sluzby/weby-na-miru' },
    { icon: Settings, href: '/sluzby/sprava-webu-a-e-shopu' },
    { icon: MessageSquare, href: '/sluzby/ai-chatboti' },
    { icon: Search, href: '/sluzby/seo' },
    { icon: TrendingUp, href: '/sluzby/ppc-kampane' },
    { icon: Target, href: '/spoluprace' },
  ],
};

/* ---------- B · Packaged AI solutions (5 items) ---------- */
const SOLUTIONS_META: OfferingMeta = {
  sidebarIcon: Package,
  sidebarCtaHref: '/reseni',
  items: [
    { icon: MessageCircle, href: '/reseni/znalostni-asistent' },
    { icon: Boxes, href: '/reseni/agenti' },
    { icon: Headphones, href: '/reseni/podpora' },
    { icon: BarChart3, href: '/reseni/dashboardy' },
    { icon: Server, href: '/reseni/infrastruktura' },
  ],
};

/* ---------- C · Industries we understand (8 items) ----------
   Order matches content/{locale}/strings/common.json home.offerings.industries.items.
*/
const INDUSTRIES_META: OfferingMeta = {
  sidebarIcon: Building2,
  sidebarCtaHref: '/odvetvi',
  items: [
    { icon: ShoppingCart, href: '/odvetvi/ecommerce' },
    { icon: Factory, href: '/odvetvi/vyroba' },
    { icon: Truck, href: '/odvetvi/logistika' },
    { icon: Landmark, href: '/odvetvi/finance' },
    { icon: Zap, href: '/odvetvi/energetika' },
    { icon: Stethoscope, href: '/odvetvi/zdravotnictvi' },
    { icon: Briefcase, href: '/odvetvi/profesionalni-sluzby' },
    { icon: Headphones, href: '/odvetvi/zakaznicka-podpora' },
  ],
};

const META_MAP: Record<OfferingKey, OfferingMeta> = {
  services: SERVICES_META,
  solutions: SOLUTIONS_META,
  industries: INDUSTRIES_META,
};

/** Sidebar icons exposed for direct re-use (locale-independent). */
export const SERVICES_SIDEBAR_ICON = SERVICES_META.sidebarIcon;
export const SOLUTIONS_SIDEBAR_ICON = SOLUTIONS_META.sidebarIcon;
export const INDUSTRIES_SIDEBAR_ICON = INDUSTRIES_META.sidebarIcon;

/**
 * Client-only hook: merges the locale-independent icon/href meta with
 * translated copy from `home.offerings.<key>` for the active locale.
 */
export function useOfferingData(key: OfferingKey): OfferingData {
  const t = useTranslations(`home.offerings.${key}`);
  const tAll = useTranslations('home.offerings');
  const meta = META_MAP[key];
  const items = t.raw('items') as ReadonlyArray<{ title: string; subtitle: string }>;

  return {
    sidebarIcon: meta.sidebarIcon,
    sidebarHeadline: t('headline'),
    sidebarDescription: t('description'),
    sidebarCtaLabel: tAll('ctaAll'),
    sidebarCtaHref: meta.sidebarCtaHref,
    items: meta.items.map((m, i) => ({
      icon: m.icon,
      href: m.href,
      title: items[i]?.title ?? '',
      subtitle: items[i]?.subtitle ?? '',
    })),
  };
}

/** Convenience hook returning all three offering groups keyed like the old OFFERING_MAP. */
export function useOfferingsMap(): Record<OfferingKey, OfferingData> {
  return {
    services: useOfferingData('services'),
    solutions: useOfferingData('solutions'),
    industries: useOfferingData('industries'),
  };
}
