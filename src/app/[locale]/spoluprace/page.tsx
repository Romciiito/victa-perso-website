import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/button';
import { PricingCard } from '@/components/pricing-card';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

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

type FaqItem = { q: string; a: string };
type InvoiceStep = { num: string; title: string; body: string };

export default async function CollaborationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="How we collaborate." pathLabel="/en/spoluprace" />;
  }
  const t = await getTranslations('spoluprace');
  // raw is escape hatch for arrays in next-intl
  const tRaw = (key: string) => t.raw(key) as unknown;

  const tier1 = tRaw('tiers.tier1') as Tier;
  const tier2 = tRaw('tiers.tier2') as Tier;
  const tier3 = tRaw('tiers.tier3') as Tier;
  const invoiceSteps = tRaw('invoice.steps') as ReadonlyArray<InvoiceStep>;
  const scopingItems = tRaw('scoping.items') as ReadonlyArray<string>;
  const faqItems = tRaw('faq.items') as ReadonlyArray<FaqItem>;

  const isCs = locale === 'cs';
  const primaryPrice = (tier: Tier) => (isCs ? tier.price : tier.priceEur);
  const secondaryPrice = (tier: Tier) => (isCs ? tier.priceEur : tier.price);

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pb-12 pt-16 md:px-12 md:pb-16 md:pt-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-8">
            <StatusLine>{t('hero.status')}</StatusLine>
          </div>
          <h1
            className="mb-6 text-ink"
            style={{
              fontSize: 'clamp(48px, 6vw, 80px)',
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              maxWidth: '920px',
            }}
          >
            {t('hero.headline')}
          </h1>
          <p
            className="mb-8 text-secondary"
            style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '720px' }}
          >
            {t('hero.subhead')}
          </p>
        </div>
      </section>

      {/* Section 2 — Two paths */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px] md:mb-16">
            <h2
              className="mb-4 text-ink"
              style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
            >
              {t('paths.heading')}
            </h2>
            <p className="text-secondary" style={{ fontSize: '19px', lineHeight: 1.55 }}>
              {t('paths.subhead')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PathCard
              label={t('paths.audit.label')}
              headline={t('paths.audit.headline')}
              body={t('paths.audit.body')}
              fit={t('paths.audit.fit')}
              ctaLabel={t('paths.audit.cta')}
              ctaHref="#tiers"
              variant="primary"
            />
            <PathCard
              label={t('paths.scoping.label')}
              headline={t('paths.scoping.headline')}
              body={t('paths.scoping.body')}
              fit={t('paths.scoping.fit')}
              ctaLabel={t('paths.scoping.cta')}
              ctaHref="#scoping"
              variant="ghost"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — Audit tiers */}
      <section
        id="tiers"
        className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px] md:mb-16">
            <h2
              className="mb-4 text-ink"
              style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
            >
              {t('tiers.heading')}
            </h2>
            <p className="text-secondary" style={{ fontSize: '19px', lineHeight: 1.55 }}>
              {t('tiers.subhead')}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <PricingCard
              tier={tier1.tier}
              badge={tier1.badge}
              popular
              name={tier1.name}
              ideal={tier1.ideal}
              price={primaryPrice(tier1)}
              priceSecondary={secondaryPrice(tier1)}
              duration={`${tier1.duration} · ${tier1.sessions}`}
              bullets={tier1.deliverables}
              ctaLabel={tier1.cta}
              ctaHref="#scoping"
            />
            <PricingCard
              tier={tier2.tier}
              name={tier2.name}
              ideal={tier2.ideal}
              price={primaryPrice(tier2)}
              priceSecondary={secondaryPrice(tier2)}
              duration={`${tier2.duration} · ${tier2.sessions}`}
              bullets={tier2.deliverables}
              ctaLabel={tier2.cta}
              ctaHref="#scoping"
            />
            <PricingCard
              tier={tier3.tier}
              name={tier3.name}
              ideal={tier3.ideal}
              price={primaryPrice(tier3)}
              priceSecondary={secondaryPrice(tier3)}
              duration={`${tier3.duration} · ${tier3.sessions}`}
              bullets={tier3.deliverables}
              ctaLabel={tier3.cta}
              ctaHref="#scoping"
            />
          </div>
          <p className="mt-8 text-sm text-secondary" style={{ maxWidth: '720px' }}>
            {t('tiers.note')}
          </p>
        </div>
      </section>

      {/* Section 4 — Invoice flow */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px] md:mb-16">
            <h2
              className="mb-4 text-ink"
              style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
            >
              {t('invoice.heading')}
            </h2>
            <p className="text-secondary" style={{ fontSize: '19px', lineHeight: 1.55 }}>
              {t('invoice.subhead')}
            </p>
          </div>
          <ol
            className="grid grid-cols-1 overflow-hidden rounded-lg border-l border-t md:grid-cols-2 lg:grid-cols-4"
            style={{ borderColor: 'var(--border)' }}
          >
            {invoiceSteps.map((step) => (
              <li
                key={step.num}
                className="border-b border-r p-6 md:p-8"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
              >
                <div
                  className="mb-4 font-mono text-xs"
                  style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}
                >
                  {step.num}
                </div>
                <h3
                  className="mb-3 text-ink"
                  style={{ fontSize: '19px', lineHeight: 1.25, letterSpacing: '-0.015em', fontWeight: 500 }}
                >
                  {step.title}
                </h3>
                <p className="text-secondary" style={{ fontSize: '14px', lineHeight: 1.55 }}>
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Section 5 — Free scoping call */}
      <section
        id="scoping"
        className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2
                className="mb-4 text-ink"
                style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
              >
                {t('scoping.heading')}
              </h2>
              <p className="mb-8 text-secondary" style={{ fontSize: '19px', lineHeight: 1.55 }}>
                {t('scoping.body')}
              </p>
              <Button href="/kontakt" variant="primary" size="md" showArrow>
                {t('scoping.cta')}
              </Button>
            </div>
            <div
              className="rounded-lg border p-8"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
            >
              <div
                className="mb-4 font-mono text-xs uppercase text-tertiary"
                style={{ letterSpacing: '0.12em' }}
              >
                {t('scoping.what')}
              </div>
              <ol className="list-none space-y-3">
                {scopingItems.map((item, i) => (
                  <li
                    key={`${i}-${item.slice(0, 12)}`}
                    className="flex gap-4 text-ink"
                    style={{ fontSize: '15px', lineHeight: 1.55 }}
                  >
                    <span
                      className="font-mono text-xs"
                      style={{ color: 'var(--accent)', minWidth: '24px', paddingTop: '2px' }}
                    >
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

      {/* Section 6 — FAQ */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[920px]">
          <h2
            className="mb-12 text-ink md:mb-16"
            style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
          >
            {t('faq.heading')}
          </h2>
          <ul className="list-none space-y-3">
            {faqItems.map((item, i) => (
              <li
                key={`${i}-${item.q.slice(0, 12)}`}
                className="rounded-lg border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
              >
                <details className="group">
                  <summary
                    className="flex cursor-pointer items-center justify-between gap-4 p-6 text-ink"
                    style={{ fontSize: '17px', lineHeight: 1.4, fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="font-mono text-tertiary transition-transform duration-150 group-open:rotate-45"
                      style={{ fontSize: '20px' }}
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                      {item.a}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function PathCard({
  label,
  headline,
  body,
  fit,
  ctaLabel,
  ctaHref,
  variant,
}: {
  label: string;
  headline: string;
  body: string;
  fit: string;
  ctaLabel: string;
  ctaHref: string;
  variant: 'primary' | 'ghost';
}) {
  return (
    <article
      className="flex flex-col rounded-lg border p-6 md:p-8"
      style={{
        borderColor: variant === 'primary' ? 'var(--accent)' : 'var(--border)',
        backgroundColor: 'var(--bg)',
        boxShadow: variant === 'primary' ? '0 0 0 1px var(--accent)' : undefined,
      }}
    >
      <div
        className="mb-4 font-mono text-xs uppercase"
        style={{ color: variant === 'primary' ? 'var(--accent)' : 'var(--tertiary)', letterSpacing: '0.12em' }}
      >
        {label}
      </div>
      <h3
        className="mb-4 text-ink"
        style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
      >
        {headline}
      </h3>
      <p className="mb-6 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
        {body}
      </p>
      <p
        className="mb-8 flex-1 font-mono text-xs text-tertiary"
        style={{ letterSpacing: '0.02em', lineHeight: 1.55 }}
      >
        {fit}
      </p>
      <Button href={ctaHref} variant={variant} size="md" showArrow={variant === 'primary'}>
        {ctaLabel}
      </Button>
    </article>
  );
}
