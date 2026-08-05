/**
 * Best-effort chatbot session metadata persistence (architecture.md §5.4,
 * workplan.md §3.1). ONLY `chatbot_sessions` metadata is written — NEVER
 * `chatbot_messages.content` (D-018, the strictest reading of the GDPR
 * message-logging rule: the column stays in the schema for a future,
 * deliberate retention policy, but nothing writes to it today).
 *
 * `@/lib/supabase`'s `supabaseAdmin` export THROWS at module-evaluation time
 * (not lazily, unlike `@/lib/redis`) when `NEXT_PUBLIC_SUPABASE_URL` /
 * `SUPABASE_SERVICE_KEY` are absent. A static top-level `import { supabaseAdmin }
 * from '@/lib/supabase'` in this file would therefore crash `/api/chat`'s
 * entire module load — including the config-gate check that is supposed to
 * run FIRST — on any deployment where Supabase isn't provisioned yet, even
 * though the chatbot's core answer-generation path has no hard dependency on
 * Supabase at all. The dynamic `await import(...)` below, wrapped in
 * try/catch, defers that failure to request time and contains it to this one
 * best-effort call, matching the dispatch brief: "Supabase best-effort (bez
 * provisioningu tiše přeskoč)".
 */

export interface PersistChatSessionInput {
  sessionId: string;
  ipHash: string | null;
  locale: 'cs' | 'en';
  sourceUrl: string | null;
  messageCount: number;
  tokensIn: number;
  tokensOut: number;
  highValueIntent: boolean;
}

export async function persistChatSession(input: PersistChatSessionInput): Promise<void> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { error } = await supabaseAdmin.from('chatbot_sessions').upsert(
      {
        session_id: input.sessionId,
        ip_hash: input.ipHash,
        locale: input.locale,
        source_url: input.sourceUrl,
        message_count: input.messageCount,
        total_tokens_in: input.tokensIn,
        total_tokens_out: input.tokensOut,
        high_value_intent: input.highValueIntent,
      },
      { onConflict: 'session_id' },
    );
    if (error) {
      console.warn('[chat] persistChatSession upsert error:', error.message);
    }
  } catch (err) {
    console.warn(
      '[chat] persistChatSession skipped (Supabase not available):',
      (err as Error).message,
    );
  }
}
