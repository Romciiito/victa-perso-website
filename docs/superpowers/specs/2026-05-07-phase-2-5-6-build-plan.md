# VICTA Phase 2 + Phase 5 + Phase 6 — Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Plán píše parallel session, hlavní session pracuje na Phase 1.2 — NEPŘEPISOVAT `src/components/{nav,footer,theme-toggle,locale-switcher,status-line}.tsx` ani `src/app/[locale]/{layout,page,spoluprace/page,sluzby/page,o-nas/page}.tsx`. Pokud existují, použij `Edit`, ne `Write`.

**Goal:** Postavit interaktivní funkce (Phase 2), pre-launch QA (Phase 5) a spuštění (Phase 6) pro VICTA marketing web tak, aby splnil 13 launch criteria z `intent.md` a všech 25 architectural rules (AR-01..AR-25) z `architecture.md`.

**Architecture:** Next.js 15 App Router + Vercel Functions (Node.js, region `fra1`) + Supabase Postgres (Frankfurt) + Upstash Redis (Ireland) + Resend + Cal.com cloud + Cloudflare Turnstile + Sentry + Cookiebot + GA4. Server-only secrets, RLS na všech 8 tabulkách, default-deny anon. Server Actions / Route Handlers pro forms, signed Cal.com webhook, three-dimensional rate limit (per-IP, per-session, per-day) — chatbot deferred (D-002), takže Phase 2 má pouze formuláře a booking, žádný `/api/chat`.

**Tech Stack:** Next.js 15.x, React 19, TypeScript 5.x strict, Tailwind v4, shadcn/ui, next-intl 4.x, Zod 3.x, React Hook Form 7.x, `@calcom/atoms`, `@upstash/redis`, `@supabase/supabase-js`, `resend`, `@sentry/nextjs`, `next-themes`, Vitest, Playwright + axe-core, Lighthouse CI.

**Honor:**
- 25 architectural rules AR-01..AR-25
- 15 critical rules v `claude-rules.md`
- LOCKED design tokens (Inter Tight + indigo + grid · `tokens/light.css` + `tokens/dark.css`) — žádné token změny
- Path B invoice flow (D-003) — žádný Stripe, žádná online platba
- Chatbot deferred (D-002) — `/api/chat` není v scope, neimport `@anthropic-ai/sdk`
- Czech typography correctness (`„uvozovky"`, em-dash, nbsp po jednopísmenných předložkách)
- Brand voice first-person plural ("my", "naše"), nikdy "já"
- Žádné fake testimonials/case studies
- `.env.example` pouze placeholders, production secrets jen v Vercel env vars

**Roman blocker konvence:** ⛔ ROMAN-BLOCKER = úkol vyžaduje Romanův input/akci a downstream task se nesmí spustit bez něj. Když narazíš na blocker, append do `.workforce/parallel-session-status.md` a STOP.

---

## File Structure (před zahájením)

### Nové soubory pro Phase 2 (vytvoří agenti)

```
src/
  lib/
    supabase.ts             # Supabase service-role client (server-only import)
    supabase-types.ts       # Typed wrapper for tables
    redis.ts                # Upstash Redis client
    rate-limit.ts           # checkIpLimit / checkDailyLimit / checkSessionLimit
    sanitize.ts             # stripHtml / stripControlTokens (chatbot reuse later)
    turnstile.ts            # verifyTurnstileToken (server-side)
    schema.ts               # buildOrganizationSchema, buildLocalBusinessSchema, buildServiceSchema, buildFAQSchema
    schema-types.ts         # JSON-LD type definitions
    ga4.ts                  # trackEvent client utility (consent-gated)
    sentry.ts               # Sentry init helpers (client + server)
    leads.ts                # upsertLead helper (resolves cross-source CRM)
    consent.ts              # readCookiebotConsent helper (gtag wrapper)
    czech-typography.ts     # nbsp, quotes, em-dash post-process utility (server)
  config/
    site.ts                 # Organization metadata, sameAs, contact email
    services.ts             # 18 services for schema engine + sitemap
    nav.ts                  # navigation structure (used by Phase 1.2 nav)
    pricing.ts              # 3 audit tier price ranges (CZK + EUR) — `as const`
    industries.ts           # 6 industry verticals
    solutions.ts            # 5 packaged solutions
  components/
    forms/
      contact-form.tsx      # React Hook Form + Zod
      newsletter-signup.tsx # reusable component
      turnstile-widget.tsx  # Cloudflare Turnstile React wrapper
      gdpr-consent.tsx      # checkbox + privacy link
      form-status.tsx       # success/error inline announcement
    booking/
      cal-booking-widget.tsx   # Cal.com Atoms client wrapper
      booking-cta.tsx          # generic CTA button → opens widget
      audit-tier-card.tsx      # reusable card for tiers
    seo/
      json-ld.tsx              # render <script type="application/ld+json">
      faq-block.tsx            # FAQ component + injects FAQPage schema
      evidence-panel.tsx       # methodology block (homepage + spoluprace)
    consent/
      cookiebot-script.tsx     # Cookiebot loader (async, SRI)
      ga4-loader.tsx           # gtag.js loaded only after analytics consent
    sentry/
      sentry-error-boundary.tsx
  app/
    api/
      contact/route.ts          # POST handler — Zod, Turnstile, rate-limit, Resend, Supabase
      newsletter/route.ts       # POST handler — double opt-in flow
      booking-webhook/route.ts  # POST handler — HMAC verify, replay, Supabase upsert
    [locale]/
      kontakt/page.tsx          # contact page (interactive form)
      ochrana-soukromi/page.tsx # privacy policy
      cookies/page.tsx          # cookie policy
      blog/page.tsx             # placeholder
    sitemap.ts                  # next-sitemap conf (built-in)
    robots.ts                   # next.js robots
    not-found.tsx               # 404
public/
  llms.txt                      # AI crawler authorization
sentry.client.config.ts         # Sentry client init
sentry.server.config.ts         # Sentry server init
instrumentation.ts              # Next.js instrumentation hook for Sentry
scripts/
  czech-typography-lint.mjs     # build-time CI linter (Phase 1 may already exist)
  smoke-test.mjs                # post-deploy verification
.lighthouserc.json              # Lighthouse CI config
playwright.config.ts            # if not present
e2e/
  smoke.spec.ts                 # homepage + spoluprace + kontakt
  contact-form.spec.ts
  newsletter.spec.ts
  booking.spec.ts
  locale-theme.spec.ts
  a11y.spec.ts                  # axe-core scan
content/cs/strings/
  forms.json                    # form labels, validation messages, success/error text
content/en/strings/
  forms.json
docs/
  smoke-test-checklist.md       # post-deploy manual list
  ga4-event-taxonomy.md         # 11 events documentation
.github/workflows/
  lighthouse.yml                # CI Lighthouse run (if not present)
  axe.yml                       # CI a11y run (or merge into existing)
```

### Existující soubory (modify only)

```
vercel.json                     # přidat /api/* function config (existuje), CSP doplnit Cal.com + Sentry domains
src/middleware.ts               # zachovat allowlist locale validation
src/i18n/routing.ts             # zachovat
src/app/layout.tsx              # ROOT layout — přidat Cookiebot script + GA4 loader (consent-gated) + Sentry boundary
src/app/[locale]/layout.tsx     # locale-specific layout — přidat status-line, footer (z Phase 1.2)
src/components/footer.tsx       # NEPŘEPISOVAT — Edit tool, případně přidat NewsletterSignup do footeru
src/components/nav.tsx          # NEPŘEPISOVAT
src/lib/api.ts                  # použít/rozšířit pokud existuje (současný stav: ano)
.env.example                    # split RESEND_API_KEY_PROD na _NEWSLETTER + _CONTACT, doplnit CALCOM_USERNAME
content/cs/strings/common.json  # rozšířit o navigation, footer, error messages
package.json                    # přidat dependencies
```

---

# PHASE 2 — Core Conversion Paths

**Estimated effort:** 1–2 týdny.
**Owner agents:** `backend-developer` (API routes, Supabase, rate-limit), `frontend-developer` (forms, booking widget, components, GA4 wiring), `devops-engineer` (env vars, vercel.json, CI gates), `test-writer` (Vitest + Playwright + axe), `code-reviewer` (gate), Roman (vendor accounts, copy review).

**Phase 2 Done = SC-04, SC-05, SC-06, SC-09 (partial — events wired, GA4 only after Phase 5 vendor onboarding finishes), audit page Lighthouse ≥ 90, Path B copy on tier cards, all forms write to Supabase.**

---

## Task 2.1: Add dependencies + env-vars split

**Owner:** `devops-engineer` · **Effort:** 30 min · **Roman blocker:** No · **Depends on:** Phase 0 done · **Blocks:** all subsequent Phase 2 tasks.

**Files:**
- Modify: `/Users/trungle/Desktop/websites/VICTA/package.json`
- Modify: `/Users/trungle/Desktop/websites/VICTA/.env.example`

**Acceptance criteria:**
- `pnpm install` succeeds with all new deps locked.
- `.env.example` has `RESEND_API_KEY_NEWSLETTER`, `RESEND_API_KEY_CONTACT` (split from old `_PROD`), `NEXT_PUBLIC_CALCOM_USERNAME`, `RESEND_FROM_EMAIL`, `RESEND_AUDIENCE_ID`.
- All NEW env vars are placeholder values, no real secrets.

**Steps:**

- [ ] **Step 1: Add runtime + dev dependencies**

```bash
pnpm add @supabase/supabase-js@^2.45.0 @upstash/redis@^1.34.0 \
  @upstash/ratelimit@^2.0.0 resend@^4.0.0 \
  react-hook-form@^7.53.0 @hookform/resolvers@^3.9.0 \
  @sentry/nextjs@^8.40.0 @vercel/analytics@^1.4.0 \
  @calcom/atoms@latest dompurify@^3.1.0 isomorphic-dompurify@^2.16.0
pnpm add -D @types/dompurify@^3.0.0 \
  @axe-core/playwright@^4.10.0 \
  @lhci/cli@^0.14.0
```

- [ ] **Step 2: Update `.env.example` — split Resend keys**

Edit existing file: replace `RESEND_API_KEY_PROD=...` with two entries and add Cal.com username:

```bash
# ── Resend (email + newsletter) ───────────────────────────────────────────────
# Two separate keys per security-model.md §4.10 (newsletter audience CRUD vs sending-only)
RESEND_API_KEY_NEWSLETTER=re_your-newsletter-key-here
RESEND_API_KEY_CONTACT=re_your-contact-key-here
RESEND_FROM_EMAIL=hello@victaagency.com
RESEND_AUDIENCE_ID=your-audience-id-here

# ── Cal.com (booking widget + webhook) ────────────────────────────────────────
NEXT_PUBLIC_CALCOM_USERNAME=victa
CALCOM_WEBHOOK_SECRET=your-calcom-webhook-secret-here
```

- [ ] **Step 3: Run typecheck + commit**

```bash
pnpm tsc --noEmit
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore(deps): add Supabase/Upstash/Resend/Sentry/Cal.com SDKs for Phase 2"
```

---

## Task 2.2: Shared lib clients (Supabase, Upstash, sanitize, turnstile)

**Owner:** `backend-developer` · **Effort:** 2 h · **Roman blocker:** No (uses placeholder env vars) · **Depends on:** 2.1.

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/supabase-types.ts`
- Create: `src/lib/redis.ts`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/sanitize.ts`
- Create: `src/lib/turnstile.ts`
- Create: `src/lib/leads.ts`

**Acceptance criteria:**
- `import { supabaseAdmin } from '@/lib/supabase'` works server-side only (file uses `import 'server-only'`).
- `checkIpLimit('contact', '127.0.0.1', { max: 5, windowSeconds: 600 })` returns `{ ok: boolean, remaining: number }`.
- `sanitizeFormString(' <b>x</b> ')` returns `'x'`.
- `verifyTurnstileToken('test')` returns `{ success: false }` against Cloudflare API on a bogus token (test in dev).
- `pnpm tsc --noEmit` succeeds.

**Steps:**

- [ ] **Step 1: Write `src/lib/supabase.ts`**

```typescript
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Service': 'victa-vercel-fn' } },
});
```

- [ ] **Step 2: Write `src/lib/supabase-types.ts`** (minimal manual types — full types via `supabase gen types` post-launch)

```typescript
export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          company: string | null;
          phone: string | null;
          source: 'contact_form' | 'newsletter' | 'booking' | 'chatbot' | 'cold_ad' | 'referral';
          source_url: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          locale: 'cs' | 'en' | null;
          budget_tier: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
      };
      contact_submissions: {
        Row: {
          id: string;
          lead_id: string | null;
          email: string;
          name: string | null;
          company: string | null;
          phone: string | null;
          service_interest: string | null;
          budget_tier: string | null;
          message: string;
          locale: string;
          ip_hash: string | null;
          user_agent: string | null;
          honeypot_passed: boolean;
          resend_email_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contact_submissions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['contact_submissions']['Insert']>;
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          lead_id: string | null;
          email: string;
          resend_audience_id: string | null;
          source_url: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          locale: string;
          ip_hash: string | null;
          consented_at: string;
          consent_text: string;
          unsubscribed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['newsletter_subscribers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>;
      };
      booking_events: {
        Row: {
          id: string;
          lead_id: string | null;
          cal_booking_id: string;
          event_type: 'BOOKING_CREATED' | 'RESCHEDULED' | 'CANCELLED' | 'REJECTED';
          audit_tier: 'tier_1' | 'tier_2' | 'tier_3' | 'free_scoping' | null;
          attendee_email: string | null;
          attendee_name: string | null;
          scheduled_for: string | null;
          invoice_status: 'pending_invoice' | 'invoiced' | 'paid' | 'overdue' | null;
          invoice_id: string | null;
          webhook_signature_verified: boolean;
          raw_payload: unknown;
          received_at: string;
        };
        Insert: Omit<Database['public']['Tables']['booking_events']['Row'], 'id' | 'received_at'>;
        Update: Partial<Database['public']['Tables']['booking_events']['Insert']>;
      };
      audit_log: {
        Row: {
          id: string;
          event_type: string;
          actor: string | null;
          resource_type: string | null;
          resource_id: string | null;
          details: unknown;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
      };
    };
  };
};
```

- [ ] **Step 3: Write `src/lib/redis.ts`**

```typescript
import 'server-only';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error('Upstash env vars missing: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
}

export const redis = new Redis({ url, token });
```

- [ ] **Step 4: Write `src/lib/rate-limit.ts`**

```typescript
import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';
import { createHash } from 'node:crypto';

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'victa-default-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

const rateLimiters = {
  contact: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '600 s'),
    prefix: 'rl:contact',
    analytics: false,
  }),
  newsletter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '3600 s'),
    prefix: 'rl:newsletter',
    analytics: false,
  }),
  booking_webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    prefix: 'rl:bw',
    analytics: false,
  }),
} as const;

export type LimiterKey = keyof typeof rateLimiters;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number;
}

/** Form rate limiters fail-OPEN if Redis is unreachable (REQ-I-020 + vendor-setup-checklist §5). */
export async function checkLimit(key: LimiterKey, identifier: string): Promise<RateLimitResult> {
  try {
    const r = await rateLimiters[key].limit(identifier);
    return { ok: r.success, remaining: r.remaining, reset: r.reset };
  } catch (err) {
    // Fail-open: log via Sentry, allow request through
    // eslint-disable-next-line no-console
    console.warn(`[rate-limit] ${key} fail-open:`, (err as Error).message);
    return { ok: true, remaining: -1, reset: 0 };
  }
}

/** Idempotency check for Cal.com webhook (returns true if already processed). */
export async function wasWebhookProcessed(calBookingId: string): Promise<boolean> {
  const key = `webhook:cal:${calBookingId}`;
  const set = await redis.set(key, '1', { nx: true, ex: 86400 });
  return set !== 'OK'; // null/false → already exists
}
```

- [ ] **Step 5: Write `src/lib/sanitize.ts`**

```typescript
/** Server-side input sanitization. Strips HTML, control characters, trims. */
export function sanitizeFormString(raw: string, maxLen = 2000): string {
  if (typeof raw !== 'string') return '';
  // Strip HTML tags (no DOMPurify here — pure text fields, not rich HTML)
  const noHtml = raw.replace(/<[^>]*>/g, '');
  // Strip null bytes, control chars except newline/tab
  // eslint-disable-next-line no-control-regex
  const noCtrl = noHtml.replace(/[ --]/g, '');
  return noCtrl.trim().slice(0, maxLen);
}

/** Stripped to RFC 5322 essentials — reject newlines/null bytes (security-model.md §4.4). */
export function isValidEmail(input: string): boolean {
  if (typeof input !== 'string' || input.length > 254) return false;
  if (/[\r\n ]/.test(input)) return false;
  // Conservative regex — Zod email() is stricter but this is pre-check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}
```

- [ ] **Step 6: Write `src/lib/turnstile.ts`**

```typescript
import 'server-only';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes: string[];
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // eslint-disable-next-line no-console
    console.error('[turnstile] TURNSTILE_SECRET_KEY missing');
    return { success: false, errorCodes: ['missing-secret'] };
  }
  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const json = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return { success: json.success === true, errorCodes: json['error-codes'] ?? [] };
  } catch (err) {
    // Fail-closed for Turnstile (unlike rate-limit). A network error is suspicious.
    // eslint-disable-next-line no-console
    console.error('[turnstile] verify error:', (err as Error).message);
    return { success: false, errorCodes: ['network-error'] };
  }
}
```

- [ ] **Step 7: Write `src/lib/leads.ts`**

```typescript
import 'server-only';
import { supabaseAdmin } from './supabase';
import type { Database } from './supabase-types';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export interface UpsertLeadInput {
  email: string;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  source: LeadInsert['source'];
  source_url?: string | null;
  locale: 'cs' | 'en';
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
  };
  budget_tier?: string | null;
  notes?: string | null;
}

/** Upsert lead by email (case-insensitive). Returns the lead row. */
export async function upsertLead(input: UpsertLeadInput): Promise<{ id: string } | null> {
  const email = input.email.toLowerCase();
  // Try fetch existing
  const { data: existing } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return existing;
  const insert: LeadInsert = {
    email,
    name: input.name ?? null,
    company: input.company ?? null,
    phone: input.phone ?? null,
    source: input.source,
    source_url: input.source_url ?? null,
    utm_source: input.utm?.source ?? null,
    utm_medium: input.utm?.medium ?? null,
    utm_campaign: input.utm?.campaign ?? null,
    utm_content: input.utm?.content ?? null,
    utm_term: input.utm?.term ?? null,
    locale: input.locale,
    budget_tier: input.budget_tier ?? null,
    notes: input.notes ?? null,
  };
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert(insert)
    .select('id')
    .single();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[leads] insert error:', error.message);
    return null;
  }
  return data;
}
```

- [ ] **Step 8: Run typecheck + commit**

```bash
pnpm tsc --noEmit
git add src/lib/
git commit -m "feat(lib): add Supabase, Upstash, sanitize, turnstile, leads helpers"
```

---

## Task 2.3: Site config files (services, pricing, nav, industries, solutions)

**Owner:** `backend-developer` · **Effort:** 1 h · **Roman blocker:** No (data is from spec) · **Depends on:** 2.1.

**Files:**
- Create: `src/config/site.ts`
- Create: `src/config/services.ts`
- Create: `src/config/pricing.ts`
- Create: `src/config/industries.ts`
- Create: `src/config/solutions.ts`
- Create: `src/config/nav.ts`

**Acceptance criteria:**
- `import { auditTiers } from '@/config/pricing'` returns 3 tiers, each with CZK + EUR ranges per `architecture.md` §5.3.
- `import { services } from '@/config/services'` returns 18 services across 4 categories.
- All literals are `as const` for narrow types.

**Steps:**

- [ ] **Step 1: `src/config/pricing.ts`**

```typescript
export const auditTiers = [
  {
    id: 'tier-1',
    slug: 'komplexni-podnikovy-audit',
    titleCs: 'Komplexní podnikový audit',
    titleEn: 'Comprehensive Business Audit',
    sessions: '3–4',
    durationCs: '1–3 týdny',
    durationEn: '1–3 weeks',
    eventType: 'tier-1-audit',
    priceRange: { czk: { min: 20000, max: 90000 }, eur: { min: 800, max: 3600 } },
    flagship: true,
  },
  {
    id: 'tier-2',
    slug: 'domenovy-audit',
    titleCs: 'Doménový audit',
    titleEn: 'Domain Audit',
    sessions: '2',
    durationCs: 'několik dní – 2 týdny',
    durationEn: 'few days – 2 weeks',
    eventType: 'tier-2-audit',
    priceRange: { czk: { min: 10000, max: 55000 }, eur: { min: 400, max: 2200 } },
    flagship: false,
  },
  {
    id: 'tier-3',
    slug: 'strategicka-session',
    titleCs: 'Strategická session',
    titleEn: 'Strategic Session',
    sessions: '1',
    durationCs: 'několik dní – 2 týdny',
    durationEn: 'few days – 2 weeks',
    eventType: 'tier-3-audit',
    priceRange: { czk: { min: 4000, max: 25000 }, eur: { min: 160, max: 1000 } },
    flagship: false,
  },
] as const;

export const SCOPING_CALL_EVENT = 'free-scoping-call' as const;

export type AuditTierId = (typeof auditTiers)[number]['id'];
```

- [ ] **Step 2: `src/config/site.ts`**

```typescript
export const site = {
  name: 'VICTA',
  legalName: 'Victa Digital s.r.o.',
  url: 'https://victaagency.com',
  logo: 'https://victaagency.com/logo.png',
  ogImage: 'https://victaagency.com/og/default.png',
  defaultLocale: 'cs' as const,
  locales: ['cs', 'en'] as const,
  contact: {
    email: 'hello@victaagency.com',
    // ⛔ ROMAN-BLOCKER: phone, postal address pending Roman fill
    phone: '[ROMAN-BLOCKER: telefon]',
    addressLine1: '[ROMAN-BLOCKER: ulice + číslo]',
    addressLocality: '[ROMAN-BLOCKER: město]',
    postalCode: '[ROMAN-BLOCKER: PSČ]',
    country: 'CZ' as const,
    ico: '[ROMAN-BLOCKER: IČO]',
    dic: '[ROMAN-BLOCKER: DIČ]',
    spisovaZnacka: '[ROMAN-BLOCKER: spisová značka]',
  },
  social: {
    linkedin: '[ROMAN-BLOCKER: LinkedIn URL — optional]',
  },
  area: { country: ['CZ', 'SK'] as const },
} as const;

export const sameAs = [site.social.linkedin].filter((u) => !u.startsWith('[ROMAN'));
```

- [ ] **Step 3: `src/config/services.ts`** — 18 services per `spec.md` §5

```typescript
export type ServiceCategory = 'it' | 'ai' | 'marketing' | 'cross';

export interface ServiceConfig {
  slug: string;
  category: ServiceCategory;
  titleCs: string;
  titleEn: string;
  shortDescCs: string;
  shortDescEn: string;
}

export const services: readonly ServiceConfig[] = [
  // IT & Vývoj (4)
  { slug: 'weby-na-miru', category: 'it', titleCs: 'Weby na míru', titleEn: 'Custom Websites', shortDescCs: 'Webové stránky stavěné od základů podle vaší značky a cílů.', shortDescEn: 'Bespoke websites built from the ground up for your brand and goals.' },
  { slug: 'eshopy-na-miru', category: 'it', titleCs: 'E-shopy na míru', titleEn: 'Custom E-shops', shortDescCs: 'E-commerce řešení, která rostou s vámi a integrují se s vašimi procesy.', shortDescEn: 'E-commerce that scales with you and integrates with your processes.' },
  { slug: 'integrace', category: 'it', titleCs: 'Integrace', titleEn: 'Integrations', shortDescCs: 'Propojení vašich systémů, dat a workflow do jednoho funkčního celku.', shortDescEn: 'Connect your systems, data and workflows into one functional whole.' },
  { slug: 'custom-vyvoj', category: 'it', titleCs: 'Custom solution development', titleEn: 'Custom Solution Development', shortDescCs: 'Software postavený přesně podle vaší obchodní logiky.', shortDescEn: 'Software built exactly to your business logic.' },
  // AI & Data (5)
  { slug: 'ai-chatboti', category: 'ai', titleCs: 'AI chatboti', titleEn: 'AI Chatbots', shortDescCs: 'Konverzační AI, která rozumí vašim zákazníkům a obchodu.', shortDescEn: 'Conversational AI that understands your customers and business.' },
  { slug: 'ai-automatizace', category: 'ai', titleCs: 'AI automatizace procesů', titleEn: 'AI Process Automation', shortDescCs: 'Eliminujeme manuální práci tam, kde to dává smysl.', shortDescEn: 'We eliminate manual work where it makes sense.' },
  { slug: 'ai-konzultace', category: 'ai', titleCs: 'AI konzultace + audit + strategie', titleEn: 'AI Consulting + Audit + Strategy', shortDescCs: 'Hledáme, kde vám AI přinese největší přidanou hodnotu.', shortDescEn: 'We find where AI brings you the most value.' },
  { slug: 'datova-platforma', category: 'ai', titleCs: 'Datová platforma + integrace', titleEn: 'Data Platform + Integrations', shortDescCs: 'Vaše data sjednocená, čistá a připravená k rozhodování.', shortDescEn: 'Your data unified, clean and ready for decisions.' },
  { slug: 'mlops', category: 'ai', titleCs: 'MLOps / Provoz AI systémů', titleEn: 'MLOps / AI System Operations', shortDescCs: 'Spolehlivý provoz AI v produkci — monitoring, retraining, eskalace.', shortDescEn: 'Reliable AI operations in production — monitoring, retraining, escalation.' },
  // Marketing (7)
  { slug: 'seo', category: 'marketing', titleCs: 'SEO', titleEn: 'SEO', shortDescCs: 'Organická viditelnost, která se vyplatí dlouhodobě.', shortDescEn: 'Organic visibility that pays off long-term.' },
  { slug: 'aeo', category: 'marketing', titleCs: 'AEO', titleEn: 'AEO', shortDescCs: 'Optimalizace pro AI vyhledávače — ChatGPT, Perplexity, Google AI Overviews.', shortDescEn: 'Optimization for AI search — ChatGPT, Perplexity, Google AI Overviews.' },
  { slug: 'ppc-kampane', category: 'marketing', titleCs: 'PPC kampaně', titleEn: 'PPC Campaigns', shortDescCs: 'Placené kampaně s měřitelným dopadem na vaše tržby.', shortDescEn: 'Paid campaigns with measurable impact on your revenue.' },
  { slug: 'social-media', category: 'marketing', titleCs: 'Social media management', titleEn: 'Social Media Management', shortDescCs: 'Strategie + obsah + komunita — dlouhodobá značka, ne náhodné posty.', shortDescEn: 'Strategy + content + community — long-term brand, not random posts.' },
  { slug: 'tvorba-kreativ', category: 'marketing', titleCs: 'Tvorba kreativ', titleEn: 'Creative Production', shortDescCs: 'Vizuální obsah, který funguje — od bannerů po video.', shortDescEn: 'Visual content that works — from banners to video.' },
  { slug: 'ecommerce-management', category: 'marketing', titleCs: 'E-commerce management', titleEn: 'E-commerce Management', shortDescCs: 'Komplexní správa e-shopů od katalogu po retention.', shortDescEn: 'Comprehensive e-shop management from catalog to retention.' },
  { slug: 'marketingova-strategie', category: 'marketing', titleCs: 'Marketingová strategie', titleEn: 'Marketing Strategy', shortDescCs: 'Strategický pohled, který sjednocuje marketing s byznysem.', shortDescEn: 'Strategic view aligning marketing with business.' },
  // Cross-team (2)
  { slug: 'komplexni-transformace', category: 'cross', titleCs: 'Komplexní transformace byznysu', titleEn: 'Comprehensive Business Transformation', shortDescCs: 'Marketing + IT + AI + data — všechno pod jednou střechou.', shortDescEn: 'Marketing + IT + AI + data — all under one roof.' },
  { slug: 'dlouhodoba-sprava', category: 'cross', titleCs: 'Dlouhodobá správa & růst klienta', titleEn: 'Long-term Account & Growth Management', shortDescCs: 'Dlouhodobé partnerství, ne jednorázový projekt.', shortDescEn: 'Long-term partnership, not a one-off project.' },
] as const;
```

- [ ] **Step 4: `src/config/industries.ts`** (6 industries) and `src/config/solutions.ts` (5 solutions) — analogická struktura: `slug`, `titleCs`, `titleEn`, `shortDescCs`, `shortDescEn`. Obsah z `spec.md` §5.

- [ ] **Step 5: `src/config/nav.ts`**

```typescript
import { services } from './services';
import { solutions } from './solutions';
import { industries } from './industries';

export const navStructure = [
  { kind: 'group', labelCs: 'Služby', labelEn: 'Services', href: '/sluzby', children: services.map((s) => ({ slug: s.slug, titleCs: s.titleCs, titleEn: s.titleEn })) },
  { kind: 'group', labelCs: 'Řešení', labelEn: 'Solutions', href: '/reseni', children: solutions.map((s) => ({ slug: s.slug, titleCs: s.titleCs, titleEn: s.titleEn })) },
  { kind: 'group', labelCs: 'Odvětví', labelEn: 'Industries', href: '/odvetvi', children: industries.map((i) => ({ slug: i.slug, titleCs: i.titleCs, titleEn: i.titleEn })) },
  { kind: 'link', labelCs: 'Spolupráce', labelEn: 'How we work', href: '/spoluprace' },
  { kind: 'link', labelCs: 'O nás', labelEn: 'About', href: '/o-nas' },
  { kind: 'link', labelCs: 'Kontakt', labelEn: 'Contact', href: '/kontakt' },
] as const;
```

- [ ] **Step 6: Commit**

```bash
git add src/config/
git commit -m "feat(config): add site, services, pricing, industries, solutions, nav configs"
```

---

## Task 2.4: JSON-LD schema engine

**Owner:** `backend-developer` · **Effort:** 1.5 h · **Roman blocker:** No · **Depends on:** 2.3.

**Files:**
- Create: `src/lib/schema.ts`
- Create: `src/lib/schema-types.ts`
- Create: `src/components/seo/json-ld.tsx`

**Acceptance criteria:**
- `buildOrganizationSchema('cs')` returns valid JSON-LD `Organization` object with `@context`, `name=VICTA`, `url`, `logo`, `contactPoint`, `areaServed`, `sameAs`.
- `<JsonLd data={...} />` renders `<script type="application/ld+json">{stringified}</script>`.
- Validates in Google Rich Results Test (manual verify in Phase 5).
- AR-07 honored: schema engine = single source of truth.

**Steps:**

- [ ] **Step 1: `src/lib/schema-types.ts`**

```typescript
export type JsonLdNode = {
  '@context'?: string;
  '@type': string;
  [key: string]: unknown;
};
```

- [ ] **Step 2: `src/lib/schema.ts`** (key builder functions)

```typescript
import { site, sameAs } from '@/config/site';
import { services, type ServiceConfig } from '@/config/services';
import type { JsonLdNode } from './schema-types';

type Locale = 'cs' | 'en';

export function buildOrganizationSchema(locale: Locale): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: site.logo,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: site.contact.email,
      availableLanguage: ['cs', 'en'],
    },
    areaServed: site.area.country.map((code) => ({ '@type': 'Country', name: code })),
    inLanguage: locale,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

export function buildLocalBusinessSchema(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url: site.url,
    logo: site.logo,
    email: site.contact.email,
    telephone: site.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.addressLine1,
      addressLocality: site.contact.addressLocality,
      postalCode: site.contact.postalCode,
      addressCountry: site.contact.country,
    },
    areaServed: site.area.country,
  };
}

export function buildServiceSchema(service: ServiceConfig, locale: Locale): JsonLdNode {
  const title = locale === 'cs' ? service.titleCs : service.titleEn;
  const desc = locale === 'cs' ? service.shortDescCs : service.shortDescEn;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description: desc,
    provider: { '@type': 'Organization', name: site.name, url: site.url },
    areaServed: site.area.country,
    inLanguage: locale,
    url: `${site.url}/${locale}/sluzby/${service.slug}`,
  };
}

export interface FaqEntry { q: string; a: string; }

export function buildFaqSchema(faqs: readonly FaqEntry[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function buildBreadcrumbSchema(items: readonly { name: string; url: string }[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
```

- [ ] **Step 3: `src/components/seo/json-ld.tsx`** (Server Component)

```tsx
import type { JsonLdNode } from '@/lib/schema-types';

export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/schema.ts src/lib/schema-types.ts src/components/seo/
git commit -m "feat(seo): JSON-LD schema engine (Org, LocalBusiness, Service, FAQ, Breadcrumb)"
```

---

## Task 2.5: Cookiebot + GA4 + Sentry (consent-gated, Phase 5 verifies live)

**Owner:** `frontend-developer` (Cookiebot/GA4) + `devops-engineer` (Sentry init) · **Effort:** 3 h · **Roman blocker:** ⛔ **Cookiebot CBID, GA4 Measurement ID, Sentry DSN, all 2FA accounts created** — code can be written with placeholders, but runtime verification (Phase 5 SC-09) requires Roman to provision accounts per `docs/setup/vendor-setup-checklist.md` §2-4. · **Depends on:** 2.1.

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/consent/cookiebot-script.tsx`
- Create: `src/components/consent/ga4-loader.tsx`
- Create: `src/lib/ga4.ts`
- Create: `src/lib/consent.ts`
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Create: `instrumentation.ts`
- Modify: `next.config.ts` (or `.mjs`) — add `withSentryConfig`

**Acceptance criteria:**
- Fresh browser → Cookiebot banner appears within 2s of page load.
- Zero `googletagmanager.com` or `google-analytics.com` requests until user clicks "Přijmout vše".
- After consent, `gtag('event', 'page_view', { ... })` fires; visible in GA4 DebugView.
- Sentry captures a deliberately-thrown server-side error (test in Phase 5).
- CSP exception `script-src https://consent.cookiebot.com https://consentcdn.cookiebot.com https://www.googletagmanager.com` already present in `vercel.json` (verify).

**Steps:**

- [ ] **Step 1: `src/lib/consent.ts`**

```typescript
'use client';

declare global {
  interface Window {
    Cookiebot?: {
      consent: { necessary: boolean; preferences: boolean; statistics: boolean; marketing: boolean };
      hasResponse: boolean;
      regulations: { gdprApplies: boolean };
    };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentCategory = 'necessary' | 'preferences' | 'statistics' | 'marketing';

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return window.Cookiebot?.consent.statistics === true;
}

export function onConsentChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const fn = () => handler();
  window.addEventListener('CookiebotOnConsentReady', fn);
  window.addEventListener('CookiebotOnAccept', fn);
  window.addEventListener('CookiebotOnDecline', fn);
  return () => {
    window.removeEventListener('CookiebotOnConsentReady', fn);
    window.removeEventListener('CookiebotOnAccept', fn);
    window.removeEventListener('CookiebotOnDecline', fn);
  };
}
```

- [ ] **Step 2: `src/components/consent/cookiebot-script.tsx`** (Server Component, `<head>`-rendered)

```tsx
import Script from 'next/script';

export function CookiebotScript() {
  const cbid = process.env.NEXT_PUBLIC_COOKIEBOT_ID;
  if (!cbid || cbid.startsWith('your-')) {
    // Roman has not provisioned Cookiebot yet — skip in dev/preview to avoid console noise
    return null;
  }
  return (
    <Script
      id="Cookiebot"
      src="https://consent.cookiebot.com/uc.js"
      data-cbid={cbid}
      data-blockingmode="auto"
      type="text/javascript"
      strategy="beforeInteractive"
    />
  );
}
```

- [ ] **Step 3: `src/components/consent/ga4-loader.tsx`**

```tsx
'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasAnalyticsConsent, onConsentChange } from '@/lib/consent';

export function Ga4Loader() {
  const [loaded, setLoaded] = useState(false);
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  useEffect(() => {
    if (!measurementId || measurementId.startsWith('G-XXX')) return;
    if (hasAnalyticsConsent()) setLoaded(true);
    const off = onConsentChange(() => {
      if (hasAnalyticsConsent()) setLoaded(true);
    });
    return off;
  }, [measurementId]);

  if (!loaded || !measurementId) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}
```

- [ ] **Step 4: `src/lib/ga4.ts`** (event helper, consent-gated)

```typescript
'use client';

import { hasAnalyticsConsent } from './consent';

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
```

- [ ] **Step 5: Sentry init files** (per `docs/setup/sentry-config.md` paste-ready)

`sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend(event) {
    // Strip PII from error payloads (REQ-NF-046, claude-rules §13)
    if (event.user) delete event.user;
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers) {
      delete event.request.headers['cookie'];
      delete event.request.headers['authorization'];
    }
    return event;
  },
});
```

`sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.user) delete event.user;
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.data) {
      // Never log form bodies (PII) into Sentry
      event.request.data = '[REDACTED]';
    }
    return event;
  },
});
```

`sentry.edge.config.ts`: same minimal init for edge runtime.

`instrumentation.ts`:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
```

- [ ] **Step 6: Modify `src/app/layout.tsx`** — render `<CookiebotScript />` and `<Ga4Loader />` inside `<head>`/`<body>` per `next/script` strategy. Use `Edit` not `Write` (Phase 1.2 may have written it).

- [ ] **Step 7: Commit**

```bash
git add src/lib/consent.ts src/lib/ga4.ts src/components/consent/ \
  sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts \
  instrumentation.ts next.config.* src/app/layout.tsx
git commit -m "feat(observability): Cookiebot CMP + GA4 consent-gated loader + Sentry init"
```

---

## Task 2.6: Audit page (`/cs/spoluprace`) — interactive elements only

**Owner:** `frontend-developer` · **Effort:** 4 h · **Roman blocker:** ⛔ Czech copy review (Roman přečte texty před commitem); ⛔ Cal.com event types musí existovat (per `docs/setup/calcom-event-types.md`). · **Depends on:** 2.3, 2.4, 2.5, 2.7 (booking widget). · **Note:** Phase 1.2 zřejmě napíše page-shell. Tento task PŘIDÁVÁ tier cards + booking integration + Path B copy + FAQ.

**Files:**
- Modify: `src/app/[locale]/spoluprace/page.tsx` (existing — Edit only)
- Create: `src/components/booking/audit-tier-card.tsx`
- Create: `src/components/seo/faq-block.tsx`
- Create: `src/components/seo/evidence-panel.tsx`
- Modify: `content/cs/strings/common.json` (add tier copy keys)

**Acceptance criteria:**
- 3 tier cards rendered with CZK pricing on `/cs/spoluprace`, EUR on `/en` (i18n locale).
- Tier 1 visually marked flagship (border `var(--accent)` ring).
- Each card has CTA button → opens booking widget (Task 2.7).
- "Path B faktura" copy under each card: "Po rezervaci obdržíte do 24 hodin fakturu k úhradě bankovním převodem. Audit zahájíme po potvrzení platby."
- FAQ block with min 5 entries renders + injects FAQPage schema.
- EvidencePanel renders methodology block on page.
- Lighthouse mobile ≥ 90 against preview deploy.

**Steps:**

- [ ] **Step 1: `src/components/booking/audit-tier-card.tsx`** — uses `var(--*)` tokens only (AR-10, claude-rules §8).

- [ ] **Step 2: `src/components/seo/faq-block.tsx`** — `<details>`/`<summary>` accessible pattern + `<JsonLd data={buildFaqSchema(faqs)} />`.

- [ ] **Step 3: `src/components/seo/evidence-panel.tsx`** — methodology block (server component, no JS).

- [ ] **Step 4: Edit `src/app/[locale]/spoluprace/page.tsx`** to import + render TierCards × 3, EvidencePanel, FaqBlock. Wire CTAs to `<BookingCta tier="tier-1" />` (Task 2.7).

- [ ] **Step 5: Czech copy** — write into `content/cs/strings/common.json` under `spoluprace.*` namespace with proper Czech typography (`„uvozovky"`, em-dashes, nbsp po `k`, `s`, `v`, `z`, `o`, `u`, `i`, `a`).

- [ ] **Step 6: Roman copy review** — ⛔ ROMAN-BLOCKER: Roman přečte sekce 1-8, schválí. Status update do `.workforce/parallel-session-status.md`.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(spoluprace): tier cards, Path B copy, FAQ block, evidence panel"
```

---

## Task 2.7: Booking widget (Cal.com Atoms wrapper)

**Owner:** `frontend-developer` · **Effort:** 2 h · **Roman blocker:** ⛔ Cal.com username + 4 event types (`tier-1-audit`, `tier-2-audit`, `tier-3-audit`, `free-scoping-call`) zřízené v Cal.com per `docs/setup/calcom-event-types.md`. · **Depends on:** 2.3.

**Files:**
- Create: `src/components/booking/cal-booking-widget.tsx`
- Create: `src/components/booking/booking-cta.tsx`
- Create: `src/components/booking/booking-fallback.tsx`
- Modify: `vercel.json` (CSP `frame-src https://app.cal.com` already present — verify)

**Acceptance criteria:**
- `<BookingCta tier="tier-1" labelCs="Rezervovat Tier 1 audit" />` renders button; on click, Cal.com Atoms inline embed opens.
- `eventSlug` prop maps `tier-1` → `tier-1-audit`, `free` → `free-scoping-call`.
- CLS contribution ≤ 0.01 (REQ-F-040) — preserve container height.
- Fallback message after 8s timeout: "Formulář je momentálně nedostupný — kontaktujte nás na hello@victaagency.com".
- GA4 event `booking_initiated { booking_type, source_page }` fires on widget open (only after consent).
- Theme passes through (light/dark) — read `data-theme` on `document.documentElement`.

**Steps:**

- [ ] **Step 1: `src/components/booking/cal-booking-widget.tsx`** (Client Component)

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/ga4';

interface Props {
  eventSlug: string;
  bookingType: 'audit_t1' | 'audit_t2' | 'audit_t3' | 'scoping_call';
  sourcePage: string;
}

declare global {
  interface Window { Cal?: ((cmd: string, ...args: unknown[]) => void) & { ns?: Record<string, unknown> }; }
}

export function CalBookingWidget({ eventSlug, bookingType, sourcePage }: Props) {
  const username = process.env.NEXT_PUBLIC_CALCOM_USERNAME ?? 'victa';
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const theme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light';
    // Cal.com inline embed loader (per Atoms docs)
    (function (C: Window, A: string, L: string) {
      const cal = (C as any)[A] || function () { ((cal as any).q = (cal as any).q || []).push(arguments); };
      (C as any)[A] = cal;
      const d = document.createElement('script');
      d.src = L;
      d.async = true;
      d.onload = () => { /* loaded */ };
      d.onerror = () => setFailed(true);
      document.head.appendChild(d);
    })(window, 'Cal', 'https://app.cal.com/embed/embed.js');

    timeout = setTimeout(() => {
      if (!ref.current?.querySelector('iframe')) setFailed(true);
    }, 8000);

    if (window.Cal) {
      window.Cal('init', { origin: 'https://app.cal.com' });
      window.Cal('inline', {
        elementOrSelector: ref.current ?? undefined,
        calLink: `${username}/${eventSlug}`,
        config: { theme, layout: 'month_view' },
      });
    }
    trackEvent('booking_initiated', { booking_type: bookingType, source_page: sourcePage });
    return () => clearTimeout(timeout);
  }, [eventSlug, bookingType, sourcePage, username]);

  if (failed) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--ink)]">
        Formulář je momentálně nedostupný — kontaktujte nás na{' '}
        <a className="underline" href="mailto:hello@victaagency.com">hello@victaagency.com</a>.
      </div>
    );
  }

  return <div ref={ref} className="min-h-[600px]" data-cal-namespace={eventSlug} />;
}
```

- [ ] **Step 2: `src/components/booking/booking-cta.tsx`** — Server Component with Client island for the open-modal trigger. (Or use Cal.com popup mode — viz `docs/setup/calcom-event-types.md`.)

- [ ] **Step 3: Verify `vercel.json` CSP**: `frame-src 'self' https://app.cal.com https://challenges.cloudflare.com` already present.

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/ vercel.json
git commit -m "feat(booking): Cal.com Atoms inline widget + fallback + GA4 event"
```

---

## Task 2.8: Booking webhook handler (`/api/booking-webhook`)

**Owner:** `backend-developer` · **Effort:** 3 h · **Roman blocker:** ⛔ `CALCOM_WEBHOOK_SECRET` v Vercel env vars (Roman vytvoří v Cal.com → kopíruje do Vercel). · **Depends on:** 2.2.

**Files:**
- Create: `src/app/api/booking-webhook/route.ts`
- Modify: `vercel.json` (function `maxDuration: 10` already present — verify).

**Acceptance criteria:**
- POST with no/invalid `X-Cal-Signature-256` returns **401**, no Supabase write.
- POST with timestamp older than 300s returns **401** (replay protection, AR-11).
- Duplicate `cal_booking_id` returns **200** but does NOT write a second row (idempotency via Upstash NX key, 24h TTL).
- Valid `BOOKING_CREATED` writes one row to `booking_events` with `webhook_signature_verified=true`, `invoice_status='pending_invoice'`, full `raw_payload`.
- Upserts `leads` with `source='booking'`, links `booking_events.lead_id`.
- Logs only `{ event_type, audit_tier, scheduled_for }` — no PII (claude-rules §13).
- Cache-Control: `no-store`.

**Steps:**

- [ ] **Step 1: Write Vitest unit test** `src/app/api/booking-webhook/route.test.ts` covering: missing signature, valid signature, invalid signature, replay (old timestamp), idempotency (same cal_booking_id twice).

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm vitest src/app/api/booking-webhook
# Expected: FAIL — handler not implemented
```

- [ ] **Step 3: Write `src/app/api/booking-webhook/route.ts`**

```typescript
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { wasWebhookProcessed, hashIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_AGE_SECONDS = 300; // 5 min replay window (AR-11, security-model.md §4.10)

interface CalWebhookPayload {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED' | 'BOOKING_REJECTED';
  createdAt: string;
  payload: {
    bookingId: number | string;
    uid?: string;
    type?: string;
    eventTypeId?: number;
    eventType?: { slug?: string };
    title?: string;
    startTime?: string;
    endTime?: string;
    attendees?: Array<{ email?: string; name?: string; timeZone?: string }>;
    metadata?: Record<string, unknown>;
  };
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

function tierFromEventSlug(slug?: string): 'tier_1' | 'tier_2' | 'tier_3' | 'free_scoping' | null {
  switch (slug) {
    case 'tier-1-audit': return 'tier_1';
    case 'tier-2-audit': return 'tier_2';
    case 'tier-3-audit': return 'tier_3';
    case 'free-scoping-call': return 'free_scoping';
    default: return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }
  const signature = req.headers.get('x-cal-signature-256') ?? '';
  if (!signature) {
    return NextResponse.json({ error: 'missing-signature' }, { status: 401 });
  }
  const raw = await req.text();
  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: 'invalid-signature' }, { status: 401 });
  }
  let payload: CalWebhookPayload;
  try {
    payload = JSON.parse(raw) as CalWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  // Replay protection — webhook createdAt must be within MAX_AGE_SECONDS
  const created = Date.parse(payload.createdAt);
  if (!Number.isFinite(created) || Math.abs(Date.now() - created) > MAX_AGE_SECONDS * 1000) {
    return NextResponse.json({ error: 'stale' }, { status: 401 });
  }

  const calBookingId = String(payload.payload.bookingId ?? payload.payload.uid ?? '');
  if (!calBookingId) {
    return NextResponse.json({ error: 'missing-booking-id' }, { status: 400 });
  }

  // Idempotency
  if (await wasWebhookProcessed(calBookingId)) {
    return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
  }

  const tier = tierFromEventSlug(payload.payload.eventType?.slug);
  const attendee = payload.payload.attendees?.[0];

  // Upsert lead (only on CREATED — cancel/reschedule re-uses)
  let leadId: string | null = null;
  if (payload.triggerEvent === 'BOOKING_CREATED' && attendee?.email) {
    const lead = await upsertLead({
      email: attendee.email,
      name: attendee.name ?? null,
      source: 'booking',
      locale: 'cs', // booking widget on /cs only at launch; refine post-launch
    });
    leadId = lead?.id ?? null;
  }

  const eventTypeMap: Record<CalWebhookPayload['triggerEvent'], 'BOOKING_CREATED' | 'RESCHEDULED' | 'CANCELLED' | 'REJECTED'> = {
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_RESCHEDULED: 'RESCHEDULED',
    BOOKING_CANCELLED: 'CANCELLED',
    BOOKING_REJECTED: 'REJECTED',
  };

  const { error } = await supabaseAdmin.from('booking_events').insert({
    lead_id: leadId,
    cal_booking_id: calBookingId,
    event_type: eventTypeMap[payload.triggerEvent],
    audit_tier: tier,
    attendee_email: attendee?.email ?? null,
    attendee_name: attendee?.name ?? null,
    scheduled_for: payload.payload.startTime ?? null,
    invoice_status: payload.triggerEvent === 'BOOKING_CREATED' && tier !== 'free_scoping' ? 'pending_invoice' : null,
    invoice_id: null,
    webhook_signature_verified: true,
    raw_payload: payload,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[booking-webhook] insert error:', error.message);
    return NextResponse.json({ error: 'storage' }, { status: 500 });
  }

  // PII-free log (claude-rules §13)
  // eslint-disable-next-line no-console
  console.log('[booking-webhook] processed', { event: payload.triggerEvent, tier, scheduled: payload.payload.startTime });

  return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
```

- [ ] **Step 4: Run tests, ensure all pass**

```bash
pnpm vitest src/app/api/booking-webhook
# Expected: 5 tests PASS
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/booking-webhook/
git commit -m "feat(api): Cal.com booking webhook with HMAC verify, replay, idempotency"
```

---

## Task 2.9: Contact form (`/cs/kontakt` + `/api/contact`)

**Owner:** `backend-developer` (API) + `frontend-developer` (form UI) · **Effort:** 5 h · **Roman blocker:** ⛔ Resend API keys + verified domain (per `dns-records.md`); ⛔ Turnstile site/secret keys; ⛔ Roman email destination; ⛔ Czech copy review. · **Depends on:** 2.2, 2.4, 2.5.

**Files:**
- Create: `src/app/api/contact/route.ts`
- Create: `src/components/forms/contact-form.tsx`
- Create: `src/components/forms/turnstile-widget.tsx`
- Create: `src/components/forms/gdpr-consent.tsx`
- Create: `src/components/forms/form-status.tsx`
- Create: `src/lib/contact-schema.ts` (shared Zod schema, client + server)
- Create: `src/app/[locale]/kontakt/page.tsx`
- Create: `content/cs/strings/forms.json`

**Acceptance criteria:**
- Form validates client-side (React Hook Form + Zod) before submit; inline errors per field.
- Submit POST `/api/contact` → 200 within 60s; success message visible without page reload.
- Honeypot field non-empty → silent 200 + no Supabase row + no Resend call.
- Turnstile token verified server-side; missing/invalid → 400.
- Rate limit 5/IP/600s — 6th submission returns 429.
- Successful submission writes `contact_submissions` row + upserts `leads` row.
- Resend email arrives in Roman's inbox with formatted PII content.
- GA4 event `contact_form_submit { form_location: "contact_page" }` fires on success.
- GDPR consent checkbox required; submission blocks without it.
- Inputs HTML-stripped server-side (`sanitizeFormString`).
- Origin header validated (security-model.md §4.3).

**Steps:**

- [ ] **Step 1: `src/lib/contact-schema.ts`** (shared Zod)

```typescript
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Zadejte prosím své jméno.').max(100),
  email: z.string().trim().email('Zadejte platný e-mail.').max(254),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().min(20, 'Zpráva musí mít alespoň 20 znaků.').max(2000),
  budget_tier: z.enum(['under_5k', '5k-25k', '25k-100k', '100k+']).optional(),
  service_interest: z.enum(['comprehensive', 'web', 'marketing', 'ai', 'other']).optional(),
  gdpr_consent: z.literal(true, { errorMap: () => ({ message: 'Pro odeslání souhlasíte se zpracováním údajů.' }) }),
  honeypot: z.string().max(0).optional().or(z.literal('')),
  turnstile_token: z.string().min(1, 'Bot kontrola se nepodařila — zkuste znovu.'),
  locale: z.enum(['cs', 'en']).default('cs'),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
```

- [ ] **Step 2: API route `src/app/api/contact/route.ts`**

```typescript
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/lib/contact-schema';
import { sanitizeFormString } from '@/lib/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkLimit, hashIp } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';
import { upsertLead } from '@/lib/leads';
import { site } from '@/config/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function originOk(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return u.hostname === new URL(site.url).hostname || u.hostname.endsWith('.vercel.app');
  } catch { return false; }
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '0.0.0.0';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!originOk(req)) {
    return NextResponse.json({ error: 'origin' }, { status: 403 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot — silent success
  if (data.honeypot && data.honeypot.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Turnstile
  const ts = await verifyTurnstileToken(data.turnstile_token, clientIp(req));
  if (!ts.success) {
    return NextResponse.json({ error: 'turnstile', codes: ts.errorCodes }, { status: 400 });
  }

  // Rate limit (per-IP, fail-open)
  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const rl = await checkLimit('contact', ipHash);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate-limit', retryAt: rl.reset }, { status: 429 });
  }

  // Sanitize
  const name = sanitizeFormString(data.name, 100);
  const company = data.company ? sanitizeFormString(data.company, 120) : null;
  const phone = data.phone ? sanitizeFormString(data.phone, 40) : null;
  const message = sanitizeFormString(data.message, 2000);

  // Upsert lead
  const lead = await upsertLead({
    email: data.email,
    name,
    company,
    phone,
    source: 'contact_form',
    source_url: req.headers.get('referer'),
    locale: data.locale,
    budget_tier: data.budget_tier ?? null,
  });

  // Send email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY_CONTACT);
  let resendId: string | null = null;
  try {
    const r = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'hello@victaagency.com',
      to: [process.env.CONTACT_DESTINATION_EMAIL ?? 'l.trung03@gmail.com'],
      replyTo: data.email,
      subject: `[VICTA] Nová poptávka od ${name}`,
      text: [
        `Jméno: ${name}`,
        `E-mail: ${data.email}`,
        `Společnost: ${company ?? '-'}`,
        `Telefon: ${phone ?? '-'}`,
        `Rozsah: ${data.budget_tier ?? '-'}`,
        `Služba: ${data.service_interest ?? '-'}`,
        `Locale: ${data.locale}`,
        '',
        'Zpráva:',
        message,
      ].join('\n'),
    });
    resendId = r.data?.id ?? null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contact] resend error:', (err as Error).message);
  }

  // Insert submission
  const { error } = await supabaseAdmin.from('contact_submissions').insert({
    lead_id: lead?.id ?? null,
    email: data.email.toLowerCase(),
    name,
    company,
    phone,
    service_interest: data.service_interest ?? null,
    budget_tier: data.budget_tier ?? null,
    message,
    locale: data.locale,
    ip_hash: ipHash,
    user_agent: req.headers.get('user-agent')?.slice(0, 256) ?? null,
    honeypot_passed: true,
    resend_email_id: resendId,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[contact] supabase insert error:', error.message);
    return NextResponse.json({ error: 'storage' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Zpráva odeslána' }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
```

- [ ] **Step 3: Form components** — `turnstile-widget.tsx`, `gdpr-consent.tsx`, `form-status.tsx`, `contact-form.tsx` (RHF + Zod, client component, render Turnstile widget per `docs/setup/turnstile-config.md`).

- [ ] **Step 4: Page `src/app/[locale]/kontakt/page.tsx`** — SSG; render `<ContactForm />`, contact info block, business address, response time text, `<JsonLd data={buildLocalBusinessSchema()} />`.

- [ ] **Step 5: Tests** — Vitest API route (origin reject, validation, turnstile fail, honeypot, rate-limit, success); Playwright E2E (fill form, submit, see success).

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(contact): /api/contact + form UI + Turnstile + Supabase + Resend"
```

---

## Task 2.10: Newsletter signup (`NewsletterSignup` + `/api/newsletter`)

**Owner:** `backend-developer` (API) + `frontend-developer` (component) · **Effort:** 4 h · **Roman blocker:** ⛔ Resend audience created (`RESEND_AUDIENCE_ID`); ⛔ welcome email designed (Roman + frontend-developer; React Email template); ⛔ Czech advokát potvrdí lawful basis (OI-W04). · **Depends on:** 2.2, 2.5.

**Files:**
- Create: `src/app/api/newsletter/route.ts`
- Create: `src/components/forms/newsletter-signup.tsx`
- Create: `src/lib/newsletter-schema.ts`
- Create: `src/emails/welcome.tsx` (React Email template)
- Create: `src/lib/resend-newsletter.ts` (audience + send wrappers)

**Acceptance criteria:**
- POST `/api/newsletter` with valid email + Turnstile + GDPR consent → 200 with confirm message.
- Subscriber added to Resend audience `RESEND_AUDIENCE_ID` with double opt-in (Resend native).
- Welcome email designed in React Email; renders correctly in Gmail/Apple Mail/Outlook (Phase 5 verifies).
- `newsletter_subscribers` row written with `consented_at`, `consent_text`, `ip_hash`, `locale`, UTM.
- Duplicate email returns 200 silently (no leak).
- Rate limit 3/IP/3600s.
- GA4 event `newsletter_signup { form_location }` fires.
- DMARC/DKIM/SPF passes (Phase 5 test).

**Steps:**

- [ ] **Step 1: `src/lib/newsletter-schema.ts`**

```typescript
import { z } from 'zod';

export const NEWSLETTER_CONSENT_TEXT_CS = 'Souhlasím se zpracováním e-mailové adresy pro odběr newsletteru VICTA. Souhlas mohu kdykoli odvolat.';
export const NEWSLETTER_CONSENT_TEXT_EN = 'I consent to processing my email for the VICTA newsletter. I can withdraw consent at any time.';

export const newsletterSchema = z.object({
  email: z.string().trim().email('Zadejte platný e-mail.').max(254),
  locale: z.enum(['cs', 'en']).default('cs'),
  form_location: z.enum(['homepage', 'blog', 'footer', 'kontakt', 'spoluprace']).default('homepage'),
  gdpr_consent: z.literal(true),
  turnstile_token: z.string().min(1),
  utm_source: z.string().max(80).optional(),
  utm_medium: z.string().max(80).optional(),
  utm_campaign: z.string().max(80).optional(),
});

export type NewsletterValues = z.infer<typeof newsletterSchema>;
```

- [ ] **Step 2: API route** mirrors `/api/contact` structure with `Resend.contacts.create({ audienceId, email, unsubscribed: false })` + welcome email send via React Email template.

- [ ] **Step 3: Welcome email template** `src/emails/welcome.tsx` using `@react-email/components`. Czech copy. Aligns with LOCKED design tokens (Inter Tight + indigo). Verify renders in Gmail/Apple/Outlook (Phase 5).

- [ ] **Step 4: NewsletterSignup component** — reusable, used in homepage hero footer, blog placeholder, site footer. Accepts `formLocation` prop.

- [ ] **Step 5: Tests** — same pattern as contact form.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(newsletter): /api/newsletter + Resend audience + welcome email + signup component"
```

---

## Task 2.11: GA4 event taxonomy — wire the 11 events

**Owner:** `frontend-developer` · **Effort:** 2 h · **Roman blocker:** No (uses placeholder GA4 ID; Phase 5 verifies live). · **Depends on:** 2.5, 2.7, 2.9, 2.10.

**Files:**
- Modify: `src/components/booking/cal-booking-widget.tsx` (event already wired in 2.7)
- Modify: `src/components/forms/contact-form.tsx`
- Modify: `src/components/forms/newsletter-signup.tsx`
- Modify: `src/components/locale-switcher.tsx` (use Edit — Phase 1.2 owns)
- Modify: `src/components/theme-toggle.tsx` (use Edit — Phase 1.2 owns)
- Create: `docs/ga4-event-taxonomy.md`

**Acceptance criteria:**
Each of the 11 events fires once on its trigger, only when consent is granted, with the correct params:
- `booking_initiated { booking_type, source_page }` — Cal widget open (Task 2.7).
- `booking_completed` — fired server-side from `/api/booking-webhook` via GA4 Measurement Protocol (optional, deferred to Phase 5 if `GA4_MEASUREMENT_PROTOCOL_SECRET` not provisioned).
- `contact_form_submit { form_location: "contact_page" }`
- `newsletter_signup { form_location }`
- `chatbot_session_started`, `chatbot_message_sent`, `chatbot_handoff_clicked`, `chatbot_limit_reached` — STUBS (chatbot deferred D-002, but event util exists for Phase 3 reactivation).
- `locale_switched { from_locale, to_locale }`
- `theme_toggled { to_theme }`
- `cookie_consent_given` / `cookie_consent_declined` — wired from `Cookiebot.onaccept` / `onreject` callbacks.

**Steps:**

- [ ] **Step 1: Edit components to call `trackEvent(...)` at the right moment.** Use `Edit` tool, not `Write`.
- [ ] **Step 2: Document in `docs/ga4-event-taxonomy.md`** — table of 11 events, params, where fired, custom dimensions (`locale`, `theme`, `page_type`).
- [ ] **Step 3: Commit**

```bash
git commit -m "feat(analytics): wire 11 GA4 conversion events with consent gate"
```

---

## Task 2.12: Phase 2 test suite (Vitest + Playwright)

**Owner:** `test-writer` · **Effort:** 4 h · **Roman blocker:** No · **Depends on:** 2.7, 2.8, 2.9, 2.10, 2.11.

**Files:**
- Create: `e2e/contact-form.spec.ts`
- Create: `e2e/newsletter.spec.ts`
- Create: `e2e/booking.spec.ts`
- Create: `e2e/locale-theme.spec.ts`
- Create: `src/lib/__tests__/sanitize.test.ts`
- Create: `src/lib/__tests__/rate-limit.test.ts`
- Modify: `src/app/api/contact/route.test.ts`
- Modify: `src/app/api/newsletter/route.test.ts`

**Acceptance criteria:**
- `pnpm vitest run` passes ≥ 90% lines on `src/lib/*` and `src/app/api/*`.
- `pnpm e2e` passes 5 specs against `pnpm dev` localhost.
- E2E booking spec stubs Cal.com (block embed network, assert fallback message).
- E2E contact form spec submits valid + invalid + rate-limited.
- Locale-theme spec switches locale + theme, verifies tokens applied.

**Steps:**

- [ ] Write tests, run, fix until green.
- [ ] Commit:

```bash
git commit -m "test: Phase 2 unit + E2E suite (forms, booking, locale, theme)"
```

---

# PHASE 5 — SEO, AEO, Pre-Launch QA

**Estimated effort:** 1–2 týdny.
**Owner agents:** `frontend-developer`, `test-writer`, `devops-engineer`, `code-reviewer`, Roman (legal review, vendor verification, CSP sign-off).

**Phase 5 Done = SC-09, SC-10, SC-11, SC-12, SC-13 met. CSP flipped from Report-Only → enforced after Roman sign-off (D-006).**

---

## Task 5.1: Czech typography linter (build-time CI gate)

**Owner:** `devops-engineer` · **Effort:** 2 h · **Roman blocker:** No · **Depends on:** Phase 4 content present.

**Files:**
- Create: `scripts/czech-typography-lint.mjs`
- Modify: `package.json` (add `lint:cs` script)
- Modify: `.github/workflows/ci.yml` (add step)
- Create: `src/lib/__tests__/czech-typography-lint.test.ts` (golden file tests)

**Acceptance criteria:**
- Running `pnpm lint:cs` exits 1 if any `.cs.mdx` or `content/cs/strings/*.json` contains:
  - ASCII quotes `"..."` or `'...'` around Czech words (should be `„..."` / `‚...'`)
  - Bare ` - ` instead of ` — ` (em-dash with thin spaces)
  - Single-letter prepositions `k`, `s`, `v`, `z`, `o`, `u`, `i`, `a` followed by a regular space at line end (need ` ` nbsp)
  - Number+unit without nbsp: `2 500 Kč` ok; `2500 Kč` flagged unless explicitly allowed
- Test golden files: `__tests__/golden/good.json` passes; `bad.json` fails with line numbers.
- CI fails build on violations (AR-08, REQ-NF-036).

**Steps:**

- [ ] **Step 1: Implement linter as Node ESM script** — read all files, parse text, run regex checks, print `file:line: rule violation`, exit code per pass/fail.
- [ ] **Step 2: Add `pnpm lint:cs` script + golden tests + CI step.**
- [ ] **Step 3: Run on existing content; fix violations; commit.**

---

## Task 5.2: robots.txt + sitemap.xml

**Owner:** `frontend-developer` · **Effort:** 1.5 h · **Roman blocker:** No · **Depends on:** Phase 4 pages exist.

**Files:**
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`

**Acceptance criteria:**
- `GET /robots.txt` returns 200 with `User-agent: *`, `Allow: /`, `Disallow: /api/`, `Disallow: /404`, `Disallow: /*?*`, `Sitemap: https://victaagency.com/sitemap.xml`.
- `GET /sitemap.xml` returns valid XML with all 41 public pages, each with `<loc>`, `<lastmod>`, `<xhtml:link rel="alternate" hreflang="cs">`, `<xhtml:link rel="alternate" hreflang="en">`, `<xhtml:link rel="alternate" hreflang="x-default">`.
- Validates against `xmllint --noout sitemap.xml`.

**Steps:**

- [ ] **Step 1: `src/app/robots.ts`**

```typescript
import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/404', '/*?*'] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
```

- [ ] **Step 2: `src/app/sitemap.ts`** — generate from `services`, `solutions`, `industries` configs + static page list. Each entry has `alternates.languages` populated.
- [ ] **Step 3: Commit.**

---

## Task 5.3: llms.txt (AEO authorization)

**Owner:** `Claude Code + Roman` (Czech copy) · **Effort:** 1 h · **Roman blocker:** ⛔ Roman approves citation language. · **Depends on:** Phase 4 services/solutions/industries finalized.

**Files:**
- Create: `public/llms.txt`

**Acceptance criteria:**
- Served at `https://victaagency.com/llms.txt` with `text/plain`.
- Format: H1 `# VICTA — Czech Full-Service Digital Agency`, then `> ` summary blockquote, sections `## Services` (18 services bullets), `## Solutions` (5), `## Industries served` (6), `## Contact`, `## Citation authorization`.
- Each service line max ~120 chars (LLM extraction friendly).

**Steps:**

- [ ] **Step 1: Author content; Roman approves; commit to `public/llms.txt`.**

---

## Task 5.4: Schema markup validation

**Owner:** `test-writer` · **Effort:** 2 h · **Roman blocker:** No (verifies Phase 2/4 work). · **Depends on:** Phase 4 done.

**Files:**
- Create: `e2e/schema-validation.spec.ts`
- Create: `docs/schema-validation-report.md`

**Acceptance criteria:**
- Playwright spec navigates to homepage, `/cs/kontakt`, sample of 5 service pages, sample of 3 industry pages, `/cs/spoluprace`. For each:
  - Extract all `<script type="application/ld+json">` blocks, parse JSON.
  - Assert `@context === 'https://schema.org'`, `@type` matches expected (Organization on homepage, LocalBusiness on kontakt, Service on service pages, FAQPage where FAQ exists).
  - Run against Google Rich Results Test or Schema Markup Validator (manual record results in `docs/schema-validation-report.md`).
- All pass before launch (REQ-F-085..REQ-F-088).

---

## Task 5.5: Meta + OpenGraph + Twitter card audit

**Owner:** `test-writer` · **Effort:** 2 h · **Depends on:** Phase 4 done.

**Files:**
- Create: `e2e/meta-audit.spec.ts`
- Create: `docs/meta-audit-report.md`

**Acceptance criteria:**
- Spec asserts on every of 41 pages: unique `<title>` (50-60 chars), unique `<meta name="description">` (120-160 chars), `<meta property="og:title">`, `og:description`, `og:image` (1200×630 png), `og:url`, `og:type`, `og:locale`, `<meta name="twitter:card" content="summary_large_image">`.
- No duplicates across pages (Set assertion).
- Manual verify 5 representative URLs in Facebook/LinkedIn debugger; record screenshots in report.

---

## Task 5.6: AEO content patterns verification (FAQ + EvidencePanel)

**Owner:** `test-writer` · **Effort:** 1 h · **Depends on:** Phase 4.

**Acceptance criteria:**
- Spec checks `FaqBlock` is rendered on all 18 service + 5 solution + 6 industry pages + `/cs/spoluprace` + homepage = 31+ pages with FAQ schema.
- `EvidencePanel` rendered on homepage and `/cs/spoluprace`.

---

## Task 5.7: Lighthouse CI

**Owner:** `devops-engineer` · **Effort:** 3 h · **Roman blocker:** No · **Depends on:** Phase 4.

**Files:**
- Create: `.lighthouserc.json`
- Modify: `.github/workflows/lighthouse.yml`

**Acceptance criteria:**
- Lighthouse mobile run on homepage, `/cs/sluzby/ai-chatboti`, `/cs/spoluprace`, `/cs/kontakt`.
- Mobile performance ≥ 90 on each. LCP < 2.5s. CLS < 0.1. INP < 200ms.
- CI fails PR if performance regresses below thresholds.

**Steps:**

- [ ] `.lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/cs/",
        "http://localhost:3000/cs/sluzby/ai-chatboti",
        "http://localhost:3000/cs/spoluprace",
        "http://localhost:3000/cs/kontakt"
      ],
      "settings": { "preset": "desktop", "chromeFlags": "--no-sandbox" },
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9, "aggregationMethod": "median" }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

- [ ] GitHub Actions workflow runs `pnpm dlx @lhci/cli autorun` against `pnpm build && pnpm start` preview server.
- [ ] Tune until threshold met (image opt, font preload, code split, ISR). Document tuning in `docs/lighthouse-tuning.md`.

---

## Task 5.8: axe-core a11y full pass

**Owner:** `test-writer` · **Effort:** 3 h · **Depends on:** Phase 4.

**Files:**
- Create: `e2e/a11y.spec.ts`
- Create: `docs/a11y-report.md`

**Acceptance criteria:**
- `@axe-core/playwright` runs on homepage, `/cs/kontakt`, `/cs/sluzby/`, `/cs/spoluprace` in BOTH light and dark themes (8 runs total).
- Zero violations at WCAG 2.1 AA.
- Manual keyboard-nav test pass: Tab through all interactive elements, no traps. Mega-menu Tab/arrow/Escape navigation works.
- VoiceOver (macOS) test: form success/error announced. Document in report.

---

## Task 5.9: Search Console verification + GA4 live verification

**Owner:** `devops-engineer` + Roman · **Effort:** 1 h · **Roman blocker:** ⛔ Roman owns Google account, paste TXT verification record into Namecheap. · **Depends on:** DNS done, sitemap.xml live.

**Acceptance criteria:**
- `victaagency.com` shows as "Verified" in Search Console.
- Sitemap submitted, no errors.
- GA4 DebugView shows all 11 events firing (manual click-through).
- IP anonymization confirmed in GA4 admin.

---

## Task 5.10: Smoke test checklist

**Owner:** `devops-engineer` · **Effort:** 1 h.

**Files:**
- Create: `docs/smoke-test-checklist.md`
- Create: `scripts/smoke-test.mjs` (CLI runner)

**Acceptance criteria:**
- 9-step checklist matches `workplan.md` §5.10.
- `node scripts/smoke-test.mjs https://victaagency.com` runs HTTP-level smoke tests (status, redirect, headers).

---

## Task 5.11: Uptime monitoring + Sentry alerts

**Owner:** `devops-engineer` + Roman · **Effort:** 30 min · **Roman blocker:** ⛔ Roman creates Freshping account.

**Acceptance criteria:**
- Freshping (free tier) configured: check `https://victaagency.com/cs/` every 60s, alert Roman within 5 min on first failure.
- Sentry alert rules: P1 (>10 errors/5min), P2 (new error type), P3 (weekly digest).
- SSL expiry alert at 30 days warning, 7 days critical.

---

## Task 5.12: CSP enforcement flip (D-006)

**Owner:** `devops-engineer` · **Effort:** 1 h · **Roman blocker:** ⛔ ROMAN-BLOCKER: Roman SIGN-OFF required after observing zero CSP violations on preview deploys for ≥7 days (architecture.md §8.2 + decisions.md D-006).

**Files:**
- Modify: `vercel.json`

**Acceptance criteria:**
- Replace header key `Content-Security-Policy-Report-Only` with `Content-Security-Policy` and a separate `Content-Security-Policy-Report-Only` for tighter trial of nonce-based `script-src` (post-launch follow-up).
- Verified via `curl -I https://victaagency.com` — header present.
- DevTools Console: zero CSP violations on first 10 page loads (homepage, kontakt, spoluprace, services, dark mode).

**Steps:**

- [ ] **Step 1: After Phase 4 + Phase 5 stable on preview, monitor Sentry CSP report endpoint for 7 days. Document violation count = 0.**
- [ ] **Step 2: ⛔ ROMAN-BLOCKER: Roman signs off. Status update do `.workforce/parallel-session-status.md`.**
- [ ] **Step 3: Edit `vercel.json` — flip key.**
- [ ] **Step 4: Smoke test on preview, then on production after deploy.**
- [ ] **Step 5: Commit:**

```bash
git commit -m "chore(security): flip CSP from Report-Only to enforced (Roman-approved per D-006)"
```

---

## Task 5.13: Pre-launch security audit

**Owner:** `code-reviewer` · **Effort:** 2 h.

**Files:**
- Create: `docs/pre-launch-security-audit.md`

**Acceptance criteria:** Run + document each:
- [ ] `grep -r "NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*TOKEN" . --include="*.{ts,tsx,js,jsx}"` → 0 results.
- [ ] No `@anthropic-ai/sdk` import anywhere (chatbot deferred): `grep -r "@anthropic-ai/sdk" src/ scripts/` → 0.
- [ ] No `@ai-sdk/anthropic` direct import (AR-01): `grep -r "@ai-sdk/anthropic" src/` → 0.
- [ ] Browser DevTools: zero direct calls to `api.anthropic.com`, `api.resend.com`, `api.upstash.com`, `*.supabase.co` from client side. All via `/api/*`.
- [ ] Browser DevTools fresh session: zero GA4 / GTM requests before consent.
- [ ] Supabase RLS test: query each of 8 tables with anon key → 0 rows. Documented test SQL in report.
- [ ] CSP headers present (Report-Only or enforced after 5.12). HSTS present.
- [ ] `pnpm audit --audit-level critical` → 0.
- [ ] All Vercel Function `console.log` review — no PII (email, name, message body) leaked.
- [ ] `.env*` files NOT in git history: `git log --all --full-history -- .env .env.local .env.production` → empty.
- [ ] `docs/setup/vendor-setup-checklist.md` §9 — all 10 DPAs ticked off (⛔ ROMAN-BLOCKER).

---

# PHASE 6 — Launch + Day-1 Triage

**Estimated effort:** 1 týden.
**Owner agents:** `devops-engineer`, Roman, `test-writer`, `debugger`.

**Phase 6 Done = site live, smoke test green, Roman walkthrough signed, monitoring active.**

---

## Task 6.1: Production launch

**Owner:** `devops-engineer` + Roman · **Effort:** 2 h · **Roman blocker:** ⛔ All 13 launch criteria SC-01..SC-14 (minus SC-03 chatbot deferred) met; ⛔ Roman approves go-live; ⛔ Czech advokát signed off privacy + cookie policy (OI-W05).

**Steps:**

- [ ] **Step 1: Final pre-launch checklist** (workplan.md §6.1). Confirm DNS, HSTS, redirect, Cookiebot banner.
- [ ] **Step 2: Merge release branch to `main` → Vercel deploys to production.**
- [ ] **Step 3: Run smoke test (`scripts/smoke-test.mjs https://victaagency.com`).**
- [ ] **Step 4: Verify `victa.agency` 301 → `victaagency.com`.**
- [ ] **Step 5: Tag release `v1.0.0`.**

```bash
git tag -a v1.0.0 -m "VICTA marketing site launch"
git push origin v1.0.0
```

---

## Task 6.2: Roman + marketing team walkthrough

**Owner:** Roman · **Effort:** 3 h · **Roman blocker:** ⛔ Roman walks all 41 pages, confirms copy, design, CTAs.

**Acceptance criteria:**
- Roman signs off in `.workforce/parallel-session-status.md`: "WALKTHROUGH PASSED 2026-MM-DD".
- Books test audit slot → confirmation email received → Supabase row visible.
- Submits test contact form → email arrives within 60s.
- Switches locale, switches theme, both work.

---

## Task 6.3: Day-1..7 monitoring + triage

**Owner:** `devops-engineer` + Roman · **Effort:** 1 h/day for 7 days.

**Acceptance criteria:**
- Sentry dashboard zero P1; any P2 within 24h of detection.
- Vercel Analytics CWV — flag any route with LCP > 2.5s p75.
- Anthropic console budget unchanged (chatbot deferred).
- Freshping zero downtime.
- GA4 events firing correctly with real traffic.
- Week-1 issue triage doc `docs/week-1-triage.md` populated with bugs/copy issues + status.

---

# Roman blockers — consolidated list

The following items REQUIRE Roman action. Each blocks downstream tasks. When hitting a blocker, append to `.workforce/parallel-session-status.md` "BLOCKED: <id> — <one-line>" and STOP.

| ID | Blocker | Phase | Blocks |
|----|---------|-------|--------|
| RB-01 | Cookiebot account + 2FA + DPA + CBID | 2.5 | GA4 consent gate, Phase 5 SC-09 |
| RB-02 | Sentry account + 2FA + DPA + DSN + auth token | 2.5 | Error tracking live, Phase 5 SC-12 (perf observe) |
| RB-03 | Resend account + 2FA + DPA + domain verified + DKIM/SPF/DMARC DNS pasted in Namecheap + 2 API keys + audience created | 2.9, 2.10 | Contact form delivery, newsletter signup |
| RB-04 | Cloudflare Turnstile account + 2FA + DPA + site key + secret | 2.9, 2.10 | Both forms |
| RB-05 | Upstash Redis account + 2FA + DPA + REST URL/token | 2.2, 2.8, 2.9, 2.10 | All rate limiting + booking idempotency |
| RB-06 | Cal.com account + 2FA + DPA + 4 event types + webhook secret | 2.7, 2.8 | Booking widget, webhook |
| RB-07 | Cal.com event types created (`tier-1-audit`, `tier-2-audit`, `tier-3-audit`, `free-scoping-call`) per `docs/setup/calcom-event-types.md` | 2.7 | Booking widget URL slugs |
| RB-08 | Namecheap email forwarding `*@victaagency.com → l.trung03@gmail.com` (or chosen Roman email) — MX records | 2.9 (contact destination) | Form delivery validation |
| RB-09 | GA4 + Google Search Console verified (TXT in Namecheap) | 5.9 | SC-09, SC-11 |
| RB-10 | Freshping (or equivalent) uptime monitor account | 5.11 | SC-12 monitoring |
| RB-11 | Roman Czech copy review on `/cs/spoluprace` audit tier copy + Path B invoice flow text | 2.6 | Phase 4 milestone 4 |
| RB-12 | Roman Czech copy review on contact page + newsletter welcome email | 2.9, 2.10 | Phase 4 milestone 5 |
| RB-13 | Roman fills 6 legal placeholders: IČO, DIČ, sídlo, spisová značka, telefon, poštovní adresa Victa Digital s.r.o. (in `src/config/site.ts` + `docs/legal/privacy-policy-cs.md` + `docs/legal/cookie-policy-cs.md`) | 2.3, 4.8 | Privacy/Cookie policy publish, LocalBusiness schema, footer |
| RB-14 | Czech advokát review of `privacy-policy-cs.md` + `cookie-policy-cs.md` (OI-W05) | 5 (pre-launch) | Phase 6 launch |
| RB-15 | Sentry "Sensitive" data scrubbing verified for production (`beforeSend` PII strip works on real errors) | 5.13 | Launch |
| RB-16 | CSP Report-Only → enforced flip Roman sign-off after 7 days zero violations on preview (D-006) | 5.12 | Launch with enforced CSP |
| RB-17 | Newsletter lawful basis confirmed (Roman + Czech advokát: consent vs legitimate interest, OI-W04) | 2.10 (consent text final) | Privacy policy text |
| RB-18 | DNSSEC enable in Namecheap (optional hardening) | 5 (pre-launch) | Optional |
| RB-19 | Roman approval to GO-LIVE after Phase 5 done | 6.1 | Production launch |
| RB-20 | Roman walkthrough sign-off on production (all 41 pages, booking, form, locale, theme) | 6.2 | Phase 6 done |

---

# Phase ordering + dependencies

```
Phase 2 sequence:
  2.1 (deps + env) → 2.2 (lib clients) → 2.3 (config) ┐
                                                       ├→ 2.4 (schema engine)
                                                       ├→ 2.5 (Cookiebot/GA4/Sentry) ─┐
                                                       │                              │
  RB-06, RB-07 (Cal.com) ─→ 2.7 (booking widget) ──────┴→ 2.6 (audit page)            │
  RB-05 (Upstash), RB-06 (Cal.com webhook secret) ─→ 2.8 (booking webhook)            │
  RB-03, RB-04, RB-05 ─→ 2.9 (contact form) ───────────────────────────────────────────┤
  RB-03, RB-04, RB-05 ─→ 2.10 (newsletter) ────────────────────────────────────────────┤
                                                                                       │
  All of 2.7, 2.9, 2.10 + RB-01 (Cookiebot) ─→ 2.11 (GA4 events) ─→ 2.12 (tests) ──────┘

Phase 5 sequence (after Phase 4 content + Phase 2 plumbing done):
  5.1 (typo) → 5.2 (sitemap) → 5.3 (llms.txt RB-11) → 5.4 (schema) → 5.5 (meta)
   → 5.6 (AEO patterns) → 5.7 (Lighthouse CI tune) → 5.8 (a11y) → 5.9 (GSC RB-09)
   → 5.10 (smoke test) → 5.11 (uptime RB-10) → 5.12 (CSP flip RB-16) → 5.13 (security audit)

Phase 6 sequence:
  All Phase 5 done + RB-14 + RB-19 → 6.1 (launch) → 6.2 (walkthrough RB-20) → 6.3 (Day-1..7 triage)
```

---

# Self-review

**1. Spec coverage:**
- SC-01 (custom domain HTTPS): Phase 5 §5.10 smoke + Phase 6 §6.1.
- SC-02 (Czech copy): Phase 4 (parallel session) + Roman milestone reviews 2.6/2.9/2.10 copy.
- SC-03 chatbot DEFERRED — out of plan.
- SC-04 (contact form): 2.9.
- SC-05 (booking): 2.7, 2.8, RB-06, RB-07.
- SC-06 (newsletter): 2.10.
- SC-07 (i18n): existing scaffold (Phase 1), tested in 5.5 + 5.10.
- SC-08 (dark mode): existing scaffold (Phase 1), tested in 5.8 axe both themes.
- SC-09 (GA4 + Cookiebot): 2.5 + 2.11 + 5.9.
- SC-10 (robots/sitemap/OG/schema/llms): 5.2, 5.3, 5.4, 5.5.
- SC-11 (GSC indexed): 5.9.
- SC-12 (Lighthouse): 5.7.
- SC-13 (a11y): 5.8.
- SC-14 (team page last): out of plan — Phase 4 task §4.12 owned by parallel session.

**2. AR coverage** (25 architectural rules):
- AR-01 (AI Gateway abstraction): chatbot deferred; verified in 5.13 grep.
- AR-02 (no API key in client): 5.13 grep.
- AR-03 (locale allowlist): existing middleware (Phase 1).
- AR-04, AR-06 (currency from locale only): 2.3 pricing config + 2.6 audit page.
- AR-05, AR-10 (theme tokens): existing tokens; verified in 5.8.
- AR-07 (schema engine): 2.4.
- AR-08 (Czech typography): 5.1.
- AR-09 (GA4 consent gate): 2.5.
- AR-11 (webhook HMAC + replay): 2.8.
- AR-12 (booking dark mode): 2.7 widget.
- AR-13 (`fra1` region): existing `vercel.json`.
- AR-14 (TOTP 2FA): RB list.
- AR-15 (input sanitize): 2.2 sanitize lib (used post-launch when chatbot reactivates).
- AR-16 (prompt caching): chatbot deferred.
- AR-17 (3D rate limit): chatbot deferred; form rate limits in 2.2.
- AR-18 (chatbot persistence): deferred.
- AR-19 (CMP SRI): 2.5 Cookiebot script.
- AR-20 (CSP exceptions documented): existing `vercel.json` + 5.12 flip.
- AR-21 (no client → Supabase): all writes via Vercel Functions in 2.8/2.9/2.10.
- AR-22 (Supabase Frankfurt): existing config.
- AR-23 (migrations versioned): existing.
- AR-24 (chatbot logs Supabase only): deferred.
- AR-25 (Path B invoice): 2.6 + 2.8.

**3. claude-rules.md coverage** (15 rules):
- §1 (AI calls via Gateway only): chatbot deferred.
- §2 (no NEXT_PUBLIC for secrets): 5.13.
- §3 (currency server-side from locale): 2.3 + 2.6.
- §4 (i18n allowlist): existing.
- §5 (3D chatbot rate limit): chatbot deferred.
- §6 (Supabase only via Functions): 2.8/2.9/2.10.
- §7 (Cal.com webhook HMAC + 5min replay): 2.8.
- §8 (theme tokens, no hex in components): all 2.6 + 2.7 components use `var(--*)`.
- §9 (GA4 after consent only): 2.5.
- §10 (Czech typography linter): 5.1.
- §11 (CSP no unsafe-inline, frame-src Cal.com only, connect-src 'self'): 5.12 flip.
- §12 (no chatbot message logging): chatbot deferred; 2.8 booking webhook PII-free log.
- §13 (rendering strategy SSG/ISR/no-store API): all routes follow.
- §14 (team section last): parallel session owns.
- §15 (Vercel `fra1`): existing.

**4. Placeholder scan:** All `[ROMAN-BLOCKER: ...]` placeholders are explicit RB-## items. No "TBD"/"TODO"/"implement later" without a follow-up RB-##.

**5. Type consistency:** `auditTiers`, `services`, `industries`, `solutions` all `as const`; functions reference identical names across tasks (`upsertLead`, `verifyTurnstileToken`, `checkLimit`, `wasWebhookProcessed`, `sanitizeFormString`, `buildOrganizationSchema`, `buildFaqSchema`).

---

# Execution handoff

Plán uložen do `docs/superpowers/specs/2026-05-07-phase-2-5-6-build-plan.md`. Pro execution použij **Inline Execution mode** (`superpowers:executing-plans`) protože:
1. Hodně tasků má Roman-blockery, takže potřebujeme rychle stop+resume v jedné session.
2. Tasks v Phase 2 mají závislosti přes lib helpers — sériová execution v jedné session je rychlejší než dispatch fresh subagentů (každý by načítal kontext znovu).
3. Roman čte status update v `.workforce/parallel-session-status.md` — single-session output je předvídatelnější.
