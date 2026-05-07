import 'server-only';

/**
 * Cloudflare Turnstile server-side token verification.
 * Doc: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Privacy-preserving CAPTCHA — no cookie, no fingerprinting (security-model.md §4.3,
 * stack-decision.md §4 Cloudflare Turnstile). Used on contact form + newsletter signup.
 *
 * Fail-CLOSED: a network error or missing secret rejects the request. Unlike rate-limit
 * (fail-open), bot defense must not be bypassed when downstream is shaky.
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes: string[];
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // eslint-disable-next-line no-console
    console.error('[turnstile] TURNSTILE_SECRET_KEY missing in env');
    return { success: false, errorCodes: ['missing-secret'] };
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
