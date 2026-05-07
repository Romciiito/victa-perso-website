'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };

type Props = {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
  compact?: boolean;
};

export function MagneticCta({ children, primary, compact, href }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
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

  const padding = compact ? 'px-5 py-2.5 text-[13.5px]' : 'px-7 py-3.5 text-[14.5px]';

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
    >
      <Link
        ref={ref}
        href={href}
        className={`tactile relative inline-flex items-center gap-2.5 rounded-full border ${padding} ${
          primary
            ? 'border-accent bg-accent text-bg'
            : 'border-border bg-transparent text-ink hover:border-ink'
        }`}
      >
        <span className="relative z-10">{children}</span>
        <motion.span
          animate={{ x: hover ? 3 : 0, rotate: hover ? -8 : 0 }}
          transition={SPRING}
          className="relative z-10 inline-flex"
          aria-hidden
        >
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </motion.span>
      </Link>
    </motion.div>
  );
}
