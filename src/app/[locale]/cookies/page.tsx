import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { site } from '@/config/site';
import { CookiesBody } from './cookies-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}/cookies`;
  if (locale === 'en') {
    return {
      title: 'Cookie Policy — VICTA',
      description:
        "How VICTA uses cookies and similar technologies, what they're for, and how you can change or withdraw consent anytime via the Cookiebot banner.",
      alternates: { canonical },
    };
  }
  return {
    title: 'Zásady používání cookies — VICTA',
    description:
      'Jaké cookies a podobné technologie VICTA používá, k čemu slouží a jak můžete svůj souhlas kdykoliv změnit nebo odvolat v nastavení Cookiebot banneru.',
    alternates: { canonical },
  };
}

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Cookie policy." pathLabel="/en/cookies" />;
  }

  return <CookiesBody />;
}
