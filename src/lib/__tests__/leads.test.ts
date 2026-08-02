import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Covers the P2-02 atomic-upsert fix in src/lib/leads.ts: `upsertLead` must
 * (a) use `.upsert(..., {onConflict:'email'})` as the primary path, and
 * (b) transparently fall back to the pre-fix select-then-insert behavior
 * when Postgres reports 42P10 ("no unique or exclusion constraint matching
 * the ON CONFLICT specification") — i.e. before migration 002 has been
 * applied — so the function keeps working either way.
 *
 * `../supabase` is mocked with a minimal fluent-chain double (`from` /
 * `select` / `upsert` / `insert` / `eq` / `order` / `limit` all return the
 * chain itself; `.single()` / `.maybeSingle()` resolve pre-scripted
 * responses in call order).
 */

vi.mock('server-only', () => ({}));

const singleResponses: Array<{ data: unknown; error: unknown }> = [];
const maybeSingleResponses: Array<{ data: unknown; error: unknown }> = [];

const calls: Array<{ method: string; args: unknown[] }> = [];

function record(method: string) {
  return (...args: unknown[]) => {
    calls.push({ method, args });
    return chain;
  };
}

const chain: Record<string, (...args: unknown[]) => unknown> = {
  from: record('from'),
  select: record('select'),
  upsert: record('upsert'),
  insert: record('insert'),
  eq: record('eq'),
  order: record('order'),
  limit: record('limit'),
  single: (...args: unknown[]) => {
    calls.push({ method: 'single', args });
    return Promise.resolve(singleResponses.shift() ?? { data: null, error: new Error('no response scripted') });
  },
  maybeSingle: (...args: unknown[]) => {
    calls.push({ method: 'maybeSingle', args });
    return Promise.resolve(
      maybeSingleResponses.shift() ?? { data: null, error: new Error('no response scripted') },
    );
  },
};

vi.mock('../supabase', () => ({
  supabaseAdmin: chain,
}));

const { upsertLead } = await import('../leads');

beforeEach(() => {
  singleResponses.length = 0;
  maybeSingleResponses.length = 0;
  calls.length = 0;
});

const baseInput = {
  email: 'Jan@Example.com',
  name: 'Jan Novák',
  source: 'contact_form' as const,
  locale: 'cs' as const,
};

describe('upsertLead — atomic upsert (post-migration-002)', () => {
  it('uses .upsert with onConflict:email and returns the resulting id', async () => {
    singleResponses.push({ data: { id: 'lead-1' }, error: null });

    const result = await upsertLead(baseInput);

    expect(result).toEqual({ id: 'lead-1' });
    const upsertCall = calls.find((c) => c.method === 'upsert');
    expect(upsertCall).toBeTruthy();
    expect(upsertCall?.args[1]).toMatchObject({ onConflict: 'email' });
    // Never falls through to the legacy select-then-insert path when the
    // atomic upsert itself succeeds.
    expect(calls.some((c) => c.method === 'maybeSingle')).toBe(false);
  });

  it('lowercases the email before writing', async () => {
    singleResponses.push({ data: { id: 'lead-2' }, error: null });
    await upsertLead(baseInput);
    const upsertCall = calls.find((c) => c.method === 'upsert');
    expect((upsertCall?.args[0] as { email: string }).email).toBe('jan@example.com');
  });

  it('returns null and logs on a non-42P10 error without falling back', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    singleResponses.push({ data: null, error: { code: '23502', message: 'not null violation' } });

    const result = await upsertLead(baseInput);

    expect(result).toBeNull();
    expect(calls.some((c) => c.method === 'maybeSingle')).toBe(false);
    errorSpy.mockRestore();
  });
});

describe('upsertLead — pre-migration-002 fallback (42P10)', () => {
  it('falls back to select-then-insert and still returns an id when the upsert target constraint is missing', async () => {
    // First call: the atomic upsert attempt, rejected because the unique
    // index from migration 002 doesn't exist yet.
    singleResponses.push({
      data: null,
      error: { code: '42P10', message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification' },
    });
    // Legacy path: no existing row found ...
    maybeSingleResponses.push({ data: null, error: null });
    // ... so it inserts and returns the new id.
    singleResponses.push({ data: { id: 'lead-legacy-new' }, error: null });

    const result = await upsertLead(baseInput);

    expect(result).toEqual({ id: 'lead-legacy-new' });
    expect(calls.map((c) => c.method)).toEqual(
      expect.arrayContaining(['upsert', 'single', 'select', 'eq', 'order', 'limit', 'maybeSingle', 'insert']),
    );
  });

  it('returns the existing row without inserting when the legacy select finds a match', async () => {
    singleResponses.push({ data: null, error: { code: '42P10', message: 'no matching constraint' } });
    maybeSingleResponses.push({ data: { id: 'lead-legacy-existing' }, error: null });

    const result = await upsertLead(baseInput);

    expect(result).toEqual({ id: 'lead-legacy-existing' });
    // Only ONE `single()` call total (the failed upsert attempt) — the
    // legacy insert-and-single() branch must not run once maybeSingle found
    // an existing row.
    expect(calls.filter((c) => c.method === 'single')).toHaveLength(1);
  });
});
