'use client';

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/ga4';
import type { BookingType } from './cal-booking-widget';
// `window.Cal` is declared globally in cal-booking-widget.tsx — no re-declaration here.

interface Props {
  eventSlug: string;
  bookingType: BookingType;
  sourcePage: string;
  /** Render content inside the button (label + optional icon) */
  children: React.ReactNode;
  /** Variant maps to existing Button styles (primary | ghost). Defaults to primary. */
  variant?: 'primary' | 'ghost';
  className?: string;
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

/**
 * "Open Cal.com modal" button — used on /cs/spoluprace tier cards and on the homepage
 * scoping-call CTA. Lazy-loads embed.js on first interaction so the script does not
 * appear on the homepage initial bundle (REQ-NF-006).
 *
 * GA4 event: `booking_initiated { booking_type, source_page }` fires once on click.
 */
export function BookingCta({
  eventSlug,
  bookingType,
  sourcePage,
  children,
  variant = 'primary',
  className,
}: Props) {
  const username = process.env.NEXT_PUBLIC_CALCOM_USERNAME ?? 'victa';
  const [opening, setOpening] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    // Pre-warm the script after first paint so click-to-open is instant. Uses
    // requestIdleCallback when available, fallback to setTimeout.
    if (typeof window === 'undefined') return;
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
  }, []);

  const onClick = async () => {
    setOpening(true);
    if (!firedRef.current) {
      trackEvent('booking_initiated', { booking_type: bookingType, source_page: sourcePage });
      firedRef.current = true;
    }
    await ensureCalLoaded();
    if (window.Cal) {
      const theme =
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      window.Cal('init', { origin: 'https://app.cal.com' });
      window.Cal('modal', {
        calLink: `${username}/${eventSlug}`,
        config: { theme, layout: 'month_view' },
      });
    }
    setOpening(false);
  };

  const baseStyle =
    variant === 'primary'
      ? { backgroundColor: 'var(--accent)', color: '#fff' }
      : { backgroundColor: 'transparent', color: 'var(--ink)', border: '1px solid var(--border)' };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={opening}
      className={`inline-flex items-center justify-center rounded-md px-5 py-2.5 text-base font-medium transition-colors disabled:opacity-60 ${className ?? ''}`}
      style={baseStyle}
      data-event-slug={eventSlug}
    >
      {children}
    </button>
  );
}
