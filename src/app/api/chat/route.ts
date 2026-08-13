import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { streamText, createTextStreamResponse, toTextStream, type ModelMessage } from 'ai';
import { getChatConfigStatus } from '@/lib/chat/config-gate';
import { isAllowedOrigin, clientIp } from '@/lib/origin';
import { bodyTooLarge } from '@/lib/body-size-guard';
import { chatSchema } from '@/lib/chat/chat-schema';
import { hashIp, checkChatIpLimit, claimChatDailyConversation, incrChatSessionMessages } from '@/lib/rate-limit';
import { sanitizeChatMessage, wrapUserContent } from '@/lib/chatbot-sanitize';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { detectHighValueIntent } from '@/lib/chat/high-intent';
import { logChatTurn } from '@/lib/chat/log-turn';
import { persistChatSession } from '@/lib/chat/persist-session';

/**
 * `/api/chat` — the chatbot's server-side proxy (AR-01, AR-02, AR-15, AR-16,
 * AR-17; architecture.md §3.2). Shipped DORMANT (Vlna 5): the route is fully
 * functional, but the widget that would call it only mounts when
 * `NEXT_PUBLIC_CHATBOT_ENABLED === '1'` (see `src/components/chat/`), which
 * stays unset until vendor provisioning + the adversarial battery both pass
 * (vision.md §14.12). This route ALSO fails closed on its own (the config
 * gate below) even if something calls it directly before that flag flips.
 *
 * Order of checks (each one documented at its own module):
 *   1. Config gate (`chat/config-gate.ts`) — fail CLOSED on missing
 *      AI_MODEL / Upstash env, before touching origin, body, or Redis.
 *   2. Origin allowlist (`lib/origin.ts`) — same CSRF defense as
 *      /api/contact and /api/newsletter.
 *   3. Zod schema (`chat/chat-schema.ts`, `.strict()`) — rejects any
 *      client-supplied `model`/`temperature`/`system`/`max_tokens`
 *      (security-model.md §2.2).
 *   4. Three INDEPENDENT rate-limit dimensions (AR-17) — per-IP, per-day
 *      new-conversation, per-session message count. All fail CLOSED: a
 *      Redis error here returns the same static-fallback 503 as an AI
 *      Gateway outage, never a silent bypass (see `rate-limit.ts`'s
 *      chatbot section for why this differs from the forms' fail-open
 *      policy).
 *   5. Server-side sanitization (`chatbot-sanitize.ts`, AR-15) of every
 *      user-authored message before it reaches the model.
 *   6. `streamText` against `process.env.AI_MODEL` ONLY, via the Vercel AI
 *      SDK's default Vercel AI Gateway resolution — no `@ai-sdk/anthropic`
 *      or `@anthropic-ai/sdk` import anywhere in this file (AR-01). The
 *      system prompt is sent as an `instructions` `SystemModelMessage`
 *      with `providerOptions.anthropic.cacheControl: { type: 'ephemeral' }`
 *      (AR-16).
 *   7. `onFinish`: structured, content-free logging (`log-turn.ts`) +
 *      best-effort `chatbot_sessions` metadata persistence
 *      (`persist-session.ts`, D-018 — message content is NEVER written).
 *
 * Any exception anywhere in steps 4-6 (Redis down, AI Gateway down/timeout,
 * a bug) is caught and converted into the documented static fallback
 * message (architecture.md §13.2) — never a raw error or stack trace.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const MAX_OUTPUT_TOKENS = 400;
/**
 * `chatSchema` allows up to 40 messages × 2000 chars = 80,000 CHARACTERS of
 * content — but Zod's `.max()` counts UTF-16 code units, not bytes, and a
 * schema-valid Czech/multi-byte payload can run well past that in UTF-8
 * bytes (code-review finding M1, Vlna 7: the original 120KB here silently
 * assumed ~1.5 bytes/char and would 413 a schema-valid worst-case payload).
 * 350KB is sized against the true worst case — 80,000 chars × 4 bytes (the
 * max any single UTF-16 code unit can encode to in UTF-8) plus JSON/field
 * overhead — while still bounding genuinely unbounded abuse.
 */
const MAX_BODY_BYTES = 350_000;
/** Retry-After values matching each rate-limit dimension's window (rate-limit.ts) — Vlna 7 unification (previously these 429s carried no Retry-After at all). */
const RETRY_AFTER_IP_S = '60';
const RETRY_AFTER_DAILY_S = '86400';
/** Session cap has no natural "retry after N seconds" (it's a per-conversation lifetime cap, not a window) — the session's own TTL is the closest honest answer. */
const RETRY_AFTER_SESSION_S = '86400';

const FALLBACK_MESSAGE: Record<'cs' | 'en', string> = {
  cs: 'Chatbot je momentálně nedostupný — kontaktujte nás prosím přímo.',
  en: 'The chatbot is temporarily unavailable—please contact us directly.',
};

function unavailableResponse(locale: 'cs' | 'en'): NextResponse {
  return NextResponse.json(
    { error: 'unavailable', message: FALLBACK_MESSAGE[locale] },
    { status: 503, headers: NO_STORE },
  );
}

/**
 * Builds the `ModelMessage[]` sent to the model. Every message — user AND
 * assistant-role — is run through `sanitizeChatMessage` before use: the
 * client resends the full conversation history on every turn (standard
 * multi-turn chat usage), and since this route is intentionally stateless
 * (no server-side conversation store, D-018), there is no server-held
 * ground truth to verify a client-submitted "assistant" turn actually came
 * from a prior model response — a malicious client could otherwise forge
 * prior assistant turns to prime a later jailbreak ("multi-turn priming",
 * one of the adversarial battery's scenarios). Sanitizing history too is
 * cheap defense-in-depth; the PRIMARY defense against forged-history
 * priming is the system prompt's absolute rules (never contradicted by
 * anything appearing earlier in the visible conversation) plus the
 * adversarial battery gate before launch — see `chat/system-prompt.ts` and
 * `chat/__tests__/adversarial-battery.test.ts`.
 *
 * Only user-role content is wrapped in the untrusted-data delimiter
 * (`wrapUserContent`) — assistant-role messages are already structurally
 * distinguished by `role: 'assistant'`, so the delimiter would be noise
 * there.
 *
 * Exported (not module-private) so `chat/__tests__/adversarial-battery.test.ts`
 * can build its model calls through the EXACT SAME function production uses
 * (code-reviewer finding M-7) — a launch gate that exercises a hand-rolled
 * reimplementation of this logic could pass while the pipeline that actually
 * ships behaves differently (e.g. the battery previously never sanitized
 * assistant-role history the way this function does).
 */
export function buildModelMessages(messages: { role: 'user' | 'assistant'; content: string }[]): ModelMessage[] {
  return messages.map((m) => {
    const sanitized = sanitizeChatMessage(m.content);
    return {
      role: m.role,
      content: m.role === 'user' ? wrapUserContent(sanitized) : sanitized,
    } as ModelMessage;
  });
}

// Return type is the broader `Response`, not `NextResponse` — the success
// path returns `createTextStreamResponse(...)` from the `ai` package, which
// is a plain `Response` (NextResponse's extra cookie helpers aren't needed
// or used on that path). Every other path still returns `NextResponse.json(...)`,
// which is a valid `Response`.
export async function POST(req: NextRequest): Promise<Response> {
  // 1. Config gate — first, before anything else (dispatch brief).
  const config = getChatConfigStatus();
  if (!config.enabled) {
    console.warn('[chat] disabled — missing env:', config.missing.join(', '));
    return NextResponse.json({ disabled: true }, { status: 503, headers: NO_STORE });
  }

  // 2. Origin allowlist.
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'origin' }, { status: 403, headers: NO_STORE });
  }

  // 2b. Content-Length body-size guard (Vlna 7) — 413 before Zod parses.
  const tooLarge = bodyTooLarge(req, MAX_BODY_BYTES);
  if (tooLarge) return tooLarge;

  // 3. Zod validation.
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = chatSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', issues: parsed.error.flatten().fieldErrors },
      { status: 400, headers: NO_STORE },
    );
  }
  const data = parsed.data;
  const locale = data.locale;

  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    // 4a. Per-IP rate limit (AR-17 dimension 1/3) — fail CLOSED.
    const ipLimit = await checkChatIpLimit(ipHash);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'rate-limit' },
        { status: 429, headers: { ...NO_STORE, 'Retry-After': RETRY_AFTER_IP_S } },
      );
    }

    // 4b. Per-day new-conversation cap (AR-17 dimension 2/3) — fail CLOSED.
    const daily = await claimChatDailyConversation(ipHash, data.session_id);
    if (!daily.ok) {
      return NextResponse.json(
        { error: 'daily-limit' },
        { status: 429, headers: { ...NO_STORE, 'Retry-After': RETRY_AFTER_DAILY_S } },
      );
    }

    // 4c. Per-session message cap (AR-17 dimension 3/3) — fail CLOSED, server
    // is the source of truth for the count (never the client-sent array length).
    const sessionLimit = await incrChatSessionMessages(data.session_id);
    if (!sessionLimit.ok) {
      return NextResponse.json(
        { error: 'session-limit' },
        { status: 429, headers: { ...NO_STORE, 'Retry-After': RETRY_AFTER_SESSION_S } },
      );
    }

    // 5-6. Sanitize + build the model call. `model` and `maxOutputTokens` are
    // fixed here, server-side, from process.env.AI_MODEL ONLY — the client
    // can never influence them (security-model.md §2.2; enforced structurally
    // by chatSchema's `.strict()` above already rejecting any such field).
    const modelMessages = buildModelMessages(data.messages);
    const systemPrompt = buildSystemPrompt(locale);

    const result = streamText({
      model: process.env.AI_MODEL as string,
      instructions: {
        role: 'system',
        content: systemPrompt,
        // AR-16 — Anthropic prompt caching for the (large, static-per-request)
        // system prompt, from day one. `providerOptions` is a generic
        // pass-through the AI SDK forwards to whichever provider the Gateway
        // resolves to; this does not import `@ai-sdk/anthropic` (AR-01).
        providerOptions: {
          anthropic: {
            cacheControl: { type: 'ephemeral' },
          },
        },
      },
      messages: modelMessages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      onFinish: (event) => {
        const responseTimeMs = Date.now() - startedAt;
        const usage = (event as { usage?: { inputTokens?: number; outputTokens?: number } }).usage;
        const tokensUsed = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
        const providerMetadata = (event as { providerMetadata?: Record<string, unknown> })
          .providerMetadata;
        const anthropicMeta = providerMetadata?.anthropic as
          | { cacheReadInputTokens?: number }
          | undefined;
        const cacheHit = Boolean(anthropicMeta?.cacheReadInputTokens && anthropicMeta.cacheReadInputTokens > 0);

        logChatTurn({
          request_id: requestId,
          session_id: data.session_id,
          message_count: sessionLimit.count,
          tokens_used: tokensUsed,
          cache_hit: cacheHit,
          model_id: process.env.AI_MODEL as string,
          response_time_ms: responseTimeMs,
        });

        const highValueIntent = detectHighValueIntent(data.messages);
        void persistChatSession({
          sessionId: data.session_id,
          ipHash,
          locale,
          sourceUrl: data.source_url ?? null,
          messageCount: sessionLimit.count,
          tokensIn: usage?.inputTokens ?? 0,
          tokensOut: usage?.outputTokens ?? 0,
          highValueIntent,
        });
      },
      onError: (err) => {
        // Mid-stream provider errors can't change an already-sent 200's
        // status code — this is the best we can do once the stream has
        // started. Log ONLY a stable message string, never the raw error
        // object: provider error payloads routinely echo request fragments
        // (e.g. "messages.0.content: ...") back in their body, and logging
        // the object risks leaking chat content into Sentry breadcrumbs —
        // exactly what claude-rules.md rule 12 forbids (code-reviewer I-2).
        const inner = (err as { error?: unknown }).error ?? err;
        const message = inner instanceof Error ? inner.message : String(inner);
        console.error('[chat] stream error:', message.slice(0, 300));
      },
    });

    return createTextStreamResponse({
      stream: toTextStream({ stream: result.stream }),
      headers: NO_STORE,
    });
  } catch (err) {
    console.error('[chat] request failed:', (err as Error).message);
    return unavailableResponse(locale);
  }
}
