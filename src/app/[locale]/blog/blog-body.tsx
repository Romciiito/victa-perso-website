'use client';

import { useLocale, useTranslations } from 'next-intl';
import { m, type Variants } from 'framer-motion';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { NewsletterSignup } from '@/components/forms/newsletter-signup';
import { useCalModal } from '@/components/booking/use-cal-modal';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export function BlogBody() {
  const t = useTranslations('blog');
  const tCta = useTranslations('common.ctaBand');
  const tCommon = useTranslations('common');
  const locale = useLocale() === 'en' ? ('en' as const) : ('cs' as const);
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}/blog`,
  });

  return (
    <>
      {/* ---- Hero ---- */}
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
        ctas={[
          { label: tCta('primaryCta'), onClick: openCal, primary: true },
          { label: t('hero.subscribeCta'), href: '#newsletter' },
        ]}
        anchors={[
          { label: t('anchors.comingSoon'), href: '#coming-soon' },
          { label: t('anchors.newsletter'), href: '#newsletter' },
        ]}
        anchorNavLabel={tCommon('pageSectionsNavLabel')}
      />

      {/* ---- 01 · Připravujeme ---- */}
      <section
        id="coming-soon"
        className="relative border-t border-border px-6 py-24 md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={`01 · ${t('comingSoon.label').toLowerCase()}`}
            title={t('comingSoon.headline')}
            lead={t('comingSoon.body')}
          />

          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={{ ...SPRING, delay: 0.18 }}
            variants={REVEAL}
            className="mt-16 flex justify-center"
          >
            <div
              className="w-full max-w-[640px] rounded-card border border-border bg-surface px-10 py-12 text-center"
            >
              <p
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-tertiary"
              >
                {t('comingSoon.badge')}
              </p>
              <p
                className="mt-6 text-[clamp(28px,3.5vw,48px)] font-medium leading-[1.1] tracking-[-0.03em] text-ink"
              >
                {t('comingSoon.headline')}
              </p>
              <p className="mt-5 text-[15px] leading-[1.6] text-secondary">
                {t('comingSoon.body')}
              </p>
            </div>
          </m.div>
        </div>
      </section>

      {/* ---- 02 · Newsletter ---- */}
      <section
        id="newsletter"
        className="relative border-t border-border bg-surface px-6 py-24 md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={`02 · ${t('newsletter.label').toLowerCase()}`}
            title={t('newsletter.headline')}
            lead={t('newsletter.body')}
          />

          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={{ ...SPRING, delay: 0.14 }}
            variants={REVEAL}
            className="mt-16 flex justify-center"
          >
            <div
              className="w-full max-w-[520px] rounded-card border border-border bg-bg px-8 py-10"
            >
              <NewsletterSignup locale={locale} formLocation="blog" />
            </div>
          </m.div>
        </div>
      </section>
    </>
  );
}
