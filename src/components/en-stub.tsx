import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Link } from '@/i18n/navigation';
import { StatusLine } from './status-line';

type Props = {
  title: string;
  pathLabel: string;
};

/**
 * Minimal English stub for sub-pages. The full English site lands with
 * international expansion (Phase 4+); until then EN sub-routes show this
 * placeholder pointing to the EN landing.
 */
export function EnglishStub({ title, pathLabel }: Props) {
  return (
    <section className="relative px-6 pb-24 pt-16 md:px-12 md:pb-32 md:pt-24">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="mb-8">
          <StatusLine>STATUS · v 0.1.0 · {pathLabel}</StatusLine>
        </div>
        <p
          className="mb-4 font-mono text-xs uppercase text-tertiary"
          style={{ letterSpacing: '0.12em' }}
        >
          ENGLISH STUB
        </p>
        <h1
          className="mb-6 text-ink"
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            lineHeight: 1.06,
            letterSpacing: '-0.035em',
            fontWeight: 500,
          }}
        >
          {title}
        </h1>
        <p
          className="mb-10 text-secondary"
          style={{ fontSize: '17px', lineHeight: 1.6 }}
        >
          The full English version of this page lands with our international
          expansion. The Czech site at /cs has the complete content. For
          English-speaking enquiries, contact us directly — we&apos;re happy
          to discuss projects in English.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:hello@victaagency.com"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors duration-150 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              letterSpacing: '-0.005em',
            }}
          >
            hello@victaagency.com
            <ArrowRight size={16} weight="regular" aria-hidden />
          </a>
          <Link
            href="/"
            locale="cs"
            className="inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-medium transition-colors duration-150 hover:bg-surface"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--ink)',
              backgroundColor: 'transparent',
              letterSpacing: '-0.005em',
            }}
          >
            View full site in Czech
            <ArrowRight size={16} weight="regular" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
