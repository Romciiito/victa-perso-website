import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  Activity,
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Code2,
  Database,
  Headphones,
  Heart,
  Layers,
  MessageCircle,
  MessageSquare,
  Package,
  Search,
  Server,
  Settings,
  Shield,
  ShoppingCart,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/button';
import { StatusLine } from '@/components/status-line';
import { OfferingSection, type OfferingItem } from '@/components/offering-section';
import { EditorialSplit } from '@/components/editorial-split';
import { Eyebrow } from '@/components/eyebrow';
import { BentoShell, BentoCard } from '@/components/bento';
import { VisualCanvas } from '@/components/visual-canvas';

type Props = { params: Promise<{ locale: string }> };

/* ============================================================
   Offering icon maps — keep icon binding co-located with order
   from i18n JSON. Each array index maps to the matching items[i]
   in `home.offerings.<section>.items`.
   ============================================================ */
type RawOfferingItem = { title: string; subtitle: string; href?: string };

const servicesIcons: ReadonlyArray<LucideIcon> = [
  Search, // 1 · AI Discovery
  Target, // 2 · AI Strategie
  Database, // 3 · Datová platforma
  Code2, // 4 · AI-driven vývoj
  Shield, // 5 · AI Governance
  Activity, // 6 · Provoz a MLOps
];

const solutionsIcons: ReadonlyArray<LucideIcon> = [
  MessageSquare, // 1 · GenAI a RAG asistenti
  Boxes, // 2 · Autonomní AI agenti
  Headphones, // 3 · AI zákaznická podpora
  BarChart3, // 4 · Prediktivní analytika
  Server, // 5 · AI Infrastruktura
];

const industriesIcons: ReadonlyArray<LucideIcon> = [
  ShoppingCart, // 1 · E-commerce a maloobchod
  TrendingUp, // 2 · Finance a Fintech
  Heart, // 3 · Zdravotnictví a medtech
  Settings, // 4 · Výroba a logistika
  Zap, // 5 · Energetika a utility
  MessageCircle, // 6 · Zákaznická podpora a CX
  Briefcase, // 7 · Profesionální služby
];

function buildOfferingItems(
  raw: ReadonlyArray<RawOfferingItem>,
  icons: ReadonlyArray<LucideIcon>,
): ReadonlyArray<OfferingItem> {
  return raw.map((it, i) => ({
    icon: icons[i] ?? icons[icons.length - 1] ?? Briefcase,
    title: it.title,
    subtitle: it.subtitle,
    href: it.href,
  }));
}

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


  return (
    <>
      {/* ============================================================
           HERO  (D-008 EditorialSplit)
           Left:  Eyebrow + H1 (Geist 600 + Newsreader italic accent) + sub
                  + mono tags + CTAs (pill + Button-in-Button arrow)
           Right: Variant C visual canvas (top, span-2) + 2 lead bentos
                  (audit + consult) in Double-Bezel pattern
           ============================================================ */}
      <EditorialSplit
        padding="hero"
        left={
          <>
            <Eyebrow>{t('hero.status')}</Eyebrow>

            <h1
              className="text-ink"
              style={{
                fontSize: 'clamp(56px, 8vw, 116px)',
                lineHeight: 0.94,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                maxWidth: '14ch',
              }}
            >
              {t('hero.headlineLead')}{' '}
              <em
                className="accent"
                style={{ fontWeight: 300, fontStyle: 'italic', letterSpacing: '-0.03em' }}
              >
                {t('hero.headlineAccent')}
              </em>
            </h1>

            <p
              style={{
                fontSize: '19px',
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                maxWidth: '44ch',
                fontWeight: 400,
              }}
            >
              {t('hero.sub')}
            </p>

            {/* Tags row · Geist Mono uppercase, ink-soft dots */}
            <div
              className="flex flex-wrap items-center font-mono uppercase"
              style={{
                gap: '14px',
                fontSize: '12px',
                letterSpacing: '0.05em',
                color: 'var(--ink-soft)',
              }}
            >
              <span>{t('hero.tagsAudit')}</span>
              <span
                aria-hidden
                className="inline-block h-[5px] w-[5px] rounded-full"
                style={{ background: 'var(--ink-soft)' }}
              />
              <span>{t('hero.tagsDev')}</span>
              <span
                aria-hidden
                className="inline-block h-[5px] w-[5px] rounded-full"
                style={{ background: 'var(--ink-soft)' }}
              />
              <span>{t('hero.tagsMarketing')}</span>
              <span
                aria-hidden
                className="inline-block h-[5px] w-[5px] rounded-full"
                style={{ background: 'var(--ink-soft)' }}
              />
              <span>{t('hero.tagsAi')}</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              <Button href="/spoluprace#audit" variant="primary" size="md">
                {t('hero.ctaPrimary')}
              </Button>
              <Button href="/kontakt" variant="ghost" size="md">
                {t('hero.ctaGhost')}
              </Button>
            </div>
          </>
        }
        right={
          <div
            className="grid h-full content-center"
            style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}
          >
            {/* Top row (span 2): Visual canvas — Variant C per spec */}
            <BentoShell span={2}>
              <VisualCanvas
                tag={t('hero.visualTag')}
                title={t('hero.visualTitle')}
                minHeight={200}
              />
            </BentoShell>

            {/* Bottom row: audit + consult bentos */}
            <BentoShell>
              <BentoCard>
                <div
                  className="flex items-start justify-between"
                  style={{ gap: '8px' }}
                >
                  <div
                    className="font-mono uppercase"
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.18em',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {t('hero.leadAuditLabel')} · {t('hero.leadAuditPriceFrom')}
                    {t('hero.leadAuditPrice')}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 500,
                    letterSpacing: '-0.015em',
                    color: 'var(--ink)',
                    lineHeight: 1.25,
                  }}
                >
                  {t('hero.leadAuditHeadline')}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.45,
                  }}
                >
                  {t('hero.leadAuditMeta')}
                </div>
              </BentoCard>
            </BentoShell>

            <BentoShell>
              <BentoCard>
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    color: 'var(--ink-soft)',
                  }}
                >
                  {t('hero.leadConsultLabel')}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(28px, 3.5vw, 40px)',
                    fontWeight: 500,
                    letterSpacing: '-0.04em',
                    color: 'var(--ink)',
                    lineHeight: 1,
                  }}
                >
                  {t('hero.leadConsultHeadline')}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.45,
                  }}
                >
                  {t('hero.leadConsultMeta')}
                </div>
              </BentoCard>
            </BentoShell>
          </div>
        }
      />

      {/* ============================================================
           OFFERINGS — three Atol-style sections
             A. Services for the AI journey   (6 cells)
             B. Turnkey AI solutions          (5 cells)
             C. AI solutions per industry     (7 cells)
           Layout per section: 6-cell light grid LEFT + dark sticky
           sidebar RIGHT on desktop · sidebar on TOP, cells below on mobile.
           ============================================================ */}
      <OfferingSection
        id="sluzby"
        sidebarIcon={Layers}
        sidebarHeadline={t('offerings.services.headline')}
        sidebarDescription={t('offerings.services.description')}
        sidebarCtaLabel={t('offerings.ctaAll')}
        sidebarCtaHref={t('offerings.services.ctaHref')}
        items={buildOfferingItems(
          t.raw('offerings.services.items') as ReadonlyArray<RawOfferingItem>,
          servicesIcons,
        )}
      />

      <OfferingSection
        id="reseni"
        sidebarIcon={Package}
        sidebarHeadline={t('offerings.solutions.headline')}
        sidebarDescription={t('offerings.solutions.description')}
        sidebarCtaLabel={t('offerings.ctaAll')}
        sidebarCtaHref={t('offerings.solutions.ctaHref')}
        items={buildOfferingItems(
          t.raw('offerings.solutions.items') as ReadonlyArray<RawOfferingItem>,
          solutionsIcons,
        )}
      />

      <OfferingSection
        id="odvetvi"
        sidebarIcon={Building2}
        sidebarHeadline={t('offerings.industries.headline')}
        sidebarDescription={t('offerings.industries.description')}
        sidebarCtaLabel={t('offerings.ctaAll')}
        sidebarCtaHref={t('offerings.industries.ctaHref')}
        items={buildOfferingItems(
          t.raw('offerings.industries.items') as ReadonlyArray<RawOfferingItem>,
          industriesIcons,
        )}
      />

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
              ctaHref="/spoluprace#audit"
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
              ctaHref="/spoluprace#audit"
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
              ctaHref="/spoluprace#audit"
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
