import { z } from 'zod';

/**
 * Czech consent text shown next to the checkbox at signup. The exact text shipped at
 * confirmation time is persisted to `newsletter_subscribers.consent_text` for GDPR
 * proof-of-consent (REQ-F-055).
 *
 * RB-17 — CLOSED (2026-08-02, D-014): double opt-in is now implemented. The checkbox
 * here only expresses intent; `POST /api/newsletter` sends a signed confirmation link
 * (`src/lib/newsletter-confirm-token.ts`) and `GET /api/newsletter/confirm` is the only
 * place that writes this consent text + `consented_at` + `ip_hash` to Supabase — at the
 * moment the visitor clicks the link, which is what proves they control the inbox.
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
  // Must validate even when filled — the route silent-accepts bot fills
  // (same rationale as contact-schema.ts).
  honeypot: z.string().max(200).optional().or(z.literal('')),
  // .max(4096) — Vlna 7 code-review finding M2, same rationale as contact-schema.ts.
  turnstile_token: z.string().min(1, { message: 'Bot kontrola se nepodařila — zkuste znovu.' }).max(4096),
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
