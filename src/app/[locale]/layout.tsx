import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { CookiebotScript } from '@/components/consent/cookiebot-script';
import { Ga4Loader } from '@/components/consent/ga4-loader';
import { MotionProvider } from '@/components/motion-provider';
import { JsonLd } from '@/components/seo/json-ld';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/schema';
import { site, type Locale } from '@/config/site';
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Sitewide fallback title/description — sourced from `site.*` in
  // content/{locale}/strings/common.json so this stays in sync with the
  // single source of truth (copy-rewrites.md §1). Individual routes
  // override this via their own generateMetadata.
  const t = await getTranslations({ locale, namespace: 'site' });
  // openGraph/twitter carry no title/description here on purpose — Next.js
  // falls back to the route's resolved `title`/`description` fields when
  // they're absent, so every page's own generateMetadata (which already
  // sets title/description) gets a correct OG/Twitter preview for free
  // (audit P1-03). POZOR: `images` tady být MUSÍ — explicitní `openGraph`
  // objekt přebije file-based auto-injekci z opengraph-image.tsx (gate nález,
  // Vlna 3B: bez tohoto řádku nemá žádná stránka og:image).
  return {
    metadataBase: new URL(site.url),
    title: t('title'),
    description: t('description'),
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: locale === 'en' ? 'en_US' : 'cs_CZ',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/opengraph-image'],
    },
    // EN stub routy jsou thin content — noindex do dosažení EN parity (vision §10, §14 bod 7).
    // Routy zůstávají crawlovatelné (robots.txt je neblokuje), jinak by se noindex nepřečetl.
    ...(locale === 'en' ? { robots: { index: false, follow: false } } : {}),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <CookiebotScript />
        {/* Organization + WebSite are site-wide identity — emitted once on the
            cs locale only (audit P0-23). EN is still a thin stub (noindex), so
            it doesn't need its own copy; page-level schema (Service, FAQPage,
            Breadcrumb, LocalBusiness) is added per-route on the cs tree. */}
        {locale === 'cs' && (
          <JsonLd
            data={[
              buildOrganizationSchema(locale as Locale),
              buildWebSiteSchema(locale as Locale),
            ]}
          />
        )}
      </head>
      <body className="bg-mesh antialiased">
        <MotionProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Nav />
            <main id="main" className="relative">
              {children}
            </main>
            <Footer />
          </NextIntlClientProvider>
          <Ga4Loader />
        </MotionProvider>
      </body>
    </html>
  );
}
