# 02 — Positioning + Service Catalog Restoration

> **Priorita:** 🔴 CRITICAL — pozicování je foundation všeho dalšího (hero copy, /sluzby, llms.txt)
>
> **Source commit:** `e5ad0e5` feat(content): full-service positioning rewrite — service catalog + 8 industries + homepage

---

## Pozicování — kanonická pozice

```
COMPONENT       CONTENT
─────────────────────────────────────────────────────────────
CO              Full-service digitální agentura
                (web, dev, marketing, AI pod jednou střechou)
JAK             Malý AI-augmented tým
                (AI = operating model, NE produkt)
PRO KOHO        Střední byznys CZ/SK (50–300 zaměstnanců)
WEDGE           Tři kompetence: KÓD · AI · MARKETING
                + AI-native delivery
ENTRY POINTS    1) Audit → transformace (placený)
                2) Modulární zakázka přes scoping call (zdarma)
```

**Kanonická hero copy formulace** (z brainstorm.md):
> "Parťák, ne dodavatel. Postavíme s vámi systém, ne jenom web. Audit byznysu, návrh řešení, integrace na míru, správa, růst — všechno pod jednou střechou. Tři kompetence: kód, marketing, znalost odvětví. Malý AI-augmented tým…"

---

## Service catalog — 18 služeb ve 3 oblastech

**Key:** `sluzby.categories.*.items` v `content/cs/strings/common.json`

### IT & Vývoj (6 položek)

#### 1. Weby na míru
- **Status:** Refresh (rozšířený popis)
- **Description:** "Marketingové weby, korporátní stránky a landing pages pro firmy, které nechtějí šablonu — chtějí web, který slouží jako obchodní nástroj. Stavíme na Next.js nebo Astro, nasazujeme na Vercel. Výkon PageSpeed 95+/100, přístupnost WCAG 2.1 AA a AEO-ready strukturovaná data jsou součástí každého projektu."
- **Hodí se pro:** "Střední firmy 50–300 zaměstnanců, které přerostly šablonový web a potřebují prezentaci odpovídající velikosti firmy."

#### 2. E-shopy na míru
- **Status:** Refresh
- **Description:** "Shopify Plus nebo Medusa.js pro e-shopy, které přerostly krabicové řešení — nebo které od začátku potřebují headless architekturu. Napojíme vás na Pohodu nebo Helios pro účetnictví a sklad, na Zásilkovnu, PPL a Českou poštu pro expedici. Platební brány, ERP, CRM — vše API-first, monitorované, zdokumentované."
- **Hodí se pro:** "E-shopy s vlastním skladem, ERP nebo specifickými požadavky na integraci, které krabicová platforma nezvládne bez kompromisů."

#### 3. Prezentační weby a microsite (NOVÉ)
- **Status:** NEW
- **Description:** "Rychlý web pro produktový launch, kampaňová landing page nebo microsite pro novou službu — od briefu k launchi 2–4 týdny. Stavíme na Next.js nebo Astro, vždy SEO a AEO připravené. Marketingová oddělení nás volí pro kampaňové microsite, kde hlavní web je příliš pomalý na schválení."
- **Hodí se pro:** "Malé firmy a startupy s jasným záměrem, živnostníky a OSVČ, marketingová oddělení větších firem pro kampaňové nebo produktové microsite."

#### 4. Správa webů a e-shopů (NOVÉ — partnership wedge demonstrator)
- **Status:** NEW
- **Description:** "Nestavíme statické weby — a nezmizíme po předání. Správa zahrnuje průběžné SEO, GEO a AEO aktualizace, technickou údržbu, bezpečnostní záplaty a monitoring výkonu. Měsíční retainer, pravidelný reporting a přímá konzultační dostupnost — parťák, ne tiketing systém."
- **Hodí se pro:** "Firmy po dokončení projektu, které nechtějí web nechat zaniknout, i pro nové klienty hledající dlouhodobého digitálního partnera bez interního IT."

#### 5. Integrace systémů
- **Status:** Unchanged (pass-through)
- **Description:** "Sklad, účetnictví, ERP, CRM, payment gateways, doprava. API-first, monitorované, dokumentované."

#### 6. Webové aplikace a custom vývoj (RENAME)
- **Status:** RENAMED z "Custom solution development" + rozšířený popis
- **Description:** "Webové aplikace, dashboardy, admin panely a interní nástroje tam, kde SaaS nestačí. Pracujeme na Next.js a Node.js frontendech i Python backendech, napojujeme třetí strany přes dokumentovaná API. Výsledek je aplikace postavená na váš proces — ne vaše procesy ohnuté pod cizí UX."
- **Hodí se pro:** "Firmy s unikátním interním workflow, pro které neexistuje hotové SaaS řešení, nebo které chtějí nahradit složitou kombinaci nástrojů jednou vlastní aplikací."

---

### AI & Data (5 položek)

#### 7. AI chatboti
- **Status:** Keep

#### 8. Automatizace procesů (RENAME + EXPAND z "AI automatizace procesů")
- **Status:** RENAMED + EXPANDED
- **Description:** "Začínáme tím, že rozumíme, jak proces funguje — teprve potom navrhujeme řešení. Nástrojů je mnoho: od jednoduchých workflow v Zapier až po komplexní remodelaci s vlastními webovými aplikacemi na míru. AI je jeden z nástrojů, ne podmínka."
- **Hodí se pro:** "Firmy s opakujícími se manuálními procesy, týmy, které tráví čas přepisováním dat mezi systémy, nebo organizace, které potřebují přepracovat celý procesní tok."
- **Offerings array** (sub-katalog):
  - "Jednoduché workflow automatizace (Zapier, n8n, Make)"
  - "AI-driven automatizace (LLM agents, klasifikace, generování, embedding search)"
  - "Komplexní procesní remodelace (BPM, custom integrace, webové aplikace na míru)"

#### 9. AI konzultace + audit + strategie
- **Status:** Keep

#### 10. Datová platforma + integrace
- **Status:** Keep

#### 11. MLOps / Provoz AI systémů
- **Status:** Keep

---

### Marketing & Obsah (7 položek)

#### 12. SEO
- **Status:** Keep

#### 13. AEO (Answer Engine Optimization)
- **Status:** Keep

#### 14. PPC kampaně
- **Status:** Keep

#### 15. Social media management
- **Status:** Keep

#### 16. Tvorba kreativ
- **Status:** Keep

#### 17. E-commerce management (EXPAND scope)
- **Status:** Same name, expanded scope
- **Description:** "Obchodní a marketingová vrstva e-shopu po launchi — ne technická údržba. CRO a A/B testy funnelu, customer journey od kliku po win-back, e-mail, SMS a push. Pricing strategie, bundles, upsell a cross-sell. Feedy a vyhledávače Heureka, Zboží.cz a Glami, propojení s analytikou. Retence přes RFM segmentaci a věrnostní programy."
- **Hodí se pro:** "E-shopy s tržbami od 1 mil. Kč ročně, které mají spuštěný tech stack a chtějí z něj dostat víc — bez dalšího vývojáře, ale s někým, kdo hlídá byznys."

#### 18. Marketing strategy + plan
- **Status:** Keep

---

## FAQ pairs (na catalog page) — per service

Většina služeb má 2-3 FAQ páry. Detaily v PR #15 commit. Pro restoration:

```bash
# Extrahovat exact FAQ JSON z commit
git show e5ad0e5:content/cs/strings/common.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
for cat in ['itDev', 'aiData', 'marketing']:
    print(f'=== {cat} ===')
    for item in d['sluzby']['categories'][cat]['items']:
        print(f\"  {item['name']}: {len(item.get('faq', []))} FAQ pairs\")"
```

---

## Verifikace

```bash
# Service count
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
total = sum(len(d['sluzby']['categories'][cat]['items']) for cat in ['itDev', 'aiData', 'marketing'])
print(f'Total services: {total} (expect 18)')"

# Specific new services exist
grep -c "Prezentační weby a microsite" content/cs/strings/common.json   # expect 1+
grep -c "Správa webů a e-shopů" content/cs/strings/common.json          # expect 1+
grep -c "Webové aplikace a custom vývoj" content/cs/strings/common.json # expect 1+
grep -c "Automatizace procesů" content/cs/strings/common.json           # expect 1+

# Old names should be gone
grep -c "AI automatizace procesů" content/cs/strings/common.json        # expect 0
grep -c "Custom solution development" content/cs/strings/common.json    # expect 0 (CS)
```

## Sluzby page hero copy

**Key:** `sluzby.hero.subhead`

```
"Tři kompetence — kód, AI a marketing — pod jednou střechou. 18 služeb napříč celým digitálním stackem."
```
