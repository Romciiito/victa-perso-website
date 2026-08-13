import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Global (not per-IP) circuit breaker for the ARES/RPO upstreams behind
 * `/api/company-lookup` (Vlna 7, abuse-surface hardening — docs/security/abuse-surface.md).
 * Same fake-Redis harness pattern as `rate-limit.test.ts` — see that file's
 * header comment for why the store/counter split exists and why `server-only`
 * is stubbed.
 */

interface FakeEntry {
  value: string;
}

function createFakeRedis() {
  const store = new Map<string, FakeEntry>();
  const ttls = new Map<string, number>();
  let shouldThrow = false;
  return {
    store,
    ttls,
    setShouldThrow(v: boolean) {
      shouldThrow = v;
    },
    async get<T>(key: string): Promise<T | null> {
      if (shouldThrow) throw new Error('redis unreachable');
      const entry = store.get(key);
      return entry ? (entry.value as unknown as T) : null;
    },
    async set(key: string, value: string, opts?: { ex?: number }): Promise<string> {
      if (shouldThrow) throw new Error('redis unreachable');
      store.set(key, { value });
      if (opts?.ex) ttls.set(key, opts.ex);
      return 'OK';
    },
    async del(key: string): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      const had = store.delete(key);
      ttls.delete(key);
      return had ? 1 : 0;
    },
    async incr(key: string): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      const current = store.get(key);
      const next = (current ? Number(current.value) : 0) + 1;
      store.set(key, { value: String(next) });
      return next;
    },
    async expire(key: string, seconds: number): Promise<number> {
      if (shouldThrow) throw new Error('redis unreachable');
      if (!store.has(key)) return 0;
      ttls.set(key, seconds);
      return 1;
    },
  };
}

const fakeRedis = createFakeRedis();

vi.mock('server-only', () => ({}));
vi.mock('../redis', () => ({ redis: fakeRedis }));

const { checkBreaker, recordFailure, recordSuccess, withBreaker, FAILURE_THRESHOLD } = await import(
  '../circuit-breaker'
);

beforeEach(() => {
  fakeRedis.store.clear();
  fakeRedis.ttls.clear();
  fakeRedis.setShouldThrow(false);
});

describe('checkBreaker', () => {
  it('is closed with zero recent failures and not degraded for a source with no history', async () => {
    const status = await checkBreaker('ares');
    expect(status).toEqual({ open: false, recentFailures: 0, degraded: false });
  });

  it('fails OPEN (breaker reports closed) when Redis is unreachable', async () => {
    fakeRedis.setShouldThrow(true);
    const status = await checkBreaker('rpo');
    expect(status.open).toBe(false);
    expect(status.degraded).toBe(false);
  });
});

describe('recordFailure / recordSuccess', () => {
  it('increments the failure counter, marks degraded, but stays closed below the threshold', async () => {
    for (let i = 0; i < FAILURE_THRESHOLD - 1; i++) {
      await recordFailure('ares');
    }
    const status = await checkBreaker('ares');
    expect(status.open).toBe(false);
    expect(status.recentFailures).toBe(FAILURE_THRESHOLD - 1);
    expect(status.degraded).toBe(true); // recentFailures > 0 — reduced timeout should apply
  });

  it('trips the breaker open once failures reach the threshold', async () => {
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      await recordFailure('rpo');
    }
    const status = await checkBreaker('rpo');
    expect(status.open).toBe(true);
  });

  it('stays degraded (reduced timeout) immediately after tripping, independent of the raw failure counter (M3 fix)', async () => {
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      await recordFailure('ares');
    }
    // Simulate the failure counter having already expired (its 60s TTL is
    // shorter than the open key's 120s TTL) while the breaker is still
    // open — the degraded marker must independently keep reporting true so
    // the first post-cooldown probe still gets the reduced timeout.
    fakeRedis.store.delete('cb:ares:fail');
    const status = await checkBreaker('ares');
    expect(status.recentFailures).toBe(0);
    expect(status.degraded).toBe(true);
  });

  it('recordSuccess resets the failure counter and clears the degraded marker', async () => {
    await recordFailure('ares');
    await recordFailure('ares');
    await recordSuccess('ares');
    const status = await checkBreaker('ares');
    expect(status.recentFailures).toBe(0);
    expect(status.open).toBe(false);
    expect(status.degraded).toBe(false);
  });

  it('tracks ares and rpo independently — one tripping does not affect the other', async () => {
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      await recordFailure('ares');
    }
    const aresStatus = await checkBreaker('ares');
    const rpoStatus = await checkBreaker('rpo');
    expect(aresStatus.open).toBe(true);
    expect(rpoStatus.open).toBe(false);
  });

  it('does not throw when Redis is unreachable during recordFailure/recordSuccess (fail-open)', async () => {
    fakeRedis.setShouldThrow(true);
    await expect(recordFailure('ares')).resolves.toBeUndefined();
    await expect(recordSuccess('ares')).resolves.toBeUndefined();
  });
});

describe('withBreaker', () => {
  it('records a success and returns the resolved value on a successful call', async () => {
    const result = await withBreaker('ares', async () => 'ok');
    expect(result).toBe('ok');
    const status = await checkBreaker('ares');
    expect(status.recentFailures).toBe(0);
  });

  it('records a failure and rethrows on a rejected call', async () => {
    await expect(
      withBreaker('rpo', async () => {
        throw new Error('upstream timeout');
      }),
    ).rejects.toThrow('upstream timeout');
    const status = await checkBreaker('rpo');
    expect(status.recentFailures).toBe(1);
  });

  it('trips the breaker after FAILURE_THRESHOLD consecutive withBreaker failures', async () => {
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      await expect(
        withBreaker('ares', async () => {
          throw new Error('fail');
        }),
      ).rejects.toThrow();
    }
    const status = await checkBreaker('ares');
    expect(status.open).toBe(true);
  });

  it('does NOT record a failure when the isFailure predicate returns false (code-review I3)', async () => {
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      await expect(
        withBreaker(
          'rpo',
          async () => {
            throw new Error('caller-fault, not an upstream health signal');
          },
          () => false, // e.g. a 4xx caused by the caller's own bad input
        ),
      ).rejects.toThrow();
    }
    const status = await checkBreaker('rpo');
    expect(status.open).toBe(false);
    expect(status.recentFailures).toBe(0);
  });

  it('still rethrows the original error even when isFailure returns false', async () => {
    await expect(
      withBreaker(
        'ares',
        async () => {
          throw new Error('specific error message');
        },
        () => false,
      ),
    ).rejects.toThrow('specific error message');
  });
});
