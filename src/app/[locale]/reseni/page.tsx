import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { ReseniBody } from './reseni-body';

type Props = { params: Promise<{ locale: string }> };

export default async function ReseniPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Solutions." pathLabel="/en/reseni" />;
  }

  return <ReseniBody />;
}
