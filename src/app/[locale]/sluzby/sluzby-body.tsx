'use client';

import { useTranslations } from 'next-intl';
import {
  Activity,
  BarChart3,
  Briefcase,
  Code2,
  Database,
  Globe,
  Layers,
  MessageCircle,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { BentoGrid, type BentoItem } from '@/components/sections/bento-grid';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { useCalModal } from '@/components/booking/use-cal-modal';

type ServiceItem = { name: string; desc: string; slug?: string };
type Category = { label: string; intro: string; items: ReadonlyArray<ServiceItem> };

/* span pattern per spec:
   0→7 prominent accent, 1→5, 2→5, 3→7,
   4→4 compact, 5→8, 6+→7/5 alternating          */
const SPAN_MAP: ReadonlyArray<BentoItem['span']> = [7, 5, 5, 7, 4, 8, 7, 5, 7, 5];

function toBento(
  cat: Category,
  icons: ReadonlyArray<LucideIcon>,
): ReadonlyArray<BentoItem> {
  return cat.items.map((it, i) => ({
    icon: icons[i] ?? icons[icons.length - 1],
    title: it.name,
    subtitle: it.desc,
    href: it.slug ? `/sluzby/${it.slug}` : '#',
    number: String(i + 1).padStart(2, '0'),
    span: SPAN_MAP[i] ?? (7 as BentoItem['span']),
    prominent: i === 0,
    compact: i === 4,
    accent: i === 0,
  }));
}

/* ------------------------------------------------------------------ */
/* Icon assignments per item name (contextually matched)              */
/* ------------------------------------------------------------------ */

const IT_DEV_ICONS: ReadonlyArray<LucideIcon> = [
  Globe,         // Weby na míru — websites / web pages
  ShoppingCart,  // E-shopy na míru — e-commerce
  Layers,        // Integrace systémů — systems / layers
  Code2,         // Custom solution development — code
];

const AI_DATA_ICONS: ReadonlyArray<LucideIcon> = [
  MessageSquare, // AI chatboti — chat / conversation
  Zap,           // AI automatizace procesů — automation / speed
  BarChart3,     // AI konzultace + audit + strategie — analytics / strategy
  Database,      // Datová platforma + integrace — data platform
  Activity,      // MLOps / Provoz AI systémů — monitoring / ops
];

const MARKETING_ICONS: ReadonlyArray<LucideIcon> = [
  Search,        // SEO — search engine
  Target,        // AEO (Answer Engine Optimization) — AI answer targeting
  TrendingUp,    // PPC kampaně — paid growth / trending
  MessageCircle, // Social media management — social / community
  Package,       // Tvorba kreativ — creative assets / deliverables
  ShoppingCart,  // E-commerce management — feeds / e-shop
  Briefcase,     // Marketing strategy + plan — strategy / business
];

/* ================================================================== */
export function SluzbyBody() {
  const t = useTranslations('sluzby');
  const tRaw = (k: string) => t.raw(k) as unknown;
  const openCal = useCalModal({
    eventSlug: 'free-scoping-call',
    bookingType: 'scoping_call',
    sourcePage: '/cs/sluzby',
  });

  const itDev = tRaw('categories.itDev') as Category;
  const aiData = tRaw('categories.aiData') as Category;
  const marketing = tRaw('categories.marketing') as Category;

  return (
    <>
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
        anchors={[
          { label: itDev.label, href: '#it-vyvoj' },
          { label: aiData.label, href: '#ai-data' },
          { label: marketing.label, href: '#marketing' },
        ]}
      />

      {/* ---- IT & Vývoj ---- */}
      <section id="it-vyvoj" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow="01 · IT a vývoj"
            title={`${itDev.label}.`}
            lead={itDev.intro}
          />
          <div className="mt-14">
            <BentoGrid items={toBento(itDev, IT_DEV_ICONS)} />
          </div>
        </div>
      </section>

      {/* ---- AI & Data ---- */}
      <section
        id="ai-data"
        className="relative bg-surface px-6 py-24 md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow="02 · AI a data"
            title={`${aiData.label}.`}
            lead={aiData.intro}
          />
          <div className="mt-14">
            <BentoGrid items={toBento(aiData, AI_DATA_ICONS)} />
          </div>
        </div>
      </section>

      {/* ---- Marketing & Obsah ---- */}
      <section id="marketing" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow="03 · marketing"
            title={`${marketing.label}.`}
            lead={marketing.intro}
          />
          <div className="mt-14">
            <BentoGrid items={toBento(marketing, MARKETING_ICONS)} />
          </div>
        </div>
      </section>

      {/* ---- CTA band ---- */}
      <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              04 · další krok
            </span>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('ctaLine')}
            </h2>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary href="/spoluprace#audit">
              {t('ctaButton')}
            </MagneticCta>
            <MagneticCta onClick={openCal}>Domluvit konzultaci</MagneticCta>
          </div>
        </div>
      </section>
    </>
  );
}
