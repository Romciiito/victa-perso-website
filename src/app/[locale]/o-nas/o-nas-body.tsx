'use client';

import { useTranslations } from 'next-intl';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { ValuesGrid, type ValueItem } from '@/components/sections/values-grid';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { motion, type Variants } from 'framer-motion';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

type RawValue = { label: string; body: string };

const PROCESS_STEPS = [
  { num: '01', label: 'Posloucháme', body: 'Než cokoliv navrhneme, chceme rozumět vašemu byznysu a cílům.' },
  { num: '02', label: 'Navrhujeme', body: 'Audit → strategie → konkrétní návrh s jasnými výstupy a cenou.' },
  { num: '03', label: 'Stavíme', body: 'Implementace s check-pointy. Žádná překvapení na konci projektu.' },
  { num: '04', label: 'Provozujeme', body: 'Po launchi nezmizneme — správa, monitoring, iterace a růst.' },
];

/* ================================================================== */
export function ONasBody() {
  const t = useTranslations('oNas');
  const rawValues = t.raw('sections.values.items') as ReadonlyArray<RawValue>;

  const valueItems: ReadonlyArray<ValueItem> = rawValues.map((v) => ({
    label: v.label,
    body: v.body,
  }));

  return (
    <>
      {/* ---- Hero ---- */}
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
        anchors={[
          { label: 'Příběh', href: '#story' },
          { label: 'Hodnoty', href: '#values' },
          { label: 'Proces', href: '#process' },
        ]}
      />

      {/* ---- 01 · Příběh ---- */}
      <section id="story" className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={`01 · ${t('sections.story.label').toLowerCase()}`}
            title={t('sections.story.headline')}
            lead={t('sections.story.body')}
          />
        </div>
      </section>

      {/* ---- 02 · Hodnoty ---- */}
      <section id="values" className="relative bg-surface px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={`02 · ${t('sections.values.label').toLowerCase()}`}
            title={t('sections.values.headline')}
            lead=""
          />
          <ValuesGrid items={valueItems} />
        </div>
      </section>

      {/* ---- 03 · Proces ---- */}
      <section id="process" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={`03 · ${t('sections.process.label').toLowerCase()}`}
            title={t('sections.process.headline')}
            lead={t('sections.process.body')}
          />
          <div className="mt-14 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-10%' }}
                transition={{ ...SPRING, delay: i * 0.07 }}
                variants={REVEAL}
                className="flex flex-col gap-4 bg-bg p-8 md:p-10"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                  {step.num}
                </span>
                <h3
                  className="text-ink"
                  style={{ fontSize: 'clamp(20px,2vw,26px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}
                >
                  {step.label}
                </h3>
                <p className="text-[15px] leading-[1.6] text-secondary">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 04 · Stav ---- */}
      <section className="relative bg-surface px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={SPRING}
            variants={REVEAL}
            className="inline-flex items-center gap-3 rounded-full border border-border bg-bg px-5 py-3"
          >
            <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-secondary">
              AI-augmented · pod jednou střechou · {t('sections.team.headline')}
            </span>
          </motion.div>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={{ ...SPRING, delay: 0.12 }}
            variants={REVEAL}
            className="mt-6 max-w-[58ch] text-[17px] leading-[1.55] text-secondary"
          >
            {t('sections.team.body')}
          </motion.p>
        </div>
      </section>

      {/* ---- CTA band ---- */}
      <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              05 · další krok
            </span>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('cta.headline')}
            </h2>
            <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.55] text-secondary">
              {t('cta.body')}
            </p>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary href="/spoluprace#audit">
              {t('cta.button')}
            </MagneticCta>
            <MagneticCta href="/kontakt">Domluvit konzultaci</MagneticCta>
          </div>
        </div>
      </section>
    </>
  );
}
