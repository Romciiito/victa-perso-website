import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { site } from '@/config/site';
import { SpolupraceBody } from './spoluprace-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}/spoluprace`;
  if (locale === 'en') {
    return {
      title: 'How We Collaborate — VICTA',
      description:
        'A free 30-minute consultation for a specific project, or a paid audit for a full digital-stack transformation. Choose the path that fits your business.',
      alternates: { canonical },
    };
  }
  return {
    title: 'Jak spolupracujeme — konzultace a placený audit',
    description:
      'Bezplatná 30minutová konzultace pro konkrétní zakázku, nebo placený audit pro komplexní transformaci digitálního stacku. Vyberte si cestu, co sedí vaší firmě.',
    alternates: { canonical },
  };
}

export default async function CollaborationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="How we collaborate." pathLabel="/en/spoluprace" />;
  }

  return <SpolupraceBody />;
}
