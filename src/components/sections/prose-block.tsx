'use client';

import { motion, type Variants } from 'framer-motion';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type ProseSection = {
  heading: string;
  subheading?: string;
  body: string;
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
        <motion.div
          key={i}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-5%' }}
          transition={{ ...SPRING, delay: i * 0.04 }}
          variants={REVEAL}
        >
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
        </motion.div>
      ))}

      {note && (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-5%' }}
          transition={SPRING}
          variants={REVEAL}
          className="mt-14 rounded-card border border-border-soft bg-surface p-8"
        >
          <p className="text-[15px] leading-[1.6] text-secondary">{note}</p>
        </motion.div>
      )}
    </div>
  );
}
