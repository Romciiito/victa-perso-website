import 'server-only';
import type { NextRequest } from 'next/server';
import { site } from '@/config/site';

/**
 * Origin header allowlist — shared by every Vercel Function that needs a
 * CSRF-defense layer (contact form, newsletter, chat). Extracted from the
 * near-identical `originOk` that used to live independently in
 * `src/app/api/contact/route.ts` and `src/app/api/newsletter/route.ts`
 * (Vlna 5 — a third near-copy for `/api/chat` would have made three; this
 * module is the single source of truth instead).
 *
 * Allowlist: only the production domain + this project's own Vercel
 * deployment URLs. A blanket `.vercel.app` match would accept a cross-origin
 * POST from ANY other Vercel project (audit P1-01) — the declared CSRF layer
 * would be trivially bypassable.
 */
export function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const allowed = new Set<string>([new URL(site.url).hostname]);
    for (const env of [
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ]) {
      if (env) allowed.add(env);
    }
    if (process.env.NODE_ENV !== 'production') allowed.add('localhost');
    return allowed.has(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Best-effort client IP extraction — identical logic previously duplicated
 * in `src/app/api/contact/route.ts` and `src/app/api/newsletter/route.ts`,
 * consolidated here alongside `isAllowedOrigin` for the same reason (Vlna 5:
 * a third near-copy for `/api/chat` would have made three).
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? '0.0.0.0';
}
