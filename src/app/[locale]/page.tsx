import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/button';
import { PricingCard } from '@/components/pricing-card';
import { StatusLine } from '@/components/status-line';

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') return <EnglishStub />;
  return <CzechHome />;
}

/* ============================================================
   CZECH HOMEPAGE — full version
   ============================================================ */
async function CzechHome() {
  const t = await getTranslations('home');

  return (
    <>
      {/* Section 1 — Hero */}
      <section className="relative px-6 pb-16 pt-16 md:px-12 md:pb-24 md:pt-24">
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
            className="mb-10 text-secondary"
            style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '720px' }}
          >
            {t('hero.subhead')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/spoluprace" variant="primary" size="md" showArrow>
              {t('hero.ctaPrimary')}
            </Button>
            <Button href="/spoluprace#scoping" variant="ghost" size="md">
              {t('hero.ctaGhost')}
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2 — Three trust pillars */}
      <Section className="border-t border-border-soft">
        <h2
          className="mb-12 text-ink md:mb-16"
          style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500, maxWidth: '760px' }}
        >
          {t('pillars.heading')}
        </h2>
        <div className="grid gap-6 md:grid-cols-3 md:gap-6">
          <Pillar
            label={t('pillars.items.methodology.label')}
            headline={t('pillars.items.methodology.headline')}
            body={t('pillars.items.methodology.body')}
            cta={t('pillars.items.methodology.cta')}
            href="/spoluprace"
          />
          <Pillar
            label={t('pillars.items.industry.label')}
            headline={t('pillars.items.industry.headline')}
            body={t('pillars.items.industry.body')}
            cta={t('pillars.items.industry.cta')}
            href="/odvetvi"
          />
          <Pillar
            label={t('pillars.items.design.label')}
            headline={t('pillars.items.design.headline')}
            body={t('pillars.items.design.body')}
            cta={t('pillars.items.design.cta')}
            href="/sluzby"
          />
        </div>
      </Section>

      {/* Section 3 — Service categories teaser */}
      <Section
        className="border-t border-border-soft"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mb-10 max-w-[760px] md:mb-12">
          <h2
            className="mb-4 text-ink"
            style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
          >
            {t('categories.heading')}
          </h2>
          <p className="text-secondary" style={{ fontSize: '19px', lineHeight: 1.55 }}>
            {t('categories.subhead')}
          </p>
        </div>
        <div
          className="grid grid-cols-1 overflow-hidden rounded-lg border-l border-t md:grid-cols-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <CategoryCell
            num="01"
            label={t('categories.items.itDev.label')}
            headline={t('categories.items.itDev.headline')}
            body={t('categories.items.itDev.body')}
            href="/sluzby#it-vyvoj"
            ctaLabel={t('categories.ctaLabel')}
          />
          <CategoryCell
            num="02"
            label={t('categories.items.aiData.label')}
            headline={t('categories.items.aiData.headline')}
            body={t('categories.items.aiData.body')}
            href="/sluzby#ai-data"
            ctaLabel={t('categories.ctaLabel')}
          />
          <CategoryCell
            num="03"
            label={t('categories.items.marketing.label')}
            headline={t('categories.items.marketing.headline')}
            body={t('categories.items.marketing.body')}
            href="/sluzby#marketing"
            ctaLabel={t('categories.ctaLabel')}
          />
        </div>
      </Section>

      {/* Section 4 — Audit pricing teaser */}
      <Section className="border-t border-border-soft">
        <div className="mb-10 max-w-[760px] md:mb-12">
          <h2
            className="mb-4 text-ink"
            style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
          >
            {t('audit.heading')}
          </h2>
          <p className="text-secondary" style={{ fontSize: '19px', lineHeight: 1.55 }}>
            {t('audit.subhead')}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <PricingCard
            tier={t('audit.tier1.tier')}
            badge={t('audit.tier1.badge')}
            popular
            name={t('audit.tier1.name')}
            price={t('audit.tier1.price')}
            priceSecondary={t('audit.tier1.priceEur')}
            duration={t('audit.tier1.duration')}
            bullets={[t('audit.tier1.deliverables')]}
            ctaLabel={t('audit.tier1.cta')}
            ctaHref="/spoluprace"
          />
          <PricingCard
            tier={t('audit.tier2.tier')}
            name={t('audit.tier2.name')}
            price={t('audit.tier2.price')}
            priceSecondary={t('audit.tier2.priceEur')}
            duration={t('audit.tier2.duration')}
            bullets={[t('audit.tier2.deliverables')]}
            ctaLabel={t('audit.tier2.cta')}
            ctaHref="/spoluprace"
          />
          <PricingCard
            tier={t('audit.tier3.tier')}
            name={t('audit.tier3.name')}
            price={t('audit.tier3.price')}
            priceSecondary={t('audit.tier3.priceEur')}
            duration={t('audit.tier3.duration')}
            bullets={[t('audit.tier3.deliverables')]}
            ctaLabel={t('audit.tier3.cta')}
            ctaHref="/spoluprace"
          />
        </div>
        <p className="mt-8 text-center text-base text-secondary">
          <Link
            href="/spoluprace#scoping"
            className="font-medium"
            style={{
              color: 'var(--accent)',
              borderBottom: '1px solid var(--accent)',
              paddingBottom: '2px',
            }}
          >
            {t('audit.scoping')}
          </Link>
        </p>
      </Section>

      {/* Section 5 — Why VICTA (counter-positioning) */}
      <Section
        className="border-t border-border-soft"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h2
          className="mb-12 text-ink md:mb-16"
          style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
        >
          {t('why.heading')}
        </h2>
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <WhyCallout label={t('why.items.tempo.label')} body={t('why.items.tempo.body')} />
          <WhyCallout label={t('why.items.price.label')} body={t('why.items.price.body')} />
          <WhyCallout label={t('why.items.ai.label')} body={t('why.items.ai.body')} />
          <WhyCallout label={t('why.items.partnership.label')} body={t('why.items.partnership.body')} />
        </div>
      </Section>

      {/* Section 6 — Final CTA (dark contrast) */}
      <section
        className="relative px-6 py-20 md:px-12 md:py-32"
        style={{ backgroundColor: 'var(--ink)', color: 'var(--bg)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <h2
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              maxWidth: '760px',
              color: 'var(--bg)',
              marginBottom: '24px',
            }}
          >
            {t('finalCta.headline')}
          </h2>
          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.55,
              maxWidth: '640px',
              color: 'var(--bg)',
              opacity: 0.85,
              marginBottom: '40px',
            }}
          >
            {t('finalCta.subhead')}
          </p>
          <Link
            href="/spoluprace#scoping"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors duration-150 hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--ink)',
              letterSpacing: '-0.005em',
            }}
          >
            {t('finalCta.cta')}
          </Link>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   ENGLISH STUB
   ============================================================ */
async function EnglishStub() {
  const t = await getTranslations('home');
  return (
    <section className="relative px-6 pb-24 pt-16 md:px-12 md:pb-32 md:pt-24">
      <div className="mx-auto w-full max-w-[920px]">
        <div className="mb-8">
          <StatusLine>{t('hero.status')}</StatusLine>
        </div>
        <p
          className="mb-4 font-mono text-xs uppercase text-tertiary"
          style={{ letterSpacing: '0.12em' }}
        >
          {t('stub.label')}
        </p>
        <h1
          className="mb-6 text-ink"
          style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 1.04,
            letterSpacing: '-0.035em',
            fontWeight: 500,
          }}
        >
          {t('hero.headline')}
        </h1>
        <p
          className="mb-10 text-secondary"
          style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '640px' }}
        >
          {t('hero.subhead')}
        </p>

        <div
          className="my-12 rounded-lg border p-8 md:p-10"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2
            className="mb-4 text-ink"
            style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
          >
            {t('stub.headline')}
          </h2>
          <p className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
            {t('stub.body')}
          </p>
        </div>

        <div className="mb-12">
          <h2
            className="mb-4 text-ink"
            style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
          >
            {t('stub.contactHeadline')}
          </h2>
          <p className="mb-6 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
            {t('stub.body')}
          </p>
          <a
            href={`mailto:${t('stub.email')}`}
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors duration-150 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              letterSpacing: '-0.005em',
            }}
          >
            {t('stub.email')}
            <ArrowRight size={16} aria-hidden />
          </a>
        </div>

        <p className="font-mono text-sm">
          <Link
            href="/"
            locale="cs"
            className="text-accent"
            style={{ borderBottom: '1px solid var(--accent)', paddingBottom: '2px', color: 'var(--accent)' }}
          >
            {t('stub.fullCs')}
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   Helpers
   ============================================================ */
function Section({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`relative px-6 py-20 md:px-12 md:py-24 ${className}`} style={style}>
      <div className="mx-auto w-full max-w-[1440px]">{children}</div>
    </section>
  );
}

function Pillar({
  label,
  headline,
  body,
  cta,
  href,
}: {
  label: string;
  headline: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <article
      className="flex flex-col rounded-lg border p-6 md:p-8"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    >
      <div
        className="mb-4 font-mono text-xs uppercase text-tertiary"
        style={{ letterSpacing: '0.12em' }}
      >
        {label}
      </div>
      <h3
        className="mb-3 text-ink"
        style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
      >
        {headline}
      </h3>
      <p className="mb-6 flex-1 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
        {body}
      </p>
      <Link
        href={href}
        className="font-mono text-xs font-medium"
        style={{ color: 'var(--accent)' }}
      >
        {cta}
      </Link>
    </article>
  );
}

function CategoryCell({
  num,
  label,
  headline,
  body,
  href,
  ctaLabel,
}: {
  num: string;
  label: string;
  headline: string;
  body: string;
  href: string;
  ctaLabel: string;
}) {
  return (
    <Link
      href={href}
      className="block border-b border-r p-6 transition-colors duration-150 hover:bg-bg md:p-8"
      style={{ borderColor: 'var(--border)', backgroundColor: 'transparent' }}
    >
      <div
        className="mb-4 font-mono text-xs text-tertiary"
        style={{ letterSpacing: '0.04em' }}
      >
        {num} · {label}
      </div>
      <h3
        className="mb-3 text-ink"
        style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
      >
        {headline}
      </h3>
      <p className="mb-6 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
        {body}
      </p>
      <span className="font-mono text-xs font-medium" style={{ color: 'var(--accent)' }}>
        {ctaLabel}
      </span>
    </Link>
  );
}

function WhyCallout({ label, body }: { label: string; body: string }) {
  return (
    <div className="border-l pl-6" style={{ borderColor: 'var(--accent)' }}>
      <div
        className="mb-3 font-mono text-xs uppercase text-tertiary"
        style={{ letterSpacing: '0.12em' }}
      >
        {label}
      </div>
      <p className="text-ink" style={{ fontSize: '19px', lineHeight: 1.4, fontWeight: 500, letterSpacing: '-0.01em' }}>
        {body}
      </p>
    </div>
  );
}
