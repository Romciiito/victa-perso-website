#!/usr/bin/env node
/**
 * Czech typography linter (AR-08, REQ-NF-036).
 *
 * Build-time gate that fails CI if any `.cs.mdx` or `content/cs/**\/*.json` file
 * contains Czech-typography violations. Reads files from the working tree, reports
 * with `file:line: rule: <hint>` format, exits 1 on any violation.
 *
 * Rules:
 *   1. ASCII straight quotes used around Czech text (should be „..." or ‚...').
 *      Heuristic: pair of `"..."` containing only Czech-relevant chars.
 *   2. Bare hyphen used as em-dash (` - ` between words → should be ` — `).
 *   3. Single-letter Czech preposition/conjunction at end of line followed by
 *      regular space, not nbsp (`k`, `s`, `v`, `z`, `o`, `u`, `i`, `a`).
 *   4. Number + unit lacks nbsp (` Kč`, ` %`, ` km`, ` h`, ` min`).
 *
 * Usage: `pnpm lint:cs`  → exit 0 on clean, exit 1 + report on violations.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CS_CONTENT_DIR = join(ROOT, 'content', 'cs');

/** Walk directory recursively, returning matching file paths. */
function walk(dir, predicate) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
      out.push(...walk(full, predicate));
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function isCheckable(p) {
  return p.endsWith('.cs.mdx') || p.endsWith('.mdx') === false && /content[\\/](cs)[\\/].+\.json$/.test(p);
}

const SINGLE_LETTER_PREPS = ['k', 's', 'v', 'z', 'o', 'u', 'i', 'a', 'K', 'S', 'V', 'Z', 'O', 'U', 'I', 'A'];

const NBSP = ' '; // non-breaking space

const violations = [];

function lintLine(file, lineIdx, line) {
  const ln = lineIdx + 1;

  // Rule 1: ASCII double quotes around at least 2 chars (likely Czech text).
  // Skip JSON files for this check — JSON keys/strings legitimately use ".
  if (file.endsWith('.cs.mdx') || file.endsWith('.mdx')) {
    const m = /"([^"\n]{2,})"/g;
    let mm;
    while ((mm = m.exec(line)) !== null) {
      // Allow technical content — code blocks, URLs, file paths
      const ctx = line.slice(Math.max(0, mm.index - 20), mm.index);
      if (/`|http|\/[a-z]/.test(ctx)) continue;
      violations.push({
        file,
        line: ln,
        rule: 'czech-quotes',
        hint: `Použijte „${mm[1]}" místo "${mm[1]}" (Czech quotation marks)`,
      });
    }
  }

  // Rule 2: ` - ` between words → should be ` — `. Skip code blocks and bullets.
  if (!/^\s*[-*]\s/.test(line)) {
    const m = / +- +/g;
    let mm;
    while ((mm = m.exec(line)) !== null) {
      // Allow if inside `code` or after `:` (e.g., "see: - foo")
      const before = line.slice(Math.max(0, mm.index - 1), mm.index);
      if (before === '`') continue;
      violations.push({
        file,
        line: ln,
        rule: 'em-dash',
        hint: 'Použijte em-dash s mezerami " — " místo " - "',
      });
    }
  }

  // Rule 3: single-letter preposition followed by regular space (not nbsp).
  // Match in the middle of text: a Czech word, space, single letter k/s/v/z/o/u/i/a, space.
  for (const p of SINGLE_LETTER_PREPS) {
    // Pattern: <word-char> SPACE prep SPACE <word-char>
    // Use unicode word chars for Czech diacritics.
    const re = new RegExp(`(?<=[\\p{L}])\\s${p}\\s(?=[\\p{L}])`, 'gu');
    let mm;
    while ((mm = re.exec(line)) !== null) {
      violations.push({
        file,
        line: ln,
        rule: 'nbsp-after-prep',
        hint: `Po jednoznakové předložce/spojce "${p}" použijte nbsp (\\u00A0)`,
      });
    }
  }

  // Rule 4: number + unit without nbsp. Allow regular space inside Czech-formatted numbers
  // (`2 500`) but flag `2 Kč`, `5 %`, `10 km` etc. — match `<digit> <unit>`.
  // Czech numbers use space-as-thousands-separator, so the rule fires only when the
  // last group before the unit is the numeric literal.
  const unitRe = /(\d+(?: \d{3})*) (Kč|EUR|€|%|km|h|min|m²|kg|MB|GB)\b/g;
  let umm;
  while ((umm = unitRe.exec(line)) !== null) {
    violations.push({
      file,
      line: ln,
      rule: 'nbsp-before-unit',
      hint: `Před jednotkou "${umm[2]}" použijte nbsp (\\u00A0)`,
    });
  }
}

function lintFile(file) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  const lines = content.split('\n');
  lines.forEach((line, idx) => lintLine(file, idx, line));
}

function main() {
  const targets = [
    ...walk(CS_CONTENT_DIR, (p) => p.endsWith('.json') || p.endsWith('.mdx') || p.endsWith('.cs.mdx')),
  ];
  for (const f of targets) lintFile(f);

  if (violations.length === 0) {
    console.log(`czech-typography-lint: OK (${targets.length} files scanned)`);
    process.exit(0);
  }

  console.error(`czech-typography-lint: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.rule}: ${v.hint}`);
  }
  process.exit(1);
}

main();
