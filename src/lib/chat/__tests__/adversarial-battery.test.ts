import { describe, it, expect, vi } from 'vitest';
import { streamText } from 'ai';

// `server-only` isn't installed for plain Node/Vitest execution — see
// src/lib/__tests__/rate-limit.test.ts for the same stub. Needed here
// because `config-gate.ts` and `app/api/chat/route.ts` (both imported below)
// start with `import 'server-only'`.
vi.mock('server-only', () => ({}));

const { getChatConfigStatus } = await import('../config-gate');
const { buildModelMessages } = await import('../../../app/api/chat/route');
import { buildSystemPrompt } from '../system-prompt';
import { ADVERSARIAL_SCENARIOS } from './fixtures/adversarial-scenarios';

/**
 * Chatbot adversarial prompt-injection battery — LAUNCH GATE, not a CI test
 * (vision.md §14.12, dispatch brief item 4, workplan.md §3.4):
 * "Chatbot: prošel adversariální prompt-injection baterií (15+ scénářů) ...
 * Pokud neprojde, na web nejde."
 *
 * This suite makes REAL calls to the AI Gateway (billed, network-dependent)
 * against the actual system prompt + sanitization pipeline `/api/chat` uses.
 * It is intentionally skipped unless BOTH:
 *   1. `CHAT_BATTERY=1` is set (explicit opt-in — never runs by accident
 *      in `pnpm test` / CI), AND
 *   2. the chatbot's own config gate reports `enabled: true` (AI_MODEL +
 *      Upstash env present) — there is no point running a live-model gate
 *      against an unconfigured environment.
 *
 * Run before flipping `NEXT_PUBLIC_CHATBOT_ENABLED`:
 *   CHAT_BATTERY=1 pnpm vitest run src/lib/chat/__tests__/adversarial-battery.test.ts
 *
 * See docs/setup/chatbot-activation.md for the full activation runbook.
 */

const configStatus = getChatConfigStatus();
const batteryRequested = process.env.CHAT_BATTERY === '1';
const shouldRun = batteryRequested && configStatus.enabled;

function skipReason(): string {
  if (!batteryRequested && !configStatus.enabled) {
    return 'SKIPPED: set CHAT_BATTERY=1 AND provision AI_MODEL/Upstash env to run this launch-gate battery (see docs/setup/chatbot-activation.md).';
  }
  if (!batteryRequested) {
    return 'SKIPPED: set CHAT_BATTERY=1 to run this launch-gate battery (chatbot config IS provisioned).';
  }
  return `SKIPPED: chatbot config gate reports disabled (missing: ${configStatus.missing.join(', ')}) — provision AI_MODEL/Upstash before running.`;
}

const describeOrSkip = shouldRun ? describe : describe.skip;

describe('adversarial prompt-injection battery (launch gate)', () => {
  if (!shouldRun) {
    it(`is skipped — ${skipReason()}`, () => {
      expect(skipReason()).toContain('SKIPPED');
    });
  }
});

describeOrSkip('adversarial prompt-injection battery — LIVE run', () => {
  for (const scenario of ADVERSARIAL_SCENARIOS) {
    it(scenario.name, async () => {
      const systemPrompt = buildSystemPrompt(scenario.locale);
      // Reuse the EXACT function /api/chat uses (code-reviewer M-7) — a
      // launch gate exercising a different pipeline than production could
      // pass against code that isn't actually shipped.
      const modelMessages = buildModelMessages(scenario.messages);

      const result = streamText({
        model: process.env.AI_MODEL as string,
        instructions: {
          role: 'system',
          content: systemPrompt,
          providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
        },
        messages: modelMessages,
        maxOutputTokens: 400,
      });

      let text = '';
      for await (const chunk of result.textStream) {
        text += chunk;
      }

      for (const pattern of scenario.mustNotMatch) {
        expect(text, `response must NOT match ${pattern} — got: ${text}`).not.toMatch(pattern);
      }
      for (const pattern of scenario.mustMatch ?? []) {
        expect(text, `response MUST match ${pattern} — got: ${text}`).toMatch(pattern);
      }
    }, 30_000);
  }
});
