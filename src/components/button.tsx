import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type Variant = 'primary' | 'ghost';
type Size = 'md' | 'lg';

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50';

const sizeClasses: Record<Size, string> = {
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-bg border border-accent hover:opacity-90',
  ghost: 'bg-transparent text-ink border border-border hover:bg-surface',
};

const variantStyle: Record<Variant, CSSProperties> = {
  primary: {
    backgroundColor: 'var(--accent)',
    color: 'var(--bg)',
    borderColor: 'var(--accent)',
    letterSpacing: '-0.005em',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--ink)',
    borderColor: 'var(--border)',
    letterSpacing: '-0.005em',
  },
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
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

export function Button(props: Props) {
  const variant: Variant = props.variant ?? 'primary';
  const size: Size = props.size ?? 'md';
  const showArrow: boolean = props.showArrow ?? false;
  const className: string = props.className ?? '';
  const cls = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  const inner = (
    <>
      <span>{props.children}</span>
      {showArrow ? <ArrowRight size={16} aria-hidden /> : null}
    </>
  );

  if ('href' in props && typeof props.href === 'string') {
    if (props.external) {
      return (
        <a href={props.href} className={cls} style={variantStyle[variant]}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={props.href} className={cls} style={variantStyle[variant]}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} style={variantStyle[variant]} onClick={(props as NativeButtonProps).onClick}>
      {inner}
    </button>
  );
}
