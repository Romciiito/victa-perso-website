import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { getChatConfigStatus } = await import('../config-gate');

function stubAllPresent() {
  vi.stubEnv('AI_MODEL', 'anthropic/claude-sonnet-4-5');
  vi.stubEnv('AI_GATEWAY_API_KEY', 'gw_test_key');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
}

describe('getChatConfigStatus', () => {
  beforeEach(() => {
    vi.stubEnv('AI_MODEL', '');
    vi.stubEnv('AI_GATEWAY_API_KEY', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is enabled when AI_MODEL + AI_GATEWAY_API_KEY + Upstash are all present', () => {
    stubAllPresent();
    const status = getChatConfigStatus();
    expect(status).toEqual({ enabled: true, missing: [] });
  });

  it('is enabled when AI_GATEWAY_API_KEY is absent but AI_MODEL + Upstash are present (Vercel OIDC path)', () => {
    // On Vercel, AI Gateway auth can come from the platform's OIDC token
    // instead of an explicit env var — there is no local-env signal for
    // that, so the gate treats AI_GATEWAY_API_KEY as optional and does not
    // block on its absence alone.
    vi.stubEnv('AI_MODEL', 'anthropic/claude-sonnet-4-5');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    const status = getChatConfigStatus();
    expect(status.enabled).toBe(true);
  });

  it('is disabled and lists AI_MODEL when missing', () => {
    stubAllPresent();
    vi.stubEnv('AI_MODEL', '');
    const status = getChatConfigStatus();
    expect(status.enabled).toBe(false);
    expect(status.missing).toContain('AI_MODEL');
  });

  it('is disabled and lists both Upstash vars when missing under either name', () => {
    stubAllPresent();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
    const status = getChatConfigStatus();
    expect(status.enabled).toBe(false);
    expect(status.missing).toEqual(
      expect.arrayContaining([
        'UPSTASH_REDIS_REST_URL|KV_REST_API_URL',
        'UPSTASH_REDIS_REST_TOKEN|KV_REST_API_TOKEN',
      ]),
    );
  });

  // Vercel Marketplace injektuje KV_REST_API_* místo UPSTASH_REDIS_REST_* —
  // gate musí uznat i tuhle dvojici, jinak by chatbot na provisionovaném
  // projektu hlásil `disabled` (provisioning 2026-08-13).
  it('is enabled when Redis comes from the Vercel KV_* pair', () => {
    stubAllPresent();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.stubEnv('KV_REST_API_URL', 'https://example.upstash.io');
    vi.stubEnv('KV_REST_API_TOKEN', 'token');
    const status = getChatConfigStatus();
    expect(status.enabled).toBe(true);
    expect(status.missing).toEqual([]);
  });

  it('is disabled when everything is missing', () => {
    const status = getChatConfigStatus();
    expect(status.enabled).toBe(false);
    expect(status.missing.length).toBeGreaterThan(0);
  });
});
