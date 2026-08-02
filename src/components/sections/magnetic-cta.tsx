'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };

type CommonProps = {
  children: React.ReactNode;
  primary?: boolean;
  compact?: boolean;
  /** 'hero' — ~1.4× default size. Reserve exclusively for the primary booking CTA in hero sections. */
  size?: 'hero';
};

/* Two modes:
   1. Link mode  — pass `href`. Renders an internal locale-aware Link.
   2. Action mode — pass `onClick`. Renders a <button> that fires the handler
      (e.g. open Cal.com modal). No navigation, no href.
   Discriminated union ensures the caller picks exactly one. */
type Props = CommonProps & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void | Promise<void> }
);

export function MagneticCta(props: Props) {
  const { children, primary, compact, size } = props;
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const [hover, setHover] = useState(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * 0.32);
    y.set((e.clientY - r.top - r.height / 2) * 0.32);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
    setHover(false);
  }

  const padding =
    size === 'hero'
      ? 'px-10 py-5 text-[20px]'
      : compact
        ? 'px-5 py-2.5 text-[13.5px]'
        : 'px-7 py-3.5 text-[14.5px]';
  const gap = size === 'hero' ? 'gap-3.5' : 'gap-2.5';
  const baseClass = `tactile relative inline-flex items-center ${gap} rounded-full border ${padding} ${
    primary
      ? 'border-accent bg-accent text-bg'
      : 'border-border bg-transparent text-ink hover:border-ink'
  }`;

  const arrowSize = size === 'hero' ? 20 : 16;
  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <motion.span
        animate={{ x: hover ? 3 : 0, rotate: hover ? -8 : 0 }}
        transition={SPRING}
        className="relative z-10 inline-flex"
        aria-hidden
      >
        <ArrowUpRight size={arrowSize} strokeWidth={1.75} />
      </motion.span>
    </>
  );

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
    >
      {'onClick' in props && props.onClick ? (
        <button
          ref={ref as React.RefObject<HTMLButtonElement>}
          type="button"
          onClick={() => {
            void props.onClick();
          }}
          className={baseClass}
        >
          {inner}
        </button>
      ) : (
        <Link
          ref={ref as React.RefObject<HTMLAnchorElement>}
          href={props.href!}
          className={baseClass}
        >
          {inner}
        </Link>
      )}
    </motion.div>
  );
}
