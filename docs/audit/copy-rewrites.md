# Copy přepisy — Fáze 2 auditu (2026-07-28)

Připravené texty k nasazení. Zdroj: 3 copy agenti auditu (jádro / služby / řešení+odvětví), syntéza dle vision.md v1.4. Všechny přepisy respektují: výsledkový jazyk (§3/§6), žádné tvrzení bez důkazu (§8), bez roku založení v copy (§1), NAP = Hradec Králové, podmíněnost §8.2 (bez slibu „čísel", dokud nejsou publikovatelná).

**Pravidlo pro čísla v nových textech:** rozlišujeme (a) **závazek k dodání** — „2–4 týdny od podkladů", „PageSpeed 95+ jako standard" — povolen, protože ho kontrolujeme a doručujeme; a (b) **tvrzení o výsledku/minulosti** — „3× rychlejší", „ušetříte 30–40 %" — vyžaduje důkaz, jinak jde ven. Pozor: závazek „PageSpeed 95+" (weby-na-miru) nenasazovat dřív než výkonové opravy Vlny 3 (LCP/hydratace) — do té doby je vyvratitelný na vlastní doméně.

**[PRIMÁRNÍ CTA] = „Chci konzultaci"** (ROZHODNUTO R1, 28. 7. 2026). Fráze „CHCI RŮST" se nasazuje jako výrazný brand slogan mimo tlačítko — hero kicker/status a marquee (např. status řádek hero: „VICTA · CHCI RŮST — digitální partner pro růst firem" nebo samostatný kicker nad headline; finální umístění ve Vlně 1).

---

## 1. Sitewide

### Meta description (layout.tsx:30 + common.json `site.description`) — P0
Dnes: „Začneme tím, že posloucháme. Než cokoliv navrhneme, chceme rozumět vašemu podnikání."
> **Nové:** „VICTA staví aplikace, AI a firemní systémy pro střední a větší firmy v Česku a na Slovensku — s jasným procesem od záměru po provoz."

### Footer tagline (common.json `footer.tagline`) — P0
> **Nové:** „Aplikace, AI a systémy, které vydělávají. Jeden tým od záměru po provoz."

### Footer status (common.json:31) — P0
Dnes: „VICTA DIGITAL s.r.o. · 2026"
> **Nové:** „VICTA DIGITAL s.r.o. · Hradec Králové" (rok pryč i z copyright řádku)

### Footer city (common.json:52) — P0
`"city": "Praha"` → `"city": "Hradec Králové"`

### Nav CTA pill (nav.tsx:203-209 + 513-522) — P0
Dnes: „Rezervovat audit" → Link /spoluprace#audit
> **Nové:** [PRIMÁRNÍ CTA] → onClick `useCalModal(scoping_call)`, sourcePage z `usePathname()`

### Footer bookCall (common.json:28) — P1
„Domluvit konzultaci →" → **[PRIMÁRNÍ CTA] →** (a předělat z Link na booking trigger — viz conversion-flow-v3.md)

---

## 2. Homepage

### Hero (common.json `home.hero`) — P0
Dnes: „Vývoj na míru & inteligentní AI automatizace." / „Stavíme rychlé weby, e-shopy a automatické AI procesy pro české firmy. Bez zbytečné omáčky, s měřitelným přínosem."
> **status:** „VICTA · Digitální partner pro růst firem"
> **headline:** „Stavíme aplikace, AI a systémy, které vaší firmě vydělávají."
> **sub:** „Pro majitele a ředitele středních a větších firem, kteří řeší digitalizaci, interní systémy a automatizaci. Žádné sliby bez plánu — každá fáze má jasný výstup a termín."
> **ctaPrimary:** [PRIMÁRNÍ CTA] → booking modal (ne link na audit). Ghost CTA odstranit, nebo nahradit tichým odkazem „Jak spolupracujeme →" na /spoluprace — nikdy druhá konkurenční pilulka.

Pozn.: bez slova „čísla"/„měřitelný přínos" — §8.2, dokud nejsou publikovatelná čísla.

### AuditSection (home-body.tsx:251-335) — P0: celou sekci NAHRADIT důkazovou sekcí dle §8
> **eyebrow:** „04 · jak pracujeme"
> **headline:** „Proces, který stojí na výstupech, ne na slibech."
> **lead:** „Každá fáze má jasný výstup, termín a garanci. Žádný krok, který byste museli brát na víru."
> **3 karty:**
> 1. „Audit se nikdy nevyhodí" — „Cenu auditu odečteme z rozpočtu projektu, pokud po něm pokračujete s námi."
> 2. „Malý tým, žádná režie" — „Rozhodují lidé, kteří na projektu skutečně pracují — ne účtované vrstvy managementu."
> 3. „Po launchi nezmizíme" — „Měsíční reporting a přímý kontakt, dokud systém neběží tak, jak má."
> **CTA:** [PRIMÁRNÍ CTA] → booking

### Marquee (home-body.tsx:47-57) — P0
„Praha · Hradec Králové · Trutnov" → **„Hradec Králové"** (jedno město; případné další lokace doložit na /kontakt, ne v marquee)

### Mrtvé klíče (common.json:71-80) — P2
`visualTag: 'VICTA Process · 2026'`, `leadAuditLabel`, `leadConsultLabel`… — nikde nerenderované, smazat při přepisu (rok-2026 copy-paste past).

---

## 3. /o-nas

### Team sekce (oNas.sections.team) — P0
Dnes: „Tým se brzy představí." / „…Konkrétní lidi a role zveřejníme po launch první klientské vlny. Mezitím vás zajímá hlavně, jestli umíme dodat — a na to je nejlepší odpovědí naše práce." (odkazuje na důkaz, který neexistuje)
> **headline:** „Jména přidáme s prvními klienty — záměrně."
> **body:** „VICTA stavíme kolem lidí, ne kolem vizitky. Konkrétní jména, role a zkušenosti zveřejníme, jakmile je doplníme o to, co přesvědčí nejvíc: reálné projekty, na kterých pracovali. Do té doby nás poznáte přes to, jak přemýšlíme a jak pracujeme — viz principy výše."

### Hodnota „AI drží detaily…" (common.json:966-968) — P0
Dnes: „Co u velkých agentur trvá 3 měsíce, u nás 3 týdny…" (4× rychlejší bez jediného důkazu)
> **Nové:** „AI píše kód, testuje a hlídá detaily. Myšlení, strategii a rozhodnutí drží lidé v týmu. Výsledek: malý tým bez režie třiceti hlav, kterou byste jinak platili u velké agentury."

### Closing CTA (common.json:989) — P1
„Rezervovat audit →" → **[PRIMÁRNÍ CTA]** (booking); sekundárně textový odkaz „Nebo se podívejte, jak spolupracujeme →" na /spoluprace.

---

## 4. /spoluprace

### Hero (spoluprace.hero) — P1
> **headline:** „Audit je produkt. Ne vstupenka k prodeji."
> **subhead:** „Placený audit je samostatná strategická práce s vlastním výstupem — ne úvodní schůzka, po které něco prodáváme. Řešíte jednu konkrétní zakázku? Stačí bezplatný 30minutový hovor."
> + doplnit hero CTA (dnes žádné): primární [PRIMÁRNÍ CTA] (booking), sekundární scroll-anchor „Prohlédnout audit tiery ↓".

### Spodní CTA band (spoluprace-body.tsx:295-298) — P0
„Domluvit hovor →" → **[PRIMÁRNÍ CTA]** (jednotná fráze).

### FAQ — ponechat beze změny (silná stránka: konkrétní čísla a rozsahy, vzor atol).

---

## 5. /kontakt

### Korespondenční adresa (common.json:1020) — P0
Dnes: „Sídlo VICTA DIGITAL s.r.o. (IČO 28859511). Korespondenční adresa: Babákova 14, 148 00 Praha 11."
> **Nové:** „Sídlo VICTA DIGITAL s.r.o. (IČO 28859511)." — pražskou adresu odstranit z veřejného copy.

### Rok založení „2026" — P0: odstranit (vize §14 bod 1).

### Reakční doba (common.json:1002 vs. 1010) — P1
Rozpor „do 2 pracovních dnů" vs. „do 1 pracovního dne" — sjednotit na 1:
> **primary.body:** „Pro nové poptávky je nejrychlejší cesta rezervovat si bezplatnou 30minutovou konzultaci. Ozveme se do 1 pracovního dne."

---

## 6. /blog

- **Badge (blog-body.tsx:63-67) — P0:** odstranit „BLOG · COMING SOON · v 0.2.0"; použít `t('comingSoon.label')` („PŘIPRAVUJEME").
- **Footer odkaz (footer.tsx:17-22) — P0:** odebrat blog z COMPANY pole do ≥ 3 článků.
- **Hero CTA — P1:** primární [PRIMÁRNÍ CTA] (booking), newsletter zůstává jako sekce, ne hero primární.
- Sitemap/noindex — viz technický audit.

---

## 7. Služby

### Hub (common.json:407) — P0
„16 služeb" → **„18 služeb"** (stejná oprava na /reseni hubu, common.json:649).

### Hub intro IT & vývoj (common.json:412) — P2
> **Nové:** „Web nebo e-shop, který firmě vydělává, ne jen existuje. Next.js, Shopify, headless CMS — nasazujeme to, co skutečně potřebujete, ne to, co je zrovna móda."

### FAQ placeholder — P0
`{{LINK:spoluprace}}` (common.json:552) a `{{LINK:kontakt}}` (623) se renderují doslovně v produkci — nahradit skutečným odkazem, nebo přeformulovat bez placeholderu.

### Sdílený CTA band (service-body.tsx:139-151) — P0
Copy-paste blok „Audit ukáže, kde začít…" identický na 18 stránkách + primary „Rezervovat audit": přepsat tak, aby prvně nabízel bezplatný hovor ([PRIMÁRNÍ CTA] primary) a audit zmínil jako volitelný krok; blok personalizovat aspoň podle kategorie (IT/AI/marketing).

### Exemplář 1 — /sluzby/ai-chatboti (AI & Data) — P0, HOTOVÝ PŘEPIS
> **desc:** „Zákazníci čekají hodiny na odpověď, kterou váš tým psal už stokrát — a mimo pracovní dobu se dotazy jen hromadí. Stavíme AI chatboty napojené na vaši znalostní bázi (RAG) — ne obecný scripted bot, ale asistenta, který zná váš ceník, dokumentaci a historii objednávek. Modely Claude, GPT a další běží abstrahované přes Vercel AI Gateway, takže model přepneme bez přepisu kódu a bez závislosti na jednom vendorovi. Výsledek: opakující se dotazy vyřízené okamžitě a 24/7, tým se soustředí na případy, které si to skutečně žádají."
> **fit:** „firmy se zákaznickou podporou zahlcenou opakujícími se dotazy, e-shopy s vysokým objemem dotazů na objednávky a dodání, B2B firmy se složitou dokumentací, kde support tráví čas hledáním odpovědi místo jejího řešení."
> **faq:**
> - „Jak dlouho trvá nasazení chatbota?" → „Základní verze napojená na FAQ a dokumentaci: 2–4 týdny od předání podkladů. Napojení na objednávkový systém nebo CRM prodlužuje harmonogram podle složitosti integrace — rozsah upřesníme po konzultaci."
> - „Co když chatbot odpoví špatně nebo mimo rozsah?" → „Chatbot odpovídá jen z podkladů, které mu dáme k dispozici — mimo ně se nepředstírá vševědoucí a předá dotaz na člověka. Rate-limity a monitoring hlídají zneužití i výpadky."
> - „Uvidíme, na co se lidé ptají?" → „Logujeme jen technické metriky (počet zpráv, dobu odezvy), nikdy obsah konverzace — GDPR i interní bezpečnostní politika to vylučují."

### Exemplář 2 — /sluzby/weby-na-miru (IT & Vývoj) — P1, HOTOVÝ PŘEPIS
> **desc:** „Šablonový web dnes stojí firmu poptávky dřív, než si to majitel stihne uvědomit — pomalé načítání vyhání návštěvníka během pár vteřin a AI vyhledávače weby bez strukturovaných dat prostě neuvidí. Stavíme marketingové weby, korporátní prezentace a landing pages jako obchodní nástroj, ne vizitku: Next.js nebo Astro, nasazení na Vercel, bez rizikového pluginového balastu. Výsledek — PageSpeed 95+/100 a přístupnost dle WCAG 2.1 AA jako standard, ne příplatek: méně opuštěných návštěv, čitelnost pro AI asistenty a prezentace, která konečně odpovídá velikosti firmy."

### Exemplář 3 — /sluzby/seo (Marketing & Obsah) — P0, HOTOVÝ PŘEPIS
> **desc:** „Firma je pro klíčové dotazy, kterými ji hledají vlastní zákazníci, na Googlu neviditelná — konkurence obsazuje první stránku výsledků, zatímco vy platíte za PPC nebo spoléháte na doporučení. Řešíme technické SEO (rychlost, indexace, strukturovaná data), content strategii cílenou na dotazy, které rozhodovatelé skutečně zadávají, link building a lokální SEO tam, kde dává smysl. Měříme přes Search Console a vlastní dashboardy — žádné reporty bez čísel, žádné černé skříňky."
> **fit:** „firmy závislé na PPC, které chtějí snížit náklad na akvizici, i firmy, které v organickém vyhledávání propadají konkurenci navzdory lepšímu produktu."
> **faq:**
> - „Garantujete pozici na Googlu?" → „Ne — a nikdo upřímný vám to garantovat nemůže, algoritmus nekontrolujeme my ani nikdo jiný. Co garantujeme: měřitelný proces, transparentní reporting a technické základy, bez kterých se pozice hnout nemůže."
> - „Jak dlouho trvá, než SEO ukáže výsledky?" → „První technické opravy se projeví v týdnech (indexace, rychlost). Reálný posun v pozicích u konkurenčních dotazů obvykle trvá 3–6 měsíců — kdo slibuje jinak, něco zamlčuje."
> - „Jak konkrétně měříte úspěch?" → „Search Console pro pozice/prokliky/impressions, vlastní dashboard pro návštěvnost podle klíčových skupin dotazů. Měsíční report ukazuje trend, ne izolovaná čísla bez kontextu."

### Zbylých 15 služeb — vzorec „bolest → řešení → výsledek → CTA" + doplnit fit + min. 2 FAQ (10 služeb dnes nemá fit/faq vůbec):
| Služba | Otevřít bolestí |
|---|---|
| e-shopy-na-miru (P2) | krabicová platforma brzdí růst, jakmile firma přeroste šablonu (fit větu nahoru) |
| prezentacni-weby-a-microsite (P2) | přesunout „vlastní URL, design a analytics nezávisle na IT" z FAQ do desc |
| sprava-webu-a-e-shopu (P1) | „web bez správy chátrá — dluh roste, výkon padá, dokud nepřijde incident" |
| integrace-systemu (P1) | „účetní ručně přepisuje objednávky z e-shopu do Pohody; systémy se rozcházejí" + doplnit FAQ (cena, co když systém nemá API) |
| webove-aplikace-a-custom-vyvoj (P2) | přesunout „20 % času obcházením limitů nástroje" z FAQ do úvodu |
| automatizace-procesu (P1) | „tým tráví hodiny týdně kopírováním dat mezi systémy" |
| ai-konzultace-audit-strategie (P1) | „vedení tlačí na AI, ale nikdo neumí spočítat návratnost — hrozí utopené POC" |
| datova-platforma-integrace (P1) | „rozhoduje se podle excelu, který má každé oddělení jiný — datům nikdo nevěří" |
| mlops-provoz-ai-systemu (P1) | „AI funguje v demu; v produkci nikdo nehlídá náklady ani kvalitu — model tiše degraduje" |
| aeo-answer-engine-optimization (P1) | „zákazníci se ptají ChatGPT dřív než Googlu — kdo tam není citovaný, neexistuje" |
| ppc-kampane (P1) | „rozpočet mizí, agentura hlásí prokliky, ne tržby" → reporting na úrovni revenue/ROAS |
| social-media-management (P1) | „profily jako billboard bez engagementu; nikdo neměří, jestli vedou k poptávkám" |
| tvorba-kreativ (P1) | „stock fotky splývají s konkurencí — nikdo si vás nezapamatuje" |
| e-commerce-management (P2) | začít stagnujícími tržbami navzdory fungujícímu stacku, pak CRO/feedy/retence |
| marketing-strategy-plan (P1) | „marketing bez strategie = náhodné kampaně; rozpočet se rozplyne mezi kanály" |

---

## 8. Řešení

### Hub (common.json:649) — P0: „16 služeb" → „18 služeb".

### Balíček „Autonomní agenti" (common.json:656-662) — P1, HOTOVÝ PŘEPIS
> **body:** „Rutinní administrativu — třídění e-mailů, generování reportů, rezervace schůzek, kontrola dat — dnes dělá člověk, který by měl řešit důležitější věci. Agent tuhle práci převezme a pracuje nepřetržitě, bez chyb z únavy a bez čekání na pondělí ráno. Poslední slovo má pořád člověk: agent podklad připraví, člověk ho jen schválí tam, kde na tom záleží."
> **audience:** „Hodí se pro: e-commerce, profesionální služby, back-office týmy zavalené opakující se agendou."
> + souběžně `SOLUTION_META[1].bentoBody` v reseni-body.tsx:56-57 (duplikát feature-first textu).

### Balíček „Datové dashboardy" (common.json:674-680) — P1, HOTOVÝ PŘEPIS
> **body:** „Dnes se rozhoduje podle čísel, která už neplatí, protože prodeje, marketing, sklady a finance leží v pěti různých systémech, které spolu nemluví. Postavíme jeden přehled, kde je uvidíte pohromadě — aktuální, ne z minulé uzávěrky — a upozorníme vás ve chvíli, kdy se něco vychýlí z normálu, ne až na konci měsíce."
> **audience:** „Hodí se pro: e-commerce, výrobu i profesionální služby, kde čísla dnes žijí ve více systémech najednou."
> + souběžně `SOLUTION_META[3].bentoBody` v reseni-body.tsx:76-77.

### CTA band (reseni-body.tsx:182-185) — P0: prohodit primary na booking, viz conversion-flow-v3.md.

### P2: sjednotit `SOLUTION_META[].id` se skutečnými slugy (genai-rag→znalostni-asistent atd.) kvůli budoucí analytice.

---

## 9. Odvětví — ROZHODNUTO (R2, 28. 7. 2026): všech 8 ZŮSTÁVÁ, přepsat

Rozhodnutí zadavatele nahrazuje původní návrh redukce na 3. Žádné mazání URL, žádná 301 mapa, routes.ts a struktura offerings-data beze změny. Co se MUSÍ opravit i při zachování všech 8 (pravidlo §6/§8 platí dál):

### Hub (common.json:700-702) — P0
> **hero.subhead:** „Osm oborů, kterým rozumíme do hloubky. Mluvíme řečí vašeho byznysu — od první schůzky."
> **intro:** „Nestavíme generické weby a AI šablony. Než cokoli navrhneme, díváme se na to, jak váš obor reálně funguje — jaké jsou typické integrace, procesy a sezónnost. Tady je osm oborů, kterým rozumíme."

### Nepodložená čísla — P1 (všechna 4 místa, protože všechny stránky zůstávají)
- profesionalni-sluzby (common.json:801): „30–40 % fakturovatelného času" → „výraznou část fakturovatelného času"
- zakaznicka-podpora (common.json:918): „50–70 % typických dotazů" → „většinu běžných dotazů sám; konkrétní podíl si ověříme na vašich datech v pilotu"
- logistika (common.json:773): „Zaplaceno za 6–12 měsíců z ušetřených hodin." → „Návratnost počítáme předem z reálně ušetřených hodin — a ověřujeme ji po nasazení."
- vyroba (common.json:743): „Externí ERP konzultanti účtují 2 500 Kč za hodinu" → bez čísla o konkurenci, např. „Externí ERP konzultace jsou drahé a nekončí" (nedoložené tvrzení o cizích cenách ven)

### Regulatorní name-dropping — P1 (zmírnit, ne smazat stránky)
V detailech i v mega-menu (`offerings-data.ts:159-208`) nahradit výčty zkratek (SAP, MES, OEE, ČNB, DORA, AML, ERÚ, ČEPS, CSRD, ÚZIS, HL7, FotoFinder…) popisem toho, co reálně děláme — např. vyroba subtitle „SAP, OEE, prediktivní údržba" → „ERP integrace, automatizace výroby"; finance „ČNB, DORA, AML/KYC compliance" → „Automatizace back-office, bezpečné nakládání s daty"; energetika „Air-gapped LLM, ERÚ, fotovoltaika" → „Privátní AI nad interními daty"; zdravotnictvi „FotoFinder, longevity AI, GDPR" → „AI nad citlivými daty, GDPR-first". Konkrétní znalost zkratek smí zaznít, až ji doloží reálný projekt (R4 later).
Přepis všech 8 detailů vzorem exemplářů níže proběhne ve Vlně 2.

### Exemplář — /odvetvi/ecommerce — P2, HOTOVÝ PŘEPIS
> „Krabicové řešení dovede e-shop do bodu, kde přestane stačit — vlastní logika, B2B ceník, napojení na Pohodu nebo Money S3, tok dat s Heurekou a Zásilkovnou nad rámec standardu. Odtud stavíme dál: Shopify Plus nebo headless Next.js frontend propojený s vaším skladem a účetnictvím, s AI tam, kde reálně šetří čas — ne jako povinná ozdoba."

### Exemplář — /odvetvi/profesionalni-sluzby — P2, HOTOVÝ PŘEPIS
> „Advokátní kanceláře, daňové poradny a účetní firmy ztrácejí fakturovatelný čas hledáním na sdíleném disku a ručním přepisováním e-mailů do CRM. Postavíme AI vyhledávání nad vaší dokumentací s citacemi na zdroj, propojíme ho s CRM, které tým skutečně používá — nebo ho postavíme na míru, když žádný SaaS váš workflow nezvládá. Data zůstávají u vás, ne ve veřejném LLM."
