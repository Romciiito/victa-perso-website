import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// `server-only` isn't installed for plain Node/Vitest execution — see
// src/lib/__tests__/rate-limit.test.ts for the same stub.
vi.mock('server-only', () => ({}));

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
