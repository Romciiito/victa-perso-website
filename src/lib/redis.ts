import 'server-only';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    'Upstash env vars missing: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. ' +
      'See docs/setup/vendor-setup-checklist.md §5.',
  );
}

export const redis = new Redis({ url, token });
