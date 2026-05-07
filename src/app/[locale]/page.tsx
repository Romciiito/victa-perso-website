import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/button';
import { StatusLine } from '@/components/status-line';

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') return <EnglishStub />;
  return <CzechHome />;
}

/* ============================================================
   CZECH HOMEPAGE — matches docs/design-exploration/locked-preview.html
   This is the canonical visual contract per D-001 / design-decision.md §3.
   Every visible Czech string and section structure mirrors the locked preview.
   ============================================================ */
async function CzechHome() {
  const t = await getTranslations('home');

  // Czech tags row uses the middle dot (·) wrapped in accent-coloured spans, with
  // non-breaking spaces hugging the bullet on both sides.
  const NBSP = ' ';

  return (
    <>
      {/* ============================================================
           HERO  (locked-preview .hero)
           padding: 96px 48px 64px desktop · 64px 24px 48px mobile
           ============================================================ */}
      <section
        className="relative px-6 pb-16 pt-16 md:px-12 md:pb-16 md:pt-24"
        style={{ paddingTop: 'var(--space-24, 96px)', paddingBottom: 'var(--space-16, 64px)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          {/* H1 */}
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

          {/* Tags row · Geist Mono, secondary, accent bullets */}
          <div
            className="mb-8 font-mono text-secondary"
            style={{ fontSize: '13px', letterSpacing: 0 }}
          >
            <span>{t('hero.tagsAudit')}</span>
            {NBSP}
            <span style={{ color: 'var(--accent)' }}>·</span>
            {NBSP}
            <span>{t('hero.tagsDev')}</span>
            {NBSP}
            <span style={{ color: 'var(--accent)' }}>·</span>
            {NBSP}
            <span>{t('hero.tagsMarketing')}</span>
            {NBSP}
            <span style={{ color: 'var(--accent)' }}>·</span>
            {NBSP}
            <span>{t('hero.tagsAi')}</span>
          </div>

          {/* Divider — width 920px, 1px border-soft, vertical margin 32px */}
          <div
            className="my-8"
            style={{
              width: '100%',
              maxWidth: '920px',
              height: '1px',
              backgroundColor: 'var(--border-soft)',
            }}
          />

          {/* Sub paragraph */}
          <p
            className="mb-8 text-secondary"
            style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '520px' }}
          >
            {t('hero.sub')}
          </p>

          {/* Lead row · two columns: audit price + free consultation */}
          <div
            className="mb-8 flex flex-wrap items-baseline"
            style={{ gap: 'var(--space-16, 64px)' }}
          >
            <div className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.55 }}>
              <strong
                className="block text-ink"
                style={{ fontWeight: 500, marginBottom: '4px' }}
              >
                {t('hero.leadAuditLabel')}
              </strong>
              {t('hero.leadAuditPriceFrom')}
              <span className="font-mono text-ink" style={{ fontSize: '13px' }}>
                {t('hero.leadAuditPrice')}
              </span>
            </div>
            <div className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.55 }}>
              <strong
                className="block text-ink"
                style={{ fontWeight: 500, marginBottom: '4px' }}
              >
                {t('hero.leadConsultLabel')}
              </strong>
              {t('hero.leadConsultBody')}
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/spoluprace#audit" variant="primary" size="md">
              {t('hero.ctaPrimary')}
            </Button>
            <Button href="/kontakt" variant="ghost" size="md">
              {t('hero.ctaGhost')}
            </Button>
          </div>

          {/* Status line — bottom of hero, 48px above */}
          <div className="mt-12">
            <StatusLine>{t('hero.status')}</StatusLine>
          </div>
        </div>
      </section>

      {/* ============================================================
           SERVICES  (locked-preview .services)
           4-cell modular grid (2 cols on desktop, 1 col on mobile)
           ============================================================ */}
      <section
        id="sluzby"
        className="relative border-t border-border-soft px-6 py-16 md:px-12 md:py-16"
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <h2
            className="mb-12 text-ink"
            style={{
              fontSize: 'clamp(28px, 3.6vw, 45px)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              fontWeight: 500,
              maxWidth: '760px',
            }}
          >
            {t('services.heading')}
          </h2>

          <div
            className="services-grid grid grid-cols-1 overflow-hidden rounded-lg border-l border-t md:grid-cols-2"
            style={{ borderColor: 'var(--border)' }}
          >
            <ServiceCell
              num={t('services.items.audit.num')}
              title={t('services.items.audit.title')}
              body={t('services.items.audit.body')}
              meta={t('services.items.audit.meta')}
              ctaLabel={t('services.items.audit.ctaLabel')}
              href="/spoluprace#audit"
            />
            <ServiceCell
              num={t('services.items.dev.num')}
              title={t('services.items.dev.title')}
              body={t('services.items.dev.body')}
              meta={t('services.items.dev.meta')}
              ctaLabel={t('services.items.dev.ctaLabel')}
              href="/sluzby#it-vyvoj"
            />
            <ServiceCell
              num={t('services.items.marketing.num')}
              title={t('services.items.marketing.title')}
              body={t('services.items.marketing.body')}
              meta={t('services.items.marketing.meta')}
              ctaLabel={t('services.items.marketing.ctaLabel')}
              href="/sluzby#marketing"
            />
            <ServiceCell
              num={t('services.items.ai.num')}
              title={t('services.items.ai.title')}
              body={t('services.items.ai.body')}
              meta={t('services.items.ai.meta')}
              ctaLabel={t('services.items.ai.ctaLabel')}
              href="/sluzby#ai-data"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
           AUDIT PRICING  (locked-preview .audit-section)
           3 tiers · middle (Tier 1) marked .popular with accent ring
           ============================================================ */}
      <section
        id="audit"
        className="relative border-t border-b border-border-soft px-6 py-16 md:px-12 md:py-16"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-12 max-w-[760px]">
            <h2
              className="mb-4 text-ink"
              style={{
                fontSize: 'clamp(28px, 3.6vw, 45px)',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                fontWeight: 500,
              }}
            >
              {t('audit.heading')}
            </h2>
            <p className="text-secondary" style={{ fontSize: '19px', lineHeight: 1.5 }}>
              {t('audit.subhead')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Tier 1 (popular) */}
            <AuditCard
              tier={t('audit.tier1.tier')}
              badge={t('audit.tier1.badge')}
              popular
              name={t('audit.tier1.name')}
              price={t('audit.tier1.price')}
              priceEur={t('audit.tier1.priceEur')}
              includesLabel={t('audit.includesLabel')}
              bullets={[
                t('audit.tier1.deliverables.0'),
                t('audit.tier1.deliverables.1'),
                t('audit.tier1.deliverables.2'),
                t('audit.tier1.deliverables.3'),
                t('audit.tier1.deliverables.4'),
              ]}
              ctaLabel={t('audit.tier1.cta')}
              ctaHref="/kontakt"
              ctaVariant="primary"
            />
            {/* Tier 2 */}
            <AuditCard
              tier={t('audit.tier2.tier')}
              name={t('audit.tier2.name')}
              price={t('audit.tier2.price')}
              priceEur={t('audit.tier2.priceEur')}
              includesLabel={t('audit.includesLabel')}
              bullets={[
                t('audit.tier2.deliverables.0'),
                t('audit.tier2.deliverables.1'),
                t('audit.tier2.deliverables.2'),
                t('audit.tier2.deliverables.3'),
              ]}
              ctaLabel={t('audit.tier2.cta')}
              ctaHref="/kontakt"
              ctaVariant="ghost"
            />
            {/* Tier 3 */}
            <AuditCard
              tier={t('audit.tier3.tier')}
              name={t('audit.tier3.name')}
              price={t('audit.tier3.price')}
              priceEur={t('audit.tier3.priceEur')}
              includesLabel={t('audit.includesLabel')}
              bullets={[
                t('audit.tier3.deliverables.0'),
                t('audit.tier3.deliverables.1'),
                t('audit.tier3.deliverables.2'),
                t('audit.tier3.deliverables.3'),
              ]}
              ctaLabel={t('audit.tier3.cta')}
              ctaHref="/kontakt"
              ctaVariant="ghost"
            />
          </div>

          {/* Scoping call line */}
          <p
            className="mt-8 text-center text-secondary"
            style={{ fontSize: '15px' }}
          >
            {t('audit.scopingPrefix')}
            <Link
              href="/kontakt"
              style={{
                color: 'var(--accent)',
                fontWeight: 500,
                borderBottom: '1px solid var(--accent)',
                paddingBottom: '2px',
              }}
            >
              {t('audit.scopingLink')}
            </Link>
            {t('audit.scopingSuffix')}
          </p>
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
   ServiceCell — single cell in the 4-up modular services grid
   (locked-preview .service-cell)
   ============================================================ */
function ServiceCell({
  num,
  title,
  body,
  meta,
  ctaLabel,
  href,
}: {
  num: string;
  title: string;
  body: string;
  meta: string;
  ctaLabel: string;
  href: string;
}) {
  return (
    <article
      className="service-cell border-b border-r p-8 transition-colors duration-150 hover:bg-surface"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    >
      <div
        className="mb-4 font-mono text-xs text-tertiary"
        style={{ letterSpacing: '0.04em' }}
      >
        {num}
      </div>
      <h3
        className="mb-3 text-ink"
        style={{ fontSize: '25px', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 500 }}
      >
        {title}
      </h3>
      <p className="mb-6 text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
        {body}
      </p>
      <div
        className="flex items-center justify-between font-mono text-xs text-ink"
      >
        <span>{meta}</span>
        <Link
          href={href}
          style={{ color: 'var(--accent)', fontWeight: 500 }}
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}

/* ============================================================
   AuditCard — single tier card in the audit pricing 3-up grid
   (locked-preview .audit-card · .popular variant for emphasized tier)
   ============================================================ */
function AuditCard({
  tier,
  badge,
  name,
  price,
  priceEur,
  includesLabel,
  bullets,
  ctaLabel,
  ctaHref,
  ctaVariant,
  popular = false,
}: {
  tier: string;
  badge?: string;
  name: string;
  price: string;
  priceEur: string;
  includesLabel: string;
  bullets: ReadonlyArray<string>;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: 'primary' | 'ghost';
  popular?: boolean;
}) {
  return (
    <article
      className={`audit-card flex h-full flex-col rounded-lg border p-8 ${popular ? 'popular' : ''}`}
      style={{
        backgroundColor: 'var(--bg)',
        borderColor: popular ? 'var(--accent)' : 'var(--border)',
        boxShadow: popular ? '0 0 0 1px var(--accent)' : undefined,
      }}
    >
      {/* Tier row */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <span
          className="font-mono uppercase"
          style={{
            color: 'var(--tertiary)',
            fontSize: '12px',
            letterSpacing: '0.12em',
          }}
        >
          {tier}
        </span>
        {popular && badge ? (
          <span
            className="font-mono uppercase"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>

      {/* Name */}
      <h3
        className="mb-6 text-ink"
        style={{ fontSize: '25px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2 }}
      >
        {name}
      </h3>

      {/* Price (CZK primary) */}
      <div
        className="font-mono text-ink"
        style={{ fontSize: '33px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}
      >
        {price}
      </div>
      {/* Price (EUR secondary) */}
      <div className="font-mono text-secondary" style={{ fontSize: '13px', marginBottom: '24px' }}>
        {priceEur}
      </div>

      {/* Divider */}
      <hr className="border-0 border-t" style={{ borderColor: 'var(--border)', margin: '24px 0' }} />

      {/* Includes label */}
      <div
        className="mb-4 font-mono uppercase"
        style={{
          color: 'var(--tertiary)',
          fontSize: '12px',
          letterSpacing: '0.12em',
        }}
      >
        {includesLabel}
      </div>

      {/* Bullets */}
      <ul className="mb-8 flex-1 list-none">
        {bullets.map((b, i) => (
          <li
            key={`${i}-${b.slice(0, 16)}`}
            className="relative pl-6 text-ink"
            style={{ fontSize: '13px', lineHeight: 1.7, marginBottom: '8px' }}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 select-none font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              ✓
            </span>
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button href={ctaHref} variant={ctaVariant} className="w-full">
        {ctaLabel}
      </Button>
    </article>
  );
}
