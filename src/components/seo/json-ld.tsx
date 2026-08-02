import type { JsonLdNode, JsonLdValue } from '@/lib/schema-types';

const ROMAN_BLOCKER_MARKER = 'ROMAN-BLOCKER';

/**
 * Recursively drops any field whose value contains the ROMAN-BLOCKER
 * placeholder marker (see config/site.ts `contact.dic` / `contact.spisovaZnacka`).
 * Roman's outstanding legal-data blockers must never reach production
 * structured data (audit P0-23, launch-gate §14 bullets 3+9) — the field
 * reappears on its own, with no code change here, once the real value
 * replaces the placeholder in site.ts.
 */
function sanitizeValue(value: JsonLdValue): JsonLdValue | undefined {
  if (typeof value === 'string') {
    return value.includes(ROMAN_BLOCKER_MARKER) ? undefined : value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item): item is JsonLdValue => item !== undefined);
  }
  if (value !== null && typeof value === 'object') {
    const out: { [key: string]: JsonLdValue | undefined } = {};
    for (const [key, v] of Object.entries(value)) {
      if (v === undefined) continue;
      const cleaned = sanitizeValue(v);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

function sanitizeNode(node: JsonLdNode): JsonLdNode {
  return (sanitizeValue(node) as JsonLdNode) ?? node;
}

/**
 * Server Component that renders one or more JSON-LD nodes as `<script type="application/ld+json">`.
 * Use within page-level Server Components (architecture.md §10.1, AR-07).
 *
 * Each script tag holds one schema document. Multiple `<JsonLd />` instances on the same page
 * are valid per Schema.org and Google's Structured Data guidelines.
 *
 * Every node passes through the ROMAN-BLOCKER guard above before serialization — this is the
 * single funnel all structured data goes through on its way to the DOM, so builders in
 * `lib/schema.ts` don't each need their own filter.
 */
export function JsonLd({ data }: { data: JsonLdNode | readonly JsonLdNode[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sanitizeNode(node)) }}
        />
      ))}
    </>
  );
}
