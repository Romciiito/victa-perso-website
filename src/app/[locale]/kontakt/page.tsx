import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/button';
import { StatusLine } from '@/components/status-line';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Contact." pathLabel="/en/kontakt" />;
  }
  const t = await getTranslations('kontakt');

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pb-12 pt-16 md:px-12 md:pb-16 md:pt-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-8">
            <StatusLine>{t('hero.status')}</StatusLine>
          </div>
          <h1
            className="mb-6 text-ink"
            style={{
              fontSize: 'clamp(48px, 6vw, 80px)',
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              maxWidth: '720px',
            }}
          >
            {t('hero.headline')}
          </h1>
          <p
            className="mb-8 text-secondary"
            style={{ fontSize: '19px', lineHeight: 1.55, maxWidth: '720px' }}
          >
            {t('hero.subhead')}
          </p>
        </div>
      </section>

      {/* Primary path */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <article
            className="rounded-lg border p-8 md:p-12"
            style={{
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--bg)',
              boxShadow: '0 0 0 1px var(--accent)',
            }}
          >
            <div
              className="mb-4 font-mono text-xs uppercase text-accent"
              style={{ letterSpacing: '0.12em' }}
            >
              {t('primary.label')}
            </div>
            <h2
              className="mb-4 text-ink"
              style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500, maxWidth: '720px' }}
            >
              {t('primary.headline')}
            </h2>
            <p className="mb-8 text-secondary" style={{ fontSize: '17px', lineHeight: 1.55, maxWidth: '720px' }}>
              {t('primary.body')}
            </p>
            <Button href="/spoluprace" variant="primary" size="md" showArrow>
              {t('primary.cta')}
            </Button>
          </article>
        </div>
      </section>

      {/* Direct channels */}
      <section
        className="border-t border-border-soft px-6 py-16 md:px-12 md:py-24"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <h2
            className="mb-12 text-ink md:mb-16"
            style={{ fontSize: 'clamp(28px, 3.6vw, 45px)', lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 500 }}
          >
            {t('channels.heading')}
          </h2>
          <div
            className="grid grid-cols-1 overflow-hidden rounded-lg border-l border-t md:grid-cols-2"
            style={{ borderColor: 'var(--border)' }}
          >
            <Channel
              icon={<Mail size={18} aria-hidden />}
              label={t('channels.email.label')}
              value={t('channels.email.value')}
              note={t('channels.email.note')}
              href={`mailto:${t('channels.email.value')}`}
            />
            <Channel
              icon={<Phone size={18} aria-hidden />}
              label={t('channels.phone.label')}
              value={t('channels.phone.value')}
              note={t('channels.phone.note')}
              href="#"
            />
            <Channel
              icon={<MapPin size={18} aria-hidden />}
              label={t('channels.address.label')}
              value={t('channels.address.value')}
              note={t('channels.address.note')}
            />
            <Channel
              icon={<Globe size={18} aria-hidden />}
              label={t('channels.social.label')}
              value={t('channels.social.value')}
              note={t('channels.social.note')}
            />
          </div>
        </div>
      </section>

      {/* Privacy notice */}
      <section className="border-t border-border-soft px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto w-full max-w-[920px]">
          <div
            className="mb-4 font-mono text-xs uppercase text-tertiary"
            style={{ letterSpacing: '0.12em' }}
          >
            {t('privacy.label')}
          </div>
          <p className="text-secondary" style={{ fontSize: '15px', lineHeight: 1.6 }}>
            {t('privacy.body')}
            <Link
              href="/ochrana-soukromi"
              style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              {t('privacy.linkText')}
            </Link>
            {t('privacy.after')}
          </p>
        </div>
      </section>
    </>
  );
}

function Channel({
  icon,
  label,
  value,
  note,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  href?: string;
}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href && href !== '#' ? (
      <a
        href={href}
        className="block border-b border-r p-6 transition-colors duration-150 hover:bg-bg md:p-8"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
      >
        {children}
      </a>
    ) : (
      <div
        className="border-b border-r p-6 md:p-8"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
      >
        {children}
      </div>
    );

  return (
    <Wrapper>
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex size-9 items-center justify-center rounded-md"
          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {icon}
        </span>
        <span
          className="font-mono text-xs uppercase text-tertiary"
          style={{ letterSpacing: '0.12em' }}
        >
          {label}
        </span>
      </div>
      <div
        className="mb-2 text-ink"
        style={{ fontSize: '19px', lineHeight: 1.3, fontWeight: 500, letterSpacing: '-0.01em' }}
      >
        {value}
      </div>
      <p className="text-secondary" style={{ fontSize: '14px', lineHeight: 1.55 }}>
        {note}
      </p>
    </Wrapper>
  );
}
