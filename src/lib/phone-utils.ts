/**
 * Phone number country-detection + E.164 normalization (Vlna 6, contact form
 * phone field). Pure functions only — no React, no DOM — so they're usable
 * both from the client `PhoneInput` component (`src/components/forms/phone-input.tsx`)
 * and unit-tested directly without mounting anything.
 *
 * Uses `libphonenumber-js/min` (not the default `libphonenumber-js` export,
 * which bundles the larger `max` metadata set) — the `/min` metadata is
 * ~45% smaller and sufficient for parsing + national-format display; it does
 * NOT carry the extended geocoding/carrier data the `max` build has, which
 * this component never needs (spec ask: "POZOR na bundle").
 */
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';
import { countryDisplayName } from './country-names';

/** Default selection — VICTA's primary market (vision.md §4, CZ/SK-first). */
export const DEFAULT_COUNTRY: CountryCode = 'CZ';

/** CZ/SK pinned first in the select per spec ("CZ, SK jsou primární trh"); rest alphabetical by localized name. */
const PRIMARY_COUNTRIES: CountryCode[] = ['CZ', 'SK'];

export interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
}

/**
 * Full country list from libphonenumber-js metadata, CZ/SK first then the
 * rest alphabetized by the localized display name (not by ISO code — a
 * code-sorted list reads as noise to a human scanning for their country).
 */
export function getCountryOptions(locale: 'cs' | 'en'): CountryOption[] {
  const all = getCountries();
  const rest = all
    .filter((c) => !PRIMARY_COUNTRIES.includes(c))
    .map((code) => ({ code, name: countryDisplayName(code, locale), callingCode: getCountryCallingCode(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const primary = PRIMARY_COUNTRIES.filter((c) => all.includes(c)).map((code) => ({
    code,
    name: countryDisplayName(code, locale),
    callingCode: getCountryCallingCode(code),
  }));

  return [...primary, ...rest];
}

export interface DetectedInternationalNumber {
  country: CountryCode;
  /** National-format display text with the country's calling code already stripped. */
  national: string;
}

/**
 * Detects a pasted/typed full international number and returns the country
 * it belongs to plus the national-format remainder — e.g.
 * `detectInternationalNumber('+84 92198 8912')` → `{ country: 'VN', national: '92198 8912' }`
 * (spec's literal example). Also accepts the `00` international-dialing
 * prefix common in CZ/SK/EU (`00420777933112` → same as `+420777933112`).
 *
 * Returns `null` when the input isn't (yet) a recognizable international
 * number — e.g. the user has only typed `+8` so far — so the caller can
 * leave the current country selection alone until there's enough to decide.
 */
export function detectInternationalNumber(raw: string): DetectedInternationalNumber | null {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith('+') && !trimmed.startsWith('00')) return null;

  const normalized = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;
  const parsed = parsePhoneNumberFromString(normalized);
  if (!parsed?.country) return null;

  return { country: parsed.country, national: parsed.formatNational() };
}

/**
 * Live-formats national-number input as the user types, using the
 * currently-selected country's numbering plan (e.g. `7779331` → `777 933 1`
 * for CZ). Never throws — falls back to the raw input if `AsYouType` can't
 * make sense of it (defensive; the underlying library is well-behaved on any
 * string input, but this is a form field, not a place to risk an uncaught
 * exception ever reaching a visitor).
 */
export function formatNationalAsYouType(country: CountryCode, raw: string): string {
  try {
    return new AsYouType(country).input(raw);
  } catch {
    return raw;
  }
}

/**
 * Converts a (country, national-format-or-raw-digits) pair into an E.164
 * string for the wire (`+420777933112`) — the shape `contact-schema.ts`'s
 * `isValidPhoneNumber` check and the database both expect. Returns `''` when
 * there are no digits to convert (empty field).
 *
 * Falls back to naive `+<callingCode><digits>` concatenation when
 * libphonenumber-js can't fully parse the national text (e.g. still
 * mid-typing, too few digits) — this keeps the field's live value always
 * E.164-shaped for the schema, even before the number is complete/valid;
 * *validity* is the schema's job (`isValidPhoneNumber`), not this
 * formatter's.
 */
export function toE164(country: CountryCode, national: string): string {
  const digits = national.replace(/\D/g, '');
  if (!digits) return '';
  const parsed = parsePhoneNumberFromString(national, country);
  if (parsed) return parsed.number;
  return `+${getCountryCallingCode(country)}${digits}`;
}

/** Re-exported so callers (the component, tests) don't need a second import from the library directly. */
export { parsePhoneNumberFromString, getCountryCallingCode };
export type { CountryCode };
