'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { m, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/page-hero';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { useCalModal } from '@/components/booking/use-cal-modal';

/* ============================================================
   Service detail body · D-008 taste-skill
   Single template that renders conditional sections based on what
   content is available per service. All 18 services share this
   shell — rich items (7) get all sections, sparse items (11) get
   just hero + CTA + back.

   Sections (in order):
     PageHero (always)
     "Pro koho je vhodné" (if `fit` present)
     "Časté dotazy" (if `faq.length > 0`)
     CTA band + back link (always)
   ============================================================ */

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type ServiceDetailItem = {
  name: string;
  desc: string;
  slug: string;
  categorySlug: string;
  categoryLabel?: string;
  fit?: string;
  faq?: ReadonlyArray<{ q: string; a: string }>;
};

export function ServiceBody({ item }: { item: ServiceDetailItem }) {
  const t = useTranslations('sluzby.detail');
  // Strip the "Hodí se pro: " (CS) / "Fits: " (EN) prefix from fit if present.
  const fit = item.fit ? item.fit.replace(/^(Hodí se pro|Fits):\s*/i, '') : null;
  const hasFaq = Array.isArray(item.faq) && item.faq.length > 0;
  const tCta = useTranslations('common.ctaBand');
  const locale = useLocale();
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}/sluzby/${item.slug}`,
  });

  return (
    <>
      <PageHero
        status={`/${locale}/sluzby/${item.slug}`}
        eyebrow={item.categoryLabel ?? t('eyebrowFallback')}
        headline={`${item.name}.`}
        sub={item.desc}
        ctas={[{ label: tCta('primaryCta'), onClick: openCal, primary: true }]}
      />

      {/* "Pro koho je vhodné" — rendered only if fit present */}
      {fit && (
        <section
          className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
              <div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  01 · {t('whoEyebrow')}
                </span>
                <m.h2
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-15%' }}
                  transition={SPRING}
                  variants={REVEAL}
                  className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink"
                >
                  {t('whoHeading')}
                </m.h2>
              </div>
              <m.p
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-15%' }}
                transition={{ ...SPRING, delay: 0.05 }}
                variants={REVEAL}
                className="max-w-[58ch] text-[18px] leading-[1.6] text-secondary"
              >
                {fit}
              </m.p>
            </div>
          </div>
        </section>
      )}

      {/* FAQ — rendered only if faq[] present and non-empty */}
      {hasFaq && (
        <section className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
              <div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  {fit ? '02' : '01'} · {t('faqEyebrow')}
                </span>
                <m.h2
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-15%' }}
                  transition={SPRING}
                  variants={REVEAL}
                  className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink"
                >
                  {t('faqHeading')}
                </m.h2>
              </div>
              <ul className="border-t border-border">
                {item.faq!.map((entry, i) => (
                  <FaqRow key={i} q={entry.q} a={entry.a} index={i} />
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* CTA band + back link */}
      <section className="relative border-t border-border-soft px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              {tCta('eyebrow')}
            </span>
            <h2 className="display mt-5 max-w-[14ch] text-[clamp(36px,5vw,68px)] text-ink">
              {tCta('headline')}
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.55] text-secondary">
              {tCta('bodyService')}
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
              {tCta('auditLink')}
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[1400px]">
          <Link
            href="/sluzby"
            className="tactile inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-tertiary hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            {t('backLink')}
          </Link>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ row — accordion expand-on-click                                 */
/* ------------------------------------------------------------------ */

function FaqRow({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <m.li
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      variants={REVEAL}
      className="border-b border-border"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-start justify-between gap-6 py-6 text-left"
      >
        <span className="display max-w-[52ch] text-[clamp(18px,2vw,22px)] text-ink">
          {q}
        </span>
        <m.span
          animate={{ rotate: open ? 180 : 0, color: open ? 'var(--accent)' : 'var(--tertiary)' }}
          transition={SPRING}
          aria-hidden
          className="mt-1 shrink-0"
        >
          <ChevronDown size={20} strokeWidth={1.75} />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            className="overflow-hidden"
          >
            <p className="max-w-[58ch] pb-6 text-[16px] leading-[1.65] text-secondary">
              {a}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </m.li>
  );
}
