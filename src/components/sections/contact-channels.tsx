'use client';

import { motion, type Variants } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type ChannelItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
};

type Props = {
  channels: ReadonlyArray<ChannelItem>;
};

export function ContactChannels({ channels }: Props) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={SPRING}
      variants={REVEAL}
      className="divide-y divide-border border-y border-border"
    >
      {channels.map((ch) => (
        <ChannelRow key={ch.label} {...ch} />
      ))}
    </motion.ul>
  );
}

function ChannelRow({ icon: Icon, label, value, href }: ChannelItem) {
  const inner = (
    <div className="flex items-center gap-5 py-5">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-ink"
        aria-hidden
      >
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
          {label}
        </span>
        <span className="truncate text-[15px] text-ink">{value}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          className="block transition-colors hover:bg-surface"
        >
          {inner}
        </a>
      </li>
    );
  }

  return <li>{inner}</li>;
}
