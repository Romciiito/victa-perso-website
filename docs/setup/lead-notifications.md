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

Z notifikace vypadne e-mail, telefon i text zprávy. Zůstane jméno, firma,
ověření v registru, rozpočet, služba a jazyk — tedy dost na posouzení hodnoty
leadu; kontakt se dohledá v mailu nebo v Supabase. Kanály se tím nestávají
příjemci kontaktních údajů, ale jméno + firma jsou pořád osobní údaj — posouzení
rozsahu informační povinnosti zůstává na Romanovi.

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

- **Discord**: `allowed_mentions: { parse: [] }` — `@everyone` ve jméně se
  vykreslí jako text, nikoho nepingne.
- **Telegram**: HTML escape (`&` → `<` → `>`) před vložením do `parse_mode: HTML`.
  Bez něj by `<b>` ve jméně buď rozbilo formátování, nebo shodilo `sendMessage`
  na HTTP 400 a notifikace by tiše zmizela.

Obojí je pokryté testy.

---

## 6. Ověření

```bash
pnpm vitest run src/lib/__tests__/lead-notify.test.ts
```

Živý test po nastavení env: odešlete kontaktní formulář na
`http://localhost:3000/cs/kontakt` a zpráva musí dorazit do obou kanálů.
