import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';

const geistSans = Geist({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

/* ============================================================
   Root not-found.tsx (audit P1-05)
   ----------------------------------------------------------------
   `src/app/layout.tsx` is a plain passthrough (`return children`) —
   the real <html>/<body> shell normally comes from
   [locale]/layout.tsx. This file sits OUTSIDE the [locale] segment,
   so it needs its own complete document shell, or the rendered page
   would be missing <html>/<body> entirely.

   In practice almost every unmatched path gets rewritten to /cs/...
   by the locale middleware first and hits
   src/app/[locale]/not-found.tsx instead — this is the
   belt-and-suspenders fallback for whatever the middleware matcher
   excludes (public/, files with an extra dot, edge cases). Same
   content, no hooks, no framer-motion, cs default (audit P1-05).
   ============================================================ */
export default function RootNotFound() {
  return (
    <html lang="cs" data-theme="dark" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-mesh antialiased">
        <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center md:px-10">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-secondary">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            Chyba 404
          </span>
          <h1 className="display max-w-[18ch] text-[clamp(40px,6vw,80px)] text-ink">
            Stránka nenalezena.
          </h1>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-secondary">
            Tahle adresa u nás neexistuje nebo byla přesunuta. Zkuste hlavní stránku, nebo nám rovnou napište.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cs"
              className="tactile rounded-full border border-accent bg-accent px-7 py-3.5 text-[14.5px] font-medium text-bg"
            >
              Zpět na hlavní stránku
            </Link>
            <Link
              href="/kontakt#form"
              className="tactile rounded-full border border-border px-7 py-3.5 text-[14.5px] text-ink hover:border-ink"
            >
              Chci konzultaci
            </Link>
          </div>
        </section>
      </body>
    </html>
  );
}
