'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { m, type Variants } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { ContactChannels, type ChannelItem } from '@/components/sections/contact-channels';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { ContactForm } from '@/components/forms/contact-form';
import { NewsletterSignup } from '@/components/forms/newsletter-signup';
import { useCalModal } from '@/components/booking/use-cal-modal';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export function KontaktBody() {
  const t = useTranslations('kontakt');
  const tCommon = useTranslations('common');
  const locale = useLocale() === 'en' ? ('en' as const) : ('cs' as const);

  // Booking is the preferred path — but this page hosts the contact form
  // itself, so the not-provisioned fallback scrolls to #form instead of
  // looping back to /kontakt (the pre-v2 CTA loop).
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}/kontakt`,
    fallbackHref: '#form',
  });

  const scrollToForm = () => {
    document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const channels: ReadonlyArray<ChannelItem> = [
    {
      icon: Mail,
      label: t('channels.email.label'),
      value: t('channels.email.value'),
      href: `mailto:${t('channels.email.value')}`,
      note: t('channels.email.note'),
    },
    {
      icon: Phone,
      label: t('channels.phone.label'),
      value: t('channels.phone.value'),
      href: `tel:${t('channels.phone.value').replace(/\s+/g, '')}`,
      note: t('channels.phone.note'),
    },
    {
      icon: MapPin,
      label: t('channels.address.label'),
      value: t('channels.address.value'),
      note: t('channels.address.note'),
    },
    {
      icon: Globe,
      label: t('channels.social.label'),
      value: t('channels.social.value'),
      note: t('channels.social.note'),
    },
  ];

  return (
    <>
      {/* ---- Hero ---- */}
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
        ctas={[
          { label: t('primary.cta'), onClick: openCal, primary: true },
          { label: t('hero.formCta'), onClick: scrollToForm },
        ]}
        anchors={[
          { label: t('anchors.primary'), href: '#primary' },
          { label: t('anchors.channels'), href: '#channels' },
          { label: t('anchors.form'), href: '#form' },
          { label: t('anchors.newsletter'), href: '#newsletter' },
        ]}
        anchorNavLabel={tCommon('pageSectionsNavLabel')}
      />

      {/* ---- 01 · Preferovaná cesta ---- */}
      <section id="primary" className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <SectionHeader
              eyebrow={`01 · ${t('primary.label').toLowerCase()}`}
              title={t('primary.headline')}
              lead={t('primary.body')}
            />
          </div>
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={{ ...SPRING, delay: 0.12 }}
            variants={REVEAL}
            className="flex flex-col items-start justify-center gap-3 md:items-end"
          >
            <MagneticCta primary onClick={openCal}>
              {t('primary.cta')}
            </MagneticCta>
          </m.div>
        </div>
      </section>

      {/* ---- 02 · Přímé kanály ---- */}
      <section id="channels" className="relative border-t border-border bg-surface px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={`02 · ${t('channels.heading').toLowerCase()}`}
            title={t('channels.heading')}
            lead=""
          />
          <div className="mt-12">
            <ContactChannels channels={channels} />
          </div>
        </div>
      </section>

      {/* ---- 03 · Formulář ---- */}
      <section id="form" className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[920px]">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={SPRING}
            variants={REVEAL}
            className="mb-12"
          >
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              {t('formSection.eyebrow')}
            </span>
            <h2
              className="display mt-4 text-ink"
              style={{ fontSize: 'clamp(36px,4.6vw,68px)' }}
            >
              {t('formSection.heading')}
            </h2>
          </m.div>
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={{ ...SPRING, delay: 0.1 }}
            variants={REVEAL}
          >
            <ContactForm locale={locale} />
          </m.div>
        </div>
      </section>

      {/* ---- 04 · Newsletter ---- */}
      <section id="newsletter" className="relative border-t border-border px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-[920px]">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={SPRING}
            variants={REVEAL}
          >
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              {t('newsletterEyebrow')}
            </span>
            <div className="mt-6 max-w-[560px]">
              <NewsletterSignup locale={locale} formLocation="kontakt" />
            </div>
          </m.div>
        </div>
      </section>

      {/* ---- 05 · Ochrana osobních údajů ---- */}
      <section id="privacy" className="relative border-t border-border bg-surface px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[920px]">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={SPRING}
            variants={REVEAL}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
              {t('privacy.label')}
            </span>
            <p className="mt-3 text-[15px] leading-[1.6] text-secondary">
              {t('privacy.body')}
              <Link
                href="/ochrana-soukromi"
                className="underline"
                style={{ color: 'var(--accent)' }}
              >
                {t('privacy.linkText')}
              </Link>
              {t('privacy.after')}
            </p>
          </m.div>
        </div>
      </section>
    </>
  );
}
