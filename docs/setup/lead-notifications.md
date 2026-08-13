# Setup: lead notifikace do Discordu a Telegramu

Okamžitý ping do kanálu, když dorazí nová poptávka nebo rezervace. Cílem je
**rychlost reakce** — u high-ticket prodeje rozhoduje, kdo se ozve první.

**Tohle NENÍ náhrada e-mailu.** E-mail přes Resend zůstává primárním a
autoritativním doručením leadu; partial-failure policy v `/api/contact` (D-011)
stojí na něm, ne na notifikaci. Notifikace je best-effort vrstva navrch: když
selže, lead se pořád uloží do Supabase a odejde mailem, jen se o něm dozvíte
o pár minut později.

Implementace: `src/lib/lead-notify.ts`, testy `src/lib/__tests__/lead-notify.test.ts`.

---

## 1. Discord (doporučený, 2 minuty)

1. Ve svém Discord serveru: **Server Settings → Integrations → Webhooks → New Webhook**.
2. Vyberte kanál. **Nastavte ho jako privátní** — poteče do něj jméno, e-mail
   a telefon vašich leadů.
3. **Copy Webhook URL**.
4. Vložte do `.env.local` jako `DISCORD_LEAD_WEBHOOK_URL`.

> Webhook URL je **heslo**. Kdokoli, kdo ji získá, může do kanálu psát cokoli.
> Nikdy ji nedávejte do klientského kódu ani do proměnné s prefixem `NEXT_PUBLIC_`.
> Při podezření na únik: v témže dialogu **Delete Webhook** a vytvořit novou.

Zprávy chodí jako barevný embed — barva podle rozpočtového pásma
(nad 100 000 € červená, 25–100k oranžová, 5–25k žlutá, do 5k šedá, rezervace zelená),
takže velký lead poznáte periferním viděním.

## 2. Telegram

1. V Telegramu napište **@BotFather** → `/newbot` → název a username bota.
   Dostanete token ve tvaru `123456789:AAE…`.
2. Vytvořte skupinu (nebo kanál) a **přidejte do ní bota**.
3. Zjistěte `chat_id`: přidejte do skupiny **@userinfobot**, nebo otevřete
   `https://api.telegram.org/bot<TOKEN>/getUpdates` po odeslání zprávy do skupiny.
   U skupin je `chat_id` **záporné** (typicky `-100…`).
4. Vložte do `.env.local` jako `TELEGRAM_BOT_TOKEN` a `TELEGRAM_CHAT_ID`.

> Bot musí být ve skupině dřív, než mu pošlete první zprávu, jinak Telegram
> vrátí `400 chat not found`.

## 3. Nasazení na Vercel

Lokální `.env.local` se na Vercel nepřenáší. Po ověření lokálně:

```bash
vercel env add DISCORD_LEAD_WEBHOOK_URL production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add TELEGRAM_CHAT_ID production
```

Pro preview prostředí platí známá past s Vercel CLI 50.44: **bez argumentu s
větví příkaz tiše selže** (chybu vypíše jen jako `}`). Používejte plný tvar:

```bash
vercel env add DISCORD_LEAD_WEBHOOK_URL preview <branch> --value <hodnota> --yes
```

Doporučení: do **preview** dát buď jiný (testovací) kanál, nebo nic. Jinak vám
do produkčního kanálu budou chodit testovací odeslání z každé PR.

---

## 4. ⚠️ GDPR — blokující podmínka pro produkci

Notifikace ve výchozím nastavení nese **plné kontaktní údaje**: jméno, e-mail,
telefon a text zprávy (rozhodnutí zakladatele 2026-08-13, zvoleno vědomě kvůli
rychlosti reakce z mobilu).

Důsledek: **Discord Inc. (USA) a Telegram se stávají příjemci osobních údajů.**
Než se to zapne v produkci, musí být hotové obě položky:

- [ ] Doplnit Discord a Telegram do **seznamu příjemců osobních údajů** v zásadách
      ochrany osobních údajů (čl. 13 odst. 1 písm. e) GDPR) — včetně informace
      o předání do třetí země a jeho právního titulu.
- [ ] Doplnit je do **záznamu o činnostech zpracování** (čl. 30 GDPR).

Bez toho jde o porušení informační povinnosti. Právní texty finalizuje Roman
(launch gate `vision.md` §14.5).

### Nižší varianta expozice

Když se doplnění textů protáhne nebo se rozhodnutí otočí, existuje přepínač bez
zásahu do kódu:

```
LEAD_NOTIFY_PII=minimal
```

Z notifikace vypadne e-mail, telefon, text zprávy, pole „Stránka" (hlavička
`referer` včetně UTM a query) a pole „Termín". Zůstane **jméno, firma, ověření
v registru, rozpočet, služba a jazyk** — a nic víc; tedy dost na posouzení
hodnoty leadu, kontakt se dohledá v mailu nebo v Supabase.

Hodnota se normalizuje (`trim` + malá písmena), takže `minimal `, `Minimal`
i `MINIMAL` fungují stejně. Neznámá neprázdná hodnota se zaloguje varováním a
jede se v režimu FULL — tenhle přepínač smí selhat jedině hlučně, protože jeho
tiché selhání znamená víc odeslaných osobních údajů, ne míň.

Pozor: kanály se tím **nepřestávají** být příjemci osobních údajů úplně — jméno
a firma osobní údaj pořád jsou. Snižuje to rozsah, neruší to povinnost.
Posouzení zůstává na Romanovi.

---

## 5. Chování za provozu

| Situace | Chování |
|---|---|
| Kanál nenastavený | tiše se přeskočí, žádná chyba (stejně jako Turnstile před provisioningem, D-011) |
| Discord/Telegram vrátí chybu nebo timeout (3 s) | zaloguje se **jen status**, návštěvník to nepozná |
| Selžou všechny nastavené kanály | `console.error` + hlášení do Sentry (`lead-notify: all configured channels failed`) |
| Selže jeden ze dvou | do Sentry nejde — lead jste dostal druhým kanálem |
| Redis nedostupný | fail-open, notifikace projde (stejně jako form limitery, REQ-I-020) |
| Přes 60 notifikací za hodinu globálně | 61. je **jedno varování**, dál ticho do konce okna |

Notifikace se posílají v `after()` — tedy **až po** odeslání odpovědi
návštěvníkovi. Formulář se kvůli nim nezpomalí.

### Proč globální strop, a ne per-IP

Per-IP limiter na `/api/contact` (5/600 s) uhlídá jednoho útočníka, ale ne
distribuovanou vlnu z mnoha IP. Ta by kanál zaplavila a **skutečný lead by
zapadl v šumu** — což je horší než notifikaci nedostat. Strop je proto globální.
Leady se přitom neztrácí: ukládají se do Supabase a chodí mailem, ztiší se jen
kanál. Varování na hranici existuje proto, aby ticho v kanálu nešlo splést
s „nikdo se neozval".

### Nepřátelský vstup

Obsah formuláře je vstup od potenciálního útočníka, takže:

- **Discord — zmínky**: `allowed_mentions: { parse: [] }` — `@everyone` ve jméně
  se vykreslí jako text, nikoho nepingne.
- **Discord — markdown**: embed renderuje markdown **včetně maskovaných odkazů**
  `[text](url)`. Bez escapu by útočník poslal do pole „Zpráva" text
  `Faktura ke schválení: [victaagency.com/faktura](https://evil.tld)` a vám by
  do vlastního kanálu přišel klikatelný odkaz, který vypadá jako vaše doména,
  pod hlavičkou „Nová poptávka" a brandingem „VICTA leads". Důvěryhodný kanál
  je pro phishing ideální kontext, proto se metaznaky escapují.
- **Telegram**: HTML escape (`&` → `<` → `>`) před vložením do `parse_mode: HTML`.
  Bez něj by `<b>` ve jméně buď rozbilo formátování, nebo shodilo `sendMessage`
  na HTTP 400 a notifikace by tiše zmizela.
- **Ořez** je entity-safe, tag-safe i safe vůči kódovým bodům — řez nikdy
  nerozsekne `&amp;`, `<b>` ani emoji na osamocený surrogate.

Všechno je pokryté testy a **šestnáct těchto pojistek je mutačně ověřených** —
každá byla dočasně odstraněna a doloženo, že testy spadnou (ořez entit, ořez
tagů, ořez po jednotkách, rezerva na escape, Discord field cap, markdown escape,
timeout signál, Telegram ořez i náhled, normalizace `LEAD_NOTIFY_PII`, minimal
režim, dekrement kvóty, escape v hodnotách polí, dorovnání neuzavřeného tagu, escape `#`, dekrement při výpadku Redisu). Mutační ověření není totéž jako důkaz úplnosti: říká,
že tyhle testy nejsou prázdné, ne že nezbyla nepokrytá cesta.

Není to formalita. První verze těchto testů byla **prázdná** — procházely i s
odstraněnou opravou, protože assertion `/&[a-z]*$/` nemohla nikdy sednout (za
entitou vždy visí `…`). Odhalilo to až mutační testování v review gate.

### Tajemství a Sentry

Discord webhook URL nese tajemství **přímo v cestě** (`/api/webhooks/{id}/{token}`),
Telegram token taky. Sentry `getSanitizedUrlString` odstraní query a userinfo,
ale **cestu vrátí doslova** (změřeno na `@sentry/core@10.53.1`) — a
`nativeNodeFetchIntegration` je výchozí integrace, která ke každému `fetch`
přidává breadcrumb s URL. Bez obrany by se při každém selhání notifikace, a při
`tracesSampleRate: 0.1` i u desetiny úspěšných, poslal webhook token třetí straně
a zůstal tam trvale.

Obrana je dvouvrstvá a rozdělená do tří souborů:

| Soubor | Role |
|---|---|
| `sentry.server.config.ts` | jen zapojení — `ignoreOutgoingRequests` a tři hooky |
| `src/lib/sentry-redaction.ts` | těla hooků jako čisté funkce, aby šla testovat |
| `src/lib/redact-secrets.ts` | samotná redakce, sdílená i s logováním v `lead-notify.ts` |

Volání na oba hosty se do Sentry nezaznamenávají vůbec (span ani drobek
nevzniknou), a co by přesto prošlo, projde redakcí podle tvaru URL **i podle
skutečné hodnoty z prostředí** — ta chytne tajemství v jakémkoli obalu, ne jen
v tom očekávaném.

Hooky mají vlastní testy (`src/lib/__tests__/sentry-redaction.test.ts`). Vznikly
proto, že původní verze žila přímo v konfiguračním souboru, kde ji nešlo
otestovat — celá obrana proti tomu úniku byla suitou neověřitelná.

---

## 6. Ověření

```bash
pnpm vitest run src/lib/__tests__/lead-notify.test.ts
```

Živý test po nastavení env: odešlete kontaktní formulář na
`http://localhost:3000/cs/kontakt` a zpráva musí dorazit do obou kanálů.
