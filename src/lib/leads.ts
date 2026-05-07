import 'server-only';
import { supabaseAdmin } from './supabase';
import type { Database } from './supabase-types';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export interface UpsertLeadInput {
  email: string;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  source: LeadInsert['source'];
  source_url?: string | null;
  locale: 'cs' | 'en';
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
  };
  budget_tier?: string | null;
  notes?: string | null;
}

/**
 * Upsert a lead by email (case-insensitive). Returns existing row if email matches,
 * else inserts a new row. Used by all four submission paths (contact, newsletter, booking,
 * chatbot) so cross-source CRM view (architecture.md §5.4 §5.1) shows one row per person.
 *
 * NOTE: This is read-then-insert, not a single `INSERT ... ON CONFLICT`. The `leads` table
 * does not have a UNIQUE on `email` (it's nullable for anonymous chatbot users, and we may
 * want multiple rows per email if someone re-engages from a different campaign). For launch,
 * the read-then-insert pattern is sufficient — race-condition risk is acceptable given low
 * concurrent traffic.
 */
export async function upsertLead(input: UpsertLeadInput): Promise<{ id: string } | null> {
  const email = input.email.toLowerCase();
  const { data: existing, error: selectErr } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selectErr) {
    // eslint-disable-next-line no-console
    console.error('[leads] select error:', selectErr.message);
    return null;
  }
  if (existing) return existing;

  const insert: LeadInsert = {
    email,
    name: input.name ?? null,
    company: input.company ?? null,
    phone: input.phone ?? null,
    source: input.source,
    source_url: input.source_url ?? null,
    utm_source: input.utm?.source ?? null,
    utm_medium: input.utm?.medium ?? null,
    utm_campaign: input.utm?.campaign ?? null,
    utm_content: input.utm?.content ?? null,
    utm_term: input.utm?.term ?? null,
    locale: input.locale,
    budget_tier: input.budget_tier ?? null,
    notes: input.notes ?? null,
  };
  const { data, error: insertErr } = await supabaseAdmin
    .from('leads')
    .insert(insert)
    .select('id')
    .single();
  if (insertErr) {
    // eslint-disable-next-line no-console
    console.error('[leads] insert error:', insertErr.message);
    return null;
  }
  return data;
}
