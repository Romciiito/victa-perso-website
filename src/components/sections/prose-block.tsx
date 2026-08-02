import type React from 'react';

/* ============================================================
   prose-block.tsx · Server Component (audit P0-22)
   ----------------------------------------------------------------
   Used only by the two legal pages (cookies-body, ochrana-body),
   which are pure static content — no scroll-reveal animation, no
   client JS at all. Kept deliberately framer-motion-free so those
   pages ship zero hydration cost for this section.
   ============================================================ */

export type ProseSection = {
  heading: string;
  subheading?: string;
  body: React.ReactNode;
  bullets?: string[];
};

type Props = {
  sections: ReadonlyArray<ProseSection>;
  note?: string;
};

export function ProseBlock({ sections, note }: Props) {
  return (
    <div className="mx-auto max-w-[64ch]">
      {sections.map((sec, i) => (
        <div key={i}>
          <h2 className="display mt-16 text-[clamp(28px,3vw,40px)] text-ink">
            {sec.heading}
          </h2>
          {sec.subheading && (
            <h3 className="mt-8 font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary">
              {sec.subheading}
            </h3>
          )}
          <p className="mt-4 text-[17px] leading-[1.6] text-secondary">{sec.body}</p>
          {sec.bullets && sec.bullets.length > 0 && (
            <ul className="mt-5 space-y-2.5">
              {sec.bullets.map((b, bi) => (
                <li key={bi} className="flex items-start gap-3 text-[15px] text-secondary">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1.5 w-1.5 rotate-45 shrink-0 bg-accent"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {note && (
        <div className="mt-14 rounded-card border border-border-soft bg-surface p-8">
          <p className="text-[15px] leading-[1.6] text-secondary">{note}</p>
        </div>
      )}
    </div>
  );
}
