import { describe, it, expect } from 'vitest';
import { contactSchema } from '../contact-schema';
import { newsletterSchema } from '../newsletter-schema';

const validContact = {
  name: 'Jan Novák',
  email: 'jan@example.com',
  company: '',
  phone: '',
  message: 'Potřebujeme nový e-shop a napojení na skladový systém.',
  gdpr_consent: true,
  honeypot: '',
  turnstile_token: 'turnstile-not-configured',
  locale: 'cs',
};

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    expect(contactSchema.safeParse(validContact).success).toBe(true);
  });

  it('accepts empty-string budget_tier/service_interest (untouched <select>) and normalizes them to undefined', () => {
    const r = contactSchema.safeParse({
      ...validContact,
      budget_tier: '',
      service_interest: '',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.budget_tier).toBeUndefined();
      expect(r.data.service_interest).toBeUndefined();
    }
  });

  it('accepts real enum values for budget_tier/service_interest', () => {
    const r = contactSchema.safeParse({
      ...validContact,
      budget_tier: '5k-25k',
      service_interest: 'ai',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.budget_tier).toBe('5k-25k');
      expect(r.data.service_interest).toBe('ai');
    }
  });

  it('rejects unknown enum values', () => {
    expect(
      contactSchema.safeParse({ ...validContact, budget_tier: 'millions' }).success,
    ).toBe(false);
  });

  it('requires turnstile_token to be non-empty', () => {
    expect(
      contactSchema.safeParse({ ...validContact, turnstile_token: '' }).success,
    ).toBe(false);
  });

  it('requires gdpr_consent to be literally true', () => {
    expect(contactSchema.safeParse({ ...validContact, gdpr_consent: false }).success).toBe(false);
  });

  it('accepts a filled honeypot at the schema layer (route silent-accepts it)', () => {
    const r = contactSchema.safeParse({ ...validContact, honeypot: 'bot' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.honeypot).toBe('bot');
  });

  it('requires message of at least 20 chars', () => {
    expect(contactSchema.safeParse({ ...validContact, message: 'krátká' }).success).toBe(false);
  });
});

describe('newsletterSchema', () => {
  const valid = {
    email: 'jan@example.com',
    locale: 'cs',
    form_location: 'footer',
    gdpr_consent: true,
    honeypot: '',
    turnstile_token: 'turnstile-not-configured',
  };

  it('accepts a valid signup', () => {
    expect(newsletterSchema.safeParse(valid).success).toBe(true);
  });

  it('requires turnstile_token to be non-empty', () => {
    expect(newsletterSchema.safeParse({ ...valid, turnstile_token: '' }).success).toBe(false);
  });

  it('requires gdpr_consent', () => {
    expect(newsletterSchema.safeParse({ ...valid, gdpr_consent: false }).success).toBe(false);
  });
});
