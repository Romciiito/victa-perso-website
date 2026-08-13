'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DEFAULT_COUNTRY,
  detectInternationalNumber,
  formatNationalAsYouType,
  getCountryOptions,
  toE164,
  type CountryCode,
} from '@/lib/phone-utils';

interface Props {
  /** E.164 value (`+420777933112`) or `''` — the shape `contact-schema.ts` validates. */
  value: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  locale: 'cs' | 'en';
  label: string;
  error?: string;
  required?: boolean;
}

/**
 * Country-code select + national-number text field, styled as one compound
 * input (Vlna 6, REQ-F-041 phone-with-prefix). Defaults to CZ (+420);
 * pasting/typing a full international number (`+84 92198 8912` or
 * `00420777933112`) auto-detects the country and strips the prefix from the
 * number field — see `src/lib/phone-utils.ts` for the pure detection logic
 * this component wires up to React state.
 *
 * Always emits E.164 to the caller (`onChange`) — the contact form stores
 * and validates E.164; this component is the only place that deals with
 * national-format display.
 *
 * Code-split via `next/dynamic` in `contact-form.tsx` (not here) so
 * `libphonenumber-js`'s metadata never lands in a shared/vendor chunk —
 * see that file's import for the `ssr: false` + loading-fallback wiring.
 */
export function PhoneInput({ value, onChange, onBlur, locale, label, error, required }: Props) {
  const t = useTranslations('forms.phone');
  const numberId = useId();
  const countryId = useId();
  const errorId = useId();

  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [national, setNational] = useState('');

  // Render-time derivation, NOT `useEffect` — resetting local state to match
  // an external prop change is the documented alternative to "setState in an
  // effect" (https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes)
  // and is what `eslint-plugin-react-hooks`'s `set-state-in-effect` rule
  // requires here. `prevValue` mirrors `value` so this block runs exactly
  // once per *external* change (react-hook-form's `reset()`, or the field
  // being seeded), not on every render.
  //
  // Distinguishing "external change" from "the parent echoing back the
  // value we ourselves just emitted" (so this block doesn't reformat/fight
  // every keystroke) is done WITHOUT a ref — refs can't be read during
  // render under the React Compiler's rules (`react-hooks/refs`). Instead
  // `commit()` below — always called from an event handler, never during
  // render — pre-emptively calls `setPrevValue` with the very value it's
  // about to emit, so by the time that value round-trips back down as the
  // `value` prop, `prevValue` already matches it and this block is a no-op.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!value) {
      setCountry(DEFAULT_COUNTRY);
      setNational('');
    } else {
      const detected = detectInternationalNumber(value);
      if (detected) {
        setCountry(detected.country);
        setNational(detected.national);
      }
      // else: an external, non-international-looking value (e.g. this
      // component's own best-effort E.164 concatenation for a still-partial
      // number) — `country`/`national` are already the display source of
      // truth in that case, nothing to resync.
    }
  }

  const countryOptions = getCountryOptions(locale);

  function commit(nextCountry: CountryCode, nextNational: string) {
    const e164 = toE164(nextCountry, nextNational);
    setPrevValue(e164);
    onChange(e164);
  }

  function handleNumberChange(raw: string) {
    const detected = detectInternationalNumber(raw);
    if (detected) {
      setCountry(detected.country);
      setNational(detected.national);
      commit(detected.country, detected.national);
      return;
    }
    // Still mid-typing an international prefix (e.g. just "+8" so far) —
    // show it as-is and wait for enough digits to resolve a country, rather
    // than formatting it as a national number under the wrong country.
    if (raw.trimStart().startsWith('+') || raw.trimStart().startsWith('00')) {
      setNational(raw);
      commit(country, '');
      return;
    }
    const formatted = formatNationalAsYouType(country, raw);
    setNational(formatted);
    commit(country, formatted);
  }

  function handleCountryChange(nextCountry: CountryCode) {
    setCountry(nextCountry);
    const digits = national.replace(/\D/g, '');
    const formatted = digits ? formatNationalAsYouType(nextCountry, digits) : '';
    setNational(formatted);
    commit(nextCountry, formatted);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={numberId}>
        {label}{' '}
        {required ? (
          <span aria-hidden style={{ color: 'var(--accent)' }}>
            *
          </span>
        ) : null}
      </label>
      <div
        className="flex overflow-hidden rounded-md border"
        style={{ borderColor: error ? 'var(--error)' : 'var(--border)', backgroundColor: 'var(--bg)' }}
      >
        <label className="sr-only" htmlFor={countryId}>
          {t('countryAriaLabel')}
        </label>
        <select
          id={countryId}
          aria-label={t('countryAriaLabel')}
          value={country}
          onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
          className="shrink-0 border-r px-2 py-2.5 text-base"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
        >
          {countryOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} +{c.callingCode}
            </option>
          ))}
        </select>
        <input
          id={numberId}
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          required={required}
          aria-required={required}
          aria-label={t('numberAriaLabel')}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          placeholder={t('placeholder')}
          value={national}
          onChange={(e) => handleNumberChange(e.target.value)}
          onBlur={onBlur}
          className="w-full px-3 py-2.5 text-base outline-none"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
