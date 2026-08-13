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
  /**
   * Company-registry autocomplete (Vlna 6, `/api/company-lookup`): 30 per IP
   * per 60s — generous because this fires on every debounced keystroke while
   * a visitor types their company name (not a one-shot form submit like the
   * limiters above). Fail-open via `checkLimit` below like the other form
   * limiters: it's a search-as-you-type affordance, not a spend-controlled
   * resource — a Redis outage must not block the contact form itself.
   */
  company_lookup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    prefix: 'rl:complookup',
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

/* ============================================================================
 * Chatbot rate limiting — three independent dimensions (AR-17, never merged).
 *
 * FAIL-CLOSED, not fail-open. `checkLimit` above deliberately swallows Redis
 * errors for the contact/newsletter forms (REQ-I-020: don't block a
 * legitimate lead because the rate-limit store hiccuped). The chatbot is the
 * opposite case: rate limiting exists ONLY for cost control against a
 * per-request-billed AI Gateway call (security-model.md §4.1 cost-
 * amplification threat) — an unreachable Redis must not silently wave every
 * request through to that call. The functions below let Redis errors
 * propagate; `/api/chat` catches them at the top level and returns the
 * documented static-fallback 503 (architecture.md §13.2), never a raw 500
 * and never a bypassed limit.
 * ==========================================================================*/

/** Per-IP chat cap (AR-17 dimension 1 of 3): 10 requests / 60s window. */
const CHAT_IP_LIMIT = 10;
const CHAT_IP_WINDOW_S = 60;

export interface ChatIpLimitResult {
  ok: boolean;
  count: number;
  limit: number;
}

/**
 * Per-IP chat rate limit, implemented as a FIXED window counter (INCR +
 * EXPIRE) rather than `@upstash/ratelimit`'s Lua-script-based sliding
 * window used by `checkLimit`'s dimensions above. Deliberate: this keeps
 * all three chat rate-limit dimensions on the same plain Redis primitives
 * (INCR/EXPIRE/GET/SET, no EVALSHA), which is what `incrChatSessionMessages`
 * and `claimChatDailyConversation` below already use — one consistent,
 * easily-testable implementation strategy for the whole chatbot rate-limit
 * surface, and one fewer Upstash feature (Lua scripting) to depend on
 * working correctly under a REST-based Redis client.
 *
 * Trade-off accepted: a fixed window can allow roughly 2x the nominal limit
 * right at a minute boundary (e.g. 10 requests in the last second of one
 * window + 10 more in the first second of the next). For a 10 req/60s
 * cost-control gate — backed by two OTHER independent dimensions
 * (per-session, per-day) — this is an acceptable trade against the
 * simplicity and testability gained; it is not the sole defense.
 *
 * Errors propagate (fail-closed) — same rationale as the module comment
 * above.
 */
export async function checkChatIpLimit(ipHash: string): Promise<ChatIpLimitResult> {
  const bucket = Math.floor(Date.now() / (CHAT_IP_WINDOW_S * 1000));
  const key = `rl:chat_ip:${ipHash}:${bucket}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, CHAT_IP_WINDOW_S);
  }
  return { ok: count <= CHAT_IP_LIMIT, count, limit: CHAT_IP_LIMIT };
}

/** Per-session message cap (AR-17 dimension 2 of 3): 20 messages/conversation. */
const CHAT_SESSION_MAX_MESSAGES = 20;
/** Bounds both the conversation's server-side lifetime and Redis key growth. */
const CHAT_SESSION_TTL_S = 60 * 60 * 24;
/** Per-day new-conversation cap (AR-17 dimension 3 of 3): 1/IP/day. */
const CHAT_DAILY_TTL_S = 60 * 60 * 24;

export interface ChatSessionLimitResult {
  ok: boolean;
  count: number;
  limit: number;
}

/**
 * Increments the server-side authoritative message counter for a chat
 * session and reports whether it is still within the 20-message cap.
 * `session_id` is client-supplied but the COUNT is not — the client's own
 * `messages` array length is never trusted for this check (dispatch brief:
 * "server-side kontrola délky messages — klientovi nevěř"); the Zod schema's
 * `max(40)` on the array is a separate, independent defense against a single
 * oversized request, not a substitute for this cross-request counter.
 */
export async function incrChatSessionMessages(sessionId: string): Promise<ChatSessionLimitResult> {
  const key = `rl:chat_session:${sessionId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, CHAT_SESSION_TTL_S);
  }
  return { ok: count <= CHAT_SESSION_MAX_MESSAGES, count, limit: CHAT_SESSION_MAX_MESSAGES };
}

/**
 * Claims today's one-new-conversation-per-IP slot, but ONLY when `sessionId`
 * has not been seen before — an already-known session is a continuation of
 * an already-permitted conversation, not a new one (dispatch brief: "SETNX
 * denní klíč při první zprávě session; existující session pokračuje"). The
 * "have we seen this session" signal itself lives in Redis
 * (`rl:chat_seen:{sessionId}`) rather than being inferred from the request
 * shape, so it is authoritative across a session's whole lifetime, not just
 * within one request.
 *
 * Two properties worth recording explicitly (code-reviewer finding I-5 —
 * verified correct against the exact attack the brief describes, but with
 * consequences worth someone's eyes before activation):
 *
 * 1. `rl:chat_seen:{sessionId}` is keyed on session_id ALONE, not on
 *    `(ipHash, sessionId)`. A request presenting a previously-claimed
 *    session_id always continues, from ANY IP, skipping the daily check
 *    entirely. This is not exploitable as a bypass — the key is only ever
 *    set by this function itself, after a successful claim, and a
 *    `crypto.randomUUID()` session_id isn't guessable — but it means the
 *    daily cap's real effect is "1 NEW conversation id claimed per IP per
 *    day", not "1 conversation total per IP per day" if that id later moves
 *    across IPs (e.g. a visitor on mobile data, then wifi).
 * 2. Combined with `incrChatSessionMessages`'s 20-message cap, the practical
 *    ceiling this enforces is ~20 messages per IP per rolling 24h — which
 *    means every visitor behind the same NAT (a shared office connection)
 *    shares that one daily slot. VICTA's stated audience (architecture.md,
 *    vision.md) is 50-300-employee companies — i.e. office NAT is the
 *    common case, not the edge case. AR-17 mandates this design, so this is
 *    spec-compliant, but the product consequence (a second colleague at the
 *    same office getting `429 daily-limit` on the same day) should reach
 *    Roman before activation, not be discovered after. Changing the
 *    dimension's key (e.g. adding a session-count multiplier) needs its own
 *    decision record, not a quiet edit here.
 */
export async function claimChatDailyConversation(
  ipHash: string,
  sessionId: string,
): Promise<{ ok: boolean }> {
  const seenKey = `rl:chat_seen:${sessionId}`;
  const alreadySeen = await redis.get<string>(seenKey);
  if (alreadySeen) return { ok: true };

  const day = new Date().toISOString().slice(0, 10); // UTC calendar date
  const dailyKey = `rl:chat_daily:${ipHash}:${day}`;
  const claimed = await redis.set(dailyKey, sessionId, { nx: true, ex: CHAT_DAILY_TTL_S });
  if (claimed !== 'OK') {
    return { ok: false };
  }
  await redis.set(seenKey, '1', { ex: CHAT_SESSION_TTL_S });
  return { ok: true };
}
