# Agentní systémy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zastřešit stávající řešení narativem „Agentní systémy", prohloubit `/reseni/znalostni-asistent` (sekundární mozek + RAG) a `/reseni/autonomni-agenti` (zpracování dat) na plnohodnotné SEO/AEO stránky, a promítnout framing na homepage i do mega-menu.

**Architecture:** Obsah žije v `content/cs/strings/common.json` (next-intl), renderuje se v client komponentách `solution-body.tsx` / `reseni-body.tsx`, strukturovaná data injektuje server komponenta `[slug]/page.tsx` přes `<JsonLd>`. Prohloubené detaily kopírují hloubkový vzor `odvetvi/[slug]/industry-body.tsx` (problém → přístup → proces) + přidávají use-case kotvy a FAQ.

**Tech Stack:** Next.js 16 (App Router, SSG), next-intl v4, React 19, framer-motion, lucide-react, Tailwind v4, pnpm.

## Global Constraints

- **Package manager: pnpm.** Všechny příkazy přes `pnpm`.
- **Vitest je v repu ROZBITÝ** (`vitest@4.1.7` vyžaduje vite 6, nainstalována vite 5 → `ERR_PACKAGE_PATH_NOT_EXPORTED`). NEPOUŽÍVAT vitest. Verifikace = `pnpm build` + `pnpm lint` + `pnpm lint:cs` + `node scripts/check-reseni-content.mjs`.
- **`tsc --noEmit` samostatně padá** na `baseUrl` deprecation → jako typový gate používat `pnpm build`.
- **Czech typography linter (`pnpm lint:cs`) MUSÍ projít** na `content/cs/**/*.json`. Pravidla: em-dash `—` (ne ` - `), nbsp ` ` po jednopísmenných předložkách/spojkách (k s v z o u i a), nbsp před jednotkami (`%`, `Kč`…). Používat české uvozovky `„ "`.
- **Obsah jen `cs`.** `/reseni` index i detail renderují pro `en` `EnglishStub` → nové klíče přidávat POUZE do `content/cs/strings/common.json`, `content/en/…` neřešit.
- **Živé slugy řešení (JSON):** `znalostni-asistent`, `agenti`, `podpora`, `dashboardy`, `infrastruktura`. `routes.ts` už má popisné (`autonomni-agenti`, `ai-podpora`, `ai-infrastruktura`) → konvergence = přejmenovat JSON na popisné. Web NENÍ indexovaný, žádné redirecty.
- **SSG:** tyto stránky jsou statické (`generateStaticParams`). Nepřidávat `no-store` ani ISR.
- **Barvy jen přes tokeny** `var(--…)` / existující utility třídy. Žádné hardcoded hexy v nových komponentách.
- **Individuální publikum:** věta o jednotlivcích na webu **právě jednou** (sentinel: `osobní „druhý mozek" jednotlivce`).
- **Commity:** repo má husky pre-commit (lint-staged → eslint na staged `.ts/.tsx`). Kód musí být eslint-clean.

---

## Task 0: Baseline — potvrdit zelený stav

**Files:** žádné (jen ověření).

- [ ] **Step 1: Ověřit typografii a build**

Run: `pnpm lint:cs`
Expected: `czech-typography-lint: OK (1 files scanned)`

Run: `pnpm lint`
Expected: bez errorů (warnings OK).

Run: `pnpm build`
Expected: build projde; ve výpisu tras jsou `/cs/reseni/znalostni-asistent`, `/cs/reseni/agenti`, `/cs/reseni/podpora`.

- [ ] **Step 2: Zapsat baseline**

Pokud cokoli selže z jiných důvodů než tato práce, zastavit a nahlásit. Jinak pokračovat na Task 1.

---

## Task 1: Sjednocení slugů + integritní check skript

**Files:**
- Create: `scripts/check-reseni-content.mjs`
- Modify: `content/cs/strings/common.json` (5× `reseni.items[].slug`)
- Modify: `src/lib/offerings-data.ts` (3× href v `SOLUTIONS_OFFERING.items`)

**Interfaces:**
- Produces: příkaz `node scripts/check-reseni-content.mjs` (exit 0 = OK). Živé slugy: `znalostni-asistent`, `autonomni-agenti`, `ai-podpora`, `dashboardy`, `ai-infrastruktura`.

- [ ] **Step 1: Napsat integritní check (zatím jen slug drift)**

Create `scripts/check-reseni-content.mjs`:

```js
#!/usr/bin/env node
/* Content-integrity checks pro sekci „Agentní systémy". Exit 1 na jakoukoli chybu.
   Usage: node scripts/check-reseni-content.mjs */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (m) => errors.push(m);

const json = JSON.parse(readFileSync(join(ROOT, 'content/cs/strings/common.json'), 'utf8'));
const items = json?.reseni?.items ?? [];
const slugs = items.map((i) => i.slug).sort();

// 1. Slugy řešení se musí rovnat routes.ts solutionSlugs (drift lock)
const routesSrc = readFileSync(join(ROOT, 'src/config/routes.ts'), 'utf8');
const block = routesSrc.slice(routesSrc.indexOf('solutionSlugs'));
const routeSlugs = [...block.slice(0, block.indexOf(']')).matchAll(/'([^']+)'/g)]
  .map((m) => m[1])
  .sort();
if (JSON.stringify(slugs) !== JSON.stringify(routeSlugs)) {
  fail(`slug drift: JSON ${JSON.stringify(slugs)} != routes.ts ${JSON.stringify(routeSlugs)}`);
}

if (errors.length) {
  console.error(`check-reseni-content: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('check-reseni-content: OK');
```

- [ ] **Step 2: Spustit — musí selhat (drift)**

Run: `node scripts/check-reseni-content.mjs`
Expected: FAIL — `slug drift: JSON [...,"agenti","infrastruktura","podpora",...] != routes.ts [...,"ai-infrastruktura","ai-podpora","autonomni-agenti",...]`

- [ ] **Step 3: Přejmenovat slugy v JSON**

V `content/cs/strings/common.json` → `reseni.items`:
- `"slug": "agenti"` → `"slug": "autonomni-agenti"`
- `"slug": "podpora"` → `"slug": "ai-podpora"`
- `"slug": "infrastruktura"` → `"slug": "ai-infrastruktura"`

(`znalostni-asistent` a `dashboardy` beze změny.)

- [ ] **Step 4: Sladit hrefy v offerings-data.ts**

V `src/lib/offerings-data.ts` → `SOLUTIONS_OFFERING.items`:
- `href: '/reseni/agenti'` → `href: '/reseni/autonomni-agenti'`
- `href: '/reseni/podpora'` → `href: '/reseni/ai-podpora'`
- `href: '/reseni/infrastruktura'` → `href: '/reseni/ai-infrastruktura'`

- [ ] **Step 5: Zkontrolovat, že nikde nezůstal starý odkaz**

Run: `grep -rn "/reseni/agenti\"\|/reseni/agenti'\|/reseni/podpora\|/reseni/infrastruktura" src content`
Expected: žádný výstup (0 shod). Pokud něco vyskočí, opravit na nový slug.

- [ ] **Step 6: Spustit check — musí projít**

Run: `node scripts/check-reseni-content.mjs`
Expected: `check-reseni-content: OK`

- [ ] **Step 7: Build — sitemap/params konvergují**

Run: `pnpm build`
Expected: build projde; v tras výpisu je `/cs/reseni/autonomni-agenti` (a `ai-podpora`, `ai-infrastruktura`); `/cs/reseni/agenti` už NENÍ.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-reseni-content.mjs content/cs/strings/common.json src/lib/offerings-data.ts
git commit -m "fix(reseni): unify solution slugs with routes.ts + integrity check"
```

---

## Task 2: Obsah — hloubka + FAQ + use cases + umbrella blok

**Files:**
- Modify: `content/cs/strings/common.json` (2× položka `reseni.items`, nový blok `reseni.agentni`)
- Modify: `scripts/check-reseni-content.mjs` (rozšířit kontroly)

**Interfaces:**
- Produces content model: `reseni.items[i]` volitelně `{ sections: { problem, approach, process[] }, usecases: [{ id, title, body }], faq: [{ q, a }], seo: { title, description } }`; nový `reseni.agentni = { eyebrow, headline, lead, cards: [{ title, body, href }] }`.

- [ ] **Step 1: Přidat `sections`/`usecases`/`faq`/`seo` k položce `znalostni-asistent`**

V `content/cs/strings/common.json` do objektu s `"slug": "znalostni-asistent"` přidat za `"audience"` tyto klíče (čárky ohlídat):

```json
"seo": {
  "title": "Znalostní asistent a sekundární mozek — RAG na míru | VICTA",
  "description": "Postavíme AI asistenta natrénovaného na vaši dokumentaci — firemní znalostní báze i osobní „druhý mozek". RAG úložiště a přesné odpovědi z vašich dat."
},
"sections": {
  "problem": "Firmy i jednotlivci hromadí znalosti rychleji, než je stíhají organizovat. Dokumentace, e-maily, wiki, poznámky, smlouvy — informace existuje, ale najít ji ve správný moment je práce na hodiny. Lidé se ptají kolegů na věci, které jsou dávno sepsané.\n\nObyčejný chatbot nad těmito daty nestačí — odpovídá obecně, nebo si vymýšlí. Potřebujete systém, který odpovídá výhradně z vašich zdrojů, cituje, odkud čerpá, a přizná, když odpověď nezná.",
  "approach": "Stavíme RAG systém (retrieval-augmented generation): vaše dokumenty rozřežeme, zaindexujeme do vektorového úložiště a napojíme na jazykový model (Claude nebo GPT). Model odpovídá jen z nalezených pasáží a přikládá zdroje.\n\nNasazení jde tam, kde už pracujete — Slack, intranet, firemní wiki, nebo samostatný chat. Data zůstávají ve vašem prostředí, s řízením přístupu podle rolí. U citlivých provozů umíme i model běžící lokálně.",
  "process": [
    { "title": "Audit zdrojů", "body": "Zmapujeme, kde znalost žije a v jakém je stavu. Vybereme zdroje s nejvyšší hodnotou pro první nasazení." },
    { "title": "Pipeline a index", "body": "Postavíme ingest pipeline, vektorové úložiště a retrieval vrstvu. Doladíme, aby odpovědi byly přesné a citované." },
    { "title": "Nasazení a provoz", "body": "Napojíme na vaše nástroje, nastavíme přístupová práva a měříme kvalitu odpovědí. Systém se učí z reálného provozu." }
  ]
},
"usecases": [
  { "id": "sekundarni-mozek", "title": "Sekundární mozek", "body": "Znalostní báze, která si pamatuje vše, co vaše firma ví, a odpoví na to lidsky. Ať jde o firemní znalostní bázi, nebo o osobní „druhý mozek" jednotlivce — princip je stejný: vaše data uvnitř, přesné odpovědi venku." },
  { "id": "rag", "title": "RAG úložiště", "body": "Retrieval-augmented generation: AI odpovídá výhradně z vašeho úložiště dat a přikládá zdroje. Žádné halucinace, jen to, co je ve vašich dokumentech." }
],
"faq": [
  { "q": "Co je sekundární mozek (druhý mozek)?", "a": "Znalostní systém, který za vás uchovává a propojuje informace — dokumenty, poznámky, procesy — a na požádání je vyhledá a shrne. Funguje pro firmu i pro jednotlivce." },
  { "q": "Co je RAG?", "a": "Retrieval-augmented generation. AI si nejdřív najde relevantní pasáže ve vašich datech a teprve z nich sestaví odpověď. Díky tomu odpovídá přesně a umí citovat zdroj." },
  { "q": "Co je RAG úložiště?", "a": "Vektorová databáze, do které se vaše dokumenty zaindexují, aby v nich AI uměla rychle a přesně vyhledávat. Je to paměť celého systému." },
  { "q": "Kde jsou moje data uložená?", "a": "Ve vašem prostředí nebo u poskytovatele podle vaší volby, s řízením přístupu podle rolí. U citlivých provozů nasadíme model i úložiště lokálně." },
  { "q": "Na jakých dokumentech to funguje?", "a": "Na běžných firemních formátech — PDF, Word, tabulky, wiki, e-maily, přepisy hovorů. Zdroje napojíme přímo, ať se báze udržuje aktuální." }
]
```

- [ ] **Step 2: Přidat `sections`/`usecases`/`faq`/`seo` k položce `autonomni-agenti`**

Do objektu s `"slug": "autonomni-agenti"` přidat za `"audience"`:

```json
"seo": {
  "title": "Autonomní AI agenti a agentní systémy pro firmy | VICTA",
  "description": "Nasazujeme agentní systémy — AI, která samostatně vykonává úkoly a zpracovává data. Třídění, reporty, kontrola dat, human-in-the-loop tam, kde je potřeba."
},
"sections": {
  "problem": "Spousta firemní práce je opakovaná a předvídatelná — přeposlat, zkopírovat, zkontrolovat, vyplnit, poslat report. Lidé na ni tráví hodiny, které by se hodily jinde, a chybovost roste s objemem.\n\nKlasická automatizace (skripty, „když se stane A, udělej B") je křehká — rozbije se, jakmile realita nesedí na scénář. Chybí jí úsudek: co dělat s výjimkou, nejednoznačným vstupem, chybějícím údajem.",
  "approach": "Stavíme agentní systémy: AI agenty, kteří dostanou cíl a sami zvolí kroky k jeho splnění — vyhledají, zpracují data, zavolají nástroj či API, ověří výsledek. Kde hrozí riziko, čeká agent na schválení člověka (human-in-the-loop).\n\nKaždý agent má jasně vymezené pravomoci, loguje, co dělá, a jeho výstupy se dají zkontrolovat. Nenasazujeme černou skříňku — nasazujeme nástroj, kterému rozumíte a kterému postupně přidáváte odpovědnost.",
  "process": [
    { "title": "Mapa procesu", "body": "Rozebereme úkol na kroky, vstupy a rozhodovací body. Určíme, kde agent jedná sám a kde potřebuje člověka." },
    { "title": "Agent a nástroje", "body": "Postavíme agenta, napojíme na potřebné nástroje a data, nastavíme pravomoci a logování. Testujeme na reálných případech." },
    { "title": "Nasazení a dohled", "body": "Spustíme v provozu s dohledem, měříme úspěšnost a chybovost a postupně rozšiřujeme, co agent zvládne sám." }
  ]
},
"usecases": [
  { "id": "zpracovani-dat", "title": "Zpracování dat", "body": "Agenti, kteří data sami načtou z e-mailů, PDF, formulářů i API, pročistí je, obohatí a předají dál — do systému, reportu nebo dashboardu. Z nesourodých vstupů jeden spolehlivý tok. Navazuje na naše datové dashboardy." }
],
"faq": [
  { "q": "Co je agentní systém?", "a": "AI, která nejen odpovídá, ale samostatně vykonává úkoly — vyhledá informace, zpracuje data, provede akci a rozhodne, kdy předat člověku. Na rozdíl od chatbota jedná, ne jen konverzuje." },
  { "q": "Jaký je rozdíl mezi chatbotem a AI agentem?", "a": "Chatbot odpovídá na dotazy. Agent má cíl a sám volí kroky k jeho splnění — používá nástroje, pracuje s daty a dotáhne úkol do konce." },
  { "q": "Jak agenti zpracovávají data?", "a": "Načtou vstup (e-mail, PDF, API), rozpoznají a ověří údaje, doplní chybějící a předají výsledek dál — do systému nebo reportu. U nejasností se ptají člověka." },
  { "q": "Je nasazení bezpečné?", "a": "Ano. Každý agent má vymezené pravomoci, loguje své kroky a u rizikových akcí čeká na schválení člověka (human-in-the-loop). Odpovědnost mu přidáváte postupně." },
  { "q": "Jak dlouho trvá nasazení?", "a": "První funkční agent na jeden proces bývá otázkou týdnů, ne měsíců. Začínáme úzce vymezeným úkolem a rozšiřujeme podle výsledků." },
  { "q": "Kolik stojí nasazení AI agenta?", "a": "Cena závisí na složitosti procesu a integrací. Začínáme malým, jasně ohraničeným nasazením s měřitelným přínosem, ať se investice ověří dřív, než se škáluje." }
]
```

- [ ] **Step 3: Přidat umbrella blok `reseni.agentni`**

Do objektu `reseni` (vedle `hero`, `items`, `ctaLine`, `ctaButton`) přidat:

```json
"agentni": {
  "eyebrow": "agentní systémy",
  "headline": "Agentní systémy, které jednají za vás.",
  "lead": "AI, která nejen odpovídá, ale samostatně vyhledá, zpracuje data a rozhodne, kdy předat člověku. Tři typické scénáře, jeden základ.",
  "cards": [
    { "title": "Sekundární mozky", "body": "Znalostní báze na míru vaší firmě. Dokumenty, wiki a procesy proměníme v asistenta, který si pamatuje vše a odpoví přesně na váš kontext — ne obecně.", "href": "/reseni/znalostni-asistent#sekundarni-mozek" },
    { "title": "RAG úložiště", "body": "Bezpečné úložiště, ze kterého AI čerpá ověřené odpovědi z vašich dat — ne halucinace. Vaše dokumenty zůstávají vaše.", "href": "/reseni/znalostni-asistent#rag" },
    { "title": "Zpracování dat", "body": "Agenti, kteří data sami načtou, pročistí, obohatí a předají dál — z e-mailů, PDF i API do jednoho toku.", "href": "/reseni/autonomni-agenti#zpracovani-dat" }
  ]
}
```

- [ ] **Step 4: Doplnit nezlomitelné mezery (autofix)**

Nová copy má běžné mezery po předložkách — linter je vyžaduje jako nbsp. Spustit idempotentní autofix (mění jen U+0020 → U+00A0 tam, kde to linter chce):

```bash
node -e '
const fs=require("fs");const p="content/cs/strings/common.json";
let s=fs.readFileSync(p,"utf8");
s=s.replace(/([\p{L}]) ([ksvzouiaKSVZOUIA]) (?=[\p{L}])/gu,"$1 $2 ");
s=s.replace(/(\d) (Kč|EUR|€|%|km|h|min|m²|kg|MB|GB)\b/g,"$1 $2");
fs.writeFileSync(p,s);
console.log("nbsp autofix applied");
'
```

- [ ] **Step 5: Ověřit typografii**

Run: `pnpm lint:cs`
Expected: `czech-typography-lint: OK (1 files scanned)`
Pokud zůstanou hlášení `nbsp-after-prep` na hranicích vět (předložka za em-dashem apod.), opravit ručně vložením ` ` na uvedeném `file:line`.

- [ ] **Step 6: Rozšířit check skript o kontrolu obsahu**

Nahradit celý obsah `scripts/check-reseni-content.mjs` tímto (obsahuje i původní slug check):

```js
#!/usr/bin/env node
/* Content-integrity checks pro sekci „Agentní systémy". Exit 1 na jakoukoli chybu.
   Usage: node scripts/check-reseni-content.mjs */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (m) => errors.push(m);

const raw = readFileSync(join(ROOT, 'content/cs/strings/common.json'), 'utf8');
const json = JSON.parse(raw);
const items = json?.reseni?.items ?? [];
const slugs = items.map((i) => i.slug).sort();

// 1. Slugy řešení == routes.ts solutionSlugs (drift lock)
const routesSrc = readFileSync(join(ROOT, 'src/config/routes.ts'), 'utf8');
const block = routesSrc.slice(routesSrc.indexOf('solutionSlugs'));
const routeSlugs = [...block.slice(0, block.indexOf(']')).matchAll(/'([^']+)'/g)]
  .map((m) => m[1])
  .sort();
if (JSON.stringify(slugs) !== JSON.stringify(routeSlugs)) {
  fail(`slug drift: JSON ${JSON.stringify(slugs)} != routes.ts ${JSON.stringify(routeSlugs)}`);
}

// 2. Prohloubené položky mají sections + faq + usecases + seo
const deep = {
  'znalostni-asistent': ['sekundarni-mozek', 'rag'],
  'autonomni-agenti': ['zpracovani-dat'],
};
for (const [slug, ucIds] of Object.entries(deep)) {
  const it = items.find((i) => i.slug === slug);
  if (!it) { fail(`missing item: ${slug}`); continue; }
  if (!it.sections?.problem?.trim()) fail(`${slug}: sections.problem empty`);
  if (!it.sections?.approach?.trim()) fail(`${slug}: sections.approach empty`);
  if (!(it.sections?.process?.length >= 3)) fail(`${slug}: sections.process needs >=3`);
  if (!(it.faq?.length >= 4)) fail(`${slug}: faq needs >=4`);
  const gotIds = (it.usecases ?? []).map((u) => u.id);
  for (const id of ucIds) if (!gotIds.includes(id)) fail(`${slug}: missing usecase "${id}"`);
  if (!it.seo?.title || !it.seo?.description) fail(`${slug}: seo.title/description missing`);
}

// 3. Umbrella blok: přesně 3 karty, interní kotvené hrefy
const cards = json?.reseni?.agentni?.cards ?? [];
if (cards.length !== 3) fail(`reseni.agentni.cards must have 3 (got ${cards.length})`);
for (const c of cards) {
  if (!/^\/reseni\/[a-z-]+#[a-z-]+$/.test(c.href ?? '')) fail(`bad card href: ${c.href}`);
}

// 4. Věta o jednotlivcích právě jednou
const sentinel = 'osobní „druhý mozek" jednotlivce';
const count = raw.split(sentinel).length - 1;
if (count !== 1) fail(`individuals sentence must appear exactly once (found ${count})`);

if (errors.length) {
  console.error(`check-reseni-content: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('check-reseni-content: OK');
```

- [ ] **Step 7: Spustit check — musí projít**

Run: `node scripts/check-reseni-content.mjs`
Expected: `check-reseni-content: OK`

- [ ] **Step 8: Ověřit, že JSON je validní a build nespadne**

Run: `pnpm build`
Expected: build projde (obsah zatím jen v datech, render přijde v Task 3–4).

- [ ] **Step 9: Commit**

```bash
git add content/cs/strings/common.json scripts/check-reseni-content.mjs
git commit -m "content(reseni): deepen znalostni-asistent + autonomni-agenti, add agentni umbrella"
```

---

## Task 3: Render hloubky + use cases + FAQ v solution-body.tsx

**Files:**
- Modify: `src/app/[locale]/reseni/[slug]/solution-body.tsx`

**Interfaces:**
- Consumes: `SolutionItem` z JSON (viz Task 2 model).
- Produces: rozšířený `export type SolutionItem` (přidané volitelné `sections`, `usecases`, `faq`, `seo`). Kotvy `id` na `<section>` = `usecase.id`.

- [ ] **Step 1: Rozšířit typ `SolutionItem` a přidat `paragraphs()` helper**

V `src/app/[locale]/reseni/[slug]/solution-body.tsx` nahradit blok `export type SolutionItem = {...}` tímto:

```tsx
export type SolutionUsecase = { id: string; title: string; body: string };
export type SolutionFaqEntry = { q: string; a: string };
export type SolutionSections = {
  problem: string;
  approach: string;
  process: ReadonlyArray<{ title: string; body: string }>;
};

export type SolutionItem = {
  key: string;
  label: string;
  name: string;
  body: string;
  audience: string;
  slug: string;
  sections?: SolutionSections;
  usecases?: ReadonlyArray<SolutionUsecase>;
  faq?: ReadonlyArray<SolutionFaqEntry>;
  seo?: { title?: string; description?: string };
};

/** Split prose on `\n\n` paragraph boundaries. */
function paragraphs(text: string) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
```

- [ ] **Step 2: Vložit render sekcí mezi hero a „audience"**

V `SolutionBody` HNED za `</PageHero>`… (tj. za uzavírací `/>` komponenty `PageHero`) a PŘED `{/* Audience — "Pro koho je vhodné" */}` vložit:

```tsx
      {/* Problém */}
      {item.sections && (
        <section className="relative px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
              <div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  problém
                </span>
                <h2 className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink">
                  S čím přicházejí klienti.
                </h2>
              </div>
              <div className="max-w-[64ch] space-y-5 text-[17px] leading-[1.65] text-secondary">
                {paragraphs(item.sections.problem).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Jak na to */}
      {item.sections && (
        <section
          className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
              <div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  jak na to
                </span>
                <h2 className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink">
                  Jak to stavíme.
                </h2>
              </div>
              <div className="max-w-[64ch] space-y-5 text-[17px] leading-[1.65] text-secondary">
                {paragraphs(item.sections.approach).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Use cases (kotvené) */}
      {item.usecases?.map((uc) => (
        <section
          key={uc.id}
          id={uc.id}
          className="relative scroll-mt-24 border-t border-border-soft px-6 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
              <div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  use case
                </span>
                <h2 className="display mt-6 max-w-[14ch] text-[clamp(28px,3.4vw,46px)] text-ink">
                  {uc.title}.
                </h2>
              </div>
              <p className="max-w-[62ch] text-[18px] leading-[1.6] text-secondary">{uc.body}</p>
            </div>
          </div>
        </section>
      ))}

      {/* Proces */}
      {item.sections && (
        <section className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
              <div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  jak postupujeme
                </span>
                <h2 className="display mt-6 max-w-[18ch] text-[clamp(32px,4vw,52px)] text-ink">
                  {item.sections.process.length} kroky k nasazení.
                </h2>
              </div>
              <ol className="space-y-12">
                {item.sections.process.map((step, i) => (
                  <li key={i} className="grid grid-cols-[auto_1fr] gap-6">
                    <span className="font-mono text-[14px] tabular-nums text-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="display text-[clamp(22px,2.4vw,30px)] text-ink">{step.title}</h3>
                      <p className="mt-3 max-w-[58ch] text-[16px] leading-[1.6] text-secondary">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}
```

- [ ] **Step 3: Vložit FAQ blok před CTA band**

PŘED `{/* CTA band + back link */}` vložit:

```tsx
      {/* FAQ (AEO) */}
      {item.faq && item.faq.length > 0 && (
        <section
          className="relative border-t border-border-soft px-6 py-20 md:px-10 md:py-28"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
              <div>
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
                  časté dotazy
                </span>
                <h2 className="display mt-6 max-w-[14ch] text-[clamp(32px,4vw,52px)] text-ink">
                  Časté dotazy.
                </h2>
              </div>
              <dl className="max-w-[64ch] divide-y divide-border-soft">
                {item.faq.map((f, i) => (
                  <div key={i} className="py-6 first:pt-0">
                    <dt className="display text-[clamp(19px,2vw,24px)] text-ink">{f.q}</dt>
                    <dd className="mt-3 text-[16px] leading-[1.6] text-secondary">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      )}
```

- [ ] **Step 4: Build — render projde a stránky se prohloubí**

Run: `pnpm build`
Expected: build projde bez chyb (stuby bez `sections`/`faq` se nerozbijí — vše je za podmínkou).

- [ ] **Step 5: Vizuální kontrola v devu**

Run: `pnpm dev` (v druhém terminálu)
Otevřít `http://localhost:3000/cs/reseni/autonomni-agenti#zpracovani-dat` — stránka scrolluje na sekci „Zpracování dat"; jsou vidět bloky problém / jak na to / use case / proces / FAQ.
Otevřít `http://localhost:3000/cs/reseni/ai-podpora` — stub (bez `sections`) renderuje jen hero + „pro koho" + CTA, nic se nerozbije.
Zastavit dev.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/reseni/[slug]/solution-body.tsx"
git commit -m "feat(reseni): render deep sections, use-case anchors, FAQ on solution detail"
```

---

## Task 4: Schema (Service + Breadcrumb + FAQ) + metadata v page.tsx

**Files:**
- Modify: `src/lib/schema.ts` (`ServiceSchemaInput` + URL)
- Modify: `src/app/[locale]/reseni/[slug]/page.tsx` (metadata + `<JsonLd>`)

**Interfaces:**
- Consumes: `buildServiceSchema`, `buildFaqSchema`, `buildBreadcrumbSchema` z `@/lib/schema`; `JsonLd` z `@/components/seo/json-ld`; `site` z `@/config/site`.
- Produces: `buildServiceSchema({ slug, name, description, section? }, locale)` — `section` default `'sluzby'`, jinak v URL.

- [ ] **Step 1: Přidat `section` do `buildServiceSchema`**

V `src/lib/schema.ts` nahradit `ServiceSchemaInput` a URL řádek:

```ts
export interface ServiceSchemaInput {
  slug: string;
  name: string;
  description: string;
  /** URL segment (`sluzby` | `reseni`). Default `sluzby`. */
  section?: string;
}

export function buildServiceSchema(input: ServiceSchemaInput, locale: Locale): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    provider: { '@type': 'Organization', name: site.name, url: site.url },
    areaServed: site.area.countries.map((code) => ({ '@type': 'Country', name: code })),
    inLanguage: locale,
    url: `${site.url}/${locale}/${input.section ?? 'sluzby'}/${input.slug}`,
  };
}
```

- [ ] **Step 2: Přepsat page.tsx — metadata + schema**

Nahradit celý obsah `src/app/[locale]/reseni/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { JsonLd } from '@/components/seo/json-ld';
import {
  buildServiceSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from '@/lib/schema';
import { site, type Locale } from '@/config/site';
import { SolutionBody, type SolutionItem } from './solution-body';
import data from '../../../../../content/cs/strings/common.json';

/* ============================================================
   /cs/reseni/[slug] · Solution detail route
   ============================================================ */

type Props = { params: Promise<{ locale: string; slug: string }> };

const ITEMS = data.reseni.items as ReadonlyArray<SolutionItem>;

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of ['cs', 'en']) {
    for (const it of ITEMS) {
      params.push({ locale, slug: it.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) return { title: 'Řešení — VICTA' };
  return {
    title: item.seo?.title ?? `${item.name} — VICTA`,
    description: item.seo?.description ?? item.body,
    alternates: { canonical: `https://victaagency.com/${locale}/reseni/${slug}` },
  };
}

export default async function SolutionDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) notFound();

  if (locale === 'en') {
    return <EnglishStub title={`Solution — ${item.name}`} pathLabel={`/en/reseni/${slug}`} />;
  }

  const schema = [
    buildServiceSchema(
      {
        slug,
        name: item.name,
        description: item.seo?.description ?? item.body,
        section: 'reseni',
      },
      locale as Locale,
    ),
    buildBreadcrumbSchema([
      { name: 'Řešení', url: `${site.url}/${locale}/reseni` },
      { name: item.name, url: `${site.url}/${locale}/reseni/${slug}` },
    ]),
    ...(item.faq && item.faq.length > 0 ? [buildFaqSchema(item.faq)] : []),
  ];

  return (
    <>
      <JsonLd data={schema} />
      <SolutionBody item={item} />
    </>
  );
}
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build projde (typy `item.seo`/`item.faq` sedí s Task 3 modelem).

- [ ] **Step 4: Ověřit JSON-LD ve vygenerované stránce**

Run: `pnpm start` (v druhém terminálu; servíruje `pnpm build` výstup)
Run: `curl -s http://localhost:3000/cs/reseni/autonomni-agenti | grep -o '"@type":"[A-Za-z]*"' | sort -u`
Expected: obsahuje `"@type":"BreadcrumbList"`, `"@type":"FAQPage"`, `"@type":"Service"`, `"@type":"Question"`.
Run: `curl -s http://localhost:3000/cs/reseni/autonomni-agenti | grep -o '"url":"[^"]*reseni/autonomni-agenti"'`
Expected: `"url":"https://victaagency.com/cs/reseni/autonomni-agenti"` (Service URL má `/reseni/`, ne `/sluzby/`).
Zastavit `pnpm start`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts "src/app/[locale]/reseni/[slug]/page.tsx"
git commit -m "feat(reseni): Service/Breadcrumb/FAQ JSON-LD + SEO metadata on solution detail"
```

---

## Task 5: Umbrella blok „Agentní systémy" na /reseni indexu

**Files:**
- Modify: `src/app/[locale]/reseni/reseni-body.tsx`

**Interfaces:**
- Consumes: `t.raw('agentni')` → `{ eyebrow, headline, lead, cards: [{ title, body, href }] }`; `SectionHeader`, `BentoGrid` (už importované).

- [ ] **Step 1: Přidat importy ikon**

V `src/app/[locale]/reseni/reseni-body.tsx` do importu z `lucide-react` přidat `Brain`, `Database`, `Workflow` (k existujícím `Boxes, BarChart3, …`).

- [ ] **Step 2: Vložit umbrella sekci za `<PageHero />`**

V `ReseniBody` HNED za uzavírací `/>` komponenty `PageHero` (před `{SOLUTION_META.map(...)}`) vložit:

```tsx
      {/* Agentní systémy — umbrella intro + 3 use-case karty */}
      {(() => {
        const agentni = t.raw('agentni') as {
          eyebrow: string;
          headline: string;
          lead: string;
          cards: ReadonlyArray<{ title: string; body: string; href: string }>;
        };
        const icons = [Brain, Database, Workflow] as const;
        return (
          <section className="relative px-6 py-24 md:px-10 md:py-32">
            <div className="mx-auto max-w-[1400px]">
              <SectionHeader
                eyebrow={agentni.eyebrow}
                title={agentni.headline}
                lead={agentni.lead}
              />
              <div className="mt-14">
                <BentoGrid
                  items={agentni.cards.map((c, i) => ({
                    icon: icons[i] ?? Boxes,
                    title: c.title,
                    subtitle: c.body,
                    href: c.href,
                    number: String(i + 1).padStart(2, '0'),
                    span: 4 as const,
                  }))}
                />
              </div>
            </div>
          </section>
        );
      })()}
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build projde.

- [ ] **Step 4: Vizuální kontrola**

Run: `pnpm dev`
Otevřít `http://localhost:3000/cs/reseni` — pod hero je blok „agentní systémy" se 3 kartami (Sekundární mozky / RAG úložiště / Zpracování dat). Klik na kartu vede na správnou kotvu detailu. Zastavit dev.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/reseni/reseni-body.tsx"
git commit -m "feat(reseni): agentic-systems umbrella intro + use-case cards on index"
```

---

## Task 6: Homepage sekce Řešení + mega-menu reframe

**Files:**
- Modify: `src/lib/offerings-data.ts` (`SOLUTIONS_OFFERING` headline/description + 2 subtitles)

**Interfaces:**
- Consumes: `SOLUTIONS_OFFERING` čte `home-body.tsx` (`SolutionsSection`) i `nav.tsx` (mega-menu) — jeden zdroj, obě místa se aktualizují naráz.

- [ ] **Step 1: Reframe sidebar + subtitles**

V `src/lib/offerings-data.ts` v `SOLUTIONS_OFFERING`:

Nahradit:
```ts
  sidebarHeadline: 'AI řešení na klíč',
  sidebarDescription:
    'Pět připravených scénářů — od znalostního asistenta po vlastní AI infrastrukturu.',
```
za:
```ts
  sidebarHeadline: 'Agentní systémy na klíč',
  sidebarDescription:
    'Od znalostního asistenta po autonomní agenty — AI, která nejen odpovídá, ale samostatně jedná a zpracovává data.',
```

V `items` upravit dva `subtitle`:
- U položky `title: 'Znalostní asistent'`: `subtitle: 'AI natrénované na vaši dokumentaci'` → `subtitle: 'Sekundární mozek a RAG nad vaší dokumentací'`
- U položky `title: 'Autonomní agenti'`: `subtitle: 'Sekvence úkolů bez lidského zásahu'` → `subtitle: 'Zpracování dat a sekvence úkolů bez dohledu'`

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: build projde.

- [ ] **Step 3: Vizuální kontrola**

Run: `pnpm dev`
Homepage `http://localhost:3000/cs` → sekce Řešení má headline „Agentní systémy na klíč" a nový popis. V horním menu po najetí na „Řešení" ukazuje mega-menu stejný headline + upravené podtitulky. Zastavit dev.

- [ ] **Step 4: Commit**

```bash
git add src/lib/offerings-data.ts
git commit -m "feat(home,nav): reframe solutions block as agentic systems"
```

---

## Task 7: Finální verifikace + stav specu

**Files:**
- Modify: `docs/superpowers/specs/2026-07-01-agentni-systemy-design.md` (Stav → hotovo)

- [ ] **Step 1: Kompletní gate**

Run: `pnpm lint:cs` → Expected: `OK`
Run: `node scripts/check-reseni-content.mjs` → Expected: `check-reseni-content: OK`
Run: `pnpm lint` → Expected: bez errorů
Run: `pnpm build` → Expected: projde; trasy obsahují `/cs/reseni/autonomni-agenti`, `/cs/reseni/ai-podpora`, `/cs/reseni/ai-infrastruktura`.

- [ ] **Step 2: Ověřit sitemap**

Run: `pnpm start` (druhý terminál)
Run: `curl -s http://localhost:3000/sitemap.xml | grep -o '/cs/reseni/[a-z-]*' | sort -u`
Expected: obsahuje `/cs/reseni/autonomni-agenti`, `/cs/reseni/ai-podpora`, `/cs/reseni/ai-infrastruktura`; NEobsahuje `/cs/reseni/agenti`.
Zastavit `pnpm start`.

- [ ] **Step 3: Ruční kontrolní seznam (akceptační kritéria specu)**

Projít a odškrtnout:
- `/cs/reseni` má úvodní blok + 3 karty; kotvy scrollují správně.
- `/cs/reseni/znalostni-asistent` a `/cs/reseni/autonomni-agenti` mají problém/přístup/use case/proces/FAQ; stuby (`ai-podpora`, `dashboardy`, `ai-infrastruktura`) se nerozbily.
- Unikátní `<title>`/description (view-source): `curl -s http://localhost:3000/cs/reseni/autonomni-agenti | grep -o '<title>[^<]*</title>'`.
- JSON-LD validní — vložit URL do Google Rich Results Test (FAQPage + Service + BreadcrumbList bez chyb).
- Homepage + mega-menu ukazují „Agentní systémy".
- Věta o jednotlivcích právě jednou (check skript to hlídá).

- [ ] **Step 4: Aktualizovat stav specu**

V `docs/superpowers/specs/2026-07-01-agentni-systemy-design.md` změnit řádek `- **Stav:**` na `- **Stav:** Implementováno (Task 0–7 hotovo).`

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-07-01-agentni-systemy-design.md
git commit -m "docs(spec): mark Agentní systémy implemented"
```

---

## Self-Review (autor plánu)

**Spec coverage:**
- Pozice/narativ (spec §2) → Task 2 (agentni blok copy) + Task 5 (render) + Task 6 (homepage/menu). ✓
- IA: index blok + 3 karty (§3.1) → Task 2 + Task 5. ✓
- Prohloubení 2 detailů (§3.2) → Task 2 (obsah) + Task 3 (render). ✓
- Homepage + mega-menu (§3.3–3.4) → Task 6. ✓
- Obsahový model sections/faq/seo (§4) → Task 2 (+ usecases navíc pro kotvy). ✓
- Komponenty (§5) → Task 3/4/5/6. ✓
- SEO: title/description, prolinky, slug fix (§6) → Task 4 (metadata), Task 1 (slugy). ✓
- AEO: FAQ + schema (§7) → Task 2 (FAQ obsah), Task 3 (render), Task 4 (FAQPage/Service/Breadcrumb schema). ✓
- Copy + typografie (§8) → Task 2 (+ lint:cs). ✓
- Individuální věta jednou (§11 krit. 7) → Task 2 sentinel + check skript. ✓
- Otevřené otázky: slugy vyřešeny (§12.1) → Task 1; `DetailSections` extrakce (§12.2) — VĚDOMĚ NEEXTRAHOVÁNO (kopie vzoru industry-body je malá, sdílený komponent by zvýšil vazbu; YAGNI); headline (§12.3) → zafixováno v Task 2 („Agentní systémy, které jednají za vás.").

**Placeholder scan:** žádné TODO/TBD; veškerá copy a kód jsou konkrétní. NBSP se doplňuje deterministickým autofixem + `lint:cs` gate (ne ruční dohady).

**Type consistency:** `SolutionItem.sections/usecases/faq/seo` (Task 3) == čtení v `page.tsx` (`item.seo`, `item.faq`) (Task 4) == JSON klíče (Task 2) == check skript (Task 2). `buildServiceSchema` `section` param (Task 4 def) == volání s `section: 'reseni'` (Task 4 page.tsx). `reseni.agentni.cards[].{title,body,href}` (Task 2) == render `{title, subtitle: body, href}` (Task 5). ✓
