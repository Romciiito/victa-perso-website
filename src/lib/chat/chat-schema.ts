import { z } from 'zod';

/**
 * Zod schema for `POST /api/chat` (REQ-F-058..069, security-model.md §7 Rule 8
 * "form handlers validate a fixed schema"). `.strict()` on both the message
 * objects and the top-level object rejects any field the client should never
 * be able to control — most importantly `model`, `temperature`, `system`, and
 * `max_tokens`, which security-model.md §2.2 explicitly forbids accepting
 * from the client. The server fixes those values in `route.ts`; this schema
 * makes it a 400, not a silently-ignored extra field, if a client ever sends
 * them.
 *
 * `messages` intentionally excludes a `system` role — the system prompt is
 * server-only (see `chat/system-prompt.ts`) and never travels through this
 * request body.
 */

const chatMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })
  .strict();

export const chatSchema = z
  .object({
    session_id: z.string().uuid(),
    messages: z.array(chatMessageSchema).min(1).max(40),
    locale: z.enum(['cs', 'en']),
    source_url: z.string().max(500).optional(),
  })
  .strict();

export type ChatRequestBody = z.infer<typeof chatSchema>;
