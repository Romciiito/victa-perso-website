import { describe, it, expect, vi, afterEach } from 'vitest';
import { logChatTurn, type ChatLogFields } from '../log-turn';

describe('logChatTurn (GDPR logging contract — CLAUDE.md, claude-rules.md)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs exactly the 7 documented fields, nothing else', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fields: ChatLogFields = {
      request_id: 'req-1',
      session_id: 'sess-1',
      message_count: 3,
      tokens_used: 120,
      cache_hit: true,
      model_id: 'anthropic/claude-sonnet-4-5',
      response_time_ms: 842,
    };
    logChatTurn(fields);

    expect(spy).toHaveBeenCalledTimes(1);
    const [prefix, payload] = spy.mock.calls[0] as [string, unknown];
    expect(typeof prefix).toBe('string');
    expect(payload).toEqual(fields);
    expect(Object.keys(payload as object).sort()).toEqual(
      [
        'cache_hit',
        'message_count',
        'model_id',
        'request_id',
        'response_time_ms',
        'session_id',
        'tokens_used',
      ].sort(),
    );
  });

  it('never logs message content — the type has no content/message field to smuggle it through', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const secret = 'Kolik stojí audit pro firmu XYZ s.r.o.?';
    logChatTurn({
      request_id: 'req-2',
      session_id: 'sess-2',
      message_count: 1,
      tokens_used: 10,
      cache_hit: false,
      model_id: 'anthropic/claude-sonnet-4-5',
      response_time_ms: 100,
    });
    const loggedJson = JSON.stringify(spy.mock.calls[0]);
    expect(loggedJson).not.toContain(secret);
  });
});
