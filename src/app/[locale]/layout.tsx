import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { CookiebotScript } from '@/components/consent/cookiebot-script';
import { Ga4Loader } from '@/components/consent/ga4-loader';
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
    <html
      lang={locale}
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <CookiebotScript />
      </head>
      <body className="bg-mesh antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Nav />
          <main id="main" className="relative">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
        <Ga4Loader />
      </body>
    </html>
  );
}
