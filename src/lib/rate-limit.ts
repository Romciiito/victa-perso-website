import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { createHash } from 'node:crypto';
import { redis } from './redis';

/**
 * SHA-256 hash of `salt:ip` truncated to 32 hex chars. Stable across requests for rate-limit
 * keys and audit-log records. Salt prevents rainbow-table reversal of IPs (AR-21, GDPR §6).
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'victa-default-salt-change-in-prod';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

const rateLimiters = {
  /** Contact form: 5 submissions per IP per 10 minutes (security-model.md §4.3, REQ-F-045). */
  contact: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '600 s'),
    prefix: 'rl:contact',
    analytics: false,
  }),
  /** Newsletter signup: 3 per IP per hour (security-model.md §4.4). */
  newsletter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '3600 s'),
    prefix: 'rl:newsletter',
    analytics: false,
  }),
  /**
   * Newsletter confirm klik: vlastní, volnější limiter (gate Vlna 3A) —
   * sdílení s POST limiterem (3/h) by za NAT (kancelář) tiše zahodilo
   * legitimní potvrzení souhlasu druhého člověka ve stejné hodině.
   */
  newsletter_confirm: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '3600 s'),
    prefix: 'rl:nlconfirm',
    analytics: false,
  }),
  /** Cal.com webhook: 60 per minute (defense-in-depth; legitimate volume is much lower). */
  booking_webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    prefix: 'rl:bw',
    analytics: false,
  }),
} as const;

export type LimiterKey = keyof typeof rateLimiters;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number;
}

/**
 * Form rate limiters fail-OPEN if Redis is unreachable (REQ-I-020 + vendor-setup-checklist §5
 * "fail-open"). Don't block legitimate submissions just because rate-limit DB is down. Sentry
 * picks up the warn log and the operator investigates. The chatbot, when reactivated post-launch,
 * fails-CLOSED instead — see security-model.md §4.1.
 */
export async function checkLimit(key: LimiterKey, identifier: string): Promise<RateLimitResult> {
  try {
    const r = await rateLimiters[key].limit(identifier);
    return { ok: r.success, remaining: r.remaining, reset: r.reset };
  } catch (err) {
    console.warn(`[rate-limit] ${key} fail-open:`, (err as Error).message);
    return { ok: true, remaining: -1, reset: 0 };
  }
}

/* ============================================================================
 * Cal.com webhook idempotency (AR-11, architecture.md §3.3 — audit P0-15 fix)
 *
 * The previous single-key design (`webhook:cal:${calBookingId}`, claimed via
 * SETNX BEFORE any processing) had two bugs:
 *
 *   1. The claim happened before the Supabase insert. If the insert then
 *      failed (e.g. Supabase outage), the key was already burned — Cal.com's
 *      retries would be silently deduped forever and the booking would never
 *      be written.
 *   2. The key didn't include the event type. A BOOKING_CREATED and a later
 *      BOOKING_CANCELLED for the SAME booking share the same cal_booking_id,
 *      so the cancellation would be deduped away as "already processed"
 *      within the 24h TTL — silently dropping a cancellation that matters for
 *      Path B invoicing (risk: invoicing a cancelled audit).
 *
 * Fix: key on `webhook:cal:${calBookingId}:${triggerEvent}` (distinct events
 * for the same booking get distinct keys) and only mark a key "done" AFTER
 * the Supabase write succeeds. A short-lived "processing" lock in between
 * stops concurrent retries (e.g. Cal.com firing a webhook twice within
 * milliseconds) from double-inserting while the first attempt is still
 * in-flight, without holding the 24h dedupe key hostage to that one attempt.
 * ==========================================================================*/

/** How long a "processing" claim blocks a concurrent duplicate before it's assumed dead. */
// POZOR: releaseWebhookProcessing maže lock bez ověření vlastnictví — bezpečné
// jen dokud function maxDuration (vercel.json, dnes 10 s) < tento TTL. Kdo zvedá
// maxDuration nad 60 s, musí přejít na compare-and-delete (gate poznámka, Vlna 3A).
const WEBHOOK_PROCESSING_LOCK_TTL_S = 60;
/** How long a committed "done" key suppresses reprocessing — covers Cal.com's retry window. */
const WEBHOOK_DONE_TTL_S = 86400;

function webhookKey(calBookingId: string, triggerEvent: string): string {
  return `webhook:cal:${calBookingId}:${triggerEvent}`;
}

export type WebhookClaimResult = 'new' | 'in-progress' | 'done';

/**
 * Attempts to claim `(calBookingId, triggerEvent)` for processing. Call this
 * BEFORE doing any work; call `commitWebhookProcessed` after the Supabase
 * write succeeds, or `releaseWebhookProcessing` if it fails (so a legitimate
 * Cal.com retry can try again instead of being deduped against a half-done
 * attempt).
 *
 * - `'done'`: already fully processed — skip, return 200 deduped.
 * - `'in-progress'`: another request is mid-flight (or crashed less than
 *   `WEBHOOK_PROCESSING_LOCK_TTL_S` ago without releasing) — skip, return 200
 *   deduped; a genuine Cal.com retry will land after the lock expires.
 * - `'new'`: this call claimed the lock — proceed with processing.
 *
 * Fails OPEN on Redis errors (returns `'new'`): a duplicate `booking_events`
 * row under a Redis outage is a nuisance Roman can spot in Supabase; silently
 * dropping the event forever (the P0-15 bug this replaces) is a billing risk.
 * `upsertLead`'s atomic upsert (P2-02) keeps duplicate reprocessing from
 * fragmenting the `leads` table even in that scenario.
 */
export async function claimWebhookProcessing(
  calBookingId: string,
  triggerEvent: string,
): Promise<WebhookClaimResult> {
  const key = webhookKey(calBookingId, triggerEvent);
  try {
    const existing = await redis.get<string>(key);
    if (existing === 'done') return 'done';

    const acquired = await redis.set(key, 'processing', { nx: true, ex: WEBHOOK_PROCESSING_LOCK_TTL_S });
    if (acquired === 'OK') return 'new';

    // SETNX lost the race — re-read: the other holder may have finished and
    // committed 'done' between our GET above and this SETNX attempt.
    const now = await redis.get<string>(key);
    return now === 'done' ? 'done' : 'in-progress';
  } catch (err) {
    console.warn(`[rate-limit] webhook claim fail-open (${calBookingId}:${triggerEvent}):`, (err as Error).message);
    return 'new';
  }
}

/** Marks `(calBookingId, triggerEvent)` as fully processed for `WEBHOOK_DONE_TTL_S`. */
export async function commitWebhookProcessed(calBookingId: string, triggerEvent: string): Promise<void> {
  const key = webhookKey(calBookingId, triggerEvent);
  try {
    await redis.set(key, 'done', { ex: WEBHOOK_DONE_TTL_S });
  } catch (err) {
    console.warn(`[rate-limit] webhook commit failed (${calBookingId}:${triggerEvent}):`, (err as Error).message);
  }
}

/** Releases a claimed-but-failed `(calBookingId, triggerEvent)` lock so a retry can reprocess it. */
export async function releaseWebhookProcessing(calBookingId: string, triggerEvent: string): Promise<void> {
  const key = webhookKey(calBookingId, triggerEvent);
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[rate-limit] webhook release failed (${calBookingId}:${triggerEvent}):`, (err as Error).message);
  }
}
