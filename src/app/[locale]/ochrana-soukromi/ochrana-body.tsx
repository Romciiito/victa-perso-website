'use client';

import { useTranslations } from 'next-intl';
import { PageHero } from '@/components/sections/page-hero';
import { ProseBlock, type ProseSection } from '@/components/sections/prose-block';

export function OchranaBody() {
  const t = useTranslations('legal.privacy');

  const sections: ProseSection[] = [
    {
      heading: t('sections.0.heading'),
      body: (
        <>
          {
            'Správcem osobních údajů ve smyslu čl. 4 odst. 7 GDPR je Victa Digital s.r.o., se sídlem v Praze, IČO [doplnit]. Pro veškeré dotazy týkající se ochrany osobních údajů se prosím obracejte na adresu '
          }
          <a
            href="mailto:privacy@victaagency.com"
            className="text-ink underline underline-offset-2 hover:text-accent"
          >
            privacy@victaagency.com
          </a>
          {'.'}
        </>
      ),
    },
    {
      heading: t('sections.1.heading'),
      body: t('sections.1.body'),
    },
    {
      heading: t('sections.2.heading'),
      body: t('sections.2.body'),
    },
    {
      heading: t('sections.3.heading'),
      body: t('sections.3.body'),
    },
    {
      heading: t('sections.4.heading'),
      body: t('sections.4.body'),
    },
    {
      heading: t('sections.5.heading'),
      body: (
        <>
          {
            'Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost, vznesení námitky a odvolání souhlasu (čl. 15–22 GDPR). Žádost můžete podat na '
          }
          <a
            href="mailto:privacy@victaagency.com"
            className="text-ink underline underline-offset-2 hover:text-accent"
          >
            privacy@victaagency.com
          </a>
          {' — vyřízení do 30 dnů. Stížnost můžete podat u Úřadu pro ochranu osobních údajů ('}
          <a
            href="https://uoou.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-2 hover:text-accent"
          >
            uoou.cz
          </a>
          {').'}
        </>
      ),
    },
    {
      heading: t('sections.6.heading'),
      body: t('sections.6.body'),
    },
    {
      heading: t('sections.7.heading'),
      body: t('sections.7.body'),
    },
  ];

  const fullVersionNote = (
    <>
      {
        'Toto je shrnutá veřejná verze. Plné znění s detailními tabulkami zpracovatelů, dob uchování a kontaktů na dozorové úřady aktualizujeme po právním reviewu — pro plné znění nás kontaktujte na '
      }
      <a
        href="mailto:privacy@victaagency.com"
        className="text-ink underline underline-offset-2 hover:text-accent"
      >
        privacy@victaagency.com
      </a>
      {'.'}
    </>
  );

  return (
    <>
      <PageHero
        status={t('version')}
        headline={t('title')}
        sub={t('intro')}
      />

      <section className="border-t border-border-soft px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1400px]">
          <ProseBlock sections={sections} note={undefined} />

          <div className="mx-auto mt-14 max-w-[64ch] rounded-card border border-border bg-surface p-8">
            <p className="text-[15px] leading-[1.6] text-secondary">
              {fullVersionNote}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
