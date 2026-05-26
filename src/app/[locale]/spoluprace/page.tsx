import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { SpolupraceBody } from './spoluprace-body';

type Props = { params: Promise<{ locale: string }> };

export default async function CollaborationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="How we collaborate." pathLabel="/en/spoluprace" />;
  }

  return <SpolupraceBody />;
}
