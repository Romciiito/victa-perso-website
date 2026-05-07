/**
 * Server-side input sanitization for plain-text form fields.
 *
 * - Strips HTML tags (form fields are NOT rich text — anything HTML-like is suspect).
 * - Strips ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F) except \n and \t.
 * - Trims and truncates to maxLen.
 *
 * For chatbot input (post-launch when chatbot reactivates), additional control-token stripping
 * is required (architecture.md §8.4, AR-15). That logic will live in `chatbot-sanitize.ts` —
 * not in this file, to keep the launch-time helper minimal.
 */
export function sanitizeFormString(raw: string, maxLen = 2000): string {
  if (typeof raw !== 'string') return '';
  // Strip HTML tags (greedy on `<...>`)
  const noHtml = raw.replace(/<[^>]*>/g, '');
  // Strip ASCII control chars except \n (0x0A) and \t (0x09).
  // eslint-disable-next-line no-control-regex
  const noCtrl = noHtml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return noCtrl.trim().slice(0, maxLen);
}

/**
 * Conservative email pre-check — rejects newlines, null bytes, oversized inputs.
 * Used as a defense-in-depth layer; Zod's `email()` is the canonical validator.
 * Per security-model.md §4.4, rejecting newlines/null prevents email-header injection.
 */
export function isValidEmail(input: string): boolean {
  if (typeof input !== 'string' || input.length === 0 || input.length > 254) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\r\n\x00]/.test(input)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}
