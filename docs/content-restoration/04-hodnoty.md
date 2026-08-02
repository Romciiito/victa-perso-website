# 04 — Hodnoty Rewrite (`/o-nas`)

> **Priorita:** 🟡 HIGH
>
> **Source commit:** `12cdf02` fix(content): hodnoty rewrite + audit-as-investment refund model
>
> **Key:** `oNas.sections.values.items` v `content/cs/strings/common.json`

---

## Změna: 4 generic hodnoty → 4 concrete demonstrations

### Před (každá konkurence si pamatuje tytéž)

```
1. TRANSPARENTNOST  — "Ukazujeme proces, ceny, myšlení. Žádné černé skříňky."
2. PARTNERSTVÍ      — "Nestavíme a nezmizíme. Rosteme s klientem dlouhodobě."
3. AI-NATIVE        — "AI drží detaily, lidé drží myšlení. Tempo a kvalita zároveň."
4. ŘEMESLO          — "Design, kód i obsah dotahujeme do detailu. Žádné šablony."
```

**Problém:** Nikdo si nepíše "my jsme neprůhlední vendoři" / "postavíme a zmizíme" / "použijeme šablonu". = generic agency-blah.

### Po (concrete, demonstrable, unverifiable for competitors)

```
1. AUDIT JE INVESTICE
2. PARŤÁK PO LAUNCHI
3. AI DRŽÍ DETAILY, LIDÉ DRŽÍ MYŠLENÍ
4. ŽÁDNÉ ŠABLONY
```

---

## Detailní JSON content (paste exactly into common.json)

```json
"items": [
  {
    "label": "AUDIT JE INVESTICE",
    "body": "Cenu auditu započteme do rozpočtu projektu, pokud s námi pokračujete v implementaci. Pokud ne, máte zprávu, schémata a doporučení použitelné u kohokoli jiného. Žádný úvodní sales hovor zdarma — od první hodiny pracujeme na vašem problému."
  },
  {
    "label": "PARŤÁK PO LAUNCHI",
    "body": "Nestavíme a nezmizíme. Klient je s námi v kontaktu měsíčně, ne jen po předání. Měsíční reporting a přímá konzultační dostupnost — bez ticketing systému."
  },
  {
    "label": "AI DRŽÍ DETAILY, LIDÉ DRŽÍ MYŠLENÍ",
    "body": "Co u velkých agentur trvá 3 měsíce, u nás 3 týdny. Bez režie 30+ hlav, kterou si platí klient. AI je náš nástroj rychlosti — myšlení a strategii drží lidé."
  },
  {
    "label": "ŽÁDNÉ ŠABLONY",
    "body": "Každý web stavíme od nuly na váš stack a brand. Žádné WordPress themes, žádné drag-and-drop blocky, žádný stock. Design system, copywriting i kód jsou na míru."
  }
]
```

---

## Strategic reasoning per hodnota

### 1. AUDIT JE INVESTICE
**Demonstruje:** Risk reversal — kupec necítí "ztracenou" investici do auditu.
**Connection to Bod 14:** Tato hodnota přímo vysvětluje refund model na `/spoluprace` (audit cost započítáme do projektu, pokud pokračujete).
**Unique:** Konkurence by musela negovat — nikdo to nedělá explicitně.

### 2. PARŤÁK PO LAUNCHI
**Demonstruje:** Konkrétní cadence claim — "měsíčně" je verifiable.
**Connection:** Service catalog má novou službu "Správa webů a e-shopů" (retainer model). Tato hodnota komunikuje obchodní stránku stejné věci.
**Unique:** "Bez ticketing systému" specific anti-agency claim.

### 3. AI DRŽÍ DETAILY, LIDÉ DRŽÍ MYŠLENÍ
**Demonstruje:** Quantified speed claim (3 měsíce → 3 týdny).
**Connection:** Hero copy "Začneme tím, že posloucháme" — listening je human-driven, scale-up je AI-driven.
**Unique:** Specific phrasing memorable, brainstorm.md cite.

### 4. ŽÁDNÉ ŠABLONY
**Demonstruje:** Specific negations (WordPress themes, drag-and-drop, stock).
**Connection:** Differentiates od template-agency competition.
**Unique:** "Žádný stock" je konkrétní claim — nikdo to nedělá.

---

## Verifikace

```bash
# Check all 4 new hodnoty present
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
items = d['oNas']['sections']['values']['items']
labels = [item['label'] for item in items]
expected = ['AUDIT JE INVESTICE', 'PARŤÁK PO LAUNCHI', 
            'AI DRŽÍ DETAILY, LIDÉ DRŽÍ MYŠLENÍ', 'ŽÁDNÉ ŠABLONY']
for label in expected:
    status = '✓' if label in labels else '✗ MISSING'
    print(f'{status} {label}')"

# Old labels should be gone
grep -c "TRANSPARENTNOST" content/cs/strings/common.json      # expect 0 (old hodnota)
grep -c "AI-NATIVE\"" content/cs/strings/common.json          # expect 0 (label format match)
grep -c '"label": "ŘEMESLO"' content/cs/strings/common.json   # expect 0
```

---

## Heading + label texty (zachovat)

**Section heading:**
```
"values": {
  "label": "NAŠE HODNOTY",
  "headline": "Čtyři principy, které držíme.",
  "items": [ ...above ]
}
```
