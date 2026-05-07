# Zásady používání cookies

> **POZNÁMKA**: tento dokument je draft připravený Claude Code na základě technické architektury VICTA. Před publikací je nezbytný review českým právníkem specializovaným na ochranu osobních údajů.

**Verze**: 1.0 (draft)
**Datum účinnosti**: [ROMAN: doplnit datum publikace]
**Platnost**: do vydání nové verze

---

## Úvod

V těchto zásadách vám my, společnost VICTA (správce: [ROMAN: vyplnit obchodní firmu]), vysvětlujeme, jaké cookies a obdobné technologie používáme na našich webových stránkách, k čemu je používáme, jak dlouho je uchováváme a jak můžete spravovat svůj souhlas s jejich použitím.

Tyto zásady jsou doplňkem našich [Zásad ochrany osobních údajů](/cs/zasady-ochrany-osobnich-udaju/) — pro úplný obraz o tom, jak zpracováváme osobní údaje, doporučujeme přečíst si oba dokumenty.

---

## 1. Co jsou cookies

**Cookies** jsou malé textové soubory, které navštívená webová stránka ukládá ve vašem prohlížeči nebo zařízení (počítač, telefon, tablet). Při dalších návštěvách stránky se tyto soubory odesílají zpět na server — díky čemuž si stránka může pamatovat například jazykové nastavení, obsah košíku, přihlašovací stav nebo statistické informace o vašem chování.

Cookies se rozlišují podle:

- **Doby platnosti**: relační (session) — mažou se po zavření prohlížeče; trvalé (persistent) — zůstávají ve vašem zařízení po stanovenou dobu.
- **Původu**: vlastní (first‑party) — od stránky, kterou navštěvujete; třetích stran (third‑party) — od jiných služeb (např. analytiky, reklamních sítí).
- **Účelu**: nezbytné, statistické, marketingové, preferenční.

Vedle cookies používáme i obdobné technologie (např. **localStorage** v prohlížeči pro ukládání tématu světlý/tmavý) — i když technicky nejde o cookies, posuzujeme je pro účely souhlasu stejnými pravidly.

---

## 2. Právní základ pro používání cookies

Používání cookies se řídí zákonem č. 127/2005 Sb., o elektronických komunikacích (§ 89), a směrnicí 2002/58/ES (ePrivacy směrnicí), jakož i nařízením GDPR.

Platí jednoduché pravidlo:

- **Nezbytné cookies** (technicky nutné pro fungování webu) — používáme bez souhlasu, neboť bez nich by web nefungoval.
- **Všechny ostatní cookies** (statistické, marketingové, preferenční) — používáme pouze po vašem výslovném souhlasu uděleném v consent bannerově.

Souhlas si vyžadujeme prostřednictvím nástroje **Cookiebot** (Cybot A/S, Dánsko) — uživatelsky přívětivé řešení, které splňuje požadavky GDPR a ePrivacy směrnice. Než udělíte souhlas, žádné statistické ani marketingové cookies se neukládají.

---

## 3. Jaké cookies používáme

Níže najdete kompletní seznam cookies používaných na našem webu. Seznam pravidelně aktualizujeme.

### 3.1 Nezbytné cookies (bez souhlasu)

Tyto cookies jsou nutné pro základní fungování webu — bez nich by stránky nešly správně načíst nebo by nefungovaly klíčové funkce (rezervace, ochrana proti spamu).

| Název cookie | Poskytovatel | Účel | Doba platnosti | Typ |
|---|---|---|---|---|
| `__cf_bm` | Cloudflare | Bot defense (Cloudflare Turnstile) — odlišuje legitimní návštěvníky od automatizovaných botů, ochrana kontaktního formuláře proti spamu | 30 minut | HTTP cookie, third‑party |
| `cf_clearance` | Cloudflare | Potvrzení, že návštěvník prošel bot challenge — zabraňuje opakovanému ověřování | Session | HTTP cookie, third‑party |
| `CookieConsent` | Cookiebot | Uchování vaší volby v consent bannerově (která kategorie cookies byla schválena) | 12 měsíců | HTTP cookie, third‑party |
| `cb-enabled` | Cookiebot | Pomocný indikátor stavu CMP | Session | HTTP cookie, third‑party |
| `cal.com session` | Cal.com | Funkční rezervační widget (pouze na stránkách, kde je widget načten) | Session | HTTP cookie, third‑party |
| `vercel-flight-prefetch` | Vercel | Optimalizace navigace v aplikaci (Next.js prefetch) | Session | HTTP cookie, first‑party |

**localStorage (technologicky nezbytný)**:

| Klíč | Účel | Doba platnosti |
|---|---|---|
| `victa-theme` | Uchování vaší volby tématu (světlý / tmavý / podle systému) | Trvale, dokud nesmažete úložiště prohlížeče |
| `victa-locale-preference` | Uchování vaší volby jazyka při ručním přepnutí (cs / en) | Trvale, dokud nesmažete úložiště prohlížeče |

> Poznámka: téma a jazykové preference ukládáme do `localStorage`, nikoli do cookies — `localStorage` se neodesílá s každým HTTP požadavkem, je tedy efektivnější. Z hlediska souhlasu jej však posuzujeme stejně jako cookies. Vzhledem k tomu, že jde o uživatelské preference nezbytné pro funkčnost zvolené uživatelské zkušenosti (téma, jazyk), pracujeme s nimi v kategorii „nezbytné“ — ukládají se pouze tehdy, když preferenci aktivně nastavíte.

### 3.2 Statistické cookies (vyžadují souhlas)

Tyto cookies nám pomáhají rozumět tomu, jak návštěvníci náš web používají — kolik lidí navštíví jakou stránku, odkud přicházejí, co je nejvíce zajímá. Údaje jsou anonymizované a slouží výhradně k vylepšení obsahu a funkčnosti webu.

| Název cookie | Poskytovatel | Účel | Doba platnosti | Typ |
|---|---|---|---|---|
| `_ga` | Google Analytics 4 | Identifikace unikátního uživatele pro statistiky návštěvnosti | 24 měsíců | HTTP cookie, third‑party |
| `_ga_<container-id>` | Google Analytics 4 | Uchování stavu sezení (session state) pro GA4 | 24 měsíců | HTTP cookie, third‑party |
| `_gid` | Google Analytics 4 | Identifikace uživatele po dobu sezení | 24 hodin | HTTP cookie, third‑party |
| `_gat_*` | Google Analytics 4 | Omezení četnosti požadavků na server GA4 | 1 minuta | HTTP cookie, third‑party |

> Před udělením souhlasu pracuje Google Analytics 4 v režimu **Consent Mode v2** — odesílá pouze anonymní pingy bez ukládání jakýchkoli cookies a bez identifikace uživatele.

### 3.3 Marketingové cookies (vyžadují souhlas)

Tyto cookies slouží ke sledování návštěvníků napříč webovými stránkami pro účely zobrazování relevantní reklamy nebo měření efektivity marketingových kampaní.

| Název cookie | Poskytovatel | Účel | Doba platnosti | Typ |
|---|---|---|---|---|
| Pixel pro otevření newsletteru | Resend | Sledování, zda byl odeslaný newsletter otevřen (pouze pro statistiku doručitelnosti) | Po jednorázovém načtení obrázku | Tracking pixel, third‑party |

> Aktuálně **nepoužíváme** žádné cookies pro retargeting (Facebook Pixel, Google Ads remarketing apod.). Pokud bychom v budoucnu retargeting zavedli, doplníme tabulku a vyžádáme si k tomu váš nový souhlas.

### 3.4 Preferenční cookies (vyžadují souhlas)

Tyto cookies zajišťují personalizaci webu pro vás (např. uchování zobrazení tabulek nebo formulářů ve specifickém stavu). Aktuálně **nepoužíváme** žádné samostatné preferenční cookies — preference (téma, jazyk) ukládáme v `localStorage` jako součást nezbytných technologií (viz oddíl 3.1).

---

## 4. Kategorie cookies — souhrn

Pro přehlednost shrnujeme čtyři standardní kategorie podle Cookiebot CMP:

| Kategorie | Souhlas | Co kontroluje |
|---|---|---|
| **Nezbytné** | Není vyžadován | Technicky nutné pro fungování webu (přihlášení, košík, ochrana proti spamu, načítání stránek) |
| **Statistické** | Vyžadován | Anonymní měření návštěvnosti, optimalizace obsahu |
| **Marketing** | Vyžadován | Sledování napříč weby pro reklamní účely (aktuálně nevyužíváme retargeting) |
| **Preferenční** | Vyžadován | Personalizace zobrazení podle vašich voleb |

---

## 5. Jak změnit nebo zrušit souhlas s cookies

Svůj souhlas s cookies můžete kdykoli změnit nebo odvolat — má to být stejně snadné jako jeho udělení.

### 5.1 Prostřednictvím Cookiebot widgetu

V patičce webu najdete odkaz **„Změnit nastavení cookies“**. Po kliknutí se znovu otevře consent banner, kde můžete změnit svou volbu pro jednotlivé kategorie nebo souhlas zcela odvolat.

### 5.2 Prostřednictvím nastavení prohlížeče

Cookies můžete také mazat nebo blokovat přímo v nastavení svého prohlížeče. Postup se liší podle konkrétního prohlížeče:

- **Google Chrome**: Nastavení → Soukromí a zabezpečení → Cookies a další data webů
- **Mozilla Firefox**: Nastavení → Soukromí a zabezpečení → Cookies a data stránek
- **Safari**: Nastavení → Soukromí → Spravovat data webových stránek
- **Microsoft Edge**: Nastavení → Soubory cookie a oprávnění webů → Spravovat a odstranit soubory cookie
- **Opera**: Nastavení → Soukromí a zabezpečení → Soubory cookie

> **Upozornění**: pokud zablokujete nezbytné cookies, některé části webu nemusí fungovat správně (např. rezervační widget Cal.com nebo ochrana kontaktního formuláře).

### 5.3 Hromadné nástroje

Některé prohlížeče i nezávislé nástroje umožňují plošně odmítnout sledovací cookies:

- **Global Privacy Control (GPC)** — náš web respektuje signál GPC odeslaný prohlížečem.
- **Do Not Track (DNT)** — zastaralý standard; respektujeme jej v rozsahu, v jakém je to technicky možné, ale primárním nástrojem pro správu souhlasu je Cookiebot widget.

---

## 6. Cookies třetích stran a předávání dat mimo EU

Některé z výše uvedených cookies jsou nastavovány přímo třetími stranami (Google, Cloudflare, Cookiebot, Cal.com, Resend). Tito poskytovatelé mohou zpracovávat údaje na svých serverech mimo Evropský hospodářský prostor — zejména v USA.

Pro tyto přenosy uplatňujeme stejné záruky jako u zpracování osobních údajů — viz oddíl 6 v [Zásadách ochrany osobních údajů](/cs/zasady-ochrany-osobnich-udaju/):

- **Standardní smluvní doložky (SCCs)** podle prováděcího rozhodnutí Komise (EU) 2021/914,
- u Google rovněž **EU‑US Data Privacy Framework**,
- pinning regionu **Frankfurt** u serverové infrastruktury (Vercel, Supabase).

---

## 7. Aktualizace seznamu cookies

Seznam cookies aktualizujeme:

- při zavedení nového nástroje nebo služby na webu,
- při změně účelu nebo doby platnosti existujících cookies,
- minimálně jednou ročně v rámci pravidelného review.

Aktuální technický scan cookies provádí nástroj **Cookiebot** automaticky — pokud objevíte cookie, který v této tabulce chybí, prosíme o upozornění na adrese **privacy@victaagency.com**.

---

## 8. Kontakt

V případě dotazů ohledně používání cookies se na nás můžete obrátit:

- **Email pro ochranu osobních údajů**: privacy@victaagency.com
- **Obecný kontakt**: [ROMAN: vyplnit obecný email]

Více informací o tom, jak nakládáme s osobními údaji obecně, najdete v dokumentu [Zásady ochrany osobních údajů](/cs/zasady-ochrany-osobnich-udaju/).

---

## 9. Změny zásad používání cookies

Tyto zásady můžeme čas od času aktualizovat. Aktuální verze je vždy dostupná na adrese **/cs/cookies/**. Při významných změnách vás budeme informovat:

- emailem zaslaným odběratelům newsletteru,
- viditelným upozorněním v patičce webu po dobu nejméně 30 dní,
- u změn vyžadujících nový souhlas — obnoveným consent bannerově při vaší další návštěvě.

**Verze a datum účinnosti** jsou uvedeny v záhlaví tohoto dokumentu.

---

*Tento dokument byl naposledy aktualizován [ROMAN: doplnit datum publikace].*
