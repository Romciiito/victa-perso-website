import { describe, it, expect } from 'vitest';
import { sanitizeFormString, isValidEmail } from '../sanitize';

/**
 * `hasLoneSurrogate` walks the UTF-16 code units of a string and flags any
 * high surrogate not immediately followed by its low surrogate, or any low
 * surrogate not immediately preceded by its high surrogate — i.e. a string
 * that would fail to round-trip through TextEncoder/JSON/Postgres `text`
 * cleanly. This is the exact defect P2-01 describes: `sanitizeFormString`
 * used to `.slice(0, maxLen)` on raw UTF-16 code units, which can cut an
 * astral character (e.g. an emoji) directly between its two surrogates.
 */
function hasLoneSurrogate(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = s.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      i++; // skip the matched low surrogate
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true; // low surrogate with no preceding high surrogate
    }
  }
  return false;
}

describe('sanitizeFormString', () => {
  it('never truncates in the middle of a surrogate pair (P2-01)', () => {
    // 4 ASCII chars + one astral emoji (2 UTF-16 code units) + 4 more ASCII —
    // truncating at the raw UTF-16 boundary of maxLen=5 used to land exactly
    // on the emoji's high surrogate.
    const raw = 'aaaa\u{1F600}bbbb';
    const result = sanitizeFormString(raw, 5);
    expect(hasLoneSurrogate(result)).toBe(false);
  });

  it('keeps the whole astral character rather than dropping it or splitting it', () => {
    const raw = 'aaaa\u{1F600}bbbb';
    const result = sanitizeFormString(raw, 5);
    expect(result).toBe('aaaa\u{1F600}');
  });

  it('bounds the result to maxLen Unicode code points, not UTF-16 units', () => {
    const raw = 'aaaa\u{1F600}bbbb';
    const result = sanitizeFormString(raw, 5);
    expect(Array.from(result).length).toBeLessThanOrEqual(5);
  });

  it('is a no-op truncation-wise when the string is already short enough', () => {
    expect(sanitizeFormString('hello', 100)).toBe('hello');
  });

  it('still trims and truncates plain ASCII the same as before (regression check)', () => {
    expect(sanitizeFormString('  hello world  ', 5)).toBe('hello');
  });

  it('still strips HTML tags and ASCII control characters', () => {
    expect(sanitizeFormString('<b>hi</b>\x01there', 100)).toBe('hithere');
  });

  it('returns an empty string for non-string input', () => {
    // @ts-expect-error — exercising the runtime guard against non-string input
    expect(sanitizeFormString(null, 10)).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('jan@example.com')).toBe(true);
  });

  it('rejects newline/null-byte injection attempts', () => {
    expect(isValidEmail('jan@example.com\nBcc: evil@example.com')).toBe(false);
    expect(isValidEmail('jan@example.com\x00')).toBe(false);
  });
});
