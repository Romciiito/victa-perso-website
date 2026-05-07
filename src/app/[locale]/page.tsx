import { setRequestLocale, getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <main className="relative min-h-screen px-6 py-24 md:px-12 md:py-32">
      <div className="relative mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-wider text-tertiary mb-8">
          {t('status')}
        </p>
        <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.035em] leading-[1.04] text-ink mb-8">
          {t('headline')}
        </h1>
        <p className="text-xl md:text-2xl text-secondary leading-relaxed max-w-2xl mb-12">
          {t('subhead')}
        </p>
        <p className="font-mono text-sm text-tertiary">
          {t('wip')}
        </p>
      </div>
    </main>
  );
}
