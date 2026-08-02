import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { TURNSTILE_BYPASS_TOKEN, turnstileKeyLooksReal } from './turnstile-shared';

/**
 * Cloudflare Turnstile server-side token verification.
 * Doc: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Privacy-preserving CAPTCHA — no cookie, no fingerprinting (security-model.md §4.3,
 * stack-decision.md §4 Cloudflare Turnstile). Used on contact form + newsletter signup.
 *
 * Fail-CLOSED when provisioned: a network error or a Cloudflare rejection blocks the
 * request. Unlike rate-limit (fail-open), bot defense must not be bypassed when
 * downstream is shaky.
 *
 * NOT-PROVISIONED SKIP (D-011): when TURNSTILE_SECRET_KEY is absent or not a real
 * Cloudflare secret (real keys — including the official test keys — start with 0x–3x),
 * verification is skipped so the contact/newsletter forms work before the account is
 * provisioned. Honeypot + rate limiting remain active. The client widget mirrors this
 * check on NEXT_PUBLIC_TURNSTILE_SITE_KEY and supplies a sentinel token. As soon as a
 * real key pair lands in env, both sides auto-promote to full fail-closed verification.
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes: string[];
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const secretConfigured = turnstileKeyLooksReal(secret);
  const siteKeyConfigured = turnstileKeyLooksReal(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  if (!secretConfigured) {
    if (siteKeyConfigured) {
      // Partial provisioning: real users are being shown (and solving) the real
      // widget, but we cannot verify their tokens. Silently accepting here would
      // turn the visible CAPTCHA into theatre — fail CLOSED and alert loudly.
      console.error(
        '[turnstile] PARTIAL PROVISIONING: NEXT_PUBLIC_TURNSTILE_SITE_KEY is real but TURNSTILE_SECRET_KEY is missing/malformed — failing closed. Fix the secret in env.',
      );
      Sentry.captureMessage('turnstile: partial provisioning — site key real, secret missing/malformed', {
        level: 'error',
      });
      return { success: false, errorCodes: ['partial-provisioning'] };
    }
    // Neither key provisioned — the intended dev/preview skip (D-011).
    console.warn(
      '[turnstile] not provisioned — verification SKIPPED (honeypot + rate limit remain active). Provision real keys before launch traffic.',
    );
    return { success: true, errorCodes: ['not-configured'] };
  }

  if (token === TURNSTILE_BYPASS_TOKEN) {
    // The client thinks Turnstile is off while the server has a real secret —
    // the inverse provisioning asymmetry. Every visitor would hit this, so
    // surface it in monitoring instead of a generic Cloudflare rejection.
    console.error(
      '[turnstile] client sent the not-configured sentinel while TURNSTILE_SECRET_KEY is real — check NEXT_PUBLIC_TURNSTILE_SITE_KEY in env.',
    );
    Sentry.captureMessage('turnstile: client not provisioned while server secret is real', {
      level: 'error',
    });
    return { success: false, errorCodes: ['client-not-provisioned'] };
  }
  if (!token || typeof token !== 'string' || token.length < 10) {
    return { success: false, errorCodes: ['missing-token'] };
  }
  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      return { success: false, errorCodes: [`http-${res.status}`] };
    }
    const json = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return { success: json.success === true, errorCodes: json['error-codes'] ?? [] };
  } catch (err) {
    console.error('[turnstile] verify error:', (err as Error).message);
    return { success: false, errorCodes: ['network-error'] };
  }
}
