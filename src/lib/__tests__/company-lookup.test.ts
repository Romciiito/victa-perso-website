import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// `server-only` isn't installed for plain Node/Vitest execution — see
// src/lib/__tests__/rate-limit.test.ts for the same stub.
vi.mock('server-only', () => ({}));

/**
 * `company-lookup.ts` now goes through the global circuit breaker
 * (`circuit-breaker.ts`, Vlna 7) before calling ARES/RPO, which transitively
 * imports `./redis`. Mocked here with the same minimal fake-Redis harness
 * `rate-limit.test.ts`/`circuit-breaker.test.ts` use, so the breaker-open
 * tests below can deterministically pre-seed state — an EMPTY store is
 * behaviorally identical to the old no-mock setup (no failures on record =
 * breaker closed either way), so every pre-existing test below is unaffected.
 */
interface FakeEntry {
  value: string;
}
function createFakeRedis() {
  const store = new Map<string, FakeEntry>();
  return {
    store,
    async get<T>(key: string): Promise<T | null> {
      const entry = store.get(key);
      return entry ? (entry.value as unknown as T) : null;
    },
    async set(key: string, value: string): Promise<string> {
      store.set(key, { value });
      return 'OK';
    },
    async del(key: string): Promise<number> {
      return store.delete(key) ? 1 : 0;
    },
    async incr(key: string): Promise<number> {
      const current = store.get(key);
      const next = (current ? Number(current.value) : 0) + 1;
      store.set(key, { value: String(next) });
      return next;
    },
    async expire(): Promise<number> {
      return 1;
    },
  };
}
const fakeRedis = createFakeRedis();
vi.mock('../redis', () => ({ redis: fakeRedis }));

const { lookupCompany, mergeCompanyResults } = await import('../company-lookup');
const { companyLookupQuerySchema } = await import('../company-lookup-schema');

describe('companyLookupQuerySchema', () => {
  it('accepts a 2-char query and defaults country to "all"', () => {
    const r = companyLookupQuerySchema.safeParse({ q: 'vi' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.country).toBe('all');
  });

  it('rejects a 1-char query', () => {
    expect(companyLookupQuerySchema.safeParse({ q: 'v' }).success).toBe(false);
  });

  it('rejects a query over 100 chars', () => {
    expect(companyLookupQuerySchema.safeParse({ q: 'a'.repeat(101) }).success).toBe(false);
  });

  it('accepts explicit country values', () => {
    expect(companyLookupQuerySchema.safeParse({ q: 'victa', country: 'cz' }).success).toBe(true);
    expect(companyLookupQuerySchema.safeParse({ q: 'victa', country: 'sk' }).success).toBe(true);
  });

  it('rejects an unknown country value', () => {
    expect(companyLookupQuerySchema.safeParse({ q: 'victa', country: 'de' }).success).toBe(false);
  });
});

/**
 * Fixtures below are trimmed, structurally-faithful copies of REAL responses
 * captured live against ares.gov.cz / api.statistics.sk on 2026-08-13 (see
 * `company-lookup.ts`'s module doc for the full narrative) — not invented
 * shapes. The live network calls themselves are exercised separately by the
 * Node smoke-test script (this suite mocks `fetch` so it runs offline/in CI).
 */

const ARES_VICTA_RESPONSE = {
  pocetCelkem: 4,
  ekonomickeSubjekty: [
    {
      ico: '01981315',
      obchodniJmeno: 'CONSILIA VICTA spol. s r.o.',
      sidlo: { textovaAdresa: 'Švihovská 264/1, Písnice, 14200 Praha 4' },
    },
    {
      ico: '24692972',
      obchodniJmeno: 'Victa Solutions s.r.o.',
      sidlo: { textovaAdresa: 'Nějaká 1, 11000 Praha 1' },
    },
    {
      ico: '27162460',
      obchodniJmeno: 'VICTA, s.r.o.',
      sidlo: { textovaAdresa: 'Jiná 2, 60200 Brno' },
    },
    {
      ico: '28859511',
      obchodniJmeno: 'VICTA DIGITAL s.r.o.',
      sidlo: { textovaAdresa: 'Haškova 1238/8, 50002 Hradec Králové' },
    },
  ],
};

/** Recorded live: a broad query (e.g. "servis") makes ARES refuse with HTTP 400 + this body — NOT an outage. */
const ARES_TOO_MANY_RESULTS_RESPONSE = {
  kod: 'CHYBA_VSTUPU',
  popis: 'Zadaný dotaz vrací příliš mnoho výsledků (6 355). Povoleno je maximálně 1 000 výsledků. Upravte parametry vyhledávání.|Chyba vstupu',
  subKod: 'VYSTUP_PRILIS_MNOHO_VYSLEDKU',
};

/** A currently-active SK entity — one open (no validTo) fullName/identifier/address. */
const RPO_ACTIVE_RESULT = {
  id: 1041865,
  identifiers: [{ value: '31340628', validFrom: '1993-01-25' }],
  fullNames: [{ value: 'Avicta s.r.o.', validFrom: '2015-02-25' }],
  addresses: [
    {
      street: 'Tuhovská',
      buildingNumber: '37',
      postalCodes: ['83107'],
      municipality: { value: 'Bratislava' },
      validFrom: '1998-02-06',
    },
  ],
};

/** A terminated SK entity — EVERY fullName entry has validTo set (recorded live: INVICTA s.r.o.). */
const RPO_TERMINATED_RESULT = {
  id: 306670,
  termination: '2021-11-23',
  identifiers: [{ value: '17330394', validFrom: '1995-10-09' }],
  fullNames: [
    { value: 'INVICTA s.r.o.', validFrom: '1995-10-09', validTo: '2007-03-12' },
    { value: 'INVICTA s.r.o. v likvidácii', validFrom: '2007-03-13', validTo: '2021-11-23' },
  ],
  addresses: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('lookupCompany', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fakeRedis.store.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes ARES results to {name, ico, address, country}', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(ARES_VICTA_RESPONSE));
    const { results, degraded } = await lookupCompany('victa', 'cz');
    expect(degraded).toBe(false);
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual({
      name: 'CONSILIA VICTA spol. s r.o.',
      ico: '01981315',
      address: 'Švihovská 264/1, Písnice, 14200 Praha 4',
      country: 'CZ',
    });
  });

  it('sends the query unmodified (diacritics preserved) to ARES — CS query diacritics test', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ pocetCelkem: 0, ekonomickeSubjekty: [] }));
    await lookupCompany('vícta', 'cz');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.obchodniJmeno).toBe('vícta'); // not folded/stripped — ARES itself is diacritics-insensitive (verified live)
  });

  it('sends the query unmodified (diacritics preserved) to RPO', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));
    await lookupCompany('slovenská', 'sk');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(decodeURIComponent(new URL(url).searchParams.get('fullName') ?? '')).toBe('slovenská');
  });

  it('treats identical CS queries with/without diacritics as equivalent given identical upstream responses (RPO verified live diacritics-insensitive)', async () => {
    // A fresh Response per call — `Response.text()` can only be read once,
    // and `mockResolvedValue` (vs. `Once`) would hand back the SAME
    // instance to both `lookupCompany` calls below.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ results: [RPO_ACTIVE_RESULT] })));
    const withDiacritics = await lookupCompany('slovenská', 'sk');
    const withoutDiacritics = await lookupCompany('slovenska', 'sk');
    expect(withDiacritics.results).toEqual(withoutDiacritics.results);
  });

  it('treats an ARES "too many results" business-logic error (HTTP 400 + CHYBA_VSTUPU) as zero results, NOT a failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(ARES_TOO_MANY_RESULTS_RESPONSE, 400));
    const { results, degraded } = await lookupCompany('servis', 'cz');
    expect(results).toEqual([]);
    expect(degraded).toBe(false); // NOT degraded — this is expected behavior for a broad query, not an outage
  });

  it('resolves the CURRENT name for an active RPO entity (no validTo on the live entry)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [RPO_ACTIVE_RESULT] }));
    const { results } = await lookupCompany('avicta', 'sk');
    expect(results).toEqual([
      {
        name: 'Avicta s.r.o.',
        ico: '31340628',
        address: 'Tuhovská 37, 83107 Bratislava',
        country: 'SK',
      },
    ]);
  });

  it('falls back to the latest historical name for a fully-terminated RPO entity (every fullName has validTo)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [RPO_TERMINATED_RESULT] }));
    const { results } = await lookupCompany('invicta', 'sk');
    expect(results).toHaveLength(1);
    // Latest validTo (2021-11-23) wins, not the first/oldest name.
    expect(results[0]?.name).toBe('INVICTA s.r.o. v likvidácii');
    expect(results[0]?.ico).toBe('17330394');
    expect(results[0]?.address).toBeNull(); // no addresses in this fixture
  });

  it('calls ARES and RPO in parallel for country="all"', async () => {
    // Fresh Response per call — see the diacritics-equivalence test above for why.
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ pocetCelkem: 0, ekonomickeSubjekty: [], results: [] })),
    );
    const { degraded } = await lookupCompany('victa', 'all');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(degraded).toBe(false);
  });

  it('a failed RPO call does not suppress successful ARES results (Promise.allSettled isolation)', async () => {
    fetchMock.mockImplementation((input: string | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('ares.gov.cz')) return Promise.resolve(jsonResponse(ARES_VICTA_RESPONSE));
      return Promise.reject(new Error('RPO network error'));
    });
    const { results, degraded } = await lookupCompany('victa', 'all');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.country === 'CZ')).toBe(true);
    expect(degraded).toBe(true);
  });

  it('a failed ARES call does not suppress successful RPO results', async () => {
    fetchMock.mockImplementation((input: string | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('statistics.sk')) return Promise.resolve(jsonResponse({ results: [RPO_ACTIVE_RESULT] }));
      return Promise.reject(new Error('ARES network error'));
    });
    const { results, degraded } = await lookupCompany('avicta', 'all');
    expect(results.length).toBe(1);
    expect(results[0]?.country).toBe('SK');
    expect(degraded).toBe(true);
  });

  it('degrades to empty results (not a thrown error) when every source fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const { results, degraded } = await lookupCompany('victa', 'all');
    expect(results).toEqual([]);
    expect(degraded).toBe(true);
  });

  it('never throws even on a malformed upstream response shape', async () => {
    // Fresh Response per call — see the diacritics-equivalence test above for why.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ unexpected: 'shape' })));
    await expect(lookupCompany('victa', 'all')).resolves.toEqual({ results: [], degraded: true });
  });

  describe('circuit breaker (Vlna 7)', () => {
    it('skips the ARES fetch entirely (no network call) when the ARES breaker is open', async () => {
      fakeRedis.store.set('cb:ares:open', { value: '1' });
      fetchMock.mockResolvedValue(jsonResponse({ results: [RPO_ACTIVE_RESULT] }));
      const { results, degraded } = await lookupCompany('victa', 'all');
      // Only the RPO call should have gone out — the ARES call was skipped
      // before any fetch was constructed.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url.toString()).toContain('statistics.sk');
      expect(degraded).toBe(true);
      expect(results).toEqual([
        { name: 'Avicta s.r.o.', ico: '31340628', address: 'Tuhovská 37, 83107 Bratislava', country: 'SK' },
      ]);
    });

    it('skips the RPO fetch entirely when the RPO breaker is open, ARES still runs', async () => {
      fakeRedis.store.set('cb:rpo:open', { value: '1' });
      fetchMock.mockResolvedValueOnce(jsonResponse(ARES_VICTA_RESPONSE));
      const { results, degraded } = await lookupCompany('victa', 'all');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url.toString()).toContain('ares.gov.cz');
      expect(degraded).toBe(true);
      expect(results).toHaveLength(4);
    });

    it('country="cz" with an open ARES breaker returns an empty, degraded result with zero fetch calls', async () => {
      fakeRedis.store.set('cb:ares:open', { value: '1' });
      const { results, degraded } = await lookupCompany('victa', 'cz');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(results).toEqual([]);
      expect(degraded).toBe(true);
    });

    it('records a failure against the breaker when a source rejects, and a subsequent success resets it', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ARES timeout'));
      await lookupCompany('victa', 'cz');
      expect(fakeRedis.store.get('cb:ares:fail')?.value).toBe('1');

      fetchMock.mockResolvedValueOnce(jsonResponse(ARES_VICTA_RESPONSE));
      await lookupCompany('victa', 'cz');
      expect(fakeRedis.store.has('cb:ares:fail')).toBe(false);
    });

    it('trips the ARES breaker open after 5 consecutive failures, then the 6th call skips the fetch', async () => {
      fetchMock.mockRejectedValue(new Error('ARES down'));
      for (let i = 0; i < 5; i++) {
        await lookupCompany('victa', 'cz');
      }
      expect(fakeRedis.store.get('cb:ares:open')?.value).toBe('1');

      fetchMock.mockClear();
      const { degraded } = await lookupCompany('victa', 'cz');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(degraded).toBe(true);
    });

    it('a 4xx from RPO (caller-fault) does NOT count toward the breaker, even 5x in a row (code-review I3)', async () => {
      fetchMock.mockResolvedValue(new Response('bad request', { status: 400 }));
      for (let i = 0; i < 5; i++) {
        const { degraded } = await lookupCompany('victa', 'sk');
        expect(degraded).toBe(true); // still reported as a failed/degraded call to THIS request...
      }
      // ...but the GLOBAL breaker must not have tripped — a 400 is "our
      // query was bad," not "RPO is unhealthy," and must never degrade the
      // feature for every other visitor.
      expect(fakeRedis.store.has('cb:rpo:fail')).toBe(false);
      expect(fakeRedis.store.has('cb:rpo:open')).toBe(false);
      await lookupCompany('victa', 'sk');
      expect(fetchMock).toHaveBeenCalledTimes(6); // never skipped — breaker never opened
    });

    it('a 5xx from RPO DOES count toward the breaker (genuine upstream-health signal)', async () => {
      fetchMock.mockResolvedValue(new Response('internal error', { status: 503 }));
      for (let i = 0; i < 5; i++) {
        await lookupCompany('victa', 'sk');
      }
      expect(fakeRedis.store.get('cb:rpo:open')?.value).toBe('1');
      fetchMock.mockClear();
      await lookupCompany('victa', 'sk');
      expect(fetchMock).not.toHaveBeenCalled(); // breaker open — call skipped entirely
    });

    it('a 429 from RPO (upstream rate-limiting us) DOES count toward the breaker', async () => {
      fetchMock.mockResolvedValue(new Response('too many requests', { status: 429 }));
      for (let i = 0; i < 5; i++) {
        await lookupCompany('victa', 'sk');
      }
      expect(fakeRedis.store.get('cb:rpo:open')?.value).toBe('1');
    });

    it('uses the reduced timeout once a source is degraded, and the full timeout once it recovers (M4)', async () => {
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
      try {
        // First call: healthy source, full 5s ARES timeout.
        fetchMock.mockResolvedValueOnce(jsonResponse(ARES_VICTA_RESPONSE));
        await lookupCompany('victa', 'cz');
        expect(timeoutSpy).toHaveBeenLastCalledWith(5_000);

        // One failure — below the trip threshold, but `degraded` should now be true.
        fetchMock.mockRejectedValueOnce(new Error('ARES blip'));
        await lookupCompany('victa', 'cz');

        // Next call while degraded: reduced (halved) timeout.
        fetchMock.mockResolvedValueOnce(jsonResponse(ARES_VICTA_RESPONSE));
        await lookupCompany('victa', 'cz');
        expect(timeoutSpy).toHaveBeenLastCalledWith(2_500);

        // That last call succeeded — recordSuccess clears the degraded
        // marker, so the source is back to the full timeout.
        fetchMock.mockResolvedValueOnce(jsonResponse(ARES_VICTA_RESPONSE));
        await lookupCompany('victa', 'cz');
        expect(timeoutSpy).toHaveBeenLastCalledWith(5_000);
      } finally {
        timeoutSpy.mockRestore();
      }
    });
  });
});

describe('mergeCompanyResults', () => {
  it('deduplicates by (country, ico), preserving first-seen order', () => {
    const merged = mergeCompanyResults([
      { name: 'A', ico: '111', address: null, country: 'CZ' },
      { name: 'A dup', ico: '111', address: null, country: 'CZ' },
      { name: 'B', ico: '111', address: null, country: 'SK' }, // same ico, different country — NOT a dup
      { name: 'C', ico: '222', address: null, country: 'CZ' },
    ]);
    expect(merged).toHaveLength(3);
    expect(merged.map((m) => m.name)).toEqual(['A', 'B', 'C']);
  });

  it('caps the result at 8 entries', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      name: `Company ${i}`,
      ico: String(i),
      address: null,
      country: 'CZ' as const,
    }));
    expect(mergeCompanyResults(many)).toHaveLength(8);
  });
});
