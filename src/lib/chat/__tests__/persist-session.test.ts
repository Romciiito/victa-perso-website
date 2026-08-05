import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

const upsertMock = vi.fn();
const fromMock = vi.fn(() => ({ upsert: upsertMock }));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: fromMock },
}));

const { persistChatSession } = await import('../persist-session');

describe('persistChatSession (best-effort chatbot_sessions metadata upsert, D-018)', () => {
  beforeEach(() => {
    upsertMock.mockReset();
    fromMock.mockClear();
    upsertMock.mockResolvedValue({ error: null });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Undo the "Supabase not available" override that the not-provisioned
    // test below installs via `vi.doMock` + `vi.resetModules()`. Without
    // this, the override bleeds into every subsequent test in this file:
    // `persistChatSession` calls `await import('@/lib/supabase')` fresh on
    // EVERY invocation (by design — see persist-session.ts's doc comment),
    // so a later test calling the SAME already-imported `persistChatSession`
    // would silently resolve through whatever was last `doMock`'d for that
    // module id instead of exercising the path it claims to test —
    // confirmed empirically (code-reviewer M-9): with no cleanup at all,
    // the "Postgres error" test below passed for the wrong reason, with
    // `upsertMock` called 0 times.
    //
    // IMPORTANT: `vi.doUnmock` is NOT the fix here — it removes mocking
    // entirely, falling through to the REAL `@/lib/supabase` module (which
    // then throws for a different, equally wrong reason: no Supabase env
    // vars in this test process). The actual fix is re-asserting the
    // GOOD mock factory as the active `doMock` override, since a `doMock`
    // override (unlike the hoisted `vi.mock` below) is not restored by
    // `vi.resetModules()` on its own.
    vi.doMock('@/lib/supabase', () => ({ supabaseAdmin: { from: fromMock } }));
    vi.resetModules();
  });

  it('upserts only metadata fields — never message content', async () => {
    await persistChatSession({
      sessionId: 'sess-1',
      ipHash: 'abc123',
      locale: 'cs',
      sourceUrl: '/cs/spoluprace',
      messageCount: 4,
      tokensIn: 500,
      tokensOut: 300,
      highValueIntent: true,
    });

    expect(fromMock).toHaveBeenCalledWith('chatbot_sessions');
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const [payload] = upsertMock.mock.calls[0] as [Record<string, unknown>, unknown];
    expect(payload).toMatchObject({
      session_id: 'sess-1',
      ip_hash: 'abc123',
      locale: 'cs',
      source_url: '/cs/spoluprace',
      message_count: 4,
      total_tokens_in: 500,
      total_tokens_out: 300,
      high_value_intent: true,
    });
    expect(payload).not.toHaveProperty('content');
    expect(payload).not.toHaveProperty('message');
  });

  it('resolves without throwing when Supabase is not provisioned (dynamic import fails)', async () => {
    vi.doMock('@/lib/supabase', () => {
      throw new Error('Supabase env vars missing');
    });
    vi.resetModules();
    const { persistChatSession: persistWithoutSupabase } = await import('../persist-session');
    await expect(
      persistWithoutSupabase({
        sessionId: 'sess-2',
        ipHash: null,
        locale: 'cs',
        sourceUrl: null,
        messageCount: 1,
        tokensIn: 10,
        tokensOut: 5,
        highValueIntent: false,
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without throwing when the upsert itself returns a Postgres error', async () => {
    upsertMock.mockResolvedValue({ error: { message: 'connection refused' } });
    await expect(
      persistChatSession({
        sessionId: 'sess-3',
        ipHash: null,
        locale: 'en',
        sourceUrl: null,
        messageCount: 1,
        tokensIn: 1,
        tokensOut: 1,
        highValueIntent: false,
      }),
    ).resolves.toBeUndefined();
    // Proves this test actually exercises the "upsert returned a Postgres
    // error" branch — not the previous test's "Supabase unavailable" catch
    // branch (code-reviewer M-9: before the afterEach cleanup above, this
    // mock was called ZERO times and the test still passed for the wrong
    // reason).
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });
});
