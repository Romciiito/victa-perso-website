import type { JsonLdNode } from '@/lib/schema-types';

/**
 * Server Component that renders one or more JSON-LD nodes as `<script type="application/ld+json">`.
 * Use within page-level Server Components (architecture.md §10.1, AR-07).
 *
 * Each script tag holds one schema document. Multiple `<JsonLd />` instances on the same page
 * are valid per Schema.org and Google's Structured Data guidelines.
 */
export function JsonLd({ data }: { data: JsonLdNode | readonly JsonLdNode[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
