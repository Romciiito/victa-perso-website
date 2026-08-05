# VICTA — Kompletní audit webu a repozitáře

2026-07-28 · Fáze 2–5 dle vision.md v1.4 · 10 auditních agentů (1,03 M tokenů, 373 tool-calls) + syntéza orchestrátora · **Stav: čeká na schválení akčního plánu — nic se neimplementuje bez odsouhlasení**

Podpůrné dokumenty s plnými detaily:
- `docs/audit/copy-rewrites.md` — hotové přepisy textů (Fáze 2)
- `docs/audit/conversion-flow-v3.md` — konverzní flow, CTA plán, verdikt „CHCI RŮST" (Fáze 3; nahrazuje contact-flow-v2)
- `docs/audit/seo-visibility.md` — keyword clustery, GEO, obsah profilů GBP + Firmy.cz (Fáze 5)

---

## Executive summary

Web má solidní technický základ (formuláře, webhook zabezpečení, Sentry PII, server-only Supabase, locale allowlist, slugy synchronní), ale **v dnešním stavu nemůže plnit jediný cíl vize (high-ticket poptávky) ze tří důvodů**:

1. **Nezachytí lead.** Všechny vendor účty jsou placeholder — Cal.com modal se nikdy neotevře a formulář selže na neprovisionovaném Supabase/Resend. Turnstile je přitom v tomto stavu **přeskočen (fail-open „not-configured")** — jedinou anti-spam bariérou je honeypot + rate-limit. Jediný funkční kanál je mailto:/tel:. (Známé z vize §9; audit zpřesnil mechanismus.)
2. **Konverzní model je implementovaný obráceně.** Na 8 z 11 šablon je vizuálně dominantní CTA „Rezervovat audit" → placený produkt; devátá (blog) má jako primární newsletter (P1-24); bezplatný hovor (primární cíl §9) je všude podřízený. Navíc flow architekt po testu proti vizi **nedoporučuje text „CHCI RŮST" jako tlačítko** (viz Rozhodnutí R1).
3. **Web sabotuje vlastní důvěryhodnost.** NAP rozpor Praha/HK na 4 místech (včetně llms.txt čteného AI vyhledávači), rok „2026" vs. ARES 2012, „16 služeb" vs. 18, „šest oborů" vs. 8, `{{LINK:...}}` placeholder renderovaný v produkci, „COMING SOON v 0.2.0" badge, nepodložená čísla (3 týdny vs. 3 měsíce; odvětvová %), a sitewide meta description + 9 stránek bez vlastního title — Google všude ukazuje „VICTA" + starý manifest.

Navíc: bezpečnostní kontroly deklarované v CLAUDE.md se z velké části reálně nevynucují (CSP jen Report-Only s unsafe-inline, typografický linter mimo CI, Next.js s HIGH CVE na middleware, který nese locale allowlist) a hotový JSON-LD engine není zapojený — web nemá jediné strukturované datum.

**Součty nálezů (po konsolidaci duplicit napříč agenty): 24 × P0 · 23 × P1 (tabulka má 24 řádků — P1-02 povýšen na P0-23, řádek ponechán jako pointer) · 12 × P2.**

---

## P0 — blokuje konverze / bezpečnost / launch

### A. Konverze (vize §9 není v kódu)

| # | Nález | Kde | Řešení |
|---|---|---|---|
| P0-01 | Obrácená CTA hierarchie na 8 z 11 šablon: primary = „Rezervovat audit" → /spoluprace#audit, booking jen sekundární (devátá šablona /blog má primary newsletter — P1-24) | home-body:149-152; sluzby-body:165-168; service-body:148-151; reseni-body:182-185; solution-body:111-114; odvetvi-body:57-60; industry-body:239-242; o-nas-body:156-159 | Prohodit: primary = booking (openCal scoping_call) s jednotným textem (R1), audit jen tichý sekundární odkaz. Ideálně jedna sdílená komponenta |
| P0-02 | Nav pill „Rezervovat audit" (jediné sitewide CTA v hlavičce) vede na produkt, ne booking | nav.tsx:203-209, 513-521 | Pill = booking trigger, sourcePage z usePathname() |
| P0-03 | Homepage stále obsahuje sekci 3 audit tierů s cenami | home-body:251-335 | Nahradit důkazovou sekcí dle §8 (hotové copy v copy-rewrites.md §2) |
| P0-04 | Booking fallback vede na holé /kontakt bez #form — 8 z 11 volání; dnešní realita většiny kliků | use-cal-modal.ts:102-109 | Default fallback `'/kontakt#form'` (1 změna opraví 8 šablon) |
| P0-05 | Provisioning: Supabase/Turnstile/Resend/Cal.com/GA4/Cookiebot placeholder → 0 % kliků otevře modal; formulář selže na Supabase/Resend, Turnstile je přeskočen (fail-open „not-configured", turnstile.ts:50-55) — bez captchy zbývá jen honeypot + rate-limit | .env / vendor účty | Provisioning sprint (Trung+Roman) — blokátor č. 1. **Tvrdá podmínka: Turnstile klíče musí přistát ve stejném nasazení jako Supabase/Resend, nebo dřív** — jinak vznikne funkční zápisový endpoint bez captchy |

### B. Důvěryhodnost a copy

| # | Nález | Kde | Řešení |
|---|---|---|---|
| P0-06 | NAP rozpor: „Praha" ve footeru každé stránky; marquee „Praha · Hradec Králové · Trutnov"; „Korespondenční adresa Praha 11" na /kontakt; **Praha i v public/llms.txt:70 (čtou ji AI vyhledávače)** | common.json:52; home-body:47-57; common.json:1020; llms.txt:70 | Sjednotit vše na Hradec Králové (přepisy hotové) |
| P0-07 | Rok „2026" ve footer status + copyright + na /kontakt — ARES: vznik 2012; rozhodnutí vize: žádný rok v copy | common.json:31 aj. | Rok odstranit všude (přepisy hotové) |
| P0-08 | „16 služeb" (reálně 18) na /sluzby i /reseni; „šest oborů" (8 karet) na /odvetvi | common.json:407, 649, 700-702 | Opravit čísla; u odvětví sladit s redukcí (R2) |
| P0-09 | `{{LINK:spoluprace}}` a `{{LINK:kontakt}}` se renderují doslovně v produkci ve FAQ dvou služeb | common.json:552, 623 | Nahradit odkazem / přeformulovat |
| P0-10 | Blog: veřejný badge „BLOG · COMING SOON · v 0.2.0", odkaz ve footeru, stránka v sitemapě, bez noindex | blog-body:63-67; footer.tsx:17-22; sitemap.ts:59 | Badge pryč, z navigace ven, noindex + mimo sitemap do ≥ 3 článků |
| P0-11 | Hero homepage technologie-first, neprojde testem 5 s; sitewide meta description = starý „manifest"; 9 z 10 top-level stránek bez generateMetadata (všude title „VICTA") | home.hero; layout.tsx:27-31; všechny page.tsx kromě kontakt | Nové hero + meta (hotové copy), doplnit generateMetadata (vzor kontakt/page.tsx) |
| P0-12 | Nepodložená tvrzení: „3 měsíce → 3 týdny" (4× rychlejší, nula důkazů); tým sekce odkazuje na „naši práci", která na webu není | common.json:966-968; oNas.team | Přepisy hotové (bez násobků, bez odkazu na neexistující důkaz) |
| P0-13 | Odvětví = keyword-stuffing bez důkazu (SAP, OEE, ČNB, DORA, ÚZIS, HL7…), zapečený i v mega-menu offerings-data.ts | common.json odvetvi.*; offerings-data.ts:159-208 | Redukce 8 → 3 + 301 mapa + úprava offerings-data + routes.ts (R2) |
| P0-14 | 10 z 18 služeb je čistý feature-list bez bolesti/výsledku, bez fit a FAQ (renderuje se jen hero+CTA); nejhorší přesně u ai-chatboti (§8.4 pilíř) a seo | common.json sluzby.* | Šablona bolest→řešení→výsledek→CTA; 3 hotové exempláře + tabulka pro zbylých 15 |

### C. Technika

| # | Nález | Kde | Řešení |
|---|---|---|---|
| P0-15 | **Webhook idempotence:** klíč se claimuje PŘED úspěšným DB zápisem a bez event_type → (a) Cal.com retry po výpadku Supabase je navždy zahozen, booking se nikdy nezapíše; (b) CANCELLED/RESCHEDULED do 24 h od CREATED je tiše zahozen → **riziko fakturace za zrušený placený audit** | booking-webhook/route.ts:106-114; rate-limit.ts:70-75 | Klíč `…:${triggerEvent}`, claim až po úspěšném insertu (nebo processing-lock + commit key) |
| P0-16 | CSP se nevynucuje: jen `Content-Security-Policy-Report-Only`, s `unsafe-inline` v script/style-src a širokým connect-src (supabase, upstash — klient je nepotřebuje); report endpoint nedefinován | vercel.json:35-37 | Enforcing CSP + nonce/hash, zúžit connect-src, definovat reporting |
| P0-17 | Next.js 16.2.6 = 6 HIGH CVE včetně **middleware bypass** (přesně mechanismus locale allowlistu AR-03); CI audit gate padá jen na critical | package.json:20; ci.yml:179 | `pnpm update next` (≥16.2.11), audit-level=high, ověřit allowlist po upgradu |
| P0-18 | Český typografický linter existuje a funguje, ale není zapojen v buildu, pre-commitu ani CI — AR-08 „no exceptions" fakticky neplatí | package.json:8; .husky; ci.yml | CI job `pnpm lint:cs` jako required check |
| P0-19 | Hreflang: všech 41 CS URL tvrdí, že jejich EN ekvivalent je jediná /en stub URL; ~40 EN stub stránek indexovatelných (žádný noindex v celém src/app) | sitemap.ts:16-32; všechny page.tsx | Odstranit en z alternates do parity; robots:{index:false} pro locale='en' |
| P0-20 | Sitemap priorita /spoluprace stále 0.95 (vize: 0.8); chybí 301 pro přejmenovaný slug `vyroba-logistika` (dnes 404) | sitemap.ts:49; vercel.json:58-63 | 0.8; doplnit redirect + projít historii slugů |
| P0-21 | **LCP:** H1 na každé stránce se renderuje `opacity:0 + blur(8px)` a zviditelní až po hydrataci + spring animaci | page-hero.tsx:68-76; home-body:104-112 | Nikdy neanimovat opacity/blur H1 — statický první paint, animovat jen doprovodné prvky |
| P0-22 | 13 z 13 *-body.tsx je 'use client' — 100 % obsahu hydratuje (i legal stránky), žádné RSC | všechny *-body.tsx | PageHero rozdělit na server shell + klientský efekt-leaf; legal stránky čistě server (getTranslations) |
| P0-23 | JSON-LD engine (Organization/LocalBusiness/Service/FAQ/Breadcrumb/WebSite + `<JsonLd>`) je kompletně mrtvý — nikde neimportovaný, web nemá JEDINÉ structured data; nejvyšší páka Fáze 5 (jen provolat hotové funkce) | lib/schema.ts; components/seo/json-ld.tsx | Zapojit v layoutu + stránkách — **až po dodání DIČ + spisové značky (R4/Roman)**, jinak `[ROMAN-BLOCKER]` placeholdery prosáknou do strukturovaných dat (§14 body 3+9) |
| P0-24 | Jediný FAQ blok na celém webu (spoluprace.faq) — a i ten bez FAQPage schema; zbylých 40 stránek FAQ nemá vůbec (koala42 i atol mají; klíčové pro AI extrakci) | common.json; žádné buildFaqSchema volání | FAQ doplnit dle copy šablon (exempláře hotové) + FAQPage schema přes zapojený JSON-LD (P0-23) |

---

## P1 — výrazně škodí

| # | Nález | Kde | Řešení |
|---|---|---|---|
| P1-01 | Origin check přijímá JAKOUKOLI *.vercel.app doménu + localhost bez NODE_ENV gate — CSRF/origin vrstva triviálně obejitelná (a Turnstile zatím neprovisionován) | contact/route.ts:30-40; newsletter/route.ts:34-44 | Allowlist jen vlastní domény (VERCEL_URL/VERCEL_BRANCH_URL), localhost jen mimo produkci |
| P1-02 | *(povýšeno na P0-23 — viz výše; číslo ponecháno kvůli referencím)* | — | — |
| P1-03 | Žádné OG/Twitter metadata; site.ogImage odkazuje na neexistující soubor — sdílení na LinkedIn/Slack = prázdný náhled | site.ts:14; celé src/app | opengraph-image / default.png + openGraph+twitter bloky |
| P1-04 | Canonical chybí na 10 top-level URL (jen detaily ho mají) | page.tsx top-level | Doplnit přes sdílený helper (site.url) |
| P1-05 | Chybí not-found.tsx — 404 je generický nebrandovaný Next.js fallback | src/app | Lokalizovaná 404 s navigací a CTA |
| P1-06 | Po odeslání formuláře nechodí návštěvníkovi žádný potvrzovací e-mail (jen interní notifikace) | contact/route.ts:107-139 | Druhý Resend send s rekapitulací a lhůtou |
| P1-07 | Newsletter je single opt-in — GDPR prokazatelnost souhlasu (otevřená otázka RB-17) | newsletter/route.ts:181-205 | Double opt-in (Resend nativně) před launchem |
| P1-08 | GA4 měří jen booking_initiated, chybí listener `bookingSuccessful` → booking_completed — funnel modal→rezervace neměřitelný (KPI §2) | use-cal-modal.ts:111-149 | Doplnit listener |
| P1-09 | Booking cesta (primární kanál) nesbírá budget_tier — pole hlavního KPI zapisuje jen sekundární formulář | booking-webhook/route.ts:121-129 | Cal.com custom fields + čtení z payloadu |
| P1-10 | /spoluprace hero nemá žádné CTA (cíl všech „Jak spolupracujeme →" odkazů) | spoluprace-body:130-140 | Primary booking + anchor na #audit |
| P1-11 | Footer CTA je prostý Link na /kontakt — nikdy neotevře modal | footer.tsx:76-83 | Klientská FooterBookCta s useCalModal |
| P1-12 | CTA fragmentace: 10+ textů pro booking/audit akce; 5+ labelů hardcoded v TSX mimo i18n (obchází grep kontrolu §14.10) | common.json + *-body.tsx | Sjednotit na 2–3 labely + migrace do common.json (průřezový úkol §11) |
| P1-13 | /kontakt slibuje odezvu „2 pracovní dny" i „1 pracovní den" na téže stránce | common.json:1002 vs 1010 | Sjednotit na 1 den (přepis hotový) |
| P1-14 | Nepodložená čísla v PONECHANÝCH oborech („30–40 % času", „50–70 % dotazů") | common.json:801, 918 | Kvalifikovaný jazyk (přepisy hotové) |
| P1-15 | Full framer-motion bundle na každé stránce (18 z 33 klient. souborů, žádný LazyMotion) vč. nav a legal stránek | nav.tsx aj. | LazyMotion+m / CSS transitions pro triviální efekty |
| P1-16 | MagneticCta: getBoundingClientRect na každý mousemove bez rAF — INP riziko přímo na primárním CTA (stejně horizontal-scroller) | magnetic-cta.tsx:35-40; horizontal-scroller.tsx:44-51 | Cache rect při mouseenter / rAF throttle |
| P1-17 | CLAUDE.md drift: theme tokens/anti-flash/light.css neexistují (D-008 dark-only); „ISR s s-maxage=86400" — v kódu žádný revalidate a architecture.md §3.1 neexistuje; chatbot pravidla v přítomném čase pro neexistující routu; vercel.json konfiguruje mrtvou /api/chat | CLAUDE.md; vercel.json:43-46 (functions blok) | Aktualizovat CLAUDE.md dle reality (D-008, rendering, chatbot „až naběhne"), vyčistit vercel.json |
| P1-18 | llms.txt obsahově zastaralý (audit-first logika, stará adresa) — AI odpovědi budou citovat překonaný model | public/llms.txt | Kompletní refresh po Fázi 2 |
| P1-19 | Chybí sekce „Zeptejte se na nás AI" (koala42 vzor ověřen živě) | — | Spec hotová v seo-visibility.md §4; nasadit až po NAP+JSON-LD |
| P1-20 | Title šablona detailů `${name} — VICTA` bez hledaných tvarů | sluzby/[slug]/page.tsx:39 + reseni/[slug]/page.tsx (generateMetadata) | Rozšířit o klíčové slovo + audienci (2 soubory = 23 stránek) |
| P1-21 | Copy-paste CTA blok „Audit ukáže, kde začít…" identický na 18 stránkách (atol anti-pattern) | service-body.tsx:139-145 | Personalizovat dle kategorie + obrátit na booking-first |
| P1-22 | Řešení: balíčky „agenti" a „dashboardy" čistý feature-list | common.json:656-680 | Přepisy hotové |
| P1-23 | Sparse služby (10×) bez fit/FAQ | common.json sluzby.* | Dle šablony exemplářů |
| P1-24 | Blog hero: primární CTA je newsletter (terciární kanál dle §9) | blog-body:31 | Primary booking, newsletter jako sekce |

---

## P2 — nice-to-have

| # | Nález | Kde |
|---|---|---|
| P2-01 | sanitizeFormString řeže UTF-16 uprostřed surrogate páru (emoji na hranici 2000 zn. → poškozená zpráva/DB chyba, uživatel přesto dostane „odesláno") — `Array.from(str).slice(0,max).join('')` | sanitize.ts:12-20 |
| P2-02 | upsertLead read-then-insert race → duplicitní leady (popírá „one row per person"); UNIQUE + ON CONFLICT | leads.ts:37-51 |
| P2-03 | booking_webhook limiter definovaný, nikdy nevolaný — mrtvá „obrana" | rate-limit.ts:30-36 |
| P2-04 | Síťové chyby formulářů ukazují anglický `err.message` v českém UI | contact-form.tsx:96-103 |
| P2-05 | Mrtvé common.json klíče s „2026" (visualTag aj.) — smazat | common.json:71-80 |
| P2-06 | Chybí favicon/app icon (public/ má jen llms.txt) | src/app |
| P2-07 | tsc: deprecated baseUrl (TS 7.0 break) | tsconfig.json:25 |
| P2-08 | Welcome e-mail hardcoded hex barvy neodpovídají aktuální paletě (po D-008) | newsletter/route.ts:71 |
| P2-09 | robots.ts disallow `/404` je no-op (route neexistuje) | robots.ts:17 |
| P2-10 | metadataBase + URL literály duplikují site.url | layout.tsx:28 aj. |
| P2-11 | SOLUTION_META id ≠ skutečné slugy (analytika/deep-linking drift) | reseni-body.tsx |
| P2-12 | Legal name drift „Victa Digital s.r.o." vs. „VICTA DIGITAL s.r.o." | site.ts:11 vs llms.txt |

Pozitivní zjištění (nedotýkat): locale allowlist korektní; slugy routes.ts ↔ common.json dnes 1:1; HMAC+replay koncept webhooku (mimo idempotenční bug P0-15); Turnstile fail-closed při ČÁSTEČNÉM provisioningu (při nulovém je fail-open — viz P0-05); partial-failure policy formuláře; Sentry PII scrubbing; žádné secrets v gitu; NEXT_PUBLIC_ disciplína čistá; /spoluprace FAQ (zachovat beze změny); robots.txt neblokuje AI crawlery.

---

## Rozhodnutí zadavatele — VYŘEŠENO 28. 7. 2026 (plán schválen)

- **R1 — ROZHODNUTO:** funkční tlačítko = **„Chci konzultaci"**; **„CHCI RŮST" jako výrazný brand slogan mimo tlačítko** (hero kicker/marquee). (Zadavatel přijal doporučení flow testu.)
- **R2 — ROZHODNUTO: všech 8 odvětví ZŮSTÁVÁ.** Redukce a 301 mapa odpadají. Místo toho: přepsat všech 8 bez nepodložených čísel a regulatorního name-droppingu (§6/§8), „šest oborů" opravit na osm, offerings-data subtitles zmírnit. Detaily v copy-rewrites.md §9.
- **R3 — ROZHODNUTO:** GBP jako **Service Area Business** (skrytá adresa); storefront později, až budou kanceláře.
- **R4 — ROZHODNUTO (částečně):** čísla a portfolio se nyní **skrývají** — větev vize §8.2 je aktivní (hero i copy bez slibu čísel); portfolio a výsledková čísla z jiných projektů zadavatel doplní později. **Zůstává otevřené (neblokuje Vlny 0–1):** DIČ + spisová značka (Roman — blokuje JSON-LD P0-23), finální právní texty GDPR/cookies (Roman — launch-gate §14 bod 5), LinkedIn, GA4 baseline.

---

## Akční plán (podle dopadu)

### Vlna 0 — Okamžitě: provisioning + trust hygiene (největší dopad na konverzi vůbec)
1. **Provisioning vendor účtů** (Trung + Roman, souběžně s vývojem): Supabase, Turnstile, Resend + doména, Cal.com + event typy, GA4 property, Cookiebot site. Bez toho web nezachytí jediný lead. **Sekvenční podmínka: Turnstile klíče nasadit ve stejném deployi jako Supabase/Resend, nebo dřív** (jinak fail-open Turnstile = funkční zápisový endpoint bez captchy — viz P0-05).
2. **Trust-hygiene + security PR** (2–3 dny; ideálně rozdělit na trust-hygiene a security část — upgrade Next.js vyžaduje regresní ověření locale allowlistu): NAP → Hradec Králové všude (footer, marquee, kontakt, llms.txt) · rok 2026 pryč · 16→18 (×2) · {{LINK}} placeholdery · blog badge + nav + noindex + sitemap · **EN stuby noindex + odstranit en z hreflang alternates (P0-19)** · mrtvé klíče · /spoluprace priorita 0.8 · 301 vyroba-logistika · Next.js upgrade (CVE) · typografický linter do CI · audit-level high · **origin allowlist fix (P1-01 — přesunuto sem z Vlny 3: ~10 řádků, musí být nasazen dřív, než provisioning oživí endpointy)**.

### Vlna 1 — Konverzní model (vize §9 do kódu; nezávislé na provisioningu)
CTA přepnutí na všech 11 šablonách + nav + footer (P0-01…04, P1-10, P1-11) · MagneticCta „hero" variant (výrazně větší) · fallback '/kontakt#form' · odstranění audit sekce z homepage → důkazová sekce · text CTA dle **R1**.

### Vlna 2 — Copy (Fáze 2; hotové přepisy v copy-rewrites.md)
Hero + meta + generateMetadata 9 stránek (SEO titly dle clusterů) · title šablony detailů (P1-20, 2 soubory = 23 stránek) · o-nas · spoluprace · kontakt · 3 exempláře služeb + 15 dle šablony + FAQ doplnění (P0-24) · řešení 2 balíčky · **odvětví dle R2: přepis všech 8 bez nepodložených tvrzení + zmírnění offerings-data subtitles (struktura routes beze změny)** · i18n migrace hardcoded stringů · sjednocení CTA labelů na „Chci konzultaci" (R1). Poté: llms.txt refresh.

### Vlna 2b — EN parita (vize §10; startuje až po schválení finálního CS copy) ✅ hotovo 2026-08-02
Doplnění 194 leaf klíčů do content/en/strings/common.json · odstranění `<EnglishStub>` (předpoklad: i18n migrace z Vlny 2 hotová) · hreflang cs+en až po paritě. **Neblokuje Fázi 3 ani launch** — do parity zůstávaly EN routy noindex + mimo sitemap (P0-19 řešen ve Vlně 0), po této vlně už EN noindex nemá.

Realizace: 694 chybějících leaf klíčů doplněno (finální CS mezitím narostla nad původní odhad 253 → 815 leaf klíčů), `<EnglishStub>` + `src/components/en-stub.tsx` smazány, `lib/offerings-data.ts` přepsán na locale-aware hook (mega-menu a homepage byly hardcoded CS bez ohledu na locale — nález nad rámec zadání), 3 detail šablony (sluzby/reseni/odvetvi `[slug]`) opraveny z hardcoded CS JSON importu na locale-aware výběr, sitemap.ts + routes.ts + layout.tsx (robots) aktualizovány pro plnou paritu. Vedlejší nález a oprava: `ochrana-body.tsx` renderoval zastaralou adresu „Praha" + `IČO [doplnit]` navzdory opravenému JSON z Vlny 0 — desynchronizovaná hardcoded kopie, opraveno na obou locales. Detail: `decisions.md` D-017.

### Vlna 3 — Technické opravy
Webhook idempotence (P0-15) · CSP enforcing + nonce (P0-16) · LCP fix H1 (P0-21) · RSC refaktor PageHero + legal (P0-22) · JSON-LD zapojení (P0-23 — po dodání DIČ/spisové značky z R4) + FAQPage schema (P0-24) · OG image + meta · canonical · not-found · favicon · potvrzovací e-mail · double opt-in (launch-gate podmínka — GDPR prokazatelnost) · booking_completed listener · Cal.com custom fields · LazyMotion + rAF · P2 balík · aktualizace CLAUDE.md dle reality.

### Vlna 4 — Viditelnost (Fáze 5; po Vlně 0 NAP fixu)
LinkedIn založit · GBP + Firmy.cz dle připraveného obsahu (seo-visibility.md §5–7) · sekce „Zeptejte se AI" (po JSON-LD) · obsahový start: re-copy 3 pilířů, první články dle clusterů, /diagnoza/* postupně (vendor lock-in první — největší mezera).

#### Vlna 4a — viditelnost nezávislá na provisioningu ✅ hotovo 2026-08-05
Realizace: P1-19 sekce „Zeptejte se na nás AI" nasazena (homepage za ProofSection, /o-nas před closing CTA, /spoluprace před FAQ — spec seo-visibility.md §4 doslova, včetně Gemini copy-to-clipboard fallbacku) · P1-18 `public/llms.txt` kompletně přepsán ze zdrojů `common.json` + `site.ts` (18 služeb / 5 řešení / 8 odvětví, konverzní model konzultace-primární + audit jako produkt, NAP bez roku založení, nová sekce hreflang cs/en) · P1-15 LazyMotion dokončen — zbylých 11 souborů (+ `o-nas-body.tsx` při zapojování AskAi) převedeno z `motion.` na `m.`; bundle `.next/static/chunks` 1 486 320 B → 1 437 194 B (−49 126 B, ≈−3,3 %), konečně reálný pokles (D-016 fast-follow). Zbývá **Vlna 4b** (provisioning-závislé): LinkedIn, GBP, Firmy.cz.

### Vlna 5 — Chatbot (samostatný workstream)
Dle workplanu; launch gate = prompt-injection baterie 15+ scénářů, žádné logování obsahu (§14 bod 12). Neprojde → nejde na web.

### Po vlnách 0–3: launch-gate checklist vize §14 (12 bodů) — Fáze 4 odškrtává.
