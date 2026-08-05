import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// `server-only` isn't installed for plain Node/Vitest execution — see
// src/lib/__tests__/rate-limit.test.ts for the same stub.
vi.mock('server-only', () => ({}));

const { isAllowedOrigin, clientIp } = await import('../origin');

function reqWithOrigin(origin: string | null): NextRequest {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return new NextRequest('https://victaagency.com/api/contact', {
    method: 'POST',
    headers,
  });
}

describe('isAllowedOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_URL', '');
    vi.stubEnv('VERCEL_BRANCH_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows the production site hostname', () => {
    expect(isAllowedOrigin(reqWithOrigin('https://victaagency.com'))).toBe(true);
  });

  it('rejects a request with no Origin header', () => {
    expect(isAllowedOrigin(reqWithOrigin(null))).toBe(false);
  });

  it('rejects an arbitrary .vercel.app origin (audit P1-01)', () => {
    expect(isAllowedOrigin(reqWithOrigin('https://some-attacker-project.vercel.app'))).toBe(false);
  });

  it('rejects a malformed origin value', () => {
    expect(isAllowedOrigin(reqWithOrigin('not-a-url'))).toBe(false);
  });

  it('allows VERCEL_URL when set', () => {
    vi.stubEnv('VERCEL_URL', 'victa-git-preview-123.vercel.app');
    expect(isAllowedOrigin(reqWithOrigin('https://victa-git-preview-123.vercel.app'))).toBe(true);
  });

  it('allows VERCEL_BRANCH_URL when set', () => {
    vi.stubEnv('VERCEL_BRANCH_URL', 'victa-branch.vercel.app');
    expect(isAllowedOrigin(reqWithOrigin('https://victa-branch.vercel.app'))).toBe(true);
  });

  it('allows VERCEL_PROJECT_PRODUCTION_URL when set', () => {
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'victa-prod.vercel.app');
    expect(isAllowedOrigin(reqWithOrigin('https://victa-prod.vercel.app'))).toBe(true);
  });

  it('allows localhost outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedOrigin(reqWithOrigin('http://localhost:3000'))).toBe(true);
  });

  it('rejects localhost in production', () => {
    expect(isAllowedOrigin(reqWithOrigin('http://localhost:3000'))).toBe(false);
  });
});

function reqWithHeaders(headers: Record<string, string>): NextRequest {
  return new NextRequest('https://victaagency.com/api/chat', {
    method: 'POST',
    headers: new Headers(headers),
  });
}

describe('clientIp', () => {
  it('reads the first entry of x-forwarded-for', () => {
    expect(clientIp(reqWithHeaders({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    expect(clientIp(reqWithHeaders({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9');
  });

  it('falls back to a placeholder when neither header is present', () => {
    expect(clientIp(reqWithHeaders({}))).toBe('0.0.0.0');
  });
});
