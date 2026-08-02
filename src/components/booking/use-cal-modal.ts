'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { trackEvent } from '@/lib/ga4';
import { CAL_EVENTS, calIsConfigured, type BookingType } from '@/config/booking';

/* ============================================================
   useCalModal — the site's single Cal.com booking trigger.
   Lazy-loads embed.js, tracks the GA4 funnel, and opens the
   Cal.com modal for the event type derived from `bookingType`
   (slugs live in src/config/booking.ts — D-010).

   Graceful fallback: if NEXT_PUBLIC_CALCOM_USERNAME is missing
   or still the placeholder (real Cal.com account not yet
   provisioned), the handler navigates to the contact form
   instead of opening a dead modal — `fallbackHref` lets the
   /kontakt page scroll to its own form rather than loop back
   to itself. Once Vercel env holds a real username, every CTA
   auto-promotes to the modal flow with no code change.
   ============================================================ */

declare global {
  interface Window {
    Cal?: {
      (cmd: string, ...args: unknown[]): void;
      ns?: Record<string, (cmd: string, ...args: unknown[]) => void>;
      q?: unknown[];
      loaded?: boolean;
    };
  }
}

const SCRIPT_ID = 'cal-embed-script';

function ensureCalLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.Cal && window.Cal.loaded) {
      resolve();
      return;
    }
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const id = window.setInterval(() => {
        if (window.Cal) {
          window.clearInterval(id);
          resolve();
        }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = 'https://app.cal.com/embed/embed.js';
    s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export type CalModalConfig = {
  /** Which Cal.com event type to book — resolves to a slug via CAL_EVENTS. */
  bookingType: BookingType;
  /** @deprecated Ignored — the slug derives from `bookingType` via CAL_EVENTS (D-010). */
  eventSlug?: string;
  /** Path the visitor was on when they triggered the open (GA4 attribution). */
  sourcePage: string;
  /**
   * Where to send the visitor when Cal.com is not provisioned.
   * Defaults to the contact page; pass an in-page anchor (e.g. "#form")
   * on pages that host the contact form themselves.
   */
  fallbackHref?: string;
};

export function useCalModal(config: CalModalConfig): () => Promise<void> {
  const username = process.env.NEXT_PUBLIC_CALCOM_USERNAME;
  const isConfigured = calIsConfigured(username);
  const firedRef = useRef(false);
  const router = useRouter();

  // Pre-warm embed.js after first paint so the first click is instant.
  // Skip when Cal.com is not configured — no point loading a script we
  // won't use.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isConfigured) return;
    type IdleCb = (cb: () => void) => unknown;
    const ric = (window as unknown as { requestIdleCallback?: IdleCb }).requestIdleCallback;
    if (ric) {
      ric(() => {
        void ensureCalLoaded();
      });
    } else {
      window.setTimeout(() => {
        void ensureCalLoaded();
      }, 1500);
    }
  }, [isConfigured]);

  const goToFallback = () => {
    const fallback = config.fallbackHref ?? '/kontakt#form';
    if (fallback.startsWith('#')) {
      document.getElementById(fallback.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    router.push(fallback);
  };

  return async () => {
    // Cal.com not provisioned — route to the contact form so users always
    // have a working path. Tracked as its own GA4 event (NOT booking_initiated,
    // which must only count real modal opens).
    if (!isConfigured) {
      if (!firedRef.current) {
        trackEvent('booking_fallback_contact', {
          booking_type: config.bookingType,
          source_page: config.sourcePage,
        });
        firedRef.current = true;
      }
      goToFallback();
      return;
    }

    if (!firedRef.current) {
      trackEvent('booking_initiated', {
        booking_type: config.bookingType,
        source_page: config.sourcePage,
      });
      firedRef.current = true;
    }

    await ensureCalLoaded();
    if (!window.Cal) {
      // embed.js blocked (ad-blocker / CSP) — degrade to the contact form.
      goToFallback();
      return;
    }

    const theme =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    window.Cal('init', { origin: 'https://app.cal.com' });
    window.Cal('modal', {
      calLink: `${username}/${CAL_EVENTS[config.bookingType]}`,
      config: { theme, layout: 'month_view' },
    });
  };
}
