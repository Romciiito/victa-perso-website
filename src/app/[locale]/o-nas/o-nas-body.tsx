'use client';

import { useLocale, useTranslations } from 'next-intl';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { ValuesGrid, type ValueItem } from '@/components/sections/values-grid';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { AskAiSection } from '@/components/sections/ask-ai';
import { useCalModal } from '@/components/booking/use-cal-modal';
import { Link } from '@/i18n/navigation';
import { m, type Variants } from 'framer-motion';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

type RawValue = { label: string; body: string };
type ProcessStep = { num: string; label: string; body: string };

/* ================================================================== */
export function ONasBody() {
  const t = useTranslations('oNas');
  const tCta = useTranslations('common.ctaBand');
  const tCommon = useTranslations('common');
  const rawValues = t.raw('sections.values.items') as ReadonlyArray<RawValue>;
  const PROCESS_STEPS = t.raw('sections.process.steps') as ReadonlyArray<ProcessStep>;
  const locale = useLocale();
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}/o-nas`,
  });

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
          { label: t('anchors.story'), href: '#story' },
          { label: t('anchors.values'), href: '#values' },
          { label: t('anchors.process'), href: '#process' },
        ]}
        anchorNavLabel={tCommon('pageSectionsNavLabel')}
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
              <m.div
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
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 04 · Stav ---- */}
      <section className="relative bg-surface px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1400px]">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={SPRING}
            variants={REVEAL}
            className="inline-flex items-center gap-3 rounded-full border border-border bg-bg px-5 py-3"
          >
            <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-secondary">
              {t('statusLinePrefix')} · {t('sections.team.headline')}
            </span>
          </m.div>
          <m.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={{ ...SPRING, delay: 0.12 }}
            variants={REVEAL}
            className="mt-6 max-w-[58ch] text-[17px] leading-[1.55] text-secondary"
          >
            {t('sections.team.body')}
          </m.p>
        </div>
      </section>

      {/* ---- 04 · Zeptejte se na nás AI ---- */}
      <AskAiSection eyebrow={t('askAiEyebrow')} />

      {/* ---- CTA band ---- */}
      <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              {t('ctaEyebrow')}
            </span>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('cta.headline')}
            </h2>
            <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.55] text-secondary">
              {t('cta.body')}
            </p>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary onClick={openCal}>
              {tCta('primaryCta')}
            </MagneticCta>
            <Link
              href="/spoluprace"
              className="tactile text-[14px] text-secondary underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
            >
              {t('cta.button')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
