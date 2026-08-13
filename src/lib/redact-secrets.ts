/**
 * Redakce tajemství z libovolného textu, který může skončit v logu nebo
 * u třetí strany (Sentry).
 *
 * Proč to existuje: Discord webhook URL nese tajemství PŘÍMO V CESTĚ
 * (`/api/webhooks/{id}/{token}`) a Telegram token taky
 * (`/bot{token}/sendMessage`). Kdokoli s tou hodnotou může psát do kanálu
 * resp. plně ovládat bota. Kdekoli se taková URL objeví v textu — chybová
 * hláška z `fetch`, Sentry breadcrumb, span atribut — je to únik.
 *
 * Změřeno, ne odhadnuto (review gate 2026-08-13): Sentry `getSanitizedUrlString`
 * z `@sentry/core@10.53.1` odstraní query a userinfo, ale **cestu vrátí
 * doslova**:
 *
 *   vstup   https://discord.com/api/webhooks/1234567890/SUPER-SECRET-TOKEN?x=1
 *   výstup  https://discord.com/api/webhooks/1234567890/SUPER-SECRET-TOKEN
 *
 * Modul je záměrně bez `import 'server-only'` — musí být importovatelný
 * i ze `sentry.server.config.ts`, a je to čistá práce s řetězcem bez
 * jakéhokoli přístupu k prostředkům.
 */

/**
 * Tvarové vzory. `(?:v\d+\/)?` pokrývá i verzovaný endpoint
 * `discord.com/api/v10/webhooks/…`, který je platný a běžně používaný —
 * bez něj vzor propadl (nález N2 review gate).
 */
const SHAPE_PATTERNS: readonly [RegExp, string][] = [
  [/(discord(?:app)?\.com\/api\/(?:v\d+\/)?webhooks\/)\d+\/[\w-]+/gi, '$1[redacted]'],
  [/\bbot\d{6,}:[\w-]+/gi, 'bot[redacted]'],
];

/**
 * Skutečné hodnoty z prostředí. Tvarové vzory chytnou jen to, co jsme
 * předvídali; tohle chytne tajemství v JAKÉMKOLI obalu — zkráceném,
 * percent-enkódovaném po částech, rozděleném do dvou atributů — protože
 * porovnává samotnou hodnotu, ne její očekávanou podobu.
 */
function literalSecrets(): string[] {
  return [process.env.DISCORD_LEAD_WEBHOOK_URL, process.env.TELEGRAM_BOT_TOKEN]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v) && v!.length >= 8);
}

export function redactSecrets(input: string): string {
  let out = input;
  for (const [pattern, replacement] of SHAPE_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  // `split`/`join` místo `replace` — hodnota je libovolný řetězec a jako
  // regulární výraz by se rozbila na prvním speciálním znaku.
  for (const secret of literalSecrets()) {
    out = out.split(secret).join('[redacted]');
  }
  return out;
}

/** Hosty, jejichž odchozí volání Sentry nesmí vůbec zaznamenávat. */
export function isSecretBearingUrl(url: string): boolean {
  return /discord(?:app)?\.com\/api\//i.test(url) || url.startsWith('https://api.telegram.org/');
}
