'use client';

import { useLocale } from 'next-intl';
import { useCalModal } from '@/components/booking/use-cal-modal';
import { usePathname } from '@/i18n/navigation';

/* ============================================================
   FooterBookCta · D-011 follow-up (conversion-flow-v3.md §3)
   Footer's "bookCall" slot must be a real booking trigger, not a
   Link to /kontakt. Isolated as its own tiny client component so
   `footer.tsx` itself can stay a server component for everything
   else it renders.
   ============================================================ */

export function FooterBookCta({ label }: { label: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  // usePathname z next-intl je bez locale prefixu — sjednoceno s '/cs/...' taxonomií GA4.
  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}${pathname === '/' ? '' : pathname}`,
  });

  return (
    <button
      type="button"
      onClick={() => {
        void openCal();
      }}
      className="text-sm text-accent transition-colors duration-150 hover:text-ink"
    >
      {label}
    </button>
  );
}
