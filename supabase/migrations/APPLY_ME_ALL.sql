-- ============================================================================
-- Migrace 002 + 003 + 004 ke spuštění v Supabase SQL Editoru
-- (dashboard → SQL Editor → New query → vložit celý tento soubor → Run)
--
-- Proč ručně: Supabase SQL editor (Monaco) nepřijímá vstup přes automatizaci,
-- a Supabase CLI/Management API zde není přihlášené. Obsah je 1:1 z
-- 002_leads_email_unique.sql a 003_booking_events_unique.sql.
--
-- Bezpečné spustit opakovaně (IF NOT EXISTS / IF EXISTS).
--
-- Naléhavost jednotlivých částí:
--   002 + 003 — NEBLOKUJÍCÍ: kód má fallback (upsertLead chytá 42P10, webhook
--               23505). Bez nich jen chybí DB-level pojistka proti duplicitám
--               (a tím proti dvojí fakturaci zrušeného auditu).
--   004       — DŮLEŽITÉ: bez něj se OVĚŘENÁ firemní data (IČO ze zápisu
--               v ARES/RPO) neuloží — insert s těmito sloupci selže na
--               PGRST204. Neověřená odeslání projdou i bez migrace (route
--               prázdné klíče vynechává), takže formulář jako celek funguje,
--               ale anti-fake-lead signál se ztrácí. Aplikovat před tím, než
--               začnete leady z formuláře reálně vyhodnocovat.
-- ============================================================================

-- 002: leads.email UNIQUE — atomický upsert (ON CONFLICT email) potřebuje
-- odpovídající unique constraint; bez něj běží pomalejší legacy cesta.
BEGIN;
DROP INDEX IF EXISTS idx_leads_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique ON leads (email);
COMMIT;

-- 003: booking_events (cal_booking_id, event_type) UNIQUE — pojistka proti
-- duplicitní pending_invoice faktuře, když Redis idempotence fail-open pustí
-- zpracování dvakrát. Guard nejdřív ověří, že tabulka neobsahuje duplicity.
DO $$
DECLARE dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT cal_booking_id, event_type
    FROM booking_events
    GROUP BY cal_booking_id, event_type
    HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'booking_events obsahuje % duplicitnich (cal_booking_id, event_type) dvojic - deduplikujte pred aplikaci (ponechte radek s nejstarsim created_at).',
      dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS booking_events_cal_id_event_type_key
  ON booking_events (cal_booking_id, event_type);

-- ============================================================================
-- 004: sloupce pro ověření firmy proti rejstříkům (Vlna 6 — anti-fake-lead)
-- MUSÍ být aplikováno PŘED nasazením Vlny 6, jinak insert kontaktního
-- formuláře selže na neznámý sloupec.
-- ============================================================================
BEGIN;
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_ico TEXT,
  ADD COLUMN IF NOT EXISTS company_country TEXT;
ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS company_ico TEXT,
  ADD COLUMN IF NOT EXISTS company_country TEXT;
COMMIT;

-- Finální kontrola (mají se vypsat 2 indexy + 4 sloupce):
SELECT 'index' AS typ, indexname AS nazev FROM pg_indexes
WHERE indexname IN ('idx_leads_email_unique', 'booking_events_cal_id_event_type_key')
UNION ALL
SELECT 'sloupec', table_name || '.' || column_name FROM information_schema.columns
WHERE table_schema = 'public' AND column_name IN ('company_ico', 'company_country')
ORDER BY 1, 2;
