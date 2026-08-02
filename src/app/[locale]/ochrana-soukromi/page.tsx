import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { site } from '@/config/site';
import { OchranaBody } from './ochrana-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}/ochrana-soukromi`;
  if (locale === 'en') {
    return {
      title: 'Privacy Policy — VICTA',
      description:
        "How VICTA DIGITAL s.r.o. processes visitors' personal data — purposes, legal basis, retention periods and your rights under GDPR.",
      alternates: { canonical },
    };
  }
  return {
    title: 'Zásady ochrany osobních údajů — VICTA',
    description:
      'Jak VICTA DIGITAL s.r.o. zpracovává osobní údaje návštěvníků webu — účely, právní základ, doba uchování i vaše práva podle nařízení GDPR. Přehledně a konkrétně.',
    alternates: { canonical },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OchranaBody />;
}
