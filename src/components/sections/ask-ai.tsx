'use client';

/* ============================================================
   "Zeptejte se na nás AI" — seo-visibility.md §4 spec.
   Four AI-search platforms (ChatGPT, Claude, Perplexity, Gemini),
   each opened with the same URL-encoded, locale-specific prompt
   pre-filled via the platform's `?q=` param. Gemini's prefill is
   flagged unreliable by the spec, so it additionally gets a
   copy-to-clipboard fallback button.

   Placement (spec): homepage (after ProofSection), /o-nas (before
   closing CTA), /spoluprace (before FAQ) — never the footer.
   Hard dependency (spec): only ship once NAP is fixed and JSON-LD
   is wired — both true as of Vlna 0 / D-016, so this is unblocked.

   Text is fully i18n'd (askAi.* in both content/{cs,en}/strings/
   common.json) so both the Czech typography linter and the i18n
   parity gate cover it — nothing here is a hardcoded literal
   except the platform brand names, which don't translate.
   ============================================================ */

import { useState } from 'react';
import { m, type Variants } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { SectionHeader } from './section-header';

const SPRING = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 };
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

type Platform = {
  key: string;
  name: string;
  buildHref: (encodedPrompt: string) => string;
};

/* Order matches the spec: chatgpt.com/?q= · claude.ai/new?q= ·
   perplexity.ai/search?q= · gemini.google.com/app?q= */
const PLATFORMS: ReadonlyArray<Platform> = [
  { key: 'chatgpt', name: 'ChatGPT', buildHref: (q) => `https://chatgpt.com/?q=${q}` },
  { key: 'claude', name: 'Claude', buildHref: (q) => `https://claude.ai/new?q=${q}` },
  {
    key: 'perplexity',
    name: 'Perplexity',
    buildHref: (q) => `https://www.perplexity.ai/search?q=${q}`,
  },
  { key: 'gemini', name: 'Gemini', buildHref: (q) => `https://gemini.google.com/app?q=${q}` },
];

type Props = {
  /** Page-specific numbered eyebrow (e.g. "05 · zeptejte se AI") — same
   *  prop shape as SectionHeader, so numbering stays owned by the caller. */
  eyebrow: string;
};

export function AskAiSection({ eyebrow }: Props) {
  const t = useTranslations('askAi');
  const locale = useLocale();
  const prompt = t('prompt');
  const encodedPrompt = encodeURIComponent(prompt);

  return (
    <section
      id="zeptejte-se-ai"
      className="relative border-t border-border px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader eyebrow={eyebrow} title={t('headline')} lead={t('sub')} />
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          transition={SPRING}
          variants={REVEAL}
          className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PLATFORMS.map((platform) =>
            platform.key === 'gemini' ? (
              <GeminiPill
                key={platform.key}
                name={platform.name}
                href={platform.buildHref(encodedPrompt)}
                prompt={prompt}
                copyLabel={t('copyPrompt')}
                copiedLabel={t('copied')}
              />
            ) : (
              <PlatformPill
                key={platform.key}
                name={platform.name}
                href={platform.buildHref(encodedPrompt)}
              />
            ),
          )}
        </m.div>
        {/* lang mirrors the active locale so screen readers pronounce the
            (untranslated, source-language) prompt correctly if surfaced. */}
        <p className="sr-only" lang={locale}>
          {prompt}
        </p>
      </div>
    </section>
  );
}

/* ---- Platform pill — plain outbound link, no fake logos (text only) --- */
function PlatformPill({ name, href }: { name: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tactile group flex items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-6 py-5 text-[15px] font-medium text-ink transition-colors duration-150 hover:border-ink"
    >
      <span>{name}</span>
      <ArrowUpRight
        size={16}
        strokeWidth={1.75}
        aria-hidden
        className="text-tertiary transition-colors duration-150 group-hover:text-ink"
      />
    </a>
  );
}

/* ---- Gemini pill — same link, plus a copy-to-clipboard fallback because
   the spec flags Gemini's `?q=` prefill as unreliable. ---- */
function GeminiPill({
  name,
  href,
  prompt,
  copyLabel,
  copiedLabel,
}: {
  name: string;
  href: string;
  prompt: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable or denied — the link above still works.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface px-6 py-5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="tactile group flex items-center justify-between gap-3 text-[15px] font-medium text-ink transition-colors duration-150 hover:text-accent"
      >
        <span>{name}</span>
        <ArrowUpRight
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="text-tertiary transition-colors duration-150 group-hover:text-accent"
        />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-live="polite"
        className="tactile flex items-center gap-1.5 self-start font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary transition-colors duration-150 hover:text-ink"
      >
        {copied ? (
          <>
            <Check size={13} strokeWidth={2} aria-hidden />
            {copiedLabel}
          </>
        ) : (
          <>
            <Copy size={13} strokeWidth={1.75} aria-hidden />
            {copyLabel}
          </>
        )}
      </button>
    </div>
  );
}
