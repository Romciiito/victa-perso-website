import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/lib/contact-schema';
import { sanitizeFormString } from '@/lib/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkLimit, hashIp } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { site } from '@/config/site';

/**
 * Contact form handler (REQ-F-041..REQ-F-048, architecture.md §3.5).
 *
 * Defense layers (in order):
 *   1. Origin header validation (security-model.md §2.2 + §4.3, CSRF defense).
 *   2. Zod schema validation (REQ-F-046 — same schema on client + server).
 *   3. Honeypot field (silent 200 if non-empty — bots fall in, humans don't).
 *   4. Cloudflare Turnstile token verify (security-model.md §4.3, REQ-I-021).
 *   5. Per-IP rate limit 5/600s (security-model.md §4.3, fail-open per REQ-I-020).
 *   6. HTML strip + control-char strip on every string (security-model.md §4.3).
 *   7. Resend email delivery to CONTACT_DESTINATION_EMAIL.
 *   8. Insert contact_submissions + upsert leads in Supabase (AR-21).
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!originOk(req)) {
    return NextResponse.json({ error: 'origin' }, { status: 403 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot — silent success, no Supabase / Resend / rate-limit hit.
  if (data.honeypot && data.honeypot.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  // Turnstile (fail-closed)
  const ts = await verifyTurnstileToken(data.turnstile_token, ip);
  if (!ts.success) {
    return NextResponse.json({ error: 'turnstile', codes: ts.errorCodes }, { status: 400 });
  }

  // Rate limit (fail-open if Redis is down — REQ-I-020)
  const rl = await checkLimit('contact', ipHash);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate-limit', retryAt: rl.reset },
      { status: 429, headers: { 'Retry-After': '600' } },
    );
  }

  // Sanitize text fields (defense-in-depth — Zod already enforces shape, this strips HTML)
  const name = sanitizeFormString(data.name, 100);
  const company = data.company ? sanitizeFormString(data.company, 120) : null;
  const phone = data.phone ? sanitizeFormString(data.phone, 40) : null;
  const message = sanitizeFormString(data.message, 2000);

  // Cross-source CRM root row
  const lead = await upsertLead({
    email: data.email,
    name,
    company,
    phone,
    source: 'contact_form',
    source_url: req.headers.get('referer'),
    locale: data.locale,
    budget_tier: data.budget_tier ?? null,
  });

  // Resend delivery — best-effort; we still record the submission even if email fails.
  let resendId: string | null = null;
  const resendKey = process.env.RESEND_API_KEY_CONTACT;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const r = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'hello@victaagency.com',
        to: [process.env.CONTACT_DESTINATION_EMAIL ?? site.contact.email],
        replyTo: data.email,
        subject: `[VICTA] Nová poptávka od ${name}`,
        text: [
          `Jméno: ${name}`,
          `E-mail: ${data.email}`,
          `Společnost: ${company ?? '-'}`,
          `Telefon: ${phone ?? '-'}`,
          `Rozpočet: ${data.budget_tier ?? '-'}`,
          `Služba: ${data.service_interest ?? '-'}`,
          `Locale: ${data.locale}`,
          '',
          'Zpráva:',
          message,
        ].join('\n'),
      });
      resendId = r.data?.id ?? null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[contact] resend error:', (err as Error).message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('[contact] RESEND_API_KEY_CONTACT missing — submission stored, email not sent');
  }

  const { error: dbErr } = await supabaseAdmin.from('contact_submissions').insert({
    lead_id: lead?.id ?? null,
    email: data.email.toLowerCase(),
    name,
    company,
    phone,
    service_interest: data.service_interest ?? null,
    budget_tier: data.budget_tier ?? null,
    message,
    locale: data.locale,
    ip_hash: ipHash,
    user_agent: req.headers.get('user-agent')?.slice(0, 256) ?? null,
    honeypot_passed: true,
    resend_email_id: resendId,
  });
  if (dbErr) {
    // eslint-disable-next-line no-console
    console.error('[contact] supabase insert error:', dbErr.message);
    return NextResponse.json({ error: 'storage' }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, message: 'Zpráva odeslána' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
