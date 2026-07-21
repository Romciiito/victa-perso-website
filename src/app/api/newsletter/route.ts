import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { newsletterSchema, consentTextFor } from '@/lib/newsletter-schema';
import { isValidEmail } from '@/lib/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkLimit, hashIp } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { site } from '@/config/site';

/**
 * Newsletter signup handler (REQ-F-049..REQ-F-056, architecture.md §3.4).
 *
 * Defense layers:
 *   1. Origin header validation.
 *   2. Zod schema validation (shared with client).
 *   3. Honeypot (silent 200).
 *   4. isValidEmail server-side strict check (no newlines/null bytes — security-model.md §4.4).
 *   5. Cloudflare Turnstile.
 *   6. Per-IP rate limit 3/3600s.
 *   7. Add to Resend audience (RESEND_AUDIENCE_ID + RESEND_API_KEY_NEWSLETTER).
 *   8. Insert newsletter_subscribers row with consent text/timestamp/IP-hash (GDPR proof).
 *   9. Welcome email (single message, Czech, simple HTML).
 *
 * Duplicate handling: the unique index on (email) returns a conflict error from Supabase;
 * we catch that and return 200 with the same success message — no leak of "already subscribed"
 * (REQ-F-053).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function originOk(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const target = new URL(site.url).hostname;
    return u.hostname === target || u.hostname.endsWith('.vercel.app') || u.hostname === 'localhost';
  } catch {
    return false;
  }
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? '0.0.0.0';
}

const SUCCESS_MSG_CS = 'Zkontrolujte e-mail — během chvíle dorazí uvítací zpráva.';
const SUCCESS_MSG_EN = 'Check your inbox — a welcome email is on the way.';

function welcomeEmailHtml(locale: 'cs' | 'en'): string {
  const greet = locale === 'cs' ? 'Vítáme vás ve VICTA' : 'Welcome to VICTA';
  const body =
    locale === 'cs'
      ? 'Děkujeme za přihlášení k newsletteru. Občas vám pošleme nahled na to, jak v Česku stavíme partnerství v digitálu — žádný spam.'
      : 'Thanks for subscribing. Occasionally we share how we build digital partnerships in Czechia — no spam.';
  const cta =
    locale === 'cs'
      ? 'Chcete promluvit dříve? Domluvte si zdarma 30minutovou konzultaci.'
      : 'Want to talk sooner? Book a free 30-minute call.';
  const ctaUrl = `${site.url}/${locale}/spoluprace`;
  return `<!doctype html>
<html lang="${locale}">
  <body style="font-family:Inter Tight, -apple-system, system-ui, sans-serif; color:#0A0B0E; background:#FAFAFA; padding:24px;">
    <div style="max-width:560px; margin:0 auto;">
      <h1 style="font-weight:500; letter-spacing:-0.02em;">${greet}</h1>
      <p style="line-height:1.55;">${body}</p>
      <p style="line-height:1.55;">${cta}</p>
      <p style="margin-top:32px;">
        <a href="${ctaUrl}" style="display:inline-block; background:#3730A3; color:#fff; padding:12px 18px; border-radius:6px; text-decoration:none;">
          ${locale === 'cs' ? 'Domluvit konzultaci' : 'Book a call'}
        </a>
      </p>
      <hr style="border:0; border-top:1px solid #D4D4D8; margin:32px 0;" />
      <p style="color:#71717A; font-size:13px; line-height:1.5;">
        VICTA · ${site.url}<br/>
        ${locale === 'cs'
          ? 'Pokud již newsletter nechcete, odpovězte na tento e-mail nebo nám napište na hello@victaagency.com a okamžitě vás odhlásíme.'
          : 'If you no longer want this newsletter, reply to this email or write to hello@victaagency.com and we will unsubscribe you immediately.'}
      </p>
    </div>
  </body>
</html>`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!originOk(req)) {
    return NextResponse.json({ error: 'origin' }, { status: 403 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = newsletterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot — silent success.
  if (data.honeypot && data.honeypot.length > 0) {
    return NextResponse.json({ ok: true, message: SUCCESS_MSG_CS }, { status: 200 });
  }

  // Strict email check (defense-in-depth).
  if (!isValidEmail(data.email)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  const ts = await verifyTurnstileToken(data.turnstile_token, ip);
  if (!ts.success) {
    return NextResponse.json({ error: 'turnstile', codes: ts.errorCodes }, { status: 400 });
  }

  const rl = await checkLimit('newsletter', ipHash);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate-limit', retryAt: rl.reset },
      { status: 429, headers: { 'Retry-After': '3600' } },
    );
  }

  const successMsg = data.locale === 'cs' ? SUCCESS_MSG_CS : SUCCESS_MSG_EN;

  // Cross-source CRM root row.
  const lead = await upsertLead({
    email: data.email,
    source: 'newsletter',
    source_url: req.headers.get('referer'),
    locale: data.locale,
    utm: {
      source: data.utm_source ?? null,
      medium: data.utm_medium ?? null,
      campaign: data.utm_campaign ?? null,
    },
  });

  // GDPR proof-of-consent record FIRST (REQ-F-055) — this write is the
  // AUTHORITATIVE gate for the newsletter (review 2026-07-21, amends D-011):
  // if we cannot persist consented_at/consent_text/ip_hash, we must not
  // enroll the address in the Resend audience or send any marketing email.
  // (The contact form keeps the lenient partial-failure policy — its email
  // is an inquiry, not a marketing subscription needing consent proof.)
  const consentText = consentTextFor(data.locale);
  const { error: dbErr } = await supabaseAdmin.from('newsletter_subscribers').insert({
    lead_id: lead?.id ?? null,
    email: data.email.toLowerCase(),
    resend_audience_id: null,
    source_url: req.headers.get('referer'),
    utm_source: data.utm_source ?? null,
    utm_medium: data.utm_medium ?? null,
    utm_campaign: data.utm_campaign ?? null,
    locale: data.locale,
    ip_hash: ipHash,
    consented_at: new Date().toISOString(),
    consent_text: consentText,
  });
  if (dbErr) {
    // Unique-constraint violation on email → silent dedupe (REQ-F-053 — don't leak that the
    // email already exists). No re-enrollment, no duplicate welcome email.
    const code = (dbErr as { code?: string }).code;
    if (code === '23505') {
      return NextResponse.json({ ok: true, message: successMsg }, { status: 200 });
    }
    // eslint-disable-next-line no-console
    console.error('[newsletter] supabase insert error:', dbErr.message);
    return NextResponse.json({ error: 'storage' }, { status: 500 });
  }

  // Add to Resend audience — best-effort, only AFTER the consent record exists.
  let resendAudienceId: string | null = null;
  const resendKey = process.env.RESEND_API_KEY_NEWSLETTER;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (resendKey && audienceId) {
    try {
      const resend = new Resend(resendKey);
      const r = await resend.contacts.create({
        email: data.email.toLowerCase(),
        unsubscribed: false,
        audienceId,
      });
      resendAudienceId = r.data?.id ?? audienceId;
      // Backfill the audience id onto the consent row — best-effort.
      const { error: updErr } = await supabaseAdmin
        .from('newsletter_subscribers')
        .update({ resend_audience_id: resendAudienceId })
        .eq('email', data.email.toLowerCase());
      if (updErr) {
        // eslint-disable-next-line no-console
        console.warn('[newsletter] audience-id backfill failed:', updErr.message);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[newsletter] resend audience add error:', (err as Error).message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('[newsletter] RESEND_API_KEY_NEWSLETTER or RESEND_AUDIENCE_ID missing');
  }

  // Welcome email — best-effort.
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'hello@victaagency.com',
        to: [data.email],
        subject:
          data.locale === 'cs' ? 'Vítáme vás ve VICTA' : 'Welcome to VICTA',
        html: welcomeEmailHtml(data.locale),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[newsletter] welcome email send error:', (err as Error).message);
    }
  }

  return NextResponse.json(
    { ok: true, message: successMsg },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
