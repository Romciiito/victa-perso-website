/**
 * Turnstile helpers shared by the client widget and the server verifier —
 * a single source of truth so the two sides can never drift on what counts
 * as "provisioned" or on the bypass sentinel (review finding, 2026-07-21).
 *
 * No 'server-only' here: this module must be importable from the client
 * widget. It contains no secrets — only format checks and a public sentinel.
 */

/**
 * Sentinel token the client widget supplies when Turnstile is NOT provisioned
 * client-side. The server treats receiving this while its own secret IS
 * configured as a provisioning asymmetry and fails closed.
 */
export const TURNSTILE_BYPASS_TOKEN = 'turnstile-not-configured';

/**
 * Real Cloudflare Turnstile keys — site keys and secret keys, including the
 * official test keys — start with `0x`–`3x`. Anything else is a placeholder.
 * Trims first so a key pasted with stray whitespace still counts as real
 * (a malformed-but-genuine key must never silently disable verification).
 */
export function turnstileKeyLooksReal(key: string | undefined): key is string {
  const k = key?.trim();
  return Boolean(k) && /^[0-3]x/.test(k as string);
}
