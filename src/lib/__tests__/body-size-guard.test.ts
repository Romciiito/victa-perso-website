import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// `server-only` isn't installed for plain Node/Vitest execution — see
// src/lib/__tests__/rate-limit.test.ts for the same stub.
vi.mock('server-only', () => ({}));

const { bodyTooLarge } = await import('../body-size-guard');

function reqWithContentLength(bytes: string | null): NextRequest {
  const headers = new Headers();
  if (bytes !== null) headers.set('content-length', bytes);
  return new NextRequest('https://victaagency.com/api/contact', {
    method: 'POST',
    headers,
  });
}

describe('bodyTooLarge', () => {
  it('returns null when Content-Length is under the max', async () => {
    const req = reqWithContentLength('1000');
    expect(bodyTooLarge(req, 20_000)).toBeNull();
  });

  it('returns null when Content-Length equals the max exactly (boundary)', async () => {
    const req = reqWithContentLength('20000');
    expect(bodyTooLarge(req, 20_000)).toBeNull();
  });

  it('returns a 413 response when Content-Length exceeds the max', async () => {
    const req = reqWithContentLength('50000');
    const res = bodyTooLarge(req, 20_000);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(413);
    const body = await res?.json();
    expect(body).toEqual({ error: 'payload-too-large' });
  });

  it('sets Cache-Control: no-store on the 413 response', async () => {
    const req = reqWithContentLength('50000');
    const res = bodyTooLarge(req, 20_000);
    expect(res?.headers.get('cache-control')).toBe('no-store');
  });

  it('returns null (cannot enforce) when Content-Length header is absent — falls through to platform limits', async () => {
    const req = reqWithContentLength(null);
    expect(bodyTooLarge(req, 20_000)).toBeNull();
  });

  it('returns null when Content-Length is not a valid number (defensive — never blocks on a malformed header)', async () => {
    const req = reqWithContentLength('not-a-number');
    expect(bodyTooLarge(req, 20_000)).toBeNull();
  });
});
