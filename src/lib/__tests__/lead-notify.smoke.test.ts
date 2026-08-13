import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * ŽIVÝ smoke test lead notifikací — POSÍLÁ SKUTEČNOU ZPRÁVU do Discordu a
 * Telegramu. Proto je opt-in a v běžném `pnpm vitest run` se přeskočí (stejný
 * vzor jako adversariální baterie chatbota, `CHAT_BATTERY=1`):
 *
 *   NOTIFY_SMOKE=1 pnpm vitest run src/lib/__tests__/lead-notify.smoke.test.ts
 *
 * K čemu je: ověřit, že přihlašovací údaje kanálů fungují — po prvním
 * nastavení, po rotaci Discord webhooku a po nasazení proměnných na Vercel
 * (tam `NOTIFY_SMOKE=1` spusťte proti staženým hodnotám z `vercel env pull`).
 * Logiku sestavení zprávy pokrývá `lead-notify.test.ts`, tenhle soubor testuje
 * VÝHRADNĚ dostupnost kanálu.
 *
 * Redis je zamockovaný — flood cap nemá se spojením do kanálu nic společného
 * a smoke test nesmí vyžadovat běžící Upstash.
 */

/** Vitest nenačítá `.env.local` sám (na rozdíl od `next dev`). */
function loadEnvLocal(): void {
  let raw: string;
  try {
    raw = readFileSync(new URL('../../../.env.local', import.meta.url), 'utf8');
  } catch {
    return; // v CI soubor neexistuje — proměnné pak musí přijít z prostředí
  }
  for (const line of raw.split('\n')) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    // Hodnoty z prostředí mají přednost před souborem.
    if (m?.[1] && !process.env[m[1]]) {
      process.env[m[1]] = m[2]!.replace(/^["']|["']$/g, '');
    }
  }
}

/**
 * Brána se čte VÝHRADNĚ z procesního prostředí a NEŽ se načte `.env.local`.
 * Kdyby se pořadí obrátilo, stačilo by, aby kdokoli přidal `NOTIFY_SMOKE=1`
 * do `.env.local` (kde už reálné údaje kanálů jsou), a obyčejné
 * `pnpm vitest run` by odeslalo skutečné zprávy do produkčního kanálu
 * zakladatele (3. kolo review gate, NOVÝ-6).
 */
const ENABLED = process.env.NOTIFY_SMOKE === '1';

if (ENABLED) loadEnvLocal();

vi.mock('server-only', () => ({}));
vi.mock('../redis', () => ({
  redis: { async incr() { return 1; }, async expire() { return 1; } },
}));

const { notifyNewLead } = await import('../lead-notify');

describe.skipIf(!ENABLED)('lead-notify — ŽIVÝ smoke test (posílá skutečnou zprávu)', () => {
  it('doručí testovací notifikaci do každého nakonfigurovaného kanálu', async () => {
    const configured =
      (process.env.DISCORD_LEAD_WEBHOOK_URL ? 1 : 0) +
      (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? 1 : 0);

    expect(
      configured,
      'Žádný kanál není nakonfigurovaný — zkontrolujte .env.local',
    ).toBeGreaterThan(0);

    const delivered = await notifyNewLead({
      kind: 'contact',
      // Zjevně testovací identita — nikdo si to nesmí splést se skutečným leadem.
      name: 'SMOKE TEST — nejde o skutečnou poptávku',
      email: 'smoke-test@victaagency.com',
      phone: '+420000000000',
      // Vlastní firma z `src/config/site.ts` — do testovací zprávy nepatří
      // vymyšlené IČO ani cizí firma.
      company: 'Victa Digital s.r.o.',
      companyIco: '28859511',
      companyCountry: 'CZ',
      budgetTier: '100k+',
      serviceInterest: 'ai',
      locale: 'cs',
      message:
        'Testovací zpráva z lead-notify smoke testu. Pokud ji vidíte, kanál funguje ' +
        'a přihlašovací údaje jsou platné. Žádná akce není potřeba.',
      sourceUrl: 'http://localhost:3000/cs/kontakt',
    });

    expect(delivered, 'Aspoň jeden nakonfigurovaný kanál nedoručil').toBe(configured);
  }, 15_000);
});
