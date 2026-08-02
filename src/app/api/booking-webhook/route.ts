import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { sanitizeFormString } from '@/lib/sanitize';
import {
  checkLimit,
  hashIp,
  claimWebhookProcessing,
  commitWebhookProcessed,
  releaseWebhookProcessing,
} from '@/lib/rate-limit';
import { tierFromEventSlug } from '@/config/booking';

/**
 * Cal.com webhook receiver — `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`,
 * `BOOKING_REJECTED` (architecture.md §3.3).
 *
 * Security (AR-11, security-model.md §4.10):
 *  - HMAC-SHA256 signature verification via `CALCOM_WEBHOOK_SECRET` (server-only env var).
 *  - Per-IP rate limit (60 req/60s, defense-in-depth — audit P2-03: this limiter was defined
 *    but never wired up) — checked AFTER signature verification so only requests that already
 *    proved they hold the webhook secret consume the budget.
 *  - Replay protection: reject `payload.createdAt` older than 5 min.
 *  - Idempotency: claim-before-process, commit-after-success on
 *    `webhook:cal:${calBookingId}:${triggerEvent}` (audit P0-15 — see `src/lib/rate-limit.ts`
 *    for why the key now includes the event type and why the claim is no longer burned before
 *    the Supabase write succeeds).
 *  - PII-safe logging: never log attendee email/name (claude-rules §13).
 *
 * On `BOOKING_CREATED` for paid tiers: writes `booking_events` row with
 * `invoice_status='pending_invoice'` (Path B per D-003 + AR-25). Roman updates
 * `invoice_status` later via Supabase Studio when bank transfer arrives.
 *
 * Custom booking-question fields (budget, company — audit P1-09): read defensively from
 * `payload.responses` / `payload.metadata` since the Cal.com event types that carry them are
 * provisioned separately (see docs/setup/calcom-event-types.md) — a booking without them still
 * processes normally, just without `budget_tier`/`company` on the resulting lead.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cal.com `createdAt` replay window — security-model.md §4.10. */
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

interface CalWebhookPayload {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED' | 'BOOKING_REJECTED';
  createdAt: string;
  payload: {
    bookingId?: number | string;
    uid?: string;
    eventType?: { slug?: string };
    title?: string;
    startTime?: string;
    endTime?: string;
    attendees?: Array<{ email?: string; name?: string; timeZone?: string }>;
    metadata?: Record<string, unknown>;
    // Cal.com "booking questions" (custom fields) — keyed by an internal field
    // id/name, each carrying the human-readable question label plus the
    // answer. Shape is defensive/optional: not every event type has these
    // fields configured yet (docs/setup/calcom-event-types.md §2 pending).
    responses?: Record<string, { label?: string; value?: unknown } | undefined>;
  };
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? '0.0.0.0';
}

// NOTE (matches the NBSP/diacritics gotcha documented in decisions.md D-012):
// every non-ASCII match target below is written as an explicit \uXXXX escape,
// never a literal pasted character — literal combining marks / NBSP / dash
// variants are visually indistinguishable from plain ASCII in most editors
// and have silently broken matches elsewhere in this codebase before.
const COMBINING_DIACRITICS_RE = /[\u0300-\u036f]/g; // NFD combining marks
const NBSP_RE = /\u00a0/g;
const DASH_VARIANTS_RE = /[\u2012-\u2015]/g; // figure/en/em dash, horizontal bar

/** Strips diacritics + collapses NBSP/whitespace/case so Czech labels match reliably. */
function normalizeLabel(s: string): string {
  return s
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_RE, '')
    .replace(NBSP_RE, ' ')
    .trim()
    .toLowerCase();
}

/** Cal.com "select" custom field answers carry the option's display label as `value`. */
const BUDGET_LABEL_TO_TIER: Record<string, string> = {
  'do 5 000 e': 'under_5k',
  '5 000 - 25 000 e': '5k-25k',
  '25 000 - 100 000 e': '25k-100k',
  'nad 100 000 e': '100k+',
};

function normalizeBudgetLabel(s: string): string {
  // Fold the euro sign and whichever dash variant Cal.com's UI renders into
  // the plain ASCII forms used as BUDGET_LABEL_TO_TIER keys above, on top of
  // the generic normalizeLabel() pass — Roman pastes the labels verbatim from
  // docs/setup/calcom-event-types.md §2, but Cal.com's own select widget may
  // render an en dash instead of a hyphen, and the € sign varies by input method.
  return normalizeLabel(s).replace(DASH_VARIANTS_RE, '-').replace(/\u20ac/g, 'e');
}

const BUDGET_FIELD_MATCHERS = [/budget/i, /rozpo[cč]et/i];
const COMPANY_FIELD_MATCHERS = [/company/i, /^firma$/i, /firma/i, /spole[cč]nost/i];

/**
 * Scans `payload.responses` for a custom field whose key OR label matches one
 * of `matchers`, returning its answer as a string. Returns `null` if nothing
 * matches or the matched answer isn't a usable string — never throws, since
 * every one of these fields is optional (audit P1-09).
 */
function extractCustomField(
  responses: CalWebhookPayload['payload']['responses'],
  matchers: RegExp[],
): string | null {
  if (!responses) return null;
  for (const [key, entry] of Object.entries(responses)) {
    if (!entry) continue;
    const label = typeof entry.label === 'string' ? entry.label : '';
    const haystack = `${key} ${label}`;
    if (!matchers.some((re) => re.test(haystack))) continue;
    const { value } = entry;
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) return value[0].trim();
  }
  return null;
}

/**
 * Best-effort budget_tier extraction. Prefers an exact match against the
 * canonical labels from docs/setup/calcom-event-types.md §2 (mapped to the
 * same enum values `contact-schema.ts` uses, so leads from both channels are
 * comparable); falls back to the raw answer text (sanitized, length-capped)
 * rather than silently dropping data if Cal.com's rendered label doesn't
 * match byte-for-byte — the `leads.budget_tier` column is free-form TEXT.
 */
function extractBudgetTier(payload: CalWebhookPayload['payload']): string | null {
  const raw = extractCustomField(payload.responses, BUDGET_FIELD_MATCHERS);
  if (!raw) return null;
  const mapped = BUDGET_LABEL_TO_TIER[normalizeBudgetLabel(raw)];
  return mapped ?? sanitizeFormString(raw, 60);
}

function extractCompany(payload: CalWebhookPayload['payload']): string | null {
  const raw = extractCustomField(payload.responses, COMPANY_FIELD_MATCHERS);
  return raw ? sanitizeFormString(raw, 120) : null;
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  // Cal.com signs as hex of HMAC-SHA256(rawBody, secret)
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  let sigBuf: Buffer;
  let expBuf: Buffer;
  try {
    sigBuf = Buffer.from(signature, 'hex');
    expBuf = Buffer.from(expected, 'hex');
  } catch {
    return false;
  }
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

function mapEventType(
  trigger: CalWebhookPayload['triggerEvent'],
): 'BOOKING_CREATED' | 'RESCHEDULED' | 'CANCELLED' | 'REJECTED' {
  switch (trigger) {
    case 'BOOKING_CREATED':
      return 'BOOKING_CREATED';
    case 'BOOKING_RESCHEDULED':
      return 'RESCHEDULED';
    case 'BOOKING_CANCELLED':
      return 'CANCELLED';
    case 'BOOKING_REJECTED':
      return 'REJECTED';
  }
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[booking-webhook] CALCOM_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500, headers: NO_STORE });
  }

  const signature = req.headers.get('x-cal-signature-256') ?? '';
  if (!signature) {
    return NextResponse.json({ error: 'missing-signature' }, { status: 401, headers: NO_STORE });
  }

  const rawBody = await req.text();
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'invalid-signature' }, { status: 401, headers: NO_STORE });
  }

  // Rate limit (P2-03 — this limiter was defined but never called). Deliberately
  // AFTER signature verification: only requests that already proved they hold
  // the webhook secret consume the budget, so an attacker spamming garbage
  // requests without a valid signature can't exhaust it and DoS real Cal.com
  // retries. Fail-open on Redis outage (checkLimit's own behavior) — same
  // rationale as the form endpoints: don't let a rate-limit-store outage drop
  // real bookings.
  const ip = clientIp(req);
  const rl = await checkLimit('booking_webhook', hashIp(ip));
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate-limit' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': '60' } },
    );
  }

  let parsed: CalWebhookPayload;
  try {
    parsed = JSON.parse(rawBody) as CalWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400, headers: NO_STORE });
  }

  // Replay protection — Cal.com createdAt must be within REPLAY_WINDOW_MS.
  const created = Date.parse(parsed.createdAt);
  if (!Number.isFinite(created) || Math.abs(Date.now() - created) > REPLAY_WINDOW_MS) {
    return NextResponse.json({ error: 'stale' }, { status: 401, headers: NO_STORE });
  }

  const calBookingId = String(parsed.payload.bookingId ?? parsed.payload.uid ?? '');
  if (!calBookingId) {
    return NextResponse.json({ error: 'missing-booking-id' }, { status: 400, headers: NO_STORE });
  }

  // Idempotency (P0-15) — claim BEFORE processing, but only commit "done"
  // AFTER the Supabase write below succeeds. Keyed on (bookingId, triggerEvent)
  // so a CANCELLED for a booking whose CREATED already committed is still
  // claimable — see src/lib/rate-limit.ts for the full rationale.
  const claim = await claimWebhookProcessing(calBookingId, parsed.triggerEvent);
  if (claim !== 'new') {
    return NextResponse.json({ ok: true, deduped: true }, { status: 200, headers: NO_STORE });
  }

  const tier = tierFromEventSlug(parsed.payload.eventType?.slug);
  const attendee = parsed.payload.attendees?.[0];

  // Upsert lead only on CREATED — reschedule/cancel reuses the existing lead.
  // Custom booking-question fields (budget, company — P1-09) are read
  // defensively; both are optional and absent until the Cal.com event types
  // configure them (docs/setup/calcom-event-types.md §2).
  let leadId: string | null = null;
  if (parsed.triggerEvent === 'BOOKING_CREATED' && attendee?.email) {
    const lead = await upsertLead({
      email: attendee.email,
      name: attendee.name ?? null,
      company: extractCompany(parsed.payload),
      source: 'booking',
      locale: 'cs',
      budget_tier: extractBudgetTier(parsed.payload),
    });
    leadId = lead?.id ?? null;
  }

  const isPaidTier = tier !== null && tier !== 'free_scoping';
  const invoiceStatus = parsed.triggerEvent === 'BOOKING_CREATED' && isPaidTier ? 'pending_invoice' : null;

  const { error } = await supabaseAdmin.from('booking_events').insert({
    lead_id: leadId,
    cal_booking_id: calBookingId,
    event_type: mapEventType(parsed.triggerEvent),
    audit_tier: tier,
    attendee_email: attendee?.email ?? null,
    attendee_name: attendee?.name ?? null,
    scheduled_for: parsed.payload.startTime ?? null,
    invoice_status: invoiceStatus,
    invoice_id: null,
    webhook_signature_verified: true,
    raw_payload: parsed,
  });
  if (error) {
    // 23505 = unique violation na (cal_booking_id, event_type) — migrace 003.
    // Nastane, jen když Redis fail-open pustil duplicitní zpracování; DB je
    // autorita, řádek už existuje, takže dedup, ne chyba (bez toho by fail-open
    // znamenal duplicitní pending_invoice = riziko dvojí fakturace).
    if ((error as { code?: string }).code === '23505') {
      await commitWebhookProcessed(calBookingId, parsed.triggerEvent);
      return NextResponse.json({ ok: true, deduped: true }, { status: 200, headers: NO_STORE });
    }
    console.error('[booking-webhook] supabase insert error:', error.message);
    // Release the claim so a genuine Cal.com retry (they retry on non-2xx
    // responses) can reprocess this event instead of being deduped against a
    // write that never actually happened (audit P0-15's core bug).
    await releaseWebhookProcessing(calBookingId, parsed.triggerEvent);
    return NextResponse.json({ error: 'storage' }, { status: 500, headers: NO_STORE });
  }

  await commitWebhookProcessed(calBookingId, parsed.triggerEvent);

  // PII-safe log (claude-rules §13).
  console.log('[booking-webhook] processed', {
    event: parsed.triggerEvent,
    tier,
    scheduled: parsed.payload.startTime,
  });

  return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
}
