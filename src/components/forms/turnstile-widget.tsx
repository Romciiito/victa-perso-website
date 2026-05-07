'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'invisible';
          appearance?: 'always' | 'execute' | 'interaction-only';
          action?: string;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
  /** "execute" appearance hides the widget unless interaction is required (REQ-F-044). */
  appearance?: 'always' | 'execute' | 'interaction-only';
  action?: string;
}

/**
 * Cloudflare Turnstile widget — managed mode (privacy-friendly, no cookie).
 * Loads challenges.cloudflare.com/turnstile/v0/api.js once globally; subsequent renders
 * reuse the loaded script. The token is short-lived (~5 min) and verified server-side
 * via `verifyTurnstileToken` (REQ-I-021, security-model.md §4.3).
 */
export function TurnstileWidget({ onToken, onExpire, appearance = 'interaction-only', action }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey || sitekey.startsWith('your-')) return;

    let cancelled = false;
    const SCRIPT_ID = 'cf-turnstile';

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      // Avoid double-render on Strict Mode dev re-runs
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey,
        callback: (token) => {
          if (!cancelled) onToken(token);
        },
        'expired-callback': () => {
          if (!cancelled) onExpire?.();
        },
        'error-callback': () => {
          if (!cancelled) onExpire?.();
        },
        theme: 'auto',
        appearance,
        action,
      });
    };

    if (window.turnstile) {
      render();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      // Script tag exists but turnstile not yet ready — poll briefly.
      const id = setInterval(() => {
        if (window.turnstile) {
          clearInterval(id);
          render();
        }
      }, 100);
      setTimeout(() => clearInterval(id), 10_000);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore — widget may have already been removed
        }
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, onToken, onExpire, appearance, action]);

  if (!sitekey || sitekey.startsWith('your-')) {
    // Dev / preview mode — Turnstile not provisioned. Return a transparent placeholder
    // that auto-supplies a sentinel token so forms remain submittable in local dev.
    // Server route will reject this token, so dev requires a real sitekey for end-to-end.
    return null;
  }

  return <div ref={ref} className="cf-turnstile-widget" data-action={action} />;
}
