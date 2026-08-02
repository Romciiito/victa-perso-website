import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { checkLimit, hashIp } from '@/lib/rate-limit';
import { consentTextFor } from '@/lib/newsletter-schema';
import {
  verifyNewsletterConfirmToken,
  isNewsletterConfirmTokenFresh,
} from '@/lib/newsletter-confirm-token';
import { newsletterWelcomeEmailHtml } from '@/lib/email-html';
import { site } from '@/config/site';

/**
 * Newsletter double opt-in confirmation (P1-07, D-014, closes RB-17).
 *
 * A visitor lands here by clicking the link `POST /api/newsletter` emailed
 * them. This route is the ONLY place `newsletter_subscribers` gets written —
 * clicking the link is the proof of inbox ownership that makes this a real
 * double opt-in, not just a checkbox tick (security-model.md §4.4, GDPR
 * consent-proof requirement).
 *
 * Order matters and mirrors the pre-P1-07 single-opt-in route's authoritative
 * gate (D-011 amendment, 2026-07-21): the consent-proof row is written FIRST;
 * Resend audience enrollment and the welcome email are best-effort and only
 * attempted AFTER that row exists. If we can't persist consent, we must not
 * enroll the address in any marketing list.
 *
 * No Origin check here (unlike the POST route) — this is a link clicked from
 * an email client, which has no Origin header context to validate against;
 * the HMAC-signed, 48h-expiring token is the actual security boundary.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? '0.0.0.0';
}

type ConfirmState = 'confirmed' | 'invalid' | 'expired' | 'error';

/**
 * The frontend doesn't render anything different per state yet (out of scope
 * for this route — see decisions.md D-014); the query param just needs to
 * exist and land on a real page. `/kontakt` is chosen because it's the page
 * that already hosts the newsletter signup form other CTAs point at.
 */
function redirectTo(locale: 'cs' | 'en', state: ConfirmState): NextResponse {
  const url = `${site.url}/${locale}/kontakt?newsletter=${state}`;
  return NextResponse.redirect(url, { status: 302, headers: NO_STORE });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.NEWSLETTER_CONFIRM_SECRET;
  if (!secret) {
    console.error('[newsletter-confirm] NEWSLETTER_CONFIRM_SECRET missing');
    return redirectTo('cs', 'error');
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return redirectTo('cs', 'invalid');
  }

  const payload = verifyNewsletterConfirmToken(token, secret);
  if (!payload) {
    return redirectTo('cs', 'invalid');
  }
  if (!isNewsletterConfirmTokenFresh(payload)) {
    return redirectTo(payload.locale, 'expired');
  }

  const email = payload.email.toLowerCase();
  const ipHash = hashIp(clientIp(req));

  // Rate limit před zápisem (gate výhrada 3, Vlna 3A): platný token lze
  // opakovaně „klikat" — první úspěch končí na 23505 dedupu, ale i tak je to
  // jediná neautentizovaná zapisovací cesta bez limiteru. Fail-open (Redis
  // výpadek nesmí blokovat legitimní potvrzení souhlasu).
  const rl = await checkLimit('newsletter_confirm', ipHash);
  if (!rl.ok) {
    return redirectTo(payload.locale, 'error');
  }

  const lead = await upsertLead({
    email,
    source: 'newsletter',
    source_url: payload.source_url ?? null,
    locale: payload.locale,
    utm: {
      source: payload.utm_source ?? null,
      medium: payload.utm_medium ?? null,
      campaign: payload.utm_campaign ?? null,
    },
  });

  // GDPR proof-of-consent record — consented_at is THIS moment (the click),
  // not the original POST time, since the click is what proves consent.
  const { error: dbErr } = await supabaseAdmin.from('newsletter_subscribers').insert({
    lead_id: lead?.id ?? null,
    email,
    resend_audience_id: null,
    source_url: payload.source_url ?? null,
    utm_source: payload.utm_source ?? null,
    utm_medium: payload.utm_medium ?? null,
    utm_campaign: payload.utm_campaign ?? null,
    locale: payload.locale,
    ip_hash: ipHash,
    consented_at: new Date().toISOString(),
    consent_text: consentTextFor(payload.locale),
  });

  if (dbErr) {
    // Unique-constraint violation on email → the visitor already confirmed
    // before (double-click, or re-followed an old email) — REQ-F-053: treat
    // as a silent success, no re-enrollment, no duplicate welcome email.
    const code = (dbErr as { code?: string }).code;
    if (code === '23505') {
      return redirectTo(payload.locale, 'confirmed');
    }
    console.error('[newsletter-confirm] supabase insert error:', dbErr.message);
    return redirectTo(payload.locale, 'error');
  }

  // Add to Resend audience — best-effort, only AFTER the consent record exists.
  const resendKey = process.env.RESEND_API_KEY_NEWSLETTER;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  let resendAudienceId: string | null = null;
  if (resendKey && audienceId) {
    try {
      const resend = new Resend(resendKey);
      const r = await resend.contacts.create({ email, unsubscribed: false, audienceId });
      resendAudienceId = r.data?.id ?? audienceId;
      const { error: updErr } = await supabaseAdmin
        .from('newsletter_subscribers')
        .update({ resend_audience_id: resendAudienceId })
        .eq('email', email);
      if (updErr) {
        console.warn('[newsletter-confirm] audience-id backfill failed:', updErr.message);
      }
    } catch (err) {
      console.warn('[newsletter-confirm] resend audience add error:', (err as Error).message);
      Sentry.captureException(err);
    }
  } else {
    console.warn('[newsletter-confirm] RESEND_API_KEY_NEWSLETTER or RESEND_AUDIENCE_ID missing');
  }

  // Welcome email — best-effort (the consent record is already durable at this point).
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'hello@victaagency.com',
        to: [email],
        subject: payload.locale === 'cs' ? 'Vítáme vás ve VICTA' : 'Welcome to VICTA',
        html: newsletterWelcomeEmailHtml({ locale: payload.locale }),
      });
    } catch (err) {
      console.warn('[newsletter-confirm] welcome email send error:', (err as Error).message);
    }
  }

  return redirectTo(payload.locale, 'confirmed');
}
