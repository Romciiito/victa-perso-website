import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { site } from '@/config/site';
import { KontaktBody } from './kontakt-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === 'en') {
    return {
      title: 'Contact — VICTA',
      description: 'Book a free 30-minute call, write to us, or call directly.',
      alternates: { canonical: `${site.url}/en/kontakt` },
    };
  }
  return {
    title: 'Kontakt — VICTA',
    description:
      'Rezervujte si bezplatnou 30minutovou konzultaci, napište nám na hello@victaagency.com nebo zavolejte. Na nové poptávky odpovídáme do 1 pracovního dne.',
    alternates: { canonical: `${site.url}/cs/kontakt` },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Contact." pathLabel="/en/kontakt" />;
  }

  return <KontaktBody />;
}
