'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LABELS: Record<(typeof routing.locales)[number], string> = {
  cs: 'CS',
  en: 'EN',
};

export function LocaleSwitcher() {
  const current = useLocale() as (typeof routing.locales)[number];
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: (typeof routing.locales)[number]) => {
    if (next === current) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      role="group"
      aria-label="Locale"
      className="inline-flex items-center overflow-hidden rounded-sm border border-border"
    >
      {routing.locales.map((loc, i) => {
        const active = loc === current;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={active}
            className={`px-2 py-1 font-mono text-xs transition-colors duration-150 ${
              active ? 'text-ink' : 'text-tertiary hover:bg-surface hover:text-ink'
            } ${i > 0 ? 'border-l border-border' : ''}`}
            style={active ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
          >
            {LABELS[loc]}
          </button>
        );
      })}
    </div>
  );
}
