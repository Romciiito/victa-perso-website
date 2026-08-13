import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withBotId } from 'botid/next/config';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/', destination: '/cs', permanent: true },
    ];
  },
};

// withBotId adds first-party rewrite rules so the BotID client challenge is
// served from this project's own domain (not a third-party CDN) — the
// specific mechanism BotID uses to stay effective against ad-blockers, and
// why /api/contact + /api/newsletter's BotID protection (Vlna 7,
// docs/security/abuse-surface.md) needs no CSP `connect-src`/`script-src`
// exception (AR-20): there is no new third-party domain, only same-origin
// paths.
export default withBotId(withNextIntl(nextConfig));
