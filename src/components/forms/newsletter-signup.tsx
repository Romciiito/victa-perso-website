'use client';

import { useCallback, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Sentry from '@sentry/nextjs';
import { newsletterSchema, type NewsletterValues, consentTextFor } from '@/lib/newsletter-schema';
import { TurnstileWidget } from './turnstile-widget';
import { trackEvent } from '@/lib/ga4';

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rate-limited';

interface Props {
  locale: 'cs' | 'en';
  formLocation: NewsletterValues['form_location'];
  variant?: 'default' | 'inline';
}

/**
 * Newsletter signup component (REQ-F-049..REQ-F-056). Reusable across homepage, blog,
 * footer, kontakt page. `variant="inline"` renders a horizontal email + button layout
 * for in-content placement; `variant="default"` is the stacked block.
 *
 * GDPR consent text is derived from `consentTextFor(locale)` and passed server-side
 * for proof-of-consent storage in `newsletter_subscribers.consent_text`.
 */
export function NewsletterSignup({ locale, formLocation, variant = 'default' }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [isPending, startTransition] = useTransition();
  const [responseMsg, setResponseMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
      locale,
      form_location: formLocation,
      gdpr_consent: false as unknown as true,
      honeypot: '',
      turnstile_token: '',
    },
  });

  // Token must live in RHF state — validation runs against RHF values before
  // the submit callback, so a useState-only token silently blocks every submit
  // (same P0 bug as the contact form).
  const handleTurnstileToken = useCallback(
    (token: string) => setValue('turnstile_token', token, { shouldValidate: true }),
    [setValue],
  );
  const handleTurnstileExpire = useCallback(
    () => setValue('turnstile_token', ''),
    [setValue],
  );

  const onSubmit = handleSubmit((values) => {
    setResponseMsg('');
    setStatus('submitting');
    startTransition(async () => {
      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, locale, form_location: formLocation }),
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
        if (res.status === 429) {
          setStatus('rate-limited');
          setResponseMsg(
            locale === 'cs'
              ? 'Příliš mnoho pokusů. Zkuste to prosím za hodinu.'
              : 'Too many attempts. Try again in an hour.',
          );
          return;
        }
        if (!res.ok || !json.ok) {
          setStatus('error');
          setResponseMsg(
            locale === 'cs'
              ? 'Přihlášení se nezdařilo. Zkuste to později nebo nám napište na hello@victaagency.com.'
              : 'Signup failed. Try later or write to hello@victaagency.com.',
          );
          return;
        }
        setStatus('success');
        setResponseMsg(json.message ?? '');
        trackEvent('newsletter_signup', { form_location: formLocation });
        reset();
      } catch (err) {
        // P2-04: never surface the raw `err.message` in the UI — see the
        // identical fix + rationale in contact-form.tsx.
        setStatus('error');
        setResponseMsg(
          locale === 'cs'
            ? 'Síťová chyba. Zkuste to znovu, nebo nám napište na hello@victaagency.com.'
            : 'Network error. Please try again, or write to us at hello@victaagency.com.',
        );
        console.error('[newsletter-signup] submit failed:', err);
        Sentry.captureException(err);
      }
    });
  });

  const labels =
    locale === 'cs'
      ? {
          heading: 'Newsletter',
          intro: 'Jednou za pár týdnů. Bez spamu, jen praktické postřehy.',
          email: 'Vaše e-mailová adresa',
          submit: 'Přihlásit se',
          submitting: 'Přihlašuji…',
          consentLink: 'Více v zásadách ochrany soukromí',
        }
      : {
          heading: 'Newsletter',
          intro: 'Once every few weeks. No spam, just practical insights.',
          email: 'Your email',
          submit: 'Subscribe',
          submitting: 'Subscribing…',
          consentLink: 'Read the privacy policy',
        };

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={variant === 'inline' ? 'rounded-md p-4' : 'rounded-lg p-6'}
        style={{
          backgroundColor: 'var(--accent-soft)',
          color: 'var(--ink)',
          border: '1px solid var(--accent)',
        }}
      >
        <p className="text-sm">{responseMsg}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isPending}
      className={variant === 'inline' ? 'space-y-3' : 'space-y-4'}
    >
      {variant === 'default' ? (
        <div>
          <h3
            className="mb-2 text-lg text-ink"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            {labels.heading}
          </h3>
          <p className="mb-4 text-sm leading-[1.55]" style={{ color: 'var(--secondary)' }}>
            {labels.intro}
          </p>
        </div>
      ) : null}

      {/* Honeypot */}
      <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Do not fill
          <input type="text" tabIndex={-1} autoComplete="off" {...register('honeypot')} />
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor={`nl-email-${formLocation}`}>
          {labels.email} <span aria-hidden style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <input
          id={`nl-email-${formLocation}`}
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `nl-email-${formLocation}-err` : undefined}
          {...register('email')}
          className="w-full rounded-md border px-3 py-2.5 text-base"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
        />
        {errors.email?.message ? (
          <p
            id={`nl-email-${formLocation}-err`}
            role="alert"
            className="mt-1.5 text-sm"
            style={{ color: 'var(--error)' }}
          >
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <label className="flex items-start gap-2 text-sm leading-[1.55]" htmlFor={`nl-gdpr-${formLocation}`}>
        <input
          id={`nl-gdpr-${formLocation}`}
          type="checkbox"
          required
          aria-invalid={!!errors.gdpr_consent}
          {...register('gdpr_consent')}
          className="mt-0.5"
        />
        <span style={{ color: 'var(--secondary)' }}>
          {consentTextFor(locale)}{' '}
          <a
            href={`/${locale}/ochrana-soukromi`}
            className="underline"
            style={{ color: 'var(--accent)' }}
          >
            {labels.consentLink}.
          </a>
        </span>
      </label>
      {errors.gdpr_consent?.message ? (
        <p role="alert" className="text-sm" style={{ color: 'var(--error)' }}>
          {errors.gdpr_consent.message}
        </p>
      ) : null}

      <TurnstileWidget
        onToken={handleTurnstileToken}
        onExpire={handleTurnstileExpire}
        action={`newsletter-${formLocation}`}
      />
      {errors.turnstile_token?.message ? (
        <p role="alert" className="text-sm" style={{ color: 'var(--error)' }}>
          {errors.turnstile_token.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || status === 'submitting'}
        className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-base font-medium disabled:opacity-60"
        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
      >
        {isPending || status === 'submitting' ? labels.submitting : labels.submit}
      </button>

      {status === 'error' || status === 'rate-limited' ? (
        <p role="alert" className="text-sm" style={{ color: 'var(--error)' }}>
          {responseMsg}
        </p>
      ) : null}
    </form>
  );
}
