import { ImageResponse } from 'next/og';

/* ============================================================
   apple-icon.tsx (audit P2-06) — iOS home-screen icon via Next.js
   file convention. Same rationale/palette as icon.tsx.
   ============================================================ */

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const ACCENT = '#5b8cff';
const BG = '#0b0b0d';

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 108,
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
