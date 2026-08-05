/**
 * Structured chatbot turn logging — the ONLY fields ever allowed to reach
 * console/Sentry for a chat request (CLAUDE.md "Chatbot message logging"
 * rule, claude-rules.md rule 12): logging chatbot message content is a GDPR
 * violation (architecture.md §3.2). `ChatLogFields` intentionally has no
 * `content`/`message`/`prompt` field — there is no way to smuggle message
 * text through this type without a caller reaching for `as unknown as
 * ChatLogFields`, which is a visible, greppable red flag in review.
 */

export interface ChatLogFields {
  request_id: string;
  session_id: string;
  message_count: number;
  tokens_used: number;
  cache_hit: boolean;
  model_id: string;
  response_time_ms: number;
}

export function logChatTurn(fields: ChatLogFields): void {
  console.log('[chat]', fields);
}
