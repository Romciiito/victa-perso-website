# 06 — Spoluprace Audit Refund Model

> **Priorita:** 🟡 HIGH (conversion-critical objection killer)
>
> **Source commit:** `12cdf02` fix(content): hodnoty rewrite + audit-as-investment refund model
>
> **File:** `content/cs/strings/common.json` keys `spoluprace.*`

---

## Strategic context

Audit pricing tier 1 (20–90k Kč) je velký commitment. Hlavní objection prospects: "Co když po auditu nebudeme pokračovat?"

Roman's strategic decision: **audit cena se započítá do projektu, pokud klient pokračuje s VICTA**. Risk reversal pro kupce + signál confidence pro VICTA.

Komunikováno na 3 místech:
1. Hodnota "AUDIT JE INVESTICE" v `/o-nas` (viz 04-hodnoty.md)
2. `tiers.note` text na `/spoluprace` (níže)
3. Nová FAQ na `/spoluprace.faq.items` (níže)

---

## 1. tiers.note update

**Key:** `spoluprace.tiers.note`

### Před
```
"Přesná cena závisí na rozsahu projektu — rádi ji upřesníme na úvodním sezení."
```

### Po
```
"Přesná cena závisí na rozsahu projektu — rádi ji upřesníme na úvodním sezení. Bonus pro Tier 1 a Tier 2: cenu auditu deduktivně započteme do rozpočtu projektu, když po něm pokračujete v implementaci s námi. Audit tak nikdy není ztracená investice. Tier 3 (strategická session) je vždy samostatný produkt bez tohoto pravidla."
```

**Key rules:**
- **Tier 1** (20–90k Kč Komplexní podnikový audit) → refund yes
- **Tier 2** (10–55k Kč Doménový audit) → refund yes
- **Tier 3** (4–25k Kč Strategická session) → refund NE (samostatný produkt)

---

## 2. Nová FAQ — refund objection killer

**Key:** `spoluprace.faq.items` (insert at position 3, after first 2 existing items)

### New FAQ entry

```json
{
  "q": "Co když po auditu nebudu chtít pokračovat s vámi?",
  "a": "Cena auditu zůstává — je to férové, protože jste dostali plán, schémata a doporučení použitelné kdekoliv. Když ale pokračujete v implementaci s námi, cenu auditu (Tier 1 nebo Tier 2) deduktivně započteme do rozpočtu projektu. Tier 3 — strategická session — je samostatný produkt bez tohoto pravidla."
}
```

**Position:** Insert at index 2 (after first 2 existing FAQ items) — surfaces prominently as primary objection handler.

**Total FAQ count after insert:** 8 → 9.

---

## 3. Existing 8 FAQ items (zachovat)

Pro reference — original FAQ items na `/spoluprace`:

1. "Co se přesně děje na prvním sezení?"
2. "Jsem zavázán k pokračování po auditu?"
3. **[NEW] "Co když po auditu nebudu chtít pokračovat s vámi?"** ← ADD HERE
4. "Jak dlouho trvá, než dostanu výsledky?"
5. "Mohu si vybrat jen jednu konkrétní službu bez auditu?"
6. "Proč jsou ceny jako rozsah, ne jako fixní částka?"
7. "Jak probíhá platba?"
8. "Co když po auditu nebudu mít budget na pokračování?"
9. "Děláte i pro malé firmy a startupy?"

**Note:** FAQ #2 ("Jsem zavázán k pokračování po auditu?") may slightly overlap with new FAQ #3 ale je o jiném angle (závazek vs. cena). Drop #2 only pokud overlap je problém.

---

## Verifikace

```bash
# Refund mention v tiers.note
grep -c "Bonus pro Tier 1 a Tier 2" content/cs/strings/common.json  # expect 1
grep -c "deduktivně započteme" content/cs/strings/common.json       # expect 1+ (note + FAQ + hodnota)

# Nová FAQ entry
grep -c "Co když po auditu nebudu chtít pokračovat" content/cs/strings/common.json  # expect 1

# FAQ count
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
faq_count = len(d['spoluprace']['faq']['items'])
print(f'FAQ items: {faq_count} (expect 9)')"
```

---

## Optional follow-up — dedicated section block

V plánu (PR #15) bylo zvažováno přidat samostatný blok "Audit jako investice" na `/spoluprace` page (mezi `tiers` a `invoice`). Zatím není implementováno — `tiers.note` + FAQ stačí pro initial deploy.

Pokud chceš dedicated block později:
- Frontend: přidat new `<section>` v `src/app/[locale]/spoluprace/page.tsx`
- Content: vytvořit `spoluprace.auditInvestice` block v JSON
- Reference design v PR #15 plan
