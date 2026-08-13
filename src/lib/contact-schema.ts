import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js/min';

/**
 * Shared Zod schema for the contact form (REQ-F-041..REQ-F-048, security-model.md §4.3).
 * Used by both the React Hook Form client validator and the `/api/contact` server route
 * — same schema means same rules on both sides (REQ-F-046).
 */

const PHONE_ERROR = {
  cs: 'Zadejte platné telefonní číslo s předvolbou.',
  en: 'Enter a valid phone number with a country code.',
} as const;

export const contactSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'Zadejte prosím své jméno.' })
      .max(100),
    email: z
      .string()
      .trim()
      .email({ message: 'Zadejte platný e-mail.' })
      .max(254),
    company: z.string().trim().max(120).optional().or(z.literal('')),
    // Vlna 6: phone is now REQUIRED (spec change — was optional). The field
    // itself stays a loose string here (`PhoneInput` always emits E.164 or
    // '' — see `src/components/forms/phone-input.tsx`); "required" AND
    // "must be a valid E.164 number" are both enforced together in the
    // `superRefine` below so a single localized (CS/EN) message can be
    // produced instead of Zod's two separate default English messages for
    // `.min()`/a custom phone validator stacked on the field itself.
    phone: z.string().trim().max(40),
    // ARES (CZ) / RPO (SK) registry match, populated ONLY when the visitor
    // picked a verified result from `CompanyAutocomplete` — anti-fake-lead
    // signal (Vlna 6). A free-typed, unverified company name leaves both
    // undefined. `.or(z.literal(''))` — same "untouched control submits ''"
    // pattern as budget_tier/service_interest below (the field is driven via
    // `setValue`, defaulting to '').
    company_ico: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),
    company_country: z
      .enum(['CZ', 'SK'])
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),
    message: z
      .string()
      .trim()
      .min(20, { message: 'Zpráva musí mít alespoň 20 znaků.' })
      .max(2000),
    // `.or(z.literal(''))` — an untouched <select> submits its `<option value="">`
    // placeholder; without this branch Zod rejects the form's own default value
    // (same pattern as company/phone above). The transform folds '' back to
    // undefined so the server/DB layer only ever sees a real enum or null.
    budget_tier: z
      .enum(['under_5k', '5k-25k', '25k-100k', '100k+'])
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),
    service_interest: z
      .enum(['comprehensive', 'web', 'marketing', 'ai', 'other'])
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? undefined : v)),
    gdpr_consent: z.literal(true, {
      message: 'Pro odeslání souhlasíte se zpracováním osobních údajů.',
    }),
    // Honeypot must VALIDATE even when filled — the route silently accepts
    // non-empty honeypots (bot thinks it succeeded). `.max(0)` here used to
    // reject at the Zod layer with a field error naming the honeypot, which
    // both leaked the detection to bots and made the silent-200 branch
    // unreachable.
    honeypot: z.string().max(200).optional().or(z.literal('')),
    turnstile_token: z.string().min(1, { message: 'Bot kontrola se nepodařila — zkuste znovu.' }),
    locale: z.enum(['cs', 'en']).default('cs'),
  })
  .superRefine((data, ctx) => {
    // Cross-field because the error message language depends on `locale`
    // (task requirement: "Chybové hlášky v CS i EN"). `isValidPhoneNumber`
    // requires a full E.164 string (leading `+`) to resolve a country's
    // numbering plan — exactly what `PhoneInput` always emits.
    if (!data.phone || !isValidPhoneNumber(data.phone)) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: data.locale === 'en' ? PHONE_ERROR.en : PHONE_ERROR.cs,
      });
    }
  });

/**
 * `z.input<>` is the *input* shape — what the form sends to the resolver,
 * where fields with `.default(...)` are still optional. We use this for
 * useForm so react-hook-form's `Resolver<T>` type matches what zodResolver
 * expects (Next 16 + newer @hookform/resolvers tighten this check and
 * reject the previous `z.infer<>` which is the output shape).
 *
 * `z.output<>` is the *validated* shape — defaults filled in, optionals
 * resolved. Use this on the server side after `safeParse`.
 */
export type ContactFormValues = z.input<typeof contactSchema>;
export type ContactFormData = z.output<typeof contactSchema>;
