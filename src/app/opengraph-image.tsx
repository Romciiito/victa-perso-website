import { ImageResponse } from 'next/og';

/* ============================================================
   opengraph-image.tsx (audit P1-03)
   ----------------------------------------------------------------
   Root-level file convention — Next.js auto-injects the resolved
   image URL into `openGraph.images` / `twitter.images` for every
   route that doesn't define its own opengraph-image (i.e. the whole
   site inherits this one). No manual `images` field is needed in
   generateMetadata anywhere.

   Colors are hardcoded here on purpose — this is a generated raster
   image (Satori/ImageResponse), not a DOM component, so the
   "no hardcoded hex, always var(--color-*)" rule doesn't apply
   (CSS custom properties don't exist in this render context). Values
   copied from tokens/dark.css (D-008 dark-only palette).

   Tagline text reuses the already-approved sitewide title fragment
   from content/cs/strings/common.json `site.title` (not new copy —
   Wave 3B must not introduce unreviewed marketing claims, see P0-12).
   ============================================================ */

export const alt = 'VICTA — aplikace, AI a systémy pro růst firem';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#0b0b0d';
const INK = '#f4f4f5';
const SECONDARY = '#a1a1aa';
const ACCENT = '#5b8cff';
const BORDER = '#27272d';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: BG,
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              backgroundColor: ACCENT,
              transform: 'rotate(45deg)',
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: INK,
              display: 'flex',
            }}
          >
            VICTA
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            color: INK,
            maxWidth: 920,
          }}
        >
          Aplikace, AI a systémy pro růst firem.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 32,
          }}
        >
          <div style={{ display: 'flex', fontSize: 22, color: SECONDARY }}>
            victaagency.com
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: SECONDARY }}>
            Hradec Králové
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
