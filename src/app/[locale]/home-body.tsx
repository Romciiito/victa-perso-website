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
import { SectionHeader } from '@/components/sections/section-header';
import { SectionMarquee } from '@/components/sections/section-marquee';
import { BentoGrid, type BentoItem } from '@/components/sections/bento-grid';
import { HorizontalScroller } from '@/components/sections/horizontal-scroller';
import { KineticList } from '@/components/sections/kinetic-list';
import { StickyTierStack, type TierData } from '@/components/sections/sticky-tier-stack';
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

const NBSP = ' ';

export function HomeBody() {
  return (
    <>
      <Hero />
      <SectionMarquee
        items={[
          'TRANSPARENTNOST',
          'PARTNERSTVÍ',
          'AI-NATIVE',
          'ŘEMESLO',
          `AI-augmented tým`,
          'Pod jednou střechou',
          'Praha · Hradec Králové · Trutnov',
        ]}
      />
      <ServicesBento />
      <SolutionsSection />
      <IndustriesSection />
      <AuditSection />
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
            <span>{t('tagsAudit')}</span>
            <Diamond />
            <span>{t('tagsDev')}</span>
            <Diamond />
            <span>{t('tagsMarketing')}</span>
            <Diamond />
            <span>{t('tagsAi')}</span>
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
            <MagneticCta primary href="/spoluprace#audit">
              {t('ctaPrimary')}
            </MagneticCta>
            <MagneticCta href="/kontakt">{t('ctaGhost')}</MagneticCta>
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
/*  Audit sticky stack                                           */
/* ------------------------------------------------------------ */

function AuditSection() {
  const t = useTranslations('home.audit');

  const tiers: ReadonlyArray<TierData> = [
    {
      tier: t('tier1.tier'),
      flag: t('tier1.badge'),
      name: t('tier1.name'),
      price: t('tier1.price'),
      priceEur: t('tier1.priceEur'),
      body: `Plný rozsah napříč technologií, byznysem a${NBSP}marketingem. Výstup: prezentace zjištění a${NBSP}konkrétní návrh integrace AI.`,
      deliverables: [
        t('tier1.deliverables.0'),
        t('tier1.deliverables.1'),
        t('tier1.deliverables.2'),
        t('tier1.deliverables.3'),
        t('tier1.deliverables.4'),
      ],
      cta: t('tier1.cta'),
      ctaHref: '/kontakt',
      primary: true,
    },
    {
      tier: t('tier2.tier'),
      flag: '',
      name: t('tier2.name'),
      price: t('tier2.price'),
      priceEur: t('tier2.priceEur'),
      body: `Hloubková analýza jedné domény. Tech, obchod, marketing nebo AI${NBSP}— jeden směr, plný detail.`,
      deliverables: [
        t('tier2.deliverables.0'),
        t('tier2.deliverables.1'),
        t('tier2.deliverables.2'),
        t('tier2.deliverables.3'),
      ],
      cta: t('tier2.cta'),
      ctaHref: '/kontakt',
      primary: false,
    },
    {
      tier: t('tier3.tier'),
      flag: '',
      name: t('tier3.name'),
      price: t('tier3.price'),
      priceEur: t('tier3.priceEur'),
      body: `Krátká, fokusovaná session. Specifický problém, strukturovaný výstup, žádný dlouhý report.`,
      deliverables: [
        t('tier3.deliverables.0'),
        t('tier3.deliverables.1'),
        t('tier3.deliverables.2'),
        t('tier3.deliverables.3'),
      ],
      cta: t('tier3.cta'),
      ctaHref: '/kontakt',
      primary: false,
    },
  ];

  return (
    <section id="audit" className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="04 · audit"
          title={`${t('heading')}.`}
          lead={t('subhead')}
        />
        <StickyTierStack
          tiers={tiers}
          scopingNote={
            <>
              {t('scopingPrefix')}
              <Link
                href="/spoluprace#audit"
                className="border-b border-accent pb-0.5 text-accent hover:border-ink hover:text-ink"
              >
                {t('scopingLink')}
              </Link>
              {t('scopingSuffix')}
            </>
          }
        />
      </div>
    </section>
  );
}
