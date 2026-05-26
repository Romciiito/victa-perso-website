import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { CookiesBody } from './cookies-body';

type Props = { params: Promise<{ locale: string }> };

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Cookie policy." pathLabel="/en/cookies" />;
  }

  return <CookiesBody />;
}
