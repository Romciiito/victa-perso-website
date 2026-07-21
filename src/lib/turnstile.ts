import 'server-only';

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
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !/^[0-3]x/.test(secret)) {
    // eslint-disable-next-line no-console
    console.warn(
      '[turnstile] TURNSTILE_SECRET_KEY missing/placeholder — verification SKIPPED (honeypot + rate limit remain active). Provision a real key before launch traffic.',
    );
    return { success: true, errorCodes: ['not-configured'] };
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
    // eslint-disable-next-line no-console
    console.error('[turnstile] verify error:', (err as Error).message);
    return { success: false, errorCodes: ['network-error'] };
  }
}
