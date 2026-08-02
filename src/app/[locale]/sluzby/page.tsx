import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { site } from '@/config/site';
import { SluzbyBody } from './sluzby-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}/sluzby`;
  if (locale === 'en') {
    return {
      title: 'Services — VICTA',
      description:
        '18 services under one roof — custom web development, AI chatbots and automation, SEO and AEO, PPC campaigns and full marketing strategy.',
      alternates: { canonical },
    };
  }
  return {
    title: '18 služeb: vývoj, AI a marketing pro firmy — VICTA',
    description:
      '18 služeb pod jednou střechou — weby na míru, AI chatboti a automatizace, SEO a AEO, PPC kampaně i kompletní marketingová strategie pro střední a větší firmy.',
    alternates: { canonical },
  };
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SluzbyBody />;
}
