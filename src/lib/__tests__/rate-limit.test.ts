import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Covers the Cal.com webhook idempotency fix (audit P0-15): the claim must
 * happen BEFORE processing, but only commit to "done" AFTER the caller
 * confirms the write succeeded — and CREATED vs CANCELLED for the same
 * cal_booking_id must be independently claimable (distinct triggerEvent).
 *
 * `./redis` is mocked with an in-memory store that mimics the subset of the
 * Upstash REST client's behavior these functions rely on: `set(key, val,
 * {nx, ex})` returning `'OK'` on success / `null` when NX blocks it, `get`,
 * and `del`.
 */

interface FakeEntry {
  value: string;
}

function createFakeRedis() {
  const store = new Map<string, FakeEntry>();
  let shouldThrow = false;
  return {
    store,
    setShouldThrow(v: boolean) {
      shouldThrow = v;
    },
    async get<T>(key: string): Promise<T | null> {
      if (shouldThrow) throw new Error('redis unreachable');
      const entry = store.get(key);
      return (entry ? (entry.value as unknown as T) : null);
    },
    async set(key: string, value: string, opts?: { nx?: boolean; ex?: number }): Promise<string | null> {
      if (shouldThrow) throw new Error('redis unreachable');
      if (opts?.nx && store.has(key)) return null;
      store.set(key, { value });
      return 'OK';
    },
    async del(key: string): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      return store.delete(key) ? 1 : 0;
    },
  };
}

const fakeRedis = createFakeRedis();

// The `server-only` package isn't installed for plain Node/Vitest execution
// (Next.js resolves it via a special webpack alias at build time — see
// https://nextjs.org/docs/app/building-your-application/rendering/server-components#keeping-server-only-code-out-of-the-client-environment).
// Stub it so importing `../rate-limit` (which starts with `import 'server-only'`)
// doesn't fail module resolution outside of a Next.js build.
vi.mock('server-only', () => ({}));

vi.mock('../redis', () => ({
  redis: fakeRedis,
}));

const { claimWebhookProcessing, commitWebhookProcessed, releaseWebhookProcessing } = await import(
  '../rate-limit'
);

beforeEach(() => {
  fakeRedis.store.clear();
  fakeRedis.setShouldThrow(false);
});

describe('claimWebhookProcessing / commitWebhookProcessed / releaseWebhookProcessing', () => {
  it('claims a fresh (bookingId, triggerEvent) pair as "new"', async () => {
    const result = await claimWebhookProcessing('cal-123', 'BOOKING_CREATED');
    expect(result).toBe('new');
  });

  it('does NOT mark a claim as done until commitWebhookProcessed is called (P0-15 core fix)', async () => {
    await claimWebhookProcessing('cal-123', 'BOOKING_CREATED');
    // Simulate the Supabase insert failing — caller releases instead of committing.
    await releaseWebhookProcessing('cal-123', 'BOOKING_CREATED');
    const retry = await claimWebhookProcessing('cal-123', 'BOOKING_CREATED');
    expect(retry).toBe('new'); // a Cal.com retry after a failed write must be able to reprocess
  });

  it('returns "done" once commitWebhookProcessed has run, and stays deduped', async () => {
    await claimWebhookProcessing('cal-123', 'BOOKING_CREATED');
    await commitWebhookProcessed('cal-123', 'BOOKING_CREATED');
    const again = await claimWebhookProcessing('cal-123', 'BOOKING_CREATED');
    expect(again).toBe('done');
  });

  it('returns "in-progress" for a concurrent claim on the same key before commit/release', async () => {
    const first = await claimWebhookProcessing('cal-456', 'BOOKING_CREATED');
    const second = await claimWebhookProcessing('cal-456', 'BOOKING_CREATED');
    expect(first).toBe('new');
    expect(second).toBe('in-progress');
  });

  it('treats CREATED and CANCELLED for the same booking id as independently claimable (P0-15)', async () => {
    // This is the exact bug scenario: a CANCELLED event for a booking whose
    // CREATED event was already processed must NOT be silently deduped.
    const created = await claimWebhookProcessing('cal-789', 'BOOKING_CREATED');
    await commitWebhookProcessed('cal-789', 'BOOKING_CREATED');

    const cancelled = await claimWebhookProcessing('cal-789', 'BOOKING_CANCELLED');

    expect(created).toBe('new');
    expect(cancelled).toBe('new'); // must NOT be "done" just because CREATED was
  });

  it('fails OPEN (returns "new") if Redis is unreachable, rather than silently dropping the event', async () => {
    fakeRedis.setShouldThrow(true);
    const result = await claimWebhookProcessing('cal-999', 'BOOKING_CREATED');
    expect(result).toBe('new');
  });

  it('commit and release swallow Redis errors without throwing', async () => {
    fakeRedis.setShouldThrow(true);
    await expect(commitWebhookProcessed('cal-999', 'BOOKING_CREATED')).resolves.toBeUndefined();
    await expect(releaseWebhookProcessing('cal-999', 'BOOKING_CREATED')).resolves.toBeUndefined();
  });
});
