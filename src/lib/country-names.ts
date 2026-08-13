/**
 * Localized country display names — shared by the phone-input country select
 * (Vlna 6) and the company-autocomplete "verified" badge (Vlna 6, shows which
 * registry — CZ/SK — a match came from). Uses the platform's built-in
 * `Intl.DisplayNames` (Node 20+ / every evergreen browser) rather than a
 * bundled country-name dataset — zero bytes added to the client bundle for
 * something the runtime already knows how to do (claude-rules.md "prefers
 * small dependency tree", security-model.md §4.8).
 */

const cache = new Map<string, Intl.DisplayNames>();

function displayNamesFor(locale: 'cs' | 'en'): Intl.DisplayNames {
  const existing = cache.get(locale);
  if (existing) return existing;
  const dn = new Intl.DisplayNames([locale], { type: 'region' });
  cache.set(locale, dn);
  return dn;
}

/**
 * Returns the localized country name for an ISO 3166-1 alpha-2 code
 * (e.g. `countryDisplayName('VN', 'cs')` → "Vietnam"). Falls back to the raw
 * code if the runtime can't resolve it (e.g. an unrecognized/reserved code) —
 * this must never throw, it feeds directly into `<option>` labels and badge
 * text.
 */
export function countryDisplayName(code: string, locale: 'cs' | 'en'): string {
  try {
    return displayNamesFor(locale).of(code) ?? code;
  } catch {
    return code;
  }
}
