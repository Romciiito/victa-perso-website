/**
 * Cal.com booking configuration — the single source of truth for event-type
 * slugs (D-010). The frontend CTAs, the `/api/booking-webhook` tier mapping,
 * and `docs/setup/calcom-event-types.md` must all agree with THIS file; when
 * provisioning the Cal.com account, create event types with exactly these slugs.
 *
 * Historical note: before D-010 the frontend, the webhook, and the setup doc
 * each used a different slug convention (three-way mismatch) — paid-tier
 * bookings had no working code path at all.
 */

/** GA4 funnel attribution keys — one per Cal.com event type. */
export type BookingType = 'audit_t1' | 'audit_t2' | 'audit_t3' | 'scoping_call';

/** Cal.com event-type slugs, keyed by booking type. */
export const CAL_EVENTS: Record<BookingType, string> = {
  scoping_call: 'free-scoping-call',
  audit_t1: 'tier-1-audit',
  audit_t2: 'tier-2-audit',
  audit_t3: 'tier-3-audit',
};

/** `booking_events.audit_tier` values (supabase/migrations/001). */
export type AuditTier = 'tier_1' | 'tier_2' | 'tier_3' | 'free_scoping';

const TIER_BY_EVENT_SLUG: Record<string, AuditTier> = {
  [CAL_EVENTS.audit_t1]: 'tier_1',
  [CAL_EVENTS.audit_t2]: 'tier_2',
  [CAL_EVENTS.audit_t3]: 'tier_3',
  [CAL_EVENTS.scoping_call]: 'free_scoping',
};

/** Maps a Cal.com webhook `eventType.slug` to the stored audit tier. */
export function tierFromEventSlug(slug?: string): AuditTier | null {
  if (!slug) return null;
  return TIER_BY_EVENT_SLUG[slug] ?? null;
}

/**
 * The scaffold default for NEXT_PUBLIC_CALCOM_USERNAME. As long as the env var
 * is unset or still equals this placeholder, Cal.com is treated as
 * not-provisioned and every booking CTA falls back to the contact form.
 */
export const CALCOM_PLACEHOLDER_USERNAME = 'victa';

export function calIsConfigured(
  username: string | undefined = process.env.NEXT_PUBLIC_CALCOM_USERNAME,
): username is string {
  return Boolean(username) && username !== CALCOM_PLACEHOLDER_USERNAME;
}
