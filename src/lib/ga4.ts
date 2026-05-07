'use client';

import { hasAnalyticsConsent } from './consent';

/**
 * Fire a GA4 event — silently no-op if analytics consent is not granted (claude-rules §9
 * + REQ-C-003 + AR-09). Designed to be safe to call from any client component without
 * checking consent first; the consent check lives here.
 *
 * The 11 events used by VICTA are documented in `docs/ga4-event-taxonomy.md`.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
