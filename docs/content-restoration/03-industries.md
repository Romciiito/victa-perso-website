# 03 — Industries Restoration

> **Priorita:** 🔴 CRITICAL
>
> **Source commits:** `e5ad0e5` (main content port) + Spawn E.1–E.8 outputs
>
> **Schema:** `{ key, icon, name, body, [intro], [useCases], [targetClients], [faq] }` v `content/cs/strings/common.json` pod `odvetvi.items`

---

## Změna: 5 → 8 industries

Production design (D-007) renderuje pouze `body` field (jednoduchý odstavec). Rich schema (intro/useCases/targetClients/faq) je v JSON ale page komponenta zobrazí jen `body`.

### Před (5 industries)
```
1. E-commerce (ShoppingCart)
2. Výroba & logistika (Factory) — combined
3. Profesionální služby (Briefcase)
4. Finance (Landmark)
5. Zákaznická podpora (Headphones)
```

### Po (8 industries)
```
1. E-commerce (ShoppingCart)        — refresh
2. Výroba (Factory)                  — SPLIT from "Výroba & logistika"
3. Logistika (Truck)                 — NEW (split + rich content)
4. Profesionální služby (Briefcase)  — refresh
5. Finance (Landmark)                — refresh
6. Energetika (Zap)                  — NEW
7. Zdravotnictví (Stethoscope)       — NEW
8. Zákaznická podpora (Headphones)   — refresh
```

---

## Detailní content per industry

### 1. E-commerce
**Key/icon:** `ecommerce` / `ShoppingCart`
**Body (production-compatible flat):**
> "E-shop, který přerostl krabicové řešení, potřebuje víc než šablonu — potřebuje tým, který rozumí české infrastruktuře: Shoptet, Heureka, Zásilkovna, Pohoda. Stavíme, napojíme a pak pomáháme růst. AI není volitelný doplněk — je to část toho, jak pracujeme."

### 2. Výroba (split + refresh)
**Key/icon:** `vyroba` / `Factory`
**Body:**
> "Rozumíme výrobnímu provozu — od SAP a MES až po OEE dashboardy a prediktivní údržbu. Nepřicházíme s generickým řešením, ale s integracemi, které sedí na váš ERP a vaše KPIs."

### 3. Logistika (NEW)
**Key/icon:** `logistika` / `Truck`
**Body:**
> "Kamionová doprava, kurýři, spedice i 3PL sklady — všechny trpí stejným problémem: ruční přepisování dat z CMR, faktur a e-mailů. Zapojíme AI, která dokumenty čte sama, a automaty, které vedou knihu jízd za vás. Méně administrativy, víc kilometrů."

### 4. Profesionální služby
**Key/icon:** `profesionalni-sluzby` / `Briefcase`
**Body:**
> "Advokátní kanceláře, daňové poradny a účetní firmy tráví hodiny hledáním v archivech a ručním přepisováním dat z e-mailů do CRM. My tenhle čas vracíme zpět — integrací s vaším stávajícím CRM, nebo postavením vlastního na míru, když žádný SaaS váš workflow nezvládá."

**Note:** Renamed key from `professional` → `profesionalni-sluzby` (homepage anchor alignment).

### 5. Finance
**Key/icon:** `finance` / `Landmark`
**Body:**
> "Banky, pojišťovny, fintech startupy, leasingové společnosti. Víme, co ČNB chce vidět — a píšeme marketing i kód tak, aby to regulátor nezametl. AI use cases navrhujeme auditovatelně od začátku, ne jako záplatu."

**Plus:** Bod 14 addition (data analytics + trend analysis) — viz Spawn C output detail.

### 6. Energetika (NEW)
**Key/icon:** `energetika` / `Zap`
**Body:**
> "Distribuční firmy i OZE instalatéři řeší jinou váhu problémů — ale oboje spojuje složitá dokumentace, přísný regulátor a zákazníci, kteří nerozumí svému vyúčtování. Díváme se, jak vaše procesy reálně fungují, a navrhujeme AI a digitální nástroje, které do nich zapadnou."

**Use cases (per Roman input — verbatim):**
1. LLMs na interních serverech (air-gapped) pro technickou + právní dokumentaci
2. Generativní AI pro zákaznickou podporu (vyúčtování, OZE/fotovoltaika žádosti)
3. Autonomní analytika síťového provozu (anomálie)
4. Digitální onboarding pro instalatéry OZE (added by spawn — Roman approved keep)

**Regulatory context:** ERÚ, energetický zákon (455/2000 Sb.), GDPR pro consumer data
**Primary clients:** Distribuční (ČEZ, E.ON, PRE) — enterprise + OZE/fotovoltaika startupy — SMB

### 7. Zdravotnictví (NEW)
**Key/icon:** `zdravotnictvi` / `Stethoscope`
**Body:**
> "Soukromé estetické a longevity kliniky mají jiné nároky než běžné ambulance — prémiové klientské zkušenosti, citlivá data a Instagram jako hlavní marketingový kanál. Stavíme infrastrukturu a nástroje, ne lékařská rozhodnutí."

**Use cases:**
1. Integrace s FotoFinder — propojení digitálního dermatoskopu s interní databází
2. Longevity AI analýza — genetika, krevní hodnoty, mikrobiom
3. LLM komunikace s klienty — asistent pro dotazy o rekonvalescenci, ceníky, termíny
4. Obsah pro Instagram a Facebook — generování marketingových podkladů

**Primary client:** Premium private (estetika, longevity). NE státní zdravotnictví, NE klasické ambulance.
**Regulatory:** GDPR + Zákon o zdravotních službách (372/2011 Sb.)

### 8. Zákaznická podpora
**Key/icon:** `zakaznicka-podpora` / `Headphones`
**Body:**
> "Firmy s 1 000+ ticketů měsíčně ztrácejí čas na opakujících se dotazech. Nasadíme AI, která automaticky vyřídí 70 % běžných dotazů, zatímco agenti řeší situace, kde záleží na lidském úsudku. Zendesk, Intercom, Freshdesk a Front zůstávají — jen pracují chytřeji."

---

## Frontend changes pro 3 nové ikony (Truck, Zap, Stethoscope)

V `src/app/[locale]/odvetvi/page.tsx`:

### Imports
```tsx
import {
  ShoppingCart,
  Factory,
  Truck,           // NEW
  Briefcase,
  Landmark,
  Zap,             // NEW
  Stethoscope,     // NEW
  HeartPulse,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
```

### iconMap
```tsx
const iconMap = {
  ShoppingCart,
  Factory,
  Truck,           // NEW
  Briefcase,
  Landmark,
  Zap,             // NEW
  Stethoscope,     // NEW
  HeartPulse,
  Headphones,
} satisfies Record<string, LucideIcon>;
```

---

## Verifikace

```bash
# Count industries
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
print(f\"Industries: {len(d['odvetvi']['items'])}\")
for item in d['odvetvi']['items']:
    print(f\"  {item['key']:30} icon={item['icon']:15} name={item['name']}\")"

# Expected output: 8 industries with correct icons

# New industries present
grep -c '"name": "Logistika"' content/cs/strings/common.json       # expect 1
grep -c '"name": "Energetika"' content/cs/strings/common.json      # expect 1
grep -c '"name": "Zdravotnictví"' content/cs/strings/common.json   # expect 1

# Icons imported in page.tsx
grep -c "Truck" src/app/\[locale\]/odvetvi/page.tsx       # expect 2+ (import + iconMap)
grep -c "Zap" src/app/\[locale\]/odvetvi/page.tsx         # expect 2+
grep -c "Stethoscope" src/app/\[locale\]/odvetvi/page.tsx # expect 2+

# Old combined "Výroba & logistika" should be gone
grep -c "Výroba & logistika" content/cs/strings/common.json  # expect 0
```

---

## Pokud restoration potřebuje rich schema (intro/useCases/targetClients/faq)

Po D-008 → D-007 revertu page renderuje jen `body`. Pokud chceš richer rendering:

1. Otevři frontend task #6 (`/sluzby` anchors) v TaskCreate — související
2. Pro rich industry rendering update `odvetvi/page.tsx` schema dle původního `e5ad0e5` commit
3. Original spawn outputs ze Spawn E.1–E.8 se dají reconstructnout z `.tmp/spawn-e-*.json` (pokud existuje) nebo z git commit `e5ad0e5`
