import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  ShoppingCart,
  Factory,
  Truck,
  Briefcase,
  Bank,
  Lightning,
  Stethoscope,
  Heartbeat,
  Headphones,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';
import { Eyebrow } from '@/components/eyebrow';
import { EditorialSplit } from '@/components/editorial-split';
import { BentoShell, BentoCard } from '@/components/bento';
import { Button } from '@/components/button';
import { EnglishStub } from '@/components/en-stub';
import { Link } from '@/i18n/navigation';
import { getAllIndustries, type Industry } from '@/lib/content';

type Props = { params: Promise<{ locale: string }> };

/* ============================================================
   /[locale]/odvetvi — Industries overview (8 verticals)
   D-008: EditorialSplit hero + 3-col bento grid linking to detail.
   ============================================================ */

// Lucide icon name → Phosphor mapping (content.json uses Lucide names
// historically; Phosphor equivalents preserve semantic meaning).
const iconMap: Record<string, PhosphorIcon> = {
  ShoppingCart,
  Factory,
  Truck,
  Briefcase,
  Landmark: Bank, // Lucide Landmark → Phosphor Bank
  Zap: Lightning, // Lucide Zap → Phosphor Lightning
  Stethoscope,
  HeartPulse: Heartbeat, // Lucide HeartPulse → Phosphor Heartbeat
  Headphones,
};

export default async function IndustriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Industries." pathLabel="/en/odvetvi" />;
  }
  const t = await getTranslations('odvetvi');
  const industries = getAllIndustries();

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

            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--ink-soft)',
                maxWidth: '52ch',
              }}
            >
              {t('intro')}
            </p>
          </>
        }
        right={
          <BentoShell>
            <BentoCard padding="loose">
              <div
                className="font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
              >
                Odvětví, kterým rozumíme
              </div>
              <div
                style={{
                  fontSize: 'clamp(48px, 5vw, 72px)',
                  fontWeight: 500,
                  letterSpacing: '-0.045em',
                  lineHeight: 1,
                  color: 'var(--ink)',
                }}
              >
                {industries.length}
              </div>
              <div style={{ fontSize: '15px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                vertikál s reálnými implementacemi. Když vaše není v seznamu, neznamená to že nemáme
                fit — řekněte nám o sobě.
              </div>
            </BentoCard>
          </BentoShell>
        }
      />

      {/* Industries grid */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <IndustryCard key={industry.slug} industry={industry} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1100px] text-center">
          <h2
            className="mb-6"
            style={{
              fontSize: 'clamp(32px, 4vw, 56px)',
              lineHeight: 1.04,
              letterSpacing: '-0.045em',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            Vaše odvětví není v&nbsp;seznamu?
          </h2>
          <p
            className="mb-10"
            style={{
              fontSize: '19px',
              lineHeight: 1.5,
              color: 'var(--ink-muted)',
              maxWidth: '50ch',
              margin: '0 auto 40px',
            }}
          >
            Řekněte nám o&nbsp;svém byznysu. AI principy se přenášejí — fit většinou najdeme.
          </p>
          <div className="flex flex-wrap items-center justify-center" style={{ gap: '12px' }}>
            <Button href="/spoluprace#audit" variant="primary" size="md">
              Rezervovat audit
            </Button>
            <Button href="/kontakt" variant="ghost" size="md">
              Domluvit konzultaci
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function IndustryCard({ industry }: { industry: Industry }) {
  const Icon = iconMap[industry.icon] ?? Briefcase;
  return (
    <Link href={`/odvetvi/${industry.slug}`} className="block">
      <BentoShell>
        <BentoCard padding="standard">
          <div className="flex items-center justify-between">
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              <Icon size={18} weight="light" aria-hidden />
            </div>
            <ArrowRight
              size={14}
              weight="light"
              aria-hidden
              style={{ color: 'var(--ink-soft)' }}
            />
          </div>
          <h2
            style={{
              fontSize: '20px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              fontWeight: 600,
              color: 'var(--ink)',
              marginTop: '8px',
            }}
          >
            {industry.name}
          </h2>
          <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
            {industry.body.length > 180 ? industry.body.slice(0, 177) + '…' : industry.body}
          </p>
        </BentoCard>
      </BentoShell>
    </Link>
  );
}
