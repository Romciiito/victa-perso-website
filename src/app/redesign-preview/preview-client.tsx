'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  type Variants,
} from 'framer-motion';
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  X,
  Compass,
  Layers,
  Database,
  Code2,
  Shield,
  Activity,
  Brain,
  Bot,
  MessagesSquare,
  LineChart,
  Server,
  ShoppingBag,
  Banknote,
  Stethoscope,
  Factory,
  Zap,
  Headphones,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

/* ============================================================
   redesign-preview · taste-skill applied · REAL VICTA Czech copy
   Source of truth: /content/cs/strings/common.json (home, kontakt)
   - DESIGN_VARIANCE: 8 (asymmetric grids, fractional units)
   - MOTION_INTENSITY: 6 (spring physics, perpetual micro-motion)
   - VISUAL_DENSITY: 4 (gallery breathing room with mono numerics)
   ============================================================ */

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

const NBSP = ' ';

export default function PreviewClient() {
  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-clip">
      <PreviewNav />
      <Hero />
      <Marquee />
      <ServicesBento />
      <SolutionsScroller />
      <IndustriesList />
      <AuditStack />
      <ContactSection />
      <FootNote />
    </main>
  );
}

/* ------------------------------------------------------------ */
/*  Hero — real Czech copy                                       */
/* ------------------------------------------------------------ */

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] px-6 pt-20 pb-24 md:px-10 md:pt-32 md:pb-32"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
        <motion.div style={{ y }} className="flex flex-col justify-end">
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.1 }}
            variants={REVEAL}
            className="mb-7 inline-flex items-center gap-2 self-start rounded-full border border-[var(--pv-border)] bg-[var(--pv-surface)]/60 px-3.5 py-1.5 text-[11.5px] text-[var(--pv-secondary)] backdrop-blur-sm"
          >
            <span className="pv-pulse h-1.5 w-1.5 rounded-full bg-[var(--pv-accent)]" />
            <span className="pv-mono uppercase tracking-[0.14em]">
              STATUS · v{NBSP}0.1.0 · published 2026-05-07 · region eu-central-1
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.18 }}
            variants={REVEAL}
            className="pv-display max-w-[16ch] text-[clamp(56px,8vw,128px)] text-[var(--pv-ink)]"
          >
            Začneme tím,
            <br />
            že{NBSP}<span className="text-[var(--pv-tertiary)]">posloucháme.</span>
          </motion.h1>

          {/* Tags row */}
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.26 }}
            variants={REVEAL}
            className="pv-mono mt-7 flex flex-wrap items-center gap-3 text-[12.5px] uppercase tracking-[0.14em] text-[var(--pv-secondary)]"
          >
            <span>Audit</span>
            <Diamond />
            <span>Vývoj</span>
            <Diamond />
            <span>Marketing</span>
            <Diamond />
            <span>AI integrace</span>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.34 }}
            variants={REVEAL}
            className="mt-7 max-w-[58ch] text-[18px] leading-[1.55] text-[var(--pv-secondary)]"
          >
            Než cokoliv navrhneme, chceme rozumět vašemu podnikání. To{NBSP}je celé.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ ...SPRING, delay: 0.44 }}
            variants={REVEAL}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <MagneticCta primary>Spustit audit</MagneticCta>
            <MagneticCta>Domluvit konzultaci</MagneticCta>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Diamond() {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--pv-accent)]"
    />
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
    'AI-augmented tým',
    'Pod jednou střechou',
    'Praha · Hradec Králové · Trutnov',
  ];
  const doubled = [...items, ...items];

  return (
    <section
      aria-hidden
      className="relative border-y border-[var(--pv-border-soft)] py-7"
    >
      <div className="overflow-hidden">
        <div className="pv-marquee-track flex w-max gap-12 whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="pv-display flex items-center gap-12 text-[44px] leading-none text-[var(--pv-ink)] md:text-[72px]"
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
/*  Services bento — 6 reálných služeb, asymetrický grid         */
/* ------------------------------------------------------------ */

const SERVICES: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  subtitle: string;
  number: string;
}> = [
  { icon: Compass, title: 'AI Discovery', subtitle: 'Audit a diagnostika potenciálu', number: '01' },
  { icon: Layers, title: 'AI Strategie', subtitle: 'Plán implementace a nasazení', number: '02' },
  { icon: Database, title: 'Datová platforma', subtitle: 'Data readiness, modelování, zpracování', number: '03' },
  { icon: Code2, title: 'AI-driven vývoj', subtitle: 'Vývoj na míru s AI', number: '04' },
  { icon: Shield, title: 'AI Governance', subtitle: 'Bezpečnost a compliance', number: '05' },
  { icon: Activity, title: 'Provoz a MLOps', subtitle: 'Monitoring a optimalizace', number: '06' },
];

function ServicesBento() {
  return (
    <section className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="01 · služby"
          title={`Služby pro vaši AI cestu.`}
          lead={`Od auditu a${NBSP}strategie přes datovou přípravu až po provoz a${NBSP}governance.`}
          ctaLabel="Všechny služby"
        />

        {/* Asymmetric 3+3 layout — first card large, others varied */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-12">
          <ServiceCard {...SERVICES[0]} className="md:col-span-7" accent prominent />
          <ServiceCard {...SERVICES[1]} className="md:col-span-5" />
          <ServiceCard {...SERVICES[2]} className="md:col-span-5" />
          <ServiceCard {...SERVICES[3]} className="md:col-span-7" />
          <ServiceCard {...SERVICES[4]} className="md:col-span-4" compact />
          <ServiceCard {...SERVICES[5]} className="md:col-span-8" />
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  subtitle,
  number,
  className = '',
  accent,
  prominent,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  number: string;
  className?: string;
  accent?: boolean;
  prominent?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--pv-mx', `${x}%`);
    ref.current?.style.setProperty('--pv-my', `${y}%`);
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
      ref={ref}
      onMouseMove={onMove}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING }}
      variants={REVEAL}
      className={`pv-spotlight pv-tactile relative overflow-hidden rounded-[20px] border border-[var(--pv-border)] bg-[var(--pv-surface)] ${padding} ${minH} ${className} ${
        accent
          ? 'bg-gradient-to-br from-[var(--pv-surface)] via-[var(--pv-surface)] to-[var(--pv-accent-tint)]'
          : ''
      } flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-6">
        <div
          className="grid h-10 w-10 place-items-center rounded-md border border-[var(--pv-border)] text-[var(--pv-ink)]"
          aria-hidden
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <span className="pv-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--pv-tertiary)]">
          {number}
        </span>
      </div>

      <div className="mt-12">
        <h3 className={`pv-display ${titleSize} text-[var(--pv-ink)]`}>{title}</h3>
        <p className="mt-3 max-w-[42ch] text-[14.5px] leading-[1.55] text-[var(--pv-secondary)]">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Solutions — horizontal scroll-snap (taste-skill arsenal)     */
/* ------------------------------------------------------------ */

const SOLUTIONS: ReadonlyArray<{ icon: LucideIcon; title: string; subtitle: string }> = [
  { icon: Brain, title: 'GenAI a RAG asistenti', subtitle: 'Firemní znalostní asistenti' },
  { icon: Bot, title: 'Autonomní AI agenti', subtitle: 'Automatizace back-office' },
  { icon: MessagesSquare, title: 'AI zákaznická podpora', subtitle: `Chatboti a${NBSP}voiceboti 24/7` },
  { icon: LineChart, title: 'Prediktivní analytika', subtitle: 'Dashboardy a predikce' },
  { icon: Server, title: 'AI Infrastruktura', subtitle: `Vlastní on-premise AI${NBSP}servery` },
];

function SolutionsScroller() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeader
          eyebrow="02 · řešení"
          title={`AI řešení na${NBSP}míru.`}
          lead="Od znalostních asistentů po vlastní AI infrastrukturu."
          ctaLabel="Všechna řešení"
        />
      </div>

      <div className="mt-14 overflow-x-auto px-6 pb-6 md:px-10 [scrollbar-color:var(--pv-border)_transparent]">
        <div className="flex w-max gap-5">
          {SOLUTIONS.map((s, i) => (
            <SolutionCard key={s.title} {...s} index={i} />
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
  index,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--pv-mx', `${x}%`);
    ref.current?.style.setProperty('--pv-my', `${y}%`);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.05 }}
      className="pv-spotlight pv-tactile relative flex h-[340px] w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-[20px] border border-[var(--pv-border)] bg-[var(--pv-surface)] p-8 md:h-[380px] md:w-[360px]"
    >
      <div className="flex items-center justify-between">
        <div
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-md border border-[var(--pv-border)] text-[var(--pv-ink)]"
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <span className="pv-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--pv-tertiary)]">
          0{index + 1} / 0{SOLUTIONS.length}
        </span>
      </div>

      <div>
        <h3 className="pv-display text-[clamp(24px,2.4vw,32px)] text-[var(--pv-ink)]">
          {title}
        </h3>
        <p className="mt-3 text-[14.5px] leading-[1.55] text-[var(--pv-secondary)]">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Industries — kinetic typography list, stagger reveal         */
/* ------------------------------------------------------------ */

const INDUSTRIES: ReadonlyArray<{ icon: LucideIcon; title: string; subtitle: string }> = [
  { icon: ShoppingBag, title: `E-commerce a${NBSP}maloobchod`, subtitle: 'Personalizace a automatizace prodeje' },
  { icon: Banknote, title: 'Finance a Fintech', subtitle: 'Automatizace a analýza rizik' },
  { icon: Stethoscope, title: 'Zdravotnictví a medtech', subtitle: 'Diagnostika, klinický výzkum a distribuce' },
  { icon: Factory, title: 'Výroba a logistika', subtitle: 'Prediktivní údržba a optimalizace' },
  { icon: Zap, title: 'Energetika a utility', subtitle: 'Predikce spotřeby a smart grids' },
  { icon: Headphones, title: `Zákaznická podpora a${NBSP}CX`, subtitle: `Chatboti a${NBSP}voiceboti 24/7` },
  { icon: Briefcase, title: 'Profesionální služby', subtitle: 'Právo, audit, konzulting a vzdělávání' },
];

function IndustriesList() {
  return (
    <section className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="03 · odvětví"
          title={`AI řešení pro${NBSP}vaše odvětví.`}
          lead="Oborově specifické AI implementace s měřitelným dopadem."
          ctaLabel="Všechna odvětví"
        />

        <div className="mt-14 border-t border-[var(--pv-border)]">
          {INDUSTRIES.map((ind, i) => (
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
  index,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  index: number;
}) {
  const [hover, setHover] = useState(false);

  return (
    <motion.a
      href="#"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      className="group block border-b border-[var(--pv-border)]"
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 py-7 md:py-9">
        <span className="pv-mono text-[11px] uppercase tracking-[0.16em] text-[var(--pv-tertiary)] md:w-12">
          0{index + 1}
        </span>

        <div className="flex items-center gap-5">
          <motion.div
            animate={{ rotate: hover ? 90 : 0, color: hover ? 'var(--pv-accent)' : 'var(--pv-secondary)' }}
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
              className="pv-display text-[clamp(28px,3.6vw,52px)] text-[var(--pv-ink)]"
            >
              {title}
            </motion.h3>
            <p className="mt-1.5 text-[14px] text-[var(--pv-secondary)] md:text-[15px]">
              {subtitle}
            </p>
          </div>
        </div>

        <motion.span
          animate={{ x: hover ? 6 : 0, rotate: hover ? -8 : 0, color: hover ? 'var(--pv-accent)' : 'var(--pv-tertiary)' }}
          transition={SPRING}
          className="inline-flex"
          aria-hidden
        >
          <ArrowUpRight size={26} strokeWidth={1.5} />
        </motion.span>
      </div>
    </motion.a>
  );
}

/* ------------------------------------------------------------ */
/*  Audit — 3 reálné tiery jako sticky stack                     */
/* ------------------------------------------------------------ */

const TIERS = [
  {
    tier: 'Tier 1',
    flag: 'Nejúplnější',
    name: 'Komplexní podnikový audit',
    price: `20${NBSP}000${NBSP}–${NBSP}90${NBSP}000${NBSP}Kč`,
    priceEur: `€800${NBSP}–${NBSP}€3${NBSP}600`,
    body: `Plný rozsah napříč technologií, byznysem a${NBSP}marketingem. Výstup: prezentace zjištění a${NBSP}konkrétní návrh integrace AI.`,
    deliverables: [
      'Hloubkový technický audit',
      'Audit obchodních procesů',
      'Audit marketingu a obsahu',
      'Návrh integrace AI',
      `90${NBSP}min prezentace zjištění`,
    ],
    cta: 'Spustit audit',
    primary: true,
  },
  {
    tier: 'Tier 2',
    flag: '',
    name: 'Doménový audit',
    price: `10${NBSP}000${NBSP}–${NBSP}55${NBSP}000${NBSP}Kč`,
    priceEur: `€400${NBSP}–${NBSP}€2${NBSP}200`,
    body: `Hloubková analýza jedné domény. Tech, obchod, marketing nebo AI — jeden směr, plný detail.`,
    deliverables: [
      'Jedna doména: tech, obchod, marketing nebo AI',
      'Hloubková analýza',
      'Konkrétní doporučení',
      `60${NBSP}min prezentace zjištění`,
    ],
    cta: 'Domluvit audit',
    primary: false,
  },
  {
    tier: 'Tier 3',
    flag: '',
    name: 'Strategická session',
    price: `4${NBSP}000${NBSP}–${NBSP}25${NBSP}000${NBSP}Kč`,
    priceEur: `€160${NBSP}–${NBSP}€1${NBSP}000`,
    body: `Krátká, fokusovaná session. Specifický problém, strukturovaný výstup, žádný dlouhý report.`,
    deliverables: [
      `1${NBSP}–${NBSP}3${NBSP}hodinová session`,
      'Specifický problém nebo otázka',
      'Strukturovaný výstup',
      'Bez dlouhého reportu',
    ],
    cta: 'Rezervovat session',
    primary: false,
  },
] as const;

function AuditStack() {
  return (
    <section className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="04 · audit"
          title="Audit."
          lead={`Než vám něco prodáme, chceme vidět, kde skutečně jste. Tři úrovně hloubky${NBSP}— vyberte podle rozsahu, který má smysl.`}
        />

        <div className="mt-16 space-y-6 md:space-y-10">
          {TIERS.map((tier, i) => (
            <StickyTier key={tier.name} tier={tier} index={i} />
          ))}
        </div>

        <p className="pv-mono mt-10 text-center text-[12.5px] text-[var(--pv-tertiary)]">
          Pro modulární projekty máme{NBSP}
          <a
            href="#"
            className="border-b border-[var(--pv-accent)] pb-0.5 text-[var(--pv-accent)] hover:text-[var(--pv-ink)] hover:border-[var(--pv-ink)]"
          >
            bezplatnou 30 min scoping call
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function StickyTier({
  tier,
  index,
}: {
  tier: (typeof TIERS)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.05 }}
      className="sticky border border-[var(--pv-border)] bg-[var(--pv-surface)]"
      style={{
        top: `calc(80px + ${index * 16}px)`,
        borderRadius: '20px',
      }}
    >
      <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-[2fr_3fr_2fr] md:gap-12 md:p-12">
        {/* Left — name */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="pv-mono text-[11px] uppercase tracking-[0.16em] text-[var(--pv-tertiary)]">
              {tier.tier}
            </span>
            {tier.flag && (
              <span className="rounded-full border border-[var(--pv-accent)] bg-[var(--pv-accent-soft)] px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-[var(--pv-accent)]">
                {tier.flag}
              </span>
            )}
          </div>
          <h3 className="pv-display mt-3 text-[clamp(32px,3.6vw,56px)] text-[var(--pv-ink)]">
            {tier.name}
          </h3>
        </div>

        {/* Middle — body + deliverables */}
        <div>
          <p className="text-[16px] leading-[1.6] text-[var(--pv-secondary)]">
            {tier.body}
          </p>
          <ul className="mt-6 space-y-2.5">
            {tier.deliverables.map((d, di) => (
              <li
                key={di}
                className="flex items-start gap-3 text-[14.5px] text-[var(--pv-ink)]"
              >
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 rotate-45 shrink-0 bg-[var(--pv-accent)]"
                />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — price + cta */}
        <div className="flex flex-col items-stretch justify-between gap-8 md:items-end">
          <div className="text-left md:text-right">
            <div className="pv-mono text-[26px] font-medium leading-tight text-[var(--pv-ink)] md:text-[32px]">
              {tier.price}
            </div>
            <div className="pv-mono mt-1 text-[13px] text-[var(--pv-tertiary)]">
              {tier.priceEur}
            </div>
          </div>
          <MagneticCta primary={tier.primary} compact>
            {tier.cta}
          </MagneticCta>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ */
/*  Contact — reálné kanály z kontakt.json                       */
/* ------------------------------------------------------------ */

const CHANNELS = [
  { label: 'EMAIL', value: 'hello@victaagency.com', note: `Odpovídáme do${NBSP}1 pracovního dne.` },
  { label: 'TELEFON', value: '+420 [TBD]', note: `Pondělí${NBSP}–${NBSP}pátek, 9:00${NBSP}–${NBSP}18:00.` },
  { label: 'ADRESA', value: 'Praha · Hradec Králové · Trutnov', note: 'Sídlo Victa Digital s.r.o.' },
  { label: 'SOCIÁLNÍ SÍTĚ', value: 'LinkedIn — připravujeme', note: 'Aktivujeme s první klientskou vlnou.' },
] as const;

function ContactSection() {
  return (
    <section className="relative px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-[6fr_5fr] md:gap-20">
          <div>
            <span className="pv-mono text-[12px] uppercase tracking-[0.18em] text-[var(--pv-tertiary)]">
              05 · kontakt
            </span>
            <h2 className="pv-display mt-5 max-w-[14ch] text-[clamp(48px,7vw,108px)] text-[var(--pv-ink)]">
              Domluvit
              <br />
              si{NBSP}<span className="text-[var(--pv-accent)]">hovor.</span>
            </h2>
            <p className="mt-7 max-w-[52ch] text-[17px] leading-[1.55] text-[var(--pv-secondary)]">
              Pro nové poptávky je nejrychlejší cesta rezervovat si bezplatnou
              30{NBSP}min konzultaci, nebo si vybrat tier auditu. Vrátíme se{NBSP}vám
              do{NBSP}2 pracovních dnů.
            </p>
            <div className="mt-10">
              <MagneticCta primary>Domluvit konzultaci</MagneticCta>
            </div>
          </div>

          <div className="border-t border-[var(--pv-border)]">
            {CHANNELS.map((c) => (
              <div
                key={c.label}
                className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-[var(--pv-border)] py-6"
              >
                <div>
                  <div className="pv-mono text-[11px] uppercase tracking-[0.14em] text-[var(--pv-tertiary)]">
                    {c.label}
                  </div>
                  <div className="mt-2 text-[19px] text-[var(--pv-ink)] md:text-[20px]">
                    {c.value}
                  </div>
                </div>
                <span className="pv-mono max-w-[26ch] text-right text-[12.5px] leading-[1.5] text-[var(--pv-secondary)]">
                  {c.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ */
/*  Footer disclaimer                                            */
/* ------------------------------------------------------------ */

function FootNote() {
  return (
    <footer className="border-t border-[var(--pv-border-soft)] px-6 py-12 md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="pv-mono text-[11px] uppercase tracking-[0.16em] text-[var(--pv-tertiary)]">
          /redesign-preview · taste-skill v1 · {new Date().getFullYear()}
        </div>
        <div className="text-[13px] text-[var(--pv-secondary)]">
          Pouze náhled. Locked design tokeny netknuté. Roman a Tobiáš
          rozhodnou, kterým směrem redesign skutečně půjde.
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------ */
/*  Section header — eyebrow + title + lead + optional CTA       */
/* ------------------------------------------------------------ */

function SectionHeader({
  eyebrow,
  title,
  lead,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  ctaLabel?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      transition={{ ...SPRING }}
      variants={REVEAL}
      className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_7fr] md:gap-16"
    >
      <div className="pv-mono text-[12px] uppercase tracking-[0.18em] text-[var(--pv-tertiary)]">
        {eyebrow}
      </div>
      <div>
        <h2 className="pv-display max-w-[18ch] text-[clamp(36px,4.6vw,68px)] text-[var(--pv-ink)]">
          {title}
        </h2>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.55] text-[var(--pv-secondary)]">
          {lead}
        </p>
        {ctaLabel && (
          <div className="mt-8">
            <MagneticCta>{ctaLabel}</MagneticCta>
          </div>
        )}
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
}: {
  children: React.ReactNode;
  primary?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const [hover, setHover] = useState(false);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
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
    <motion.a
      ref={ref}
      href="#"
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      style={{ x: springX, y: springY }}
      className={`pv-tactile relative inline-flex items-center gap-2.5 rounded-full border ${padding} ${
        primary
          ? 'border-[var(--pv-accent)] bg-[var(--pv-accent)] text-[var(--pv-bg)]'
          : 'border-[var(--pv-border)] bg-transparent text-[var(--pv-ink)] hover:border-[var(--pv-ink)]'
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
    </motion.a>
  );
}

/* ============================================================
   NAV · top header with mega-menu dropdown
   Mirrors VICTA Nav semantics:
   - 3 dropdown triggers (Služby / Řešení / Odvětví)
   - 3 plain links (Spolupráce / O nás / Kontakt)
   - Hover-with-180ms-delay opens panel · 120ms grace on leave
   - Mobile: hamburger → accordion drawer
   ============================================================ */

type DropdownKey = 'services' | 'solutions' | 'industries';

const HOVER_OPEN_DELAY_MS = 180;
const HOVER_CLOSE_GRACE_MS = 120;

const NAV_LINKS: ReadonlyArray<{ key: string; label: string; href: string }> = [
  { key: 'collaboration', label: 'Spolupráce', href: '#' },
  { key: 'about', label: 'O nás', href: '#' },
  { key: 'contact', label: 'Kontakt', href: '#' },
];

const NAV_DROPDOWNS: ReadonlyArray<{ key: DropdownKey; label: string; href: string }> = [
  { key: 'services', label: 'Služby', href: '#01' },
  { key: 'solutions', label: 'Řešení', href: '#02' },
  { key: 'industries', label: 'Odvětví', href: '#03' },
];

type MegaSidebar = {
  eyebrow: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

type MegaPanelData = {
  sidebar: MegaSidebar;
  items: ReadonlyArray<{ icon: LucideIcon; title: string; subtitle: string }>;
};

const MEGA_MAP: Record<DropdownKey, MegaPanelData> = {
  services: {
    sidebar: {
      eyebrow: 'Služby',
      headline: 'Pro vaši AI cestu.',
      description: `Od auditu a${NBSP}strategie přes datovou přípravu až po provoz a${NBSP}governance.`,
      ctaLabel: 'Všechny služby',
      ctaHref: '#01',
    },
    items: SERVICES.map((s) => ({ icon: s.icon, title: s.title, subtitle: s.subtitle })),
  },
  solutions: {
    sidebar: {
      eyebrow: 'Řešení',
      headline: `AI řešení na${NBSP}míru.`,
      description: 'Od znalostních asistentů po vlastní AI infrastrukturu.',
      ctaLabel: 'Všechna řešení',
      ctaHref: '#02',
    },
    items: SOLUTIONS,
  },
  industries: {
    sidebar: {
      eyebrow: 'Odvětví',
      headline: `Pro vaše odvětví.`,
      description: 'Oborově specifické AI implementace s měřitelným dopadem.',
      ctaLabel: 'Všechna odvětví',
      ctaHref: '#03',
    },
    items: INDUSTRIES,
  },
};

function PreviewNav() {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<DropdownKey | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idPrefix = useId();
  const panelId = `${idPrefix}-megamenu`;

  const cancelHover = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const closeDropdown = () => {
    cancelHover();
    setOpenDropdown(null);
  };

  const scheduleOpen = (key: DropdownKey) => {
    cancelHover();
    if (openDropdown && openDropdown !== key) {
      // Switch instantly when moving between triggers
      setOpenDropdown(key);
      return;
    }
    hoverTimer.current = setTimeout(() => setOpenDropdown(key), HOVER_OPEN_DELAY_MS);
  };

  const toggleDropdown = (key: DropdownKey) => {
    cancelHover();
    setOpenDropdown((cur) => (cur === key ? null : key));
  };

  // Cleanup
  useEffect(() => {
    return () => cancelHover();
  }, []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [mobileOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Top disclaimer strip */}
      <div className="border-b border-[var(--pv-border-soft)] bg-[var(--pv-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-2 md:px-10">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="pv-mono text-[var(--pv-tertiary)] uppercase tracking-[0.16em]">
              náhled · taste-skill
            </span>
            <span aria-hidden className="hidden h-3 w-px bg-[var(--pv-border)] sm:inline-block" />
            <span className="hidden text-[var(--pv-secondary)] sm:inline">
              Locked tokeny netknuté · pouze náhled
            </span>
          </div>
          <Link
            href="/cs"
            className="pv-tactile inline-flex items-center gap-1.5 text-[11px] text-[var(--pv-secondary)] hover:text-[var(--pv-accent)]"
          >
            Na živý web
            <ArrowUpRight size={12} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Main nav row */}
      <div
        className="relative border-b border-[var(--pv-border)] bg-[var(--pv-bg)]/85 backdrop-blur-xl"
        onMouseLeave={() => {
          cancelHover();
          hoverTimer.current = setTimeout(() => setOpenDropdown(null), HOVER_CLOSE_GRACE_MS);
        }}
        onMouseEnter={cancelHover}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 md:px-10">
          {/* Logo */}
          <a href="#" className="inline-flex items-baseline gap-3">
            <span className="pv-display text-[20px] font-medium tracking-[-0.02em] text-[var(--pv-ink)]">
              VICTA
            </span>
            <span className="pv-mono hidden text-[11px] uppercase tracking-[0.18em] text-[var(--pv-tertiary)] sm:inline">
              / digital agency
            </span>
          </a>

          {/* Desktop nav items */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_DROPDOWNS.map((item) => {
              const isOpen = openDropdown === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleDropdown(item.key)}
                  onMouseEnter={() => scheduleOpen(item.key)}
                  onFocus={() => setOpenDropdown(item.key)}
                  className={`pv-tactile relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] transition-colors ${
                    isOpen
                      ? 'bg-[var(--pv-surface)] text-[var(--pv-ink)]'
                      : 'text-[var(--pv-secondary)] hover:bg-[var(--pv-surface)] hover:text-[var(--pv-ink)]'
                  }`}
                >
                  <span>{item.label}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={SPRING}
                    aria-hidden
                    className="inline-flex"
                  >
                    <ChevronDown size={13} strokeWidth={1.75} />
                  </motion.span>
                </button>
              );
            })}

            <span aria-hidden className="mx-2 h-4 w-px bg-[var(--pv-border)]" />

            {NAV_LINKS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="pv-tactile rounded-full px-4 py-2 text-[13.5px] text-[var(--pv-secondary)] transition-colors hover:bg-[var(--pv-surface)] hover:text-[var(--pv-ink)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side — desktop CTA + mobile hamburger */}
          <div className="flex items-center gap-3">
            <a
              href="#04"
              className="pv-tactile hidden items-center gap-2 rounded-full border border-[var(--pv-accent)] bg-[var(--pv-accent)] px-5 py-2 text-[13px] text-[var(--pv-bg)] md:inline-flex"
            >
              Spustit audit
              <ArrowUpRight size={14} strokeWidth={1.75} />
            </a>

            <button
              type="button"
              aria-label={mobileOpen ? 'Zavřít menu' : 'Otevřít menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="pv-tactile grid size-9 place-items-center rounded-full border border-[var(--pv-border)] text-[var(--pv-ink)] hover:border-[var(--pv-ink)] md:hidden"
            >
              {mobileOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
            </button>
          </div>
        </div>

        {/* Mega-menu panel */}
        <MegaMenuPanel
          openKey={openDropdown}
          panelId={panelId}
          onClose={closeDropdown}
        />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer
        open={mobileOpen}
        expanded={mobileExpanded}
        onClose={() => {
          setMobileOpen(false);
          setMobileExpanded(null);
        }}
        onToggle={(k) => setMobileExpanded((cur) => (cur === k ? null : k))}
      />
    </header>
  );
}

/* ------------------------------------------------------------ */
/*  Mega-menu panel · asymmetric, stagger reveal, AnimatePresence */
/* ------------------------------------------------------------ */

function MegaMenuPanel({
  openKey,
  panelId,
  onClose,
}: {
  openKey: DropdownKey | null;
  panelId: string;
  onClose: () => void;
}) {
  const data = openKey ? MEGA_MAP[openKey] : null;

  return (
    <AnimatePresence mode="wait">
      {data && (
        <motion.div
          key={openKey}
          id={panelId}
          role="region"
          initial={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
          transition={SPRING}
          className="absolute inset-x-0 top-full z-40 border-t border-b border-[var(--pv-border-soft)] bg-[var(--pv-surface)]/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-10 px-6 py-12 md:px-10 md:py-14">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING, delay: 0.04 }}
              className="col-span-12 md:col-span-4"
            >
              <span className="pv-mono text-[11px] uppercase tracking-[0.18em] text-[var(--pv-tertiary)]">
                {data.sidebar.eyebrow}
              </span>
              <h3 className="pv-display mt-3 max-w-[14ch] text-[clamp(28px,2.6vw,40px)] text-[var(--pv-ink)]">
                {data.sidebar.headline}
              </h3>
              <p className="mt-3 max-w-[40ch] text-[14.5px] leading-[1.55] text-[var(--pv-secondary)]">
                {data.sidebar.description}
              </p>
              <a
                href={data.sidebar.ctaHref}
                onClick={onClose}
                className="pv-tactile mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--pv-border)] px-4 py-2 text-[13px] text-[var(--pv-ink)] hover:border-[var(--pv-accent)] hover:text-[var(--pv-accent)]"
              >
                {data.sidebar.ctaLabel}
                <ArrowUpRight size={14} strokeWidth={1.75} />
              </a>
            </motion.div>

            {/* Items grid */}
            <ul className="col-span-12 grid grid-cols-1 gap-1 md:col-span-8 md:grid-cols-2">
              {data.items.map((item, i) => (
                <MegaItem
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  index={i}
                  onClick={onClose}
                />
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MegaItem({
  icon: Icon,
  title,
  subtitle,
  index,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(false);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--pv-mx', `${x}%`);
    ref.current?.style.setProperty('--pv-my', `${y}%`);
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.06 + index * 0.03 }}
    >
      <a
        ref={ref}
        href="#"
        onClick={onClick}
        onMouseMove={onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="pv-spotlight pv-tactile group relative grid grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[12px] p-4 transition-colors hover:bg-[var(--pv-bg)]/60"
      >
        <motion.div
          animate={{
            borderColor: hover ? 'var(--pv-accent)' : 'var(--pv-border)',
            color: hover ? 'var(--pv-accent)' : 'var(--pv-ink)',
          }}
          transition={SPRING}
          aria-hidden
          className="grid size-9 place-items-center rounded-md border"
        >
          <Icon size={17} strokeWidth={1.5} />
        </motion.div>

        <div className="min-w-0">
          <div className="pv-display text-[15.5px] font-medium leading-tight text-[var(--pv-ink)]">
            {title}
          </div>
          <div className="mt-1 text-[13px] leading-[1.45] text-[var(--pv-secondary)]">
            {subtitle}
          </div>
        </div>

        <motion.span
          animate={{ x: hover ? 4 : 0, opacity: hover ? 1 : 0.35 }}
          transition={SPRING}
          aria-hidden
          className="self-center text-[var(--pv-tertiary)] group-hover:text-[var(--pv-accent)]"
        >
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </motion.span>
      </a>
    </motion.li>
  );
}

/* ------------------------------------------------------------ */
/*  Mobile drawer · full-screen, accordion expand                */
/* ------------------------------------------------------------ */

function MobileDrawer({
  open,
  expanded,
  onClose,
  onToggle,
}: {
  open: boolean;
  expanded: DropdownKey | null;
  onClose: () => void;
  onToggle: (k: DropdownKey) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={SPRING}
          className="border-t border-[var(--pv-border)] bg-[var(--pv-bg)] md:hidden"
        >
          <ul className="mx-auto flex max-w-[1400px] flex-col gap-1 px-6 py-4">
            {NAV_DROPDOWNS.map((item) => {
              const data = MEGA_MAP[item.key];
              const isExpanded = expanded === item.key;
              return (
                <li
                  key={item.key}
                  className="border-b border-[var(--pv-border-soft)] last:border-b-0"
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => onToggle(item.key)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3.5 text-[16px] text-[var(--pv-ink)]"
                  >
                    <span>{item.label}</span>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={SPRING}
                      aria-hidden
                      className="inline-flex text-[var(--pv-tertiary)]"
                    >
                      <ChevronDown size={16} strokeWidth={1.75} />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SPRING}
                        className="overflow-hidden pb-3 pl-3 pr-1"
                      >
                        {data.items.map((child, idx) => {
                          const Icon = child.icon;
                          return (
                            <li key={`${idx}-${child.title}`}>
                              <a
                                href="#"
                                onClick={onClose}
                                className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-[var(--pv-surface)]"
                              >
                                <Icon
                                  size={17}
                                  strokeWidth={1.5}
                                  aria-hidden
                                  className="mt-1 shrink-0 text-[var(--pv-tertiary)]"
                                />
                                <span className="flex flex-col">
                                  <span className="text-[14.5px] font-medium leading-tight text-[var(--pv-ink)]">
                                    {child.title}
                                  </span>
                                  <span className="text-[12.5px] leading-[1.45] text-[var(--pv-secondary)]">
                                    {child.subtitle}
                                  </span>
                                </span>
                              </a>
                            </li>
                          );
                        })}
                        <li className="mt-2">
                          <a
                            href={data.sidebar.ctaHref}
                            onClick={onClose}
                            className="block rounded-md px-3 py-2 text-[13.5px] text-[var(--pv-accent)]"
                          >
                            {data.sidebar.ctaLabel} →
                          </a>
                        </li>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}

            {NAV_LINKS.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  onClick={onClose}
                  className="block rounded-md px-3 py-3.5 text-[16px] text-[var(--pv-secondary)] hover:bg-[var(--pv-surface)] hover:text-[var(--pv-ink)]"
                >
                  {item.label}
                </a>
              </li>
            ))}

            <li className="mt-3">
              <a
                href="#04"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-full border border-[var(--pv-accent)] bg-[var(--pv-accent)] px-5 py-3 text-[14px] text-[var(--pv-bg)]"
              >
                Spustit audit
                <ArrowUpRight size={15} strokeWidth={1.75} />
              </a>
            </li>
          </ul>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
