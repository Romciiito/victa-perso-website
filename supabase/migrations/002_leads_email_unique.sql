-- VICTA schema migration
-- Migration: 002_leads_email_unique
-- Created: 2026-08-02
-- Purpose: fix P2-02 (upsertLead race condition) — src/lib/leads.ts used to
--   read-then-insert, which lets two concurrent submissions from the same
--   email (a double-click, a form retry, or the booking webhook's Redis-
--   outage fail-open path in src/lib/rate-limit.ts reprocessing the same
--   Cal.com event) both pass the "does this row exist?" check before either
--   insert lands, creating two `leads` rows for one person — the exact thing
--   "one row per person" (architecture.md §5.4 §5.1) is supposed to prevent.
-- Author: backend-developer (audit Vlna 3A)
--
-- Apply with: supabase db push  (after Roman provisions the project — see
-- docs/setup/vendor-setup-checklist.md §8; Supabase is not provisioned yet)
--
-- Notes:
--   - `src/lib/leads.ts`'s `upsertLead()` now calls
--     `.upsert(row, { onConflict: 'email' })`, which PostgREST translates to
--     `INSERT ... ON CONFLICT (email) DO UPDATE ...`. That requires a real
--     unique index/constraint on exactly `(email)` to use as the conflict
--     target — this migration adds it.
--   - DEVIATION from the audit finding's literal wording ("UNIQUE partial
--     index ... WHERE email IS NOT NULL"): this creates a plain (non-partial)
--     UNIQUE index instead. Reason: PostgreSQL requires an `ON CONFLICT`
--     clause's conflict target to restate a partial index's WHERE predicate
--     verbatim for the index to be a valid inference target, and PostgREST's
--     `on_conflict` query parameter (what `.upsert()`'s `onConflict` option
--     sends) only accepts a column list — it cannot express a predicate. A
--     partial index here would make `.upsert(..., {onConflict:'email'})` fail
--     with 42P10 permanently (not just pre-migration), defeating the whole
--     point of this migration. A PLAIN UNIQUE index achieves the identical
--     practical effect for this table anyway: PostgreSQL's UNIQUE constraint
--     semantics already treat every NULL as distinct from every other NULL
--     (SQL standard behavior — see the "Unique Constraints" section of the
--     Postgres docs), so `email IS NULL` rows (anonymous chatbot leads) can
--     still repeat freely; only non-null emails are constrained to be unique.
--     That is exactly the partial index's intended behavior, reached a
--     different way.
--   - Replaces the non-unique `idx_leads_email` from 001_initial_schema.sql
--     (same column, now enforcing uniqueness instead of only accelerating
--     lookups — no need for both).
--   - `src/lib/leads.ts` handles running against a database WITHOUT this
--     migration applied: Postgres returns error code 42P10 ("no unique or
--     exclusion constraint matching the ON CONFLICT specification") for the
--     `.upsert()` call, which is caught and falls back to the pre-fix
--     select-then-insert path — so deploying the code ahead of this
--     migration does not break anything, it just doesn't get the race-safety
--     fix until the migration runs.

BEGIN;

DROP INDEX IF EXISTS idx_leads_email;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique
  ON leads (email);

COMMIT;
