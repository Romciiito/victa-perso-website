'use client';

import { useRef } from 'react';
import { m, type Variants } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { LucideIcon } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export type BentoItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
  number: string;
  span: 4 | 5 | 7 | 8 | 12;
  prominent?: boolean;
  compact?: boolean;
  accent?: boolean;
};

type Props = { items: ReadonlyArray<BentoItem> };

export function BentoGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
      {items.map((item) => (
        <BentoCard key={item.title} {...item} />
      ))}
    </div>
  );
}

function BentoCard({
  icon: Icon,
  title,
  subtitle,
  href,
  number,
  span,
  prominent,
  compact,
  accent,
}: BentoItem) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current?.style.setProperty('--mx', `${x}%`);
    ref.current?.style.setProperty('--my', `${y}%`);
  }

  const padding = prominent ? 'p-10 md:p-14' : compact ? 'p-7 md:p-8' : 'p-8 md:p-10';
  const titleSize = prominent ? 'text-[clamp(36px,4.4vw,64px)]' : 'text-[clamp(24px,2.6vw,38px)]';
  const minH = prominent ? 'min-h-[420px]' : 'min-h-[260px]';
  const colClass: Record<typeof span, string> = {
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    7: 'md:col-span-7',
    8: 'md:col-span-8',
    12: 'md:col-span-12',
  };

  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={SPRING}
      variants={REVEAL}
      className={colClass[span]}
    >
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        className={`spotlight tactile relative flex flex-col justify-between overflow-hidden rounded-card border border-border bg-surface ${padding} ${minH} ${
          accent ? 'bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--accent-tint)]' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-6">
          <div
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-ink"
            aria-hidden
          >
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-tertiary">
            {number}
          </span>
        </div>
        <div className="mt-12">
          <h3 className={`display ${titleSize} text-ink`}>{title}</h3>
          <p className="mt-3 max-w-[42ch] text-[14.5px] leading-[1.55] text-secondary">
            {subtitle}
          </p>
        </div>
      </Link>
    </m.div>
  );
}
