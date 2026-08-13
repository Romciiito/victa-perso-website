import { z } from 'zod';

/**
 * Query-param schema for `GET /api/company-lookup` (Vlna 6, anti-fake-lead
 * company verification against ARES/RPO). `q` mirrors the contact form's
 * `company` field length ceiling isn't relevant here — this is a search
 * term, not the stored value — so it gets its own generous-but-bounded max.
 */
export const companyLookupQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, { message: 'Zadejte alespoň 2 znaky.' })
    .max(100),
  country: z.enum(['cz', 'sk', 'all']).default('all'),
});

export type CompanyLookupQuery = z.output<typeof companyLookupQuerySchema>;
