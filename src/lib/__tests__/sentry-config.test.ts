import { describe, it, expect, vi } from 'vitest';
import { redactBreadcrumb, redactSpan, scrubEvent } from '../sentry-redaction';
import { isSecretBearingUrl } from '../redact-secrets';

/**
 * ZAPOJENÍ obran do `Sentry.init` (kořenový `sentry.server.config.ts`).
 *
 * Proč to má vlastní soubor: `sentry-redaction.test.ts` ověřuje, že hooky
 * redigují správně — ne že je někdo VOLÁ. Když se těla hooků přestěhovala do
 * `@/lib/sentry-redaction`, zbylo v konfiguráku jen zapojení, a to nekryl ani
 * jeden test: smazání řádku `beforeSend: scrubEvent,` prošlo `tsc --noEmit`,
 * `eslint --max-warnings 0`, celou vitest bránou i `pnpm build` zeleně
 * (změřeno, review gate 2026-08-13) — a `no-unused-vars` na osiřelém importu
 * nesepne, protože ostatní hooky ho drží při životě. Obrana by pak zůstala
 * v repu jako plně otestovaný, ale nikdy nevolaný export a první chyba
 * v `/api/contact` by poslala do Sentry celé tělo formuláře.
 *
 * Proto je `@sentry/nextjs` zmocněný a testy se dívají na to, co konfigurák do
 * `Sentry.init` skutečně předal.
 */

const { init, nativeNodeFetchIntegration } = vi.hoisted(() => ({
  init: vi.fn<(options: Record<string, unknown>) => void>(),
  nativeNodeFetchIntegration: vi.fn((options: Record<string, unknown>) => ({
    name: 'NativeNodeFetch',
    options,
  })),
}));

vi.mock('@sentry/nextjs', () => ({ init, nativeNodeFetchIntegration }));

/**
 * Konfigurák má top-level side effect — `Sentry.init` se volá při jeho
 * vyhodnocení, tedy právě jednou za registr modulů. Načte se tady a zachytí se
 * argument; testy DSN brány níž si registr resetují a čítače volání mažou,
 * takže na `init.mock.calls` už spoléhat nejde.
 */
vi.stubEnv('SENTRY_DSN', 'https://abc123@o0.ingest.sentry.io/1');
await import('../../../sentry.server.config');

const INIT_OPTIONS: Record<string, unknown> = (() => {
  const call = init.mock.calls[0];
  if (!call) throw new Error('sentry.server.config nezavolal Sentry.init ani s platným DSN');
  return call[0];
})();

/** Načte konfigurák načisto s jiným DSN — jinak by se z cache už nespustil. */
async function reloadWithDsn(dsn: string | undefined): Promise<void> {
  vi.resetModules();
  init.mockClear();
  nativeNodeFetchIntegration.mockClear();
  vi.stubEnv('SENTRY_DSN', dsn);
  await import('../../../sentry.server.config');
}

describe('zapojení redakčních hooků', () => {
  it('předá do Sentry.init přesně ty funkce, které ověřuje sentry-redaction.test.ts', () => {
    // Identita, ne jen „nějaká funkce": jedině tak testy redakce vypovídají
    // o tom, co v produkci opravdu běží.
    expect(INIT_OPTIONS.beforeBreadcrumb).toBe(redactBreadcrumb);
    expect(INIT_OPTIONS.beforeSendSpan).toBe(redactSpan);
    expect(INIT_OPTIONS.beforeSend).toBe(scrubEvent);
  });

  it('vyřadí odchozí volání na Discord/Telegram z fetch integrace', () => {
    const build = INIT_OPTIONS.integrations as (defaults: unknown[]) => unknown[];
    const defaults = [{ name: 'Http' }];

    const result = build(defaults);

    expect(nativeNodeFetchIntegration).toHaveBeenCalledWith({
      ignoreOutgoingRequests: isSecretBearingUrl,
    });
    // Výchozí integrace se musí zachovat — `integrations` je funkce právě
    // proto, aby se k nim PŘIDÁVALO, ne aby je nahradila.
    expect(result).toContainEqual({ name: 'Http' });
  });

  it('nepřipojuje k eventům výchozí PII', () => {
    // `sendDefaultPii: true` by do každého eventu vrátilo IP a hlavičky, které
    // `scrubEvent` teprve pracně odstraňuje (REQ-NF-046).
    expect(INIT_OPTIONS.sendDefaultPii).toBe(false);
  });
});

describe('DSN brána', () => {
  it('placeholder z .env.example Sentry vůbec nespustí', async () => {
    // `.env.example` nese `SENTRY_DSN=https://your-sentry-dsn-here`; kdyby se
    // zkopíroval do prostředí, `Sentry.init` by běžel s nesmyslným DSN a
    // tvářil se jako funkční monitoring.
    await reloadWithDsn('https://your-sentry-dsn-here');
    expect(init).not.toHaveBeenCalled();
  });

  it('bez DSN Sentry nespustí', async () => {
    await reloadWithDsn(undefined);
    expect(init).not.toHaveBeenCalled();
  });
});
