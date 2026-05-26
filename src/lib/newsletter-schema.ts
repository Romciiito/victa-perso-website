import { z } from 'zod';

/**
 * Czech consent text shown next to the checkbox at signup. The exact text shipped at submit
 * is persisted to `newsletter_subscribers.consent_text` for GDPR proof-of-consent (REQ-F-055).
 *
 * NOTE (RB-17): Czech advokát review pending whether single opt-in with this consent record
 * is sufficient for CZ/SK marketing law (zákon č. 480/2004 Sb. + GDPR). If double opt-in is
 * required, add `confirmation_token` + `confirmed_at` columns via migration 002 + a confirm
 * route. Code is structured so the upgrade is contained.
 */
export const NEWSLETTER_CONSENT_TEXT_CS =
  'Souhlasím se zpracováním e-mailové adresy pro odběr newsletteru VICTA. Souhlas mohu kdykoli odvolat.';
export const NEWSLETTER_CONSENT_TEXT_EN =
  'I consent to processing my email for the VICTA newsletter. I can withdraw consent at any time.';

export const newsletterSchema = z.object({
  email: z.string().trim().email({ message: 'Zadejte platný e-mail.' }).max(254),
  locale: z.enum(['cs', 'en']).default('cs'),
  form_location: z
    .enum(['homepage', 'blog', 'footer', 'kontakt', 'spoluprace', 'other'])
    .default('other'),
  gdpr_consent: z.literal(true, {
    message: 'Pro přihlášení k newsletteru je nutný souhlas se zpracováním.',
  }),
  honeypot: z.string().max(0).optional().or(z.literal('')),
  turnstile_token: z.string().min(1, { message: 'Bot kontrola se nepodařila — zkuste znovu.' }),
  utm_source: z.string().max(80).optional(),
  utm_medium: z.string().max(80).optional(),
  utm_campaign: z.string().max(80).optional(),
});

/**
 * `z.input<>` is the form-input shape — `.default(...)` fields stay
 * optional, which is what react-hook-form's `Resolver<T>` expects.
 * `z.output<>` is the validated server-side shape.
 */
export type NewsletterValues = z.input<typeof newsletterSchema>;
export type NewsletterData = z.output<typeof newsletterSchema>;

export function consentTextFor(locale: 'cs' | 'en'): string {
  return locale === 'cs' ? NEWSLETTER_CONSENT_TEXT_CS : NEWSLETTER_CONSENT_TEXT_EN;
}
