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
 * Postgres error code for "there is no unique or exclusion constraint matching
 * the ON CONFLICT specification" — thrown by `.upsert(..., {onConflict:'email'})`
 * below when migration 002 (supabase/migrations/002_leads_email_unique.sql)
 * hasn't been applied yet. Caught to fall back to the pre-fix read-then-insert
 * path so this function keeps working against an unmigrated database (P2-02).
 */
const POSTGRES_NO_MATCHING_UNIQUE_CONSTRAINT = '42P10';

/**
 * Upsert a lead by email (case-insensitive). Returns the row's id whether it was
 * newly inserted or already existed. Used by all four submission paths (contact,
 * newsletter, booking, chatbot) so the cross-source CRM view (architecture.md
 * §5.4 §5.1) shows one row per person.
 *
 * Atomic upsert (P2-02, supersedes the old read-then-insert pattern): two
 * concurrent submissions from the same email (e.g. a double-click, or the
 * booking webhook's Redis-outage fail-open path in rate-limit.ts reprocessing
 * the same event) used to be able to both pass the "does this email exist?"
 * read before either insert landed, creating two `leads` rows for one person —
 * exactly what "one row per person" is supposed to prevent. `.upsert(...,
 * {onConflict:'email'})` makes Postgres itself the single point of truth via
 * `INSERT ... ON CONFLICT (email) DO UPDATE`, which is race-free.
 *
 * Requires `supabase/migrations/002_leads_email_unique.sql` (a UNIQUE index on
 * `leads(email)`) to be applied — see that file for why it's a plain UNIQUE
 * index rather than the `WHERE email IS NOT NULL` PARTIAL index the audit
 * finding originally suggested (PostgREST's upsert `on_conflict` parameter
 * can't target a partial index, so a partial index would make this upsert
 * fail 100% of the time, migrated or not — a plain UNIQUE index has the
 * identical practical effect here since Postgres never treats two NULLs as
 * conflicting). Until that migration runs, Postgres has no matching
 * constraint for the ON CONFLICT target and returns 42P10, caught below to
 * fall back to the original select-then-insert behavior — so this function
 * works correctly both before and after the migration is applied.
 *
 * Behavior note: unlike the old code (which left an existing lead's columns
 * untouched on repeat contact), the atomic upsert path refreshes columns the
 * caller actually PROVIDED — freshest contact info wins. Null/undefined keys
 * are dropped from the payload BEFORE the upsert, so PostgREST's generated
 * `ON CONFLICT … DO UPDATE` only touches supplied columns. Without this
 * filter, a newsletter confirm (which sends no name/phone/budget_tier) would
 * NULL-out fields a previous contact-form submission filled in — including
 * `budget_tier`, the field the primary KPI depends on (gate finding, Vlna 3A).
 */
export async function upsertLead(input: UpsertLeadInput): Promise<{ id: string } | null> {
  const email = input.email.toLowerCase();
  // Typovaný literál první (kontrola názvů polí), filtr až nad ním — cast na
  // konci jen zužuje, neobchází type-check (gate výhrada 2, Vlna 3A).
  const full: LeadInsert = {
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
  const insert = Object.fromEntries(
    Object.entries(full).filter(([, v]) => v != null),
  ) as LeadInsert;

  const { data, error } = await supabaseAdmin
    .from('leads')
    .upsert(insert, { onConflict: 'email' })
    .select('id')
    .single();

  if (!error) return data;

  if (error.code === POSTGRES_NO_MATCHING_UNIQUE_CONSTRAINT) {
    return upsertLeadLegacy(email, insert);
  }

  console.error('[leads] upsert error:', error.message);
  return null;
}

/**
 * Pre-P2-02 read-then-insert fallback — kept ONLY so `upsertLead` keeps
 * working on a database that hasn't run migration 002 yet (Supabase is not
 * currently provisioned at all; see docs/setup/vendor-setup-checklist.md).
 * Once 002 is confirmed applied everywhere, this fallback (and the 42P10
 * branch above that calls it) can be deleted.
 */
async function upsertLeadLegacy(email: string, insert: LeadInsert): Promise<{ id: string } | null> {
  const { data: existing, error: selectErr } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selectErr) {
    console.error('[leads] select error (pre-migration fallback):', selectErr.message);
    return null;
  }
  if (existing) return existing;

  const { data, error: insertErr } = await supabaseAdmin
    .from('leads')
    .insert(insert)
    .select('id')
    .single();
  if (insertErr) {
    console.error('[leads] insert error (pre-migration fallback):', insertErr.message);
    return null;
  }
  return data;
}
