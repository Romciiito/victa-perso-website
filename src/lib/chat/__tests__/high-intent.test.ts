import { describe, it, expect } from 'vitest';
import { detectHighValueIntent } from '../high-intent';

describe('detectHighValueIntent', () => {
  it('is false with fewer than 3 total keyword mentions', () => {
    const messages = [
      { role: 'user', content: 'Chci audit webu' },
      { role: 'assistant', content: 'Rádi pomůžeme.' },
      { role: 'user', content: 'A co integrace?' },
    ];
    expect(detectHighValueIntent(messages)).toBe(false);
  });

  it('is true with 3+ total mentions across user messages (CS keywords)', () => {
    const messages = [
      { role: 'user', content: 'Chci komplexní audit.' },
      { role: 'assistant', content: 'Jasně, řekněte více.' },
      { role: 'user', content: 'Potřebuji integrace se systémy.' },
      { role: 'user', content: 'A taky digitální transformace.' },
    ];
    expect(detectHighValueIntent(messages)).toBe(true);
  });

  it('is true with 3+ total mentions (EN keywords)', () => {
    const messages = [
      { role: 'user', content: 'We need a comprehensive audit.' },
      { role: 'user', content: 'Also an integration with our ERP.' },
      { role: 'user', content: 'This is a business transformation project.' },
    ];
    expect(detectHighValueIntent(messages)).toBe(true);
  });

  it('does NOT count mentions inside assistant messages', () => {
    const messages = [
      { role: 'assistant', content: 'audit audit audit komplexní integrace transformace' },
      { role: 'user', content: 'ok' },
    ];
    expect(detectHighValueIntent(messages)).toBe(false);
  });

  it('is case-insensitive', () => {
    const messages = [
      { role: 'user', content: 'AUDIT Audit' },
      { role: 'user', content: 'INTEGRACE' },
    ];
    expect(detectHighValueIntent(messages)).toBe(true);
  });

  it('matches "komplexni" without diacritics', () => {
    const messages = [
      { role: 'user', content: 'chci komplexni reseni' },
      { role: 'user', content: 'audit prosim' },
      { role: 'user', content: 'integrace systemu' },
    ];
    expect(detectHighValueIntent(messages)).toBe(true);
  });

  it('returns false for an empty message list', () => {
    expect(detectHighValueIntent([])).toBe(false);
  });

  it('counts multiple mentions within a single message', () => {
    const messages = [{ role: 'user', content: 'audit, audit a zase audit' }];
    expect(detectHighValueIntent(messages)).toBe(true);
  });
});
