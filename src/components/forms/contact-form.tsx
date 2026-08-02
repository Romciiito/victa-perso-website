'use client';

import { useCallback, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Sentry from '@sentry/nextjs';
import { contactSchema, type ContactFormValues } from '@/lib/contact-schema';
import { TurnstileWidget } from './turnstile-widget';
import { trackEvent } from '@/lib/ga4';

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rate-limited';

interface Props {
  locale: 'cs' | 'en';
}

/**
 * Contact form (REQ-F-041..REQ-F-048, spec.md §4.4).
 *
 * - React Hook Form + Zod (same schema as `/api/contact` server route).
 * - Cloudflare Turnstile invisible challenge.
 * - Honeypot (hidden field; bots fill it, humans don't).
 * - GDPR consent checkbox required.
 * - Inline success/error message — no page reload (REQ-F-042 + REQ-F-043).
 * - Fires GA4 event `contact_form_submit` on success (only after consent).
 */
export function ContactForm({ locale }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
      message: '',
      gdpr_consent: false as unknown as true, // RHF default; Zod enforces literal(true)
      honeypot: '',
      turnstile_token: '',
      locale,
    },
  });

  // The Turnstile token must live inside react-hook-form state — handleSubmit
  // runs the Zod resolver against RHF's own values BEFORE the callback body,
  // so a token held only in useState never reaches validation and every submit
  // fails silently (the original P0 bug on this form).
  const handleTurnstileToken = useCallback(
    (token: string) => setValue('turnstile_token', token, { shouldValidate: true }),
    [setValue],
  );
  const handleTurnstileExpire = useCallback(
    () => setValue('turnstile_token', ''),
    [setValue],
  );

  const onSubmit = handleSubmit((values) => {
    setSubmitError('');
    setStatus('submitting');
    startTransition(async () => {
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, locale }),
        });
        if (res.status === 429) {
          setStatus('rate-limited');
          setSubmitError(
            locale === 'cs'
              ? 'Příliš mnoho pokusů. Zkuste to znovu za chvíli.'
              : 'Too many attempts. Try again shortly.',
          );
          return;
        }
        if (!res.ok) {
          setStatus('error');
          setSubmitError(
            locale === 'cs'
              ? 'Odeslání selhalo. Zkuste to znovu nebo nám napište přímo na hello@victaagency.com.'
              : 'Submission failed. Try again or write directly to hello@victaagency.com.',
          );
          return;
        }
        setStatus('success');
        trackEvent('contact_form_submit', { form_location: 'contact_page' });
        reset();
      } catch (err) {
        // P2-04: never surface the raw `err.message` in the UI — it's an
        // English/technical browser fetch error (e.g. "Failed to fetch"),
        // not something a Czech visitor should see. The technical detail
        // still goes to Sentry/console for debugging.
        setStatus('error');
        setSubmitError(
          locale === 'cs'
            ? 'Síťová chyba. Zkuste to znovu, nebo nám napište na hello@victaagency.com.'
            : 'Network error. Please try again, or write to us at hello@victaagency.com.',
        );
        console.error('[contact-form] submit failed:', err);
        Sentry.captureException(err);
      }
    });
  });

  const labels =
    locale === 'cs'
      ? {
          name: 'Jméno',
          email: 'E-mail',
          company: 'Společnost',
          phone: 'Telefon',
          message: 'Vaše zpráva',
          budget: 'Rozpočet (volitelné)',
          service: 'Která oblast vás zajímá?',
          consent:
            'Souhlasím se zpracováním osobních údajů v souladu se Zásadami ochrany soukromí.',
          submit: 'Odeslat zprávu',
          submitting: 'Odesílám…',
          success: 'Zpráva odeslána. Ozveme se do 1 pracovního dne.',
          required: 'Povinné pole',
          budgetOptions: {
            none: '— vyberte —',
            under_5k: 'do 5 000 €',
            '5k-25k': '5 000 – 25 000 €',
            '25k-100k': '25 000 – 100 000 €',
            '100k+': 'nad 100 000 €',
          },
          serviceOptions: {
            none: '— vyberte —',
            comprehensive: 'Komplexní transformace',
            web: 'Web / E-shop',
            marketing: 'Marketing / SEO / PPC',
            ai: 'AI a automatizace',
            other: 'Něco jiného',
          },
        }
      : {
          name: 'Name',
          email: 'Email',
          company: 'Company',
          phone: 'Phone',
          message: 'Your message',
          budget: 'Budget (optional)',
          service: 'Which area interests you?',
          consent:
            'I consent to processing my personal data per the Privacy Policy.',
          submit: 'Send message',
          submitting: 'Sending…',
          success: 'Message sent. We respond within 24 business hours.',
          required: 'Required',
          budgetOptions: {
            none: '— select —',
            under_5k: 'under €5,000',
            '5k-25k': '€5,000 – €25,000',
            '25k-100k': '€25,000 – €100,000',
            '100k+': 'over €100,000',
          },
          serviceOptions: {
            none: '— select —',
            comprehensive: 'Comprehensive transformation',
            web: 'Web / E-commerce',
            marketing: 'Marketing / SEO / PPC',
            ai: 'AI & automation',
            other: 'Something else',
          },
        };

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border p-8"
        style={{
          borderColor: 'var(--accent)',
          backgroundColor: 'var(--accent-soft)',
          color: 'var(--ink)',
        }}
      >
        <p className="text-base">{labels.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-busy={isPending}>
      {/* Honeypot — visually hidden, autocomplete off, real users skip via Tab order */}
      <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Do not fill this field
          <input type="text" tabIndex={-1} autoComplete="off" {...register('honeypot')} />
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="name">
          {labels.name} <span aria-hidden style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
          className="w-full rounded-md border px-3 py-2.5 text-base"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
        />
        {errors.name?.message ? (
          <p id="name-error" role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="email">
            {labels.email} <span aria-hidden style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
            className="w-full rounded-md border px-3 py-2.5 text-base"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
          />
          {errors.email?.message ? (
            <p id="email-error" role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="company">
            {labels.company}
          </label>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            {...register('company')}
            className="w-full rounded-md border px-3 py-2.5 text-base"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="phone">
            {labels.phone}
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            {...register('phone')}
            className="w-full rounded-md border px-3 py-2.5 text-base"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="budget_tier">
            {labels.budget}
          </label>
          <select
            id="budget_tier"
            aria-invalid={!!errors.budget_tier}
            aria-describedby={errors.budget_tier ? 'budget_tier-error' : undefined}
            {...register('budget_tier')}
            className="w-full rounded-md border px-3 py-2.5 text-base"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
          >
            <option value="">{labels.budgetOptions.none}</option>
            <option value="under_5k">{labels.budgetOptions.under_5k}</option>
            <option value="5k-25k">{labels.budgetOptions['5k-25k']}</option>
            <option value="25k-100k">{labels.budgetOptions['25k-100k']}</option>
            <option value="100k+">{labels.budgetOptions['100k+']}</option>
          </select>
          {errors.budget_tier?.message ? (
            <p id="budget_tier-error" role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
              {errors.budget_tier.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="service_interest">
          {labels.service}
        </label>
        <select
          id="service_interest"
          aria-invalid={!!errors.service_interest}
          aria-describedby={errors.service_interest ? 'service_interest-error' : undefined}
          {...register('service_interest')}
          className="w-full rounded-md border px-3 py-2.5 text-base"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
        >
          <option value="">{labels.serviceOptions.none}</option>
          <option value="comprehensive">{labels.serviceOptions.comprehensive}</option>
          <option value="web">{labels.serviceOptions.web}</option>
          <option value="marketing">{labels.serviceOptions.marketing}</option>
          <option value="ai">{labels.serviceOptions.ai}</option>
          <option value="other">{labels.serviceOptions.other}</option>
        </select>
        {errors.service_interest?.message ? (
          <p id="service_interest-error" role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
            {errors.service_interest.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="message">
          {labels.message} <span aria-hidden style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          {...register('message')}
          className="w-full rounded-md border px-3 py-2.5 text-base"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
        />
        {errors.message?.message ? (
          <p id="message-error" role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-[1.55]" htmlFor="gdpr">
          <input
            id="gdpr"
            type="checkbox"
            required
            aria-invalid={!!errors.gdpr_consent}
            {...register('gdpr_consent')}
            className="mt-1"
          />
          <span style={{ color: 'var(--secondary)' }}>
            {labels.consent}{' '}
            <a
              href={`/${locale}/ochrana-soukromi`}
              className="underline"
              style={{ color: 'var(--accent)' }}
            >
              {locale === 'cs' ? 'Více v zásadách ochrany soukromí.' : 'Read the privacy policy.'}
            </a>
          </span>
        </label>
        {errors.gdpr_consent?.message ? (
          <p role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
            {errors.gdpr_consent.message}
          </p>
        ) : null}
      </div>

      <TurnstileWidget
        onToken={handleTurnstileToken}
        onExpire={handleTurnstileExpire}
        action="contact"
      />
      {errors.turnstile_token?.message ? (
        <p role="alert" className="text-sm" style={{ color: 'var(--error)' }}>
          {errors.turnstile_token.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || status === 'submitting'}
        className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium transition-colors disabled:opacity-60"
        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
      >
        {isPending || status === 'submitting' ? labels.submitting : labels.submit}
      </button>

      {submitError ? (
        <p role="alert" className="text-sm" style={{ color: 'var(--error)' }}>
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
