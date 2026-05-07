# System Architecture: VICTA Marketing Website

**Version**: 1.0
**Date**: 2026-05-06
**Author**: architect agent (Phase 1B)
**Status**: Draft
**Derived from**: spec.md v1.0, security-model.md v1.0, requirements.md v1.0, market-analysis.md v1.0, brainstorm.md (Phase 0), intent.md (Phase -1)

---

## Open Issues (Surface before Phase 1C)

These are unresolved items that the workplan-builder and stack-selector must address. They are NOT blocking architecture completion — the architecture is designed to accommodate any reasonable resolution.

| # | Issue | Impact on Architecture | Source |
|---|-------|----------------------|--------|
| OI-A | Stack selector has not yet run. Architecture assumes Next.js App Router. If Astro is chosen, API route conventions in Section 4 change; inline notes mark the fork points. | Medium | OI-02 in requirements.md |
| OI-B | Cookie consent CMP choice (Cookiebot vs Iubenda vs custom) affects which CSP exceptions are needed. Architecture reserves a `CMP_SCRIPT_SRC` slot in the CSP. | Low | REQ-I-014 |
| OI-C | Booking system final selection (Cal.com cloud free tier confirmed as preference — brainstorm.md decision 17). Architecture assumes Cal.com cloud embed. If swapped, only the adapter module changes. | Low | OI-04 |
| OI-D | Contact form delivery channel (Resend email to Roman vs Slack webhook). Architecture provides a delivery adapter abstraction; both are valid. | Low | OI-05 |
| OI-E | Rate limiting store: Upstash Redis is assumed for per-IP rate limiting. If the stack-selector rejects Upstash, Vercel KV (same API, different pricing) is the drop-in alternative. | Low | security-model.md §4.1 |
| OI-F | Sentry vs alternative error tracker. Architecture assumes Sentry. DSN is an env var. Swapping requires only env var change and one import replacement. | Low | REQ-NF-046 |
| OI-G | Payment path for paid audit tiers: Path A (Cal.com + Stripe) vs Path B (invoice/bank transfer). Architect recommends Path B at launch (simpler, no PCI surface). Roman to confirm. | Medium | security-model.md §3.5 |

---

## 1. Architecture Overview

### 1.1 System Context (C4 Level 1)

```
                      +-----------------------+
  [CZ/SK Medium       |                       |
   Business           |                       |
   Decision-Maker] ===+=====> victaagency.com  |
   (Primary)          |   (VICTA Site)         |
                      |                       |
  [AI Search Engines  |                       |
   ChatGPT/Gemini/    |                       |
   Perplexity] ======>|                       |
   (Secondary)        +-----------+-----------+
                                  |
              +-------------------+--------------------+
              |                   |                    |
              v                   v                    v
   [Vercel AI Gateway]   [Cal.com Cloud]      [Resend]
   (chatbot inference    (booking widget      (newsletter +
    abstraction)          + webhooks)          email delivery)
              |
              v
   [Anthropic Claude API]
   (LLM — fallback-capable
    via AI Gateway)

   Additional external signals (no runtime API calls):
   [Google Analytics 4]  — consent-gated, client-only after opt-in
   [Google Search Console] — DNS/HTML verification token only
   [Namecheap DNS]  — DNS records only, no runtime dependency
```

The site is a single-tenant, no-login marketing presence. Every external API call from the browser is proxied through Vercel Functions. No API key or secret is ever in the client bundle.

### 1.2 Design Decisions Summary

| Decision | Choice | Alternative Considered | Rationale | Reference |
|----------|--------|----------------------|-----------|-----------|
| Framework | Next.js 15 App Router | Astro, SvelteKit | Vercel-native; AI SDK integration; strong TypeScript ecosystem; streaming SSE for chatbot. See OI-A for Astro fallback notes. | OI-02, REQ-F-059 |
| Chatbot inference | Vercel AI Gateway + Vercel AI SDK | Direct Anthropic SDK | Provider-agnostic abstraction; spend controls; prompt caching; model fallback. Hard requirement from intent.md constraint 8. | AR-01, security-model.md §7 Rule 2 |
| Locale routing | Next.js middleware + `/cs/...` and `/en/...` path segments | Subdomain `cs.victa`, separate domains | URL stability at launch — changing post-launch breaks inbound links; path-segment routing is simplest with App Router; aligns with confirmed decision from brainstorm.md §13. | AR-03, REQ-NF-031, I18N-01 |
| Rate limiting store | Upstash Redis (REST API, free tier) | Vercel KV, in-memory | Stateless Vercel Functions need external state for per-IP counters; Upstash REST API is zero-config; replaces gracefully with Vercel KV if needed. | AR-17, security-model.md §4.1 |
| Image optimization | Vercel Image (next/image) | Cloudinary, ImageKit | No additional vendor; AVIF/WebP automatic; locale-aware cache key available. REQ-I-009 confirms Vercel Image is acceptable. | REQ-F-101, REQ-I-009 |
| Cookie consent | Cookiebot (or equivalent CMP) | Custom implementation | GDPR Consent Mode v2 required; Czech DPA has issued fines for non-compliance; CMP handles consent logging which GDPR requires. Custom is risky. security-model.md §4.5 explicitly warns against custom. | REQ-C-003, REQ-I-014, security-model.md §4.5 |
| Email delivery | Resend | SendGrid, Postmark | Confirmed in brainstorm.md decision 12; React Email support; audience management for newsletter; generous free tier; DPA available. | REQ-I-003, REQ-I-013 |
| Booking | Cal.com Cloud free tier | Calendly, Microsoft Bookings | Confirmed preference brainstorm.md decision 13 and decision 17; open source ethos; modern embed API; distinct event types per tier; webhook signing supported. | OI-04, BK-01 |
| Error tracking | Sentry | Datadog, custom logging | Zero-config Vercel integration; client + server error capture from single SDK; free tier sufficient for Year 1 traffic; DSN is just an env var. | REQ-NF-046, REQ-I-008 |
| Data persistence | No database at launch | Vercel Postgres, PlanetScale | All persistent state delegated to SaaS platforms (Resend for subscribers, Cal.com for bookings). Chatbot is stateless. Avoids over-engineering for a content marketing site. | intent.md §Out of scope, OI-G |
| Payment path | Path B: invoice/bank transfer | Path A: Cal.com + Stripe | Zero PCI-DSS surface; simpler at launch; audit is consultative (price agreed in intake), not a fixed-price checkout. Can add Stripe post-launch without architecture change. | security-model.md §3.5 |
| Theme tokens | CSS Custom Properties + next-themes | Tailwind dark: prefix | Server-side token access for SSR; anti-flash inline script works with CSS vars; no Tailwind Dark variant leaking into class lists. | AR-05, AR-10, REQ-F-074 |

---

## 2. Component Architecture

### 2.1 System Diagram (C4 Level 2)

```
+======================================================+
|                   CLIENT LAYER                        |
|   Web Browser (Chrome/Safari/Firefox, mobile+desktop) |
+====================+==================+==============+
                     |                  |
         HTTPS / TLS 1.3       Consent-gated only
         (all traffic)         after user opt-in
                     |                  |
                     |          +-------+-------+
                     |          |   GA4 / GTM   |
                     |          | (googletagmgr)|
                     |          +---------------+
                     |
+====================v==========================================+
|                  VERCEL EDGE LAYER                           |
|                                                              |
|   Vercel CDN (global PoPs)                                   |
|   +---------+  +---------+  +------------------------------+ |
|   | Static  |  | ISR     |  | Next.js Middleware            | |
|   | assets  |  | cached  |  | (locale detection, redirect, | |
|   | (1 yr   |  | pages   |  |  locale allowlist validate)  | |
|   |  cache) |  |(24h TTL)|  +------------------------------+ |
+===+=========+==+=========+==================================+
                     |
                     | Internal Vercel routing
                     v
+======================================================+
|              APP LAYER (Vercel Node.js)               |
|                     region: fra1                      |
|                                                       |
|  +------------------+  +------------------+           |
|  |  Next.js App     |  |  Vercel          |           |
|  |  Router          |  |  Functions       |           |
|  |  (SSG/ISR pages) |  |                  |           |
|  |                  |  |  /api/chat       |           |
|  |  /cs/** pages    |  |  /api/contact    |           |
|  |  /en/** pages    |  |  /api/newsletter |           |
|  |  /[locale]/...   |  |  /api/booking-   |           |
|  |                  |  |   webhook        |           |
|  +------------------+  +------------------+           |
|                                                       |
|  Shared modules:                                      |
|  [i18n]  [theme]  [schema]  [rate-limiter]           |
|  [sanitizer]  [booking-adapter]  [email-adapter]     |
+===+================+===============+================+=+
    |                |               |               |
    v                v               v               v
[Upstash Redis] [Vercel AI    [Cal.com API]   [Resend API]
(rate limiting   Gateway]     (calendar embed  (newsletter +
 counters —      (proxy to     + webhooks +     contact email
 REST API,       Anthropic)    booking data)    delivery)
 fra1-adjacent)       |
                       v
                [Anthropic Claude API]
                (model: claude-sonnet-4-5
                 or model via env var)
```

Data flow annotations:

```
Browser -> /api/chat:
  Protocol: HTTPS POST (same-origin)
  Auth: None (rate-limited by IP + session cookie counter)
  Data: { message: string } — user message only
  Sensitivity: Potentially PII if user volunteers it; stateless, not logged

/api/chat -> Vercel AI Gateway:
  Protocol: HTTPS, AI SDK provider string
  Auth: GATEWAY_API_KEY env var (server-only)
  Data: System prompt + user message (sanitized)
  Sensitivity: VICTA system prompt (internal); user message

/api/chat -> Upstash Redis:
  Protocol: HTTPS REST
  Auth: UPSTASH_REDIS_REST_TOKEN env var (server-only)
  Data: IP+session rate limit counters (no PII)
  Sensitivity: Low

Browser -> /api/contact:
  Protocol: HTTPS POST (same-origin)
  Auth: Origin header validation + Turnstile token
  Data: name, email, company, message, GDPR consent boolean
  Sensitivity: PII — names, email, message

/api/contact -> Resend:
  Protocol: HTTPS, Resend API
  Auth: RESEND_API_KEY env var (server-only)
  Data: Contact form fields forwarded as email
  Sensitivity: PII — GDPR processor relationship; DPA required

Browser -> /api/newsletter:
  Protocol: HTTPS POST (same-origin)
  Auth: Origin header validation + Turnstile token
  Data: email address, locale
  Sensitivity: PII — email address; GDPR consent

/api/newsletter -> Resend:
  Protocol: HTTPS, Resend API
  Auth: RESEND_API_KEY env var (server-only)
  Data: email, locale, signup timestamp
  Sensitivity: PII — newsletter subscriber data; DPA required

Cal.com Webhook -> /api/booking-webhook:
  Protocol: HTTPS POST (inbound)
  Auth: HMAC-SHA256 signature verification (CALCOM_WEBHOOK_SECRET)
  Data: Booking confirmation payload (name, email, tier, slot)
  Sensitivity: PII — booking data; DPA required

GA4 (browser-only, after consent):
  Protocol: HTTPS to google-analytics.com
  Auth: Measurement ID (public)
  Data: Page paths, events, anonymized behavior
  Sensitivity: PII-adjacent; IP anonymized; consent required
```

### 2.2 Service / Module Responsibilities

```
Module: Next.js App Router (page rendering)
Responsibility: Render all 40 pages using SSG (static generation) for content
  pages and ISR (revalidate: 86400) for any page that may update daily.
  Does NOT own: API logic, rate limiting, external API calls.
Technology: Next.js 15, React 19, TypeScript 5.x, App Router
Scaling strategy: Stateless / Vercel edge CDN — scales automatically
Dependencies: Design token CSS, i18n module, schema module
Health check: GET / returns 200 (Vercel platform monitors)
Owned data: None — all content is file-based (MDX/JSON locale files)
External APIs called: None from the render layer
Security perimeter: No auth required; CSP enforced via vercel.json headers
```

```
Module: /api/chat (Vercel Function)
Responsibility: Accept chatbot message from browser, sanitize input, apply
  rate limiting, forward to Vercel AI Gateway, stream response back.
  Does NOT own: system prompt content (authored by Roman + Claude Code in Phase 4),
  user identity, conversation history.
Technology: Node.js 20, Vercel AI SDK, Upstash Redis client
Scaling strategy: Stateless Vercel Function, scales per invocation
Dependencies: Upstash Redis (rate limits), Vercel AI Gateway (inference)
Health check: Not exposed — inferred from chatbot widget health
Owned data: Rate limit counters in Upstash (no PII, TTL 60s)
External APIs called: Upstash Redis REST, Vercel AI Gateway
Security perimeter:
  - Validates Origin header (must be victaagency.com)
  - Validates session message count (cookie counter, max 20)
  - Validates per-IP rate (Upstash counter, max 10/min)
  - Strips LLM control tokens from input
  - Enforces max input length (1000 chars server-side)
  - Sets max_tokens=400 server-side — not client-configurable
  - Never returns system prompt in response
```

```
Module: /api/contact (Vercel Function)
Responsibility: Validate contact form submission, check CSRF origin, verify
  Cloudflare Turnstile token, sanitize inputs, forward to email/Slack delivery
  adapter. Does NOT own: storage of contact form data (delivery-only).
Technology: Node.js 20, Zod (schema validation), Resend client
Scaling strategy: Stateless Vercel Function
Dependencies: Resend (delivery), Cloudflare Turnstile verification endpoint
Health check: Not exposed
Owned data: None — contact submissions delivered, not stored
External APIs called: Resend API, Cloudflare Turnstile API
Security perimeter:
  - Origin header validation
  - Zod schema enforcement (rejects extra fields)
  - Turnstile token server-side verification
  - IP rate limit: 5 submissions/IP/hour (Upstash counter)
  - HTML stripped from all inputs
  - Honeypot field checked (any non-empty value rejects)
```

```
Module: /api/newsletter (Vercel Function)
Responsibility: Validate newsletter signup, verify Turnstile, add subscriber
  to Resend audience, trigger welcome email. Does NOT own: subscriber list
  management (delegated to Resend).
Technology: Node.js 20, Zod, Resend client
Scaling strategy: Stateless Vercel Function
Dependencies: Resend API
Health check: Not exposed
Owned data: None — subscriber list lives in Resend
External APIs called: Resend audience API + email send
Security perimeter:
  - Email format server-side validation (RFC 5322, no newlines/null bytes)
  - Turnstile verification
  - Rate limit: 3 signups/IP/hour (Upstash counter)
  - Double opt-in: Resend sends confirmation; subscriber active only after click
```

```
Module: /api/booking-webhook (Vercel Function)
Responsibility: Receive inbound webhook from Cal.com on booking events,
  verify HMAC signature, emit GA4 server-side event (optional), log booking
  metadata. Does NOT own: booking data (Cal.com owns it).
Technology: Node.js 20
Scaling strategy: Stateless Vercel Function
Dependencies: Cal.com webhook signing key (CALCOM_WEBHOOK_SECRET env var)
Health check: Not exposed
Owned data: None — webhook is processed and discarded; optional Vercel log entry
External APIs called: None (GA4 server-side event is optional, adds complexity)
Security perimeter:
  - HMAC-SHA256 signature verification (mandatory — rejects unsigned payloads)
  - Replay protection: webhook timestamp checked (reject if > 5 min old)
  - Idempotency: Cal.com webhook ID logged; duplicate webhook_id discarded
```

```
Module: i18n module
Responsibility: Route-based locale detection and validation. Provide
  locale-aware content lookup. Provide currency formatter per locale.
  Does NOT own: translation content (that lives in locale JSON/MDX files).
Technology: Next.js middleware (locale redirect), next-intl or custom locale context
Scaling strategy: Edge middleware (stateless, fast)
Dependencies: None
Security perimeter:
  - Allowlist validation: locale segment must be 'cs' or 'en'; anything else 404s
  - Accept-Language detection runs in middleware, never trusted for currency calculation
```

```
Module: Theme module
Responsibility: Apply light/dark theme tokens. Persist preference to localStorage.
  Provide anti-flash inline script for head injection. Expose ThemeToggle component.
  Does NOT own: design tokens (CSS Custom Property values defined in design system).
Technology: next-themes (or custom, 30-line inline script), CSS Custom Properties
Scaling strategy: Client-side only (localStorage read), with SSR hint via cookie
Security perimeter:
  - localStorage key is non-sensitive (theme preference only)
  - Cookie: SameSite=Lax, Secure, no HttpOnly needed (client-readable preference)
```

```
Module: Schema markup engine
Responsibility: Generate JSON-LD structured data blocks per page type.
  Server-side only. Never inline per-page by hand.
  Does NOT own: schema content (derives from page metadata and site config).
Technology: TypeScript — pure functions that take page metadata and return JSON-LD strings
Scaling strategy: Build-time for static pages
Dependencies: Site config (organization name, address, contact, services list)
Security perimeter: No external calls; pure data transformation
```

```
Module: Chatbot widget (client-side component)
Responsibility: Render floating chat button and chat panel. Maintain in-session
  conversation state (in-memory, not localStorage). Stream responses from /api/chat.
  Does NOT own: any server-side logic, rate limiting, model calls.
Technology: React 19 component, Vercel AI SDK useChat hook
Scaling strategy: Client-side component, code-split from initial bundle
Dependencies: /api/chat endpoint
Security perimeter:
  - Sends only { message: string } to /api/chat
  - Session counter tracked client-side (enforcement is server-side)
  - Input length enforced client-side (max 500 chars UI) + server-side (1000 chars)
  - Respects prefers-reduced-motion (REQ-F-070)
  - Keyboard accessible: Tab, Enter, Escape (REQ-F-071)
```

```
Module: Booking adapter
Responsibility: Wrap Cal.com embed and provide a provider-agnostic interface
  (EmbedCalendar component) so that swapping to Calendly requires only adapter
  changes, not page refactoring.
Technology: Cal.com embed script (loaded async), React wrapper component
Dependencies: Cal.com cloud account, booking event types configured in Cal.com
Security perimeter:
  - Cal.com embed loaded in iframe — CSP frame-src exception documented
  - Booking widget respects light/dark theme via Cal.com embed theming API
  - No booking data flows through VICTA's server (Cal.com direct)
```

```
Module: Cookie consent / GDPR Consent Mode v2
Responsibility: Show consent banner on first visit. Store preference.
  Signal GA4 Consent Mode v2 state. Gate GA4 loading on analytics consent.
  Does NOT own: analytics data collection (GA4 manages that).
Technology: Cookiebot CMP (or equivalent; see OI-B) + Google Consent Mode v2
Scaling strategy: Third-party managed; loaded async
Security perimeter:
  - CMP script loaded with SRI hash (REQ-AR-19)
  - Banner itself sets no tracking cookies before consent
  - Reject-all must be equally prominent as accept-all (REQ-C-004)
  - Consent state: cookie (SameSite=Lax, Secure, 6-month TTL)
```

---

## 3. Request Flow Walkthroughs

### 3.1 Page Load (Static Marketing Page)

```
1. Browser: GET https://victaagency.com/cs/sluzby/ai-chatboti
2. Vercel Edge: locale middleware verifies 'cs' is in allowlist -> pass
3. Vercel CDN: cache hit? -> serve from CDN (immutable JS/CSS chunks)
   If miss -> Vercel renders SSG page from build artifact
4. Browser receives HTML with:
   - Inline <head> anti-flash script (reads localStorage, sets theme class)
   - CSS Custom Properties for active theme
   - Server-side JSON-LD schema (Service schema for this service page)
   - hreflang annotations (cs + en)
   - meta title, description, OG tags
5. Browser parses HTML -> renders above-fold content (LCP element)
6. Browser loads JS chunks (code-split: chatbot widget deferred)
7. Cookiebot (or CMP) initializes -> checks stored consent cookie
   - If consent granted: load GA4 conditionally
   - If no consent: show banner; GA4 does NOT load
8. Chatbot widget chunk loads async (below-fold, deferred)
9. Page is interactive (INP target: < 200ms for interactions)
```

Cache strategy per asset type:
- Static chunks (JS/CSS, content-hash in filename): `Cache-Control: public, max-age=31536000, immutable`
- ISR pages: `Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600`
- API routes: `Cache-Control: no-store` (chatbot, contact, newsletter)
- `robots.txt`, `sitemap.xml`, `llms.txt`: `Cache-Control: public, max-age=3600` (re-validated hourly)

### 3.2 Chatbot Turn (Full Request Flow)

```
1. User types message in chat widget -> clicks Send
2. Client-side: check in-memory message count; if >= 20, show limit message; stop.
3. Client: POST /api/chat { message: "Kolik stojí audit Tier 2?" }
   - request_id generated client-side, sent as header (for log correlation)
4. /api/chat Vercel Function:
   a. Verify Origin header == "https://victaagency.com"
   b. Extract session_id from httpOnly session cookie (or create new)
   c. Check Upstash Redis: per-IP counter (10 req/60s window)
      -> 429 if exceeded; client shows "Zkuste za chvíli"
   d. Check Upstash Redis: per-session counter (20 messages max)
      -> Limit message if exceeded
   e. Input sanitization:
      - Strip HTML tags
      - Strip LLM control tokens: <|im_start|>, [INST], <<SYS>>, SYSTEM:, etc.
      - Truncate to 1000 chars if over limit
   f. Build message array: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: sanitizedInput }]
   g. Call Vercel AI Gateway via AI SDK:
      model: process.env.AI_MODEL  // e.g., "anthropic/claude-sonnet-4-5"
      max_tokens: 400
      stream: true
   h. Stream response tokens back to client as SSE
   i. Increment Upstash counters (IP + session)
   j. Log: { level, request_id, session_id, message_count, tokens_used, cache_hit, model_id, response_time_ms }
      -- NEVER log message content
5. Client: useChat hook streams tokens -> renders incrementally in chat panel
6. If /api/chat returns 503 or times out after 10s:
   -> Client shows: "Chatbot je momentálně nedostupný..."
```

Prompt caching: The system prompt (large, static) is sent with Anthropic prompt
caching enabled via the AI Gateway. This reduces per-call token cost by ~80% for
the system prompt portion (REQ-O-013, AR-16).

### 3.3 Booking Attempt

```
1. User clicks "Rezervovat Tier 2 audit" on /cs/spoluprace
2. GA4 event fires (if consented): booking_initiated { booking_type: "audit_t2", source_page: "/cs/spoluprace" }
3. Cal.com embed opens (inline widget or modal — embed is pre-loaded async)
4. Cal.com iframe presents: calendar slot selection for Tier 2 audit event type
5. User fills: name, email, company, notes -> selects slot -> confirms
6. Cal.com sends confirmation email to visitor automatically
7. Cal.com POSTs signed webhook to: https://victaagency.com/api/booking-webhook
8. /api/booking-webhook:
   a. Verify HMAC-SHA256 signature (CALCOM_WEBHOOK_SECRET)
   b. Check timestamp (reject if > 5 min old — replay protection)
   c. Check webhook_id not already processed (in-memory cache or Upstash)
   d. Log: booking_type, tier, slot_time (no PII in logs)
   e. Optional: fire GA4 server-side Measurement Protocol event booking_completed
   f. Return 200 OK
9. Cal.com shows confirmation screen in the embed
```

Fallback: If Cal.com embed fails to load (network issue, Cal.com outage):
The widget's container renders: "Formulář je momentálně nedostupný — kontaktujte nás na [email]"
This is achieved by detecting iframe load failure within 8 seconds.

### 3.4 Newsletter Signup

```
1. User enters email in NewsletterSignup component -> clicks submit
2. Client-side: validate email format (basic regex)
3. Client: POST /api/newsletter { email: "...", locale: "cs" }
   - Cloudflare Turnstile token included in request body
4. /api/newsletter:
   a. Verify Origin header
   b. Verify Turnstile token with Cloudflare API
   c. Validate email format server-side (strict regex, reject newlines/null bytes)
   d. Check Upstash: 3 signups/IP/hour rate limit
   e. Add email to Resend audience (with double opt-in flow)
   f. Resend sends confirmation email ("Potvrďte přihlášení k newsletteru")
   g. Return 200 { message: "Zkontrolujte e-mail pro potvrzení" }
5. Component shows inline success state without page reload
6. Subscriber clicks confirmation link in email -> added to active audience
7. Resend triggers welcome email sequence (single welcome email)
8. GA4 event (if consented): newsletter_signup { form_location: "homepage" }
```

### 3.5 Contact Form Submit

```
1. User fills contact form on /cs/kontakt -> clicks submit
2. Client-side validation: required fields, email format, GDPR checkbox
3. Client: POST /api/contact {
     name, email, company?, phone?, message, gdpr_consent: true,
     honeypot: "" // must be empty — bots fill this
     turnstile_token: "..."
   }
4. /api/contact:
   a. Verify Origin header
   b. Check honeypot field: if non-empty -> silently return 200 (discard spam)
   c. Verify Turnstile token
   d. Zod schema validation: reject extra fields, validate types and lengths
   e. Check rate limit: 5 submissions/IP/10min (Upstash)
   f. Strip HTML from all string inputs
   g. Format email payload -> send via Resend to Roman's address
      (or Slack webhook if OI-D resolves to Slack)
   h. Return 200 { message: "Zpráva odeslána" }
5. Component shows inline success state
6. GA4 event (if consented): contact_form_submit { form_location: "contact_page" }
```

### 3.6 Locale Switch

```
1. User clicks locale switcher (header or footer) to switch from /cs to /en
2. Client: compute the equivalent EN URL for the current CS page
   - For pages with 1:1 equivalents: /cs/sluzby -> /en/services (or /en/ if no EN equivalent)
   - At launch: most EN paths redirect to /en/ (landing stub)
   - /cs/spoluprace -> /en/#contact (booking still works in EN)
3. Browser navigates to EN URL
4. Next.js middleware: validates 'en' locale -> passes
5. EN page rendered (stub at launch for most pages; full for /en/)
6. Currency: all price displays on /en/ routes show EUR (server-determined)
7. GA4 event (if consented): locale_switched { from_locale: "cs", to_locale: "en" }
```

---

## 4. Page Architecture and Rendering Strategy

### 4.1 Rendering Decision per Page Type

| Page type | Rendering strategy | Revalidation | Reason |
|-----------|-------------------|--------------|--------|
| Homepage | SSG + ISR | 24h or on-demand | Content changes on content updates; CDN-cacheable |
| Service pages (18) | SSG | On deploy (content in MDX) | Pure content; no dynamic data |
| Solution pages (5) | SSG | On deploy | Pure content |
| Industry pages (6) | SSG | On deploy | Pure content |
| /cs/spoluprace | SSG | On deploy | Pricing is hard-coded in locale files; no DB |
| /cs/o-nas | SSG | On deploy | Content only |
| /cs/kontakt | SSG | On deploy | Form is handled by API route, not page |
| /cs/blog | SSG | On deploy | Placeholder |
| /cs/ochrana-soukromi | SSG | On deploy | Legal text changes rarely |
| /cs/cookies | SSG | On deploy | Legal text |
| /en | SSG | On deploy | Stub |
| /404 | SSG | On deploy | Error page |
| /api/* | Serverless Function | N/A | Dynamic |

All SSG pages are pre-built at deploy time and served from Vercel CDN. No runtime server-rendering for content pages. This is the foundation for the Lighthouse mobile >= 90 target (REQ-NF-001) and TTFB < 200ms (REQ-NF-009).

### 4.2 URL Structure (Canonical, Stable at Launch)

The URL structure is locked in at launch. Changing it post-launch breaks inbound links and SEO signals. This is the definitive structure:

```
/                          -> 301 redirect to /cs (middleware: Accept-Language detection)
/cs/                       -> Homepage (P-01)
/cs/sluzby/                -> Services overview (P-02)
/cs/sluzby/weby-na-miru    -> Weby na míru (P-03)
/cs/sluzby/eshopy-na-miru  -> E-shopy na míru (P-04)
/cs/sluzby/integrace       -> Integrace (P-05)
/cs/sluzby/custom-vyvoj    -> Custom solution development (P-06)
/cs/sluzby/ai-chatboti     -> AI chatboti (P-07)
/cs/sluzby/ai-automatizace -> AI automatizace procesů (P-08)
/cs/sluzby/ai-konzultace   -> AI konzultace + audit + strategie (P-09)
/cs/sluzby/datova-platforma -> Datová platforma + integrace (P-10)
/cs/sluzby/mlops           -> MLOps / Provoz AI systémů (P-11)
/cs/sluzby/seo             -> SEO (P-12)
/cs/sluzby/aeo             -> AEO (P-13)
/cs/sluzby/ppc-kampane     -> PPC kampaně (P-14)
/cs/sluzby/social-media    -> Social media management (P-15)
/cs/sluzby/tvorba-kreativ  -> Tvorba kreativ (P-16)
/cs/sluzby/ecommerce-management -> E-commerce management (P-17)
/cs/sluzby/marketingova-strategie -> Marketing strategy (P-18)
/cs/sluzby/komplexni-transformace -> Komplexní transformace byznysu (P-19)
/cs/sluzby/dlouhodoba-sprava -> Dlouhodobá správa & růst klienta (P-20)
/cs/reseni/                -> Solutions overview (P-21)
/cs/reseni/znalostni-asistent  -> Znalostní asistent (P-22)
/cs/reseni/autonomni-agenti    -> Autonomní agenti (P-23)
/cs/reseni/ai-podpora          -> AI podpora zákazníků (P-24)
/cs/reseni/dashboardy          -> Datové dashboardy (P-25)
/cs/reseni/ai-infrastruktura   -> AI infrastruktura (P-26)
/cs/odvetvi/               -> Industries overview (P-27a — see OQ-05 resolution below)
/cs/odvetvi/ecommerce      -> E-commerce (P-27)
/cs/odvetvi/vyroba-logistika   -> Výroba & logistika (P-28)
/cs/odvetvi/profesionalni-sluzby -> Profesionální služby (P-29)
/cs/odvetvi/finance        -> Finance (P-30)
/cs/odvetvi/zdravotnictvi  -> Zdravotnictví (P-31)
/cs/odvetvi/zakaznicka-podpora -> Zákaznická podpora (P-32)
/cs/spoluprace/            -> Audit + collaboration (#1 conversion page) (P-33)
/cs/o-nas/                 -> About VICTA (P-34)
/cs/kontakt/               -> Contact (P-35)
/cs/blog/                  -> Blog placeholder (P-36)
/cs/ochrana-soukromi/      -> Privacy policy (P-37)
/cs/cookies/               -> Cookie policy (P-38)
/en/                       -> EN landing stub (P-39)
/404                       -> 404 page (P-40)
/api/chat                  -> Chatbot proxy (not in sitemap)
/api/contact               -> Contact form handler (not in sitemap)
/api/newsletter            -> Newsletter signup handler (not in sitemap)
/api/booking-webhook       -> Booking webhook receiver (not in sitemap)
/robots.txt                -> Robots file
/sitemap.xml               -> Sitemap (auto-generated)
/llms.txt                  -> AI crawler file
```

OQ-05 resolution (per Roman's confirmed decision): `/cs/odvetvi/` is a standalone
overview page (rozcestník) with 6 industry cards. This is an additional page beyond
the 40 counted in spec.md — it is architecturally necessary for navigation. Sitemap
and navigation include it. Total actual pages: 41 (40 specified + 1 industries overview).

IF Next.js is NOT chosen (Astro): API routes become Astro server endpoints at the same
paths. The sitemap generation uses Astro's sitemap integration. MDX content files are
compatible with Astro's content collections.

---

## 5. Data Model

### 5.1 Data Ownership Summary

VICTA operates a **lightweight Supabase Postgres database at launch** for lead-tracking, conversation logging, and operational visibility — but **does NOT use Supabase as the authoritative store** for newsletter (Resend), bookings (Cal.com), or consent (Cookiebot). The database is the **VICTA-owned operational layer** on top of those SaaS platforms.

**Rationale for adding Supabase to launch architecture (decision revised after Phase 1B with Roman's input):**
- **Lead visibility**: single source of truth across contact / newsletter / booking / chatbot interactions — poor-man's CRM that Roman + marketing team operate from day 1.
- **Chatbot improvement loop**: structured conversation logs enable Roman + AI agent to analyze "where the chatbot fails", iterate on system prompt, tighten topic guard. Aligns with VICTA's AI-augmented positioning.
- **AEO citation tracking**: `aeo_citations` table captures the most strategically valuable VICTA marketing data — when LLMs cite VICTA. No Resend/Cal.com/GA4 covers this.
- **GDPR compliance**: structured data makes Subject Access Requests + deletion requests dramatically easier than unstructured email inbox + multi-vendor lookups.
- **Path B (invoice payments) tracking**: `booking_events.invoice_status` is critical for chasing unpaid audits — Cal.com doesn't track invoice state, Resend doesn't, only VICTA's DB does.
- **Cost**: zero ($0/month, Supabase free tier). Storage projection shows 2–4 years of runway before paid tier consideration.

| Data type | Authoritative store | VICTA Postgres reference | Retention |
|-----------|---------------------|--------------------------|-----------|
| Newsletter subscribers | **Resend audience** (auth) | `newsletter_subscribers` (mirror + GDPR consent metadata) | Until unsubscribe or 3 years no engagement |
| Booking records | **Cal.com** (auth) | `booking_events` (webhook log + invoice status) | Cal.com policy; VICTA log 24 months |
| Contact form submissions | **VICTA Postgres** + Resend email to Roman | `contact_submissions` | 24 months active, then archive/delete on GDPR request |
| Cookie consent records | **Cookiebot** (auth) | None in VICTA DB | 6 months per consent TTL |
| Chatbot conversations | **VICTA Postgres** | `chatbot_sessions` + `chatbot_messages` | 12 months active, soft-delete on session expiry beyond, hard-delete on GDPR request |
| Lead aggregate (cross-source CRM view) | **VICTA Postgres** | `leads` (FK from contact / newsletter / booking / chatbot) | 36 months no activity → archive; GDPR deletion always honored |
| AEO citations (strategic intel) | **VICTA Postgres** | `aeo_citations` | Indefinite (intel) |
| Audit log (compliance + debug) | **VICTA Postgres** | `audit_log` | 36 months minimum (compliance) |
| Rate limit counters | **Upstash Redis** | IP + session counters (no PII) | 60s TTL (IP), session TTL |
| GA4 analytics | **Google Analytics 4** | None in VICTA DB | 14-month GA4 default |
| Error events | **Sentry** | None in VICTA DB | 90 days (per REQ-NF-055) |

### 5.2 Content Data Model (File-Based)

Content pages are authored in MDX or JSON locale files. No CMS, no database. The build process reads these files and generates static HTML.

```
Content file structure:

content/
  cs/
    pages/
      home.mdx                    (homepage copy, hero, section content)
      sluzby/
        index.mdx                 (services overview)
        weby-na-miru.mdx          (P-03)
        eshopy-na-miru.mdx        (P-04)
        ... (18 service MDX files)
      reseni/
        index.mdx
        znalostni-asistent.mdx    (P-22)
        ... (5 solution MDX files)
      odvetvi/
        index.mdx                 (industries overview)
        ecommerce.mdx             (P-27)
        ... (6 industry MDX files)
      spoluprace.mdx              (P-33 — audit tiers, process, FAQ)
      o-nas.mdx                   (P-34)
      kontakt.mdx                 (P-35)
      blog.mdx                    (P-36 placeholder)
      ochrana-soukromi.mdx        (P-37)
      cookies.mdx                 (P-38)
    strings/
      common.json                 (nav labels, footer, button labels, error messages)
      chatbot.json                (chatbot UI strings, fallback messages)
      forms.json                  (form labels, validation messages)
  en/
    pages/
      index.mdx                   (P-39 EN landing stub)
      ochrana-soukromi.mdx        (minimal EN privacy)
      cookies.mdx                 (minimal EN cookie policy)
    strings/
      common.json
      chatbot.json
      forms.json

config/
  site.ts                         (organization schema data, social profiles, pricing)
  services.ts                     (services list — used by schema engine + sitemap)
  nav.ts                          (navigation structure)
```

Frontmatter schema for content MDX files (enforced at build time):

```typescript
interface PageFrontmatter {
  title: string;           // meta title (50–60 chars)
  description: string;     // meta description (120–160 chars)
  ogImage?: string;        // path to OG image, defaults to site OG image
  schema?: 'Service' | 'Organization' | 'LocalBusiness' | 'FAQPage' | 'WebPage';
  noindex?: boolean;       // only true for /404
  lastmod?: string;        // ISO date for sitemap lastmod
}
```

### 5.3 Pricing Data Model

Prices are not in a database. They are authored in locale content files and rendered server-side. The `/cs` locale renders CZK prices; `/en` renders EUR prices. Currency is determined at render time from the validated locale route segment — never from client input.

```typescript
// config/pricing.ts (shared, locale-agnostic)
export const auditTiers = [
  {
    id: 'tier-1',
    slug: 'komplexni-podnikovy-audit',
    sessions: '3–4',
    durationWeeks: '1–3',
    priceRange: { czk: { min: 20000, max: 90000 }, eur: { min: 800, max: 3600 } },
  },
  {
    id: 'tier-2',
    slug: 'domenovy-audit',
    sessions: '2',
    durationWeeks: '1–2',
    priceRange: { czk: { min: 10000, max: 55000 }, eur: { min: 400, max: 2200 } },
  },
  {
    id: 'tier-3',
    slug: 'strategicka-session',
    sessions: '1',
    durationWeeks: '1–2',
    priceRange: { czk: { min: 4000, max: 25000 }, eur: { min: 160, max: 1000 } },
  },
] as const;
```

The component receives the locale and selects the appropriate price range. No client-side calculation, no exchange rate API, no arithmetic — the rates are those confirmed by Roman (brainstorm.md decision 3). They are updated by editing config/pricing.ts and deploying.

### 5.4 Supabase Database Schema

VICTA's operational database — Supabase Postgres on free tier, with documented growth path to Pro tier.

**Hosting region**: Supabase Frankfurt (eu-central-1) for GDPR data residency parity with Vercel `fra1`.

**Connection model**: Vercel Functions connect via Supabase JS SDK using a service role key (env var `SUPABASE_SERVICE_KEY`, server-only). No direct client → Supabase access at launch (RLS enforces this anyway). Public form submissions go via Vercel Functions which validate, sanitize, and insert.

#### Tables

**1. `leads` — single source of truth (poor-man's CRM)**

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,                                            -- nullable for anonymous chatbot users
  name TEXT,
  company TEXT,
  phone TEXT,
  source TEXT NOT NULL,                                  -- contact_form | newsletter | booking | chatbot | cold_ad | referral
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  locale TEXT,                                           -- cs | en
  budget_tier TEXT,                                      -- under_5k | 5k-25k | 25k-100k | 100k+
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',                    -- new | contacted | qualified | audit_booked | won | lost | spam
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX idx_leads_source ON leads(source);
```

**2. `contact_submissions`**

```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  service_interest TEXT,                                 -- comprehensive | web | marketing | ai | other
  budget_tier TEXT,
  message TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'cs',
  ip_hash TEXT,                                          -- SHA-256 of IP+salt for spam dedup
  user_agent TEXT,
  honeypot_passed BOOLEAN NOT NULL DEFAULT TRUE,
  resend_email_id TEXT,                                  -- email confirmation tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_lead_created ON contact_submissions(lead_id, created_at DESC);
CREATE INDEX idx_contact_ip_hash ON contact_submissions(ip_hash, created_at DESC);
```

**3. `chatbot_sessions` + `chatbot_messages` — conversation logs (improvement loop)**

```sql
CREATE TABLE chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  session_id TEXT UNIQUE NOT NULL,                       -- client-side UUID
  ip_hash TEXT,
  user_agent TEXT,
  locale TEXT,
  source_url TEXT,                                       -- which page they started chat on
  utm_source TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  total_tokens_in INTEGER NOT NULL DEFAULT 0,
  total_tokens_out INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  high_value_intent BOOLEAN NOT NULL DEFAULT FALSE,      -- flagged if 3+ mentions of audit/comprehensive/integration
  conversion_event TEXT,                                 -- booking_clicked | contact_clicked | newsletter_signup | NULL
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  model TEXT,                                            -- which model handled (via AI Gateway)
  flagged_topics TEXT[],                                 -- topic guard flags
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chatbot_session_id ON chatbot_sessions(session_id);
CREATE INDEX idx_chatbot_lead_created ON chatbot_sessions(lead_id, created_at DESC);
CREATE INDEX idx_chatbot_high_intent ON chatbot_sessions(high_value_intent, created_at DESC) WHERE high_value_intent = TRUE;
CREATE INDEX idx_chatbot_messages_session ON chatbot_messages(session_id, created_at);
```

**4. `newsletter_subscribers` — Resend audience mirror + GDPR consent**

```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  resend_audience_id TEXT,
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  locale TEXT NOT NULL DEFAULT 'cs',
  ip_hash TEXT,
  consented_at TIMESTAMPTZ NOT NULL,                     -- explicit GDPR consent timestamp
  consent_text TEXT NOT NULL,                            -- exact text shown at signup (compliance proof)
  unsubscribed_at TIMESTAMPTZ,                           -- soft delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(unsubscribed_at) WHERE unsubscribed_at IS NULL;
CREATE INDEX idx_newsletter_lead ON newsletter_subscribers(lead_id);
```

**5. `booking_events` — Cal.com webhook log + invoice tracking (Path B)**

```sql
CREATE TABLE booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  cal_booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL,                              -- BOOKING_CREATED | RESCHEDULED | CANCELLED | REJECTED
  audit_tier TEXT,                                       -- tier_1 | tier_2 | tier_3 | free_scoping
  attendee_email TEXT,
  attendee_name TEXT,
  scheduled_for TIMESTAMPTZ,
  invoice_status TEXT,                                   -- pending_invoice | invoiced | paid | overdue (Path B critical)
  invoice_id TEXT,                                       -- Fakturoid / external invoicing tool ID
  webhook_signature_verified BOOLEAN NOT NULL,
  raw_payload JSONB NOT NULL,                            -- full webhook for replay/audit
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_cal_id ON booking_events(cal_booking_id);
CREATE INDEX idx_booking_lead ON booking_events(lead_id);
CREATE INDEX idx_booking_invoice_status ON booking_events(invoice_status, scheduled_for) WHERE invoice_status IN ('pending_invoice', 'invoiced', 'overdue');
CREATE INDEX idx_booking_event_type_received ON booking_events(event_type, received_at DESC);
```

**6. `aeo_citations` — strategic AI search intelligence**

```sql
CREATE TABLE aeo_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  llm_provider TEXT NOT NULL,                            -- chatgpt | claude | gemini | perplexity | google_ai_overviews | brave_ai
  query TEXT NOT NULL,                                   -- what was asked
  citation_text TEXT,                                    -- how VICTA was mentioned
  cited_url TEXT,                                        -- which VICTA page was cited
  date_observed DATE NOT NULL,
  source_method TEXT NOT NULL,                           -- manual | scrape | api
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aeo_provider_date ON aeo_citations(llm_provider, date_observed DESC);
```

**7. `audit_log` — compliance + debugging**

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,                              -- gdpr_access_request | gdpr_deletion | config_change | admin_login | webhook_replay_attempt
  actor TEXT,                                            -- admin email | system | visitor:hashed_ip
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_event_actor ON audit_log(event_type, actor, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor, created_at DESC);
```

#### Row-Level Security (RLS)

All tables have RLS enabled. **Anon role** (used by client) is denied by default. **Service role** (used by Vercel Functions) bypasses RLS.

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- No anon policies created → anon role gets NO access by default.
-- All public form submissions go via Vercel Functions using service role key.
```

This enforces architectural rule **AR-21 (NEW): Public clients have no direct database access; all writes go through validated Vercel Functions.**

#### Foreign Key Strategy

- All FKs to `leads` use `ON DELETE SET NULL` — preserves the data record even if the lead is deleted (e.g., GDPR deletion request leaves submissions/messages anonymized for analytics).
- `chatbot_messages.session_id` uses `ON DELETE CASCADE` — when a session is purged, its messages go with it.

#### Storage Projection (Year 1)

| Table | Avg row | Low (50 leads/mo) | Moderate (200 leads/mo, 400 chat sessions/mo) |
|-------|---------|-------------------|-----------------------------------------------|
| leads | 1 KB | 500 KB | 2 MB |
| contact_submissions | 2 KB | 400 KB | 2 MB |
| chatbot_sessions | 1 KB | 1 MB | 5 MB |
| chatbot_messages | 3 KB | 15 MB | 90 MB |
| newsletter_subscribers | 1 KB | 500 KB | 2 MB |
| booking_events | 5 KB | 1 MB | 5 MB |
| aeo_citations | 2 KB | 100 KB | 1 MB |
| audit_log | 2 KB | 2 MB | 10 MB |
| **Year 1 total** | | **~21 MB** | **~117 MB** |

Supabase free tier 500 MB → **~2.4 years runway at low traffic, ~4 years at moderate growth** before considering Pro tier ($25/mo, 8 GB DB).

#### Backup and Recovery

- **Free tier**: weekly backups (Supabase managed)
- **Production hardening (post-launch)**: weekly logical backup (`pg_dump`) to Vercel Blob, retained 12 months
- **Restore procedure**: documented in `runbooks/database-restore.md` (Phase 4 deliverable)

#### Data Migration Strategy

- Schema versioned via Supabase migrations (`supabase/migrations/*.sql`)
- All schema changes flow: dev → preview → prod via Vercel preview deployments + Supabase branch databases (Pro tier feature; on free tier, manual migration apply)
- Phase 4 build: set up migration tooling + first migration (this schema)

#### Open Questions for Phase 1C

- **Invoicing tool integration**: `booking_events.invoice_id` references an external invoicing service (Fakturoid recommended for CZ). Tool selection deferred to Phase 1C `workplan-builder` based on Roman's accounting workflow.
- **AEO citation tracking automation**: launch with manual entry (`source_method = 'manual'`); post-launch evaluate scraping (Apify, Bright Data) or LLM API queries to automate.

---

## 6. i18n Architecture in Detail

### 6.1 Route Architecture

```
Next.js middleware (edge):
  1. Intercept all requests
  2. Extract locale segment: pathname.split('/')[1] -> 'cs' | 'en'
  3. Validate against ALLOWLIST = ['cs', 'en']:
     - Valid: pass through to App Router
     - Invalid / root '/' : detect Accept-Language header
       - 'cs' in Accept-Language: 301 to /cs[rest-of-path]
       - 'en' in Accept-Language: 301 to /en[rest-of-path]
       - No match / unknown: 301 to /cs (default)
  4. Set response header: Content-Language: [locale]
```

Security enforcement at middleware (AR-03, security-model.md §4.6 Rule):
Any locale value not in `['cs', 'en']` is rejected with a 404 or redirect to `/cs`.
Path traversal attempts (`/../../etc/passwd` as locale) return 404. No raw URL segment
is passed to any downstream module unvalidated.

### 6.2 Content Lookup

```typescript
// i18n/config.ts
export const locales = ['cs', 'en'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'cs';

// i18n/currency.ts
export function formatPrice(amount: number, locale: Locale): string {
  if (locale === 'cs') {
    // Czech format: "20 000 Kč" (space thousands separator, Kč suffix)
    return `${amount.toLocaleString('cs-CZ')} Kč`;
  }
  // EUR format: "€800"
  return `€${amount.toLocaleString('en-GB')}`;
}
```

### 6.3 hreflang Implementation

Every page outputs:
```html
<link rel="alternate" hreflang="cs" href="https://victaagency.com/cs/[current-path]/" />
<link rel="alternate" hreflang="en" href="https://victaagency.com/en/" />
<link rel="alternate" hreflang="x-default" href="https://victaagency.com/cs/[current-path]/" />
```

At launch, all CS pages point to `/en/` as the EN alternate (since full EN pages do not exist for individual pages). This is correct per REQ-F-091: hreflang must not point to a 404. The EN stub handles all EN alternate traffic.

### 6.4 Czech Typography Enforcement (AR-08)

A build-time linter validates Czech typography rules on all `.cs.mdx` files and Czech locale JSON strings. The linter checks:

- Czech quotation marks: „..." not "..." or '...'
- Em-dashes with thin spaces: ` — ` not `-`
- Single-letter prepositions at line ends: k, s, v, z, o, u, i, a must be followed by ` ` (non-breaking space) in content files
- Number + unit with non-breaking space: "2 500 Kč", "50 %"

The linter runs as a Node.js script in the CI pipeline before the build step. A violation fails the build (REQ-NF-036, AR-08).

---

## 7. Theme System Architecture

### 7.1 Token Structure — LOCKED per Roman's design decision

> **Source of truth (locked 2026-05-06)**: `docs/design-exploration/design-decision.md` §1.1 + §1.2. Combination signature: `Inter Tight · indigo · grid · medium · left · 500 · normal`. Selected by Roman from `visual-companion-v2.html` Tweaks mixer. Every token below is locked — frontend-developer **MUST NOT** change a value without Roman's explicit re-decision. Locked-preview rendered in `docs/design-exploration/locked-preview.html`.

All visual tokens are CSS Custom Properties defined in a single root stylesheet:

```css
/* tokens/light.css — LOCKED per design-decision.md §1.1 */
:root {
  /* Surfaces */
  --bg: #FAFAFA;                  /* Hlavní pozadí */
  --surface: #F4F4F5;             /* Audit cards bg, hover, code blocks */
  --surface-2: #EEEEEF;           /* Modal scrim base */

  /* Borders */
  --border: #D4D4D8;              /* Hairline 1px separators */
  --border-soft: #E4E4E7;         /* Footer dividers */

  /* Text */
  --ink: #0A0B0E;                 /* Primary text */
  --secondary: #52525B;           /* Body copy */
  --tertiary: #71717A;            /* Captions, mono labels */

  /* Indigo signature */
  --accent: #3730A3;              /* Primary CTA bg, link underlines */
  --accent-bright: #4F46C7;       /* Hover state */
  --accent-soft: rgba(55, 48, 163, 0.08);  /* Badge bg */

  /* Status */
  --success: #15803D;
  --warning: #A16207;
  --error: #B91C1C;

  /* Shape */
  --radius-sm: 4px;               /* Buttons, badges, mono lang tag */
  --radius-md: 6px;               /* Inputs, primary CTA buttons */
  --radius-lg: 8px;               /* Cards, audit pricing, modals */

  /* Shadows (minimal) */
  --shadow-sm: 0 1px 2px rgba(10, 11, 14, 0.04), 0 4px 12px rgba(10, 11, 14, 0.04);
  --shadow-md: 0 4px 12px rgba(10, 11, 14, 0.08);  /* Modals only */
}

/* tokens/dark.css — LOCKED per design-decision.md §1.1 */
[data-theme="dark"] {
  --bg: #0A0B0E;                  /* Cool ink, near-black, NOT pure #000 */
  --surface: #18181B;
  --surface-2: #27272A;
  --border: #3F3F46;
  --border-soft: #2A2A2E;
  --ink: #FAFAFA;
  --secondary: #A1A1AA;
  --tertiary: #71717A;
  --accent: #7367E5;              /* Lifted indigo for dark mode */
  --accent-bright: #9389F0;
  --accent-soft: rgba(115, 103, 229, 0.14);
}
```

**Typography (LOCKED per design-decision.md §1.2)**:
- **Headlines + body**: **Inter Tight** (Google Fonts variable, full Czech Latin Extended-A) — https://fonts.google.com/specimen/Inter+Tight
- **Mono / data / code / labels**: **Geist Mono** — https://fonts.google.com/specimen/Geist+Mono
- Headline: weight 500, letter-spacing -0.035em, line-height 1.04
- Body: weight 400, letter-spacing -0.005em, line-height 1.55
- UI: weight 500, letter-spacing -0.005em
- Mono: weight 400, letter-spacing 0, line-height 1.5
- Total subset payload (Latin + Latin-Ext): ~120KB woff2 compressed both fonts
- **Self-hosted** (per architecture.md §9.3) — NOT loaded from Google Fonts CDN at runtime; build-time fetch + serve from `/public/fonts/`

**Background pattern (LOCKED per design-decision.md §1.3)**: subtle 40×40px square grid, 1px lines at 4% opacity, masked with radial gradient (visible center 70%, fades to transparent at edges). Applied to `<body>` with class `bg-grid` — NOT repeated inside sections.

**Density (LOCKED §1.4)**: Medium. Section padding desktop 96-128px vertical, 48px horizontal; mobile 64-96px / 24px. Spacing scale 4px base (4/8/12/16/24/32/48/64/96/128/160). Card padding 32px desktop, 24px mobile.

**Alignment (LOCKED §1.5)**: Left-aligned headlines, body, CTA stacks. Content max-width 720-920px per block. Centered hero headlines NOT permitted.

**Borders not shadows for cards (LOCKED §1.6)**: Cards use `1px` borders for elevation, not shadows. The "popular" audit card uses `border-color: var(--accent)` + `box-shadow: 0 0 0 1px var(--accent)` ring — no drop shadow.

**Status line signature element (LOCKED §1.7)**: every page has a `STATUS · v 0.1.0 · published [date] · region eu-central-1` mono line in tertiary color with green dot — Geist Mono 12px, locked as page identity.

No hardcoded hex values in component files (REQ-NF-040, claude-rules.md rule 8). All component styles reference `var(--*)` tokens.

#### WCAG verification (locked, all pass AA per design-decision.md §1.1)

| Pair | Light | Dark | Standard |
|---|---|---|---|
| `--bg` × `--ink` | 19.0:1 | 19.0:1 | ✓ AAA |
| `--bg` × `--secondary` | 7.5:1 | 9.0:1 | ✓ AA (AAA dark) |
| `--bg` × `--tertiary` | 5.0:1 | 5.0:1 | ✓ AA |
| `--bg` × `--accent` | 9.8:1 | 7.5:1 | ✓ AAA / AA |
| `--accent` bg × white | 9.8:1 | 4.6:1 | ✓ AAA / AA — primary CTA passes |
| `--bg` × `--success` | 4.7:1 | 4.6:1 | ✓ AA |
| `--bg` × `--error` | 6.6:1 | 5.5:1 | ✓ AA |
| `--bg` × `--warning` | 4.5:1 | 5.0:1 | ✓ AA |

### 7.2 Anti-Flash Inline Script (AR-10, REQ-F-074)

Injected into `<head>` before any stylesheet loads:

```javascript
// Minified inline — reads localStorage or falls back to prefers-color-scheme
// This must run synchronously before first paint
;(function(){
  var t = localStorage.getItem('victa-theme');
  var d = document.documentElement;
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    d.setAttribute('data-theme', 'dark');
  } else {
    d.setAttribute('data-theme', 'light');
  }
})();
```

This runs before any CSS framework or React hydration. No flash of wrong theme.

### 7.3 Theme Toggle

The ThemeToggle component:
- Reads `data-theme` attribute on `<html>` element
- On click: toggles between 'light' and 'dark'
- Writes new value to `localStorage` key `'victa-theme'`
- Updates `data-theme` attribute immediately (no page reload)
- Fires GA4 event: `theme_toggled { to_theme: "light"|"dark" }`

### 7.4 Booking Widget Dark Mode (AR-12)

Cal.com's embed supports a `theme` parameter in the embed configuration. The booking adapter component reads the current theme from the document's `data-theme` attribute and passes the corresponding value to the Cal.com embed script. When the user toggles theme, the embed refreshes with the new theme parameter.

---

## 8. Security Architecture

### 8.1 Token and Request Flow

```
No visitor-facing authentication exists. The security model covers:
(a) server-only secrets that must never reach the browser
(b) server-side validation on all inbound API calls
(c) rate limiting to prevent abuse and cost amplification
(d) content security policy to restrict what the browser can execute

API key flow (chatbot — highest risk):
  ANTHROPIC_API_KEY -> Vercel env var (encrypted at rest, Vercel)
                    -> /api/chat function environment only
                    -> Passed to Vercel AI SDK (server-only)
                    -> Never in any response body
                    -> Never in any log output
                    -> Never prefixed NEXT_PUBLIC_*
  
  Vercel AI Gateway credentials (separate from Anthropic API key):
  AI_GATEWAY_TOKEN -> Vercel env var (server-only)
                   -> Used by AI SDK to authenticate to gateway
                   -> Never client-exposed

Resend API key:
  RESEND_API_KEY -> Vercel env var (server-only)
                -> /api/newsletter and /api/contact only
                -> Rotate every 90 days

Cal.com webhook secret:
  CALCOM_WEBHOOK_SECRET -> Vercel env var (server-only)
                        -> /api/booking-webhook only
                        -> Used for HMAC-SHA256 verification only

Upstash Redis credentials:
  UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN -> Vercel env var (server-only)
  -> /api/chat, /api/contact, /api/newsletter only
```

Pre-launch audit command (mandatory before go-live):
```
grep -r "NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*TOKEN" . --include="*.{ts,tsx,js,jsx}"
```
Must return zero results (security-model.md §4.1, AR-09 equivalent for keys).

### 8.2 Content Security Policy

The CSP is defined in `vercel.json` response headers and applied to all routes:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{SERVER_NONCE}' [CMP_SCRIPT_SRC] [SENTRY_CDN] https://app.cal.com;
  style-src 'self' 'unsafe-inline';   /* unsafe-inline needed for CSS-in-JS or inline styles from next-themes */
  img-src 'self' data: https://res.cloudinary.com;  /* if external image CDN added */
  font-src 'self' https://fonts.gstatic.com;        /* if Google Fonts used — prefer self-hosting */
  connect-src 'self'                /* all API calls go through same-origin /api/* */
              https://vitals.vercel-insights.com   /* Vercel Analytics */
              https://*.sentry.io;  /* Sentry error reporting */
  frame-src https://app.cal.com;    /* Cal.com booking embed */
  frame-ancestors 'none';           /* prevent clickjacking */
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
```

Exceptions documented:
- `frame-src https://app.cal.com`: Required for Cal.com booking widget embed. Justified by BK-01, OI-C.
- `connect-src https://vitals.vercel-insights.com`: Required for Vercel Real User Monitoring. Justified by REQ-NF-048.
- `[CMP_SCRIPT_SRC]`: Cookie consent manager (Cookiebot) CDN. Justified by REQ-I-014. To be filled in when CMP is selected.
- `style-src 'unsafe-inline'`: Required by next-themes inline style injection. Mitigation: CSP nonce strategy is preferred — evaluate if next-themes supports nonce in Next.js 15. If not supportable, document this exception explicitly.

Note on GA4: GA4 scripts (googletagmanager.com, google-analytics.com) are loaded conditionally AFTER consent. They are not added to CSP by default. If consent is granted, these domains must be in the CSP. This is handled by the CMP integration which dynamically adjusts the consent-gated script loading. Recommend adding them to CSP proactively with appropriate restrictions even though they are consent-gated.

### 8.3 HTTP Security Headers (vercel.json)

All headers set in `vercel.json` and applied to every response:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "[see above]" }
      ]
    }
  ]
}
```

Note: `X-Frame-Options: SAMEORIGIN` is redundant with CSP `frame-ancestors 'none'` but
is retained for older browsers that don't understand CSP frame-ancestors.

HSTS preload is NOT enabled at launch. Per security-model.md §7 Rule 5, preload is added
only after 60+ days of stable production (a mistake in the first week would lock all
browsers to HTTPS for a year). This is a post-launch task.

### 8.4 Chatbot Input Sanitization (AR-15)

Server-side sanitization pipeline in `/api/chat`:

```typescript
function sanitizeChatInput(raw: string): string {
  // Step 1: Enforce length limit
  const truncated = raw.slice(0, 1000);

  // Step 2: Strip HTML tags
  const noHtml = truncated.replace(/<[^>]*>/g, '');

  // Step 3: Strip LLM control tokens
  const controlTokenPattern = /(<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>|SYSTEM:|###\s*System|###\s*Human|###\s*Assistant)/gi;
  const sanitized = noHtml.replace(controlTokenPattern, '');

  // Step 4: Strip UUID-based delimiters that match the system prompt separator
  // (The system prompt uses a UUID delimiter not disclosed to users)
  const cleaned = sanitized.replace(SYSTEM_PROMPT_DELIMITER_REGEX, '');

  return cleaned.trim();
}
```

Additional server-side enforcement: the Vercel Function rejects any request where the
`message` field contains binary data, null bytes, or exceeds 1000 characters after
sanitization. Client-side enforcement (500-char limit) is a UX convenience, not a
security control.

### 8.5 Rate Limiting Architecture (AR-17)

Two dimensions of rate limiting, both enforced server-side in `/api/chat`:

```
Dimension 1: Per-IP rate limit
  Key: "rl:ip:{sha256(ip)}"   // IP hashed; never stored plaintext
  Window: 60 seconds
  Limit: 10 requests
  Backend: Upstash Redis INCR + EXPIRE
  Response on breach: HTTP 429, body: { error: "Příliš mnoho požadavků. Zkuste za chvíli." }

Dimension 2: Per-session message limit
  Key: "rl:session:{session_id}"
  Window: Session TTL (browser session)
  Limit: 20 messages total
  Backend: Upstash Redis INCR (no auto-expire — session cookie controls lifetime)
  Response on breach: HTTP 429, body: { error: "limit_reached" }
  Client action: show limit message, disable input, show contact CTA

Per-day limit (AR-17): 1 conversation/IP/day
  Key: "rl:daily:{sha256(ip)}"
  Window: 24 hours
  Limit: 1 new session creation (enforced when session_id cookie is absent)
  Backend: Upstash Redis with 86400s TTL
```

### 8.6 Webhook Security (AR-11)

Cal.com webhook verification in `/api/booking-webhook`:

```typescript
async function verifyCalComWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return signature === expectedHex;
}

// Replay protection: check webhook timestamp (X-Cal-Signature-256 timestamp field)
// Reject if timestamp is > 300 seconds old
```

### 8.7 Secrets Management

```
Development:
  .env.local (gitignored) — contains real values for local dev
  .env.example (committed) — contains placeholder values and comments for all vars

Production:
  All secrets in Vercel's encrypted environment variable store
  No secrets in code, no secrets in git history
  No secrets in build logs (Vercel Functions log sanitization)

Required env vars (full list in .env.example):
  AI_MODEL                    # e.g., "anthropic/claude-sonnet-4-5"
  AI_GATEWAY_TOKEN            # Vercel AI Gateway auth
  ANTHROPIC_API_KEY           # Used by AI Gateway — NOT passed to client
  RESEND_API_KEY              # Newsletter + contact email delivery
  CALCOM_WEBHOOK_SECRET       # Webhook signature verification
  UPSTASH_REDIS_REST_URL      # Rate limiting store
  UPSTASH_REDIS_REST_TOKEN    # Rate limiting store auth
  CLOUDFLARE_TURNSTILE_SECRET_KEY  # Server-side Turnstile verification
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY  # Public — safe for client
  NEXT_PUBLIC_GA4_MEASUREMENT_ID   # Public — safe for client (not a secret)
  SENTRY_DSN                  # Server-side error reporting (server-only)
  NEXT_PUBLIC_SENTRY_DSN      # Client-side error reporting (safe for client)
  NEXT_PUBLIC_CAL_NAMESPACE   # Cal.com embed namespace (public)

Rotation cadence (REQ-I-022):
  ANTHROPIC_API_KEY / AI_GATEWAY_TOKEN: every 90 days
  RESEND_API_KEY: every 90 days
  CALCOM_WEBHOOK_SECRET: on vendor rotation schedule
  UPSTASH_REDIS_REST_TOKEN: every 90 days
  Immediately on any suspected exposure
```

---

## 9. Performance Architecture

### 9.1 Bundle Budget and Code Splitting

Target: initial homepage JS bundle < 250KB compressed (REQ-NF-006), total page weight < 1MB (REQ-NF-007).

Code splitting strategy:
- Chatbot widget: dynamic import with `{ ssr: false }` — loads after main thread is free
- Booking embed (Cal.com script): loaded async on `/cs/spoluprace` and service pages only
- Heavy components (Mega-menu, animations): dynamic import per route
- Locale-specific content: file-system based routing means CS content is never bundled with EN content

Bundle analysis: `@next/bundle-analyzer` runs in CI to track bundle size over time. A size regression gate blocks merge if initial bundle exceeds 260KB compressed.

### 9.2 Image Optimization (REQ-F-101, REQ-F-102)

All images served via `next/image` (Vercel Image Optimization):
- Format: AVIF first, WebP fallback (automatically negotiated)
- Responsive: `sizes` prop set per breakpoint to avoid oversized images
- Above-fold hero images: `priority={true}` + `fetchpriority="high"` (no lazy load)
- Below-fold: `loading="lazy"` (default next/image behavior)
- Cache key includes locale and width (`?w=800&locale=cs`) for locale-appropriate images
- Cache duration: 1-month TTL for immutable assets

OG images: pre-generated at build time (one per page), stored as static files in `/public/og/`. Not dynamically generated at runtime (avoids Vercel Image cost for OG requests from crawlers). Both light and dark OG variants generated per page.

### 9.3 Font Loading (REQ-NF-008)

Fonts (final pairing from design session — TBD, placeholder for build):
- Primary font: variable font file (single file covers all weights) — self-hosted in `/public/fonts/`
- Secondary font: if needed, also self-hosted
- `font-display: swap` for body font (FOUT acceptable, FOIT not acceptable)
- `font-display: optional` for heading font if display font is used (prevents layout shift)
- Preload hint for the primary body font weight in `<head>`

No Google Fonts CDN at launch — self-hosting eliminates a CSP `connect-src` exception and avoids the Google Fonts privacy concern (Google Fonts collects visitor IPs per GDPR analysis by several EU DPAs).

### 9.4 Caching Strategy

```
Vercel Edge Cache:
  Static assets (JS/CSS with content hash):  immutable, 1 year
  ISR pages:                                 s-maxage=86400, stale-while-revalidate=3600
  Static content pages (SSG):               s-maxage=31536000 (immutable on redeploy)
  API routes:                               no-store (chatbot, contact, newsletter)
  robots.txt, sitemap.xml, llms.txt:        max-age=3600

Anthropic Prompt Caching (AR-16):
  System prompt prefix: sent with cache_control: { type: "ephemeral" }
  Cache hit reduces system prompt token cost by ~80%
  Cache lifespan: 5 minutes per Anthropic's current policy (refreshed on each hit)
  Implementation: via Vercel AI Gateway — no direct Anthropic SDK call required

Common Q&A Runtime Cache (REQ-F-067):
  Implemented as Upstash Redis cache in /api/chat
  Cache key: sha256(normalized_user_message)  // normalized: lowercase, trimmed, stopwords removed
  TTL: 3600 seconds (1 hour)
  Cache invalidation: TTL-based only (no manual invalidation needed for Q&A cache)
  What is cached: the chatbot response text for common factual queries
  What is NOT cached: session-specific responses, booking routing, anything with user context
```

---

## 10. SEO and AEO Architecture

### 10.1 Schema Markup Engine

All JSON-LD is generated server-side by a TypeScript module. No hand-inlined schema per page.

```typescript
// lib/schema.ts

// Organization schema (homepage, contact page)
export function organizationSchema(locale: Locale): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VICTA',
    url: 'https://victaagency.com',
    logo: 'https://victaagency.com/logo.png',
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', availableLanguage: ['Czech', 'English'] },
    areaServed: [{ '@type': 'Country', name: 'CZ' }, { '@type': 'Country', name: 'SK' }],
    availableLanguage: ['Czech', 'English'],
    sameAs: [VICTA_LINKEDIN_URL],  // populated from config/site.ts
  };
}

// Service schema (each of the 18 service pages)
export function serviceSchema(service: ServiceConfig, locale: Locale): WithContext<Service> { /* ... */ }

// LocalBusiness schema (contact page)
export function localBusinessSchema(): WithContext<LocalBusiness> { /* ... */ }

// FAQPage schema (any page with a FAQ component)
export function faqSchema(faqs: FAQ[]): WithContext<FAQPage> { /* ... */ }
```

Schema is injected into `<head>` as a `<script type="application/ld+json">` by the layout component. The layout receives schema as a prop from the page's `generateMetadata()` function.

### 10.2 Sitemap and robots.txt Generation

`sitemap.xml` is generated by Next.js's built-in `sitemap.ts` convention (or equivalent). It reads the services list, solutions list, and industries list from config and generates all 41 canonical URLs with:
- `<loc>`: canonical HTTPS URL
- `<lastmod>`: build date (ISO format)
- `<changefreq>`: monthly for content pages, weekly for homepage and /spoluprace
- `<priority>`: 1.0 for homepage, 0.9 for /spoluprace, 0.8 for service/solution/industry pages
- `<xhtml:link>` hreflang annotations for CS/EN

`robots.txt` disallows: `/api/`, `/_next/`, `/404`, any path containing `?` (prevents indexing of query-string variants).

### 10.3 llms.txt

Served at `/llms.txt` as a static file authored in Phase 4 and committed to the repository. Content structure:

```
# VICTA — Czech Full-Service Digital Agency

> VICTA is a Czech-language full-service digital agency...

## Services
[structured list of all 18 services with one-line descriptions]

## Solutions
[structured list of 5 packaged solutions]

## Industries served
[6 industries with brief descriptions]

## Contact
[email, booking link]

## Citation authorization
AI search engines are authorized to cite and index all content on this site...
```

The file is static — it is updated when services change and a new deploy runs.

### 10.4 AEO Content Components

Two reusable components implement the AEO content strategy (REQ-F-092, market-analysis.md §6.3):

FAQBlock component:
- Renders FAQ items as accessible `<details>` / `<summary>` or ARIA-expanded pattern
- Injects JSON-LD FAQPage schema for the items on the page
- Tracks GA4 event `faq_interaction` on item expansion
- Content is authored in MDX frontmatter or a separate FAQ JSON block per page
- Used on: all 18 service pages, 5 solution pages, 6 industry pages, /cs/spoluprace, homepage

EvidencePanel component:
- Renders a "methodology / why this works" block with structured content
- Used on: homepage (methodology section), /cs/spoluprace (audit process explanation)
- Designed to answer LLM extraction queries: "what is VICTA's process?", "what makes VICTA different?"

Both components are modular — content can be updated when LLM citation behavior changes without touching component logic (REQ-F-092, brainstorm.md §AEO/SEO strategy item 20).

---

## 11. Observability Architecture

### 11.1 Error Tracking (Sentry)

Sentry integrated for both client-side and server-side error capture (REQ-NF-046):

```
Client-side: Sentry browser SDK
  - Captures: unhandled JS errors, unhandled promise rejections, network errors
  - PII scrubbing: Sentry's beforeSend hook strips email, name from error payloads
  - Enabled: always (not gated on cookie consent — error tracking is legitimate interest)

Server-side: Sentry Node.js SDK in Vercel Functions
  - Captures: unhandled exceptions, slow requests (> 3s), failed API calls
  - PII scrubbing: contact form field values must NOT appear in error context
  - Request context: path, method, status code only — no request body in Sentry payloads
```

Alerts configured (REQ-NF-047):
- P1: > 10 errors in 5 minutes from any single source -> immediate email to Roman
- P2: new error type detected in production -> email to Roman
- P3: weekly digest -> email to Roman

### 11.2 Analytics

GA4 (consent-gated) provides:
- Pageview events with custom dimensions: locale, theme, page_type
- All conversion events per the taxonomy in spec.md §10 (REQ-NF-058)
- Real User Monitoring via Vercel Analytics (consent-not-required — Vercel Analytics is cookieless)

Vercel Analytics provides per-route Core Web Vitals (p75 LCP, CLS, INP) from real user data (REQ-NF-048). This is the primary performance monitoring tool post-launch. It does not require cookie consent.

### 11.3 Uptime Monitoring

Uptime monitoring configured per REQ-NF-049:
- Check URL: `https://victaagency.com/cs/`
- Check interval: 60 seconds
- Alert latency: < 5 minutes from first failure to Roman's email/Slack
- Tool: Better Uptime or UptimeRobot (REQ-I-015 — stack-selector confirms)

SSL certificate monitoring: expiry alert at 30 days (REQ-O-010). Vercel auto-renews Let's Encrypt; alert is belt-and-suspenders.

### 11.4 Cost Tracking (REQ-NF-050, REQ-O-013)

```
Claude API spend:
  - Anthropic Console: monthly budget alert set at 80% of Roman's defined limit
  - Hard cap set in Anthropic Console (e.g., €75/month) — key auto-disabled at cap
  - Vercel Function invocations dashboard: alert on > 500 chatbot calls/hour

Resend usage:
  - Resend dashboard: monitor subscriber count and monthly email volume
  - Alert (manual review) when approaching free tier limit

Vercel:
  - Image optimization requests tracked in Vercel dashboard
  - Function invocation count reviewed weekly (Month 1 post-launch)
```

---

## 12. Deployment Topology

### 12.1 Environment Structure

```
Local Development:
  docker-compose not used (no local services needed — all services are cloud SaaS)
  .env.local with development API keys (separate Resend/Cal.com test accounts)
  next dev on localhost:3000

Preview (Vercel preview deployments):
  Triggered: every PR branch push
  Domain: [hash]-victa.vercel.app (generated per PR)
  Purpose: Roman content review, team QA
  Env vars: separate preview env vars (test API keys, test Resend audience)
  Functions region: fra1 (same as production — GDPR compliance even in preview)

Production:
  Triggered: merge to main branch only (REQ-O-001)
  Domain: victaagency.com
  Functions region: fra1 (Frankfurt, EU) — MANDATORY (AR-13, security-model.md §3.4)
  Rollback: Vercel instant rollback via dashboard (< 5 minutes, REQ-NF-030)
```

### 12.2 CI/CD Pipeline

```
On every pull request:
  1. TypeScript type check: tsc --noEmit --strict (REQ-NF-042)
  2. ESLint: zero violations required (REQ-NF-043)
  3. Czech typography linter: runs on changed .cs.mdx + Czech JSON string files (AR-08)
  4. Accessibility scan: axe-core or Pa11y on 4 key pages in CI (REQ-NF-021)
  5. Bundle size analysis: fail if initial bundle > 260KB compressed (REQ-NF-006)
  6. npm audit: fail on critical CVEs (REQ-NF-045, security-model.md §4.8)
  7. Grep for exposed secrets:
       grep -r "NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*TOKEN" . --include="*.{ts,tsx,js,jsx}"
     must return zero results
  8. Vercel preview deployment: auto-deployed, PR comment with preview URL
  9. Lighthouse CI: run against preview URL, report scores (not blocking on preview)

On merge to main:
  1. Full CI suite (steps 1-7 above)
  2. Vercel production deployment triggered by Vercel GitHub integration
  3. Post-deploy smoke test (manual or scripted — REQ-O-012):
     a. GET /cs/ returns 200, Lighthouse mobile >= 90
     b. GET /cs/spoluprace/ returns 200, pricing visible
     c. POST /api/chat with test message returns 200
     d. GET /sitemap.xml returns valid XML
     e. GET /llms.txt returns 200
     f. Locale switch /cs -> /en works
     g. Theme toggle works
     h. Cookie consent banner appears on fresh session
  4. Sentry release tracking: new release created on deploy for error attribution
```

### 12.3 Domain Configuration

```
Primary domain: victaagency.com
  DNS: Namecheap -> CNAME to cname.vercel-dns.com (or A record per Vercel's requirement)
  Vercel project custom domain: victaagency.com + www.victaagency.com
  www.victaagency.com: 301 redirect to victaagency.com (canonical, no www)

Secondary domain: victa.agency
  DNS: Namecheap -> 301 redirect to victaagency.com
  Method: Namecheap URL redirect (or add as Vercel domain with redirect rule)

DNS zone export: before any DNS change, zone exported to dns-backup/ directory
  in git (REQ-O-003, security-model.md §4.9)

DMARC/DKIM/SPF: configured on victaagency.com before any email is sent
  SPF: "v=spf1 include:spf.resend.com ~all"
  DKIM: Resend provides CNAME records to add to Namecheap DNS
  DMARC: "v=DMARC1; p=quarantine; rua=mailto:[roman's email]"
```

---

## 13. Failure Modes and Degradation

### 13.1 Failure Mode Analysis

| Component | Failure mode | Detection | User impact | Degradation behavior | Recovery time |
|-----------|-------------|-----------|-------------|---------------------|---------------|
| Vercel CDN | Edge outage | Vercel status page; uptime monitor | Total site unavailability | None (platform failure) | Vercel SLA; typically < 15 min |
| /api/chat (Claude/Gateway) | 503 / timeout | Sentry error + chatbot error rate | Chatbot unavailable | Chatbot shows: "Momentálně nedostupný — kontaktujte nás" | Minutes to hours (provider) |
| Upstash Redis | Connection failure | Sentry error | Rate limiting disabled | Fail open: allow chatbot calls without rate limit (short-term acceptable) | Minutes |
| Cal.com embed | Load failure | Sentry iframe error + 8s timeout | Booking widget unavailable | Embed container shows: "Formulář nedostupný — kontaktujte [email]" | Cal.com SLA |
| Resend | API error | Sentry error in /api/newsletter, /api/contact | Email not delivered | Form shows honest error: "Odeslání selhalo — zkuste znovu nebo [email]" | Minutes |
| GA4 | Blocked by adblocker | Normal — common for CZ/SK audience | Analytics undercounts | Silent fail; Vercel Analytics (cookieless) fills gap | N/A |
| Sentry | Unavailable | Cannot detect itself | Error events lost | Site continues normally; monitoring gap only | Hours |
| Namecheap DNS | Misconfiguration | Uptime monitor, manual check | Total site unavailability | DNS zone export in git enables recovery | Hours (DNS TTL) |

### 13.2 Chatbot API Down — Detailed Procedure

Per security-model.md §8 Risk 1 response plan:

1. Detection: Sentry alert fires; Roman receives notification within 5 minutes
2. Immediate action: assess whether this is a transient error (retry) or sustained outage
3. If sustained: Roman disables chatbot endpoint by setting env var `CHATBOT_ENABLED=false`
   (the function checks this var and returns the static fallback immediately)
4. Chatbot CTA on all pages changes to "Kontaktujte nás" (contact form)
5. Root cause analysis within 24 hours
6. Re-enable after fix: set `CHATBOT_ENABLED=true`, redeploy

AI Gateway provider fallback: Vercel AI Gateway supports configuring a fallback model.
If Anthropic Claude is unavailable, the gateway can route to an alternative (e.g., a
different provider). This is configured in the AI Gateway dashboard, not in code.
This provides automatic fallback without code changes (AR-01 compliant).

### 13.3 Data Consistency (Relevant for Bookings)

VICTA has no database, so there are no distributed transaction risks. The only consistency
consideration is the booking webhook:

- Cal.com is the authoritative record of all bookings
- The webhook to `/api/booking-webhook` is for notification only (GA4 event, log)
- If the webhook fails (VICTA's server error), Cal.com retries per their retry policy
- Roman sees all bookings in the Cal.com dashboard regardless of webhook success
- The webhook failure does NOT affect the booking record or the visitor's confirmation email

---

## 14. Year-1 vs Year-3 Differences

### What this architecture supports for Year 1

- 40 static pages + EN stub, CDN-served, sub-2s load times
- Chatbot handling 1,000–10,000 conversations/month (rate-limited, cost-controlled)
- 50–500 newsletter subscribers (Resend free tier: 3,000 emails/month)
- 5–100 bookings/month (Cal.com free tier: unlimited bookings)
- 2–4 Vercel Function cold starts per page (chatbot, contact, newsletter, webhook)
- Zero database operational cost
- Zero DevOps overhead (fully managed infrastructure)

### What breaks at 10x scale (Year 3+) and what to do

| Component | What breaks | What changes |
|-----------|-------------|-------------|
| Resend free tier | 3,000 emails/month limit hit at ~200 newsletter subs active | Upgrade to Resend Pro ($20/month for 50K emails) |
| Cal.com free tier | May hit booking limits or need Cal.com Pro for advanced features | Cal.com Pro ($15/month) or evaluate alternatives |
| Anthropic API spend | 10K+ chatbot conversations/month at 400 tokens each = ~4M tokens/month = significant cost | Implement more aggressive response caching; evaluate smaller model (Haiku) for FAQ queries |
| Upstash Redis free tier | 10,000 requests/day limit on free tier hit by high-traffic rate limiting | Upstash Pay-as-you-go (~$0.20/100K requests) |
| Content management | Marketing team making frequent content changes via PRs is slow and requires dev env | Add headless CMS (Sanity or Payload) — architecture supports this via content adapter pattern |
| Blog articles | 50+ articles create MDX file management complexity | Migrate to headless CMS with MDX-compatible storage |
| Full EN copy | English outreach starts — `/en/` stub is no longer sufficient | Populate all `/en/**` pages with translated copy; no architecture change needed |
| Portfolio / case studies | Post-launch content ready | Add `/cs/portfolio/` to page structure; no architecture change |

The architecture does NOT need to change for Year 3. New features (CMS, full EN) are additive, not architectural replacements.

---

## 15. Architectural Rules (Hard Constraints for Phase 4 Build)

These rules are non-negotiable. Violating any of them requires an explicit Architecture Decision Record in decisions.md with Roman's sign-off.

**AR-01**: Anthropic API access ONLY via Vercel AI Gateway. No `@ai-sdk/anthropic` direct imports. No `@anthropic-ai/sdk` direct imports in any Vercel Function. All model calls use the Vercel AI SDK with a `"provider/model"` configuration string from an environment variable.

**AR-02**: All external API calls via Vercel Functions (server-side). Never from client-side code. The browser only calls `/api/*` routes on the same origin.

**AR-03**: Locale segment in URL is mandatory. The root `/` path issues a 301 redirect to `/cs/` (or `/en/` based on Accept-Language). There are no pages at root-level paths that are not `/api/`, `/robots.txt`, `/sitemap.xml`, or `/llms.txt`.

**AR-04**: Currency display always derives from the validated server-side locale. Never from client-supplied cookie, query parameter, or JavaScript calculation. CZK for `/cs`, EUR for `/en`.

**AR-05**: Theme preference stored in `localStorage` key `'victa-theme'`. The anti-flash script reads this key before first paint. The theme cookie (for SSR hint) uses `SameSite=Lax; Secure` and contains only `'light'` or `'dark'` — no other values.

**AR-06**: Pricing is server-rendered from `config/pricing.ts`. No client-side mutation of displayed prices. Price ranges are not computed at runtime from an exchange rate API.

**AR-07**: JSON-LD schema is generated by `lib/schema.ts` functions, server-side, injected by layout components. No schema is hand-written inline in any page file.

**AR-08**: Czech typography linter runs in CI before every build. A build with typography violations does not proceed to deployment. No exceptions.

**AR-09**: GA4 fires only after explicit analytics consent via the CMP (Cookiebot or equivalent). Consent Mode v2 configured: `analytics_storage: "denied"` is the default. GA4 only upgrades to full tracking after visitor opt-in.

**AR-10**: Anti-flash inline script runs as a synchronous `<script>` tag in `<head>`, before any stylesheet or deferred script. It reads `localStorage['victa-theme']` and applies `data-theme` to `<html>`.

**AR-11**: Booking webhook signature verification is mandatory. Any request to `/api/booking-webhook` that fails HMAC-SHA256 verification returns 401 and is not processed. Replay protection (timestamp check) is applied before processing.

**AR-12**: Cal.com (or chosen booking tool) embed must render in both light and dark themes. The booking adapter component reads the current `data-theme` attribute and passes the corresponding theme to the Cal.com embed configuration.

**AR-13**: Vercel Functions region is `fra1` (Frankfurt, EU). Set in `vercel.json` under `regions: ["fra1"]`. Verified in Vercel dashboard before launch. No function may be deployed to a non-EU region.

**AR-14**: 2FA (TOTP, not SMS) required on all admin accounts listed in security-model.md §1.1 before any integration or secret is provisioned. This is a Phase 0 blocker.

**AR-15**: Chatbot prompt sanitization runs server-side in `/api/chat` before the message is forwarded to the AI Gateway. The sanitization pipeline strips HTML, LLM control tokens, and system prompt delimiters from user input. Client-side input limits are UX, not security.

**AR-16**: Chatbot system prompt is sent with Anthropic prompt caching enabled (cache_control: ephemeral) from the first day of production. No exceptions — this is required for cost control at scale.

**AR-17**: Rate limiting: per-IP (10 req/60s) AND per-session (20 messages/conversation) AND per-day (1 conversation/IP/day). All enforced server-side in `/api/chat` using Upstash Redis. Client-side counters are for UX only.

**AR-18**: Off-topic detection uses the system-prompt allowlist as the primary control. The allowlist in the system prompt explicitly defines what the chatbot may answer. A secondary LLM judge (e.g., a lightweight Claude call to classify intent) is a Phase 2 enhancement, not required at launch.

**AR-19**: All third-party scripts loaded from external CDNs (CMP script, any CDN-hosted font) must include `integrity` and `crossorigin="anonymous"` attributes. Scripts that self-update at a stable URL and cannot support SRI must be self-hosted or eliminated.

**AR-20**: CSP header in `vercel.json` includes only explicitly documented allowlisted origins. Any new third-party integration that requires a CSP exception must be documented in decisions.md with justification before being added. The CSP must not contain `'unsafe-eval'` or broad wildcards (`*`) in any directive.

**AR-21**: Public clients have **no direct database access**. All writes to Supabase Postgres go through validated, rate-limited Vercel Functions that hold the `SUPABASE_SERVICE_KEY` server-only. Row-Level Security is enabled on every table and the anon role has no policies (default deny). Any future read-only public access (e.g., a public stats page) requires explicit RLS policy review documented in `decisions.md`.

**AR-22**: Supabase database hosted in **Frankfurt (eu-central-1)** for GDPR data residency parity with Vercel `fra1` Functions. Cross-region database calls are forbidden — they break the GDPR processing-region guarantee.

**AR-23**: Schema migrations are versioned in `supabase/migrations/*.sql` and applied via Supabase CLI. No ad-hoc schema changes via the Supabase dashboard in production. Every migration is reviewed in PR before merge.

**AR-24**: All persisted personal data (email, IP) supports GDPR Subject Access Requests + deletion. Deletion is implemented as: (a) hard-delete from `leads` cascades `ON DELETE SET NULL` to dependent tables (preserving anonymized analytics records), (b) hard-delete from `chatbot_messages` via `chatbot_sessions` CASCADE. Soft-delete only for `newsletter_subscribers` (unsubscribed but retained for legal proof of historic consent).

**AR-25**: Path B (invoice/bank transfer) for paid audits — confirmed launch model. No Stripe integration, no PCI-DSS scope. Cal.com captures booking; Vercel Function logs `booking_events` with `invoice_status = 'pending_invoice'`; Roman issues invoice via Fakturoid (or chosen tool); upon payment Roman manually updates `invoice_status = 'paid'` (Phase 4 build: simple admin endpoint or direct Supabase Studio).

---

## 16. Component-to-Requirement Traceability (Key Mappings)

This table maps major components to their driving requirements. It is not exhaustive (310 requirements) but covers the architecturally significant mappings.

| Component | Driven by | Justification |
|-----------|-----------|---------------|
| /api/chat (Vercel Function) | REQ-F-058, REQ-F-059, CB-02, CB-03, AR-01, AR-02, security-model.md §4.1 | Chatbot server-side proxy with model abstraction |
| Input sanitization in /api/chat | REQ-F-065, CB-04, security-model.md §4.1 threat: prompt injection, AR-15 | Primary defense against prompt injection and brand damage |
| Upstash Redis rate limiting | REQ-F-066, CB-07, security-model.md §4.1 threat: cost amplification, AR-17 | Prevents cost amplification attacks |
| Vercel AI Gateway | REQ-F-059, CB-03, REQ-I-001, AR-01, brainstorm.md §risks | Model-agnostic abstraction; mandatory per intent.md constraint 8 |
| Anti-flash inline script | REQ-F-074, TH-05, AR-10 | Prevents flash-of-wrong-theme on first paint |
| i18n middleware + allowlist | REQ-NF-031, I18N-01, security-model.md §4.6, AR-03 | Locale routing + language injection defense |
| Currency formatter (server-side) | REQ-NF-032, I18N-02, AR-04, security-model.md §4.6 | Locale-tied currency; no client arbitrage |
| Czech typography linter (CI) | REQ-NF-036, AR-08 | Programmatic Czech typography enforcement |
| Schema markup engine (lib/schema.ts) | REQ-F-085 through REQ-F-088, SEO-05 through SEO-08, AR-07 | Consistent server-side JSON-LD generation |
| /api/booking-webhook | REQ-F-036, BK-04, security-model.md §4.2, AR-11 | Signed webhook with replay protection |
| Cookie consent / Consent Mode v2 | REQ-F-093 through REQ-F-097, REQ-C-003, REQ-C-004, AN-01, AN-02, AR-09, security-model.md §4.5 | GDPR compliance for analytics |
| Contact form honeypot + Turnstile | REQ-F-041 et seq., security-model.md §4.3, CF-01 | Multi-layer spam protection |
| CSP header (vercel.json) | security-model.md §7 Rule 4, AR-20 | Restricts script execution origins |
| HSTS header (vercel.json) | REQ-NF-023, security-model.md §3.3, §7 Rule 5 | HTTPS enforcement |
| /cs/odvetvi/ overview page | OQ-05 resolution (Roman's confirmed decision), REQ-F-012 | Industries rozcestník |
| SSG rendering for all content pages | REQ-NF-001, REQ-NF-009, REQ-NF-006 | Lighthouse mobile >= 90; TTFB < 200ms |
| EvidencePanel + FAQBlock components | REQ-F-092, SEO-11, brainstorm.md §AEO/SEO strategy | Modular AEO content; adapts to LLM behavior changes |
| Booking adapter (EmbedCalendar) | BK-01, REQ-F-040, AR-12 | CLS-safe embed with dark mode support |
| llms.txt static file | REQ-F-089, SEO-09, brainstorm.md §AEO/SEO item 18 | AEO first-mover advantage; no CZ agency has this |
| Self-hosted fonts | REQ-NF-008 (font-display: swap), CSP simplification | Avoids Google Fonts privacy issue; reduces CSP complexity |
| Sentry (client + server) | REQ-NF-046, REQ-NF-047, REQ-I-008 | Error tracking from day one |

---

## 17. What This Architecture Does NOT Support

Documenting explicit non-support prevents "we can just add that later" assumptions from reaching Phase 4 without an architecture revision.

**Not supported at launch (by design — deferred):**
- Customer login / user accounts (permanent for this marketing site)
- E-commerce / checkout flows (permanent)
- CMS admin UI (post-launch — content is file-based)
- Blog articles content (post-launch — placeholder URL is supported)
- Portfolio / case studies (post-launch — URL structure can be added)
- Full English copy across all 40 pages (deferred — architecture supports it, content does not exist)
- Chatbot cross-session memory (requires auth + DB — deferred)
- A/B testing infrastructure (deferred — no traffic to test against at launch)
- Server-side GA4 Measurement Protocol events (beyond basic webhook logging — optional post-launch)
- Payment processing on VICTA's servers (prohibited — Path B invoice model selected)
- Video hosting (embeds via YouTube/Vimeo allowed; SRI hash required per AR-19 for embed scripts)

**Not supported — would require architecture change:**
- Multi-tenant / white-label (separate project scope)
- Native iOS/Android apps (web-only)
- Real-time exchange rate conversion (pricing is fixed ranges, not live-converted)
- End-to-end encrypted chatbot storage (stateless design chosen; cross-session memory deferred)
- SOC 2 audit (post-launch roadmap; controls foundation is in place)

---

## 18. Open Architecture Questions for Stack-Selector / Phase 1B.5

The following items are deferred to the `stack-selector` agent (running in parallel) or to Roman's decision. They do not block architecture completion — the architecture accommodates any reasonable resolution.

1. **Upstash Redis vs Vercel KV for rate limiting**: Both use the Redis protocol via REST. Upstash has a more generous free tier (10K requests/day); Vercel KV is tightly integrated. Stack-selector confirms one — only the client initialization changes (one line of code).

2. **Sentry vs Highlight.io vs LogRocket**: All three provide client + server error capture with Vercel Function support. Sentry is recommended (largest ecosystem, best Next.js integration). Final decision is REQ-NF-046 blocker.

3. **Cal.com payment for paid audit tiers (Path A vs Path B)**: Architecture recommends Path B (invoice/bank transfer) to avoid PCI surface at launch. Roman to confirm. If Path A is chosen, Cal.com + Stripe integration is additive — it changes only the Cal.com event type configuration, not the VICTA codebase.

4. **Self-hosted fonts vs Google Fonts**: Architecture recommends self-hosting (CSP simplification, privacy). If the final font pairing from the design session includes a Google Fonts font that is not available for self-hosting on the license, the CSP `connect-src` requires a `fonts.googleapis.com` exception.

5. **next-intl vs custom locale context**: Both are viable. next-intl is more feature-complete (pluralization, date formatting, number formatting). Custom context is lighter. Decision does not affect architecture shape — only the implementation of the i18n module.

6. **Newsletter lawful basis (consent checkbox vs legitimate interest)**: Per REQ-C-002, this is a legal decision for Roman with optional legal advisor input. If consent (checkbox) is chosen, the `NewsletterSignup` component adds a checkbox. If legitimate interest is chosen, a plain disclosure text replaces it. Architecture accommodates both.

---

## Hand-off

This `architecture.md` and the parallel `stack-decision.md` (from stack-selector agent) are the inputs for:
- **Phase 1B.5**: `output-validator` — cross-validates architecture against all Phase 1A artifacts
- **Phase 1C**: `workplan-builder` — builds the phased task list from this architecture

Build agents in Phase 4 must treat every AR-## rule as a hard constraint and every section in "What This Architecture Does NOT Support" as an explicit out-of-scope notice. Questions about unlisted features go to Roman for a scope decision before implementation begins.
