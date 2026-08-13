import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

// `149e9513-01fa-4fb0-aad4-566afd725d1b` — Vlna 7 code-review finding M8:
// the fixed (not per-build-random — confirmed by inspecting the generated
// .next/routes-manifest.json `afterFiles` rewrites) path prefix `botid`'s
// `withBotId()` config wrapper (next.config.ts) installs for its
// challenge-script + proxy rewrites. The `.js` challenge script path was
// already excluded incidentally (it matches `.*\..*` below), but the PROXY
// sub-path (`/{this-uuid}/{another-uuid}/:path*` → bot-protection/v1/proxy)
// can carry dotless requests that, without this exclusion, next-intl's
// locale middleware would treat as an unrecognized locale segment and
// redirect — breaking the proxy. Harmless today since BotID ships DORMANT
// (`NEXT_PUBLIC_BOTID_ENABLED` unset, docs/security/abuse-surface.md §5.2),
// but excluded now rather than left as a landmine for whoever flips that flag.
export const config = {
  matcher: ['/((?!api|_next|_vercel|149e9513-01fa-4fb0-aad4-566afd725d1b|.*\\..*).*)'],
};
