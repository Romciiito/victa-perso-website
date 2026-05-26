'use client';

import { motion, type Variants } from 'framer-motion';
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
};

export function ValuesGrid({ items }: Props) {
  return (
    <div className="mt-14 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
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
    <motion.div
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
    </motion.div>
  );
}
