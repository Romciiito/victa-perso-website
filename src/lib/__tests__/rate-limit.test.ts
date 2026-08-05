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
  const counters = new Map<string, number>();
  let shouldThrow = false;
  return {
    store,
    counters,
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
    async incr(key: string): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    },
    async expire(key: string, _seconds: number): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      return counters.has(key) || store.has(key) ? 1 : 0;
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

const {
  claimWebhookProcessing,
  commitWebhookProcessed,
  releaseWebhookProcessing,
  checkChatIpLimit,
  incrChatSessionMessages,
  claimChatDailyConversation,
} = await import('../rate-limit');

beforeEach(() => {
  fakeRedis.store.clear();
  fakeRedis.counters.clear();
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

describe('checkChatIpLimit (per-IP 10 req/60s, AR-17, cost control)', () => {
  it('returns ok:true with count 1 on the first request', async () => {
    const result = await checkChatIpLimit('ip-hash-x');
    expect(result).toEqual({ ok: true, count: 1, limit: 10 });
  });

  it('counts up across repeated calls for the same IP hash', async () => {
    for (let i = 0; i < 9; i++) await checkChatIpLimit('ip-hash-y');
    const result = await checkChatIpLimit('ip-hash-y');
    expect(result).toEqual({ ok: true, count: 10, limit: 10 });
  });

  it('returns ok:false on the 11th request in the same window', async () => {
    for (let i = 0; i < 10; i++) await checkChatIpLimit('ip-hash-z');
    const result = await checkChatIpLimit('ip-hash-z');
    expect(result.ok).toBe(false);
    expect(result.count).toBe(11);
  });

  it('keeps independent counters per IP hash', async () => {
    for (let i = 0; i < 10; i++) await checkChatIpLimit('ip-hash-a');
    const other = await checkChatIpLimit('ip-hash-b');
    expect(other.ok).toBe(true);
    expect(other.count).toBe(1);
  });

  it('propagates a Redis error instead of failing open (unlike checkLimit)', async () => {
    // The chatbot's rate limiting exists purely for cost control
    // (security-model.md §4.1) — silently allowing requests through when
    // Redis is unreachable would defeat the entire point, unlike
    // `checkLimit`'s deliberate fail-open for forms (REQ-I-020).
    fakeRedis.setShouldThrow(true);
    await expect(checkChatIpLimit('ip-hash-err')).rejects.toThrow();
  });
});

describe('incrChatSessionMessages (per-session 20-message cap, AR-17)', () => {
  it('returns ok:true with count 1 on the first message of a session', async () => {
    const result = await incrChatSessionMessages('session-a');
    expect(result).toEqual({ ok: true, count: 1, limit: 20 });
  });

  it('counts up across repeated calls for the same session', async () => {
    for (let i = 0; i < 19; i++) await incrChatSessionMessages('session-b');
    const result = await incrChatSessionMessages('session-b');
    expect(result).toEqual({ ok: true, count: 20, limit: 20 });
  });

  it('returns ok:false on the 21st message (workplan.md 3.4 test 15)', async () => {
    for (let i = 0; i < 20; i++) await incrChatSessionMessages('session-c');
    const result = await incrChatSessionMessages('session-c');
    expect(result.ok).toBe(false);
    expect(result.count).toBe(21);
  });

  it('keeps independent counters per session_id', async () => {
    await incrChatSessionMessages('session-d');
    await incrChatSessionMessages('session-d');
    const other = await incrChatSessionMessages('session-e');
    expect(other.count).toBe(1);
  });

  it('propagates Redis errors (fail-closed)', async () => {
    fakeRedis.setShouldThrow(true);
    await expect(incrChatSessionMessages('session-f')).rejects.toThrow();
  });
});

describe('claimChatDailyConversation (1 new conversation/IP/day, AR-17)', () => {
  it('claims the daily slot for a brand-new session', async () => {
    const result = await claimChatDailyConversation('ip-hash-1', 'session-new-1');
    expect(result).toEqual({ ok: true });
  });

  it('lets the SAME session continue without re-claiming (existing session continues)', async () => {
    await claimChatDailyConversation('ip-hash-2', 'session-new-2');
    const again = await claimChatDailyConversation('ip-hash-2', 'session-new-2');
    expect(again).toEqual({ ok: true });
  });

  it('blocks a DIFFERENT session from the same IP on the same day', async () => {
    await claimChatDailyConversation('ip-hash-3', 'session-new-3');
    const blocked = await claimChatDailyConversation('ip-hash-3', 'session-new-4');
    expect(blocked).toEqual({ ok: false });
  });

  it('allows a new conversation from a DIFFERENT IP on the same day', async () => {
    await claimChatDailyConversation('ip-hash-4', 'session-new-5');
    const other = await claimChatDailyConversation('ip-hash-5', 'session-new-6');
    expect(other).toEqual({ ok: true });
  });

  it('propagates Redis errors (fail-closed)', async () => {
    fakeRedis.setShouldThrow(true);
    await expect(claimChatDailyConversation('ip-hash-6', 'session-new-7')).rejects.toThrow();
  });
});
