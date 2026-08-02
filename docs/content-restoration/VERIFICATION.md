# Master Verification Checklist

> **Spusť tento checklist k validaci, že všechny content edity ze sezení 23.–25. 5. dorazily na current main.**
>
> Pokud cokoliv FAIL → otevři příslušný topic soubor (`01-legal-data.md` až `09-ci-infrastructure.md`) pro detail.

---

## Pre-flight

```bash
# Z parent VICTA dir
cd /Users/trungle/Desktop/websites/VICTA
git status         # should be clean (nebo jen .claude/worktrees/ untracked)
git branch --show-current  # should be on main (or revert branch)
git log -1 --oneline       # check latest commit
```

---

## ✅ Checklist — 9 topics

Mark each ✅ when verified or ❌ if missing, then go to relevant topic file.

### Topic 1: Legal Data (`01-legal-data.md`)

```bash
echo "=== Legal Data ===" && \
grep -c "VICTA DIGITAL s.r.o." content/cs/strings/common.json    && echo "  (expect 5+)" && \
grep -c "IČO 28859511" content/cs/strings/common.json            && echo "  (expect 2)" && \
grep -c "Haškova 1238/8" content/cs/strings/common.json          && echo "  (expect 2)" && \
grep -c "Babákova 14" content/cs/strings/common.json             && echo "  (expect 2)" && \
grep -c "Victa Digital" content/cs/strings/common.json           && echo "  (expect 0 — old casing)" && \
grep -c "\[doplnit\]" content/cs/strings/common.json             && echo "  (expect 0)"
```

**Pass criteria:** All counts match expected. Status: [ ]

---

### Topic 2: Service Catalog (`02-positioning-catalog.md`)

```bash
echo "=== Service Catalog ===" && \
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
total = sum(len(d['sluzby']['categories'][cat]['items']) for cat in ['itDev', 'aiData', 'marketing'])
print(f'  Total services: {total} (expect 18)')
for cat in ['itDev', 'aiData', 'marketing']:
    items = d['sluzby']['categories'][cat]['items']
    print(f'  {cat}: {len(items)} services')
    for item in items:
        print(f'    - {item[\"name\"]}')" && \
echo "" && \
grep -c "Prezentační weby a microsite" content/cs/strings/common.json   && echo "  (expect 1+)" && \
grep -c "Správa webů a e-shopů" content/cs/strings/common.json          && echo "  (expect 1+)" && \
grep -c "Webové aplikace a custom vývoj" content/cs/strings/common.json && echo "  (expect 1+)" && \
grep -c "AI automatizace procesů" content/cs/strings/common.json        && echo "  (expect 0 — renamed)"
```

**Pass criteria:** 18 services total, 6+5+7 split per category, 4 new services named. Status: [ ]

---

### Topic 3: Industries (`03-industries.md`)

```bash
echo "=== Industries ===" && \
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
items = d['odvetvi']['items']
print(f'  Industries: {len(items)} (expect 8)')
for item in items:
    print(f'  - {item[\"key\"]:30} icon={item[\"icon\"]:15} name={item[\"name\"]}')" && \
echo "" && \
echo "Frontend icons:" && \
grep -c "Truck" "src/app/[locale]/odvetvi/page.tsx"       && echo "  (expect 2+ — import + iconMap)" && \
grep -c "Zap" "src/app/[locale]/odvetvi/page.tsx"         && echo "  (expect 2+)" && \
grep -c "Stethoscope" "src/app/[locale]/odvetvi/page.tsx" && echo "  (expect 2+)"
```

**Pass criteria:** 8 industries (E-commerce, Výroba, Logistika, Profesionální služby, Finance, Energetika, Zdravotnictví, Zákaznická podpora) + 3 new icons in page.tsx. Status: [ ]

---

### Topic 4: Hodnoty (`04-hodnoty.md`)

```bash
echo "=== Hodnoty ===" && \
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
items = d['oNas']['sections']['values']['items']
labels = [item['label'] for item in items]
expected = ['AUDIT JE INVESTICE', 'PARŤÁK PO LAUNCHI',
            'AI DRŽÍ DETAILY, LIDÉ DRŽÍ MYŠLENÍ', 'ŽÁDNÉ ŠABLONY']
for label in expected:
    status = '✓' if label in labels else '✗ MISSING'
    print(f'  {status} {label}')" && \
echo "" && \
grep -c '"label": "TRANSPARENTNOST"' content/cs/strings/common.json  && echo "  (expect 0 — old)" && \
grep -c '"label": "ŘEMESLO"' content/cs/strings/common.json          && echo "  (expect 0 — old)"
```

**Pass criteria:** 4 new labels present, 0 old labels. Status: [ ]

---

### Topic 5: Homepage (`05-homepage.md`)

```bash
echo "=== Homepage ===" && \
echo "" && echo "Hero tags:" && \
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
hero_tags = {k: v for k, v in d['home']['hero'].items() if k.startswith('tags')}
print(f'  {hero_tags}')
print(f'  Count: {len(hero_tags)}')
# Either 5-tag (Web/Eshop/Ai/Marketing/Sprava) for D-008 design 
# OR 4-tag (Audit/Dev/Marketing/Ai) for D-007 production design" && \
echo "" && echo "CTAs:" && \
grep -c "Rezervovat audit" content/cs/strings/common.json   && echo "  (expect 2)" && \
grep -c "Spustit audit" content/cs/strings/common.json      && echo "  (expect 0)" && \
echo "" && echo "Audit CTA hrefs:" && \
grep -c 'ctaHref="/spoluprace#audit"' "src/app/[locale]/page.tsx"   && echo "  (expect 3)" && \
echo "" && echo "Offerings headlines:" && \
grep -c "Tři kompetence, jedna agentura" content/cs/strings/common.json    && echo "  (expect 1)" && \
grep -c "Odvětví, kterým rozumíme" content/cs/strings/common.json          && echo "  (expect 1)" && \
grep -c "Služby pro vaši AI cestu" content/cs/strings/common.json          && echo "  (expect 0 — old)" && \
grep -c "AI řešení pro vaše odvětví" content/cs/strings/common.json        && echo "  (expect 0 — old)"
```

**Pass criteria:** Hero tags adjusted, audit CTAs to /spoluprace#audit, new headlines present. Status: [ ]

---

### Topic 6: Spoluprace Refund (`06-spoluprace-refund.md`)

```bash
echo "=== Spoluprace Refund ===" && \
grep -c "Bonus pro Tier 1 a Tier 2" content/cs/strings/common.json  && echo "  (expect 1 — tiers.note)" && \
grep -c "deduktivně započteme" content/cs/strings/common.json       && echo "  (expect 2-3)" && \
grep -c "Co když po auditu nebudu chtít pokračovat" content/cs/strings/common.json && echo "  (expect 1 — new FAQ)" && \
echo "" && \
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
faq_count = len(d['spoluprace']['faq']['items'])
print(f'  FAQ items: {faq_count} (expect 9)')"
```

**Pass criteria:** Tiers.note has refund mention, new FAQ inserted, total 9 FAQ items. Status: [ ]

---

### Topic 7: STATUS + CTA (`07-status-cta.md`)

```bash
echo "=== STATUS + CTA ===" && \
echo "" && echo "STATUS badges:" && \
grep -c "STATUS · v 0.1.0" content/cs/strings/common.json   && echo "  (expect 0 — old)" && \
grep -c "VICTA DIGITAL · česká digitální agentura" content/cs/strings/common.json && echo "  (expect 1)" && \
grep -c "VICTA DIGITAL s.r.o. · 2026" content/cs/strings/common.json              && echo "  (expect 1)" && \
echo "" && echo "Page-level statuses (should be just /cs/...):" && \
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
pages = ['spoluprace', 'sluzby', 'reseni', 'odvetvi', 'oNas', 'kontakt', 'blog']
for p in pages:
    status = d.get(p, {}).get('hero', {}).get('status', 'MISSING')
    ok = status.startswith('/cs/')
    print(f'  {p}: {repr(status)} {\"✓\" if ok else \"✗\"}')"
```

**Pass criteria:** No STATUS·v0.1.0 anywhere, brand statuses on top-level, path-only on pages. Status: [ ]

---

### Topic 8: llms.txt (`08-llms-txt.md`)

```bash
echo "=== llms.txt ===" && \
grep -c "VICTA delivers 18 distinct services" public/llms.txt           && echo "  (expect 1)" && \
grep -c "across three practice areas" public/llms.txt                   && echo "  (expect 1)" && \
echo "" && echo "All 8 industries:" && \
for ind in "E-commerce" "Výroba" "Logistika" "Profesionální služby" "Finance" "Energetika" "Zdravotnictví" "Zákaznická podpora"; do
  count=$(grep -c "$ind" public/llms.txt)
  echo "  $ind: $count"
done && \
echo "" && echo "Company data:" && \
grep -c "VICTA DIGITAL s.r.o." public/llms.txt          && echo "  (expect 2+)" && \
grep -c "28859511" public/llms.txt                       && echo "  (expect 1+)" && \
echo "" && echo "Old content removed:" && \
grep -c "Healthcare (Zdravotnictví)" public/llms.txt        && echo "  (expect 0)" && \
grep -c "across four practice" public/llms.txt              && echo "  (expect 0)"
```

**Pass criteria:** 18 services in 3 areas, all 8 industries named, company data, old refs gone. Status: [ ]

---

### Topic 9: CI Infrastructure (`09-ci-infrastructure.md`)

```bash
echo "=== CI Infrastructure ===" && \
echo "" && echo "Linter passes:" && \
pnpm lint:cs 2>&1 | tail -2 && \
echo "" && echo "ESLint root config:" && \
grep -c '"root": true' .eslintrc.json    && echo "  (expect 1)" && \
echo "" && echo "Lighthouse config exists:" && \
test -f .lighthouserc.json && echo "  ✓ exists" || echo "  ✗ MISSING" && \
echo "" && echo "Secret Scan regex:" && \
grep -c "WHITELIST.*NEXT_PUBLIC_TURNSTILE_SITE_KEY" .github/workflows/ci.yml  && echo "  (expect 1 — whitelist)" && \
grep -c '\\bNEXT_PUBLIC_\[A-Z0-9_\]' .github/workflows/ci.yml                && echo "  (expect 1 — word boundary)"
```

**Pass criteria:** Linter clean, all config fixes in place. Status: [ ]

---

## Master script — run all checks

```bash
cat docs/content-restoration/VERIFICATION.md | grep -E "^```bash" -A 100 | bash 2>&1 | tee /tmp/verify-output.txt
```

(Or copy individual check blocks.)

---

## Status table — fill in during verification

| Topic | File | Status | Notes |
|---|---|---|---|
| 1. Legal data | `01-legal-data.md` | [ ] | |
| 2. Service catalog | `02-positioning-catalog.md` | [ ] | |
| 3. Industries | `03-industries.md` | [ ] | |
| 4. Hodnoty | `04-hodnoty.md` | [ ] | |
| 5. Homepage | `05-homepage.md` | [ ] | |
| 6. Spoluprace refund | `06-spoluprace-refund.md` | [ ] | |
| 7. STATUS + CTA | `07-status-cta.md` | [ ] | |
| 8. llms.txt | `08-llms-txt.md` | [ ] | |
| 9. CI infrastructure | `09-ci-infrastructure.md` | [ ] | |

---

## Pokud něco FAIL — workflow

1. **Identifikuj topic** podle failing check
2. **Otevři příslušný .md soubor** v tomto folderu
3. **Read "Co se má změnit" + "Detailní content" sekce**
4. **Apply changes** to `content/cs/strings/common.json` / `public/llms.txt` / pages
5. **Re-run verification** for that topic
6. **Commit** s descriptive message referencing topic file

### Git reference workflow

Pokud potřebuješ exact text z originálních spawn outputs:

```bash
# Extrahovat z PR #15 commits
git show ff858d1:content/cs/strings/common.json > /tmp/legal-data-source.json
git show e5ad0e5:content/cs/strings/common.json > /tmp/positioning-source.json
git show c63afa8:public/llms.txt > /tmp/llms-source.txt
git show 12cdf02:content/cs/strings/common.json > /tmp/hodnoty-source.json
git show 21fca4e:content/cs/strings/common.json > /tmp/hero-tags-source.json
git show 4225bde:content/cs/strings/common.json > /tmp/cta-source.json

# Then diff with current
diff /tmp/positioning-source.json content/cs/strings/common.json | less
```

---

## Final verification — production matches checklist

After local content matches all topics:

1. Commit changes: `git add -A && git commit -m "fix(content): complete restoration per docs/content-restoration/"`
2. Push to main (or via PR)
3. Vercel auto-deploys
4. Open `https://victaagency.com` and visually verify

Key visual checks:
- [ ] Homepage hero displays new tags (WEBY · E-SHOPY · AI · MARKETING · SPRÁVA OR 4-tag for D-007)
- [ ] Status line shows "VICTA DIGITAL · česká digitální agentura"
- [ ] Audit tiers link to /spoluprace#audit
- [ ] /sluzby shows 18 services in 3 categories
- [ ] /odvetvi shows 8 industries
- [ ] /spoluprace has refund FAQ + tiers.note bonus mention
- [ ] /o-nas shows 4 new hodnoty
- [ ] /kontakt shows Haškova address + Babákova note
- [ ] Footer shows VICTA DIGITAL + IČO 28859511

---

**Generated:** 2026-05-26
**For:** Roman / future Claude sessions
