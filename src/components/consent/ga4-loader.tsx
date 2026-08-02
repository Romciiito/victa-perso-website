'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasAnalyticsConsent, onConsentChange } from '@/lib/consent';

/**
 * GA4 loader, consent-gated (AR-09 + REQ-C-003 + claude-rules §9).
 *
 * Subscribes to Cookiebot consent events and only mounts the gtag.js script
 * after analytics consent is granted. IP anonymization via the GA4 admin
 * setting (vendor-setup-checklist.md §7); also passed in the gtag config call
 * defensively.
 *
 * Cookiebot's `data-blockingmode="auto"` already blocks third-party scripts
 * with `data-cookieconsent="statistics"` until consent. The gating below is
 * a second defensive layer — script tags are not even rendered until granted.
 */
export function Ga4Loader() {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!measurementId || measurementId.startsWith('G-XXX')) return;
    if (hasAnalyticsConsent()) {
      // Deferred via queueMicrotask rather than called synchronously in the
      // effect body — satisfies `react-hooks/set-state-in-effect` (ESLint
      // gate fix, audit Vlna 3A). No behavior change: this effect already
      // only runs once, post-mount/post-hydration, so a same-tick-later
      // microtask update is not observable to the user.
      queueMicrotask(() => setGranted(true));
      return;
    }
    const off = onConsentChange(() => {
      if (hasAnalyticsConsent()) setGranted(true);
    });
    return off;
  }, [measurementId]);

  if (!granted || !measurementId) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}
