import { ImageResponse } from 'next/og';

/* ============================================================
   icon.tsx (audit P2-06) — favicon via Next.js file convention.
   Colors hardcoded on purpose — generated raster image, not a DOM
   component (see opengraph-image.tsx for the same note). Values
   copied from tokens/dark.css (D-008 dark-only palette).
   ============================================================ */

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

const ACCENT = '#5b8cff';
const BG = '#0b0b0d';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: BG,
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            fontWeight: 700,
            color: ACCENT,
            fontFamily: 'sans-serif',
          }}
        >
          V
        </div>
      </div>
    ),
    { ...size },
  );
}
