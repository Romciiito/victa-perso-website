import Script from 'next/script';

/**
 * Cookiebot CMP loader (REQ-C-003, REQ-I-014, AR-09, AR-19).
 *
 * Renders the script tag with `data-blockingmode="auto"` — Cookiebot intercepts other
 * tracking scripts on the page (e.g. GA4) and blocks them until the matching consent
 * category is granted. This is the recommended Czech-DPA-compliant integration.
 *
 * Renders a `null` placeholder when CBID is not yet provisioned (preview deploys without
 * Roman's account setup) so the build does not break and console stays clean.
 */
export function CookiebotScript() {
  const cbid = process.env.NEXT_PUBLIC_COOKIEBOT_ID;
  if (!cbid || cbid.startsWith('your-')) return null;
  // App Router requires `afterInteractive` for non-_document scripts
  // (https://nextjs.org/docs/messages/no-before-interactive-script-outside-document).
  // Cookiebot's `data-blockingmode="auto"` still intercepts later-loaded tracking
  // scripts; defense-in-depth comes from our own consent-gated <Ga4Loader />, which
  // does not render any gtag tag until `Cookiebot.consent.statistics === true`.
  return (
    <Script
      id="Cookiebot"
      src="https://consent.cookiebot.com/uc.js"
      data-cbid={cbid}
      data-blockingmode="auto"
      type="text/javascript"
      strategy="afterInteractive"
    />
  );
}
