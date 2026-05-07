import { z } from 'zod';

/**
 * Shared Zod schema for the contact form (REQ-F-041..REQ-F-048, security-model.md §4.3).
 * Used by both the React Hook Form client validator and the `/api/contact` server route
 * — same schema means same rules on both sides (REQ-F-046).
 */

export const contactSchema = z.object({
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
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(20, { message: 'Zpráva musí mít alespoň 20 znaků.' })
    .max(2000),
  budget_tier: z.enum(['under_5k', '5k-25k', '25k-100k', '100k+']).optional(),
  service_interest: z.enum(['comprehensive', 'web', 'marketing', 'ai', 'other']).optional(),
  gdpr_consent: z.literal(true, {
    errorMap: () => ({
      message: 'Pro odeslání souhlasíte se zpracováním osobních údajů.',
    }),
  }),
  honeypot: z.string().max(0).optional().or(z.literal('')),
  turnstile_token: z.string().min(1, { message: 'Bot kontrola se nepodařila — zkuste znovu.' }),
  locale: z.enum(['cs', 'en']).default('cs'),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
