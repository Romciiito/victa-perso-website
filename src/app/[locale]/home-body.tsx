'use client';

import { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  type Variants,
} from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  SERVICES_OFFERING,
  SOLUTIONS_OFFERING,
  INDUSTRIES_OFFERING,
  type OfferingDataItem,
} from '@/lib/offerings-data';

/* ============================================================
   Czech homepage · D-008 taste-skill applied
   - Hero, marquee, services bento, solutions scroller,
     industries kinetic list, audit sticky stack, contact CTA
   - Translations via next-intl `useTranslations('home')`
   - Offering data sourced from /lib/offerings-data.ts (sync'd
     with /content/cs/strings/common.json offerings keys)
   ============================================================ */

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

const NBSP = ' ';

export function HomeBody() {
  return (
    <>
      <Hero />
      <Marquee />
      <ServicesBento />
      <SolutionsScroller />
      <IndustriesList />
      <AuditStack />
    </>
  );
}

/* ------------------------------------------------------------ */
/*  Hero                                                         */
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
/*  Marquee — VICTA values                                       */
/* ------------------------------------------------------------ */

function Marquee() {
  const items = [
    'TRANSPARENTNOST',
    'PARTNERSTVÍ',
    'AI-NATIVE',
    'ŘEMESLO',
    `AI-augmented tým`,
    'Pod jednou střechou',
    'Praha · Hradec Králové · Trutnov',
  ];
  const doubled = [...items, ...items];

  return (
    <section
      aria-hidden
      className="relative border-y border-border-soft py-7"
    >
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="display flex items-center gap-12 text-[44px] leading-none text-ink md:text-[72px]"
            >
              {item}
              <Diamond />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ */
/*  Section header                                               */
/* ------------------------------------------------------------ */

function SectionHeader({
  eyebrow,
  title,
  lead,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      transition={SPRING}
      variants={REVEAL}
      className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_7fr] md:gap-16"
    >
      <div className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
        {eyebrow}
      </div>
      <div>
        <h2 className="display max-w-[18ch] text-[clamp(36px,4.6vw,68px)] text-ink">
          {title}
        </h2>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.55] text-secondary">
          {lead}
        </p>
        {ctaLabel && ctaHref && (
          <div className="mt-8">
            <MagneticCta href={ctaHref}>{ctaLabel}</MagneticCta>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Services bento                                               */
/* ------------------------------------------------------------ */

function ServicesBento() {
  const items = SERVICES_OFFERING.items;

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

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-12">
          <ServiceCard {...items[0]} number="01" className="md:col-span-7" accent prominent />
          <ServiceCard {...items[1]} number="02" className="md:col-span-5" />
          <ServiceCard {...items[2]} number="03" className="md:col-span-5" />
          <ServiceCard {...items[3]} number="04" className="md:col-span-7" />
          <ServiceCard {...items[4]} number="05" className="md:col-span-4" compact />
          <ServiceCard {...items[5]} number="06" className="md:col-span-8" />
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  subtitle,
  href,
  number,
  className = '',
  accent,
  prominent,
  compact,
}: OfferingDataItem & {
  number: string;
  className?: string;
  accent?: boolean;
  prominent?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--mx', `${x}%`);
    ref.current?.style.setProperty('--my', `${y}%`);
  }

  const padding = prominent
    ? 'p-10 md:p-14'
    : compact
      ? 'p-7 md:p-8'
      : 'p-8 md:p-10';
  const titleSize = prominent
    ? 'text-[clamp(36px,4.4vw,64px)]'
    : 'text-[clamp(24px,2.6vw,38px)]';
  const minH = prominent ? 'min-h-[420px]' : 'min-h-[260px]';

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={SPRING}
      variants={REVEAL}
      className={className}
    >
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        className={`spotlight tactile relative flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface ${padding} ${minH} ${
          accent ? 'bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--accent-tint)]' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-6">
          <div
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-ink"
            aria-hidden
          >
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-tertiary">
            {number}
          </span>
        </div>

        <div className="mt-12">
          <h3 className={`display ${titleSize} text-ink`}>{title}</h3>
          <p className="mt-3 max-w-[42ch] text-[14.5px] leading-[1.55] text-secondary">
            {subtitle}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Solutions scroller                                           */
/* ------------------------------------------------------------ */

function SolutionsScroller() {
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

      <div className="mt-14 overflow-x-auto px-6 pb-6 md:px-10">
        <div className="flex w-max gap-5">
          {SOLUTIONS_OFFERING.items.map((item, i) => (
            <SolutionCard key={item.title} {...item} index={i} total={SOLUTIONS_OFFERING.items.length} />
          ))}
          <div aria-hidden className="w-6 shrink-0" />
        </div>
      </div>
    </section>
  );
}

function SolutionCard({
  icon: Icon,
  title,
  subtitle,
  href,
  index,
  total,
}: OfferingDataItem & { index: number; total: number }) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--mx', `${x}%`);
    ref.current?.style.setProperty('--my', `${y}%`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.05 }}
    >
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        className="spotlight tactile relative flex h-[340px] w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-8 md:h-[380px] md:w-[360px]"
      >
        <div className="flex items-center justify-between">
          <div
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-ink"
          >
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-tertiary">
            0{index + 1} / 0{total}
          </span>
        </div>

        <div>
          <h3 className="display text-[clamp(24px,2.4vw,32px)] text-ink">{title}</h3>
          <p className="mt-3 text-[14.5px] leading-[1.55] text-secondary">{subtitle}</p>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Industries — kinetic list                                    */
/* ------------------------------------------------------------ */

function IndustriesList() {
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

        <div className="mt-14 border-t border-border">
          {INDUSTRIES_OFFERING.items.map((ind, i) => (
            <IndustryRow key={ind.title} {...ind} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function IndustryRow({
  icon: Icon,
  title,
  subtitle,
  href,
  index,
}: OfferingDataItem & { index: number }) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      className="border-b border-border"
    >
      <Link
        href={href}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="group block"
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 py-7 md:py-9">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-tertiary md:w-12">
            0{index + 1}
          </span>

          <div className="flex items-center gap-5">
            <motion.div
              animate={{
                rotate: hover ? 90 : 0,
                color: hover ? 'var(--accent)' : 'var(--secondary)',
              }}
              transition={SPRING}
              aria-hidden
              className="hidden md:block"
            >
              <Icon size={22} strokeWidth={1.5} />
            </motion.div>

            <div>
              <motion.h3
                animate={{ x: hover ? 8 : 0 }}
                transition={SPRING}
                className="display text-[clamp(28px,3.6vw,52px)] text-ink"
              >
                {title}
              </motion.h3>
              <p className="mt-1.5 text-[14px] text-secondary md:text-[15px]">
                {subtitle}
              </p>
            </div>
          </div>

          <motion.span
            animate={{
              x: hover ? 6 : 0,
              rotate: hover ? -8 : 0,
              color: hover ? 'var(--accent)' : 'var(--tertiary)',
            }}
            transition={SPRING}
            className="inline-flex"
            aria-hidden
          >
            <ArrowUpRight size={26} strokeWidth={1.5} />
          </motion.span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Audit sticky stack                                           */
/* ------------------------------------------------------------ */

function AuditStack() {
  const t = useTranslations('home.audit');

  const tiers = [
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

        <div className="mt-16 space-y-6 md:space-y-10">
          {tiers.map((tier, i) => (
            <StickyTier key={tier.name} tier={tier} index={i} />
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[12.5px] text-tertiary">
          {t('scopingPrefix')}
          <Link
            href="/spoluprace#audit"
            className="border-b border-accent pb-0.5 text-accent hover:border-ink hover:text-ink"
          >
            {t('scopingLink')}
          </Link>
          {t('scopingSuffix')}
        </p>
      </div>
    </section>
  );
}

function StickyTier({
  tier,
  index,
}: {
  tier: {
    tier: string;
    flag: string;
    name: string;
    price: string;
    priceEur: string;
    body: string;
    deliverables: string[];
    cta: string;
    primary: boolean;
  };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.05 }}
      className="sticky border border-border bg-surface"
      style={{
        top: `calc(80px + ${index * 16}px)`,
        borderRadius: '20px',
      }}
    >
      <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-[2fr_3fr_2fr] md:gap-12 md:p-12">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-tertiary">
              {tier.tier}
            </span>
            {tier.flag && (
              <span
                className="rounded-full border border-accent px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-accent"
                style={{ backgroundColor: 'var(--accent-soft)' }}
              >
                {tier.flag}
              </span>
            )}
          </div>
          <h3 className="display mt-3 text-[clamp(32px,3.6vw,56px)] text-ink">
            {tier.name}
          </h3>
        </div>

        <div>
          <p className="text-[16px] leading-[1.6] text-secondary">{tier.body}</p>
          <ul className="mt-6 space-y-2.5">
            {tier.deliverables.map((d, di) => (
              <li
                key={di}
                className="flex items-start gap-3 text-[14.5px] text-ink"
              >
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 rotate-45 shrink-0 bg-accent"
                />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-8 md:items-end">
          <div className="text-left md:text-right">
            <div className="font-mono text-[26px] font-medium leading-tight text-ink md:text-[32px]">
              {tier.price}
            </div>
            <div className="mt-1 font-mono text-[13px] text-tertiary">
              {tier.priceEur}
            </div>
          </div>
          <MagneticCta primary={tier.primary} compact href="/kontakt">
            {tier.cta}
          </MagneticCta>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Magnetic CTA                                                 */
/* ------------------------------------------------------------ */

function MagneticCta({
  children,
  primary,
  compact,
  href,
}: {
  children: React.ReactNode;
  primary?: boolean;
  compact?: boolean;
  href: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const [hover, setHover] = useState(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * 0.32);
    y.set((e.clientY - r.top - r.height / 2) * 0.32);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
    setHover(false);
  }

  const padding = compact ? 'px-5 py-2.5 text-[13.5px]' : 'px-7 py-3.5 text-[14.5px]';

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
    >
      <Link
        ref={ref}
        href={href}
        className={`tactile relative inline-flex items-center gap-2.5 rounded-full border ${padding} ${
          primary
            ? 'border-accent bg-accent text-bg'
            : 'border-border bg-transparent text-ink hover:border-ink'
        }`}
      >
        <span className="relative z-10">{children}</span>
        <motion.span
          animate={{ x: hover ? 3 : 0, rotate: hover ? -8 : 0 }}
          transition={SPRING}
          className="relative z-10 inline-flex"
          aria-hidden
        >
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </motion.span>
      </Link>
    </motion.div>
  );
}
