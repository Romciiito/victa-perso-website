# Design spec — Sekce „Agentní systémy"

- **Datum:** 2026-07-01
- **Stav:** Schváleno v brainstormingu; slugová otázka vyřešena (§6.3); čeká na finální approval specu
- **Branch:** `claude/d008-revival-may11`
- **Kontext:** Přidat na web VICTA sdělení „stavíme agentní systémy pro firmy i jednotlivce" s use casy: sekundární mozky, RAG úložiště, zpracování dat — tak, aby dávalo smysl po stránce web placementu, SEO, AEO a copywritingu.

---

## 1 · Rozhodnutí z brainstormingu

| Otázka | Rozhodnutí |
|---|---|
| Publikum | **Firmy primárně**, jednotlivci vedlejší — zmíněni **jednou větou** u konceptu „sekundární mozek", ne samostatný segment ani landing. |
| Umístění | **Rozšířit stávající řešení** — zastřešit je narativem „Agentní systémy", žádná nová top-level stránka. |
| Rozsah | **Plná verze** — Core (index + detaily + schema) **+** homepage sekce Řešení **+** tweak mega-menu. |
| Mapování use casů | second brain + RAG → **Znalostní asistent** (`/reseni/znalostni-asistent`); zpracování dat → **Autonomní agenti** (`/reseni/autonomni-agenti`). |

**Vědomý trade-off:** „rozšířit stávající" nezakládá novou rankovatelnou URL. SEO/AEO hodnota se proto vytáhne **prohloubením dvou už existujících detailních URL** (dnes jen stuby) + nasazením schématu, které v projektu existuje, ale nikde se nepoužívá.

---

## 2 · Pozice & narativ

Zastřešující myšlenka: **„Agentní systémy — AI, která nejen odpovídá, ale jedná."**

- Nepřejmenováváme stávajících 5 balíčků řešení (zbytečný ripple přes 3 zdrojové soubory + menu + homepage). Narativ „agentní systémy" je **střecha**, ne přejmenování.
- Firmy jsou hlavní adresát; jednotlivci se objeví **jednou decentní větou** tam, kde je řeč o „sekundárním mozku" (firemní znalostní báze *i* osobní „druhý mozek").
- Tři use casy dostanou **pojmenované, viditelné místo** (karty na `/reseni`) a **hloubku** (v detailních stránkách).

---

## 3 · Informační architektura (co kam přijde)

### 3.1 `/reseni` (index) — `reseni-body.tsx`
- **Nový úvodní blok „Agentní systémy"** hned pod hero: 2–3 věty co to je + **3 pojmenované use-case karty**:
  1. **Sekundární mozky** → odkaz `/reseni/znalostni-asistent#sekundarni-mozek`
  2. **RAG úložiště** → odkaz `/reseni/znalostni-asistent#rag`
  3. **Zpracování dat** → odkaz `/reseni/autonomni-agenti#zpracovani-dat`
- Stávajících 5 sekcí zůstává beze změny pod novým blokem.
- Hero subhead lehce doplnit o „agentní systémy" jako zastřešující pojem.

### 3.2 Prohloubené detailní stránky — `reseni/[slug]/solution-body.tsx`
Povýšit ze stubu (hero + audience + CTA) na **hloubku `/odvetvi/[slug]`** — kompozice `hero → 01 problém → 02 jak na to → 03 proces → FAQ → CTA`.

- **`/reseni/znalostni-asistent`** — pokrývá **sekundární mozek** (kotva `#sekundarni-mozek`) + **RAG úložiště** (kotva `#rag`). Sem patří jednorázová věta o jednotlivcích.
- **`/reseni/autonomni-agenti`** — pokrývá **agentní systémy** framing + **zpracování dat** (kotva `#zpracovani-dat`); cross-link na `/reseni/dashboardy` jako downstream vizualizaci.
- Zbylé 3 detaily (`podpora`, `dashboardy`, `infrastruktura`) zůstávají jako stuby — `sections`/`faq` jsou volitelné, renderer je degraduje gracefully.

### 3.3 Homepage — `home-body.tsx` → `SolutionsSection` (Plná verze)
Sekce čte z `SOLUTIONS_OFFERING` v `offerings-data.ts`. Úprava:
- `sidebarHeadline`: `AI řešení na klíč` → **`Agentní systémy na klíč`** (nebo obdoba).
- `sidebarDescription`: přeformulovat na agentní systémy / second brain / RAG / zpracování dat.

### 3.4 Mega-menu — `nav.tsx` (Plná verze)
Čte také z `SOLUTIONS_OFFERING`. Úprava se propíše automaticky přes změnu `sidebarHeadline`/`sidebarDescription` v 3.3. Volitelně sladit `subtitle` u položek `Znalostní asistent`/`Autonomní agenti`, aby zmiňovaly second brain / zpracování dat.

---

## 4 · Obsahový model (změny JSON)

`content/cs/strings/common.json` → `reseni`:

### 4.1 Rozšíření položek `reseni.items[]`
Přidat **volitelné** klíče (aby stuby bez nich fungovaly dál):
```jsonc
{
  "key": "agents",
  "label": "02 · AUTONOMNÍ AGENTI",
  "name": "Autonomní agenti",
  "body": "…",              // stávající krátký odstavec (hero sub)
  "audience": "…",           // stávající
  "slug": "autonomni-agenti",  // PŘEJMENOVÁNO z "agenti" (web není indexovaný, viz §6.3)
  "sections": {              // NOVÉ, volitelné — mirror odvetvi
    "problem": "…\n\n…",
    "approach": "…\n\n…",
    "process": [ { "title": "…", "body": "…" } ]
  },
  "faq": [                   // NOVÉ, volitelné — pro AEO
    { "q": "Co je agentní systém?", "a": "…" }
  ],
  "seo": {                   // NOVÉ, volitelné — override title/description
    "title": "…",
    "description": "…"
  }
}
```

### 4.2 Nový blok `reseni.agentni` (pro index úvod + karty)
```jsonc
"agentni": {
  "eyebrow": "agentní systémy",
  "headline": "…",
  "lead": "…",
  "cards": [
    { "title": "Sekundární mozky", "body": "…", "href": "/reseni/znalostni-asistent#sekundarni-mozek" },
    { "title": "RAG úložiště",     "body": "…", "href": "/reseni/znalostni-asistent#rag" },
    { "title": "Zpracování dat",   "body": "…", "href": "/reseni/autonomni-agenti#zpracovani-dat" }
  ]
}
```

---

## 5 · Komponenty (změny kódu)

| Soubor | Změna |
|---|---|
| `reseni/[slug]/solution-body.tsx` | Rozšířit typ `SolutionItem` o `sections?`/`faq?`; renderovat problém/přístup/proces (mirror `industry-body.tsx`, sdílet `paragraphs()` helper) + FAQ blok s kotvami. Gracefully degradovat, když chybí. |
| `reseni/[slug]/page.tsx` | `generateMetadata` — použít `item.seo?.title/description` s fallbackem; přidat `<JsonLd>` s `buildServiceSchema` + `buildBreadcrumbSchema` + `buildFaqSchema` (když `faq` existuje). |
| `reseni/reseni-body.tsx` | Přidat úvodní blok „Agentní systémy" + 3 use-case karty (čti z `reseni.agentni`). |
| `lib/offerings-data.ts` | `SOLUTIONS_OFFERING.sidebarHeadline`/`sidebarDescription` reframe (propíše se do homepage i mega-menu). Volitelně upravit `subtitle` u 2 položek. |
| `components/seo/json-ld.tsx` | Beze změny — jen se poprvé použije. |

Pozn.: `solution-body.tsx` a `industry-body.tsx` sdílejí skoro identický layout problém/přístup/proces → zvážit extrakci sdíleného `DetailSections` komponentu, ať se logika neduplikuje. Rozhodne se v implementačním plánu (nezvětšovat rozsah zbytečně).

---

## 6 · SEO plán

### 6.1 Cílové intenty (CZ)
- **Znalostní asistent:** `sekundární mozek`, `druhý mozek / second brain`, `RAG`, `RAG úložiště`, `firemní znalostní báze AI`, `AI asistent na dokumentaci`.
- **Autonomní agenti:** `agentní systémy`, `AI agenti pro firmy`, `automatizace zpracování dat`, `AI zpracování dat`, `autonomní AI agent`.

### 6.2 On-page
- Unikátní `title` + `description` na obou detailech (dnes generické „Název — VICTA"; `description` = jen krátký `body`).
- H1 = název, H2 postavené na cílových frázích (problém/přístup/proces + FAQ otázky jako H2/H3).
- Interní prolink: index úvod → detaily; homepage → `/reseni`; mezi detaily; „zpracování dat" → `/reseni/dashboardy`.
- `canonical` už existuje (ponechat).

### 6.3 Sjednocení slugů (web není indexovaný — bez redirect dluhu)
Dnešní drift: `routes.ts` `solutionSlugs` má **popisné** slugy `autonomni-agenti`, `ai-podpora`, `ai-infrastruktura`, ale **živé** slugy (z `reseni.items[].slug`, přes `generateStaticParams`) jsou terse `agenti`, `podpora`, `infrastruktura` → sitemap/robots/llms.txt odkazují na 3 × 404 a živou `/reseni/agenti` neuvádějí.
- **Rozhodnutí (web ještě není indexovaný):** přejmenovat **živé** slugy v JSON na popisné, aby se sešly s `routes.ts`. Klíčová slova rovnou v URL, žádné redirecty.
  - `agenti` → `autonomni-agenti`, `podpora` → `ai-podpora`, `infrastruktura` → `ai-infrastruktura`.
  - `znalostni-asistent` a `dashboardy` beze změny.
- **Konvergence:** `routes.ts` už popisné slugy má → **nemění se**. Mění se `reseni.items[].slug` (JSON) a `SOLUTIONS_OFFERING` hrefy (`offerings-data.ts`). `[slug]/page.tsx` generuje params z JSON, takže sitemap i statické stránky se přizpůsobí automaticky.

---

## 7 · AEO plán

- Do obou prohloubených detailů **FAQ blok (4–6 otázek)**.
- Schema přes `<JsonLd>`: `buildFaqSchema` (FAQPage) + `buildServiceSchema` + `buildBreadcrumbSchema`. Všechny buildery existují v `lib/schema.ts`, dnes nepoužité → zavede se pattern.
- Otázky formulovat tak, jak se ptají lidé i AI; odpověď **citovatelná v 1–2 větách**, pak rozvedení.
- Draft FAQ (voice reference, finalizovat v implementaci):
  - **Agenti:** „Co je agentní systém?", „Jaký je rozdíl mezi chatbotem a AI agentem?", „Jak agenti zpracovávají data?", „Je nasazení bezpečné (human-in-the-loop)?", „Kolik stojí nasazení AI agenta?", „Jak dlouho trvá nasazení?"
  - **Znalostní asistent:** „Co je sekundární mozek (druhý mozek)?", „Co je RAG?", „Co je RAG úložiště?", „Funguje to i pro jednotlivce, ne jen firmy?", „Kde jsou moje data uložená?", „Na jakých dokumentech to funguje?"

---

## 8 · Copywriting — ukázky voice (ne finální)

Tón dle stávajícího webu: sebevědomý, konkrétní, bez buzzwordů („Stavíme, napojíme a pak pomáháme růst.").

> **Střecha (index úvod):** „Stavíme agentní systémy — AI, která nejen odpovídá, ale samostatně jedná. Vyhledá, zpracuje, rozhodne a předá člověku tam, kde to dává smysl."
>
> **Karta „Sekundární mozky":** „Firemní znalostní báze i osobní ‚druhý mozek'. Vaše dokumenty, poznámky a data proměníme v asistenta, který si pamatuje všechno a odpoví přesně na váš kontext."
>
> **Karta „RAG úložiště":** „Bezpečné úložiště vašich dat, ze kterého AI čerpá ověřené odpovědi — ne halucinace. Vaše dokumenty zůstávají vaše."
>
> **Karta „Zpracování dat":** „Agenti, kteří data sami načtou, pročistí, obohatí a předají dál — z e-mailů, PDF i API do jednoho toku."
>
> **Věta o jednotlivcích (jen jednou, u second brain):** „Ať jde o firemní znalostní bázi, nebo o osobní ‚druhý mozek' jednotlivce — princip je stejný."

Vše projde build-time **typografickým linterem** (české „uvozovky", pomlčky, nezlomitelné mezery po jednopísmenných předložkách).

---

## 9 · Mimo rozsah (YAGNI)

- Nová top-level stránka `/agentni-systemy`.
- Samostatná landing/segment pro jednotlivce.
- Blog/obsahový cluster.
- Přejmenování stávajících 5 balíčků řešení.
- EN verze (web je i18n-ready, ale EN je jen stub — držet CS-only jako zbytek obsahu).
- Prohloubení zbývajících 3 stubů (`podpora`, `dashboardy`, `infrastruktura`) — mimo tento úkol.

---

## 10 · Dotčené soubory

- `content/cs/strings/common.json` — rozšíření `reseni.items` (sections/faq/seo) + nový blok `reseni.agentni`.
- `src/app/[locale]/reseni/[slug]/solution-body.tsx` — render hloubky + FAQ.
- `src/app/[locale]/reseni/[slug]/page.tsx` — metadata + JSON-LD schema.
- `src/app/[locale]/reseni/reseni-body.tsx` — index úvodní blok + karty.
- `src/lib/offerings-data.ts` — reframe `SOLUTIONS_OFFERING` (homepage + menu).
- `src/config/routes.ts` — **beze změny** (už má popisné slugy); konvergence nastane přejmenováním JSON slugů + `offerings-data` hrefů (§6.3).
- (volitelně) sdílený `DetailSections` komponent, pokud se extrahuje z `industry-body.tsx`.

---

## 11 · Akceptační kritéria

1. `/reseni` má úvodní blok „Agentní systémy" + 3 funkční use-case karty s kotvami, které skutečně scrollují na cílové sekce.
2. `/reseni/agenti` a `/reseni/znalostni-asistent` renderují problém/přístup/proces + FAQ; stuby bez `sections` se nerozbijí.
3. Obě stránky mají unikátní `title`/`description` a validní JSON-LD (FAQPage + Service + BreadcrumbList) — ověřit v Rich Results Test.
4. Homepage sekce Řešení i mega-menu ukazují nový „agentní systémy" framing.
5. Sitemap se shoduje s živými stránkami (žádné 404) a obsahuje `/reseni/autonomni-agenti`.
6. Build projde vč. typografického linteru; žádné hardcoded hex; žádný `NEXT_PUBLIC_` únik (n/a zde).
7. Věta o jednotlivcích je na webu právě jednou.

---

## 12 · Otevřené otázky (dořešit v review specu)

1. ~~Slugy vs. redirecty~~ — **VYŘEŠENO:** web není indexovaný → přejmenovat živé slugy na popisné (`autonomni-agenti`, `ai-podpora`, `ai-infrastruktura`); `routes.ts` už je zdroj pravdy, žádné redirecty. Viz §6.3.
2. **Extrakce `DetailSections`:** sdílet layout mezi `industry-body` a `solution-body`, nebo zatím zkopírovat? (Rozhodne implementační plán dle rizika.)
3. Headline střechy „Agentní systémy na klíč" vs. jiná formulace — dořešit při psaní finální copy.
