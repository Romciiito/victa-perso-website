import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { site } from '@/config/site';
import { OdvetviBody } from './odvetvi-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}/odvetvi`;
  if (locale === 'en') {
    return {
      title: 'Industries — VICTA',
      description:
        'Eight industries we understand in depth — e-commerce, manufacturing, logistics, finance, energy, healthcare, professional services and customer support.',
      alternates: { canonical },
    };
  }
  return {
    title: 'Odvětví, kterým rozumíme — VICTA',
    description:
      'Osm oborů, kterým rozumíme do hloubky — e-commerce, výroba, logistika, finance, energetika, zdravotnictví, profesionální služby i zákaznická podpora.',
    alternates: { canonical },
  };
}

export default async function IndustriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Industries." pathLabel="/en/odvetvi" />;
  }

  return <OdvetviBody />;
}
