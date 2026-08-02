'use client';

import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion';
import { useTranslations } from 'next-intl';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { useCalModal } from '@/components/booking/use-cal-modal';
import { SectionHeader } from '@/components/sections/section-header';
import { SectionMarquee } from '@/components/sections/section-marquee';
import { BentoGrid, type BentoItem } from '@/components/sections/bento-grid';
import { HorizontalScroller } from '@/components/sections/horizontal-scroller';
import { KineticList } from '@/components/sections/kinetic-list';
import { ValuesGrid, type ValueItem } from '@/components/sections/values-grid';
import { Link } from '@/i18n/navigation';
import {
  SERVICES_OFFERING,
  SOLUTIONS_OFFERING,
  INDUSTRIES_OFFERING,
} from '@/lib/offerings-data';

/* ============================================================
   Czech homepage · D-008 taste-skill applied
   - Hero, marquee, services bento, solutions scroller,
     industries kinetic list, audit sticky stack
   - Translations via next-intl `useTranslations('home')`
   - Offering data sourced from /lib/offerings-data.ts (sync'd
     with /content/cs/strings/common.json offerings keys)
   ============================================================ */

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export function HomeBody() {
  return (
    <>
      <Hero />
      <SectionMarquee
        items={[
          'CHCI RŮST',
          'TRANSPARENTNOST',
          'PARTNERSTVÍ',
          'AI-NATIVE',
          'ŘEMESLO',
          `AI-augmented tým`,
          'Pod jednou střechou',
          'Hradec Králové',
        ]}
      />
      <ServicesBento />
      <SolutionsSection />
      <IndustriesSection />
      <ProofSection />
    </>
  );
}

/* ------------------------------------------------------------ */
/*  Hero (homepage-specific — distinct from PageHero)           */
/* ------------------------------------------------------------ */

function Hero() {
  const t = useTranslations('home.hero');
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);
  const openCal = useCalModal({
    eventSlug: 'free-scoping-call',
    bookingType: 'scoping_call',
    sourcePage: '/cs',
  });

  return (
    <section
      ref={ref}
      className="relative min-h-[80vh] px-6 pt-20 pb-24 md:px-10 md:pt-28 md:pb-28"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
        <motion.div style={{ y }} className="flex flex-col">
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.1 }}
            variants={REVEAL}
            className="mb-7 inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-[11.5px] text-secondary backdrop-blur-sm"
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono uppercase tracking-[0.14em]">
              {t('status')}
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.18 }}
            variants={REVEAL}
            className="display max-w-[16ch] text-[clamp(56px,8vw,128px)] text-ink"
          >
            {t('headline')}
          </motion.h1>

          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.26 }}
            variants={REVEAL}
            className="mt-7 flex flex-wrap items-center gap-3 font-mono text-[12.5px] uppercase tracking-[0.14em] text-secondary"
          >
            <span>{t('tagsWeb')}</span>
            <Diamond />
            <span>{t('tagsEshop')}</span>
            <Diamond />
            <span>{t('tagsAi')}</span>
            <Diamond />
            <span>{t('tagsMarketing')}</span>
            <Diamond />
            <span>{t('tagsSprava')}</span>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.34 }}
            variants={REVEAL}
            className="mt-7 max-w-[58ch] text-[18px] leading-[1.55] text-secondary"
          >
            {t('sub')}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.44 }}
            variants={REVEAL}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <MagneticCta primary size="hero" onClick={openCal}>
              {t('ctaPrimary')}
            </MagneticCta>
            <Link
              href="/spoluprace"
              className="tactile text-[14.5px] text-secondary underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
            >
              {t('ctaGhost')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Diamond() {
  return (
    <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-accent" />
  );
}

/* ------------------------------------------------------------ */
/*  Services bento                                               */
/* ------------------------------------------------------------ */

function ServicesBento() {
  const spanMap: ReadonlyArray<BentoItem['span']> = [7, 5, 5, 7, 4, 8];

  const bentoItems: ReadonlyArray<BentoItem> = SERVICES_OFFERING.items.map(
    (item, i) => ({
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
      number: `0${i + 1}`,
      span: spanMap[i] ?? (8 as BentoItem['span']),
      prominent: i === 0,
      compact: i === 4,
      accent: i === 0,
    }),
  );

  return (
    <section id="sluzby" className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="01 · služby"
          title={`${SERVICES_OFFERING.sidebarHeadline}.`}
          lead={SERVICES_OFFERING.sidebarDescription}
          ctaLabel="Všechny služby"
          ctaHref={SERVICES_OFFERING.sidebarCtaHref}
        />
        <div className="mt-14">
          <BentoGrid items={bentoItems} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ */
/*  Solutions scroller                                           */
/* ------------------------------------------------------------ */

function SolutionsSection() {
  return (
    <section id="reseni" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader
          eyebrow="02 · řešení"
          title={`${SOLUTIONS_OFFERING.sidebarHeadline}.`}
          lead={SOLUTIONS_OFFERING.sidebarDescription}
          ctaLabel="Všechna řešení"
          ctaHref={SOLUTIONS_OFFERING.sidebarCtaHref}
        />
      </div>
      <HorizontalScroller items={SOLUTIONS_OFFERING.items} />
    </section>
  );
}

/* ------------------------------------------------------------ */
/*  Industries — kinetic list                                    */
/* ------------------------------------------------------------ */

function IndustriesSection() {
  return (
    <section id="odvetvi" className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="03 · odvětví"
          title={`${INDUSTRIES_OFFERING.sidebarHeadline}.`}
          lead={INDUSTRIES_OFFERING.sidebarDescription}
          ctaLabel="Všechna odvětví"
          ctaHref={INDUSTRIES_OFFERING.sidebarCtaHref}
        />
        <KineticList items={INDUSTRIES_OFFERING.items} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ */
/*  Proof section — replaces the audit-tier stack (D-012, wave 1) */
/*  conversion-flow-v3.md §3 + copy-rewrites.md §2: the audit     */
/*  product moves entirely to /spoluprace; the homepage closes    */
/*  on evidence (process guarantees), not a pricing table.        */
/* ------------------------------------------------------------ */

function ProofSection() {
  const t = useTranslations('home.proof');
  const cards = t.raw('cards') as ReadonlyArray<{ title: string; body: string }>;
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: '/cs',
  });

  const cardItems: ReadonlyArray<ValueItem> = cards.map((card) => ({
    label: card.title,
    body: card.body,
  }));

  return (
    <section id="proof" className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow={t('eyebrow')}
          title={`${t('headline')}`}
          lead={t('lead')}
        />
        <ValuesGrid items={cardItems} columns={3} />
        <div className="mt-14">
          <MagneticCta primary onClick={openCal}>
            {t('cta')}
          </MagneticCta>
        </div>
      </div>
    </section>
  );
}
