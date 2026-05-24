import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

type Variant = 'primary' | 'ghost';
type Size = 'md' | 'lg';

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Show Button-in-Button arrow (primary variant only). Default true for primary. */
  showArrow?: boolean;
  className?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
  external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | 'href'>;

type NativeButtonProps = CommonProps & {
  href?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

type Props = LinkButtonProps | NativeButtonProps;

/**
 * Button — primary CTA pattern from soft-skill §4.B.
 * Primary: solid pill with Button-in-Button trailing arrow circle.
 * Ghost: glass pill with backdrop-blur.
 */
export function Button(props: Props) {
  const variant: Variant = props.variant ?? 'primary';
  const size: Size = props.size ?? 'md';
  const showArrow: boolean = props.showArrow ?? variant === 'primary';
  const className: string = props.className ?? '';

  const sizePadPrimary = size === 'lg' ? 'pl-7 pr-2.5 py-2.5' : 'pl-[22px] pr-2 py-2';
  const sizePadGhost = size === 'lg' ? 'px-7 py-4' : 'px-5 py-4';

  const baseCls =
    'inline-flex items-center gap-3 rounded-full font-medium transition-transform duration-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

  const variantCls: Record<Variant, string> = {
    primary: `${baseCls} ${sizePadPrimary} text-[15px]`,
    ghost: `${baseCls} ${sizePadGhost} text-[15px] backdrop-blur-[12px]`,
  };

  const variantStyle: Record<Variant, React.CSSProperties> = {
    primary: {
      background: 'var(--ink)',
      color: 'var(--bg)',
      boxShadow: 'var(--shadow-cta)',
      letterSpacing: '-0.005em',
      transition: 'transform 400ms var(--ease), box-shadow 400ms var(--ease)',
    },
    ghost: {
      background: 'var(--bg-elevated)',
      color: 'var(--ink)',
      border: '1px solid var(--line)',
      boxShadow: 'var(--shadow-sm)',
      letterSpacing: '-0.005em',
      transition: 'background 400ms var(--ease), transform 400ms var(--ease)',
    },
  };

  const inner = (
    <>
      <span>{props.children}</span>
      {showArrow && variant === 'primary' ? <Arrow /> : null}
    </>
  );

  const cls = `${variantCls[variant]} ${className}`;
  const style = variantStyle[variant];

  if ('href' in props && typeof props.href === 'string') {
    if (props.external) {
      return (
        <a href={props.href} className={cls} style={style} target="_blank" rel="noreferrer noopener">
          {inner}
        </a>
      );
    }
    return (
      <Link href={props.href} className={cls} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      style={style}
      onClick={(props as NativeButtonProps).onClick}
    >
      {inner}
    </button>
  );
}

function Arrow() {
  return (
    <span
      aria-hidden
      className="button-arrow inline-flex h-8 w-8 items-center justify-center rounded-full"
      style={{
        background: 'color-mix(in srgb, var(--bg) 12%, transparent)',
        transition: 'transform 400ms var(--ease)',
      }}
    >
      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h8M8 3l4 4-4 4" />
      </svg>
    </span>
  );
}
