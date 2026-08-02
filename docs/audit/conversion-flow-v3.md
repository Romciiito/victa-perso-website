# Konverzní flow v3 — Fáze 3 auditu (2026-07-28)

Nástupce `docs/contact-flow-v2.md` (vize §9 ji nahrazuje). Zdroj: flow architekt auditu + vision.md v1.4.

---

## 1. Verdikt k textu „CHCI RŮST" — VYŽADUJE ROZHODNUTÍ ZADAVATELE

**„CHCI RŮST" v testu vize §9 neobstálo — dvě nezávislé vady:**

1. **Slibuje výsledek, který neumíme doložit.** „Růst" je v §2 definovaný jako obchodní cíl; tlačítko „CHCI RŮST" uzavírá s čtenářem smlouvu klik = krok k růstu. Realita za klikem je 30minutová kvalifikační schůzka. U firmy, která si v §8 přiznává „důkazů je málo", je to přesně mezera slib–realita, před kterou §6 varuje.
2. **Nepojmenovává akci.** Ackee („Chci si zavolat") validuje první osobu + „chci", ale pojmenovává MECHANISMUS. „CHCI RŮST" pojmenovává touhu — návštěvník neví, co klik udělá (audit? formulář? hovor?). Nejasný mechanismus = tření v okamžiku nejcennějšího kliku. Navíc zní jako B2C growth-hacking, ne jazyk C-level rozhodovatele (§4). Vedlejší: verzálky jsou v designu vyhrazené pro eyebrow/status labely, ne tlačítka.

**Alternativy:**

| Text | Pro | Proti |
|---|---|---|
| **„Chci konzultaci" (DOPORUČENO)** | Drží „chci" (hák zadavatele, validováno Ackee), pojmenovává doložitelný kanál — prochází testem §9 doslova; krátké, funguje všude | Obecnější slovo, menší odlišení od konkurence |
| „Domluvit růstový hovor" | Mechanismus + „růst" jako přívlastek, nízké riziko přeslibu | Tři slova, ztrácí „chci"-vlastnictví |
| „Probrat můj projekt" | „Můj projekt" signalizuje individuální přístup, sedí na solution-aware C-level | Předpokládá hotový záměr; slabší pro problem-aware fázi |
| „Naplánovat 30minutový hovor" | Maximální důvěryhodnost, nulový přeslib | Nulová pozicionovací hodnota, generické |

**Doporučení:** funkční CTA = **„Chci konzultaci"** jednotně všude; frázi **„CHCI RŮST" zachovat jako brand slogan mimo tlačítko** (hero eyebrow/kicker, marquee) — uspokojí požadavek zadavatele i test §9, aniž jedna formulace dělá obě práce. Ověřit měřením po nasazení (booking_initiated → booking_completed), ne A/B.

---

## 2. Dnešní cesta návštěvníka — kde selhává

Na **8 z 11 šablon** je vizuálně nejsilnější tlačítko odkaz na placený audit (`/spoluprace#audit`); devátá šablona (/blog) má jako primární newsletter — terciární kanál dle §9. Booking (skutečný primární cíl) je všude graficky podřízený. Konkrétně:

1. **Homepage hero** (home-body.tsx:149-152): primary „Rezervovat audit" → /spoluprace#audit; booking jen ghost.
2. **7 dalších šablon** stejný vzorec: sluzby-body:165-168, service-body:148-151, reseni-body:182-185, solution-body:111-114, odvetvi-body:57-60, industry-body:239-242, o-nas-body:156-159.
3. **Nav pill** (nav.tsx:203-209, 513-521): „Rezervovat audit" — jediné sitewide CTA v hlavičce vede na produkt, ne na booking.
4. **/spoluprace hero** (spoluprace-body.tsx:130-140): ŽÁDNÉ CTA — cílová stránka všech „Jak spolupracujeme →" odkazů nemá tlačítko nad ohybem.
5. **Footer** „Domluvit konzultaci →" je prostý Link na /kontakt, ne booking trigger.
6. **Fallback bez provisioningu**: `useCalModal` default = `router.push('/kontakt')` bez `#form`; 8 z 11 volání nepředává fallbackHref → dnešní realita: většina „booking" kliků končí na vršku /kontakt a návštěvník musí sám hledat formulář.
7. **Jediný reálně funkční záchyt leadu dnes: mailto:/tel:** — provisioning je placeholder: Cal.com modal se nikdy neotevře a formulář selže na neprovisionovaném Supabase/Resend. Pozor: Turnstile je v tomto stavu **fail-open** (`turnstile.ts:50-55` vrací success při „not-configured") — jakmile provisioning oživí Supabase/Resend bez Turnstile klíčů, vznikne funkční zápisový endpoint chráněný jen honeypotem a rate-limitem. Turnstile klíče proto musí přistát ve stejném deployi, nebo dřív.

---

## 3. CTA plán per typ stránky (cílový stav)

**Princip:** každá stránka má právě JEDNO vizuálně dominantní CTA (booking) + max. jedno tiché sekundární. Audit nikde mimo /spoluprace nedostává primární váhu. `MagneticCta` potřebuje nový **`hero` variant** (výrazně větší padding/font — požadavek zadavatele „výrazně větší"), používaný VÝHRADNĚ pro primární booking CTA.

| Stránka | Hero | Závěr stránky |
|---|---|---|
| Homepage | primary [CTA] (hero variant); sekundární tichý text „Jak spolupracujeme →" | nový CTA pás: primary [CTA] + „Prohlédnout služby" |
| Huby (sluzby/reseni/odvetvi) | primary [CTA]; sekundární scroll na obsah | primary [CTA]; tichý text „Nebo srovnejte s placeným auditem →" |
| Detaily ([slug]) | — (hero bez CTA ok) | primary [CTA]; tichý odkaz na /spoluprace. Žádné CTA uprostřed textu |
| /spoluprace | DOPLNIT: primary [CTA] + anchor „Prohlédnout audit tiery ↓" | primary [CTA] + „Prohlédnout služby" (dnes ok). Tier karty: „Rezervovat Tier N" zůstává (produktové mid-page CTA) |
| /kontakt | primary [CTA] (fallback #form — už správně); sekundární „Vyplnit formulář" | struktura zůstává (jediná správně postavená stránka) |
| /blog | primary [CTA] (ne newsletter jako primární); newsletter zůstává sekcí | — |
| Nav (sitewide) | pill [CTA] → openCal, sourcePage z usePathname() | — |
| Footer (sitewide) | — | [CTA] jako booking trigger (nová klientská podkomponenta FooterBookCta) |

---

## 4. Kompletní kontaktní flow (po provisioningu)

1. **Klik na [CTA]** → `useCalModal({bookingType:'scoping_call', sourcePage})` → GA4 `booking_initiated`.
2. **Cal.com modal** → nativní potvrzovací e-mail + kalendářová pozvánka (netřeba stavět). **DOPLNIT:** listener na embed event `bookingSuccessful` → GA4 `booking_completed` (dnes chybí — bez něj nelze měřit drop-off modal→rezervace, což KPI §2 vyžaduje).
3. **Webhook** `/api/booking-webhook` (HMAC + replay + idempotence): zápis `booking_events` + `upsertLead(source:'booking')`. **DOPLNIT:** Cal.com custom booking fields (rozpočet, společnost, typ projektu) a jejich čtení z payloadu — primární kanál dnes nesbírá `budget_tier`, které hlavní KPI („podíl poptávek ≥ 200 000 Kč") potřebuje; dnes ho sbírá jen sekundární formulář.
4. **Formulář** `/api/contact` (sekundární kanál): flow v pořádku (origin → Zod → honeypot → Turnstile (fail-closed s reálnými klíči; dnešní neprovisionovaný stav je fail-open — viz §2 bod 7) → rate-limit → upsertLead → interní e-mail → DB, partial-failure policy). **DOPLNIT:** potvrzovací e-mail NÁVŠTĚVNÍKOVI (rekapitulace + lhůta) — dnes jen prchavý UI text.
5. **Newsletter** (terciární): přejít na **double opt-in** před launchem (RB-17, GDPR prokazatelnost souhlasu), Resend to podporuje nativně.
6. **Kvalifikace**: oba kanály → `leads` tabulka, funnel `new → contacted → qualified → audit_booked → won/lost/spam`. Lifecycle správa patří do Mission Control (samostatný projekt nad sdílenou Supabase), NE na web.
7. **Chatbot** (podpůrný, budoucí — v repu neexistuje): odpovídá jen v mezích obsahu webu; při booking-intentu nabízí stejné [CTA]; `source:'chatbot'` do téhož funnelu; před nasazením prompt-injection baterie (§14 bod 12), jinak nejde na web.

**Fallback do provisioningu:** default fallbackHref v use-cal-modal.ts změnit na `'/kontakt#form'` (jedna změna opraví 8 šablon).

## 5. Sekvence nasazení

1. Provisioning (§13, blokuje vše) **souběžně s** CTA hierarchií (P0 — není blokovaná provisioningem, jde opravit hned). *Předpoklad: origin allowlist opraven PŘED oživením endpointů a Turnstile klíče ve stejném deployi jako Supabase/Resend — viz §2 bod 7.*
2. Potvrzovací e-mail + double opt-in (P1, GDPR).
3. GA4 `booking_completed` listener + Cal.com custom fields pro budget_tier (P1, měření KPI).
4. Chatbot jako samostatný, později gatovaný workstream.
