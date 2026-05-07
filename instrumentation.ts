/**
 * Next.js instrumentation hook — runs once per server boot.
 * Loads the appropriate Sentry config based on runtime (Node.js vs Edge).
 *
 * Per @sentry/nextjs 8.x docs:
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// onRequestError is exported by @sentry/nextjs 9.x+ but not 8.x — the older SDK uses
// withSentryConfig in next.config to capture request errors via Next's instrumentation.
// Upgrade to 9.x post-launch if needed (Phase 5 §5.13 review).
