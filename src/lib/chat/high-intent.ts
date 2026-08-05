/**
 * High-value-intent heuristic (architecture.md §3.2, workplan.md §3.1):
 * "if user message contains audit/komplexní/integrace/transformace 3+ times
 * in session, set chatbot_sessions.high_value_intent = true".
 *
 * Deliberately stateless and per-request: the client resends the full
 * conversation history on every turn (standard AI SDK `messages` array
 * usage), so recomputing this from that resent history at each turn is
 * exactly equivalent to tracking it server-side across turns — without
 * requiring `chatbot_messages.content` to ever be persisted (D-018). Only
 * the resulting boolean is written to `chatbot_sessions.high_value_intent`;
 * the message text itself never reaches storage or logs.
 */

interface HighIntentMessage {
  role: string;
  content: string;
}

/** CS forms (diacritics-stripped) + EN forms. Matched as whole-word substrings. */
const KEYWORDS = [
  'audit',
  'komplexni', // matches "komplexní" once diacritics are stripped
  'integrace',
  'transformace',
  'comprehensive',
  'integration',
  'transformation',
];

const MIN_MENTIONS = 3;

/** Strips combining diacritical marks so "komplexní" and "komplexni" both match. */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function countMentions(text: string): number {
  const normalized = stripDiacritics(text.toLowerCase());
  let total = 0;
  for (const keyword of KEYWORDS) {
    const re = new RegExp(`\\b${keyword}\\w*`, 'g');
    const matches = normalized.match(re);
    if (matches) total += matches.length;
  }
  return total;
}

/**
 * Scans only `role: 'user'` messages (the assistant's own words don't
 * indicate the VISITOR's intent) and returns true once total keyword
 * mentions across the conversation reach `MIN_MENTIONS`.
 */
export function detectHighValueIntent(messages: HighIntentMessage[]): boolean {
  let total = 0;
  for (const m of messages) {
    if (m.role !== 'user') continue;
    total += countMentions(m.content);
    if (total >= MIN_MENTIONS) return true;
  }
  return false;
}
