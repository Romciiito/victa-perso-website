import { HeroParallax, HeroReveal } from './page-hero-client';
import { MagneticCta } from './magnetic-cta';

/* ============================================================
   page-hero.tsx · Server Component (audit P0-21 + P0-22)
   ----------------------------------------------------------------
   The H1 renders as plain static markup — no opacity/blur/scale
   animation, ever, so it is visible in the first paint (LCP) instead
   of waiting for hydration + a spring animation to reveal it.
   Accompanying elements (status badge, eyebrow, sub, CTAs, anchors)
   keep their entrance reveal via the small `HeroReveal` client leaf.
   The scroll-linked parallax lives in the `HeroParallax` client leaf
   so this component itself needs no 'use client' directive and can
   be rendered from a genuine Server Component (see cookies-body.tsx,
   ochrana-body.tsx) as well as from the client *-body.tsx templates
   that still need 'use client' for openCal.
   ============================================================ */

type AnchorLink = { label: string; href: string };
type Cta =
  // POZOR: `onClick` variantu smí posílat jen KLIENTSKÝ volající (*-body.tsx
  // s 'use client') — serverová komponenta (cookies/ochrana) nesmí funkci přes
  // RSC hranici serializovat; tsc to nechytí, spadne až render (gate, Vlna 3B).
  | { label: string; href: string; onClick?: never; primary?: boolean }
  | { label: string; href?: never; onClick: () => void | Promise<void>; primary?: boolean };

type Props = {
  status?: string;
  eyebrow?: string;
  headline: string;
  sub?: string;
  ctas?: ReadonlyArray<Cta>;
  anchors?: ReadonlyArray<AnchorLink>;
  anchorNavLabel?: string;
};

export function PageHero({ status, eyebrow, headline, sub, ctas, anchors, anchorNavLabel = 'Sekce stránky' }: Props) {
  return (
    <HeroParallax>
      {status && (
        <HeroReveal
          delay={0.1}
          className="mb-6 inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-[11.5px] text-secondary backdrop-blur-sm"
        >
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono uppercase tracking-[0.14em]">{status}</span>
        </HeroReveal>
      )}

      {eyebrow && (
        <HeroReveal
          delay={0.14}
          className="mb-3 font-mono text-[12px] uppercase tracking-[0.18em] text-tertiary"
        >
          {eyebrow}
        </HeroReveal>
      )}

      <h1 className="display max-w-[18ch] text-[clamp(48px,7vw,108px)] text-ink">
        {headline}
      </h1>

      {sub && (
        <HeroReveal
          delay={0.32}
          className="mt-7 max-w-[58ch] text-[18px] leading-[1.55] text-secondary"
        >
          {sub}
        </HeroReveal>
      )}

      {ctas && ctas.length > 0 && (
        <HeroReveal delay={0.44} className="mt-10 flex flex-wrap items-center gap-3">
          {ctas.map((cta, i) =>
            'onClick' in cta && cta.onClick ? (
              <MagneticCta key={`${cta.label}-${i}`} onClick={cta.onClick} primary={cta.primary}>
                {cta.label}
              </MagneticCta>
            ) : (
              <MagneticCta key={cta.href} href={cta.href!} primary={cta.primary}>
                {cta.label}
              </MagneticCta>
            ),
          )}
        </HeroReveal>
      )}

      {anchors && anchors.length > 0 && (
        <HeroReveal as="nav" aria-label={anchorNavLabel} delay={0.5} className="mt-8 flex flex-wrap gap-3">
          {anchors.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="tactile rounded-full border border-border px-4 py-2 text-[13.5px] text-secondary hover:border-ink hover:text-ink"
            >
              {a.label}
            </a>
          ))}
        </HeroReveal>
      )}
    </HeroParallax>
  );
}
