/* ============================================================
   offerings-data.ts
   ----------------------------------------------------------------
   Single source of truth for the three "offering" sections used
   by the desktop mega-menu (and any future consumer that needs a
   non-translation, static catalog of icons + labels).

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
       this file mirrors those Czech strings 1:1 (kept in sync).

   D-008 update (PR 8 mega-menu integration):
     - Icons swapped from `lucide-react` → `@phosphor-icons/react/dist/ssr`
       (lucide was removed in PR 7 cleanup). Mapping mirrors the
       homepage `page.tsx` (commit 682a8d4).
     - `href` fields realigned with the new detail-page routes that
       landed in PR 6a (overview + detail templates):
         · Services  → `/sluzby#{categorySlug}` (itDev / aiData / marketing)
         · Solutions → `/reseni/{slug}`
         · Industries → `/odvetvi/{slug}`

   Last sync with content/cs/strings/common.json: 2026-05-25
   ============================================================ */

import type { Icon } from '@phosphor-icons/react';
import {
  Bank,
  Buildings,
  ChartBar,
  ChatTeardrop,
  Code,
  Cube,
  Factory,
  Gear,
  HardDrives,
  Headphones,
  Lightning,
  MagnifyingGlass,
  Package,
  ShoppingCart,
  Stack,
  Stethoscope,
  Target,
  TrendUp,
  Truck,
} from '@phosphor-icons/react/dist/ssr';

export type OfferingDataItem = {
  icon: Icon;
  title: string;
  subtitle: string;
  href: string;
};

export type OfferingData = {
  sidebarIcon: Icon;
  sidebarHeadline: string;
  sidebarDescription: string;
  sidebarCtaLabel: string;
  sidebarCtaHref: string;
  items: ReadonlyArray<OfferingDataItem>;
};

/* ---------- A · Services — full-service representatives (6 cells) ----------
   Hrefs use the 3 category anchors on /sluzby (itDev / aiData / marketing),
   matching `home.offerings.services.items[].href` in common.json. */
export const SERVICES_OFFERING: OfferingData = {
  sidebarIcon: Stack,
  sidebarHeadline: 'Tři kompetence, jedna agentura',
  sidebarDescription:
    'Weby, AI a marketing pod jednou střechou. Od prvního pixelu až po měřitelné výsledky.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/sluzby',
  items: [
    {
      icon: Code,
      title: 'Weby a e-shopy na míru',
      subtitle: 'Návrh, vývoj a spuštění na míru',
      href: '/sluzby#itDev',
    },
    {
      icon: Gear,
      title: 'Správa webů a e-shopů',
      subtitle: 'Technická péče, aktualizace a rozvoj',
      href: '/sluzby#itDev',
    },
    {
      icon: ChatTeardrop,
      title: 'AI chatboti a automatizace',
      subtitle: 'Chatboti, agenti a automatizace procesů',
      href: '/sluzby#aiData',
    },
    {
      icon: MagnifyingGlass,
      title: 'SEO a AEO',
      subtitle: 'Organická viditelnost ve vyhledávačích i AI',
      href: '/sluzby#marketing',
    },
    {
      icon: TrendUp,
      title: 'PPC a performance marketing',
      subtitle: 'Placené kampaně s měřitelným výnosem',
      href: '/sluzby#marketing',
    },
    {
      icon: Target,
      title: 'Komplexní transformace byznysu',
      subtitle: 'Audit a plán celého digitálního stacku',
      href: '/spoluprace',
    },
  ],
};

/* ---------- B · Turnkey AI solutions (5 cells) ----------
   Hrefs link to per-solution detail pages /reseni/{slug}. */
export const SOLUTIONS_OFFERING: OfferingData = {
  sidebarIcon: Package,
  sidebarHeadline: 'AI řešení na klíč',
  sidebarDescription:
    'Pět připravených scénářů — od znalostního asistenta po vlastní AI infrastrukturu.',
  sidebarCtaLabel: 'Zobrazit vše →',
  sidebarCtaHref: '/reseni',
  items: [
    {
      icon: ChatTeardrop,
      title: 'Znalostní asistent',
      subtitle: 'AI natrénované na vaši dokumentaci',
      href: '/reseni/knowledge',
    },
    {
      icon: Cube,
      title: 'Autonomní agenti',
      subtitle: 'Sekvence úkolů bez lidského zásahu',
      href: '/reseni/agents',
    },
    {
      icon: Headphones,
      title: 'AI podpora zákazníků',
      subtitle: 'Chatbot 24/7, eskalace na živého agenta',
      href: '/reseni/support',
    },
    {
      icon: ChartBar,
      title: 'Datové dashboardy',
      subtitle: 'Jeden přehled pro prodeje, marketing i sklad',
      href: '/reseni/dashboards',
    },
    {
      icon: HardDrives,
      title: 'AI infrastruktura',
      subtitle: 'Platforma pro více AI scénářů najednou',
      href: '/reseni/infra',
    },
  ],
};

/* ---------- C · Industries (6 cells on mega-menu) ----------
   Full 8-industry catalog lives on /odvetvi page. Mega-menu shows
   6 highest-leverage verticals (matches `home.offerings.industries
   .items` in common.json 1:1). Profesionální služby + Zákaznická
   podpora accessible directly via /odvetvi. */
export const INDUSTRIES_OFFERING: OfferingData = {
  sidebarIcon: Buildings,
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
      icon: Bank,
      title: 'Finance',
      subtitle: 'ČNB, DORA, AML/KYC compliance',
      href: '/odvetvi/finance',
    },
    {
      icon: Lightning,
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
  ],
};

/* Convenience map for the mega-menu trigger keys. */
export const OFFERING_MAP = {
  services: SERVICES_OFFERING,
  solutions: SOLUTIONS_OFFERING,
  industries: INDUSTRIES_OFFERING,
} as const;

export type OfferingKey = keyof typeof OFFERING_MAP;
