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
    // eslint-disable-next-line no-console
    console.warn(`[rate-limit] ${key} fail-open:`, (err as Error).message);
    return { ok: true, remaining: -1, reset: 0 };
  }
}

/**
 * Idempotency check for Cal.com webhook (AR-11 architecture.md §3.3). Returns `true` if the
 * webhook was already processed within the last 24h, `false` otherwise (and atomically claims
 * the key). The 24h TTL covers Cal.com's worst-case retry window without requiring infinite
 * memory.
 */
export async function wasWebhookProcessed(calBookingId: string): Promise<boolean> {
  const key = `webhook:cal:${calBookingId}`;
  const set = await redis.set(key, '1', { nx: true, ex: 86400 });
  // Upstash SDK returns 'OK' on success, null when key already existed.
  return set !== 'OK';
}
