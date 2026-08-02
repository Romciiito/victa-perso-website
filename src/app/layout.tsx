import type { Metadata } from 'next';
import { site } from '@/config/site';

/**
 * Root layout is a plain passthrough — the real <html>/<body> shell comes
 * from [locale]/layout.tsx. `metadataBase` still needs to be set here too:
 * it's what resolves the relative image URLs from the root-level file-based
 * icon/opengraph-image conventions (src/app/icon.tsx, opengraph-image.tsx,
 * apple-icon.tsx) and the root not-found.tsx, none of which sit under
 * [locale] and so don't inherit its metadataBase (audit P1-05/P2-06 wave —
 * without this Next.js warns and falls back to localhost:3000 at build time).
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
