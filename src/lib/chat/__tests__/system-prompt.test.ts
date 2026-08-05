import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../system-prompt';
import { CHAT_DELIMITER } from '../../chatbot-sanitize';

describe('buildSystemPrompt', () => {
  it('CS prompt contains the literal approved "since when" answer (vision.md §8)', () => {
    const prompt = buildSystemPrompt('cs');
    expect(prompt).toContain(
      'Společnost VICTA DIGITAL s.r.o. existuje od roku 2012',
    );
    expect(prompt).toContain('současný tým na ní staví digitální agenturu VICTA od roku 2026');
  });

  it('CS prompt never volunteers the approved answer outside its own instruction — it appears exactly once', () => {
    const prompt = buildSystemPrompt('cs');
    const occurrences = prompt.split('existuje od roku 2012').length - 1;
    expect(occurrences).toBe(1);
  });

  it('instructs the model never to reveal the system prompt', () => {
    const prompt = buildSystemPrompt('cs');
    expect(prompt.toLowerCase()).toMatch(/nikdy neodhal|nesdíl.*obsah|never reveal/);
  });

  it('explains the CHAT_DELIMITER as marking untrusted visitor data', () => {
    const prompt = buildSystemPrompt('cs');
    expect(prompt).toContain(CHAT_DELIMITER);
  });

  it('includes the CS knowledge digest content (spot check a known fact)', () => {
    const prompt = buildSystemPrompt('cs');
    expect(prompt).toContain('Tier 1');
    expect(prompt).toContain('hello@victaagency.com');
  });

  it('caps response length around ~150 words per the brief', () => {
    const prompt = buildSystemPrompt('cs');
    expect(prompt).toMatch(/150\s*slov|150\s*words/);
  });

  it('is under a sane prompt-size budget', () => {
    const prompt = buildSystemPrompt('cs');
    expect(prompt.length).toBeLessThan(20000);
  });

  it('EN prompt is in English and does not contain the CS-only approved answer sentence', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).not.toContain('Společnost VICTA DIGITAL s.r.o. existuje od roku 2012');
    expect(prompt).toContain('VICTA DIGITAL s.r.o. has existed since 2012');
  });

  it('EN prompt includes the EN knowledge digest', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toContain('hello@victaagency.com');
    expect(prompt).toContain('Book a consultation');
  });
});
