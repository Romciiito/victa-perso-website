'use client';

import { m, type Variants } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type ValueItem = {
  icon?: LucideIcon;
  label: string;
  body: string;
};

type Props = {
  items: ReadonlyArray<ValueItem>;
  /** Počet sloupců na desktopu — gap-px mřížka jinak vykreslí prázdnou buňku, když počet položek nesedí. */
  columns?: 3 | 4;
};

export function ValuesGrid({ items, columns = 4 }: Props) {
  const gridCols =
    columns === 3
      ? 'mt-14 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3'
      : 'mt-14 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={gridCols}>
      {items.map((item, i) => (
        <ValueCell key={item.label} {...item} index={i} />
      ))}
    </div>
  );
}

function ValueCell({
  icon: Icon,
  label,
  body,
  index,
}: ValueItem & { index: number }) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.07 }}
      variants={REVEAL}
      className="flex flex-col gap-5 bg-surface p-8 md:p-10"
    >
      {Icon && (
        <div
          className="grid h-10 w-10 place-items-center rounded-md border border-border text-ink"
          aria-hidden
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>
      )}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          {label}
        </p>
        <p className="mt-3 text-[15px] leading-[1.6] text-secondary">{body}</p>
      </div>
    </m.div>
  );
}
