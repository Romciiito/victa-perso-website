'use client';

import { useTranslations } from 'next-intl';
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

/* ------------------------------------------------------------------ */
/* Per-solution static metadata (icons + anchor ids + bento subtitles) */
/* ------------------------------------------------------------------ */

type SolutionMeta = {
  id: string;
  eyebrow: string;
  primaryIcon: LucideIcon;
  secondaryIcon: LucideIcon;
  /** Short bento card title for the second (audience) card */
  bentoTitle: string;
  /** Short bento subtitle for the primary (feature) card */
  bentoBody: string;
  /** bg-surface alternation for visual rhythm */
  alt: boolean;
};

const SOLUTION_META: ReadonlyArray<SolutionMeta> = [
  {
    id: 'genai-rag',
    eyebrow: '01 · GenAI a RAG',
    primaryIcon: MessageSquare,
    secondaryIcon: Layers,
    bentoTitle: 'Znalostní báze na míru',
    bentoBody:
      'RAG pipeline nad vaší dokumentací — Slack, intranet nebo firemní wiki. Odpovědi vždy přesné na vaše data.',
    alt: false,
  },
  {
    id: 'agenti',
    eyebrow: '02 · autonomní agenti',
    primaryIcon: Boxes,
    secondaryIcon: Cpu,
    bentoTitle: 'Back-office automatizace',
    bentoBody:
      'E-maily, reporty, rezervace, kontrola dat — vše s human-in-the-loop tam, kde je to potřeba.',
    alt: true,
  },
  {
    id: 'zakaznicka-podpora',
    eyebrow: '03 · zákaznická podpora',
    primaryIcon: Headphones,
    secondaryIcon: Users,
    bentoTitle: 'Chatbot 24 / 7',
    bentoBody:
      'Web, Messenger nebo WhatsApp. Odpovídá na 70 % dotazů sám, složitější předá živému agentovi.',
    alt: false,
  },
  {
    id: 'prediktivni-analytika',
    eyebrow: '04 · prediktivní analytika',
    primaryIcon: BarChart3,
    secondaryIcon: ShieldCheck,
    bentoTitle: 'Jeden přehled, vše pohromadě',
    bentoBody:
      'Metabase nebo Looker Studio, ETL z vašich systémů, alerting na anomálie v reálném čase.',
    alt: true,
  },
  {
    id: 'infrastruktura',
    eyebrow: '05 · AI infrastruktura',
    primaryIcon: Server,
    secondaryIcon: Layers,
    bentoTitle: 'Platforma pro více AI projektů',
    bentoBody:
      'Model abstraction, prompt management, cost control, eval framework — každé další AI není nový projekt od nuly.',
    alt: false,
  },
];

function makeBento(
  name: string,
  audience: string,
  meta: SolutionMeta,
  idx: number,
): ReadonlyArray<BentoItem> {
  /* Alternate 7/5 → 5/7 per section for rhythm */
  const primarySpan: BentoItem['span'] = idx % 2 === 0 ? 7 : 5;
  const secondarySpan: BentoItem['span'] = idx % 2 === 0 ? 5 : 7;
  return [
    {
      icon: meta.primaryIcon,
      title: meta.bentoTitle,
      subtitle: meta.bentoBody,
      href: `/cs/reseni#${meta.id}`,
      number: String(idx * 2 + 1).padStart(2, '0'),
      span: primarySpan,
      accent: true,
    },
    {
      icon: meta.secondaryIcon,
      title: name,
      subtitle: audience,
      href: `/cs/reseni#${meta.id}`,
      number: String(idx * 2 + 2).padStart(2, '0'),
      span: secondarySpan,
    },
  ];
}

/* ================================================================== */
export function ReseniBody() {
  const t = useTranslations('reseni');
  const items = t.raw('items') as ReadonlyArray<{
    key: string;
    name: string;
    body: string;
    audience: string;
  }>;
  const openCal = useCalModal({
    eventSlug: 'free-scoping-call',
    bookingType: 'scoping_call',
    sourcePage: '/cs/reseni',
  });

  return (
    <>
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
        anchors={[
          { label: 'GenAI a RAG', href: '#genai-rag' },
          { label: 'Autonomní agenti', href: '#agenti' },
          { label: 'AI podpora', href: '#zakaznicka-podpora' },
          { label: 'Prediktivní analytika', href: '#prediktivni-analytika' },
          { label: 'AI infrastruktura', href: '#infrastruktura' },
        ]}
      />

      {SOLUTION_META.map((meta, idx) => (
        <section
          key={meta.id}
          id={meta.id}
          className={`relative px-6 py-24 md:px-10 md:py-32 ${meta.alt ? 'bg-surface' : ''}`}
        >
          <div className="mx-auto max-w-[1400px]">
            <SectionHeader
              eyebrow={meta.eyebrow}
              title={`${items[idx].name}.`}
              lead={items[idx].body}
            />
            <div className="mt-14">
              <BentoGrid items={makeBento(items[idx].name, items[idx].audience, meta, idx)} />
            </div>
          </div>
        </section>
      ))}

      {/* ---- CTA band ---- */}
      <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              06 · další krok
            </span>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('ctaLine')}
            </h2>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary href="/spoluprace#audit">
              Spustit projekt →
            </MagneticCta>
            <MagneticCta onClick={openCal}>{t('ctaButton')}</MagneticCta>
          </div>
        </div>
      </section>
    </>
  );
}
