'use client';

import { useEffect, useRef } from 'react';
import { m } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { LucideIcon } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };

export type ScrollerItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
};

type Props = {
  items: ReadonlyArray<ScrollerItem>;
};

export function HorizontalScroller({ items }: Props) {
  return (
    <div className="mt-14 overflow-x-auto px-6 pb-6 md:px-10">
      <div className="flex w-max gap-5">
        {items.map((item, i) => (
          <ScrollerCard key={item.title} {...item} index={i} total={items.length} />
        ))}
        <div aria-hidden className="w-6 shrink-0" />
      </div>
    </div>
  );
}

function ScrollerCard({
  icon: Icon,
  title,
  subtitle,
  href,
  index,
  total,
}: ScrollerItem & { index: number; total: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  // INP fix (audit P1-16): cache the bounding rect on mouseenter instead of
  // calling getBoundingClientRect() on every mousemove, and coalesce the
  // custom-property writes to one per animation frame.
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  function onEnter() {
    rectRef.current = ref.current?.getBoundingClientRect() ?? null;
  }

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    pointerRef.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const r = rectRef.current;
      if (!r) return;
      const { x: clientX, y: clientY } = pointerRef.current;
      const x = ((clientX - r.left) / r.width) * 100;
      const y = ((clientY - r.top) / r.height) * 100;
      ref.current?.style.setProperty('--mx', `${x}%`);
      ref.current?.style.setProperty('--my', `${y}%`);
    });
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ ...SPRING, delay: index * 0.05 }}
    >
      <Link
        ref={ref}
        href={href}
        onMouseEnter={onEnter}
        onMouseMove={onMove}
        className="spotlight tactile relative flex h-[340px] w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-card border border-border bg-surface p-8 md:h-[380px] md:w-[360px]"
      >
        <div className="flex items-center justify-between">
          <div
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-ink"
          >
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-tertiary">
            0{index + 1} / 0{total}
          </span>
        </div>

        <div>
          <h3 className="display text-[clamp(24px,2.4vw,32px)] text-ink">{title}</h3>
          <p className="mt-3 text-[14.5px] leading-[1.55] text-secondary">{subtitle}</p>
        </div>
      </Link>
    </m.div>
  );
}
