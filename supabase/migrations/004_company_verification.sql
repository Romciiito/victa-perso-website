-- VICTA company verification columns
-- Migration: 004_company_verification
-- Created: 2026-08-13
-- Purpose: anti-fake-lead signal for the contact form's company field (Vlna 6).
--          The new `CompanyAutocomplete` component looks up what the visitor types
--          against ARES (CZ) and RPO (SK) — public company registries — and lets
--          them pick a verified match OR keep their free-typed text ("use without
--          verification", e.g. a foreign or newly-founded company that isn't in
--          either registry yet). `company_ico`/`company_country` are populated
--          ONLY on a verified pick, so Roman can filter "verified vs unverified"
--          leads in Supabase Studio as a quick signal against fake submissions —
--          this is a signal, not a hard gate: an unverified submission is still
--          accepted and stored (spec explicitly requires "volná volba").
-- Author: frontend-developer (Vlna 6)
--
-- Apply with: supabase db push (once Supabase is provisioned — see
-- docs/setup/vendor-setup-checklist.md; this project currently has no live
-- Supabase project, same pending-provisioning state as 002/003 —
-- see supabase/migrations/APPLY_ME_002_003.sql for the manual-apply fallback
-- via the Supabase SQL Editor once a project exists).
--
-- Safe to run more than once (IF NOT EXISTS).

BEGIN;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_ico TEXT,
  ADD COLUMN IF NOT EXISTS company_country TEXT; -- 'CZ' | 'SK'

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS company_ico TEXT,
  ADD COLUMN IF NOT EXISTS company_country TEXT; -- 'CZ' | 'SK'

COMMENT ON COLUMN leads.company_ico IS
  'IČO from an ARES (CZ) or RPO (SK) registry match the visitor selected in the contact form''s company autocomplete. NULL when they submitted an unverified/free-typed company name.';
COMMENT ON COLUMN leads.company_country IS
  'CZ | SK — which registry company_ico was matched against. NULL when unverified.';
COMMENT ON COLUMN contact_submissions.company_ico IS
  'IČO from an ARES (CZ) or RPO (SK) registry match at time of submission. NULL when the visitor submitted an unverified/free-typed company name.';
COMMENT ON COLUMN contact_submissions.company_country IS
  'CZ | SK — which registry company_ico was matched against at time of submission. NULL when unverified.';

COMMIT;

-- Verification query (run after apply — should return 4 rows):
-- SELECT table_name, column_name FROM information_schema.columns
-- WHERE table_name IN ('leads','contact_submissions') AND column_name IN ('company_ico','company_country')
-- ORDER BY table_name, column_name;
