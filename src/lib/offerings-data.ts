/* ============================================================
   offerings-data.ts
   ----------------------------------------------------------------
   Single source of truth for the three "offering" sections shown
   on the homepage and inside the desktop mega-menu.

   Why static Czech strings live here (Phase 1):
     - The CS homepage is the canonical surface (locked-preview).
     - The EN site is a stub (English routes render `<EnglishStub/>`).
     - The mega-menu is a shared client component that cannot easily
       resolve `next-intl` `t.raw('offerings.services.items')` at the
       same point as the server homepage. To keep nav rendering
       deterministic and DRY across pages, we co-locate the icon
       binding + Czech labels here. Phase 2 can move strings back
       to translations once EN nav is required.
     - `page.tsx` continues to use translations for SEO/i18n parity;
       this file matches those Czech strings 1:1 (kept in sync).
   ============================================================ */

import {
  Activity,
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Code2,
  Database,
  Headphones,
  Heart,
  Layers,
  MessageCircle,
  MessageSquare,
  Package,
  Search,
  Server,
  Settings,
  Shield,
  ShoppingCart,
  Target,
  TrendingUp,
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

/* ---------- A · Services for the AI journey (6 cells) ---------- */
export const SERVICES_OFFERING: OfferingData = {
  sidebarIcon: Layers,
  sidebarHeadline: 'Služby pro vaši AI cestu',
  sidebarDescription:
    'Od auditu a strategie přes datovou přípravu až po provoz a governance.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/sluzby',
  items: [
    {
      icon: Search,
      title: 'AI Discovery',
      subtitle: 'Audit a diagnostika potenciálu',
      href: '/sluzby#ai-discovery',
    },
    {
      icon: Target,
      title: 'AI Strategie',
      subtitle: 'Plán implementace a nasazení',
      href: '/sluzby#ai-strategie',
    },
    {
      icon: Database,
      title: 'Datová platforma',
      subtitle: 'Data readiness, modelování, zpracování',
      href: '/sluzby#datova-platforma',
    },
    {
      icon: Code2,
      title: 'AI-driven vývoj',
      subtitle: 'Vývoj na míru s AI',
      href: '/sluzby#ai-vyvoj',
    },
    {
      icon: Shield,
      title: 'AI Governance',
      subtitle: 'Bezpečnost a compliance',
      href: '/sluzby#ai-governance',
    },
    {
      icon: Activity,
      title: 'Provoz a MLOps',
      subtitle: 'Monitoring a optimalizace',
      href: '/sluzby#mlops',
    },
  ],
};

/* ---------- B · Turnkey AI solutions (5 cells) ---------- */
export const SOLUTIONS_OFFERING: OfferingData = {
  sidebarIcon: Package,
  sidebarHeadline: 'AI řešení na klíč',
  sidebarDescription:
    'Od znalostních asistentů po vlastní AI infrastrukturu.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/reseni',
  items: [
    {
      icon: MessageSquare,
      title: 'GenAI a RAG asistenti',
      subtitle: 'Firemní znalostní asistenti',
      href: '/reseni#genai-rag',
    },
    {
      icon: Boxes,
      title: 'Autonomní AI agenti',
      subtitle: 'Automatizace back-office',
      href: '/reseni#agenti',
    },
    {
      icon: Headphones,
      title: 'AI zákaznická podpora',
      subtitle: 'Chatboti a voiceboti 24/7',
      href: '/reseni#zakaznicka-podpora',
    },
    {
      icon: BarChart3,
      title: 'Prediktivní analytika',
      subtitle: 'Dashboardy a predikce',
      href: '/reseni#prediktivni-analytika',
    },
    {
      icon: Server,
      title: 'AI Infrastruktura',
      subtitle: 'Vlastní on-premise AI servery',
      href: '/reseni#infrastruktura',
    },
  ],
};

/* ---------- C · AI solutions per industry (7 cells) ---------- */
export const INDUSTRIES_OFFERING: OfferingData = {
  sidebarIcon: Building2,
  sidebarHeadline: 'AI řešení pro vaše odvětví',
  sidebarDescription:
    'Oborově specifické AI implementace s měřitelným dopadem.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/odvetvi',
  items: [
    {
      icon: ShoppingCart,
      title: 'E-commerce a maloobchod',
      subtitle: 'Personalizace a automatizace prodeje',
      href: '/odvetvi#ecommerce',
    },
    {
      icon: TrendingUp,
      title: 'Finance a Fintech',
      subtitle: 'Automatizace a analýza rizik',
      href: '/odvetvi#finance',
    },
    {
      icon: Heart,
      title: 'Zdravotnictví a medtech',
      subtitle: 'Diagnostika, klinický výzkum a distribuce',
      href: '/odvetvi#zdravotnictvi',
    },
    {
      icon: Settings,
      title: 'Výroba a logistika',
      subtitle: 'Prediktivní údržba a optimalizace',
      href: '/odvetvi#vyroba',
    },
    {
      icon: Zap,
      title: 'Energetika a utility',
      subtitle: 'Predikce spotřeby a smart grids',
      href: '/odvetvi#energetika',
    },
    {
      icon: MessageCircle,
      title: 'Zákaznická podpora a CX',
      subtitle: 'Chatboti a voiceboti 24/7',
      href: '/odvetvi#cx',
    },
    {
      icon: Briefcase,
      title: 'Profesionální služby',
      subtitle: 'Právo, audit, konzulting a vzdělávání',
      href: '/odvetvi#profesionalni-sluzby',
    },
  ],
};

/* Convenience map for the mega-menu trigger keys. */
export const OFFERING_MAP = {
  services: SERVICES_OFFERING,
  solutions: SOLUTIONS_OFFERING,
  industries: INDUSTRIES_OFFERING,
} as const;

export type OfferingKey = keyof typeof OFFERING_MAP;

/* ============================================================
   Icon arrays — used by `app/[locale]/page.tsx` to bind icons
   onto translated `t.raw('home.offerings.<section>.items')` data.
   Order matches `items[i]` in the i18n JSON exactly.
   Kept in sync with the OFFERING constants above (single source).
   ============================================================ */
export const SERVICES_ICONS: ReadonlyArray<LucideIcon> = SERVICES_OFFERING.items.map(
  (it) => it.icon,
);
export const SOLUTIONS_ICONS: ReadonlyArray<LucideIcon> = SOLUTIONS_OFFERING.items.map(
  (it) => it.icon,
);
export const INDUSTRIES_ICONS: ReadonlyArray<LucideIcon> = INDUSTRIES_OFFERING.items.map(
  (it) => it.icon,
);

/* Sidebar icons exposed for direct re-use on the homepage. */
export const SERVICES_SIDEBAR_ICON = SERVICES_OFFERING.sidebarIcon;
export const SOLUTIONS_SIDEBAR_ICON = SOLUTIONS_OFFERING.sidebarIcon;
export const INDUSTRIES_SIDEBAR_ICON = INDUSTRIES_OFFERING.sidebarIcon;
