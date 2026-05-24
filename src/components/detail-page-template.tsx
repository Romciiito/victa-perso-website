import type { ReactNode } from 'react';
import { Eyebrow } from './eyebrow';
import { Button } from './button';
import { BentoShell, BentoCard } from './bento';
import { EditorialSplit } from './editorial-split';

/* ============================================================
   DetailPageTemplate — universal layout for sluzby/reseni/odvetvi
   detail pages. Per spec §5 layout grammar:
     • Editorial Split intro (H1 left, key info bento right)
     • Content sections below (problem → approach → process → FAQ)
     • CTA-aside on right (sticky on desktop)
   Pure presentation — content is fetched by route page and passed in.
   ============================================================ */

export type DetailFaq = {
  q: string;
  a: string;
};

export type DetailSection = {
  /** Section anchor + ID (lowercase, no diacritics) */
  id: string;
  /** Section label (eyebrow above heading, e.g. "Problém") */
  label: string;
  /** Section heading */
  heading?: string;
  /** Section body — paragraphs (string) or arbitrary ReactNode */
  body: string | ReactNode;
};

export type DetailPageTemplateProps = {
  /** Eyebrow at top of hero (category breadcrumb-style) */
  eyebrow: string;
  /** Hero H1 — typically the service/solution/industry name */
  title: string;
  /** Hero sub paragraph — description */
  description: string;
  /** Optional fit/audience note shown in right card (e.g. "Hodí se pro: …") */
  fit?: string;
  /** Content sections rendered below hero in order */
  sections: ReadonlyArray<DetailSection>;
  /** FAQs rendered at bottom — collapsible accordion */
  faq?: ReadonlyArray<DetailFaq>;
  /** Primary CTA href (default /spoluprace#audit) */
  ctaHref?: string;
  /** Primary CTA label (default "Rezervovat audit") */
  ctaLabel?: string;
  /** Optional secondary ghost CTA */
  ctaGhostHref?: string;
  ctaGhostLabel?: string;
};

export function DetailPageTemplate({
  eyebrow,
  title,
  description,
  fit,
  sections,
  faq,
  ctaHref = '/spoluprace#audit',
  ctaLabel = 'Rezervovat audit',
  ctaGhostHref = '/kontakt',
  ctaGhostLabel = 'Domluvit konzultaci',
}: DetailPageTemplateProps) {
  return (
    <>
      {/* ============================================================
           HERO — Editorial Split intro
           ============================================================ */}
      <EditorialSplit
        padding="hero"
        ratio="left-heavy"
        left={
          <>
            <Eyebrow>{eyebrow}</Eyebrow>

            <h1
              className="text-ink"
              style={{
                fontSize: 'clamp(44px, 6.5vw, 88px)',
                lineHeight: 0.96,
                letterSpacing: '-0.04em',
                fontWeight: 600,
                maxWidth: '18ch',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: '19px',
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                maxWidth: '52ch',
              }}
            >
              {description}
            </p>

            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              <Button href={ctaHref} variant="primary" size="md">
                {ctaLabel}
              </Button>
              <Button href={ctaGhostHref} variant="ghost" size="md">
                {ctaGhostLabel}
              </Button>
            </div>
          </>
        }
        right={
          fit ? (
            <BentoShell>
              <BentoCard padding="loose">
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.16em',
                    color: 'var(--ink-soft)',
                  }}
                >
                  Hodí se pro
                </div>
                <p
                  style={{
                    fontSize: '16px',
                    lineHeight: 1.5,
                    color: 'var(--ink)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {/* Strip "Hodí se pro: " prefix if already in copy */}
                  {fit.replace(/^Hodí se pro:\s*/i, '')}
                </p>
              </BentoCard>
            </BentoShell>
          ) : (
            <div />
          )
        }
      />

      {/* ============================================================
           CONTENT SECTIONS
           ============================================================ */}
      {sections.length > 0 && (
        <section
          className="relative px-6 py-24 md:px-8 md:py-32"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16">
              {/* Sticky TOC on desktop */}
              <aside className="hidden md:block">
                <div className="sticky top-[120px] grid gap-6">
                  <div
                    className="font-mono uppercase"
                    style={{
                      fontSize: '11px',
                      letterSpacing: '0.16em',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    Na této stránce
                  </div>
                  <nav>
                    <ol className="list-none" style={{ display: 'grid', gap: '8px' }}>
                      {sections.map((s, i) => (
                        <li key={s.id}>
                          <a
                            href={`#${s.id}`}
                            className="block transition-colors duration-200"
                            style={{
                              fontSize: '14px',
                              color: 'var(--ink-muted)',
                              letterSpacing: '-0.005em',
                            }}
                          >
                            <span
                              className="font-mono"
                              style={{ color: 'var(--ink-soft)', marginRight: '8px' }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              </aside>

              {/* Content blocks */}
              <div className="grid gap-16">
                {sections.map((s) => (
                  <SectionBlock key={s.id} section={s} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
           FAQ
           ============================================================ */}
      {faq && faq.length > 0 && (
        <section
          className="relative px-6 py-24 md:px-8 md:py-32"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <div className="mx-auto w-full max-w-[860px]">
            <div className="mb-12">
              <div
                className="mb-4 font-mono uppercase"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  color: 'var(--ink-soft)',
                }}
              >
                FAQ
              </div>
              <h2
                style={{
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.05,
                  color: 'var(--ink)',
                }}
              >
                Časté otázky
              </h2>
            </div>

            <ul className="list-none" style={{ display: 'grid', gap: '0' }}>
              {faq.map((item, i) => (
                <li
                  key={`${i}-${item.q.slice(0, 24)}`}
                  style={{
                    borderTop: i === 0 ? '1px solid var(--line)' : undefined,
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <details className="group" style={{ padding: '20px 0' }}>
                    <summary
                      className="flex cursor-pointer items-start justify-between gap-6"
                      style={{ listStyle: 'none' }}
                    >
                      <span
                        style={{
                          fontSize: '17px',
                          fontWeight: 500,
                          letterSpacing: '-0.015em',
                          color: 'var(--ink)',
                          lineHeight: 1.35,
                        }}
                      >
                        {item.q}
                      </span>
                      <span
                        aria-hidden
                        className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-open:rotate-45"
                        style={{
                          border: '1px solid var(--line)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <path d="M6 2v8M2 6h8" />
                        </svg>
                      </span>
                    </summary>
                    <div
                      className="mt-4"
                      style={{
                        fontSize: '15px',
                        lineHeight: 1.6,
                        color: 'var(--ink-muted)',
                        maxWidth: '60ch',
                      }}
                    >
                      {item.a}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ============================================================
           BOTTOM CTA
           ============================================================ */}
      <section
        className="relative px-6 py-24 md:px-8 md:py-32"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mx-auto w-full max-w-[860px] text-center">
          <h2
            className="mb-6"
            style={{
              fontSize: 'clamp(32px, 4vw, 56px)',
              fontWeight: 600,
              letterSpacing: '-0.045em',
              lineHeight: 1.04,
              color: 'var(--ink)',
            }}
          >
            Začneme tím, že posloucháme.
          </h2>
          <p
            className="mb-10"
            style={{
              fontSize: '19px',
              lineHeight: 1.5,
              color: 'var(--ink-muted)',
              maxWidth: '40ch',
              margin: '0 auto 40px',
            }}
          >
            Než cokoliv navrhneme, chceme rozumět vašemu podnikání.
          </p>
          <div className="flex flex-wrap items-center justify-center" style={{ gap: '12px' }}>
            <Button href={ctaHref} variant="primary" size="md">
              {ctaLabel}
            </Button>
            <Button href={ctaGhostHref} variant="ghost" size="md">
              {ctaGhostLabel}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   StringParagraphs — splits a string body on double newlines
   into separate <p> elements with consistent spacing.
   ============================================================ */
function StringParagraphs({ body }: { body: string }) {
  const paragraphs = body.split('\n\n').filter(Boolean);
  return (
    <div
      style={{
        fontSize: '17px',
        lineHeight: 1.6,
        color: 'var(--ink-muted)',
        maxWidth: '70ch',
      }}
    >
      {paragraphs.map((para, i) => (
        <p
          key={`${i}-${para.slice(0, 20)}`}
          style={{ marginBottom: i < paragraphs.length - 1 ? '16px' : 0 }}
        >
          {para}
        </p>
      ))}
    </div>
  );
}

/* ============================================================
   SectionBlock — single content section
   ============================================================ */
function SectionBlock({ section }: { section: DetailSection }) {
  return (
    <article id={section.id} className="scroll-mt-32">
      <div
        className="mb-4 font-mono uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '0.16em',
          color: 'var(--ink-soft)',
        }}
      >
        {section.label}
      </div>
      {section.heading ? (
        <h2
          className="mb-6"
          style={{
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            color: 'var(--ink)',
          }}
        >
          {section.heading}
        </h2>
      ) : null}
      {typeof section.body === 'string' ? (
        <StringParagraphs body={section.body} />
      ) : (
        section.body
      )}
    </article>
  );
}
