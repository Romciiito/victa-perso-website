import 'server-only';
import { redis } from './redis';

/**
 * Global (not per-IP) circuit breaker for `/api/company-lookup`'s two
 * upstreams — ARES (CZ) and RPO (SK) — Vlna 7 abuse-surface hardening
 * (docs/security/abuse-surface.md).
 *
 * Why global, not per-IP: `company_lookup`'s existing rate limiter
 * (rate-limit.ts, 30/60s) is per-IP and protects against one abusive client.
 * It does NOT protect against the case this module exists for — many
 * DIFFERENT IPs (or a slow/degraded upstream on its own, no attacker
 * required) each opening a Vercel Function that then waits up to
 * `RPO_TIMEOUT_MS` (12s, see `company-lookup.ts`) for a source that's
 * currently failing. A per-IP limiter can't see that pattern; a global
 * breaker can, and stops issuing new upstream calls entirely once a source
 * has clearly gone bad — protecting both this project's function
 * compute-seconds AND the upstream registry from a hammering-while-down
 * pattern.
 *
 * Design: three Redis keys per source.
 *   - `cb:{source}:fail` — a fixed-window failure counter (INCR + EXPIRE,
 *     same primitive style as `rate-limit.ts`'s chat limiters). Reset to 0
 *     (via DEL) on any success.
 *   - `cb:{source}:open` — presence = breaker is open. Set with a TTL of
 *     `COOLDOWN_S`; the key's own expiry IS the cooldown timer, so there's
 *     no separate "open_until" timestamp to compute or drift-check.
 *   - `cb:{source}:degraded` — presence = "use the reduced timeout" (see
 *     `degraded` on `BreakerStatus` below for why this is a separate key
 *     from `fail`, not just `recentFailures > 0`).
 *
 * IMPORTANT — which errors count as a "failure" here: `withBreaker`'s caller
 * passes an `isFailure` predicate (default: every rejection counts). Callers
 * with an upstream that can reject a request for reasons that are the
 * CALLER's fault (a malformed query, e.g.) — not a sign the upstream itself
 * is unhealthy — MUST pass a predicate that excludes those (code-review
 * finding I3, Vlna 7): this breaker is GLOBAL, so counting a caller-fault
 * rejection toward it would let any single visitor's bad input degrade the
 * feature for every other visitor. See `company-lookup.ts`'s
 * `isUpstreamHealthFailure` for the concrete discrimination it applies.
 *
 * Fail-open throughout (Redis errors never open a breaker, never block a
 * call) — this module exists purely as a cost/resilience optimization, the
 * same posture as the `company_lookup` rate limiter it sits next to; a Redis
 * hiccup must not disable the anti-fake-lead verification feature.
 */

export type BreakerSource = 'ares' | 'rpo';

/** Consecutive (failure-predicate-passing) failures within FAILURE_WINDOW_S before the breaker trips open. */
export const FAILURE_THRESHOLD = 5;
/** Rolling window the failure counter lives in before auto-resetting. */
const FAILURE_WINDOW_S = 60;
/** How long a tripped breaker stays open before the next call is allowed to try again. */
const COOLDOWN_S = 120;
/**
 * TTL for the `degraded` marker — deliberately longer than `COOLDOWN_S`
 * (code-review finding M3, Vlna 7): `fail`'s TTL (`FAILURE_WINDOW_S`, 60s) is
 * SHORTER than `open`'s TTL (`COOLDOWN_S`, 120s), so by the time a tripped
 * breaker's cooldown ends, the raw failure counter has ALREADY reset to 0 —
 * without a marker that outlives `open`, the very first probe after a trip
 * would get the FULL timeout instead of the reduced one, at exactly the
 * moment the source has most recently proven itself unhealthy. This key
 * exists purely to survive that gap.
 */
const DEGRADED_GRACE_S = COOLDOWN_S + FAILURE_WINDOW_S;

export interface BreakerStatus {
  open: boolean;
  recentFailures: number;
  /**
   * True when this source has recently shown trouble — either currently
   * accumulating failures (`recentFailures > 0`, below the trip threshold)
   * or having just come out of a full trip (see `DEGRADED_GRACE_S` above).
   * Callers should use a reduced timeout while this is true.
   */
  degraded: boolean;
}

function failKey(source: BreakerSource): string {
  return `cb:${source}:fail`;
}
function openKey(source: BreakerSource): string {
  return `cb:${source}:open`;
}
function degradedKey(source: BreakerSource): string {
  return `cb:${source}:degraded`;
}

/** Reads the current breaker state for `source`. Fails open (`{ open: false, recentFailures: 0, degraded: false }`) on a Redis error. */
export async function checkBreaker(source: BreakerSource): Promise<BreakerStatus> {
  try {
    const [openFlag, failCountRaw, degradedFlag] = await Promise.all([
      redis.get<string>(openKey(source)),
      redis.get<string>(failKey(source)),
      redis.get<string>(degradedKey(source)),
    ]);
    const parsed = failCountRaw ? Number(failCountRaw) : 0;
    const recentFailures = Number.isFinite(parsed) ? parsed : 0;
    return {
      open: Boolean(openFlag),
      recentFailures,
      degraded: recentFailures > 0 || Boolean(degradedFlag),
    };
  } catch (err) {
    console.warn(`[circuit-breaker] ${source} check fail-open:`, (err as Error).message);
    return { open: false, recentFailures: 0, degraded: false };
  }
}

/** Resets `source`'s failure counter AND its degraded marker — call after a call to that upstream succeeds; a real success means the source has recovered. */
export async function recordSuccess(source: BreakerSource): Promise<void> {
  try {
    await Promise.all([redis.del(failKey(source)), redis.del(degradedKey(source))]);
  } catch (err) {
    console.warn(`[circuit-breaker] ${source} recordSuccess failed:`, (err as Error).message);
  }
}

/** Increments `source`'s failure counter, tripping the breaker open (and setting the degraded marker) once `FAILURE_THRESHOLD` is reached. */
export async function recordFailure(source: BreakerSource): Promise<void> {
  try {
    const count = await redis.incr(failKey(source));
    if (count === 1) {
      await redis.expire(failKey(source), FAILURE_WINDOW_S);
    }
    if (count >= FAILURE_THRESHOLD) {
      await Promise.all([
        redis.set(openKey(source), '1', { ex: COOLDOWN_S }),
        redis.set(degradedKey(source), '1', { ex: DEGRADED_GRACE_S }),
      ]);
    }
  } catch (err) {
    console.warn(`[circuit-breaker] ${source} recordFailure failed:`, (err as Error).message);
  }
}

/**
 * Runs `fn`, recording success/failure against `source`'s breaker either
 * way. Does NOT check whether the breaker is open first — callers check
 * `checkBreaker(source).open` themselves BEFORE deciding whether to call
 * this at all (see `company-lookup.ts`), because "skip the call entirely"
 * needs to happen before an `AbortSignal.timeout` is even constructed, one
 * level up from where this function's `fn` closure is built.
 *
 * `isFailure` decides whether a given rejection counts toward the breaker's
 * failure counter at all — defaults to "every rejection counts" (the
 * original, simpler behavior), but a global breaker should almost always be
 * given a real predicate by its caller; see the module doc's "IMPORTANT"
 * paragraph above.
 */
export async function withBreaker<T>(
  source: BreakerSource,
  fn: () => Promise<T>,
  isFailure: (err: unknown) => boolean = () => true,
): Promise<T> {
  try {
    const result = await fn();
    await recordSuccess(source);
    return result;
  } catch (err) {
    if (isFailure(err)) {
      await recordFailure(source);
    }
    throw err;
  }
}
