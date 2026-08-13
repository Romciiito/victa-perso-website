import { describe, it, expect } from 'vitest';
import { contactSchema } from '../contact-schema';
import { newsletterSchema } from '../newsletter-schema';

const validContact = {
  name: 'Jan Novák',
  email: 'jan@example.com',
  company: '',
  // Vlna 6: phone is now required + must be a valid E.164 number — this is
  // what `PhoneInput` always emits (see phone-utils.test.ts for the
  // detection/normalization logic that produces this shape).
  phone: '+420777933112',
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

  describe('phone (Vlna 6 — now required + E.164-validated)', () => {
    it('rejects an empty phone', () => {
      const r = contactSchema.safeParse({ ...validContact, phone: '' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.flatten().fieldErrors.phone?.[0]).toBe(
          'Zadejte platné telefonní číslo s předvolbou.',
        );
      }
    });

    it('rejects a phone with no country code (not E.164)', () => {
      expect(contactSchema.safeParse({ ...validContact, phone: '777933112' }).success).toBe(false);
    });

    it('rejects a structurally-invalid E.164 string (too few digits for the country)', () => {
      expect(contactSchema.safeParse({ ...validContact, phone: '+4207' }).success).toBe(false);
    });

    it('accepts a valid CZ E.164 number', () => {
      expect(contactSchema.safeParse({ ...validContact, phone: '+420777933112' }).success).toBe(true);
    });

    it('accepts a valid international (non-CZ/SK) E.164 number — e.g. Vietnam', () => {
      expect(contactSchema.safeParse({ ...validContact, phone: '+84921988912' }).success).toBe(true);
    });

    it('returns the English error message when locale is "en"', () => {
      const r = contactSchema.safeParse({ ...validContact, phone: '', locale: 'en' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.flatten().fieldErrors.phone?.[0]).toBe(
          'Enter a valid phone number with a country code.',
        );
      }
    });
  });

  describe('company_ico / company_country (Vlna 6 — ARES/RPO anti-fake-lead verification)', () => {
    it('accepts a submission with no company verification fields at all (unverified/free-typed company)', () => {
      const r = contactSchema.safeParse(validContact);
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.company_ico).toBeUndefined();
        expect(r.data.company_country).toBeUndefined();
      }
    });

    it('accepts empty-string company_ico/company_country (untouched fields) and normalizes them to undefined', () => {
      const r = contactSchema.safeParse({ ...validContact, company_ico: '', company_country: '' });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.company_ico).toBeUndefined();
        expect(r.data.company_country).toBeUndefined();
      }
    });

    it('accepts a verified CZ match', () => {
      const r = contactSchema.safeParse({
        ...validContact,
        company_ico: '28859511',
        company_country: 'CZ',
      });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.company_ico).toBe('28859511');
        expect(r.data.company_country).toBe('CZ');
      }
    });

    it('accepts a verified SK match', () => {
      const r = contactSchema.safeParse({
        ...validContact,
        company_ico: '31340628',
        company_country: 'SK',
      });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.company_country).toBe('SK');
    });

    it('rejects an unknown company_country value', () => {
      expect(
        contactSchema.safeParse({ ...validContact, company_ico: '123', company_country: 'US' })
          .success,
      ).toBe(false);
    });
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
