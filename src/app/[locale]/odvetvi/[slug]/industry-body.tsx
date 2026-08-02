'use client';

import {
  motion,
  type Variants,
} from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Factory,
  Truck,
  Briefcase,
  Landmark,
  Zap,
  Stethoscope,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/page-hero';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { useCalModal } from '@/components/booking/use-cal-modal';

/* ============================================================
   Industry detail body · D-008 taste-skill
   Composition: hero → "problem" prose → "approach" prose →
   numbered process steps → back link + CTA band.
   Content shape mirrors content/cs/strings/common.json
   odvetvi.items[i] schema.
   ============================================================ */

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type IndustryItem = {
  key: string;
  icon: string;
  name: string;
  body: string;
  slug: string;
  sections: {
    problem: string;
    approach: string;
    process: ReadonlyArray<{ title: string; body: string }>;
  };
};

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Factory,
  Truck,
  Briefcase,
  Landmark,
  Zap,
  Stethoscope,
  Headphones,
};

/** Split prose text on `\n\n` paragraph boundaries and render `<p>` blocks. */
function paragraphs(text: string) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function IndustryBody({ item }: { item: IndustryItem }) {
  const Icon = ICON_MAP[item.icon] ?? Briefcase;
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/cs/odvetvi/${item.slug}`,
  });

  return (
    <>
      <PageHero
        status={`/cs/odvetvi/${item.slug}`}
        eyebrow="odvětví"
        headline={`${item.name}.`}
        sub={item.body}
        ctas={[{ label: 'Chci konzultaci', onClick: openCal, primary: true }]}
      />

      {/* 01 · problem */}
      <section className="relative px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
            <div>
              <div className="flex items-center gap-3">
                <div
                  aria-hidden
                  className="grid size-10 place-items-center rounded-md border border-border text-accent"
                >
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  01 · problém
                </span>
              </div>
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-15%' }}
                transition={SPRING}
                variants={REVEAL}
                className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink"
              >
                S čím přicházejí klienti.
              </motion.h2>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-15%' }}
              transition={{ ...SPRING, delay: 0.05 }}
              variants={REVEAL}
              className="max-w-[64ch] space-y-5 text-[17px] leading-[1.65] text-secondary"
            >
              {paragraphs(item.sections.problem).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 02 · approach */}
      <section
        className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                02 · jak na to
              </span>
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-15%' }}
                transition={SPRING}
                variants={REVEAL}
                className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink"
              >
                Jak to děláme.
              </motion.h2>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-15%' }}
              transition={{ ...SPRING, delay: 0.05 }}
              variants={REVEAL}
              className="max-w-[64ch] space-y-5 text-[17px] leading-[1.65] text-secondary"
            >
              {paragraphs(item.sections.approach).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 03 · process */}
      <section className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                03 · jak postupujeme
              </span>
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-15%' }}
                transition={SPRING}
                variants={REVEAL}
                className="display mt-6 max-w-[18ch] text-[clamp(32px,4vw,52px)] text-ink"
              >
                {item.sections.process.length} kroků od auditu k růstu.
              </motion.h2>
            </div>

            <ol className="space-y-12">
              {item.sections.process.map((step, i) => (
                <motion.li
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ ...SPRING, delay: i * 0.05 }}
                  variants={REVEAL}
                  className="grid grid-cols-[auto_1fr] gap-6"
                >
                  <span className="font-mono text-[14px] tabular-nums text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="display text-[clamp(22px,2.4vw,30px)] text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-[58ch] text-[16px] leading-[1.6] text-secondary">
                      {step.body}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA + back link */}
      <section className="relative border-t border-border-soft px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              další krok
            </span>
            <h2 className="display mt-5 max-w-[14ch] text-[clamp(36px,5vw,68px)] text-ink">
              Nejdřív bezplatný hovor.
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.55] text-secondary">
              30 minut, bez závazku. Probereme, co ve vašem odvětví řešíte,
              a doporučíme další krok — u větších projektů
              i placený audit celého stacku.
            </p>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary onClick={openCal}>
              Chci konzultaci
            </MagneticCta>
            <Link
              href="/spoluprace"
              className="tactile text-[14px] text-secondary underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
            >
              Nebo rovnou placený audit →
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[1400px]">
          <Link
            href="/odvetvi"
            className="tactile inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-tertiary hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            Všechna odvětví
          </Link>
        </div>
      </section>
    </>
  );
}
