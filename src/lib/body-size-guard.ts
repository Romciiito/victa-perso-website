import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Fast `Content-Length`-header guard for POST route handlers (Vlna 7 —
 * docs/security/abuse-surface.md). Vercel/Next already enforce a
 * platform-level request body ceiling, but that limit only bites AFTER the
 * body has been buffered — a route that then runs Zod validation (contact,
 * newsletter, chat) or reads the raw body for HMAC verification
 * (booking-webhook) still pays the cost of reading + attempting to parse a
 * multi-megabyte payload before any of that rejects it. Checking
 * `Content-Length` up front is O(1) (a header read, no body access) and
 * rejects with 413 before any of that work happens.
 *
 * NOT a replacement for the platform limit: a request that lies about its
 * `Content-Length`, or omits it (chunked transfer-encoding), is not caught
 * here and falls through to Vercel's own limit plus whatever the route's own
 * parsing does with an oversized body. This is a cheap first line of
 * defense for the common case (a client — legitimate or a naive script —
 * sending an honest, oversized `Content-Length`), not a hard guarantee.
 */

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * Returns a ready-to-return 413 `NextResponse` if the request's declared
 * `Content-Length` exceeds `maxBytes`; otherwise returns `null` (caller
 * continues). Call BEFORE `req.json()` / `req.text()`.
 */
export function bodyTooLarge(req: NextRequest, maxBytes: number): NextResponse | null {
  const contentLength = req.headers.get('content-length');
  if (!contentLength) return null;
  const bytes = Number(contentLength);
  if (!Number.isFinite(bytes) || bytes <= maxBytes) return null;
  return NextResponse.json({ error: 'payload-too-large' }, { status: 413, headers: NO_STORE });
}
