'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Boxes,
  BarChart3,
  Headphones,
  MessageSquare,
  Server,
  Users,
  Layers,
  ShieldCheck,
  Cpu,
  type LucideIcon,
} from 'lucide-react';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { BentoGrid, type BentoItem } from '@/components/sections/bento-grid';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { useCalModal } from '@/components/booking/use-cal-modal';
import { Link } from '@/i18n/navigation';

/* ------------------------------------------------------------------ */
/* Per-solution static metadata (icons + anchor ids + bento subtitles) */
/* ------------------------------------------------------------------ */

type SolutionMeta = {
  id: string;
  primaryIcon: LucideIcon;
  secondaryIcon: LucideIcon;
  /** bg-surface alternation for visual rhythm */
  alt: boolean;
};

type SolutionMetaText = { eyebrow: string; bentoTitle: string; bentoBody: string };

/* `id` MUST match the real /reseni/[slug] route slugs (content/{locale}/strings/common.json
   `reseni.items[].slug`) — used both as the on-page anchor id and, via makeBento(),
   as the mega-menu/homepage href fragment. Previously drifted from the actual slugs
   (audit P2-11); ids below are now 1:1 with routes.ts `solutionSlugs`.
   Icons are locale-independent; eyebrow/bentoTitle/bentoBody come from
   `reseni.meta[]` in content/{locale}/strings/common.json (same order) —
   Vlna 2b-EN parity fix (this array used to hold hardcoded Czech text). */
const SOLUTION_META: ReadonlyArray<SolutionMeta> = [
  { id: 'znalostni-asistent', primaryIcon: MessageSquare, secondaryIcon: Layers, alt: false },
  { id: 'agenti', primaryIcon: Boxes, secondaryIcon: Cpu, alt: true },
  { id: 'podpora', primaryIcon: Headphones, secondaryIcon: Users, alt: false },
  { id: 'dashboardy', primaryIcon: BarChart3, secondaryIcon: ShieldCheck, alt: true },
  { id: 'infrastruktura', primaryIcon: Server, secondaryIcon: Layers, alt: false },
];

function makeBento(
  name: string,
  audience: string,
  meta: SolutionMeta,
  metaText: SolutionMetaText,
  idx: number,
  locale: string,
): ReadonlyArray<BentoItem> {
  /* Alternate 7/5 → 5/7 per section for rhythm */
  const primarySpan: BentoItem['span'] = idx % 2 === 0 ? 7 : 5;
  const secondarySpan: BentoItem['span'] = idx % 2 === 0 ? 5 : 7;
  return [
    {
      icon: meta.primaryIcon,
      title: metaText.bentoTitle,
      subtitle: metaText.bentoBody,
      href: `/${locale}/reseni#${meta.id}`,
      number: String(idx * 2 + 1).padStart(2, '0'),
      span: primarySpan,
      accent: true,
    },
    {
      icon: meta.secondaryIcon,
      title: name,
      subtitle: audience,
      href: `/${locale}/reseni#${meta.id}`,
      number: String(idx * 2 + 2).padStart(2, '0'),
      span: secondarySpan,
    },
  ];
}

/* ================================================================== */
export function ReseniBody() {
  const t = useTranslations('reseni');
  const locale = useLocale();
  const items = t.raw('items') as ReadonlyArray<{
    key: string;
    name: string;
    body: string;
    audience: string;
  }>;
  const metaText = t.raw('meta') as ReadonlyArray<SolutionMetaText>;
  const anchors = t.raw('anchors') as ReadonlyArray<{ label: string }>;
  const anchorHrefs = ['#znalostni-asistent', '#agenti', '#podpora', '#dashboardy', '#infrastruktura'];
  const tCta = useTranslations('common.ctaBand');
  const tCommon = useTranslations('common');
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}/reseni`,
  });

  return (
    <>
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
        anchors={anchors.map((a, i) => ({ label: a.label, href: anchorHrefs[i] }))}
        anchorNavLabel={tCommon('pageSectionsNavLabel')}
      />

      {SOLUTION_META.map((meta, idx) => (
        <section
          key={meta.id}
          id={meta.id}
          className={`relative px-6 py-24 md:px-10 md:py-32 ${meta.alt ? 'bg-surface' : ''}`}
        >
          <div className="mx-auto max-w-[1400px]">
            <SectionHeader
              eyebrow={metaText[idx].eyebrow}
              title={`${items[idx].name}.`}
              lead={items[idx].body}
            />
            <div className="mt-14">
              <BentoGrid
                items={makeBento(
                  items[idx].name,
                  items[idx].audience,
                  meta,
                  metaText[idx],
                  idx,
                  locale,
                )}
              />
            </div>
          </div>
        </section>
      ))}

      {/* ---- CTA band ---- */}
      <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              {t('ctaEyebrow')}
            </span>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('ctaLine')}
            </h2>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary onClick={openCal}>
              {tCta('primaryCta')}
            </MagneticCta>
            <Link
              href="/spoluprace"
              className="tactile text-[14px] text-secondary underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
            >
              {t('ctaButton')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
