'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { trackEvent } from '@/lib/ga4';
import type { BookingType } from './cal-booking-widget';

/* ============================================================
   useCalModal — extracted Cal.com modal-open logic.
   Same lazy-loading, theme-detection, GA4-tracking behaviour as
   BookingCta, but exposed as a hook so any styled trigger (e.g.
   the taste-skill MagneticCta) can drive Cal.com without
   re-implementing the embed glue.

   Graceful fallback (2026-05-26): if NEXT_PUBLIC_CALCOM_USERNAME
   is missing or still the placeholder 'victa' (the original
   scaffold default — the real Cal.com account is not yet
   provisioned), the returned handler navigates to /kontakt
   instead of opening a dead modal. Once Vercel env is updated
   to a real Cal.com username, every CTA on the site auto-promotes
   to the modal flow with no code change.
   ============================================================ */

const SCRIPT_ID = 'cal-embed-script';
const PLACEHOLDER_USERNAME = 'victa';

function calIsConfigured(username: string | undefined): username is string {
  return Boolean(username) && username !== PLACEHOLDER_USERNAME;
}

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
  /** Cal.com event-type slug, e.g. "free-scoping-call", "tier-1-audit" */
  eventSlug: string;
  /** GA4 funnel attribution */
  bookingType: BookingType;
  /** Path the visitor was on when they triggered the open */
  sourcePage: string;
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

  return async () => {
    if (!firedRef.current) {
      trackEvent('booking_initiated', {
        booking_type: config.bookingType,
        source_page: config.sourcePage,
      });
      firedRef.current = true;
    }

    // Cal.com not provisioned — fall back to contact form so users always
    // have a working path. Roman's 2026-05-11 instruction was "Cal nebo
    // contact form" — this honours the fallback half until the real
    // account exists.
    if (!isConfigured) {
      router.push('/kontakt');
      return;
    }

    await ensureCalLoaded();
    if (!window.Cal) {
      router.push('/kontakt');
      return;
    }

    const theme =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    window.Cal('init', { origin: 'https://app.cal.com' });
    window.Cal('modal', {
      calLink: `${username}/${config.eventSlug}`,
      config: { theme, layout: 'month_view' },
    });
  };
}
