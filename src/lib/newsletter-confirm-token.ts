import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless double opt-in confirmation token (P1-07, D-014).
 *
 * `POST /api/newsletter` no longer writes anything to Supabase — it only
 * validates the submission and emails a signed link to
 * `/api/newsletter/confirm?token=...`. The token itself carries everything
 * the confirm step needs (email, locale, best-effort UTM/source), so no
 * server-side session or DB row has to survive between the two requests —
 * consent is only ever recorded once the visitor proves control of the
 * inbox by clicking the link.
 *
 * Format: `${base64url(JSON payload)}.${hex HMAC-SHA256 signature}` — same
 * hex-digest + `timingSafeEqual` pattern as the Cal.com webhook verifier
 * (`src/app/api/booking-webhook/route.ts`), for consistency.
 */

export interface NewsletterConfirmPayload {
  email: string;
  locale: 'cs' | 'en';
  /** Signing time, `Date.now()` — the confirm step's replay/expiry window is measured from this. */
  ts: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  source_url?: string;
}

/** Confirmation links expire after 48h (P1-07 requirement). */
export const NEWSLETTER_CONFIRM_MAX_AGE_MS = 48 * 60 * 60 * 1000;

function isPayloadShape(value: unknown): value is NewsletterConfirmPayload {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  if (typeof p.email !== 'string' || p.email.length === 0) return false;
  if (p.locale !== 'cs' && p.locale !== 'en') return false;
  if (typeof p.ts !== 'number' || !Number.isFinite(p.ts)) return false;
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'source_url'] as const) {
    if (key in p && p[key] !== undefined && typeof p[key] !== 'string') return false;
  }
  return true;
}

export function signNewsletterConfirmToken(payload: NewsletterConfirmPayload, secret: string): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the HMAC signature (constant-time) and payload shape only —
 * deliberately does NOT check token age. Call `isNewsletterConfirmTokenFresh`
 * separately so the caller (the confirm route) can tell an invalid/tampered
 * token apart from a merely expired one and redirect the visitor accordingly.
 * Returns the decoded payload on success, `null` on any failure.
 */
export function verifyNewsletterConfirmToken(token: string, secret: string): NewsletterConfirmPayload | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const payloadB64 = token.slice(0, dot);
  const signatureHex = token.slice(dot + 1);

  const expectedHex = createHmac('sha256', secret).update(payloadB64).digest('hex');
  // Reject before the Buffer/timingSafeEqual step if the signature isn't
  // even hex of the right length — timingSafeEqual requires equal-length
  // buffers, and a malformed hex string could otherwise throw instead of
  // cleanly returning null.
  if (signatureHex.length !== expectedHex.length || !/^[0-9a-f]+$/i.test(signatureHex)) {
    return null;
  }

  const signatureBuf = Buffer.from(signatureHex, 'hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    return isPayloadShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** True if `payload.ts` is within `NEWSLETTER_CONFIRM_MAX_AGE_MS` of `now` (and not in the future). */
export function isNewsletterConfirmTokenFresh(
  payload: NewsletterConfirmPayload,
  now: number = Date.now(),
): boolean {
  const age = now - payload.ts;
  return age >= 0 && age <= NEWSLETTER_CONFIRM_MAX_AGE_MS;
}
