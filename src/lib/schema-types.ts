/**
 * JSON-LD node shape — narrow enough for type safety, loose enough that schema builders
 * don't need to import all of `schema-dts`. Each builder returns a fully-formed node with
 * `@context` and `@type`; consumers spread these into a `<script type="application/ld+json">`.
 */
export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdNode
  | readonly JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

export type JsonLdNode = {
  '@context'?: string;
  '@type': string;
  [key: string]: JsonLdValue | undefined;
};
