import 'server-only';
import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client — lazy initialization to avoid build-time failures.
 *
 * Build-time: env vars may be missing (Phase 0/1 — Upstash account not yet provisioned).
 * Runtime: env vars MUST be present when redis is actually used (forms, rate limiting).
 *
 * Pattern: throw at first use (request-time), not at import-time.
 * This lets `next build` succeed without Upstash credentials and lets the app deploy
 * before vendor accounts exist. Routes that depend on redis fail gracefully at request time.
 */

let _redis: Redis | null = null;

/**
 * Upstash přes Vercel Marketplace injektuje `KV_REST_API_URL` / `KV_REST_API_TOKEN`,
 * ruční setup z Upstash konzole `UPSTASH_REDIS_REST_URL` / `_TOKEN`. Čteme obojí,
 * aby provisioning nevyžadoval duplikaci secretů do druhé dvojice proměnných —
 * duplikát by se navíc rozešel, kdyby integrace klíče rotovala (provisioning
 * 2026-08-13).
 */
export function redisCredentials(): { url?: string; token?: string } {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
  };
}

function getRedis(): Redis {
  if (_redis) return _redis;

  const { url, token } = redisCredentials();

  if (!url || !token) {
    throw new Error(
      'Upstash env vars missing: UPSTASH_REDIS_REST_URL/_TOKEN nebo KV_REST_API_URL/_TOKEN ' +
        '(Vercel Marketplace). See docs/setup/vendor-setup-checklist.md §5.',
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Proxy that forwards all property access to a lazily-initialized Redis client.
 * Mimics the original `redis` named export — drop-in replacement for callers.
 */
export const redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    const r = getRedis();
    const value = Reflect.get(r, prop, receiver);
    return typeof value === 'function' ? value.bind(r) : value;
  },
});
