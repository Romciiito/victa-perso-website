/**
 * Truncates to at most `maxLen` Unicode code points, never splitting a
 * surrogate pair (P2-01). `String.prototype.slice` operates on raw UTF-16
 * code units, so a plain `str.slice(0, maxLen)` can cut an astral character
 * (e.g. an emoji, 2 UTF-16 units) exactly between its high and low
 * surrogate — the result is not valid UTF-16, and depending on what reads it
 * next that can mean a mangled DB write, a JSON.stringify replacement
 * character, or a rejected insert, while the visitor's form still reports
 * "submitted successfully". `Array.from` iterates by code point (it's
 * surrogate-pair aware), so slicing the array form is always safe.
 */
function truncateAtCodePoint(str: string, maxLen: number): string {
  // Fast path: UTF-16 length is always >= code-point length, so if the raw
  // length already fits, the code-point length fits too — no need to build
  // the intermediate array for the (overwhelmingly common) short-input case.
  if (str.length <= maxLen) return str;
  return Array.from(str).slice(0, maxLen).join('');
}

/**
 * Server-side input sanitization for plain-text form fields.
 *
 * - Strips HTML tags (form fields are NOT rich text — anything HTML-like is suspect).
 * - Strips ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F) except \n and \t.
 * - Trims and truncates to maxLen (by Unicode code point, not UTF-16 code unit — P2-01).
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
  const noCtrl = noHtml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return truncateAtCodePoint(noCtrl.trim(), maxLen);
}

/**
 * Conservative email pre-check — rejects newlines, null bytes, oversized inputs.
 * Used as a defense-in-depth layer; Zod's `email()` is the canonical validator.
 * Per security-model.md §4.4, rejecting newlines/null prevents email-header injection.
 */
export function isValidEmail(input: string): boolean {
  if (typeof input !== 'string' || input.length === 0 || input.length > 254) return false;
  if (/[\r\n\x00]/.test(input)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}
