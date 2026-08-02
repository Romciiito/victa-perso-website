import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  signNewsletterConfirmToken,
  verifyNewsletterConfirmToken,
  isNewsletterConfirmTokenFresh,
  NEWSLETTER_CONFIRM_MAX_AGE_MS,
} = await import('../newsletter-confirm-token');

const SECRET = 'test-secret-do-not-use-in-prod';
const OTHER_SECRET = 'a-different-secret';

const basePayload = {
  email: 'jan@example.com',
  locale: 'cs' as const,
  ts: Date.parse('2026-08-02T12:00:00.000Z'),
};

describe('signNewsletterConfirmToken / verifyNewsletterConfirmToken', () => {
  it('round-trips a valid token', () => {
    const token = signNewsletterConfirmToken(basePayload, SECRET);
    const result = verifyNewsletterConfirmToken(token, SECRET);
    expect(result).toEqual(basePayload);
  });

  it('round-trips optional UTM/source fields', () => {
    const payload = {
      ...basePayload,
      utm_source: 'newsletter-ad',
      utm_medium: 'cpc',
      utm_campaign: 'launch',
      source_url: 'https://victaagency.com/cs/kontakt',
    };
    const token = signNewsletterConfirmToken(payload, SECRET);
    expect(verifyNewsletterConfirmToken(token, SECRET)).toEqual(payload);
  });

  it('rejects a token verified with the wrong secret', () => {
    const token = signNewsletterConfirmToken(basePayload, SECRET);
    expect(verifyNewsletterConfirmToken(token, OTHER_SECRET)).toBeNull();
  });

  it('rejects a token whose payload was tampered with (email swap) while keeping the original signature', () => {
    const token = signNewsletterConfirmToken(basePayload, SECRET);
    const [payloadB64, sig] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...basePayload, email: 'attacker@evil.com' }),
      'utf8',
    ).toString('base64url');
    const tampered = `${tamperedPayload}.${sig}`;
    expect(tampered).not.toBe(token);
    expect(verifyNewsletterConfirmToken(tampered, SECRET)).toBeNull();
  });

  it('rejects a token with a flipped signature character', () => {
    const token = signNewsletterConfirmToken(basePayload, SECRET);
    const [payloadB64, sig] = token.split('.');
    const flipped = sig[0] === 'a' ? 'b' + sig.slice(1) : 'a' + sig.slice(1);
    expect(verifyNewsletterConfirmToken(`${payloadB64}.${flipped}`, SECRET)).toBeNull();
  });

  it('rejects malformed tokens (no dot, empty, non-hex signature, garbage)', () => {
    expect(verifyNewsletterConfirmToken('', SECRET)).toBeNull();
    expect(verifyNewsletterConfirmToken('no-dot-here', SECRET)).toBeNull();
    expect(verifyNewsletterConfirmToken('payload.', SECRET)).toBeNull();
    expect(verifyNewsletterConfirmToken('.signature', SECRET)).toBeNull();
    expect(verifyNewsletterConfirmToken('payload.not-hex-!!!!', SECRET)).toBeNull();
    expect(verifyNewsletterConfirmToken('cGF5bG9hZA==.deadbeef', SECRET)).toBeNull(); // wrong-length sig
  });

  it('rejects a syntactically valid but non-JSON payload', () => {
    const badPayloadB64 = Buffer.from('not valid json', 'utf8').toString('base64url');
    // Sign this same bad payload for real so it passes signature verification
    // and we're specifically exercising the JSON.parse failure path.
    const token = signNewsletterConfirmToken(
      // @ts-expect-error — deliberately signing a non-conforming payload for the test
      'not valid json',
      SECRET,
    );
    void badPayloadB64;
    expect(verifyNewsletterConfirmToken(token, SECRET)).toBeNull();
  });

  it('rejects a payload missing required fields (e.g. no locale)', () => {
    const token = signNewsletterConfirmToken(
      // @ts-expect-error — deliberately missing `locale` for the test
      { email: 'jan@example.com', ts: Date.now() },
      SECRET,
    );
    expect(verifyNewsletterConfirmToken(token, SECRET)).toBeNull();
  });

  it('rejects an invalid locale value', () => {
    const token = signNewsletterConfirmToken(
      // @ts-expect-error — deliberately invalid `locale` for the test
      { ...basePayload, locale: 'de' },
      SECRET,
    );
    expect(verifyNewsletterConfirmToken(token, SECRET)).toBeNull();
  });
});

describe('isNewsletterConfirmTokenFresh', () => {
  it('is fresh at ts = now', () => {
    const now = Date.now();
    expect(isNewsletterConfirmTokenFresh({ ...basePayload, ts: now }, now)).toBe(true);
  });

  it('is fresh just under the 48h boundary', () => {
    const now = Date.now();
    const ts = now - (NEWSLETTER_CONFIRM_MAX_AGE_MS - 1000);
    expect(isNewsletterConfirmTokenFresh({ ...basePayload, ts }, now)).toBe(true);
  });

  it('is exactly fresh at the 48h boundary (inclusive)', () => {
    const now = Date.now();
    const ts = now - NEWSLETTER_CONFIRM_MAX_AGE_MS;
    expect(isNewsletterConfirmTokenFresh({ ...basePayload, ts }, now)).toBe(true);
  });

  it('is stale just over the 48h boundary', () => {
    const now = Date.now();
    const ts = now - (NEWSLETTER_CONFIRM_MAX_AGE_MS + 1000);
    expect(isNewsletterConfirmTokenFresh({ ...basePayload, ts }, now)).toBe(false);
  });

  it('is stale for a timestamp in the future (clock-skew defensive)', () => {
    const now = Date.now();
    const ts = now + 60_000;
    expect(isNewsletterConfirmTokenFresh({ ...basePayload, ts }, now)).toBe(false);
  });
});
