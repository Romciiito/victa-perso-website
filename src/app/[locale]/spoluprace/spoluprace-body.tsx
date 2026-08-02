'use client';

import { useLocale, useTranslations } from 'next-intl';
import { PageHero } from '@/components/sections/page-hero';
import { SectionMarquee } from '@/components/sections/section-marquee';
import { SectionHeader } from '@/components/sections/section-header';
import { ValuesGrid, type ValueItem } from '@/components/sections/values-grid';
import { StickyTierStack, type TierData } from '@/components/sections/sticky-tier-stack';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { useCalModal } from '@/components/booking/use-cal-modal';

/* ---- raw type shapes ----------------------------------------------- */
type Tier = {
  tier: string;
  badge?: string;
  name: string;
  ideal: string;
  duration: string;
  sessions: string;
  price: string;
  priceEur: string;
  deliverables: ReadonlyArray<string>;
  cta: string;
};

type InvoiceStep = { num: string; title: string; body: string };
type FaqItem = { q: string; a: string };

/* ==================================================================== */
export function SpolupraceBody() {
  const t = useTranslations('spoluprace');
  const tCta = useTranslations('common.ctaBand');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const tRaw = (k: string) => t.raw(k) as unknown;
  const marqueeItems = tRaw('marquee') as ReadonlyArray<string>;
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}/spoluprace`,
  });
  // Per-tier paid-audit bookings (D-010) — each tier opens its own Cal.com
  // event type; before Cal.com is provisioned they fall back to the contact form.
  const openCalTier1 = useCalModal({
    bookingType: 'audit_t1',
    sourcePage: `/${locale}/spoluprace`,
    fallbackHref: '/kontakt#form',
  });
  const openCalTier2 = useCalModal({
    bookingType: 'audit_t2',
    sourcePage: `/${locale}/spoluprace`,
    fallbackHref: '/kontakt#form',
  });
  const openCalTier3 = useCalModal({
    bookingType: 'audit_t3',
    sourcePage: `/${locale}/spoluprace`,
    fallbackHref: '/kontakt#form',
  });

  /* paths */
  const pathAudit = tRaw('paths.audit') as {
    label: string; headline: string; body: string; fit: string; cta: string;
  };
  const pathScoping = tRaw('paths.scoping') as {
    label: string; headline: string; body: string; fit: string; cta: string;
  };

  /* audit tiers */
  const tier1 = tRaw('tiers.tier1') as Tier;
  const tier2 = tRaw('tiers.tier2') as Tier;
  const tier3 = tRaw('tiers.tier3') as Tier;

  /* invoice steps → ValuesGrid */
  const invoiceSteps = tRaw('invoice.steps') as ReadonlyArray<InvoiceStep>;

  /* scoping items */
  const scopingItems = tRaw('scoping.items') as ReadonlyArray<string>;

  /* faq */
  const faqItems = tRaw('faq.items') as ReadonlyArray<FaqItem>;

  /* ---- derived structures ------------------------------------------ */

  const invoiceValues: ReadonlyArray<ValueItem> = invoiceSteps.map((step) => ({
    label: `${step.num} · ${step.title}`,
    body: step.body,
  }));

  const auditTiers: ReadonlyArray<TierData> = [
    {
      tier: tier1.tier,
      flag: tier1.badge,
      name: tier1.name,
      price: tier1.price,
      priceEur: tier1.priceEur,
      body: tier1.ideal,
      deliverables: tier1.deliverables,
      cta: tier1.cta,
      ctaOnClick: openCalTier1,
      primary: true,
    },
    {
      tier: tier2.tier,
      name: tier2.name,
      price: tier2.price,
      priceEur: tier2.priceEur,
      body: tier2.ideal,
      deliverables: tier2.deliverables,
      cta: tier2.cta,
      ctaOnClick: openCalTier2,
    },
    {
      tier: tier3.tier,
      name: tier3.name,
      price: tier3.price,
      priceEur: tier3.priceEur,
      body: tier3.ideal,
      deliverables: tier3.deliverables,
      cta: tier3.cta,
      ctaOnClick: openCalTier3,
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
          { label: tCta('primaryCta'), onClick: openCal, primary: true },
          { label: t('heroExtraCta'), href: '#audit' },
        ]}
        anchors={[
          { label: t('anchors.paths'), href: '#cesty' },
          { label: t('anchors.audit'), href: '#audit' },
          { label: t('anchors.start'), href: '#jak-zacit' },
          { label: t('anchors.faq'), href: '#faq' },
        ]}
        anchorNavLabel={tCommon('pageSectionsNavLabel')}
      />

      {/* ---- Marquee ---- */}
      <SectionMarquee items={marqueeItems} />

      {/* ---- 01 · Cesty ---- */}
      <section id="cesty" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={t('sectionEyebrows.paths')}
            title={t('paths.heading')}
            lead={t('paths.subhead')}
          />

          {/* 2-column path cards */}
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            <PathCard
              label={pathAudit.label}
              headline={pathAudit.headline}
              body={pathAudit.body}
              fit={pathAudit.fit}
              ctaLabel={pathAudit.cta}
              ctaHref="#audit"
              primary
            />
            <PathCard
              label={pathScoping.label}
              headline={pathScoping.headline}
              body={pathScoping.body}
              fit={pathScoping.fit}
              ctaLabel={pathScoping.cta}
              ctaHref="#jak-zacit"
            />
          </div>
        </div>
      </section>

      {/* ---- 02 · Audit tiers ---- */}
      <section
        id="audit"
        className="relative bg-surface px-6 py-24 md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow={t('sectionEyebrows.audit')}
            title={t('tiers.heading')}
            lead={t('tiers.subhead')}
          />
          <StickyTierStack
            tiers={auditTiers}
            scopingNote={t('tiers.note')}
          />
        </div>
      </section>

      {/* ---- 03 · Jak začít ---- */}
      <section id="jak-zacit" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          {/* Invoice flow */}
          <SectionHeader
            eyebrow={t('sectionEyebrows.start')}
            title={t('invoice.heading')}
            lead={t('invoice.subhead')}
          />
          <ValuesGrid items={invoiceValues} />

          {/* Free scoping call */}
          <div className="mt-20 grid grid-cols-1 gap-12 border-t border-border pt-20 md:grid-cols-2">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                {t('scopingEyebrow')}
              </span>
              <h3 className="display mt-4 text-[clamp(32px,4vw,56px)] text-ink">
                {t('scoping.heading')}
              </h3>
              <p className="mt-5 text-[17px] leading-[1.55] text-secondary">
                {t('scoping.body')}
              </p>
              <div className="mt-8">
                <MagneticCta primary onClick={openCal}>
                  {t('scoping.cta')}
                </MagneticCta>
              </div>
            </div>
            <div className="rounded-[16px] border border-border bg-surface p-8 md:p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
                {t('scoping.what')}
              </p>
              <ol className="mt-6 space-y-4">
                {scopingItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 text-[15px] leading-[1.6] text-ink"
                  >
                    <span className="font-mono text-[11px] text-accent" style={{ minWidth: '24px', paddingTop: '4px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 04 · FAQ ---- */}
      <section id="faq" className="relative bg-surface px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[920px]">
          <SectionHeader
            eyebrow={t('sectionEyebrows.faq')}
            title={t('faq.heading')}
            lead={t('faq.lead')}
          />
          <ul className="mt-14 space-y-3">
            {faqItems.map((item, i) => (
              <li
                key={i}
                className="overflow-hidden rounded-[14px] border border-border bg-bg"
              >
                <details className="group">
                  <summary className="flex cursor-pointer select-none items-center justify-between gap-4 px-6 py-5 text-[16px] font-medium leading-[1.4] text-ink">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="font-mono text-tertiary transition-transform duration-200 group-open:rotate-45"
                      style={{ fontSize: '20px' }}
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-[15px] leading-[1.65] text-secondary">
                      {item.a}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- CTA band ---- */}
      <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              {t('sectionEyebrows.cta')}
            </span>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('finalCta.heading')}
            </h2>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary onClick={openCal}>
              {tCta('primaryCta')}
            </MagneticCta>
            <MagneticCta href="/sluzby">{t('finalCta.servicesLink')}</MagneticCta>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---- PathCard sub-component --------------------------------------- */
function PathCard({
  label,
  headline,
  body,
  fit,
  ctaLabel,
  ctaHref,
  primary,
}: {
  label: string;
  headline: string;
  body: string;
  fit: string;
  ctaLabel: string;
  ctaHref: string;
  primary?: boolean;
}) {
  return (
    <article
      className="flex flex-col rounded-[20px] border p-8 md:p-10"
      style={{
        borderColor: primary ? 'var(--accent)' : 'var(--border)',
        backgroundColor: 'var(--bg)',
        boxShadow: primary ? '0 0 0 1px var(--accent)' : undefined,
      }}
    >
      <span
        className="font-mono text-[11px] uppercase tracking-[0.14em]"
        style={{ color: primary ? 'var(--accent)' : 'var(--tertiary)' }}
      >
        {label}
      </span>
      <h3 className="display mt-4 text-[clamp(26px,2.8vw,40px)] text-ink">
        {headline}
      </h3>
      <p className="mt-4 flex-1 text-[15px] leading-[1.6] text-secondary">
        {body}
      </p>
      <p className="mt-5 font-mono text-[12px] leading-[1.55] text-tertiary">
        {fit}
      </p>
      <div className="mt-8">
        <MagneticCta primary={primary} compact href={ctaHref}>
          {ctaLabel}
        </MagneticCta>
      </div>
    </article>
  );
}
