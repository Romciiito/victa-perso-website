'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { LucideIcon } from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };

export type KineticItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
};

type Props = {
  items: ReadonlyArray<KineticItem>;
};

export function KineticList({ items }: Props) {
  return (
    <div className="mt-14 border-t border-border">
      {items.map((item, i) => (
        <KineticRow key={item.title} {...item} index={i} />
      ))}
    </div>
  );
}

function KineticRow({
  icon: Icon,
  title,
  subtitle,
  href,
  index,
}: KineticItem & { index: number }) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      className="border-b border-border"
    >
      <Link
        href={href}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="group block"
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 py-7 md:py-9">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-tertiary md:w-12">
            0{index + 1}
          </span>

          <div className="flex items-center gap-5">
            <motion.div
              animate={{
                rotate: hover ? 90 : 0,
                color: hover ? 'var(--accent)' : 'var(--secondary)',
              }}
              transition={SPRING}
              aria-hidden
              className="hidden md:block"
            >
              <Icon size={22} strokeWidth={1.5} />
            </motion.div>

            <div>
              <motion.h3
                animate={{ x: hover ? 8 : 0 }}
                transition={SPRING}
                className="display text-[clamp(28px,3.6vw,52px)] text-ink"
              >
                {title}
              </motion.h3>
              <p className="mt-1.5 text-[14px] text-secondary md:text-[15px]">
                {subtitle}
              </p>
            </div>
          </div>

          <motion.span
            animate={{
              x: hover ? 6 : 0,
              rotate: hover ? -8 : 0,
              color: hover ? 'var(--accent)' : 'var(--tertiary)',
            }}
            transition={SPRING}
            className="inline-flex"
            aria-hidden
          >
            <ArrowUpRight size={26} strokeWidth={1.5} />
          </motion.span>
        </div>
      </Link>
    </motion.div>
  );
}
