'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useCalModal } from '@/components/booking/use-cal-modal';

/**
 * Chatbot panel — dynamically imported by `chat-launcher.tsx` on first
 * click (never in the initial bundle). Dialog semantics (role="dialog",
 * aria-modal, focus trap, Escape-to-close), streaming response render,
 * localized error/limit states, sessionStorage-scoped `session_id` (dies
 * with the tab — the chatbot is stateless from the visitor's perspective,
 * per-visit persistence only), and a persistent footer booking CTA.
 */

const SESSION_STORAGE_KEY = 'victa-chat-session';
const MAX_CLIENT_MESSAGES = 40;
const SOFT_WARNING_AT = 18;

type ChatRole = 'user' | 'assistant';
interface ChatMessage {
  role: ChatRole;
  content: string;
}
type Status = 'idle' | 'sending' | 'limit' | 'daily-limit' | 'disabled' | 'error';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}

export function ChatPanel({ panelId, onClose }: { panelId: string; onClose: () => void }) {
  const t = useTranslations('chat');
  const tCta = useTranslations('common.ctaBand');
  const locale = useLocale() === 'en' ? ('en' as const) : ('cs' as const);
  const pathname = usePathname();

  const openCal = useCalModal({
    bookingType: 'scoping_call',
    sourcePage: `/${locale}${pathname === '/' ? '' : pathname}`,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const sessionIdRef = useRef<string>('');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Focus the close button on mount (a11y — dialog opens with focus inside).
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Escape closes; Tab/Shift+Tab are trapped within the panel.
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status === 'sending' || status === 'limit' || status === 'daily-limit') return;

    const nextMessages: ChatMessage[] = [
      ...messages.slice(-(MAX_CLIENT_MESSAGES - 1)),
      { role: 'user', content: trimmed },
    ];
    setMessages(nextMessages);
    setInput('');
    setStatus('sending');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          messages: nextMessages,
          locale,
          source_url: `/${locale}${pathname === '/' ? '' : pathname}`,
        }),
      });

      if (res.status === 503) {
        setStatus('disabled');
        return;
      }
      if (res.status === 429) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus(body?.error === 'daily-limit' ? 'daily-limit' : 'limit');
        return;
      }
      if (!res.ok || !res.body) {
        setStatus('error');
        return;
      }

      setStatus('idle');
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: assistantText };
          return copy;
        });
      }
      if (!assistantText) {
        // Stream opened but produced nothing — a mid-stream provider error
        // (route.ts's onError path). Surface the generic error state.
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(e as unknown as FormEvent);
    }
  }

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const showCountWarning = userMessageCount >= SOFT_WARNING_AT && status === 'idle';
  const inputDisabled = status === 'sending' || status === 'limit' || status === 'daily-limit';

  return (
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${panelId}-title`}
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 absolute bottom-[calc(100%+12px)] right-0 flex h-[min(560px,70vh)] w-[min(380px,90vw)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 id={`${panelId}-title`} className="font-mono text-[13px] uppercase tracking-[0.1em] text-ink">
          {t('panelTitle')}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="rounded-md p-1 text-secondary hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          ×
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-lg bg-accent px-3 py-2 text-[14px] text-bg'
                : 'mr-auto max-w-[85%] rounded-lg bg-surface-2 px-3 py-2 text-[14px] text-ink'
            }
          >
            {m.content}
          </div>
        ))}

        {status === 'limit' && (
          <p className="text-[13px] text-warning" role="alert">
            {t('limitReached')}
          </p>
        )}
        {status === 'daily-limit' && (
          <p className="text-[13px] text-warning" role="alert">
            {t('dailyLimitReached')}
          </p>
        )}
        {status === 'disabled' && (
          <p className="text-[13px] text-warning" role="alert">
            {t('disabledFallback')}
          </p>
        )}
        {status === 'error' && (
          <p className="text-[13px] text-error" role="alert">
            {t('errorGeneric')}
          </p>
        )}
        {showCountWarning && <p className="text-[12px] text-tertiary">{t('messageCountWarning')}</p>}

        <div ref={listEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-border px-3 py-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onInputKeyDown}
          disabled={inputDisabled}
          placeholder={t('placeholder')}
          rows={1}
          maxLength={2000}
          className="max-h-24 flex-1 resize-none rounded-md border border-border-soft bg-bg px-3 py-2 text-[14px] text-ink placeholder:text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={inputDisabled || !input.trim()}
          aria-label={status === 'sending' ? t('sending') : t('send')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-bg disabled:opacity-40"
        >
          <Send aria-hidden="true" size={16} />
        </button>
      </form>

      <div className="border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={() => void openCal()}
          className="w-full rounded-md bg-accent-bright px-3 py-2 text-center text-[13px] font-medium text-bg motion-safe:transition-transform hover:scale-[1.01]"
        >
          {tCta('primaryCta')}
        </button>
        <p className="mt-2 text-[11px] leading-[1.5] text-tertiary">
          {t('gdpr.body')}
          <Link href="/ochrana-soukromi" className="text-accent underline">
            {t('gdpr.linkText')}
          </Link>
          {t('gdpr.after')}
        </p>
      </div>
    </div>
  );
}
