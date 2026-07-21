# Kontakt Flow v2 — návrh nové logické konverzní architektury

> **Autor**: Claude (Fable 5 orchestrace + 7 Sonnet 5 průzkumných agentů + adversarial kritik), 2026-07-20
> **Vstup**: kompletní recon repa (branch `claude/d008-revival-may11`), živé produkce (victaagency.com) a všech design dokumentů (spec.md, intent.md, workplan.md, decisions.md).
> **Status 2026-07-20 (večer)**: Fáze A + C IMPLEMENTOVÁNY (viz decisions.md D-009–D-011): oba P0 bugy opraveny + testy, CAL_EVENTS sjednocení + per-tier booking, Turnstile provisioning-aware skip, partial-failure policy, kontakt hub bez smyčky + metadata + notes, footer kontakt blok + newsletter, CTA taxonomie, deep-linky, routes.ts slug sync, CSP script-src, redakce e-mailu v .env.example, úklid mrtvého kódu. **Zbývá**: fáze B (provisioning — §2.4, vyžaduje Romana/Trunga), fáze E (ekosystém — samostatný intent).

---

## 0. TL;DR

Web dnes **nedokáže digitálně zachytit jediný lead**. Kontaktní formulář na produkci je rozbitý (silent fail na každý submit), Cal.com není provisionovaný (každé „Domluvit konzultaci" padá fallbackem na /kontakt — kde je ten rozbitý formulář), Supabase ani Turnstile nemají reálné klíče, newsletter žije jen na placeholder /blog stránce a má stejný bug. Jediné funkční kanály: `mailto:` a `tel:`.

Návrh: **(A)** opravit 2 P0 bugy + sjednotit Cal.com slugy, **(B)** provisioning sprint (Supabase, Turnstile, Resend, Cal.com), **(C)** nová konverzní IA se 3 úrovněmi intentu a jednotnou CTA taxonomií, **(D)** lead lifecycle jako základ napojení na Mission Control dashboard a budoucí ekosystém.

---

## 1. Ověřený současný stav (as-is)

### 1.1 Co je nasazeno kde

- **Produkce (victaagency.com) běží ze špičky branche `claude/d008-revival-may11`**, ne z mainu — ověřeno přímo z HTML produkce (formulář „Odeslat zprávu" přítomen, telefon +420 777 933 112, detail routes 200, hero „Domluvit konzultaci" je `<button>` = booking wiring nasazen). `main` je 11 commitů pozadu za tím, co reálně běží → **git hygiena: srovnat main s deployem** (merge branch → main, ověřit Vercel production branch).
- Lokální `.env.local`: Supabase URL = placeholder, `NEXT_PUBLIC_CALCOM_USERNAME=victa` (= sentinel „neprovisionováno"), Turnstile site key = placeholder. Produkce se chová konzistentně s tím (žádné cal.com network cally).

### 1.2 P0 bugy (adversariálně ověřeno dvěma nezávislými agenty)

| # | Bug | Kde | Dopad |
|---|-----|-----|-------|
| P0-1 | `turnstile_token` se nikdy nepropíše do react-hook-form state (žádný `setValue`/`register`) → zodResolver validace selže na `''` PŘED spuštěním onSubmit → `fetch('/api/contact')` se nikdy nezavolá. Chybová hláška pro toto pole se nikde nerendruje → **uživatel nevidí vůbec nic**. | `contact-form.tsx:29,47,60,345` + identicky `newsletter-signup.tsx:45,57` | Každý submit obou formulářů na produkci tiše selže |
| P0-2 | `budget_tier`/`service_interest` jsou `z.enum([...]).optional()` bez `.or(z.literal(''))` → defaultní `<option value="">` neprojde validací; chyba se pro tato pole nerendruje | `contact-schema.ts:27-28`, `contact-form.tsx:258-294` | I po opravě P0-1 selže submit každého, kdo nechá volitelný select prázdný |

### 1.3 Booking (Cal.com) — tři neslučitelné konvence slugů

- **Frontend** (všech 9 call sites): pouze `free-scoping-call` / `scoping_call`
- **Webhook** `tierFromEventSlug`: `tier-1-audit` / `tier-2-audit` / `tier-3-audit` / `free-scoping-call`
- **Setup doc** `docs/setup/calcom-event-types.md`: `audit-tier-1/2/3` / `scoping-call`

→ Placené audit tiery **nemají žádnou funkční booking cestu** (tier karty na /spoluprace linkují na `/kontakt`, na homepage na `/spoluprace#audit`). Pokud Roman provisionuje Cal.com podle setup docu, webhook bude tiše klasifikovat každý booking jako `tier: null`.

Další: CSP `script-src` nemá `app.cal.com` (jen `frame-src`) → po přepnutí z Report-Only na enforced se embed script zablokuje. `BookingCta` + `CalBookingWidget` + `Button` = mrtvý kód (0 importů). GA4 `booking_initiated` se střílí i při fallback redirectu (falešná data).

### 1.4 Konverzní IA — zjištěné nelogičnosti

- **Stejný label, jiné chování**: „Domluvit konzultaci" = na 8 stránkách `openCal()` (→ dnes fallback na /kontakt), ale na /kontakt samotné je to link na `/spoluprace#audit` → **smyčka**: uživatel na /kontakt klikne CTA → /spoluprace#audit (sekce bez vlastních CTA) → tier karta → zpět /kontakt.
- **Stejný cíl, 6 různých labelů**: `/spoluprace#audit` je cílem pro „Rezervovat audit", „Vybrat audit →", „Spustit projekt →", „Získat AI audit →", „Spolupráce →", „Domluvit konzultaci →".
- **Footer je konverzně mrtvý**: žádný telefon, e-mail, newsletter, CTA — jen textový link „Kontakt".
- **Newsletter existuje jen na /blog** („coming soon" stránka), přestože komponenta je stavěná pro homepage/footer/kontakt. /blog navíc ironicky radí „pošlete nám e-mail", hned nad funkčním (rozbitým) formulářem.
- Nová kontakt stránka (branch) **zahodila `note` texty** kanálů (reakční doba, úřední hodiny) — to jsou trust signály, vrátit.
- /kontakt nemá `generateMetadata` (žádné vlastní SEO/OG), JSON-LD engine (`schema.ts`) je kompletně mrtvý kód a `site.ts` má stále 7× `[ROMAN-BLOCKER]` placeholdery.

### 1.5 Backend substrát (dobrá zpráva)

API vrstva je architektonicky solidní a **konzistentní**: origin check → Zod → honeypot → Turnstile (fail-closed) → Upstash rate-limit (fail-open pro formy) → sanitizace → `upsertLead()` → Resend → Supabase. Webhook má HMAC + timingSafeEqual + 5min replay window + idempotenci. Supabase schéma (8 tabulek, RLS default-deny, `leads` jako CRM root se status funnelem `new→contacted→qualified→audit_booked→won/lost/spam`) je navržené, **ale nikdy neaplikované na reálnou instanci**.

### 1.6 Bezpečnostní nález

`.env.example` (git-tracked, repo má jít public!) obsahuje reálný osobní Gmail v `CONTACT_DESTINATION_EMAIL`. **Nahradit placeholderem před zveřejněním repa.**

---

## 2. Nová logická kontakt flow (to-be)

### 2.1 Princip: 3 úrovně intentu, 1 akce na úroveň, 1 label na akci

| Intent | Akce | Jediný label | Chování | Kanál |
|--------|------|--------------|---------|-------|
| **Vysoký** — „chci mluvit" | Bezplatná 30min konzultace | **„Domluvit konzultaci"** | Cal.com modal (event `free-scoping-call`); fallback → `/kontakt#formular` s předvyplněným `service_interest` dle zdrojové stránky | Primární CTA na každé stránce |
| **Střední** — „chci strukturovaný start" | Placený audit (3 tiery) | **„Rezervovat audit"** (tier karty: „Rezervovat Tier N") | Tier karta → Cal.com modal s event `audit-tier-N`; fallback → /kontakt s předvolbou „Komplexní transformace" + zmínkou tieru v message placeholderu | /spoluprace + audit sekce homepage |
| **Nízký** — „ještě ne" | Newsletter | **„Odebírat novinky"** | Inline form: footer (sitewide), /blog, konec /kontakt | Soft konverze → nurture |

Fallbacky nikdy nesmí tvořit smyčku: /kontakt CTA v hero se mění z linku na `/spoluprace#audit` na **přímý scroll na #formular** (na kontaktní stránce je primární akce formulář, ne odchod jinam).

### 2.2 Mapa ploch (co se kde změní)

1. **Každá content stránka** (sluzby/reseni/odvetvi + detaily, o-nas): přesně 2 CTA — primární „Domluvit konzultaci" (modal), sekundární kontextová „Jak spolupracujeme →" (`/spoluprace`). Zrušit label chaos z §1.4.
2. **/kontakt** = hub kanálů: (1) formulář nahoře (primární akce stránky, opravený), (2) přímé kanály s vrácenými `note` texty, (3) booking CTA která reálně otevírá modal, (4) newsletter na konci. + `generateMetadata`.
3. **/spoluprace**: tier karty → Cal.com per-tier eventy (ne `/kontakt` link); sekce #audit dostane vlastní CTA; zachovat „Cesta 2" free konzultaci jako rovnocennou; kontakt fallback pod widgetem (spec §6 Section 8) doplnit.
4. **Footer** (sitewide): mini kontakt blok — e-mail, telefon, „Domluvit konzultaci" link, newsletter input. Zvážit odstranění veřejného version stringu.
5. **Header**: „Spustit audit" pill → přejmenovat na „Rezervovat audit" (konzistence s taxonomií), cíl `/spoluprace#audit` OK.
6. **/blog**: doplnit booking CTA pod newsletter (žádná stránka není dead end); smazat „pošlete nám e-mail" anti-pattern.
7. **Interní prolinkování**: homepage service grid + mega-nav dnes linkují na `#anchor` huby místo nových detail routes — přesměrovat na `/sluzby/[slug]` (SEO + kratší cesta ke konverzi).

### 2.3 Technické sjednocení

- **Jeden zdroj pravdy pro Cal.com eventy**: `src/config/booking.ts` — `CAL_EVENTS = { scoping: 'free-scoping-call', tier1: 'tier-1-audit', tier2: 'tier-2-audit', tier3: 'tier-3-audit' }`; importují frontend i webhook; setup doc přepsat podle něj (kód je zdroj pravdy, doc se přizpůsobí).
- **Oprava P0-1**: `onToken` → `setValue('turnstile_token', token, { shouldValidate: true })` (+ render chyby pole); stejně v newsletteru.
- **Oprava P0-2**: `z.enum([...]).optional().or(z.literal(''))` + transform `'' → undefined` na serveru.
- **CSP**: `script-src` += `https://app.cal.com` (před enforcementem).
- **Partial-failure policy** (nový kontrakt /api/contact): lead nesmí zapadnout — pokud selže Supabase, ale Resend prošel (nebo naopak), vrátit success + Sentry alert na partial failure; hard-fail jen když selže obojí. (Dnes: Supabase fail = 500 i když e-mail odešel.)
- **GA4**: `booking_initiated` střílet až PO `calIsConfigured()` checku; fallback trackovat jako `booking_fallback_contact`; doplnit `booking_completed` z Cal embed callbacku (`bookingSuccessful` event). Sjednotit názvy eventů na spec §10 taxonomii.
- **Úklid mrtvého kódu**: smazat `Button`, `BookingCta`, `CalBookingWidget` (útoky na pozornost budoucích agentů); JSON-LD engine buď zapojit do layoutů (po doplnění `site.ts` reálnými hodnotami — IČO 28859511, Haškova 1238/8 HK jsou známé), nebo smazat.
- **GDPR**: persistovat `gdpr_consent` + timestamp do `contact_submissions` (dnes se neukládá); vyřešit RB-17 (single vs. double opt-in newsletteru) — doporučuji rovnou double opt-in (odolné vůči právní nejistotě, Resend to umí).

### 2.4 Provisioning sprint (bez tohoto je všechno výše mrtvé)

| Služba | Akce | Vlastník |
|--------|------|----------|
| Supabase | Založit projekt (EU region), aplikovat `001_initial_schema.sql`, klíče do Vercel env | Roman/Trung |
| Cloudflare Turnstile | Site+secret key, do Vercel env | Roman/Trung |
| Resend | Doména + SPF/DKIM/DMARC, 2 API klíče (contact/newsletter), audience | Roman/Trung |
| Cal.com | Účet, username → `NEXT_PUBLIC_CALCOM_USERNAME`, 4 event typy dle `CAL_EVENTS`, webhook + secret | Roman |
| Vercel | Production branch = main (po merge), env vars, 2FA gate z Phase 0 | Roman |

Pořadí: Supabase+Turnstile+Resend odblokují formulář a newsletter **i bez Cal.com** (fallback flow je navržený tak, aby fungoval plnohodnotně). Cal.com může přijít o týden později a jen „zapne" modaly.

---

## 3. Lead lifecycle → onboarding → ekosystém (Mission Control)

### 3.1 Lead lifecycle (už existuje v schématu, jen ho začít žít)

`leads.status`: `new → contacted → qualified → audit_booked → won / lost / spam` + zdroje (`contact_form | newsletter | booking | chatbot | cold_ad | referral`) + UTM pole. Web je **producent** leadů; správa lifecycle patří do dashboardu, ne na web.

### 3.2 Napojení na Mission Control (dashboard)

Kontext: existuje „VICTA Mission Control" — ops dashboard (Business Overview, Jobs & Costs, Assets, Distribuce, …) s vlastním `/api/m1/*` API. Intent.md přitom **permanentně vylučuje** dashboard/login z marketingového webu a vyžaduje pro SaaS/dashboard vrstvu samostatný projekt (`app.victa.agency` vzor). Návrh to respektuje:

- **Krok 1 (nyní)**: sdílená Supabase jako datový most. Mission Control čte `leads`, `contact_submissions`, `booking_events`, `newsletter_subscribers` přímo (service key na straně dashboardu, RLS zůstává default-deny pro anon). Do `leads` přidat sloupec `business` (default `'victa-web'`) — jednořádková migrace, připraví multi-business bez refaktoru.
- **Krok 2 (při připojení druhého businessu)**: event-ingest vzor. Každý web/business emituje `lead.created`, `booking.created`, `newsletter.subscribed` na centrální Mission Control endpoint (`/api/m1/ingest`), zabezpečený **stejným HMAC vzorem jako Cal.com webhook** (HMAC-SHA256 + timestamp window + idempotence — kód už existuje, jen se zobecní). Web si nechá vlastní Supabase jako operativní store; Mission Control je agregační vrstva přes všechny businessy.
- **Onboarding klienta** (co následuje po konverzi: kvalifikace → nabídka → kickoff → aktivní zakázka) žije v Mission Control jako pipeline nad `leads.status` + automatizované Resend e-maily per přechod stavu. Na webu se onboarding projeví jedině kvalitou dat ve formuláři (budget_tier, service_interest, zdroj) — proto je jejich oprava (P0-2) součástí flow, ne kosmetika.
- **Formální požadavek**: per spec.md §14.3 vyžaduje ekosystémová vrstva **nový intent dokument** (samostatný projekt). Doporučuji `victa-ecosystem/intent.md` jako první krok fáze D.

### 3.3 Chatbot (odloženo — nechat odložené)

D-002 platí. Nová flow je navržená tak, aby chatbot šel později „zacvaknout" jako čtvrtý vstup do stejného `leads` funnelu (`source: 'chatbot'`, eventy `chatbot_booking_link_clicked`) bez přestavby.

---

## 4. Sekvence prací

| Fáze | Obsah | Odhad |
|------|-------|-------|
| **A — P0 hotfix** | P0-1 + P0-2 + render chyb, sjednocení CAL_EVENTS, CSP script-src, /kontakt CTA smyčka, GA4 fallback event | 1 session |
| **B — Provisioning** | Tabulka §2.4 + `.env.example` redakce Gmailu; e2e test formuláře a newsletteru na preview | Roman + 1 session |
| **C — Konverzní IA** | §2.2 celá (footer blok, newsletter placement, label taxonomie, notes, metadata, prolinkování detailů, úklid mrtvého kódu) | 1–2 sessions |
| **D — Docs & git hygiena** | D-009 (revival D-008) + D-010 (modal embed) do decisions.md, workplan sync (porušuje vlastní Rule 1), Fakturoid reference, merge → main | 0.5 session |
| **E — Ekosystém** | Nový intent doc, `business` sloupec, Mission Control čtení Supabase, návrh `/api/m1/ingest` kontraktu | samostatný projekt |

---

## 5. Otevřené otázky (vyžadují rozhodnutí Romana/Trunga)

1. **Cal.com username + účet** — kdy provisionovat? (Bez něj běží plnohodnotný fallback flow.)
2. **`CONTACT_DESTINATION_EMAIL`** — kam mají poptávky reálně chodit? (+ redakce Gmailu z `.env.example`.)
3. **RB-17**: schválit double opt-in newsletteru (doporučeno), nebo čekat na právní review single opt-in?
4. **Vercel production branch** — potvrdit, z čeho se deployuje, a srovnat s mainem.
5. **Tier booking přes Cal.com** (návrh výše) vs. ponechat tiery na kontaktním formuláři s předvolbou — návrh preferuje Cal.com per-tier (méně tření, tier context se neztrácí).
6. **Chrome extension „VICTA Mission Control"** překrývá taby (vč. produkce) a znemožnila browser QA localhostu — potvrdit, že je to tvůj nástroj, a ideálně přidat výjimku pro `localhost:3000` / `victaagency.com`, jinak nejde dělat živé UI testování.

---

*Podkladové reporty agentů: scratchpad `recon/` (contactCode, bookingCode, backendData, ctaMap, intentDocs, webProd, webLocal, critique) — session 2026-07-20.*
