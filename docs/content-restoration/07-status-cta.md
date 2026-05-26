# 07 — STATUS Badge Cleanup + CTA Verb Updates

> **Priorita:** 🟡 HIGH (trust signals)
>
> **Source commits:** `4225bde` (STATUS + Rezervovat verb + audit CTAs)
>
> **File:** `content/cs/strings/common.json` + `src/app/[locale]/page.tsx`

---

## 1. STATUS · v 0.1.0 badge cleanup (10 míst)

### Problém

Před cleanup web zobrazoval na **každé stránce** status badge ve formátu:
```
STATUS · v 0.1.0 · published 2026-05-07 · region eu-central-1
STATUS · v 0.1.0 · /cs/spoluprace
STATUS · v 0.1.0 · region eu-central-1
```

To je **internal dev metadata** — pro B2B prospekta signál "beta/unfinished product". Trust killer.

### Fix — 10 specifických změn v common.json

| # | Key | Před | Po |
|---|---|---|---|
| 1 | `common.status` | "STATUS · v 0.1.0 · published 2026-05-07 · region eu-central-1" | **"VICTA DIGITAL · Praha + Hradec Králové"** |
| 2 | `footer.status` | "STATUS · v 0.1.0 · region eu-central-1" | **"VICTA DIGITAL s.r.o. · 2026"** |
| 3 | `home.hero.status` | "STATUS · v 0.1.0 · published 2026-05-07 · region eu-central-1" | **"VICTA DIGITAL · česká digitální agentura"** |
| 4 | `spoluprace.hero.status` | "STATUS · v 0.1.0 · /cs/spoluprace" | **"/cs/spoluprace"** |
| 5 | `sluzby.hero.status` | "STATUS · v 0.1.0 · /cs/sluzby" | **"/cs/sluzby"** |
| 6 | `reseni.hero.status` | "STATUS · v 0.1.0 · /cs/reseni" | **"/cs/reseni"** |
| 7 | `odvetvi.hero.status` | "STATUS · v 0.1.0 · /cs/odvetvi" | **"/cs/odvetvi"** |
| 8 | `oNas.hero.status` | "STATUS · v 0.1.0 · /cs/o-nas" | **"/cs/o-nas"** |
| 9 | `kontakt.hero.status` | "STATUS · v 0.1.0 · /cs/kontakt" | **"/cs/kontakt"** |
| 10 | `blog.hero.status` | "STATUS · v 0.1.0 · /cs/blog" | **"/cs/blog"** |

### Komponenta StatusLine — zachovat

`src/components/status-line.tsx` je locked signature design (green dot + text in Geist Mono 12px). Funkčnost zachovat, jen content změnit. **NESTAHOVAT komponentu.**

Vykreslí: `🟢 VICTA DIGITAL · česká digitální agentura` místo `🟢 STATUS · v 0.1.0 ...`.

---

## 2. "Spustit audit" → "Rezervovat audit" (Bod 19)

### Problém

"Spustit" implikuje **immediate digital self-service** (jako "Start free trial"). Audit reálně vyžaduje booking → faktura → bankovní převod → kickoff (1–3 týdny). Expectation mismatch.

### Fix — 2 míst v common.json

| Key | Před | Po |
|---|---|---|
| `home.hero.ctaPrimary` | "Spustit audit →" | **"Rezervovat audit →"** |
| `home.audit.tier1.cta` | "Spustit audit →" | **"Rezervovat audit →"** |

### Možná související místa

- `spoluprace.tiers.tier1.cta` — "Rezervovat Tier 1 →" (už správné, zachovat)
- `home.audit.tier2.cta`, `tier3.cta` — "Domluvit audit →" / "Rezervovat session →" (správné)

---

## 3. Audit tier CTA hrefs (Bod 5)

### Problém

V `src/app/[locale]/page.tsx` 3 AuditCard komponenty měly `ctaHref="/kontakt"`. Click vedl na statickou kontaktní stránku, ne na booking/tier section.

### Fix — 3 míst v page.tsx

Change 3 occurrences (Tier 1, Tier 2, Tier 3):

```diff
- ctaHref="/kontakt"
+ ctaHref="/spoluprace#audit"
```

**Note:** Hero ghost CTA "Domluvit konzultaci" může zůstat na `/kontakt` — je legitimní (consultation goes via contact).
**Note:** Scoping link v audit section může taky zůstat na `/kontakt`.

---

## Verifikace

```bash
# STATUS badge cleanup — none should remain with old prefix
grep -c "STATUS · v 0.1.0" content/cs/strings/common.json  # expect 0

# New brand signature in top-level statuses
grep -c "VICTA DIGITAL · česká digitální agentura" content/cs/strings/common.json  # expect 1
grep -c "VICTA DIGITAL s.r.o. · 2026" content/cs/strings/common.json               # expect 1

# Page-level statuses as URL paths
python3 -c "
import json
d = json.load(open('content/cs/strings/common.json'))
pages = ['spoluprace', 'sluzby', 'reseni', 'odvetvi', 'oNas', 'kontakt', 'blog']
for p in pages:
    status = d.get(p, {}).get('hero', {}).get('status', 'MISSING')
    is_path = status.startswith('/cs/')
    print(f'  {p}: {repr(status)} {\"✓\" if is_path else \"✗\"}')"

# Rezervovat verb
grep -c "Rezervovat audit →" content/cs/strings/common.json   # expect 2
grep -c "Spustit audit →" content/cs/strings/common.json      # expect 0

# Audit CTA hrefs in page.tsx
grep -c 'ctaHref="/spoluprace#audit"' src/app/\[locale\]/page.tsx   # expect 3
grep -c 'ctaHref="/kontakt"' src/app/\[locale\]/page.tsx            # expect 0-2 (only legitimate non-audit CTAs)
```
