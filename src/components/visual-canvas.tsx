type VisualCanvasProps = {
  /** Optional tag line — small mono uppercase label */
  tag?: string;
  /** Title — appears at bottom-left of canvas */
  title: string;
  className?: string;
  /** Minimum height in px (default 180) */
  minHeight?: number;
};

/**
 * VisualCanvas — soft-skill variant C for hero right column.
 * Abstract gradient canvas with subtle dotted overlay and bottom-left caption.
 * Theme-aware via CSS tokens.
 */
export function VisualCanvas({ tag, title, className = '', minHeight = 180 }: VisualCanvasProps) {
  return (
    <div
      className={`visual-canvas relative flex w-full items-end overflow-hidden ${className}`}
      style={{
        minHeight: `${minHeight}px`,
        height: '100%',
        padding: '24px 26px',
        background:
          'radial-gradient(ellipse 40% 50% at 30% 30%, color-mix(in srgb, var(--accent) 25%, transparent), transparent 60%),' +
          'radial-gradient(ellipse 40% 50% at 70% 70%, var(--accent-soft), transparent 60%),' +
          'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-deep) 100%)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          maskImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><pattern id='dots' x='0' y='0' width='12' height='12' patternUnits='userSpaceOnUse'><circle cx='1' cy='1' r='0.7' fill='black'/></pattern></defs><rect width='200' height='200' fill='url(%23dots)'/></svg>\")",
          WebkitMaskImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><pattern id='dots' x='0' y='0' width='12' height='12' patternUnits='userSpaceOnUse'><circle cx='1' cy='1' r='0.7' fill='black'/></pattern></defs><rect width='200' height='200' fill='url(%23dots)'/></svg>\")",
          backgroundColor: 'var(--ink)',
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      />
      <div className="relative z-[1] grid gap-1">
        {tag ? (
          <div
            className="font-mono uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '0.18em',
              color: 'var(--ink-muted)',
            }}
          >
            {tag}
          </div>
        ) : null}
        <div
          className="font-medium"
          style={{
            fontSize: '16px',
            letterSpacing: '-0.015em',
            color: 'var(--ink)',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
