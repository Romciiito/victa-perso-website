import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  EnvelopeSimple,
  Phone,
  MapPin,
  Globe,
} from '@phosphor-icons/react/dist/ssr';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/button';
import { Eyebrow } from '@/components/eyebrow';
import { EditorialSplit } from '@/components/editorial-split';
import { BentoShell, BentoCard } from '@/components/bento';
import { EnglishStub } from '@/components/en-stub';

type Props = { params: Promise<{ locale: string }> };

/* ============================================================
   /[locale]/kontakt — Contact page
   D-008: EditorialSplit hero + primary path card + 4 channel bentos
   ============================================================ */

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale === 'en') {
    return <EnglishStub title="Contact." pathLabel="/en/kontakt" />;
  }
  const t = await getTranslations('kontakt');

  return (
    <>
      {/* HERO */}
      <EditorialSplit
        padding="hero"
        left={
          <>
            <Eyebrow>{t('hero.status')}</Eyebrow>
            <h1
              className="text-ink"
              style={{
                fontSize: 'clamp(52px, 7vw, 96px)',
                lineHeight: 0.96,
                letterSpacing: '-0.045em',
                fontWeight: 600,
                maxWidth: '14ch',
              }}
            >
              {t('hero.headline')}
            </h1>
            <p
              style={{
                fontSize: '19px',
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                maxWidth: '52ch',
              }}
            >
              {t('hero.subhead')}
            </p>
            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              <Button href="/spoluprace" variant="primary" size="md">
                {t('primary.cta')}
              </Button>
              <Button
                href={`mailto:${t('channels.email.value')}`}
                variant="ghost"
                size="md"
                external
              >
                {t('channels.email.value')}
              </Button>
            </div>
          </>
        }
        right={
          <BentoShell>
            <BentoCard padding="loose">
              <div
                className="font-mono uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--accent)' }}
              >
                {t('primary.label')}
              </div>
              <h2
                style={{
                  fontSize: 'clamp(22px, 2.4vw, 28px)',
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  color: 'var(--ink)',
                }}
              >
                {t('primary.headline')}
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
                {t('primary.body')}
              </p>
            </BentoCard>
          </BentoShell>
        }
      />

      {/* CHANNELS */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <h2
            className="mb-12 md:mb-16"
            style={{
              fontSize: 'clamp(32px, 4vw, 56px)',
              lineHeight: 1.04,
              letterSpacing: '-0.045em',
              fontWeight: 600,
              color: 'var(--ink)',
              maxWidth: '24ch',
            }}
          >
            {t('channels.heading')}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChannelCard
              icon={<EnvelopeSimple size={20} weight="light" aria-hidden />}
              label={t('channels.email.label')}
              value={t('channels.email.value')}
              note={t('channels.email.note')}
              href={`mailto:${t('channels.email.value')}`}
              external
            />
            <ChannelCard
              icon={<Phone size={20} weight="light" aria-hidden />}
              label={t('channels.phone.label')}
              value={t('channels.phone.value')}
              note={t('channels.phone.note')}
            />
            <ChannelCard
              icon={<MapPin size={20} weight="light" aria-hidden />}
              label={t('channels.address.label')}
              value={t('channels.address.value')}
              note={t('channels.address.note')}
            />
            <ChannelCard
              icon={<Globe size={20} weight="light" aria-hidden />}
              label={t('channels.social.label')}
              value={t('channels.social.value')}
              note={t('channels.social.note')}
            />
          </div>
        </div>
      </section>

      {/* PRIVACY NOTICE */}
      <section
        className="relative px-6 py-20 md:px-8 md:py-24"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[920px]">
          <div
            className="mb-4 font-mono uppercase"
            style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--ink-soft)' }}
          >
            {t('privacy.label')}
          </div>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
            {t('privacy.body')}
            <Link
              href="/ochrana-soukromi"
              style={{
                color: 'var(--ink)',
                borderBottom: '1px solid var(--ink)',
                paddingBottom: '1px',
              }}
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

function ChannelCard({
  icon,
  label,
  value,
  note,
  href,
  external = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <BentoCard padding="loose">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {icon}
        </span>
        <span
          className="font-mono uppercase"
          style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          marginTop: '4px',
        }}
      >
        {value}
      </div>
      <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink-muted)' }}>
        {note}
      </p>
    </BentoCard>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block"
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer noopener' : undefined}
      >
        <BentoShell>{content}</BentoShell>
      </a>
    );
  }
  return <BentoShell>{content}</BentoShell>;
}
