#!/usr/bin/env node
/**
 * i18n parity gate (gate Vlna 2b-EN, výhrada 2): CS a EN messages musí mít
 * identickou množinu leaf klíčů — jinak EN tiše rozjede při další obsahové
 * vlně (přesně to se stalo mezi 5/2026 a 7/2026: EN kleslo na 70 z 253 klíčů).
 * Spouští se v CI vedle lint:cs; nenulový exit blokuje merge.
 */
import { readFileSync } from 'node:fs';

const load = (p) => JSON.parse(readFileSync(p, 'utf-8'));

function leaves(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') out.push(...leaves(v, key));
    else out.push(key);
  }
  return out;
}

const cs = new Set(leaves(load('content/cs/strings/common.json')));
const en = new Set(leaves(load('content/en/strings/common.json')));

const missingInEn = [...cs].filter((k) => !en.has(k));
const missingInCs = [...en].filter((k) => !cs.has(k));

console.log(`i18n-parity: CS ${cs.size} / EN ${en.size} leaf keys`);
if (missingInEn.length || missingInCs.length) {
  if (missingInEn.length) {
    console.error(`\nChybí v EN (${missingInEn.length}):`);
    for (const k of missingInEn.slice(0, 50)) console.error(`  - ${k}`);
    if (missingInEn.length > 50) console.error(`  … a dalších ${missingInEn.length - 50}`);
  }
  if (missingInCs.length) {
    console.error(`\nChybí v CS (${missingInCs.length}):`);
    for (const k of missingInCs.slice(0, 50)) console.error(`  - ${k}`);
    if (missingInCs.length > 50) console.error(`  … a dalších ${missingInCs.length - 50}`);
  }
  process.exit(1);
}
console.log('i18n-parity: OK');
