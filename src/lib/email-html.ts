import 'server-only';
import { site } from '@/config/site';

/**
 * Shared HTML email visual shell + content builders for every transactional
 * email VICTA sends (contact confirmation — P1-06, newsletter double
 * opt-in request + welcome — P1-07/P2-08). Centralizing this:
 *
 *   1. Fixes P2-08 — the old newsletter welcome email (formerly inline in
 *      `/api/newsletter/route.ts`) hardcoded a light-mode palette
 *      (`#0A0B0E` text on `#FAFAFA`, `#3730A3` button) left over from before
 *      D-008 made the site dark-only. All email HTML now pulls from the same
 *      constants as `src/styles/globals.css` `:root`.
 *   2. Gives the new contact-confirmation and newsletter-confirm-request
 *      emails (P1-06, P1-07) the same look without duplicating markup.
 *
 * Inline styles only, table-free single-column layout — email clients don't
 * reliably support external/`<style>` CSS or modern layout, and none of
 * these emails need more than a heading, a paragraph, and one CTA button.
 */

/** Mirrors src/styles/globals.css `:root` (D-008 dark-only palette). Keep in sync manually — no build-time coupling to the CSS file exists yet. */
export const EMAIL_COLOR = {
  bg: '#0b0b0d',
  surface: '#131316',
  border: '#27272d',
  ink: '#f4f4f5',
  secondary: '#a1a1aa',
  tertiary: '#71717a',
  accent: '#5b8cff',
} as const;

/**
 * Escapes the five HTML-significant characters. Applied to any user-submitted
 * text (e.g. a contact-form message) before it's interpolated into an HTML
 * email body — defense-in-depth on top of `sanitizeFormString`'s tag
 * stripping, which targets `<...>` specifically and isn't a full HTML
 * sanitizer (a bare `&` or a stray quote isn't its job).
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailShell(opts: { title: string; locale: 'cs' | 'en'; bodyHtml: string }): string {
  const { title, locale, bodyHtml } = opts;
  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:24px; background-color:${EMAIL_COLOR.bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:${EMAIL_COLOR.ink};">
    <div style="max-width:560px; margin:0 auto; background-color:${EMAIL_COLOR.surface}; border:1px solid ${EMAIL_COLOR.border}; border-radius:14px; padding:32px;">
      ${bodyHtml}
    </div>
    <p style="max-width:560px; margin:20px auto 0; padding:0 8px; text-align:center; color:${EMAIL_COLOR.tertiary}; font-size:12px; line-height:1.5;">
      VICTA &middot; ${site.url.replace(/^https?:\/\//, '')}
    </p>
  </body>
</html>`;
}

function emailButton(opts: { href: string; label: string }): string {
  return `<p style="margin:28px 0 4px;">
      <a href="${escapeHtml(opts.href)}" style="display:inline-block; background-color:${EMAIL_COLOR.accent}; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:500; font-size:15px;">
        ${escapeHtml(opts.label)}
      </a>
    </p>`;
}

/** P1-06 — sent to the visitor after a successful /api/contact submission. */
export function contactConfirmationEmailHtml(opts: {
  locale: 'cs' | 'en';
  name: string;
  message: string;
}): string {
  const { locale, name, message } = opts;
  const heading =
    locale === 'cs'
      ? `Díky, ${escapeHtml(name)} — zprávu máme`
      : `Thanks, ${escapeHtml(name)} - we've got your message`;
  const intro =
    locale === 'cs'
      ? 'Ozveme se do 1 pracovního dne. Pro jistotu si tu necháváme kopii toho, co jste napsali:'
      : "We'll get back to you within 1 business day. For reference, here's a copy of what you sent:";
  const contactLine =
    locale === 'cs'
      ? `Je to naléhavé? Napište přímo na <a href="mailto:${site.contact.email}" style="color:${EMAIL_COLOR.accent};">${site.contact.email}</a> nebo zavolejte na ${site.contact.phone}.`
      : `If it's urgent, write directly to <a href="mailto:${site.contact.email}" style="color:${EMAIL_COLOR.accent};">${site.contact.email}</a> or call ${site.contact.phone}.`;
  const quoted = escapeHtml(message).replace(/\n/g, '<br/>');

  const bodyHtml = `
    <h1 style="margin:0 0 16px; font-size:20px; font-weight:600; letter-spacing:-0.01em; color:${EMAIL_COLOR.ink};">${heading}</h1>
    <p style="margin:0 0 20px; line-height:1.6; color:${EMAIL_COLOR.secondary};">${intro}</p>
    <blockquote style="margin:0 0 20px; padding:14px 16px; border-left:3px solid ${EMAIL_COLOR.accent}; background-color:${EMAIL_COLOR.bg}; border-radius:6px; color:${EMAIL_COLOR.ink}; font-size:14px; line-height:1.6;">
      ${quoted}
    </blockquote>
    <p style="margin:0; line-height:1.6; color:${EMAIL_COLOR.secondary}; font-size:14px;">${contactLine}</p>
  `;
  return emailShell({ title: locale === 'cs' ? 'Vaše zpráva dorazila' : 'We received your message', locale, bodyHtml });
}

/** P1-07 — the double opt-in request, sent immediately on POST /api/newsletter. */
export function newsletterConfirmRequestEmailHtml(opts: { locale: 'cs' | 'en'; confirmUrl: string }): string {
  const { locale, confirmUrl } = opts;
  const heading = locale === 'cs' ? 'Potvrďte přihlášení k newsletteru' : 'Confirm your newsletter signup';
  const body =
    locale === 'cs'
      ? 'Kliknutím na tlačítko níže potvrdíte, že chcete odebírat newsletter VICTA. Odkaz je platný 48 hodin.'
      : "Click the button below to confirm you'd like to receive the VICTA newsletter. This link is valid for 48 hours.";
  const ignoreNote =
    locale === 'cs'
      ? `Pokud jste se nehlásili sami, tento e-mail prostě ignorujte — nic se nestane, k odběru vás nic nepřihlásí.`
      : "If you didn't sign up yourself, just ignore this email — nothing will happen, you won't be subscribed.";
  const buttonLabel = locale === 'cs' ? 'Potvrdit přihlášení' : 'Confirm subscription';

  const bodyHtml = `
    <h1 style="margin:0 0 16px; font-size:20px; font-weight:600; letter-spacing:-0.01em; color:${EMAIL_COLOR.ink};">${heading}</h1>
    <p style="margin:0 0 8px; line-height:1.6; color:${EMAIL_COLOR.secondary};">${body}</p>
    ${emailButton({ href: confirmUrl, label: buttonLabel })}
    <p style="margin:20px 0 0; line-height:1.6; color:${EMAIL_COLOR.tertiary}; font-size:13px;">${ignoreNote}</p>
  `;
  return emailShell({ title: heading, locale, bodyHtml });
}

/** P1-07/P2-08 — sent once, right after GET /api/newsletter/confirm records consent. */
export function newsletterWelcomeEmailHtml(opts: { locale: 'cs' | 'en' }): string {
  const { locale } = opts;
  const heading = locale === 'cs' ? 'Vítáme vás ve VICTA' : 'Welcome to VICTA';
  const body =
    locale === 'cs'
      ? `Děkujeme za přihlášení k newsletteru. Občas vám pošleme pohled na to, jak v Česku stavíme partnerství v digitálu — žádný spam.`
      : 'Thanks for subscribing. Occasionally we share how we build digital partnerships in Czechia — no spam.';
  const cta =
    locale === 'cs'
      ? 'Chcete promluvit dříve? Domluvte si zdarma 30minutovou konzultaci.'
      : 'Want to talk sooner? Book a free 30-minute call.';
  const ctaUrl = `${site.url}/${locale}/spoluprace`;
  const buttonLabel = locale === 'cs' ? 'Chci konzultaci' : 'Book a call';
  const unsubscribeNote =
    locale === 'cs'
      ? `Pokud už newsletter nechcete, odpovězte na tento e-mail nebo napište na ${site.contact.email} a okamžitě vás odhlásíme.`
      : `If you no longer want this newsletter, reply to this email or write to ${site.contact.email} and we'll unsubscribe you immediately.`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px; font-size:20px; font-weight:600; letter-spacing:-0.01em; color:${EMAIL_COLOR.ink};">${heading}</h1>
    <p style="margin:0 0 12px; line-height:1.6; color:${EMAIL_COLOR.secondary};">${body}</p>
    <p style="margin:0; line-height:1.6; color:${EMAIL_COLOR.secondary};">${cta}</p>
    ${emailButton({ href: ctaUrl, label: buttonLabel })}
    <hr style="border:0; border-top:1px solid ${EMAIL_COLOR.border}; margin:28px 0 16px;" />
    <p style="margin:0; color:${EMAIL_COLOR.tertiary}; font-size:12px; line-height:1.5;">${unsubscribeNote}</p>
  `;
  return emailShell({ title: heading, locale, bodyHtml });
}
