import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { OdvetviBody } from './odvetvi-body';

type Props = { params: Promise<{ locale: string }> };

export default async function IndustriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Industries." pathLabel="/en/odvetvi" />;
  }

  return <OdvetviBody />;
}
