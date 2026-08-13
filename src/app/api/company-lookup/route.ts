import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { companyLookupQuerySchema } from '@/lib/company-lookup-schema';
import { lookupCompany } from '@/lib/company-lookup';
import { checkLimit, hashIp } from '@/lib/rate-limit';
import { isAllowedOrigin, clientIp } from '@/lib/origin';

/**
 * Company-registry autocomplete proxy (Vlna 6, `contact-form.tsx`'s
 * `CompanyAutocomplete` — anti-fake-lead verification against ARES (CZ) +
 * RPO (SK)). See `src/lib/company-lookup.ts`'s module doc for the two
 * upstream APIs' verified live behavior (both are public, keyless GET/POST
 * JSON endpoints).
 *
 * Server-side proxy is mandatory here, not a style choice: the browser must
 * never call `ares.gov.cz`/`api.statistics.sk` directly — that would require
 * adding both to CSP `connect-src`, which is exactly the "don't add a CSP
 * exception ad-hoc" case AR-20 exists for (a bigger attack surface for zero
 * benefit, since both APIs are trivially proxyable).
 *
 * Runtime: `nodejs` (not `edge`) — consistent with every other route in this
 * codebase (contact/newsletter/booking-webhook/chat all run nodejs), and
 * `AbortSignal.timeout` + `fetch` behave identically either way so there's no
 * technical reason to diverge.
 *
 * Caching: unlike every other API route here (`Cache-Control: no-store`),
 * this one is deliberately CACHEABLE. It has no user-specific side effects —
 * it's a read-only proxy over two PUBLIC company registries whose contents
 * change on a timescale of months/years, not seconds, so a few minutes of
 * staleness is invisible to the anti-fake-lead use case (verifying "does a
 * company by this name plausibly exist", not "what is this company's status
 * as of right now"). `s-maxage=300, stale-while-revalidate=600` lets
 * Vercel's CDN answer repeated/popular queries (e.g. "victa" while multiple
 * people demo the form) without re-hitting ARES/RPO or burning the rate
 * limiter's budget. `public` is required for Vercel's edge network to be
 * allowed to store the response at all.
 */

export const runtime = 'nodejs';
// Explicit even though `req.nextUrl.searchParams` already makes this route
// implicitly per-request (Vlna 7 consistency pass — every other route in
// this codebase declares `dynamic` explicitly; this one didn't, which read
// as an oversight rather than the deliberate omission it actually was).
// `dynamic = 'force-dynamic'` controls Next's OWN build-time/Data-Cache
// behavior for this handler — it does NOT override the `Cache-Control`
// header the response sets below. The CDN-cacheable response (D-021) and
// "this Function always executes per-request" are independent, non-
// conflicting facts; declaring both explicitly avoids relying on that
// distinction being obvious from a code read six months from now.
export const dynamic = 'force-dynamic';

// `Vary: Origin` (gate Vlny 6): bez něj je cache klíčem jen URL, takže by
// origin check platil pouze na cache miss a cizí web by dostal odpověď na
// populární dotaz přímo z CDN. Data jsou veřejná (ARES/RPO), ale kontrola má
// platit per-request, ne per-URL.
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  Vary: 'Origin',
} as const;
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'origin' }, { status: 403, headers: NO_STORE });
  }

  const { searchParams } = req.nextUrl;
  const parsed = companyLookupQuerySchema.safeParse({
    q: searchParams.get('q') ?? '',
    country: searchParams.get('country') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', issues: parsed.error.flatten().fieldErrors },
      { status: 400, headers: NO_STORE },
    );
  }
  const { q, country } = parsed.data;

  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  // Fail-open (this is a search-as-you-type affordance, not a spend-controlled
  // resource — see the `company_lookup` limiter's doc comment in rate-limit.ts).
  const rl = await checkLimit('company_lookup', ipHash);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate-limit', retryAt: rl.reset },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': '60' } },
    );
  }

  // `lookupCompany` never throws — a source outage/timeout is reflected in
  // `degraded`, not a rejection — but this route still answers 200 with an
  // empty, non-degraded result set on a genuinely unexpected exception
  // (defense-in-depth; the form must never hard-fail because of this
  // optional verification step).
  try {
    const { results, degraded } = await lookupCompany(q, country);
    return NextResponse.json({ results, degraded }, { status: 200, headers: CACHE_HEADERS });
  } catch (err) {
    console.error('[company-lookup] unexpected error:', (err as Error).message);
    return NextResponse.json({ results: [], degraded: true }, { status: 200, headers: NO_STORE });
  }
}
