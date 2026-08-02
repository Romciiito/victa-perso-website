'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

/* ============================================================
   motion-provider.tsx (audit P1-15)
   ----------------------------------------------------------------
   Root layout is a Server Component, so LazyMotion can't be set up
   there directly — this tiny client wrapper hosts it instead.
   `domAnimation` covers everything the site currently animates with
   (initial/animate/exit reveals, whileInView, hover/tap) without the
   drag/layout feature set, which nothing here uses.

   Components that want the lazy-loaded bundle must import `m` (not
   `motion`) from framer-motion — converted so far: nav.tsx,
   magnetic-cta.tsx, page-hero-client.tsx, values-grid.tsx,
   section-header.tsx. Files still using `motion.*` keep working
   unaffected (not in strict mode) but don't get the bundle-size
   benefit until converted.
   ============================================================ */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
