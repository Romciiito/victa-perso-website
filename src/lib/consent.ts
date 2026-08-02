'use client';

declare global {
  interface Window {
    Cookiebot?: {
      // `consent` je undefined v okně mezi vytvořením window.Cookiebot stubu
      // a doběhnutím consent inicializace — typ musí odrážet runtime realitu.
      consent?: { necessary: boolean; preferences: boolean; statistics: boolean; marketing: boolean };
      hasResponse: boolean;
      regulations: { gdprApplies: boolean };
    };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentCategory = 'necessary' | 'preferences' | 'statistics' | 'marketing';

/**
 * True if the user has granted analytics consent via Cookiebot. Drives GA4 firing
 * and any other analytics that are gated on `statistics` category (REQ-C-003).
 *
 * Returns `false` server-side and on first paint before Cookiebot loads. The Ga4Loader
 * subscribes to consent change events and re-renders when granted.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  // Optional chain i na `.consent` — Cookiebot objekt existuje dřív, než má
  // consent data (runtime TypeError zachycený v dev, 2026-07-28).
  return window.Cookiebot?.consent?.statistics === true;
}

/**
 * Subscribe to Cookiebot consent change events. Returns an unsubscribe function.
 * Cookiebot emits three relevant events: `CookiebotOnConsentReady`, `CookiebotOnAccept`,
 * `CookiebotOnDecline`. We listen to all three to catch every state transition.
 */
export function onConsentChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const fn = () => handler();
  window.addEventListener('CookiebotOnConsentReady', fn);
  window.addEventListener('CookiebotOnAccept', fn);
  window.addEventListener('CookiebotOnDecline', fn);
  return () => {
    window.removeEventListener('CookiebotOnConsentReady', fn);
    window.removeEventListener('CookiebotOnAccept', fn);
    window.removeEventListener('CookiebotOnDecline', fn);
  };
}
