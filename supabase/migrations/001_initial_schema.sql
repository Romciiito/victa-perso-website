-- VICTA initial schema migration
-- Migration: 001_initial_schema
-- Created: 2026-05-07
-- Purpose: Create all 8 operational tables for VICTA marketing site (per architecture.md §5.4)
-- Author: devops-engineer (Phase 0, Wave 1, Track D)
--
-- Apply with: supabase db push  (after Roman provisions project + sets SUPABASE_DB_URL env var)
--
-- Notes:
--   - Tables 'chatbot_sessions' + 'chatbot_messages' exist but are unused at launch
--     per D-002 (chatbot deferred to post-launch). They are migrated now to avoid
--     a separate migration when chatbot reactivates.
--   - RLS enabled on all tables with default-deny (no anon policies).
--     Public clients must NOT have direct DB access (AR-21).
--   - Region: Frankfurt eu-central-1 (data residency parity with Vercel fra1, AR-22).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. leads — single source of truth (poor-man's CRM)
--    All other tables with a lead_id FK use ON DELETE SET NULL so that
--    a GDPR deletion request anonymises downstream records rather than
--    cascading-deleting business data.
-- ---------------------------------------------------------------------------

CREATE TABLE leads (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT,                                            -- nullable for anonymous chatbot users
  name          TEXT,
  company       TEXT,
  phone         TEXT,
  source        TEXT         NOT NULL,                           -- contact_form | newsletter | booking | chatbot | cold_ad | referral
  source_url    TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  utm_term      TEXT,
  locale        TEXT,                                            -- cs | en
  budget_tier   TEXT,                                            -- under_5k | 5k-25k | 25k-100k | 100k+
  notes         TEXT,
  status        TEXT         NOT NULL DEFAULT 'new',             -- new | contacted | qualified | audit_booked | won | lost | spam
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_email          ON leads(email)                     WHERE email IS NOT NULL;
CREATE INDEX idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX idx_leads_source         ON leads(source);

-- ---------------------------------------------------------------------------
-- 2. contact_submissions — inbound contact form records
-- ---------------------------------------------------------------------------

CREATE TABLE contact_submissions (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 UUID         REFERENCES leads(id) ON DELETE SET NULL,
  email                   TEXT         NOT NULL,
  name                    TEXT,
  company                 TEXT,
  phone                   TEXT,
  service_interest        TEXT,                                  -- comprehensive | web | marketing | ai | other
  budget_tier             TEXT,
  message                 TEXT         NOT NULL,
  locale                  TEXT         NOT NULL DEFAULT 'cs',
  ip_hash                 TEXT,                                  -- SHA-256 of IP+salt for spam dedup
  user_agent              TEXT,
  honeypot_passed         BOOLEAN      NOT NULL DEFAULT TRUE,
  resend_email_id         TEXT,                                  -- email confirmation tracking
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_lead_created ON contact_submissions(lead_id, created_at DESC);
CREATE INDEX idx_contact_ip_hash      ON contact_submissions(ip_hash, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. chatbot_sessions — conversation session metadata
--    NOTE: Table created at launch but unused per D-002 (chatbot deferred).
--    Included here to avoid a separate migration at Phase 3 reactivation.
-- ---------------------------------------------------------------------------

CREATE TABLE chatbot_sessions (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              UUID         REFERENCES leads(id) ON DELETE SET NULL,
  session_id           TEXT         UNIQUE NOT NULL,             -- client-side UUID
  ip_hash              TEXT,
  user_agent           TEXT,
  locale               TEXT,
  source_url           TEXT,                                     -- which page they started chat on
  utm_source           TEXT,
  message_count        INTEGER      NOT NULL DEFAULT 0,
  total_tokens_in      INTEGER      NOT NULL DEFAULT 0,
  total_tokens_out     INTEGER      NOT NULL DEFAULT 0,
  estimated_cost_usd   NUMERIC(10,4) NOT NULL DEFAULT 0,
  high_value_intent    BOOLEAN      NOT NULL DEFAULT FALSE,      -- flagged if 3+ mentions of audit/comprehensive/integration
  conversion_event     TEXT,                                     -- booking_clicked | contact_clicked | newsletter_signup | NULL
  ended_at             TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. chatbot_messages — individual turn log (FK → chatbot_sessions CASCADE)
--    NOTE: Table created at launch but unused per D-002 (chatbot deferred).
-- ---------------------------------------------------------------------------

CREATE TABLE chatbot_messages (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID         NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  role            TEXT         NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT         NOT NULL,
  tokens_in       INTEGER,
  tokens_out      INTEGER,
  model           TEXT,                                          -- which model handled (via AI Gateway)
  flagged_topics  TEXT[],                                        -- topic guard flags
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chatbot_session_id      ON chatbot_sessions(session_id);
CREATE INDEX idx_chatbot_lead_created    ON chatbot_sessions(lead_id, created_at DESC);
CREATE INDEX idx_chatbot_high_intent     ON chatbot_sessions(high_value_intent, created_at DESC)
                                         WHERE high_value_intent = TRUE;
CREATE INDEX idx_chatbot_messages_session ON chatbot_messages(session_id, created_at);

-- ---------------------------------------------------------------------------
-- 5. newsletter_subscribers — Resend audience mirror + GDPR consent proof
-- ---------------------------------------------------------------------------

CREATE TABLE newsletter_subscribers (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID         REFERENCES leads(id) ON DELETE SET NULL,
  email               TEXT         UNIQUE NOT NULL,
  resend_audience_id  TEXT,
  source_url          TEXT,
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  locale              TEXT         NOT NULL DEFAULT 'cs',
  ip_hash             TEXT,
  consented_at        TIMESTAMPTZ  NOT NULL,                     -- explicit GDPR consent timestamp
  consent_text        TEXT         NOT NULL,                     -- exact text shown at signup (compliance proof)
  unsubscribed_at     TIMESTAMPTZ,                               -- soft delete
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_email  ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(unsubscribed_at)
                                    WHERE unsubscribed_at IS NULL;
CREATE INDEX idx_newsletter_lead   ON newsletter_subscribers(lead_id);

-- ---------------------------------------------------------------------------
-- 6. booking_events — Cal.com webhook log + invoice tracking (Path B)
--    invoice_id is a free-form reference into Roman's existing accounting tool
--    per D-003 (Fakturoid integration removed from scope).
-- ---------------------------------------------------------------------------

CREATE TABLE booking_events (
  id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                     UUID         REFERENCES leads(id) ON DELETE SET NULL,
  cal_booking_id              TEXT         NOT NULL,
  event_type                  TEXT         NOT NULL,             -- BOOKING_CREATED | RESCHEDULED | CANCELLED | REJECTED
  audit_tier                  TEXT,                              -- tier_1 | tier_2 | tier_3 | free_scoping
  attendee_email              TEXT,
  attendee_name               TEXT,
  scheduled_for               TIMESTAMPTZ,
  invoice_status              TEXT,                              -- pending_invoice | invoiced | paid | overdue
  invoice_id                  TEXT,                              -- external invoicing tool reference (D-003)
  webhook_signature_verified  BOOLEAN      NOT NULL,
  raw_payload                 JSONB        NOT NULL,             -- full webhook for replay/audit
  received_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_cal_id              ON booking_events(cal_booking_id);
CREATE INDEX idx_booking_lead                ON booking_events(lead_id);
CREATE INDEX idx_booking_invoice_status      ON booking_events(invoice_status, scheduled_for)
                                              WHERE invoice_status IN ('pending_invoice', 'invoiced', 'overdue');
CREATE INDEX idx_booking_event_type_received ON booking_events(event_type, received_at DESC);

-- ---------------------------------------------------------------------------
-- 7. aeo_citations — strategic AI search intelligence
--    Roman manually inserts via Supabase Studio at launch (source_method = 'manual').
--    Automation (scraping / LLM API queries) evaluated post-launch.
-- ---------------------------------------------------------------------------

CREATE TABLE aeo_citations (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  llm_provider    TEXT         NOT NULL,                         -- chatgpt | claude | gemini | perplexity | google_ai_overviews | brave_ai
  query           TEXT         NOT NULL,                         -- what was asked
  citation_text   TEXT,                                          -- how VICTA was mentioned
  cited_url       TEXT,                                          -- which VICTA page was cited
  date_observed   DATE         NOT NULL,
  source_method   TEXT         NOT NULL,                         -- manual | scrape | api
  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aeo_provider_date ON aeo_citations(llm_provider, date_observed DESC);

-- ---------------------------------------------------------------------------
-- 8. audit_log — compliance + debugging trail
--    Standalone table (no FK to leads). Actor is free-form text so log entries
--    survive even after a GDPR deletion wipes the lead.
-- ---------------------------------------------------------------------------

CREATE TABLE audit_log (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     TEXT         NOT NULL,                          -- gdpr_access_request | gdpr_deletion | config_change | admin_login | webhook_replay_attempt
  actor          TEXT,                                           -- admin email | system | visitor:hashed_ip
  resource_type  TEXT,
  resource_id    TEXT,
  details        JSONB,
  ip_hash        TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_event_actor ON audit_log(event_type, actor, created_at DESC);
CREATE INDEX idx_audit_actor       ON audit_log(actor, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row-Level Security — default-deny pattern (AR-21)
--
-- All tables have RLS enabled. The anon role (used by any public client) is
-- denied by default because no anon-facing policies are created.
-- The service role (used by Vercel Functions via SUPABASE_SERVICE_KEY) bypasses
-- RLS at the Postgres level — all validated writes go through that path.
--
-- Future feature requiring public read access (e.g., public citation feed)
-- MUST add an explicit RLS policy here and document the decision in decisions.md.
-- ---------------------------------------------------------------------------

ALTER TABLE leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_citations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;

-- No anon role policies created → default deny.
-- All public form submissions go via Vercel Functions using service role key.
-- Future feature requiring public read access would add explicit RLS policy here,
-- documented in decisions.md.

COMMIT;
