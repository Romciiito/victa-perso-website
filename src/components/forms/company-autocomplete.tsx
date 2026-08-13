'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { countryDisplayName } from '@/lib/country-names';

export interface VerifiedCompany {
  ico: string;
  country: 'CZ' | 'SK';
}

interface CompanyMatch {
  name: string;
  ico: string;
  address: string | null;
  country: 'CZ' | 'SK';
}

interface CompanyLookupResponse {
  results?: CompanyMatch[];
  degraded?: boolean;
}

interface Props {
  id?: string;
  value: string;
  onChange: (name: string) => void;
  /** Fires with the ARES/RPO match on a verified pick, or `null` when the visitor edits away from it or explicitly chooses the unverified option. */
  onVerify: (match: VerifiedCompany | null) => void;
  locale: 'cs' | 'en';
  label: string;
  error?: string;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;

/**
 * Company-name field wired to `GET /api/company-lookup` (Vlna 6 anti-fake-lead
 * verification) — ARIA combobox pattern: text input + `role="listbox"`
 * results, arrow-key navigation, Enter to select, Escape to close. The
 * visitor keeps full free-text control — picking a registry match is never
 * mandatory (spec: "musí brát v potaz... volnou volbu"), surfaced here as an
 * always-present "use without verification" row at the bottom of the list.
 *
 * Lightweight (fetch + debounce, no heavy dependency) — unlike `PhoneInput`,
 * this does not need its own `next/dynamic` chunk.
 */
export function CompanyAutocomplete({ id, value, onChange, onVerify, locale, label, error }: Props) {
  const t = useTranslations('forms.company');
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = useId();

  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [verified, setVerified] = useState<VerifiedCompany | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  /** Set right after a selection commits — skips the *next* debounce-effect run so picking a result doesn't immediately re-query for its own (now exact-match) name. */
  const skipNextFetch = useRef(false);

  // Render-time derivation, NOT `useEffect` — resetting local state to match
  // an external prop change (e.g. RHF's `reset()` after successful submit)
  // is the documented alternative to "setState in an effect"
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes)
  // and is what `eslint-plugin-react-hooks`'s `set-state-in-effect` rule
  // requires here. `prevValue` mirrors `value` so this runs exactly once per
  // *external* change, not on every render.
  //
  // Distinguishing "external change" from "the parent echoing back what we
  // ourselves just emitted" is done WITHOUT a ref (refs can't be read during
  // render under `react-hooks/refs`) — `selectMatch`/`handleTextChange`
  // below (always called from event handlers, never render) pre-emptively
  // call `setPrevValue` with the value they're about to emit, so by the time
  // it round-trips back down as `value` this block is a no-op.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!value) {
      setVerified(null);
      setResults([]);
      setOpen(false);
    }
  }

  // `queryTooShort` is derived at render time rather than clearing `results`
  // synchronously inside the effect below (same set-state-in-effect
  // constraint) — a query that's currently too short simply renders no
  // results/loading/degraded state, regardless of what's left over in those
  // state variables from a previous, longer query.
  const trimmedQuery = value.trim();
  const queryTooShort = trimmedQuery.length < MIN_QUERY_LEN;
  const visibleResults = queryTooShort ? [] : results;
  const visibleLoading = !queryTooShort && loading;
  const visibleDegraded = !queryTooShort && degraded;

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < MIN_QUERY_LEN) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      // `setLoading(true)` deliberately lives inside this deferred callback,
      // not synchronously in the effect body — a direct call there trips
      // `eslint-plugin-react-hooks`'s `set-state-in-effect` rule. As a side
      // effect this also means no loading flicker during the debounce
      // window itself, only once the request actually starts.
      setLoading(true);
      fetch(`/api/company-lookup?q=${encodeURIComponent(query)}&country=all`, {
        signal: controller.signal,
      })
        .then((res) => res.json() as Promise<CompanyLookupResponse>)
        .then((data) => {
          setResults(Array.isArray(data.results) ? data.results : []);
          setDegraded(Boolean(data.degraded));
          setLoading(false);
          setActiveIndex(-1);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          console.error('[company-autocomplete] fetch failed:', (err as Error).message);
          setResults([]);
          setDegraded(true);
          setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function selectMatch(match: CompanyMatch) {
    skipNextFetch.current = true;
    setPrevValue(match.name);
    onChange(match.name);
    setVerified({ ico: match.ico, country: match.country });
    onVerify({ ico: match.ico, country: match.country });
    setOpen(false);
    setActiveIndex(-1);
  }

  function selectUnverified() {
    // Explicit "don't verify" — clears any prior verified match even if the
    // text still happens to equal that match's name (e.g. the visitor
    // reopened the dropdown without editing and picked this row anyway).
    if (verified) {
      setVerified(null);
      onVerify(null);
    }
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleTextChange(next: string) {
    setPrevValue(next);
    onChange(next);
    if (verified) {
      setVerified(null);
      onVerify(null);
    }
    setOpen(true);
  }

  const showUnverifiedOption = !queryTooShort;
  const totalOptions = visibleResults.length + (showUnverifiedOption ? 1 : 0);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (totalOptions === 0 ? -1 : (i + 1) % totalOptions));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (totalOptions === 0 ? -1 : (i - 1 + totalOptions) % totalOptions));
    } else if (e.key === 'Enter') {
      if (activeIndex === -1) return;
      e.preventDefault();
      if (activeIndex < visibleResults.length) {
        const match = visibleResults[activeIndex];
        if (match) selectMatch(match);
      } else {
        selectUnverified();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const activeDescendantId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm font-medium" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendantId}
        aria-label={t('searchAriaLabel')}
        aria-invalid={!!error}
        autoComplete="organization"
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border px-3 py-2.5 text-base"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
      />
      {verified ? (
        <p className="mt-1.5 text-sm" style={{ color: 'var(--success)' }}>
          {'✓'} {t('verifiedBadge')} {'—'}{' '}
          {t('verifiedWith', { ico: verified.ico, country: countryDisplayName(verified.country, locale) })}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      ) : null}
      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('resultsListLabel')}
          className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border py-1 text-base shadow-lg"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          {visibleLoading ? (
            <li className="px-3 py-2 text-sm" style={{ color: 'var(--secondary)' }}>
              {t('loading')}
            </li>
          ) : null}
          {!visibleLoading && visibleDegraded ? (
            <li className="px-3 py-2 text-sm" style={{ color: 'var(--secondary)' }}>
              {t('degradedNotice')}
            </li>
          ) : null}
          {!visibleLoading && !visibleDegraded && visibleResults.length === 0 && !queryTooShort ? (
            <li className="px-3 py-2 text-sm" style={{ color: 'var(--secondary)' }}>
              {t('noResults')}
            </li>
          ) : null}
          {visibleResults.map((r, i) => (
            <li
              key={`${r.country}:${r.ico}`}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault(); // keep the input focused through the click
                selectMatch(r);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className="cursor-pointer px-3 py-2 text-sm"
              style={{
                backgroundColor: i === activeIndex ? 'var(--accent-soft)' : 'transparent',
                color: 'var(--ink)',
              }}
            >
              <span className="block font-medium">{r.name}</span>
              <span className="block" style={{ color: 'var(--secondary)' }}>
                {`IČO ${r.ico}`}
                {r.address ? ` · ${r.address}` : ''}
              </span>
            </li>
          ))}
          {showUnverifiedOption ? (
            <li
              id={`${listboxId}-option-${visibleResults.length}`}
              role="option"
              aria-selected={activeIndex === visibleResults.length}
              onMouseDown={(e) => {
                e.preventDefault();
                selectUnverified();
              }}
              onMouseEnter={() => setActiveIndex(visibleResults.length)}
              className="cursor-pointer px-3 py-2 text-sm"
              style={{
                backgroundColor: activeIndex === visibleResults.length ? 'var(--accent-soft)' : 'transparent',
                color: 'var(--secondary)',
              }}
            >
              {t('useUnverified', { query: value.trim() })}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
