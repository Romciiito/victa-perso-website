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

   Last sync with content/cs/strings/common.json: 2026-05-23
   (full-service positioning rewrite + 18 services + 8 industries)
   ============================================================ */

import {
  BarChart3,
  Boxes,
  Building2,
  Code2,
  Factory,
  Headphones,
  Landmark,
  Layers,
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

/* ---------- A · Services — full-service representatives (6 cells) ---------- */
export const SERVICES_OFFERING: OfferingData = {
  sidebarIcon: Layers,
  sidebarHeadline: 'Tři kompetence, jedna agentura',
  sidebarDescription:
    'Weby, AI a marketing pod jednou střechou. Od prvního pixelu až po měřitelné výsledky.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/sluzby',
  items: [
    {
      icon: Code2,
      title: 'Weby a e-shopy na míru',
      subtitle: 'Návrh, vývoj a spuštění na míru',
      href: '/sluzby#weby',
    },
    {
      icon: Settings,
      title: 'Správa webů a e-shopů',
      subtitle: 'Technická péče, aktualizace a rozvoj',
      href: '/sluzby#sprava',
    },
    {
      icon: MessageSquare,
      title: 'AI chatboti a automatizace',
      subtitle: 'Chatboti, agenti a automatizace procesů',
      href: '/sluzby#ai',
    },
    {
      icon: Search,
      title: 'SEO a AEO',
      subtitle: 'Organická viditelnost ve vyhledávačích i AI',
      href: '/sluzby#seo',
    },
    {
      icon: TrendingUp,
      title: 'PPC a performance marketing',
      subtitle: 'Placené kampaně s měřitelným výnosem',
      href: '/sluzby#ppc',
    },
    {
      icon: Target,
      title: 'Komplexní transformace byznysu',
      subtitle: 'Audit a plán celého digitálního stacku',
      href: '/spoluprace',
    },
  ],
};

/* ---------- B · Turnkey AI solutions (5 cells) ---------- */
export const SOLUTIONS_OFFERING: OfferingData = {
  sidebarIcon: Package,
  sidebarHeadline: 'AI řešení na klíč',
  sidebarDescription:
    'Pět připravených scénářů — od znalostního asistenta po vlastní AI infrastrukturu.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/reseni',
  items: [
    {
      icon: MessageSquare,
      title: 'Znalostní asistent',
      subtitle: 'AI natrénované na vaši dokumentaci',
      href: '/reseni#znalostni-asistent',
    },
    {
      icon: Boxes,
      title: 'Autonomní agenti',
      subtitle: 'Sekvence úkolů bez lidského zásahu',
      href: '/reseni#agenti',
    },
    {
      icon: Headphones,
      title: 'AI podpora zákazníků',
      subtitle: 'Chatbot 24/7, eskalace na živého agenta',
      href: '/reseni#podpora',
    },
    {
      icon: BarChart3,
      title: 'Datové dashboardy',
      subtitle: 'Jeden přehled pro prodeje, marketing i sklad',
      href: '/reseni#dashboardy',
    },
    {
      icon: Server,
      title: 'AI infrastruktura',
      subtitle: 'Platforma pro více AI scénářů najednou',
      href: '/reseni#infrastruktura',
    },
  ],
};

/* ---------- C · Industries (6 cells on homepage / mega-menu) ---------- */
/* Full 8-industry catalog lives on /odvetvi page. Homepage + mega-menu
   show 6 highest-leverage verticals; Profesionální služby + Zákaznická
   podpora accessible directly via /odvetvi. */
export const INDUSTRIES_OFFERING: OfferingData = {
  sidebarIcon: Building2,
  sidebarHeadline: 'Odvětví, kterým rozumíme',
  sidebarDescription:
    'Neřešíme jen techniku — rozumíme procesům a tlakům v každém oboru, se kterým pracujeme.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/odvetvi',
  items: [
    {
      icon: ShoppingCart,
      title: 'E-commerce',
      subtitle: 'Shopify, Shoptet, headless, CZ feedy',
      href: '/odvetvi#ecommerce',
    },
    {
      icon: Factory,
      title: 'Výroba',
      subtitle: 'SAP, OEE, prediktivní údržba',
      href: '/odvetvi#vyroba',
    },
    {
      icon: Truck,
      title: 'Logistika',
      subtitle: 'CMR, AETR, optimalizace tras',
      href: '/odvetvi#logistika',
    },
    {
      icon: Landmark,
      title: 'Finance',
      subtitle: 'ČNB, DORA, AML/KYC compliance',
      href: '/odvetvi#finance',
    },
    {
      icon: Zap,
      title: 'Energetika',
      subtitle: 'Air-gapped LLM, ERÚ, fotovoltaika',
      href: '/odvetvi#energetika',
    },
    {
      icon: Stethoscope,
      title: 'Zdravotnictví',
      subtitle: 'FotoFinder, longevity AI, GDPR',
      href: '/odvetvi#zdravotnictvi',
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
