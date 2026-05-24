import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/button';
import { PricingCard } from '@/components/pricing-card';
import { Eyebrow } from '@/components/eyebrow';
import { EditorialSplit } from '@/components/editorial-split';
import { BentoShell, BentoCard } from '@/components/bento';
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

/* ============================================================
   /[locale]/spoluprace — Cooperation / audit booking
   Conversion-critical page. D-008 refactor preserves all content
   keys; restructures sections to soft-skill patterns.
   ============================================================ */

export default async function CollaborationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="How we collaborate." pathLabel="/en/spoluprace" />;
  }
  const t = await getTranslations('spoluprace');
  const tRaw = (key: string) => t.raw(key) as unknown;

  const tier1 = tRaw('tiers.tier1') as Tier;
  const tier2 = tRaw('tiers.tier2') as Tier;
  const tier3 = tRaw('tiers.tier3') as Tier;
  const invoiceSteps = tRaw('invoice.steps') as ReadonlyArray<InvoiceStep>;
  const scopingItems = tRaw('scoping.items') as ReadonlyArray<string>;
  const faqItems = tRaw('faq.items') as ReadonlyArray<FaqItem>;

  const primaryPrice = (tier: Tier) => tier.price;
  const secondaryPrice = (tier: Tier) => tier.priceEur;

  return (
    <>
      {/* HERO */}
      <EditorialSplit
        padding="hero"
        left={
          <>
            <Eyebrow>{t('hero.status')}</Eyebrow>
            <h1
              className="text-ink"
              style={{
                fontSize: 'clamp(52px, 7vw, 96px)',
                lineHeight: 0.96,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                maxWidth: '14ch',
              }}
            >
              {t('hero.headline')}
            </h1>
            <p
              style={{
                fontSize: '19px',
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                maxWidth: '52ch',
              }}
            >
              {t('hero.subhead')}
            </p>
            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              <Button href="#tiers" variant="primary" size="md">
                {t('paths.audit.cta')}
              </Button>
              <Button href="#scoping" variant="ghost" size="md">
                {t('paths.scoping.cta')}
              </Button>
            </div>
          </>
        }
        right={
          <div
            className="grid h-full content-center"
            style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}
          >
            <BentoShell span={2}>
              <BentoCard padding="loose">
                <div
                  className="font-mono uppercase"
                  style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
                >
                  Audit cesty
                </div>
                <div
                  style={{
                    fontSize: 'clamp(40px, 4.5vw, 56px)',
                    fontWeight: 500,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: 'var(--ink)',
                  }}
                >
                  3 tiery
                </div>
                <div style={{ fontSize: '14px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                  Komplexní audit nebo modulární scoping call. Vyberte si formát podle rozsahu.
                </div>
              </BentoCard>
            </BentoShell>
            <BentoShell>
              <BentoCard padding="compact">
                <div
                  className="font-mono uppercase"
                  style={{ fontSize: '10px', letterSpacing: '0.18em', color: 'var(--ink-soft)' }}
                >
                  Od
                </div>
                <div
                  style={{
                    fontSize: 'clamp(24px, 2.6vw, 32px)',
                    fontWeight: 500,
                    letterSpacing: '-0.035em',
                    lineHeight: 1,
                    color: 'var(--ink)',
                  }}
                >
                  20 000 Kč
                </div>
              </BentoCard>
            </BentoShell>
            <BentoShell>
              <BentoCard padding="compact">
                <div
                  className="font-mono uppercase"
                  style={{ fontSize: '10px', letterSpacing: '0.18em', color: 'var(--ink-soft)' }}
                >
                  Scoping
                </div>
                <div
                  style={{
                    fontSize: 'clamp(24px, 2.6vw, 32px)',
                    fontWeight: 500,
                    letterSpacing: '-0.035em',
                    lineHeight: 1,
                    color: 'var(--ink)',
                  }}
                >
                  Zdarma
                </div>
              </BentoCard>
            </BentoShell>
          </div>
        }
      />

      {/* TWO PATHS */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px] md:mb-16">
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 56px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {t('paths.heading')}
            </h2>
            <p
              className="mt-4"
              style={{ fontSize: '19px', lineHeight: 1.5, color: 'var(--ink-muted)' }}
            >
              {t('paths.subhead')}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <PathCard
              label={t('paths.audit.label')}
              headline={t('paths.audit.headline')}
              body={t('paths.audit.body')}
              fit={t('paths.audit.fit')}
              ctaLabel={t('paths.audit.cta')}
              ctaHref="#tiers"
              emphasized
            />
            <PathCard
              label={t('paths.scoping.label')}
              headline={t('paths.scoping.headline')}
              body={t('paths.scoping.body')}
              fit={t('paths.scoping.fit')}
              ctaLabel={t('paths.scoping.cta')}
              ctaHref="#scoping"
            />
          </div>
        </div>
      </section>

      {/* AUDIT TIERS */}
      <section
        id="tiers"
        className="scroll-mt-32 relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px] md:mb-16">
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 56px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {t('tiers.heading')}
            </h2>
            <p
              className="mt-4"
              style={{ fontSize: '19px', lineHeight: 1.5, color: 'var(--ink-muted)' }}
            >
              {t('tiers.subhead')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
          <p
            className="mt-8"
            style={{ fontSize: '14px', color: 'var(--ink-muted)', maxWidth: '720px' }}
          >
            {t('tiers.note')}
          </p>
        </div>
      </section>

      {/* INVOICE FLOW */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px] md:mb-16">
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 56px)',
                lineHeight: 1.04,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {t('invoice.heading')}
            </h2>
            <p
              className="mt-4"
              style={{ fontSize: '19px', lineHeight: 1.5, color: 'var(--ink-muted)' }}
            >
              {t('invoice.subhead')}
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 list-none">
            {invoiceSteps.map((step) => (
              <li key={step.num}>
                <BentoShell>
                  <BentoCard padding="standard">
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '12px',
                        color: 'var(--accent)',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {step.num}
                    </div>
                    <h3
                      style={{
                        fontSize: '17px',
                        lineHeight: 1.25,
                        letterSpacing: '-0.015em',
                        fontWeight: 500,
                        color: 'var(--ink)',
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        lineHeight: 1.55,
                        color: 'var(--ink-muted)',
                      }}
                    >
                      {step.body}
                    </p>
                  </BentoCard>
                </BentoShell>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FREE SCOPING CALL */}
      <section
        id="scoping"
        className="scroll-mt-32 relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16 md:items-start">
            <div className="grid gap-6 content-start">
              <h2
                style={{
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  lineHeight: 1.04,
                  letterSpacing: '-0.045em',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {t('scoping.heading')}
              </h2>
              <p
                style={{
                  fontSize: '19px',
                  lineHeight: 1.55,
                  color: 'var(--ink-muted)',
                }}
              >
                {t('scoping.body')}
              </p>
              <div>
                <Button href="/kontakt" variant="primary" size="md">
                  {t('scoping.cta')}
                </Button>
              </div>
            </div>
            <BentoShell>
              <BentoCard padding="loose">
                <div
                  className="font-mono uppercase"
                  style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
                >
                  {t('scoping.what')}
                </div>
                <ol className="list-none" style={{ display: 'grid', gap: '12px', marginTop: '4px' }}>
                  {scopingItems.map((item, i) => (
                    <li
                      key={`${i}-${item.slice(0, 12)}`}
                      className="flex gap-3"
                      style={{ fontSize: '15px', lineHeight: 1.55, color: 'var(--ink)' }}
                    >
                      <span
                        className="font-mono"
                        style={{
                          color: 'var(--accent)',
                          minWidth: '24px',
                          paddingTop: '2px',
                          fontSize: '12px',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </BentoCard>
            </BentoShell>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[920px]">
          <h2
            className="mb-12 md:mb-16"
            style={{
              fontSize: 'clamp(32px, 4vw, 56px)',
              lineHeight: 1.04,
              letterSpacing: '-0.045em',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {t('faq.heading')}
          </h2>
          <ul className="list-none">
            {faqItems.map((item, i) => (
              <li
                key={`${i}-${item.q.slice(0, 12)}`}
                style={{
                  borderTop: i === 0 ? '1px solid var(--line)' : undefined,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <details className="group" style={{ padding: '20px 0' }}>
                  <summary
                    className="flex cursor-pointer items-start justify-between gap-6"
                    style={{ listStyle: 'none' }}
                  >
                    <span
                      style={{
                        fontSize: '17px',
                        fontWeight: 500,
                        letterSpacing: '-0.015em',
                        color: 'var(--ink)',
                        lineHeight: 1.35,
                      }}
                    >
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-open:rotate-45"
                      style={{ border: '1px solid var(--line)', color: 'var(--ink-muted)' }}
                    >
                      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <path d="M6 2v8M2 6h8" />
                      </svg>
                    </span>
                  </summary>
                  <p
                    className="mt-4"
                    style={{
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: 'var(--ink-muted)',
                      maxWidth: '60ch',
                    }}
                  >
                    {item.a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   PathCard — Audit vs Scoping option card
   ============================================================ */
function PathCard({
  label,
  headline,
  body,
  fit,
  ctaLabel,
  ctaHref,
  emphasized = false,
}: {
  label: string;
  headline: string;
  body: string;
  fit: string;
  ctaLabel: string;
  ctaHref: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={emphasized ? 'audit-card popular' : 'audit-card'}
      style={emphasized ? { borderRadius: 'var(--radius-xl)' } : undefined}
    >
      <BentoShell>
        <BentoCard padding="loose">
          <div
            className="font-mono uppercase"
            style={{
              color: emphasized ? 'var(--accent)' : 'var(--ink-soft)',
              fontSize: '11px',
              letterSpacing: '0.16em',
            }}
          >
            {label}
          </div>
          <h3
            style={{
              fontSize: 'clamp(22px, 2.4vw, 28px)',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              fontWeight: 600,
              color: 'var(--ink)',
              marginTop: '4px',
            }}
          >
            {headline}
          </h3>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
            {body}
          </p>
          <p
            className="font-mono"
            style={{
              fontSize: '12px',
              letterSpacing: '0.02em',
              lineHeight: 1.55,
              color: 'var(--ink-soft)',
              borderTop: '1px solid var(--line)',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            {fit}
          </p>
          <div style={{ marginTop: 'auto' }}>
            <Button
              href={ctaHref}
              variant={emphasized ? 'primary' : 'ghost'}
              size="md"
              className="w-full justify-center"
            >
              {ctaLabel}
            </Button>
          </div>
        </BentoCard>
      </BentoShell>
    </div>
  );
}
