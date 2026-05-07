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

function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Upstash env vars missing: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. ' +
        'See docs/setup/vendor-setup-checklist.md §5.',
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
