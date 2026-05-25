import type { Metadata } from 'next';
import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { BodyOrbs } from '@/components/body-orbs';
import { CookiebotScript } from '@/components/consent/cookiebot-script';
import { Ga4Loader } from '@/components/consent/ga4-loader';
import { antiFlashScript } from '@/lib/anti-flash';
import '@/styles/globals.css';

const geist = Geist({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: ['300'],
  style: ['italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://victaagency.com'),
  title: 'VICTA',
  description: 'Začneme tím, že posloucháme. Než cokoliv navrhneme, chceme rozumět vašemu podnikání.',
};

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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
        <CookiebotScript />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem storageKey="victa-theme">
          <BodyOrbs />
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Nav />
            <main id="main" className="relative">
              {children}
            </main>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
        <Ga4Loader />
      </body>
    </html>
  );
}
