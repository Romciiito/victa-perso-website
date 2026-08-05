'use client';

import { useId, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { MessageCircle, X } from 'lucide-react';

/**
 * Chatbot floating launcher — the ONLY thing mounted sitewide (in
 * `[locale]/layout.tsx`). Shipped DORMANT (Vlna 5, vision.md §14.12): this
 * component renders `null` — with NO wrapper element at all, not even an
 * empty `<div>` — unless `NEXT_PUBLIC_CHATBOT_ENABLED === '1'`, which stays
 * unset until vendor provisioning AND the adversarial battery
 * (`src/lib/chat/__tests__/adversarial-battery.test.ts`) both pass. This is
 * what the dormance build check greps for: zero chat-related markup in the
 * built HTML when the flag is unset.
 *
 * The panel itself (`chat-panel.tsx`) — and everything it drags in — is
 * `next/dynamic`-imported with `ssr: false` and only loaded after the first
 * click, so it never inflates the initial page bundle.
 */

const ChatPanel = dynamic(() => import('./chat-panel').then((m) => m.ChatPanel), {
  ssr: false,
});

export function ChatLauncher() {
  const enabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED === '1';
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  if (!enabled) return null;

  const close = () => {
    setOpen(false);
    // Return focus to the launcher button — a11y requirement (dispatch
    // brief item 3: "focus management").
    buttonRef.current?.focus();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t('close') : t('launcherLabel')}
        className="motion-safe:transition-transform motion-safe:duration-200 flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-bg shadow-card hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {open ? <X aria-hidden="true" size={22} /> : <MessageCircle aria-hidden="true" size={22} />}
      </button>

      {open && <ChatPanel panelId={panelId} onClose={close} />}
    </div>
  );
}
