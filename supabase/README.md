# Supabase — VICTA

Supabase project for the VICTA marketing site. Frankfurt region (`eu-central-1`) for GDPR
data residency parity with Vercel `fra1` (AR-22).

---

## Folder structure

```
supabase/
  migrations/
    001_initial_schema.sql   # All 8 tables, indexes, RLS — apply in Wave 2
    002_*.sql                # Future migrations (add per the convention below)
  README.md                  # This file
```

---

## Applying the migration (Wave 2)

Roman applies this after creating the Supabase project and enabling 2FA (D-005).

### Option A — Supabase CLI (recommended for repeatable deploys)

```bash
# Install CLI once (https://supabase.com/docs/guides/cli)
brew install supabase/tap/supabase

# Link your project (copy project ref from Supabase dashboard → Settings → General)
supabase link --project-ref <your-project-ref>

# Push all pending migrations
supabase db push
```

`SUPABASE_DB_URL` must be set in your shell (get it from Supabase dashboard →
Settings → Database → Connection string → URI).

### Option B — Paste into Supabase SQL Editor

1. Open Supabase dashboard → SQL Editor → New query.
2. Copy the full contents of `supabase/migrations/001_initial_schema.sql`.
3. Paste and click Run.
4. Confirm all 8 tables appear in Table Editor.

---

## Verifying RLS default-deny

After applying the migration, confirm that the anon key cannot read any data.
Run this from a terminal with only the anon (public) key available:

```bash
curl -s \
  -H "apikey: <your-anon-key>" \
  -H "Authorization: Bearer <your-anon-key>" \
  "https://<project-ref>.supabase.co/rest/v1/leads?select=id&limit=1"
```

Expected response: `[]` (empty array) or a 403 — never actual row data.
Repeat for every table (`leads`, `contact_submissions`, `chatbot_sessions`,
`chatbot_messages`, `newsletter_subscribers`, `booking_events`, `aeo_citations`,
`audit_log`). Any non-empty result means an unintended anon policy exists.

---

## Adding future migrations

Name files sequentially and describe the change:

```
002_add_lead_score_column.sql
003_backfill_status_index.sql
```

Structure each file identically to `001_initial_schema.sql`:

```sql
-- VICTA schema migration
-- Migration: 00N_short_description
-- Created: YYYY-MM-DD
-- Purpose: ...

BEGIN;

-- ... DDL changes ...

COMMIT;
```

Apply with `supabase db push` (CLI) or paste into SQL Editor.
Never edit or delete existing migration files — append only.

---

## Key notes

### Region — Frankfurt (AR-22)

When Roman creates the Supabase project he MUST select **Frankfurt (eu-central-1)**.
This is non-negotiable: GDPR data residency requires EU storage, and Frankfurt matches
the Vercel `fra1` region to minimise latency on Vercel Function → Supabase queries.

### Service role vs. anon key

| Key | Used by | Has DB access |
|-----|---------|---------------|
| `SUPABASE_SERVICE_KEY` | Vercel Functions (server-only env var) | Yes — bypasses RLS |
| `SUPABASE_ANON_KEY` | Public health checks only | No — RLS default-deny |

`SUPABASE_SERVICE_KEY` must NEVER appear in client-side bundles or `NEXT_PUBLIC_*`
env vars (see claude-rules.md API key exposure rule and architecture.md AR-21).

### Chatbot tables

`chatbot_sessions` and `chatbot_messages` exist in this migration but will contain
zero rows at launch. Per D-002, the chatbot is deferred to post-launch (Phase 3).
They are created now to avoid a separate migration when the chatbot is reactivated.
