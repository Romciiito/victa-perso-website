import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { site } from '@/config/site';
import { ONasBody } from './o-nas-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}/o-nas`;
  if (locale === 'en') {
    return {
      title: 'About — VICTA',
      description:
        'Meet VICTA — a small AI-augmented team building apps, AI and systems for medium and larger companies. No templates, no bloated agency overhead.',
      alternates: { canonical },
    };
  }
  return {
    title: 'O VICTA — malý AI-augmented tým pro růst firem',
    description:
      'Poznejte VICTA — malý AI-augmented tým, který staví aplikace, AI a systémy pro střední a větší firmy. Žádné šablony, žádná zbytečná režie velké agentury.',
    alternates: { canonical },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ONasBody />;
}
