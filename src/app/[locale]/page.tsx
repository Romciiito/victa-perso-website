import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { site } from '@/config/site';
import { HomeBody } from './home-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}`;
  if (locale === 'en') {
    return {
      title: 'VICTA — Apps, AI and Systems for Business Growth',
      description:
        'VICTA builds apps, AI and business systems for medium and larger companies in Czechia and Slovakia — with a clear process from intent to operations.',
      alternates: { canonical },
    };
  }
  return {
    title: 'VICTA — aplikace, AI a systémy pro růst firem',
    description:
      'VICTA staví aplikace, AI a firemní systémy pro střední a větší firmy v Česku a na Slovensku. Jasný proces od záměru po provoz, žádné sliby bez plánu.',
    alternates: { canonical },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeBody />;
}
