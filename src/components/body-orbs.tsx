/**
 * BodyOrbs — atmospheric radial mesh background applied to body.
 * Server component (no JS, pure CSS). Theme-aware via tokens.
 *
 * Usage: render once at the root, fixed inset:-20%, z-index 0, pointer-events none.
 * Drift animation 40s ease-in-out infinite — soft motion, no performance cost.
 */
export function BodyOrbs() {
  return (
    <div
      aria-hidden
      className="body-orbs pointer-events-none fixed -inset-[20%] z-0"
      style={{
        background:
          'radial-gradient(ellipse 40% 30% at 20% 18%, var(--orb-1), transparent 60%),' +
          'radial-gradient(ellipse 35% 30% at 80% 70%, var(--orb-2), transparent 60%),' +
          'radial-gradient(ellipse 50% 40% at 50% 0%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 60%)',
        filter: 'blur(40px)',
        animation: 'body-orbs-drift 40s ease-in-out infinite',
      }}
    />
  );
}
