'use client';

import { useTranslations } from 'next-intl';
import { PageHero } from '@/components/sections/page-hero';
import { SectionHeader } from '@/components/sections/section-header';
import { KineticList, type KineticItem } from '@/components/sections/kinetic-list';
import { MagneticCta } from '@/components/sections/magnetic-cta';
import { INDUSTRIES_OFFERING } from '@/lib/offerings-data';

const KINETIC_ITEMS: ReadonlyArray<KineticItem> = INDUSTRIES_OFFERING.items.map((it) => ({
  icon: it.icon,
  title: it.title,
  subtitle: it.subtitle,
  href: it.href,
}));

export function OdvetviBody() {
  const t = useTranslations('odvetvi');

  return (
    <>
      <PageHero
        status={t('hero.status')}
        headline={t('hero.headline')}
        sub={t('hero.subhead')}
      />

      {/* ---- Industries ---- */}
      <section id="industries" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            eyebrow="01 · odvětví"
            title={t('sectionTitle')}
            lead={t('intro')}
          />
          <KineticList items={KINETIC_ITEMS} />
        </div>
      </section>

      {/* ---- CTA band ---- */}
      <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              02 · další krok
            </span>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(40px,5vw,72px)] text-ink">
              {t('ctaLine')}
            </h2>
          </div>
          <div className="flex flex-col items-start justify-end gap-3 md:items-end">
            <MagneticCta primary href="/spoluprace#audit">
              {t('ctaButton')}
            </MagneticCta>
            <MagneticCta href="/kontakt">Domluvit konzultaci</MagneticCta>
          </div>
        </div>
      </section>
    </>
  );
}
