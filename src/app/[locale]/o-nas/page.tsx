import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { ONasBody } from './o-nas-body';

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="About VICTA." pathLabel="/en/o-nas" />;
  }

  return <ONasBody />;
}
