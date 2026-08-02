# Content Restoration Checklist — VICTA Audit Session 2026-05-23..25

> **Účel:** Tento folder obsahuje kompletní soupis content editů z auditu webu provedeného během 23.–25. 5. 2026. Slouží jako:
> 1. **Checklist pro verifikaci** — co reálně dorazilo na produkci po revert/merge cascade (PR #15 → PR #30 → PR #31)
> 2. **Reference pro fill-in v nové session** — když cokoliv chybí, otevři příslušný soubor a doplň
> 3. **Audit trail** — co se rozhodlo, jakým způsobem, proč

---

## Kontext

V průběhu sezení 23.–25. 5. byl proveden komplexní content audit + rewrite. Hlavní změny prošly přes:
- **PR #15** (`claude/bold-shirley-56cf70 → main`) — full positioning rewrite, deployed
- **PR #30** (`revert/d008-to-d007-pre-may7 → main` via `strategy=ours`) — revert design D-008 → D-007, **MOHL DROPNOUT content updates**
- **PR #31** (dependabot prod deps) — broke main CI, production stays on PR #30 deploy

Roman commit `d1d6bce feat(content): restore Czech content edits from 2026-05-23..25 (a670929)` značí, že **content byl částečně obnoven** z commitu `a670929` (design-pr6d-industries-content). Tento checklist umožňuje verifikovat, jestli vše dorazilo.

---

## Struktura

| Soubor | Obsah | Priorita |
|---|---|---|
| `01-legal-data.md` | VICTA DIGITAL casing, IČO, sídlo, korespondenční adresa | 🔴 Critical (legal compliance) |
| `02-positioning-catalog.md` | "Tři kompetence" positioning + 18 služeb | 🔴 Critical (whole content positioning) |
| `03-industries.md` | 8 odvětví (5 refresh + 3 nové) | 🔴 Critical |
| `04-hodnoty.md` | 4 nové hodnoty na /o-nas | 🟡 High |
| `05-homepage.md` | Hero, tags, 3 offerings sekce, audit CTAs | 🔴 Critical |
| `06-spoluprace-refund.md` | Audit refund model + nová FAQ | 🟡 High |
| `07-status-cta.md` | STATUS badge cleanup (10 míst) + "Rezervovat" verb | 🟡 High |
| `08-llms-txt.md` | Kompletní llms.txt content | 🟡 High (AEO) |
| `09-ci-infrastructure.md` | Linter fix, ESLint config, Lighthouse, Secret Scan | 🟢 Nice-to-have |
| `VERIFICATION.md` | Master checklist + verifikační grep příkazy | 🔴 Run first |

---

## Jak používat

### Pro verifikaci současného stavu (recommended workflow)

1. Otevři `VERIFICATION.md`
2. Spusť verifikační grep příkazy
3. Pokud něco chybí → otevři příslušný topic file pro detail co doplnit
4. Doplň → re-verify

### Pro novou Claude session

Referencuj tento folder ve své první zprávě:

```
Otevři docs/content-restoration/ a postupně podle VERIFICATION.md ověř, 
že všechny změny ze sezení 23.–25. 5. jsou na současném main. Pokud něco 
chybí, doplň podle příslušného topic souboru.
```

Claude pak může:
1. Číst soubory v tomto folderu
2. Porovnat s `content/cs/strings/common.json`, `public/llms.txt`, page komponentami
3. Doplnit chybějící

---

## Git history reference (pokud chceš originální spawn outputs)

Hlavní commits, kde byly content updates uloženy (jsou v git history i po revertu):

| Commit | Co obsahuje |
|---|---|
| `ff858d1` | Legal data (IČO 28859511, sídlo, korespondenční) |
| `e5ad0e5` | Full positioning rewrite + 18 služeb + 8 industries (massive) |
| `c63afa8` | llms.txt sync |
| `4225bde` | Audit CTAs + STATUS badge cleanup + "Rezervovat" verb |
| `21fca4e` | Hero tags row redesign (WEBY · E-SHOPY · AI · MARKETING · SPRÁVA) |
| `12cdf02` | Hodnoty rewrite + audit refund model FAQ |
| `688b2cc` | Mega-menu data sync (offerings-data.ts) |
| `c62e923` | Czech typography linter fix + content NBSP cleanup |

**Příklad — extrahovat originální `common.json` z PR #15 commit:**
```bash
git show e5ad0e5:content/cs/strings/common.json > /tmp/original.json
diff /tmp/original.json content/cs/strings/common.json
```

---

## Status legend

- ✅ Verified present in current state
- ❌ Missing from current state — doplnit
- ⚠️ Partially present — needs adjustment
- 🤔 Unknown / needs check

Roman vyplní statuses během verifikace.

---

**Generated:** 2026-05-26
**Session worktree:** `claude/bold-shirley-56cf70` (audit + restoration session)
**Production at write time:** D-007 design + partial content restoration (commit `d1d6bce`)
