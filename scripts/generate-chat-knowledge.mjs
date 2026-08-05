#!/usr/bin/env node
/**
 * Chatbot knowledge digest generator (Vlna 5, dispatch brief item 2).
 *
 * Distills `content/{cs,en}/strings/common.json` — the single source of
 * truth for all site copy — into a compact plain-text digest embedded in the
 * chatbot's system prompt (`src/lib/chat/system-prompt.ts`). The digest is
 * the chatbot's ONLY source of facts: services, solutions, industries,
 * process, audit tiers + prices, contact channels, and a handful of FAQ.
 * Anything not in this digest is a question the chatbot must decline to
 * answer with specifics (vision.md §6/§8).
 *
 * Usage: `pnpm gen:chat` → (re)writes `src/lib/chat/knowledge.generated.ts`.
 * That file is a COMMITTED build artifact (not generated at deploy time) so
 * the system prompt's content is reviewable in PRs like any other copy
 * change — regenerate and commit whenever `common.json` changes in a way
 * that should be reflected in what the chatbot knows.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_FILE = join(ROOT, 'src', 'lib', 'chat', 'knowledge.generated.ts');

const CATEGORY_LABEL = {
  cs: { itDev: 'IT & VÝVOJ', aiData: 'AI & DATA', marketing: 'MARKETING & OBSAH' },
  en: { itDev: 'IT & DEVELOPMENT', aiData: 'AI & DATA', marketing: 'MARKETING & CONTENT' },
};

const SECTION_LABEL = {
  cs: {
    services: 'SLUŽBY',
    solutions: 'ŘEŠENÍ (balíčky)',
    industries: 'ODVĚTVÍ',
    process: 'PROCES',
    audit: 'AUDIT — TŘI ÚROVNĚ',
    scoping: 'BEZPLATNÁ KONZULTACE',
    contact: 'KONTAKT',
    faq: 'ČASTÉ DOTAZY (proces spolupráce)',
    cta: 'PRIMÁRNÍ CTA',
  },
  en: {
    services: 'SERVICES',
    solutions: 'SOLUTIONS (packages)',
    industries: 'INDUSTRIES',
    process: 'PROCESS',
    audit: 'AUDIT — THREE TIERS',
    scoping: 'FREE CONSULTATION',
    contact: 'CONTACT',
    faq: 'FAQ (collaboration process)',
    cta: 'PRIMARY CTA',
  },
};

function loadContent(locale) {
  const path = join(ROOT, 'content', locale, 'strings', 'common.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/** First sentence (up to the first ". ") of a longer paragraph — a compact one-liner. */
function firstSentence(text) {
  const idx = text.indexOf('. ');
  return idx === -1 ? text : `${text.slice(0, idx)}.`;
}

function buildDigest(locale, content) {
  const L = SECTION_LABEL[locale];
  const lines = [];

  lines.push(`=== VICTA — ${locale === 'cs' ? 'ZNALOSTNÍ DIGEST' : 'KNOWLEDGE DIGEST'} (${locale.toUpperCase()}) ===`);
  lines.push('');

  // Services — 18 across 3 categories.
  lines.push(`${L.services}:`);
  const categories = content.sluzby.categories;
  let serviceCount = 0;
  for (const key of Object.keys(categories)) {
    const cat = categories[key];
    lines.push(`[${CATEGORY_LABEL[locale][key] ?? cat.label}]`);
    for (const item of cat.items) {
      serviceCount += 1;
      const fit = item.fit ? item.fit.replace(/^Hodí se pro:\s*|^Fits:\s*/i, '') : '';
      lines.push(`- ${item.name}: ${firstSentence(item.desc)} ${fit ? `(${fit})` : ''}`.trim());
    }
  }
  lines.push('');

  // Solutions — 5 packages.
  lines.push(`${L.solutions}:`);
  for (const item of content.reseni.items) {
    const audience = item.audience ? item.audience.replace(/^Hodí se pro:\s*|^Fits:\s*/i, '') : '';
    lines.push(`- ${item.name}: ${firstSentence(item.body)} ${audience ? `(${audience})` : ''}`.trim());
  }
  lines.push('');

  // Industries — 8.
  lines.push(`${L.industries}:`);
  for (const item of content.odvetvi.items) {
    lines.push(`- ${item.name}: ${firstSentence(item.body)}`);
  }
  lines.push('');

  // Process — 4 steps.
  lines.push(`${L.process}:`);
  for (const step of content.oNas.sections.process.steps) {
    lines.push(`${step.num} ${step.label} — ${step.body}`);
  }
  lines.push('');

  // Audit tiers + free scoping call — the only prices the chatbot may ever quote.
  lines.push(`${L.audit}:`);
  const tiers = content.spoluprace.tiers;
  for (const tierKey of ['tier1', 'tier2', 'tier3']) {
    const t = tiers[tierKey];
    lines.push(
      `${t.tier} — ${t.name}: ${t.price} (${t.priceEur}), ${t.duration}, ${t.sessions}. ${t.ideal}`,
    );
  }
  lines.push(tiers.note);
  lines.push('');

  lines.push(`${L.scoping}:`);
  lines.push(content.spoluprace.scoping.body);
  lines.push('');

  // Contact channels.
  lines.push(`${L.contact}:`);
  const ch = content.kontakt.channels;
  lines.push(`Email: ${ch.email.value} (${ch.email.note})`);
  lines.push(`${locale === 'cs' ? 'Telefon' : 'Phone'}: ${ch.phone.value} (${ch.phone.note})`);
  lines.push(`${locale === 'cs' ? 'Adresa' : 'Address'}: ${ch.address.value} (${ch.address.note})`);
  lines.push('');

  // A handful of process FAQ — trims the 9-item list to the most broadly useful ones.
  lines.push(`${L.faq}:`);
  for (const item of content.spoluprace.faq.items.slice(0, 6)) {
    lines.push(`Q: ${item.q}`);
    lines.push(`A: ${item.a}`);
  }
  lines.push('');

  lines.push(`${L.cta}: "${content.common.ctaBand.primaryCta}"`);

  return { text: lines.join('\n'), serviceCount };
}

function buildOutput() {
  const cs = loadContent('cs');
  const en = loadContent('en');
  const csDigest = buildDigest('cs', cs);
  const enDigest = buildDigest('en', en);

  // No generation timestamp in the header (code-reviewer I-4) — a stray date
  // line would make every regeneration diff non-empty even when the digest
  // TEXT is byte-identical, which defeats `--check`'s whole purpose (a plain
  // `git diff --exit-code` / string-equality check on this file must reflect
  // real content drift, not "someone ran the generator today").
  const output = `/**
 * GENERATED FILE — do not hand-edit. Run \`pnpm gen:chat\` to regenerate
 * (scripts/generate-chat-knowledge.mjs) from content/{cs,en}/strings/common.json.
 * \`pnpm gen:chat -- --check\` fails (exit 1) if this file is stale relative
 * to that source content — wire it into CI so a common.json edit that
 * changes prices/services/contact info can't silently leave the chatbot's
 * knowledge digest out of date (vision.md §14 bod 12 forbids stale facts).
 *
 * This is the chatbot's ENTIRE factual knowledge base (dispatch brief item 2).
 * The system prompt (src/lib/chat/system-prompt.ts) instructs the model to
 * answer ONLY from this text — no numbers, prices, or promises outside it.
 *
 * CS ${csDigest.serviceCount} services / EN ${enDigest.serviceCount} services.
 */

export const CHAT_KNOWLEDGE_CS = ${JSON.stringify(csDigest.text)};

export const CHAT_KNOWLEDGE_EN = ${JSON.stringify(enDigest.text)};
`;

  return { output, csDigest, enDigest };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const { output, csDigest, enDigest } = buildOutput();

  if (checkOnly) {
    let existing = null;
    try {
      existing = readFileSync(OUT_FILE, 'utf-8');
    } catch {
      // File doesn't exist at all — definitely stale.
    }
    if (existing !== output) {
      console.error(
        `generate-chat-knowledge --check: ${OUT_FILE} is STALE relative to content/{cs,en}/strings/common.json.`,
      );
      console.error('Run `pnpm gen:chat` and commit the result.');
      process.exit(1);
    }
    console.log('generate-chat-knowledge --check: OK (digest is up to date)');
    return;
  }

  writeFileSync(OUT_FILE, output, 'utf-8');
  console.log(`generate-chat-knowledge: wrote ${OUT_FILE}`);
  console.log(`  CS digest: ${csDigest.text.length} chars, ${csDigest.serviceCount} services`);
  console.log(`  EN digest: ${enDigest.text.length} chars, ${enDigest.serviceCount} services`);
}

main();
