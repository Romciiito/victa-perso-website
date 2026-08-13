import { describe, it, expect } from 'vitest';
import {
  DEFAULT_COUNTRY,
  detectInternationalNumber,
  formatNationalAsYouType,
  getCountryOptions,
  toE164,
} from '../phone-utils';

describe('detectInternationalNumber', () => {
  it('detects the spec\'s literal example: +84 92198 8912 -> Vietnam, prefix stripped', () => {
    const result = detectInternationalNumber('+84 92198 8912');
    expect(result).not.toBeNull();
    expect(result?.country).toBe('VN');
    // The exact spacing/trunk-prefix libphonenumber-js chooses for VN's
    // national format isn't the contract — what matters is (a) the +84
    // prefix is gone from the displayed remainder and (b) the national
    // text round-trips back to the exact same E.164 number via `toE164`.
    // (Verified live with libphonenumber-js: VN's `formatNational()` is
    // "0921 988 912" — a leading trunk "0" is standard for VN domestic
    // dialing and is NOT part of the +84 prefix.)
    expect(result?.national.startsWith('+84')).toBe(false);
    expect(result && toE164('VN', result.national)).toBe('+84921988912');
  });

  it('detects a 00-prefixed CZ number (00420777933112) the same as a + number', () => {
    const result = detectInternationalNumber('00420777933112');
    expect(result?.country).toBe('CZ');
    expect(result?.national.replace(/\D/g, '')).toBe('777933112');
  });

  it('detects a 00-prefixed number with spaces (00 420 777 933 112)', () => {
    const result = detectInternationalNumber('00 420 777 933 112');
    expect(result?.country).toBe('CZ');
  });

  it('returns null for a plain national number with no prefix', () => {
    expect(detectInternationalNumber('777933112')).toBeNull();
  });

  it('returns null while a "+" prefix is still too short to resolve a country', () => {
    // Mid-typing — not enough digits yet to know the calling code.
    expect(detectInternationalNumber('+8')).toBeNull();
  });

  it('detects a Slovak number (+421...)', () => {
    const result = detectInternationalNumber('+421910123456');
    expect(result?.country).toBe('SK');
  });
});

describe('toE164', () => {
  it('converts a CZ national number to E.164', () => {
    expect(toE164('CZ', '777 933 112')).toBe('+420777933112');
  });

  it('converts a Vietnamese national number to E.164', () => {
    expect(toE164('VN', '921988912')).toBe('+84921988912');
  });

  it('returns "" for an empty national number', () => {
    expect(toE164('CZ', '')).toBe('');
  });

  it('falls back to naive concatenation for a too-short/unparseable partial number', () => {
    // libphonenumber-js can't fully parse "7" as a CZ number yet — the naive
    // fallback still produces a well-formed E.164-shaped string so the field
    // is never in a non-E.164 state while the user is still typing.
    const result = toE164('CZ', '7');
    expect(result.startsWith('+420')).toBe(true);
    expect(result).toBe('+4207');
  });
});

describe('formatNationalAsYouType', () => {
  it('never throws and returns a string for arbitrary input', () => {
    expect(() => formatNationalAsYouType('CZ', '777933112')).not.toThrow();
    expect(typeof formatNationalAsYouType('CZ', '777933112')).toBe('string');
  });
});

describe('getCountryOptions', () => {
  it('puts CZ and SK first, in that order', () => {
    const options = getCountryOptions('cs');
    expect(options[0]?.code).toBe('CZ');
    expect(options[1]?.code).toBe('SK');
  });

  it('includes a plausible full list (>100 countries) and correct calling codes for CZ/SK', () => {
    const options = getCountryOptions('cs');
    expect(options.length).toBeGreaterThan(100);
    expect(options.find((o) => o.code === 'CZ')?.callingCode).toBe('420');
    expect(options.find((o) => o.code === 'SK')?.callingCode).toBe('421');
  });

  it('sorts the rest alphabetically by localized name', () => {
    const options = getCountryOptions('cs');
    const rest = options.slice(2).map((o) => o.name);
    const sorted = [...rest].sort((a, b) => a.localeCompare(b, 'cs'));
    expect(rest).toEqual(sorted);
  });
});

describe('DEFAULT_COUNTRY', () => {
  it('is CZ', () => {
    expect(DEFAULT_COUNTRY).toBe('CZ');
  });
});
