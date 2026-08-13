import 'server-only';

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
const FETCH_TIMEOUT_MS = 5_000;

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
    throw new Error(`RPO http ${res.status}`);
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
  /** true when at least one attempted source failed/timed out — the other source's results (if any) are still returned (Promise.allSettled: "výpadek jednoho nesmí shodit druhý"). */
  degraded: boolean;
}

/**
 * Looks up `q` against ARES and/or RPO in parallel depending on `country`.
 * Never throws — a failed/timed-out source is reflected in `degraded`, not
 * a rejected promise, so the route handler can always answer 200.
 */
export async function lookupCompany(
  q: string,
  country: 'cz' | 'sk' | 'all',
): Promise<CompanyLookupResult> {
  const wantCz = country === 'cz' || country === 'all';
  const wantSk = country === 'sk' || country === 'all';

  const tasks: Promise<CompanyMatch[]>[] = [];
  if (wantCz) tasks.push(searchAres(q, AbortSignal.timeout(FETCH_TIMEOUT_MS)));
  if (wantSk) tasks.push(searchRpo(q, AbortSignal.timeout(FETCH_TIMEOUT_MS)));

  const settled = await Promise.allSettled(tasks);
  let degraded = false;
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
