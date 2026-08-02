import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

/* ============================================================
   [locale]/not-found.tsx (audit P1-05, Vlna 2b-EN parity)
   ----------------------------------------------------------------
   Next.js `not-found.js` files never receive route params (not even
   nested ones), but this file lives inside the `[locale]` layout
   tree, whose `setRequestLocale()` call already populates next-intl's
   request-scoped locale — so `getLocale()`/`getTranslations()` still
   resolve correctly here even without a `params` prop. No client
   hooks, no framer-motion — a 404 page must render even if the
   interactive layer (booking modal) is what's broken.

   Still renders inside [locale]/layout.tsx's chrome (Nav/Footer),
   since Next nests the not-found boundary within the segment's own
   layout tree — only this file's own content is plain and static.
   ============================================================ */
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('common');
  const tCta = await getTranslations('common.ctaBand');

  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center md:px-10">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-secondary">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        {t('notFound.badge')}
      </span>
      <h1 className="display max-w-[18ch] text-[clamp(40px,6vw,80px)] text-ink">
        {t('notFound.headline')}
      </h1>
      <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-secondary">
        {t('notFound.body')}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/${locale}`}
          className="tactile rounded-full border border-accent bg-accent px-7 py-3.5 text-[14.5px] font-medium text-bg"
        >
          {t('backHome')}
        </Link>
        <Link
          href={`/${locale}/kontakt#form`}
          className="tactile rounded-full border border-border px-7 py-3.5 text-[14.5px] text-ink hover:border-ink"
        >
          {tCta('primaryCta')}
        </Link>
      </div>
    </section>
  );
}
