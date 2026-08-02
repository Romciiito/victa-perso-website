import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/sections/page-hero';
import { ProseBlock, type ProseSection } from '@/components/sections/prose-block';

/* Server Component (audit P0-22) — purely static legal content, no
   interactivity, so it renders with zero client JS. */
export async function CookiesBody() {
  const t = await getTranslations('legal.cookies');

  const sections: ProseSection[] = [
    {
      heading: t('sections.0.heading'),
      body: t('sections.0.body'),
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
      body: t('sections.5.body'),
    },
    {
      heading: t('sections.6.heading'),
      body: (
        <>
          {t('contactPre')}
          <a
            href="mailto:privacy@victaagency.com"
            className="text-ink underline underline-offset-2 hover:text-accent"
          >
            privacy@victaagency.com
          </a>
          {t('contactPost')}
        </>
      ),
    },
  ];

  const fullVersionNote = (
    <>
      {t('fullVersionNotePre')}
      <a
        href="mailto:privacy@victaagency.com"
        className="text-ink underline underline-offset-2 hover:text-accent"
      >
        privacy@victaagency.com
      </a>
      {t('fullVersionNotePost')}
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
