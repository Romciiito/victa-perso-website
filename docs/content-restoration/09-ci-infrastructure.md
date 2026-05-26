# 09 — CI Infrastructure Fixes

> **Priorita:** 🟢 NICE-TO-HAVE (not content, ale CI/build gates)
>
> **Source commits:** `c62e923` (linter), `f1385d7` + `6dc1c2b` (Secret Scan + Lighthouse)

---

## 1. Czech Typography Linter — false positive fix

**File:** `scripts/czech-typography-lint.mjs`

### Problém

Rule 3 regex byl příliš agresivní:
```js
const re = new RegExp(`(?<=[\\p{L}])\\s${p}\\s(?=[\\p{L}])`, 'gu');
```

V JS s `/u` flag `\s` matchne i NBSP (U+00A0). To znamená false positives na **správně formátovaném** obsahu kde prep je už followed by NBSP.

### Fix

```js
const re = new RegExp(`(?<=[\\p{L}])\\s${p}[ \\t](?=[\\p{L}])`, 'gu');
```

AFTER side uses `[ \t]` (regular space or tab only) instead of `\s`. Only regular space triggers violation; NBSP treated as correct.

### Cleanup zároveň
- Remove unused `mm` variable from while loop
- Remove dead `NBSP` constant
- Remove dead `isCheckable` function
- Remove unused `extname` import

### Result
385 violations → 0 violations.

---

## 2. ESLint Worktree Config

**File:** `.eslintrc.json`

### Problém

V git worktree (under parent project) ESLint hledá config upstream a najde `.eslintrc.json` v rodičovi VICTA dir. Načte oba → konflikt "duplicate @next/next plugin".

### Fix

Přidat `"root": true` jako first key:

```json
{
  "root": true,
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

To řekne ESLint "stop searching here, don't go to parent."

---

## 3. .eslint-legacy.sh

**File:** `.eslint-legacy.sh`

### Defensive update

```bash
ESLINT_USE_FLAT_CONFIG=false ./node_modules/.bin/eslint --resolve-plugins-relative-to=. --max-warnings 0 "$@"
```

`--resolve-plugins-relative-to=.` scopes plugin resolution to current worktree.

---

## 4. Secret Scan — whitelist + word boundary

**File:** `.github/workflows/ci.yml` (Secret Scan job)

### Problém

Old regex `NEXT_PUBLIC_.*(KEY|SECRET|TOKEN|PASSWORD)` byla too greedy — matchla:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (legitimně public — Turnstile site key je z definice public)
- `"NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY"` (jen text v error message)

### Fix

```yaml
- name: Scan for exposed secret patterns in NEXT_PUBLIC_ vars
  run: |
    echo "Scanning for NEXT_PUBLIC_* variables with secret suffixes..."
    # Whitelist: vars that ARE intentionally public per vendor design
    # - NEXT_PUBLIC_TURNSTILE_SITE_KEY: Cloudflare Turnstile site key
    #   is meant to be rendered in the browser (the secret_key is
    #   server-only and not in this list).
    WHITELIST="NEXT_PUBLIC_TURNSTILE_SITE_KEY"
    # Match must be a full identifier: NEXT_PUBLIC_ followed by
    # uppercase/digits/underscores ending in KEY|SECRET|TOKEN|PASSWORD
    # with a word boundary. This avoids false positives where the
    # pattern straddles a non-identifier boundary (e.g., error
    # strings concatenating two var names).
    matches=$(grep -rEo '\bNEXT_PUBLIC_[A-Z0-9_]+(KEY|SECRET|TOKEN|PASSWORD)\b' \
      --include="*.ts" \
      --include="*.tsx" \
      --include="*.js" \
      --include="*.jsx" \
      --include="*.json" \
      . 2>/dev/null | grep -vE "($WHITELIST)" || true)
    if [ -n "$matches" ]; then
      echo ""
      echo "FAIL: Secret-like NEXT_PUBLIC_ variable detected in source."
      echo "These values are exposed to the browser bundle."
      echo "Move to a server-only env var (no NEXT_PUBLIC_ prefix)."
      echo "See architecture.md §8.1 and security-model.md §4.1."
      echo ""
      echo "Matches found:"
      echo "$matches"
      exit 1
    else
      echo "PASS: No exposed secret patterns found."
    fi
```

Key changes:
- Whitelist: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Word boundary `\b` requires full identifier match
- Character class `[A-Z0-9_]+` prevents matching across whitespace

---

## 5. Lighthouse Config

**File:** `.lighthouserc.json` (NEW)

### Problém

`.github/workflows/lighthouse.yml` referencuje `.lighthouserc.json`, ale soubor neexistoval → CI fail "ENOENT: no such file."

### Fix (vytvořit soubor)

```json
{
  "ci": {
    "collect": {
      "settings": {
        "formFactor": "mobile",
        "throttling": {
          "rttMs": 150,
          "throughputKbps": 1638.4,
          "cpuSlowdownMultiplier": 4
        },
        "screenEmulation": {
          "mobile": true,
          "width": 412,
          "height": 823,
          "deviceScaleFactor": 1.75,
          "disabled": false
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.5}],
        "categories:accessibility": ["warn", {"minScore": 0.5}],
        "categories:best-practices": ["warn", {"minScore": 0.5}],
        "categories:seo": ["warn", {"minScore": 0.5}]
      }
    }
  }
}
```

**Note:** `lighthouse:no-pwa` preset RAW zahrnuje desítky individual audit assertions ("color-contrast", "errors-in-console", etc.) všechny default "error". Setting category-level na "warn" preset OVERRIDE not work. **Drop preset entirely** — assertions only on 4 category scores.

**Thresholds set to `warn` + `0.5`** for initial deploy. Once baseline established and content optimized, tighten to `error` + `0.9`.

---

## 6. NBSP Content Cleanup

Po linter fix bylo nutné aplikovat NBSP normalizaci na content. Roman to udělal v PR #15 commit `c62e923`. Pokud je current state without NBSPs:

### Python script (one-time NBSP fix)

```python
import json
import re

NBSP = ' '
PREPS = 'ksvzouiaKSVZOUIA'
PATTERN = re.compile(r'(^|[\s ' + NBSP + r'(])([' + PREPS + r'])\s+(?=\S)', re.UNICODE)

def fix_string(s):
    if not isinstance(s, str):
        return s
    prev = None
    cur = s
    while prev != cur:
        prev = cur
        cur = PATTERN.sub(lambda m: m.group(1) + m.group(2) + NBSP, cur)
    # Number + unit
    cur = re.sub(r'(\d+) (Kč|EUR|%|km|kg|MB|GB|h|min)\b', lambda m: m.group(1) + NBSP + m.group(2), cur)
    return cur

def walk(obj):
    if isinstance(obj, dict):
        return {k: walk(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [walk(v) for v in obj]
    if isinstance(obj, str):
        return fix_string(obj)
    return obj

with open('content/cs/strings/common.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('content/cs/strings/common.json', 'w', encoding='utf-8') as f:
    json.dump(walk(data), f, ensure_ascii=False, indent=2)
    f.write('\n')

print("✓ NBSP normalization done")
```

---

## Verifikace

```bash
# Linter passes
pnpm lint:cs
# Expected: czech-typography-lint: OK (1 files scanned)

# Secret Scan passes (CI)
grep -rEo '\bNEXT_PUBLIC_[A-Z0-9_]+(KEY|SECRET|TOKEN|PASSWORD)\b' \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" \
  . 2>/dev/null | grep -vE "(NEXT_PUBLIC_TURNSTILE_SITE_KEY)" || echo "PASS"
# Expected: PASS

# ESLint root config
cat .eslintrc.json | grep -c '"root": true'   # expect 1

# Lighthouse config exists
test -f .lighthouserc.json && echo "exists" || echo "MISSING"
```
