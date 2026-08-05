import 'server-only';

/**
 * Chatbot config gate — checked BEFORE anything else in `/api/chat`
 * (dispatch brief: "bez AI_MODEL + gateway klíče + Upstash → 503 {disabled:true}
 * DŘÍV než cokoli jiného"). Unlike the contact/newsletter forms — which
 * degrade gracefully when a vendor isn't provisioned (D-011) — the chatbot is
 * fail-CLOSED on missing config: cost control is the entire point of the
 * rate limiters (security-model.md §4.1), and rate limiting is meaningless
 * without Redis, so "quietly work without it" is not an acceptable fallback
 * here the way it is for a contact form's Turnstile check.
 *
 * `AI_GATEWAY_API_KEY` is intentionally NOT required for `enabled: true` —
 * on Vercel, AI Gateway authentication can be satisfied by the platform's
 * OIDC token instead of an explicit env var (dispatch brief: "gateway
 * autentizace přes AI_GATEWAY_API_KEY / Vercel OIDC"). There is no local env
 * signal that OIDC is active, so gating on the key's absence would make the
 * chatbot permanently report itself disabled in a correctly-configured
 * Vercel OIDC deployment. `AI_MODEL` + both Upstash vars remain hard
 * requirements — none of those three has a platform-implicit fallback.
 */

export interface ChatConfigStatus {
  enabled: boolean;
  missing: string[];
}

const REQUIRED_VARS = ['AI_MODEL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'] as const;

export function getChatConfigStatus(): ChatConfigStatus {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  return { enabled: missing.length === 0, missing };
}
