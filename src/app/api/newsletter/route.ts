import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import { newsletterSchema } from '@/lib/newsletter-schema';
import { isValidEmail } from '@/lib/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkLimit, hashIp } from '@/lib/rate-limit';
import { signNewsletterConfirmToken } from '@/lib/newsletter-confirm-token';
import { newsletterConfirmRequestEmailHtml } from '@/lib/email-html';
import { isAllowedOrigin, clientIp } from '@/lib/origin';
import { site } from '@/config/site';

/**
 * Newsletter signup handler — STATELESS double opt-in request (P1-07, D-014).
 *
 * This route no longer writes anything to Supabase. It only validates the
 * submission and, if everything checks out, emails a signed confirmation
 * link to `/api/newsletter/confirm?token=...`. GDPR proof-of-consent
 * (`consented_at`/`consent_text`/`ip_hash`) is recorded ONLY when that link
 * is clicked — see `src/app/api/newsletter/confirm/route.ts` — because
 * that's the point at which the visitor has actually proven control of the
 * inbox, which is the whole point of double opt-in (D-014 closes RB-17, the
 * open question in newsletter-schema.ts about whether single opt-in was
 * legally sufficient under CZ/SK marketing law).
 *
 * Defense layers (unchanged from the previous single-opt-in version):
 *   1. Origin header validation.
 *   2. Zod schema validation (shared with client).
 *   3. Honeypot (silent 200 — no email sent to what's presumably a bot).
 *   4. isValidEmail server-side strict check (no newlines/null bytes — security-model.md §4.4).
 *   5. Cloudflare Turnstile.
 *   6. Per-IP rate limit 3/3600s.
 *
 * The confirmation token is a signed, stateless bundle of everything the
 * confirm step needs (email, locale, best-effort UTM/source), HMAC'd with
 * `NEWSLETTER_CONFIRM_SECRET` — see `src/lib/newsletter-confirm-token.ts`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

const SUCCESS_MSG_CS = 'Zkontrolujte e-mail a potvrďte přihlášení — poslali jsme vám potvrzovací odkaz.';
const SUCCESS_MSG_EN = 'Check your inbox and confirm your subscription — we sent you a confirmation link.';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'origin' }, { status: 403, headers: NO_STORE });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = newsletterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', issues: parsed.error.flatten().fieldErrors },
      { status: 400, headers: NO_STORE },
    );
  }
  const data = parsed.data;
  const successMsg = data.locale === 'cs' ? SUCCESS_MSG_CS : SUCCESS_MSG_EN;

  // Honeypot — silent success, no email actually sent (nothing for a bot to click anyway).
  if (data.honeypot && data.honeypot.length > 0) {
    return NextResponse.json({ ok: true, message: successMsg }, { status: 200, headers: NO_STORE });
  }

  // Strict email check (defense-in-depth).
  if (!isValidEmail(data.email)) {
    return NextResponse.json({ error: 'validation' }, { status: 400, headers: NO_STORE });
  }

  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  const ts = await verifyTurnstileToken(data.turnstile_token, ip);
  if (!ts.success) {
    return NextResponse.json({ error: 'turnstile', codes: ts.errorCodes }, { status: 400, headers: NO_STORE });
  }

  const rl = await checkLimit('newsletter', ipHash);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate-limit', retryAt: rl.reset },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': '3600' } },
    );
  }

  const confirmSecret = process.env.NEWSLETTER_CONFIRM_SECRET;
  if (!confirmSecret) {
    console.error('[newsletter] NEWSLETTER_CONFIRM_SECRET missing — cannot issue a confirmation token');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500, headers: NO_STORE });
  }

  const token = signNewsletterConfirmToken(
    {
      email: data.email.toLowerCase(),
      locale: data.locale,
      ts: Date.now(),
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      source_url: req.headers.get('referer') ?? undefined,
    },
    confirmSecret,
  );
  const confirmUrl = `${site.url}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

  // Sending this email IS the entire action of this route now that there's no
  // DB write here — unlike the contact form's confirmation email (best-effort,
  // since the inquiry itself is already durably stored before that email is
  // attempted), a failed send here means the visitor has no way to complete
  // signup at all. Fail CLOSED rather than silently claiming success.
  const resendKey = process.env.RESEND_API_KEY_NEWSLETTER;
  if (!resendKey) {
    console.warn('[newsletter] RESEND_API_KEY_NEWSLETTER missing — cannot send confirmation email');
    return NextResponse.json({ error: 'email-unavailable' }, { status: 500, headers: NO_STORE });
  }
  try {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'hello@victaagency.com',
      to: [data.email],
      subject:
        data.locale === 'cs'
          ? 'Potvrďte přihlášení k newsletteru VICTA'
          : 'Confirm your VICTA newsletter signup',
      html: newsletterConfirmRequestEmailHtml({ locale: data.locale, confirmUrl }),
    });
  } catch (err) {
    console.error('[newsletter] confirmation email send error:', (err as Error).message);
    Sentry.captureException(err);
    return NextResponse.json({ error: 'email-send-failed' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true, message: successMsg }, { status: 200, headers: NO_STORE });
}
