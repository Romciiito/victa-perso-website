import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Supabase keepalive cron (rozhodnutí zadavatele 2026-08-06: Supabase zůstává
 * na Free plánu + cron místo Pro upgradu).
 *
 * Free tier uspí projekt po ~7 dnech BEZ DOTAZU DO DATABÁZE — a uspaný projekt
 * znamená tichý výpadek sběru leadů (formulář i newsletter píšou do Supabase,
 * DNS subdomény přestane rezolvovat). Přesně to se stalo mezi 5/2026 a 8/2026.
 * Jeden lehký dotaz denně drží projekt vzhůru.
 *
 * Bezpečnost: Vercel Cron posílá `Authorization: Bearer $CRON_SECRET`, pokud je
 * env proměnná nastavená. Bez platného tokenu vracíme 401 — endpoint nesmí být
 * volatelný kýmkoli (byť je jeho dopad jen jeden SELECT).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  // timingSafeEqual jako u webhook HMAC a newsletter tokenu (gate Vlny 6 —
  // sjednocení vzoru; prosté `!==` bylo jediné místo, které se lišilo).
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret ?? ''}`;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  const authorized =
    Boolean(secret) &&
    providedBuf.length === expectedBuf.length &&
    timingSafeEqual(providedBuf, expectedBuf);
  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const startedAt = Date.now();
  const { error } = await supabaseAdmin.from('leads').select('id').limit(1);
  const ms = Date.now() - startedAt;

  if (error) {
    console.error('[cron/keepalive] supabase query failed:', error.message);
    return NextResponse.json(
      { ok: false, error: 'supabase', ms },
      { status: 500, headers: NO_STORE },
    );
  }

  console.log('[cron/keepalive] ok', { ms });
  return NextResponse.json({ ok: true, ms }, { status: 200, headers: NO_STORE });
}
