import 'server-only';
import { NextResponse, after, type NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import { contactSchema } from '@/lib/contact-schema';
import { sanitizeFormString } from '@/lib/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkLimit, hashIp } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { contactConfirmationEmailHtml } from '@/lib/email-html';
import { isAllowedOrigin, clientIp } from '@/lib/origin';
import { bodyTooLarge } from '@/lib/body-size-guard';
import { notifyNewLead } from '@/lib/lead-notify';
import { site } from '@/config/site';
import { checkBotId } from 'botid/server';

/**
 * Contact form handler (REQ-F-041..REQ-F-048, architecture.md §3.5).
 *
 * Defense layers (in order — Vlna 7 code-review finding I1: cheapest checks
 * first, the two outbound-network checks — BotID, Turnstile — run only
 * after every free-to-reject path has had its chance):
 *   1. Origin header validation (security-model.md §2.2 + §4.3, CSRF defense).
 *   2. Content-Length body-size guard (Vlna 7, `body-size-guard.ts`) — 413
 *      before Zod ever sees an oversized payload.
 *   3. Zod schema validation (REQ-F-046 — same schema on client + server).
 *   4. Honeypot field (silent 200 if non-empty — bots fall in, humans don't).
 *   5. Per-IP rate limit 5/600s (security-model.md §4.3, fail-open per REQ-I-020).
 *   6. Vercel BotID Basic check (Vlna 7, docs/security/abuse-surface.md) —
 *      invisible client-side challenge, additive to Turnstile below, not a
 *      replacement. DORMANT by default (`NEXT_PUBLIC_BOTID_ENABLED` unset)
 *      until a real-browser smoke test against a live preview confirms it —
 *      code-review finding C1: this is the one Vlna 7 change that sits
 *      directly on the conversion path, so it gets the same "ship inert,
 *      flip a flag after verification" treatment D-019 gives the chatbot,
 *      not silent enforcement. Once enabled, still fails OPEN on a thrown
 *      error (same posture as Turnstile's not-provisioned skip below) — only
 *      a clean `isBot: true` classification ever blocks.
 *   7. Cloudflare Turnstile token verify (security-model.md §4.3, REQ-I-021).
 *   8. HTML strip + control-char strip on every string (security-model.md §4.3).
 *   9. Resend email delivery to CONTACT_DESTINATION_EMAIL (internal notification).
 *   10. Resend confirmation email to the visitor (P1-06) — best-effort, does NOT
 *      affect the partial-failure policy or status codes below; failure is logged only.
 *   11. Insert contact_submissions + upsert leads in Supabase (AR-21).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Realistic max payload is ~5KB (name/email/phone/message ≤2000 chars + a few short fields); 20KB leaves generous headroom without allowing megabyte-scale abuse (Vlna 7). */
const MAX_BODY_BYTES = 20_000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'origin' }, { status: 403 });
  }

  const tooLarge = bodyTooLarge(req, MAX_BODY_BYTES);
  if (tooLarge) return tooLarge;

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

  // Rate limit (fail-open if Redis is down — REQ-I-020). Checked BEFORE the
  // two outbound-network checks below (BotID, Turnstile) — a garbage
  // request from an already-limited IP shouldn't pay for either external
  // HTTPS round trip (Vlna 7 code-review finding I1).
  const rl = await checkLimit('contact', ipHash);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate-limit', retryAt: rl.reset },
      { status: 429, headers: { 'Retry-After': '600' } },
    );
  }

  // BotID Basic (free on all plans) — additive to Turnstile, not a
  // replacement. DORMANT unless NEXT_PUBLIC_BOTID_ENABLED === '1' (code
  // review finding C1 — see this file's doc comment, step 6). Fail-open on a
  // thrown error/exception (e.g. BotID misconfigured or its platform check
  // unavailable) so this NEVER blocks a legitimate submission on its own;
  // only a clean `isBot: true` classification does.
  if (process.env.NEXT_PUBLIC_BOTID_ENABLED === '1') {
    try {
      const botVerification = await checkBotId();
      if (botVerification.isBot) {
        return NextResponse.json({ error: 'bot' }, { status: 403 });
      }
    } catch (err) {
      console.warn('[contact] BotID check failed — proceeding (fail-open):', (err as Error).message);
    }
  }

  // Turnstile (fail-closed)
  const ts = await verifyTurnstileToken(data.turnstile_token, ip);
  if (!ts.success) {
    return NextResponse.json({ error: 'turnstile', codes: ts.errorCodes }, { status: 400 });
  }

  // Sanitize text fields (defense-in-depth — Zod already enforces shape, this strips HTML)
  const name = sanitizeFormString(data.name, 100);
  const company = data.company ? sanitizeFormString(data.company, 120) : null;
  const phone = data.phone ? sanitizeFormString(data.phone, 40) : null;
  const message = sanitizeFormString(data.message, 2000);
  // Vlna 6 anti-fake-lead signal — only ever set by CompanyAutocomplete's
  // verified-pick path (never user-typed directly), but sanitized anyway
  // per this route's "every string field is sanitized" policy.
  const companyIco = data.company_ico ? sanitizeFormString(data.company_ico, 20) : null;
  const companyCountry = data.company_country ?? null;

  // Cross-source CRM root row
  const lead = await upsertLead({
    email: data.email,
    name,
    company,
    phone,
    company_ico: companyIco,
    company_country: companyCountry,
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
          `Společnost: ${company ?? '-'}${companyIco ? ` (IČO ${companyIco}, ověřeno ${companyCountry ?? '?'})` : ' (neověřeno)'}`,
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
      console.error('[contact] resend error:', (err as Error).message);
    }

    // Visitor confirmation email (P1-06) — a second, independent Resend send.
    // Best-effort by design: it must never change the partial-failure policy
    // below (that policy is about whether the SUBMISSION was captured, and
    // this email is a courtesy on top of an already-captured submission) or
    // the response status code. A failure here is logged and otherwise ignored.
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'hello@victaagency.com',
        to: [data.email],
        subject:
          data.locale === 'cs' ? 'Vaše zpráva dorazila' : 'We received your message',
        html: contactConfirmationEmailHtml({ locale: data.locale, name, message }),
      });
    } catch (err) {
      console.warn('[contact] visitor confirmation email error:', (err as Error).message);
    }
  } else {
    console.warn('[contact] RESEND_API_KEY_CONTACT missing — submission stored, email not sent');
  }

  const { error: dbErr } = await supabaseAdmin.from('contact_submissions').insert({
    lead_id: lead?.id ?? null,
    email: data.email.toLowerCase(),
    name,
    company,
    phone,
    // Klíče se vynechávají, když jsou prázdné — stejný vzor jako `upsertLead`
    // (gate Vlny 6): PostgREST validuje KAŽDÝ klíč proti schema cache, takže
    // dokud není aplikovaná migrace 004, poslání `company_ico: null` shodí
    // insert s PGRST204 a partial-failure policy by lead tiše zahodila do
    // e-mailu bez DB řádku. Takto projdou neověřená odeslání i před migrací.
    ...(companyIco ? { company_ico: companyIco } : {}),
    ...(companyCountry ? { company_country: companyCountry } : {}),
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
    console.error('[contact] supabase insert error:', dbErr.message);
    // Partial-failure policy (D-011): the submission is "delivered" if at least one
    // sink (email OR database) persisted it. Only hard-fail when BOTH failed —
    // otherwise a Supabase outage would discard a lead whose email already reached
    // the inbox, and the visitor would needlessly retry or give up.
    if (!resendId) {
      return NextResponse.json({ error: 'storage' }, { status: 500 });
    }
    Sentry.captureMessage('contact: partial failure — email sent, DB insert failed', {
      level: 'warning',
      extra: { resend_email_id: resendId, db_error: dbErr.message },
    });
  }

  // Rychlá notifikace do Discordu/Telegramu (docs/setup/lead-notifications.md).
  // Běží v `after()`, tedy AŽ PO odeslání odpovědi — pomalý kanál nesmí zdržet
  // návštěvníka. Záměrně až tady, za oběma sinky: notifikace se posílá i při
  // částečném selhání (mail prošel, DB ne), protože lead sám o sobě platí.
  // `notifyNewLead` nikdy nevyhodí výjimku (viz jeho doc komentář).
  after(() =>
    notifyNewLead({
      kind: 'contact',
      email: data.email,
      name,
      phone,
      company,
      companyIco,
      companyCountry,
      budgetTier: data.budget_tier ?? null,
      serviceInterest: data.service_interest ?? null,
      locale: data.locale,
      message,
      sourceUrl: req.headers.get('referer'),
    }),
  );

  return NextResponse.json(
    { ok: true, message: 'Zpráva odeslána' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
