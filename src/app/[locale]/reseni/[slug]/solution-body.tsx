'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/page-hero';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { useCalModal } from '@/components/booking/use-cal-modal';

/* ============================================================
   Solution detail body · D-008 taste-skill (lean per content)
   /reseni JSON items hold only `body` (one paragraph) + `audience`
   (one line), so the detail page is intentionally single-card:
     - hero with eyebrow label, name, body, dual CTA, status path
     - audience block (who this fits)
     - CTA band + back link
   When richer content (problem / approach / process) arrives, this
   body can be extended to match the /odvetvi/[slug] depth.
   ============================================================ */

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type SolutionItem = {
  key: string;
  label: string;
  name: string;
  body: string;
  audience: string;
  slug: string;
};

export function SolutionBody({ item }: { item: SolutionItem }) {
  // The audience field reads "Hodí se pro: výrobní firmy, ..." — strip the
  // prefix so the section can render its own heading and keep the list clean.
  const audience = item.audience.replace(/^Hodí se pro:\s*/i, '');
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/cs/reseni/${item.slug}`,
  });

  return (
    <>
      <PageHero
        status={`/cs/reseni/${item.slug}`}
        eyebrow={item.label}
        headline={`${item.name}.`}
        sub={item.body}
        ctas={[
          { label: 'Rezervovat audit', href: '/spoluprace#audit', primary: true },
          { label: 'Domluvit konzultaci', onClick: openCal },
        ]}
      />

      {/* Audience — "Pro koho je vhodné" */}
      <section
        className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                01 · pro koho
              </span>
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-15%' }}
                transition={SPRING}
                variants={REVEAL}
                className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink"
              >
                Komu to dává smysl.
              </motion.h2>
            </div>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-15%' }}
              transition={{ ...SPRING, delay: 0.05 }}
              variants={REVEAL}
              className="max-w-[58ch] text-[18px] leading-[1.6] text-secondary"
            >
              {audience}
            </motion.p>
          </div>
        </div>
      </section>

      {/* CTA band + back link */}
      <section className="relative border-t border-border-soft px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              další krok
            </span>
            <h2 className="display mt-5 max-w-[14ch] text-[clamp(36px,5vw,68px)] text-ink">
              Audit ukáže, kde začít.
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.55] text-secondary">
              Dvoutýdenní diagnostika napříč tech, byznysem a marketingem.
              Výstup: prezentace zjištění a konkrétní návrh, jak {item.name.toLowerCase()} zapojit
              do vašeho stacku.
            </p>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary href="/spoluprace#audit">
              Rezervovat audit
            </MagneticCta>
            <MagneticCta onClick={openCal}>Domluvit konzultaci</MagneticCta>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[1400px]">
          <Link
            href="/reseni"
            className="tactile inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-tertiary hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            Všechna řešení
          </Link>
        </div>
      </section>
    </>
  );
}
