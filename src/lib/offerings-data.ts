/* ============================================================
   offerings-data.ts
   ----------------------------------------------------------------
   Single source of truth for the three "offering" sections shown
   on the homepage and inside the desktop mega-menu.

   Content aligned with content/cs/strings/common.json
   `home.offerings.*` per the 2026-05-23..25 positioning rewrite
   (PR #15 + audit session). Keep in sync with JSON.

   The mega-menu is a shared client component that imports static
   data from here (icon binding + labels). Homepage section bodies
   can either use this OR `t.raw('home.offerings.<section>.items')`
   — they MUST agree.
   ============================================================ */

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

/* ---------- A · Three competencies, one agency (6 items) ---------- */
export const SERVICES_OFFERING: OfferingData = {
  sidebarIcon: Layers,
  sidebarHeadline: 'Tři kompetence, jedna agentura',
  sidebarDescription:
    'Weby, AI a marketing pod jednou střechou. Od prvního pixelu až po měřitelné výsledky.',
  sidebarCtaLabel: 'Všechny služby →',
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

/* ---------- B · Packaged AI solutions (5 items) ---------- */
export const SOLUTIONS_OFFERING: OfferingData = {
  sidebarIcon: Package,
  sidebarHeadline: 'AI řešení na klíč',
  sidebarDescription:
    'Pět připravených scénářů — od znalostního asistenta po vlastní AI infrastrukturu.',
  sidebarCtaLabel: 'Všechna řešení →',
  sidebarCtaHref: '/reseni',
  items: [
    {
      icon: MessageCircle,
      title: 'Znalostní asistent',
      subtitle: 'AI natrénované na vaši dokumentaci',
      href: '/reseni/znalostni-asistent',
    },
    {
      icon: Boxes,
      title: 'Autonomní agenti',
      subtitle: 'Sekvence úkolů bez lidského zásahu',
      href: '/reseni/agenti',
    },
    {
      icon: Headphones,
      title: 'AI podpora zákazníků',
      subtitle: 'Chatbot 24/7, eskalace na živého agenta',
      href: '/reseni/podpora',
    },
    {
      icon: BarChart3,
      title: 'Datové dashboardy',
      subtitle: 'Jeden přehled pro prodeje, marketing i sklad',
      href: '/reseni/dashboardy',
    },
    {
      icon: Server,
      title: 'AI infrastruktura',
      subtitle: 'Platforma pro více AI scénářů najednou',
      href: '/reseni/infrastruktura',
    },
  ],
};

/* ---------- C · Industries we understand (8 items) ----------
   Homepage typically shows the first 6; /odvetvi page shows all 8.
   Order matches content/cs/strings/common.json odvetvi.items.
*/
export const INDUSTRIES_OFFERING: OfferingData = {
  sidebarIcon: Building2,
  sidebarHeadline: 'Odvětví, kterým rozumíme',
  sidebarDescription:
    'Neřešíme jen techniku — rozumíme procesům a tlakům v každém oboru, se kterým pracujeme.',
  sidebarCtaLabel: 'Všechna odvětví →',
  sidebarCtaHref: '/odvetvi',
  items: [
    {
      icon: ShoppingCart,
      title: 'E-commerce',
      subtitle: 'Shopify, Shoptet, headless, CZ feedy',
      href: '/odvetvi/ecommerce',
    },
    {
      icon: Factory,
      title: 'Výroba',
      subtitle: 'SAP, OEE, prediktivní údržba',
      href: '/odvetvi/vyroba',
    },
    {
      icon: Truck,
      title: 'Logistika',
      subtitle: 'CMR, AETR, optimalizace tras',
      href: '/odvetvi/logistika',
    },
    {
      icon: Landmark,
      title: 'Finance',
      subtitle: 'ČNB, DORA, AML/KYC compliance',
      href: '/odvetvi/finance',
    },
    {
      icon: Zap,
      title: 'Energetika',
      subtitle: 'Air-gapped LLM, ERÚ, fotovoltaika',
      href: '/odvetvi/energetika',
    },
    {
      icon: Stethoscope,
      title: 'Zdravotnictví',
      subtitle: 'FotoFinder, longevity AI, GDPR',
      href: '/odvetvi/zdravotnictvi',
    },
    {
      icon: Briefcase,
      title: 'Profesionální služby',
      subtitle: 'Právo, audit, konzulting, účetnictví',
      href: '/odvetvi/profesionalni-sluzby',
    },
    {
      icon: Headphones,
      title: 'Zákaznická podpora',
      subtitle: 'Helpdesk, ticket klasifikace, agent assist',
      href: '/odvetvi/zakaznicka-podpora',
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
   Icon arrays — used where `t.raw('home.offerings.<section>.items')`
   is bound to icons by index. Order matches items[] above.
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
