import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { site } from '@/config/site';
import { ReseniBody } from './reseni-body';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${site.url}/${locale}/reseni`;
  if (locale === 'en') {
    return {
      title: 'Solutions — VICTA',
      description:
        'Knowledge assistants, autonomous agents, AI customer support, data dashboards and AI infrastructure — five packaged solutions connected to your systems.',
      alternates: { canonical },
    };
  }
  return {
    title: 'AI agenti a asistenti pro firmy — VICTA',
    description:
      'Znalostní asistent, autonomní agenti, AI podpora zákazníků, datové dashboardy a AI infrastruktura — pět řešení napojených na vaše systémy, ne obecné demo.',
    alternates: { canonical },
  };
}

export default async function ReseniPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Solutions." pathLabel="/en/reseni" />;
  }

  return <ReseniBody />;
}
