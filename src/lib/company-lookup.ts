import 'server-only';
import { checkBreaker, withBreaker, type BreakerStatus } from './circuit-breaker';

/**
 * ARES (CZ) + RPO (SK) company-registry lookup — Vlna 6 anti-fake-lead
 * verification for the contact form's company-autocomplete field. Server-only
 * proxy: the browser never talks to `ares.gov.cz`/`api.statistics.sk`
 * directly (CSP `connect-src` stays `'self'` + the existing whitelist — see
 * `src/app/api/company-lookup/route.ts`'s header comment for why no CSP
 * change is needed).
 *
 * Both upstream shapes and their edge cases below were verified against the
 * LIVE production APIs on 2026-08-13 (no sandbox/staging exists for either):
 *
 *  - ARES: `POST https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`,
 *    `{"obchodniJmeno": q, "pocet": N}`. Diacritics- and case-insensitive —
 *    `"victa"` and `"vícta"` return byte-identical results (4 matches, incl.
 *    "VICTA DIGITAL s.r.o."). No API key.
 *
 *    IMPORTANT, discovered live (not in any doc we were given): when a query
 *    is generic enough that the TOTAL match count exceeds 1000, ARES does
 *    NOT return a short page — it returns HTTP 400 with a business-logic
 *    error body `{"kod":"CHYBA_VSTUPU","subKod":"VYSTUP_PRILIS_MNOHO_VYSLEDKU",...}`
 *    and `pocet` (the page-size param) does not save you from this; it only
 *    limits the page once ARES has already decided to answer. This is
 *    normal/expected behavior for a broad query (e.g. "servis" → this exact
 *    error), NOT an outage — `searchAres` treats it as zero results, not a
 *    thrown error, so a broad query doesn't flip the response's `degraded`
 *    flag.
 *
 *  - RPO (Slovakia, api.statistics.sk): `GET /rpo/v1/search?fullName=<q>`.
 *    Also diacritics-insensitive in practice — verified live: `fullName=slovenska`
 *    and `fullName=slovensk%C3%A1` (percent-encoded "á") returned
 *    byte-identical response bodies (content-length 590888, `diff` empty).
 *
 *  - Circuit breaker (Vlna 7, `circuit-breaker.ts`, global — not per-IP):
 *    when a source has failed `FAILURE_THRESHOLD` times in the last 60s, new
 *    calls to that source are skipped entirely (no fetch, no timeout wait)
 *    for a 2-minute cooldown — see `circuit-breaker.ts`'s module doc for the
 *    full rationale. While a source has ANY recent failures (below the trip
 *    threshold), its per-call timeout is halved (`*_TIMEOUT_MS_REDUCED`) so a
 *    still-struggling upstream fails fast instead of holding the Vercel
 *    Function open for the full budget again.
 *
 *    IMPORTANT, discovered live: RPO's `limit` query parameter (and every
 *    plausible alternative we tried — `size`, `pageSize`, `maxResults`,
 *    `top`, `recordsPerPage`, `max`) is silently IGNORED by the live API; it
 *    always returns its full match set up to its own server-side cap
 *    (observed: 500 results for a generic query like "slovenska"). This
 *    module therefore always slices RPO's response to `SOURCE_FETCH_LIMIT`
 *    itself rather than trusting the request parameter to do it — see
 *    `searchRpo` below. (The `limit` param is still sent on the request, in
 *    case a future RPO deployment starts honoring it — harmless either way.)
 *
 *    `fullNames`/`identifiers`/`addresses` are each a HISTORY array — the
 *    CURRENT value is the entry with no `validTo` key; a fully terminated
 *    entity (has a top-level `termination` date) has `validTo` set on every
 *    entry, so `pickCurrent` falls back to the one with the latest `validTo`
 *    (its name/address at the time it closed) rather than surfacing an empty
 *    string.
 */

export interface CompanyMatch {
  name: string;
  ico: string;
  address: string | null;
  country: 'CZ' | 'SK';
}

const ARES_SEARCH_URL =
  'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat';
const RPO_SEARCH_URL = 'https://api.statistics.sk/rpo/v1/search';

/** Requested per-source page size. RPO ignores this live (see module doc) — enforced by local `.slice()` instead. */
const SOURCE_FETCH_LIMIT = 8;
/** Final cap on the merged, deduplicated response sent to the client. */
const MAX_MERGED_RESULTS = 8;
/**
 * Per-source timeouts. Měřeno na produkci 2026-08-13: ARES odpovídá do ~1 s,
 * slovenské RPO ~8,5 s. Společný 5s timeout proto SK zdroj VŽDY uřízl a
 * odpověď se vracela s `degraded: true` bez jediné slovenské firmy.
 *
 * Klient tyhle dvě rychlosti nemíchá do jednoho čekání — volá `country=cz`
 * a `country=sk` zvlášť, takže české výsledky naskočí okamžitě a slovenské
 * se doplní, jakmile dorazí (viz company-autocomplete.tsx).
 */
const ARES_TIMEOUT_MS = 5_000;
const RPO_TIMEOUT_MS = 12_000;
/** Halved timeout used while a source has any recent (unreset) circuit-breaker failures — see circuit-breaker.ts. */
const ARES_TIMEOUT_MS_REDUCED = ARES_TIMEOUT_MS / 2;
const RPO_TIMEOUT_MS_REDUCED = RPO_TIMEOUT_MS / 2;

/** Parses a `Response` body as JSON without trusting `res.ok` — ARES returns meaningful JSON on its documented 400 (see module doc). Throws only when the body genuinely isn't JSON (network edge / HTML error page from an intermediary). */
async function parseJsonLenient(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`non-JSON response (status ${res.status})`);
  }
}

/* ------------------------------------------------------------------------ */
/* ARES (CZ)                                                                  */
/* ------------------------------------------------------------------------ */

interface AresSidlo {
  textovaAdresa?: string;
}
interface AresSubjekt {
  obchodniJmeno: string;
  ico: string;
  sidlo?: AresSidlo;
}
interface AresSuccessResponse {
  pocetCelkem?: number;
  ekonomickeSubjekty?: AresSubjekt[];
}
interface AresErrorResponse {
  kod: string;
  popis?: string;
  subKod?: string;
}

async function searchAres(q: string, signal: AbortSignal): Promise<CompanyMatch[]> {
  const res = await fetch(ARES_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ obchodniJmeno: q, pocet: SOURCE_FETCH_LIMIT }),
    signal,
  });
  const body = await parseJsonLenient(res);

  if (body && typeof body === 'object' && Array.isArray((body as AresSuccessResponse).ekonomickeSubjekty)) {
    return (body as AresSuccessResponse).ekonomickeSubjekty!.map((s) => ({
      name: s.obchodniJmeno,
      ico: s.ico,
      address: s.sidlo?.textovaAdresa ?? null,
      country: 'CZ' as const,
    }));
  }

  if (body && typeof body === 'object' && typeof (body as AresErrorResponse).kod === 'string') {
    // Business-logic error (e.g. "too many results" for a very generic query)
    // — expected, not an outage. Treated as zero matches from this source.
    return [];
  }

  throw new Error(`unexpected ARES response shape (status ${res.status})`);
}

/* ------------------------------------------------------------------------ */
/* RPO (SK)                                                                   */
/* ------------------------------------------------------------------------ */

interface RpoValidityEntry {
  value: string;
  validFrom: string;
  validTo?: string;
}
interface RpoAddress {
  street?: string;
  buildingNumber?: string;
  postalCodes?: string[];
  municipality?: { value?: string };
  validFrom?: string;
  validTo?: string;
}
interface RpoResult {
  identifiers?: RpoValidityEntry[];
  fullNames?: RpoValidityEntry[];
  addresses?: RpoAddress[];
}
interface RpoSearchResponse {
  results?: RpoResult[];
}

/** Picks the entry with no `validTo` (currently valid); falls back to the one with the latest `validTo` when every entry is historical (terminated entity) — see module doc. */
function pickCurrent<T extends { validTo?: string }>(items: T[] | undefined): T | undefined {
  if (!items || items.length === 0) return undefined;
  const open = items.find((i) => !i.validTo);
  if (open) return open;
  return [...items].sort((a, b) => (b.validTo ?? '').localeCompare(a.validTo ?? ''))[0];
}

function formatRpoAddress(addresses: RpoAddress[] | undefined): string | null {
  const addr = pickCurrent(addresses);
  if (!addr) return null;
  const streetLine = [addr.street, addr.buildingNumber].filter(Boolean).join(' ').trim();
  const cityLine = [addr.postalCodes?.[0], addr.municipality?.value].filter(Boolean).join(' ');
  const parts = [streetLine, cityLine].filter((p) => p && p.length > 0);
  return parts.length > 0 ? parts.join(', ') : null;
}

function normalizeRpoResult(r: RpoResult): CompanyMatch | null {
  const name = pickCurrent(r.fullNames)?.value;
  const ico = pickCurrent(r.identifiers)?.value;
  if (!name || !ico) return null; // malformed/unusable entry — skip rather than show a blank row
  return { name, ico, address: formatRpoAddress(r.addresses), country: 'SK' };
}

async function searchRpo(q: string, signal: AbortSignal): Promise<CompanyMatch[]> {
  const url = new URL(RPO_SEARCH_URL);
  url.searchParams.set('fullName', q);
  url.searchParams.set('limit', String(SOURCE_FETCH_LIMIT)); // sent for forward-compat; live API ignores it (see module doc)
  const res = await fetch(url, { signal });
  if (!res.ok) {
    // Tagged with the HTTP status so `isUpstreamHealthFailure` (below) can
    // tell "RPO itself is unhealthy" (5xx, 429) apart from "our own query
    // was rejected" (any other 4xx) — the circuit breaker must only trip on
    // the former (code-review finding I3, Vlna 7).
    throw new UpstreamStatusError(`RPO http ${res.status}`, res.status);
  }
  const body = await parseJsonLenient(res);
  if (!body || typeof body !== 'object' || !Array.isArray((body as RpoSearchResponse).results)) {
    throw new Error('unexpected RPO response shape');
  }
  return (body as RpoSearchResponse)
    .results!.slice(0, SOURCE_FETCH_LIMIT) // API ignores `limit` — enforce locally (see module doc)
    .map(normalizeRpoResult)
    .filter((m): m is CompanyMatch => m !== null);
}

/* ------------------------------------------------------------------------ */
/* Circuit-breaker failure discrimination (Vlna 7, code-review finding I3)  */
/* ------------------------------------------------------------------------ */

/** Thrown by `searchRpo` for a non-OK HTTP response, tagged with the status so callers can distinguish "upstream is unhealthy" from "our own request was rejected." */
export class UpstreamStatusError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'UpstreamStatusError';
  }
}

/**
 * Decides whether a rejection from `searchAres`/`searchRpo` should count
 * toward the GLOBAL circuit breaker's failure counter. This breaker affects
 * every visitor, not just the one whose request failed — so it must only
 * trip on signals that mean the UPSTREAM is unhealthy (network error,
 * timeout, 5xx, 429 — the upstream rate-limiting US), never on a rejection
 * that's really about the caller's own input. `searchAres` already models
 * this correctly on its own (its documented "too many results" business
 * error returns `[]` rather than throwing — see that function's comment);
 * this predicate exists to give `searchRpo`'s blanket `if (!res.ok) throw`
 * the same discrimination, since RPO's live API doesn't have an equivalent
 * documented business-logic-error shape to special-case the way ARES does.
 */
function isUpstreamHealthFailure(err: unknown): boolean {
  if (err instanceof UpstreamStatusError) {
    // A 4xx OTHER than 429 means our own request/query was rejected — not a
    // sign RPO itself is unhealthy. 429 (the upstream rate-limiting our
    // egress IP) and any 5xx ARE genuine health signals.
    return err.status >= 500 || err.status === 429;
  }
  // Network errors, timeouts (AbortError from AbortSignal.timeout), and
  // malformed/unexpected-response-shape errors (thrown by parseJsonLenient /
  // the "unexpected ... response shape" branches above) are all genuine
  // signals that something is wrong with the call itself, not the query.
  return true;
}

/* ------------------------------------------------------------------------ */
/* Merge + orchestration                                                     */
/* ------------------------------------------------------------------------ */

/** Dedupe by `(country, ico)`, preserving input order, capped at `MAX_MERGED_RESULTS`. */
export function mergeCompanyResults(matches: CompanyMatch[]): CompanyMatch[] {
  const seen = new Set<string>();
  const out: CompanyMatch[] = [];
  for (const m of matches) {
    const key = `${m.country}:${m.ico}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
    if (out.length >= MAX_MERGED_RESULTS) break;
  }
  return out;
}

export interface CompanyLookupResult {
  results: CompanyMatch[];
  /** true when at least one attempted source failed/timed out/was breaker-skipped — the other source's results (if any) are still returned (Promise.allSettled: "výpadek jednoho nesmí shodit druhý"). */
  degraded: boolean;
}

/**
 * Looks up `q` against ARES and/or RPO in parallel depending on `country`.
 * Never throws — a failed/timed-out/breaker-open source is reflected in
 * `degraded`, not a rejected promise, so the route handler can always answer
 * 200. See the module doc's "Circuit breaker" bullet — a source whose
 * breaker is open is skipped WITHOUT a fetch call at all (checked before the
 * task is even pushed onto `tasks`), not merely timed out.
 */
export async function lookupCompany(
  q: string,
  country: 'cz' | 'sk' | 'all',
): Promise<CompanyLookupResult> {
  const wantCz = country === 'cz' || country === 'all';
  const wantSk = country === 'sk' || country === 'all';

  // Both breaker checks run in parallel (code-review finding M6, Vlna 7) —
  // previously `await checkBreaker('ares')` fully completed before the RPO
  // branch was even reached, serializing two independent Redis round trips
  // ahead of two upstream fetches that are supposed to start together.
  const [aresStatus, rpoStatus] = await Promise.all([
    wantCz ? checkBreaker('ares') : Promise.resolve<BreakerStatus>({ open: false, recentFailures: 0, degraded: false }),
    wantSk ? checkBreaker('rpo') : Promise.resolve<BreakerStatus>({ open: false, recentFailures: 0, degraded: false }),
  ]);

  const tasks: Promise<CompanyMatch[]>[] = [];
  let breakerSkipped = false;

  if (wantCz) {
    if (aresStatus.open) {
      breakerSkipped = true;
      console.warn('[company-lookup] ARES circuit breaker open — skipping call');
    } else {
      const timeoutMs = aresStatus.degraded ? ARES_TIMEOUT_MS_REDUCED : ARES_TIMEOUT_MS;
      tasks.push(withBreaker('ares', () => searchAres(q, AbortSignal.timeout(timeoutMs)), isUpstreamHealthFailure));
    }
  }
  if (wantSk) {
    if (rpoStatus.open) {
      breakerSkipped = true;
      console.warn('[company-lookup] RPO circuit breaker open — skipping call');
    } else {
      const timeoutMs = rpoStatus.degraded ? RPO_TIMEOUT_MS_REDUCED : RPO_TIMEOUT_MS;
      tasks.push(withBreaker('rpo', () => searchRpo(q, AbortSignal.timeout(timeoutMs)), isUpstreamHealthFailure));
    }
  }

  const settled = await Promise.allSettled(tasks);
  let degraded = breakerSkipped;
  const all: CompanyMatch[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      all.push(...s.value);
    } else {
      degraded = true;
      console.warn('[company-lookup] source failed:', (s.reason as Error)?.message ?? s.reason);
    }
  }
  return { results: mergeCompanyResults(all), degraded };
}
