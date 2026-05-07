import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { wasWebhookProcessed } from '@/lib/rate-limit';

/**
 * Cal.com webhook receiver — `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`,
 * `BOOKING_REJECTED` (architecture.md §3.3).
 *
 * Security (AR-11, security-model.md §4.10):
 *  - HMAC-SHA256 signature verification via `CALCOM_WEBHOOK_SECRET` (server-only env var).
 *  - Replay protection: reject `payload.createdAt` older than 5 min.
 *  - Idempotency: Upstash NX key with 24h TTL on `cal_booking_id`.
 *  - PII-safe logging: never log attendee email/name (claude-rules §13).
 *
 * On `BOOKING_CREATED` for paid tiers: writes `booking_events` row with
 * `invoice_status='pending_invoice'` (Path B per D-003 + AR-25). Roman updates
 * `invoice_status` later via Supabase Studio when bank transfer arrives.
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
  };
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

function tierFromEventSlug(slug?: string): 'tier_1' | 'tier_2' | 'tier_3' | 'free_scoping' | null {
  switch (slug) {
    case 'tier-1-audit':
      return 'tier_1';
    case 'tier-2-audit':
      return 'tier_2';
    case 'tier-3-audit':
      return 'tier_3';
    case 'free-scoping-call':
      return 'free_scoping';
    default:
      return null;
  }
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) {
    // eslint-disable-next-line no-console
    console.error('[booking-webhook] CALCOM_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  const signature = req.headers.get('x-cal-signature-256') ?? '';
  if (!signature) {
    return NextResponse.json({ error: 'missing-signature' }, { status: 401 });
  }

  const rawBody = await req.text();
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'invalid-signature' }, { status: 401 });
  }

  let parsed: CalWebhookPayload;
  try {
    parsed = JSON.parse(rawBody) as CalWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  // Replay protection — Cal.com createdAt must be within REPLAY_WINDOW_MS.
  const created = Date.parse(parsed.createdAt);
  if (!Number.isFinite(created) || Math.abs(Date.now() - created) > REPLAY_WINDOW_MS) {
    return NextResponse.json({ error: 'stale' }, { status: 401 });
  }

  const calBookingId = String(parsed.payload.bookingId ?? parsed.payload.uid ?? '');
  if (!calBookingId) {
    return NextResponse.json({ error: 'missing-booking-id' }, { status: 400 });
  }

  // Idempotency — atomically reserve the key for 24h.
  if (await wasWebhookProcessed(calBookingId)) {
    return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
  }

  const tier = tierFromEventSlug(parsed.payload.eventType?.slug);
  const attendee = parsed.payload.attendees?.[0];

  // Upsert lead only on CREATED — reschedule/cancel reuses the existing lead.
  let leadId: string | null = null;
  if (parsed.triggerEvent === 'BOOKING_CREATED' && attendee?.email) {
    const lead = await upsertLead({
      email: attendee.email,
      name: attendee.name ?? null,
      source: 'booking',
      locale: 'cs',
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
    // eslint-disable-next-line no-console
    console.error('[booking-webhook] supabase insert error:', error.message);
    return NextResponse.json({ error: 'storage' }, { status: 500 });
  }

  // PII-safe log (claude-rules §13).
  // eslint-disable-next-line no-console
  console.log('[booking-webhook] processed', {
    event: parsed.triggerEvent,
    tier,
    scheduled: parsed.payload.startTime,
  });

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
