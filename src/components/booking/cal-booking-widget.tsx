'use client';

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/ga4';

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

export type BookingType = 'audit_t1' | 'audit_t2' | 'audit_t3' | 'scoping_call';

interface Props {
  /** Cal.com event-type slug, e.g. "tier-1-audit", "tier-2-audit", "free-scoping-call" */
  eventSlug: string;
  /** Maps the click to a GA4 booking_initiated event for funnel attribution */
  bookingType: BookingType;
  /** The page path the visitor was on when they opened the widget — used for source_page param */
  sourcePage: string;
  /** Optional theme override; defaults to reading data-theme on <html> */
  theme?: 'light' | 'dark';
}

const SCRIPT_ID = 'cal-embed-script';
const FALLBACK_TIMEOUT_MS = 8_000;

function readTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' ? 'dark' : 'light';
}

function loadCalScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('SSR'));
      return;
    }
    if (window.Cal && (window.Cal as { loaded?: boolean }).loaded) {
      resolve();
      return;
    }
    if (document.getElementById(SCRIPT_ID)) {
      // Script tag exists; wait for Cal to attach.
      const id = window.setInterval(() => {
        if (window.Cal) {
          window.clearInterval(id);
          resolve();
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(id);
        reject(new Error('cal-load-timeout'));
      }, FALLBACK_TIMEOUT_MS);
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = 'https://app.cal.com/embed/embed.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('cal-network'));
    document.head.appendChild(s);
  });
}

/**
 * Cal.com inline booking embed (architecture.md §3.3, BK-01..BK-04).
 *
 * Loads `https://app.cal.com/embed/embed.js` once globally; renders an inline calendar
 * for `cal.com/<NEXT_PUBLIC_CALCOM_USERNAME>/<eventSlug>` inside a fixed-height container
 * (REQ-F-040 — no CLS contribution > 0.01 because the container reserves height).
 *
 * Falls back to a contact prompt after FALLBACK_TIMEOUT_MS if the iframe fails to mount
 * (REQ-F-037, architecture.md §3.3 fallback note).
 *
 * Theme: reads `data-theme` on `<html>` and passes to Cal.com (AR-12).
 */
export function CalBookingWidget({ eventSlug, bookingType, sourcePage, theme }: Props) {
  const username = process.env.NEXT_PUBLIC_CALCOM_USERNAME ?? 'victa';
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [eventFired, setEventFired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !ref.current?.querySelector('iframe')) {
        setFailed(true);
      }
    }, FALLBACK_TIMEOUT_MS);

    const usingTheme = theme ?? readTheme();
    void loadCalScript()
      .then(() => {
        if (cancelled || !ref.current || !window.Cal) return;
        window.Cal('init', { origin: 'https://app.cal.com' });
        window.Cal('inline', {
          elementOrSelector: ref.current,
          calLink: `${username}/${eventSlug}`,
          config: { theme: usingTheme, layout: 'month_view' },
        });
        if (!eventFired) {
          trackEvent('booking_initiated', { booking_type: bookingType, source_page: sourcePage });
          setEventFired(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [eventSlug, bookingType, sourcePage, theme, username, eventFired]);

  if (failed) {
    return (
      <div
        role="alert"
        className="rounded-lg border p-6"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--ink)',
        }}
      >
        <p className="text-base">
          Formulář je momentálně nedostupný — kontaktujte nás na{' '}
          <a className="underline" style={{ color: 'var(--accent)' }} href="mailto:hello@victaagency.com">
            hello@victaagency.com
          </a>
          .
        </p>
      </div>
    );
  }

  return <div ref={ref} className="min-h-[600px] w-full" data-cal-event={eventSlug} />;
}
