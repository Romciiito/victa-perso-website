# 05 — Homepage Content Restoration

> **Priorita:** 🔴 CRITICAL (most-seen content on the site)
>
> **Source commits:** `21fca4e` (hero tags), `4225bde` (CTAs + STATUS + verb), `e5ad0e5` (offerings)
>
> **Files:** `content/cs/strings/common.json` keys `home.*` + `src/app/[locale]/page.tsx`

---

## 1. Hero copy (zachováno z původního)

### H1
**Key:** `home.hero.headline`
```
"Začneme tím, že posloucháme."
```
✓ Distinctive voice — nezmenit.

### Sub paragraph
**Key:** `home.hero.sub`
```
"Než cokoliv navrhneme, chceme rozumět vašemu podnikání. To je celé."
```
✓ Distinctive — nezmenit.

### Status line (Bod 7 cleanup)
**Key:** `home.hero.status`
```diff
- "STATUS · v 0.1.0 · published 2026-05-07 · region eu-central-1"
+ "VICTA DIGITAL · česká digitální agentura"
```

---

## 2. Hero tags row (Bod 11 — kompletní redesign)

### Před (4 tagů, mix concepts)
```
"tagsAudit": "Audit"
"tagsDev": "Vývoj"
"tagsMarketing": "Marketing"
"tagsAi": "AI integrace"
```
Vykreslí: `AUDIT · VÝVOJ · MARKETING · AI INTEGRACE`

### Po (5 tagů, all concrete services)
```json
"tagsWeb": "Weby",
"tagsEshop": "E-shopy",
"tagsAi": "AI",
"tagsMarketing": "Marketing",
"tagsSprava": "Správa"
```
Vykreslí: `WEBY · E-SHOPY · AI · MARKETING · SPRÁVA`

### Frontend change v `src/app/[locale]/page.tsx`

Replace 4-tag block s 5-tag block:

```tsx
<span>{t('hero.tagsWeb')}</span>
{NBSP}
<span style={{ color: 'var(--accent)' }}>·</span>
{NBSP}
<span>{t('hero.tagsEshop')}</span>
{NBSP}
<span style={{ color: 'var(--accent)' }}>·</span>
{NBSP}
<span>{t('hero.tagsAi')}</span>
{NBSP}
<span style={{ color: 'var(--accent)' }}>·</span>
{NBSP}
<span>{t('hero.tagsMarketing')}</span>
{NBSP}
<span style={{ color: 'var(--accent)' }}>·</span>
{NBSP}
<span>{t('hero.tagsSprava')}</span>
```

**Reasoning:** Cold traffic z Google scanuje shora dolů. Tags row je první konkrétní info pod H1 "posloucháme". Konkrétní služby (WEBY · E-SHOPY) odpoví "co děláte" v sekundě.

**Important:** Tady byl divergence — pro D-007 design Roman zachoval 4-tag, pro D-008 šel 5-tag. Po revertu D-008 → D-007 je status uncertain. Verify what's currently in JSON + page.tsx.

---

## 3. Hero CTAs (Bod 19 + Bod 5)

### CTAs (Bod 18 — keep dvojí CTA, ghost je sufficient hierarchy)
**Keys:**
```json
"ctaPrimary": "Rezervovat audit →"   (was "Spustit audit →" — Bod 19)
"ctaGhost": "Domluvit konzultaci"
```

### Audit CTA href fix (Bod 5)
V `src/app/[locale]/page.tsx`, všechny 3 AuditCard:
```diff
- ctaHref="/kontakt"
+ ctaHref="/spoluprace#audit"
```

3 occurrences celkem.

---

## 4. Offerings sekce — 3 sloupce kompletní rewrite

**Keys:** `home.offerings.{services,solutions,industries}`

### Sekce A — Services (kompletní rewrite)

```json
"services": {
  "headline": "Tři kompetence, jedna agentura",
  "description": "Weby, AI a marketing pod jednou střechou. Od prvního pixelu až po měřitelné výsledky.",
  "ctaHref": "/sluzby",
  "items": [
    {
      "title": "Weby a e-shopy na míru",
      "subtitle": "Návrh, vývoj a spuštění na míru",
      "href": "/sluzby#weby"
    },
    {
      "title": "Správa webů a e-shopů",
      "subtitle": "Technická péče, aktualizace a rozvoj",
      "href": "/sluzby#sprava"
    },
    {
      "title": "AI chatboti a automatizace",
      "subtitle": "Chatboti, agenti a automatizace procesů",
      "href": "/sluzby#ai"
    },
    {
      "title": "SEO a AEO",
      "subtitle": "Organická viditelnost ve vyhledávačích i AI",
      "href": "/sluzby#seo"
    },
    {
      "title": "PPC a performance marketing",
      "subtitle": "Placené kampaně s měřitelným výnosem",
      "href": "/sluzby#ppc"
    },
    {
      "title": "Komplexní transformace byznysu",
      "subtitle": "Audit a plán celého digitálního stacku",
      "href": "/spoluprace"
    }
  ]
}
```

**Old headline byl:** `"Služby pro vaši AI cestu"` ← discard.
**Old items:** AI Discovery, AI Strategie, Datová platforma, AI-driven vývoj, AI Governance, MLOps ← discard.

### Sekce B — Solutions (rename items to match `/reseni`)

```json
"solutions": {
  "headline": "AI řešení na klíč",
  "description": "Pět připravených scénářů — od znalostního asistenta po vlastní AI infrastrukturu.",
  "ctaHref": "/reseni",
  "items": [
    {
      "title": "Znalostní asistent",
      "subtitle": "AI natrénované na vaši dokumentaci",
      "href": "/reseni#znalostni-asistent"
    },
    {
      "title": "Autonomní agenti",
      "subtitle": "Sekvence úkolů bez lidského zásahu",
      "href": "/reseni#agenti"
    },
    {
      "title": "AI podpora zákazníků",
      "subtitle": "Chatbot 24/7, eskalace na živého agenta",
      "href": "/reseni#podpora"
    },
    {
      "title": "Datové dashboardy",
      "subtitle": "Jeden přehled pro prodeje, marketing i sklad",
      "href": "/reseni#dashboardy"
    },
    {
      "title": "AI infrastruktura",
      "subtitle": "Platforma pro více AI scénářů najednou",
      "href": "/reseni#infrastruktura"
    }
  ]
}
```

**Discarded old names:** GenAI a RAG asistenti, Autonomní AI agenti, AI zákaznická podpora, Prediktivní analytika, AI Infrastruktura.

### Sekce C — Industries (kompletní rewrite)

```json
"industries": {
  "headline": "Odvětví, kterým rozumíme",
  "description": "Neřešíme jen techniku — rozumíme procesům a tlakům v každém oboru, se kterým pracujeme.",
  "ctaHref": "/odvetvi",
  "items": [
    {
      "title": "E-commerce",
      "subtitle": "Shopify, Shoptet, headless, CZ feedy",
      "href": "/odvetvi#ecommerce"
    },
    {
      "title": "Výroba",
      "subtitle": "SAP, OEE, prediktivní údržba",
      "href": "/odvetvi#vyroba"
    },
    {
      "title": "Logistika",
      "subtitle": "CMR, AETR, optimalizace tras",
      "href": "/odvetvi#logistika"
    },
    {
      "title": "Finance",
      "subtitle": "ČNB, DORA, AML/KYC compliance",
      "href": "/odvetvi#finance"
    },
    {
      "title": "Energetika",
      "subtitle": "Air-gapped LLM, ERÚ, fotovoltaika",
      "href": "/odvetvi#energetika"
    },
    {
      "title": "Zdravotnictví",
      "subtitle": "FotoFinder, longevity AI, GDPR",
      "href": "/odvetvi#zdravotnictvi"
    }
  ]
}
```

**Discarded old:** "AI řešení pro vaše odvětví" headline + AI-prefixed items.

**Note:** Homepage zobrazuje 6 industries, /odvetvi page má všech 8 (Profesionální služby + Zákaznická podpora navíc na /odvetvi).

---

## 5. Frontend file — `src/lib/offerings-data.ts` sync

Tento soubor je single source of truth pro homepage offerings + mega-menu (per design comment v souboru). Po rewrite v JSON je nutno aktualizovat ICON arrays + sidebar content.

**Source commit:** `688b2cc`

Plný obsah souboru:
```bash
git show 688b2cc:src/lib/offerings-data.ts
```

Klíčové změny:
- SERVICES_OFFERING: 6 items s ikonami (Code2, Settings, MessageSquare, Search, TrendingUp, Target)
- SOLUTIONS_OFFERING: 5 items s renamed titles
- INDUSTRIES_OFFERING: 6 homepage items s ikonami (ShoppingCart, Factory, Truck, Landmark, Zap, Stethoscope)
- Add imports: Code2, Factory, Truck, Landmark, Zap, Stethoscope + others

---

## Verifikace

```bash
# Hero tags
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
hero_tags = {k: v for k, v in d['home']['hero'].items() if k.startswith('tags')}
print('Hero tags:', hero_tags)"
# Expected: 5 tagsWeb/Eshop/Ai/Marketing/Sprava OR 4 tagsAudit/Dev/Marketing/Ai (depends on D-007 vs D-008 final decision)

# CTAs
grep -c "Rezervovat audit" content/cs/strings/common.json     # expect 2
grep -c "Spustit audit" content/cs/strings/common.json        # expect 0

# Audit tier hrefs
grep -c 'ctaHref="/spoluprace#audit"' src/app/\[locale\]/page.tsx   # expect 3
grep -c 'ctaHref="/kontakt"' src/app/\[locale\]/page.tsx            # expect 0 (or 1-2 for non-audit CTAs)

# Offerings headlines
grep -c "Tři kompetence, jedna agentura" content/cs/strings/common.json    # expect 1
grep -c "Odvětví, kterým rozumíme" content/cs/strings/common.json          # expect 1
grep -c "Služby pro vaši AI cestu" content/cs/strings/common.json          # expect 0 (old)
grep -c "AI řešení pro vaše odvětví" content/cs/strings/common.json        # expect 0 (old)
```
