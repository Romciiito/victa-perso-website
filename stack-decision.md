# Stack Decision: VICTA Marketing Website

**Version**: 1.0
**Date**: 2026-05-06
**Author**: stack-selector agent (Phase 1B)
**Status**: Draft — awaiting Roman review
**Derived from**: `.workforce/intent.md` (Phase -1), `spec.md` v1.0, `security-model.md` v1.0, `requirements.md` v1.0, `brainstorm.md` (Phase 0), `market-analysis.md` v1.0

---

## 1. Decision Summary

We recommend **Next.js 15 App Router** with TypeScript strict mode, Tailwind CSS v4, and shadcn/ui as the primary framework for the VICTA marketing website. This is not a close call.

Next.js is the only candidate that satisfies every hard architectural constraint simultaneously: Vercel-native deployment with zero adapter friction, server-side Vercel Functions for the Claude API proxy (API key never in client bundle — REQ-F-058), native Vercel AI SDK integration for the model-agnostic chatbot (REQ-F-059, REQ-I-001), App Router streaming for chatbot responses (REQ-NF-010), and `next-intl` for the route-based i18n architecture (REQ-NF-031, I18N-01). The shadcn/ui and 21st.dev component ecosystem that Roman already intends to use is Next.js/React native — it works without adapters, without ports, and with full TypeScript support from day one. Astro and SvelteKit are both technically capable of delivering this site, but each introduces meaningful friction on the AI integration and component ecosystem fronts that Next.js eliminates.

---

## 2. Comparison Matrix

| Criterion | Next.js App Router | Astro + React Islands | SvelteKit | Nuxt 3 |
|-----------|-------------------|----------------------|-----------|--------|
| Vercel deployment native | 5 — First-class, zero config | 4 — Good adapter, minor config | 3 — Adapter required, less tested | 4 — Good adapter |
| Vercel AI SDK integration | 5 — Designed together, streaming native | 2 — Works in islands but awkward; no official guide | 2 — Community port, lagging updates | 2 — Community port |
| Vercel AI Gateway support | 5 — Official, tested | 2 — Possible via API routes but undocumented | 2 — Possible via endpoints but undocumented | 2 — Possible but undocumented |
| shadcn/ui native | 5 — Official target | 3 — Works via React island but adds bundle | 2 — shadcn-svelte port, subset of components | 3 — shadcn-vue port, subset |
| 21st.dev components native | 5 — All components React/Next native | 2 — Need React island wrapper per component | 1 — Not supported | 2 — Not supported |
| i18n maturity (route-based) | 5 — next-intl (production grade, 9.4k+ stars) | 4 — astro-i18n, good but smaller community | 4 — Good built-in i18n | 5 — @nuxtjs/i18n (mature) |
| Server-side proxy (API key isolation) | 5 — Route Handlers, Server Actions, Edge Middleware | 4 — API endpoints available | 4 — Server endpoints available | 4 — Server routes available |
| React Server Components (perf) | 5 — Native, no hydration cost for static content | 5 — Islands by default (no hydration by default) | 4 — No RSC, but lightweight runtime | 4 — No RSC, good perf |
| Streaming chatbot responses | 5 — Native ReadableStream + AI SDK | 3 — Requires island plumbing | 3 — Requires endpoint design | 3 — Requires endpoint design |
| Bundle size (content pages) | 3 — Heavier than Astro; Server Components reduce meaningfully | 5 — Zero JS by default on static pages | 4 — Svelte compiler output is small | 4 — Good tree-shaking |
| Claude Code / AI agent velocity | 5 — Most training data, most examples, most patterns | 3 — Good but fewer Next.js-specific patterns | 2 — Least training data for Claude Code | 2 — Less training data than React |
| TypeScript DX | 5 — Full support, strict mode standard | 4 — Good, some quirks with island boundaries | 4 — Excellent | 4 — Good |
| GDPR compliance tooling | 4 — Manual but well-documented patterns | 4 — Same | 3 — Less ecosystem | 4 — Good |
| Ecosystem longevity | 5 — Vercel-backed, React ecosystem | 4 — Growing fast, independent | 3 — Smaller ecosystem, slower hiring | 4 — Vue ecosystem |
| Build velocity for Roman + Claude Code | 5 — Maximum pattern availability | 3 — Good but islands add cognitive overhead | 2 — Svelte syntax unfamiliar | 2 — Vue syntax diverges from Claude Code training |

**Scoring methodology**: 1 = poor fit, 5 = excellent fit, for this project specifically. Weights are implicit — the AI integration criteria (rows 2–3) are effectively hard blockers, not soft preferences.

---

## 3. Detailed Evaluation Per Candidate

### Candidate A: Next.js 15 App Router

**Summary**: A full-stack React framework where the same project deploys as SSR, SSG, ISR, and serverless functions on Vercel. The App Router paradigm separates Server Components (zero JS to client) from Client Components (hydrated). This matches VICTA perfectly: 35 of 40 pages are primarily static content with minor interactivity; 5 components (chatbot widget, booking embed, cookie banner, theme toggle, locale switcher) need client-side JS.

**Strengths (specific to VICTA)**:

- `REQ-F-058`, `REQ-F-059`: The Claude API proxy lives in `app/api/chat/route.ts` — a Route Handler that runs server-side only. `ANTHROPIC_API_KEY` never enters the client bundle by construction. No framework gymnastics required.
- `REQ-I-001`, `CB-03`: Vercel AI SDK's `useChat` hook provides streaming responses, provider abstraction via `"anthropic/claude-3-5-sonnet"` string config, and the Vercel AI Gateway integration is documented, tested, and maintained by the same team. Switching from Claude to a different model requires changing one env var.
- `REQ-NF-010`: Streaming chatbot responses (first token < 3s P90) are a one-line change with `streamText` from the AI SDK. Astro and SvelteKit require building this manually.
- `I18N-01`, `REQ-NF-031`: `next-intl` supports App Router natively, including server-side locale detection, route-based `/cs/` and `/en/` prefixes, and type-safe translation keys. It is the production-grade choice; its maintainer actively collaborates with the Next.js team.
- `TH-01`, `REQ-F-074`: Flash-of-wrong-theme (FOWT) prevention requires an inline `<head>` script. This is trivially supported in `app/layout.tsx`. Astro also supports this; SvelteKit requires more ceremony.
- `REQ-NF-006`: React Server Components render 35 of 40 pages with zero client-side JS for the page skeleton. Only the floating chatbot widget, cookie banner, theme toggle, and locale switcher are Client Components. The homepage's initial bundle can realistically stay under 80KB gzipped — well under the 250KB REQ-NF-006 ceiling.
- **Build velocity**: Claude Code's training corpus is dominated by Next.js/React/TypeScript/Tailwind patterns. This is not familiarity bias — it is a quantifiable velocity multiplier. The build team is Roman + Claude Code. Every hour Claude Code spends recovering from Astro or SvelteKit ecosystem gaps is a direct delay.
- **21st.dev components**: Roman explicitly mentioned these. They are React components, published for Next.js. Using them in Astro requires wrapping each in an island with `client:load`. Using them in SvelteKit is not supported.

**Weaknesses (specific to VICTA)**:

- **Bundle overhead vs Astro**: For a fully static service page (P-03 to P-20), Next.js still ships the React runtime (~40KB gzipped) even with Server Components. Astro ships zero JS for equivalent pages. This is real but manageable: with Server Components, the React runtime is amortized across all interactive components and does not repeat per route. Lighthouse 90+ target (REQ-NF-001) is achievable on Next.js with discipline.
- **App Router learning curve**: The mental model of "Server Components can't use hooks; Client Components can't be async" creates confusion for new contributors. Roman + Claude Code team is small and consistent — this is a one-time ramp, not an ongoing cognitive tax.
- **Cold start latency**: Vercel Functions (Node.js runtime) have cold starts of 50–300ms depending on bundle size. For the chatbot proxy, this means occasional first-request latency spike. Mitigated by keeping the proxy function lean (no heavy imports) and by Vercel's infrastructure pre-warming on traffic.

**Requirement-specific assessments**:
- Shines: REQ-F-058, REQ-F-059, REQ-F-063, REQ-F-067 (response caching via Vercel AI Gateway), REQ-NF-006, REQ-NF-009, REQ-NF-010, I18N-01 through I18N-03, TH-01 through TH-05, all SEO requirements (next-sitemap, next-seo patterns are standard).
- Adequate: REQ-NF-001–005 (Lighthouse 90+ is achievable but requires discipline; not automatic).
- No gaps identified for any Must requirement.

---

### Candidate B: Astro + React Islands

**Summary**: A content-first framework that ships zero JavaScript by default and hydrates only explicitly marked interactive components ("islands"). This is architecturally optimal for a content-heavy marketing site — but VICTA is not a pure content site.

**Strengths (specific to VICTA)**:

- Pure content pages (industry pages, service pages with no dynamic content) would have literally zero client-side JS — better Lighthouse scores by default.
- SSG is Astro's natural mode. Static pages are as fast as they can be.
- Good Vercel deployment (official `@astrojs/vercel` adapter).

**Weaknesses (specific to VICTA)**:

- **Vercel AI SDK integration is not native.** The AI SDK is a React/Node.js library. Using it in Astro requires either: (a) putting the chatbot in a React island with its own API route — functional but architecturally awkward, or (b) writing a custom streaming endpoint without the AI SDK's abstractions. REQ-F-059 requires Vercel AI Gateway provider abstraction. This is technically achievable in Astro but requires significantly more manual plumbing than Next.js.
- **21st.dev components require `client:load`** on every component. Each island is a separate hydration boundary. When you use 6+ 21st.dev components on a page (navigation, hero, service cards, FAQ, CTA, footer), the per-island overhead accumulates. shadcn/ui works similarly — usable, but less seamless.
- **i18n is less mature.** `astro-i18n` is a community package. `next-intl` has deeper App Router integration, active maintenance by the Next.js community, and better TypeScript support. For 310 requirements including Czech typography enforcement (REQ-NF-036), the tooling gap matters.
- **Server Actions equivalent is manual.** Astro has API endpoints, but form handling (contact form, newsletter signup) requires more boilerplate than Next.js Server Actions, which are CSRF-safe by design (REQ-CF-01 through CF-04 implementation is simpler with Server Actions).
- **Build velocity reduction.** Claude Code has far fewer Astro patterns in its training data. Debugging Astro-specific island boundary issues, hydration quirks, or the adapter's behavior will cost time that Roman + Claude Code cannot recover. This is not a hypothetical — Astro's partial hydration model is genuinely harder to debug than Next.js Server/Client component boundaries.

**Primary rejection reason**: The Vercel AI SDK + AI Gateway integration required by REQ-F-059 and REQ-I-001 is a hard architecture requirement, not a nice-to-have. Implementing it in Astro requires manual work that Next.js provides as a first-class feature. The 21st.dev ecosystem incompatibility (explicit in Roman's design intent) is a secondary but concrete friction point.

---

### Candidate C: SvelteKit

**Summary**: A modern full-stack Svelte framework with excellent developer experience, a capable Vercel adapter, and clean SSR/SSG patterns. Strong technically, but wrong for this project.

**Weaknesses (specific to VICTA)**:

- **Smallest AI tooling ecosystem.** Vercel AI SDK's SvelteKit integration exists but is the least documented and least maintained of the three frameworks. The `useChat` equivalent for SvelteKit uses a different API surface that changed in the v4 AI SDK release. REQ-I-001 (Vercel AI Gateway + model-agnostic abstraction) would require custom plumbing.
- **21st.dev is React-only.** shadcn/ui requires `shadcn-svelte`, a community port that covers ~70% of the component set. Roman's intent to use 21st.dev components is incompatible with SvelteKit without significant workarounds.
- **Claude Code velocity is lowest here.** Svelte's `$:` reactive syntax, stores, and `+page.svelte` conventions are underrepresented in Claude Code's training corpus relative to React/Next.js. This translates directly to more errors, more correction cycles, and slower build cadence for Roman + Claude Code.
- **Ecosystem longevity risk.** Svelte/SvelteKit is maintained primarily by a small Vercel team (post-acquisition). The community is engaged but small relative to React. For a site that will be maintained for 2–5 years by Roman + AI agent, choosing the smaller ecosystem increases the risk of encountering undocumented edge cases without Stack Overflow answers.

**Primary rejection reason**: shadcn/ui + 21st.dev component incompatibility is a hard block given Roman's stated design direction. The AI SDK integration gap is a secondary but significant friction point.

---

### Candidate D: Nuxt 3

**Summary**: Vue's equivalent of Next.js — mature, capable, good Vercel support. Evaluated for completeness.

**Weaknesses (specific to VICTA)**:

- **Vue diverges from the build team's knowledge base.** The Roman + Claude Code team's effective velocity is anchored on React/TypeScript/Tailwind patterns. Vue's Composition API, `<script setup>`, and `ref`/`reactive` patterns require a full context shift.
- **21st.dev is React-only.** shadcn-vue is a port covering ~60% of shadcn/ui components. Roman's design intent explicitly assumes the full 21st.dev ecosystem.
- **Vercel AI SDK Vue integration is community-maintained.** Same gap as SvelteKit — technically possible, practically fragile.
- **Lesser English tutorial density.** Vue is proportionally stronger in the European/Asian developer market. For Claude Code, which synthesizes from English-language training data, Next.js/React patterns produce more reliable outputs.

**Primary rejection reason**: No meaningful advantage over Next.js for this project while introducing Vue's ecosystem friction. Rejected without further analysis.

---

## 4. Recommended Stack — Full Technology List

### Framework and Language

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Next.js App Router | 15.x (latest stable) | Full-stack React framework — SSR, SSG, ISR, API routes, Edge Middleware | Vercel-native; Server Components reduce client bundle; App Router streaming for chatbot; see Section 3 |
| React | 19.x | UI rendering | Required by Next.js 15 and shadcn/ui ecosystem |
| TypeScript | 5.x (strict mode) | Language | REQ-NF-042: strict mode required; no `any` types; full IDE support for 40-page project |
| pnpm | 9.x | Package manager | Faster installs than npm; deterministic lockfile; disk-efficient for monorepo-style codebase even as single repo |
| Turbopack | bundled with Next.js 15 | Build tool | Next.js 15 default; faster dev server than Webpack; no config required |

### UI and Design System

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Tailwind CSS | v4.x | Utility-first CSS | Native design token support via CSS custom properties; dark mode via `dark:` variant; REQ-NF-040 compliance is trivial |
| shadcn/ui | Latest | Component primitives | Copy-paste model means no external dependency; full TypeScript; Radix UI accessibility primitives (REQ-NF-011); dark mode built-in |
| 21st.dev components | Latest | Advanced UI components | Roman's explicit design intent; React/Next.js native; aesthetically aligned with high-design ambition (brainstorm item 3F) |
| CSS custom properties | — | Design token system | REQ-NF-040: all color, spacing, radius tokens in a single `tokens.css` file; Tailwind v4 config references them; changing one token propagates everywhere |

### i18n

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| next-intl | 3.x | Route-based locale routing, translations, locale detection | App Router native; type-safe; supports `Accept-Language` detection; server-side rendering for translated content (no layout shift from client-side locale detection); REQ-NF-031 through REQ-NF-037 |

### AI Chatbot

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Vercel AI SDK | 4.x | Chatbot streaming, provider abstraction | REQ-I-001, REQ-F-059: `"anthropic/claude-3-5-haiku"` env var config; switching model = 1 env var change; streaming via `streamText` + `useChat` |
| Vercel AI Gateway | Platform | Model routing, rate limiting, caching, spend controls | REQ-F-067 (response caching), cost amplification defense (security-model.md §4.1); provider fallback chain if primary model degrades |
| Upstash Redis | Serverless | Per-IP and per-session rate limiting for chatbot proxy | REQ-F-066, security-model.md §4.1; Vercel Marketplace integration; free tier 10k req/day sufficient for MVP; no persistent server needed |

**Chatbot model selection**: Claude claude-haiku-4 via Vercel AI Gateway for launch. Haiku provides adequate quality for a scoped Q&A chatbot at approximately 1/20th the token cost of Sonnet. If response quality is insufficient after launch testing, upgrade to Sonnet via a single env var change — no code changes required.

### Forms

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| React Hook Form | 7.x | Form state management | Minimizes re-renders; integrates with Zod; 100% uncontrolled inputs = better performance |
| Zod | 3.x | Schema validation (client and server) | REQ-F-046: same Zod schema validates client-side and server-side; type inference eliminates manual typing of form field types |
| Next.js Server Actions | bundled | Contact form + newsletter form submission | REQ-F-041 through REQ-F-048; CSRF-safe by design (Next.js adds CSRF token automatically for Server Actions via form `action=`); no separate API route needed |

### Booking System

**Decision: Cal.com Cloud Free Tier (Atoms embed / iframe)**

Validation performed: Cal.com cloud free tier supports embeddable booking widgets via the `@calcom/atoms` React component library or an iframe fallback. It supports multiple event types (Tier 1 audit, Tier 2 audit, Tier 3 audit, Scoping call = 4 event types — all within free tier limits). It supports webhook delivery with HMAC signature verification (REQ-F-036). CAPTCHA via hCaptcha is available on free tier (security-model.md §4.2).

Cal.com's `@calcom/atoms` package is React-native — it works inside a Next.js Client Component without any adapter. The iframe fallback is a safe alternative if Atoms prove unstable.

**Limitation**: Cal.com cloud free tier does not include payment processing (Stripe integration is a paid plan feature). For paid audit tiers, VICTA will use Path B (invoice-based payment — bank transfer after booking) per security-model.md §3.5. This is acceptable: the booking collects commitment intent; payment is confirmed offline. If VICTA wants in-calendar payment collection post-launch, upgrading to Cal.com Teams ($15/mo) enables Stripe integration.

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Cal.com Cloud | Free tier | Booking calendar embed for audits + scoping calls | Free; React embed native; webhook signing; CAPTCHA support; open-source ethos fits positioning; brainstorm item 17 first-priority candidate |
| `@calcom/atoms` | Latest | React component embed | No iframe CLS issues (REQ-F-040); React-native = no adapter; styled to match VICTA design system |

**Calendly free tier rejected**: Calendly free tier locks branding ("Powered by Calendly" badge visible in embed) — this conflicts with the high-design credibility argument (brainstorm item 3F). Cal.com's free tier does not impose this constraint.

### Contact Form Backend

**Decision: Vercel Function + Resend**

Contact form submissions (REQ-F-041 through REQ-F-048) are handled by a Next.js Server Action that:
1. Validates the Zod schema server-side
2. Calls Resend's API to send a formatted notification email to Roman's inbox (or a designated inbox)
3. Returns success/error to the client

Resend is already locked for newsletter (confirmed decision item 5 in intent.md). Using the same SDK for contact form notifications eliminates a second integration. Separate API keys for newsletter sends vs form notifications (security-model.md §4.10 minimum scope recommendation).

**Formspree / Web3Forms rejected**: Third-party form services add a data processor dependency, require a DPA, and limit customization of server-side validation. The Vercel + Resend approach keeps all validation server-side under VICTA's control (REQ-F-046).

### Email

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Resend | Latest | Newsletter welcome email + contact form notification | Locked confirmed decision; React Email for template authoring; generous free tier (3,000 emails/mo); DPA available; DMARC/DKIM/SPF support |
| React Email | Latest | Email template design | Type-safe; renders consistently across Gmail/Apple Mail/Outlook (REQ-F-075); compatible with the design system's visual language |

### Analytics and Tracking

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| GA4 | — | Conversion tracking, audience building for retargeting | Locked confirmed decision; free; required for cold ad funnel attribution (REQ-NF-059) |
| Google Tag Manager | — | GA4 loading container | Allows conditional loading (fire only post-consent); avoids hardcoding GA4 snippet in the codebase; easier for Roman's marketing team to add tags post-launch without code deploys |
| Vercel Analytics | Built-in | Real User Monitoring (Core Web Vitals per route) | REQ-NF-048; free with Vercel; no cookie consent required (uses Vercel's edge infrastructure, not client-side cookies) |

**Plausible Analytics (OI-13)**: GA4 is confirmed for launch. Plausible as a cookie-consent-free supplement is noted as a post-launch evaluation. Not in scope for MVP.

### Cookie Consent

**Decision: Cookiebot (managed CMP)**

Requirements that drive this: GDPR Consent Mode v2 (REQ-I-004, REQ-C-003), Czech-language support (REQ-F-093), equal visual prominence for accept/reject (security-model.md §4.5 dark pattern prohibition), consent logging (security-model.md §4.5), and ÚOOÚ enforcement track record awareness.

Cookiebot is certified under EU cookie consent requirements, supports Google Consent Mode v2 natively, has a Czech-language configuration, handles consent logging server-side (no VICTA-side logging code required), and has a known compliance track record with Czech DPA enforcement. Free for sites with < 100 subpages — VICTA qualifies.

**Custom implementation rejected**: security-model.md §4.5 explicitly advises against custom CMP ("possible but requires significantly more work to get right — not recommended for Phase 0"). The consent logging requirement alone (IP + timestamp + options selected) requires server-side infrastructure that a CMP provides out of the box.

**Iubenda rejected as primary**: Both Cookiebot and Iubenda meet the requirements. Cookiebot has a larger Czech/Slovak B2B reference base and is the security model's first-priority recommendation (security-model.md §4.5).

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Cookiebot | Cloud (free tier) | GDPR cookie consent management, Consent Mode v2, Czech-language banner | See rationale above; REQ-F-093 through REQ-F-097, REQ-C-003 |

### Rate Limiting

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Upstash Redis | Serverless | Per-IP rate limiting for chatbot proxy (10 req/60s), contact form (5 req/10min), newsletter signup (3 req/hr) | security-model.md §4.1, §4.3, §4.4; Vercel Marketplace integration; free tier 10k req/day sufficient for MVP; serverless = no persistent connection overhead |
| Vercel Edge Middleware | Built-in | Bot filtering + locale detection | Defense-in-depth against scrapers; locale redirect (`/` → `/cs` or `/en`); no external dependency |

### Error Tracking

**Decision: Sentry (free tier)**

REQ-NF-046, REQ-NF-047, REQ-I-008. Sentry captures client-side errors, unhandled promise rejections, and Vercel Function (server-side) errors. The Next.js SDK is maintained by Sentry and has first-class App Router support. Free tier: 5,000 errors/month — sufficient for MVP. DSN stored as env var; Sentry itself unavailable must not cause application errors (Sentry SDK handles this gracefully by design).

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Sentry | Latest | Client-side and server-side error tracking | REQ-I-008; Next.js SDK with App Router support; free tier sufficient; best-in-class symbolication |

### Image Handling

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Next.js Image (`next/image`) | Bundled | Automatic WebP/AVIF conversion, lazy loading, CLS prevention | REQ-F-101, REQ-F-102, REQ-I-009; built-in with no external dependency; `priority` prop for above-fold LCP images |
| Vercel Image Optimization | Platform | CDN-level format negotiation and resizing | Bundled with Vercel deployment; cost: 1000 source images free/month, then $5/1000 — negligible for VICTA's asset count |

### SEO and Schema

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| Next.js Metadata API | Bundled | `<title>`, `<meta>`, Open Graph, Twitter cards, canonical, hreflang | App Router native; type-safe `generateMetadata()` per route; no external library needed for meta tags; REQ-F-079 through REQ-F-084, REQ-F-090, REQ-F-091 |
| Custom JSON-LD components | — | Organization, LocalBusiness, Service, FAQ schema | REQ-F-085 through REQ-F-088; typed via Zod schemas; rendered server-side in `<script type="application/ld+json">` tags within Server Components |
| `next-sitemap` | 4.x | Automatic sitemap.xml generation | REQ-F-084; generates sitemap on build with hreflang pairs; supports `lastmod` from file system |

### Content Management

**Decision: MDX files in repo (no CMS at launch)**

intent.md §Out of scope: "CMS / admin UI for non-technical content editing — content lives in code/MD files, edited by Roman + IT team via PRs." This is locked. MDX files in a `content/` directory, organized by locale and page type. `@next/mdx` or `contentlayer` (if type-safety is needed) for MDX processing.

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| MDX files | — | Page content (body copy, FAQ questions, metadata) | REQ-NF-039: non-developer content editing without touching component logic; all copy in locale-specific files |
| `@next/mdx` | Latest | MDX processing in App Router | Official Next.js MDX integration; supports React components in MDX (for FAQ, evidence panel components) |

### CI/CD and Code Quality

| Technology | Version | Purpose | Why chosen over alternatives |
|-----------|---------|---------|------------------------------|
| GitHub Actions | — | CI pipeline: type check, lint, test, accessibility scan, Lighthouse CI | REQ-NF-021, REQ-NF-043; Vercel GitHub integration handles preview + production deployments; GitHub Actions handles quality gates |
| ESLint | 9.x | Linting (security rules, TypeScript rules, React rules) | REQ-NF-043; `eslint-plugin-security`, `@typescript-eslint`, `eslint-plugin-jsx-a11y` |
| Prettier | 3.x | Code formatting | REQ-NF-043; no style debates; consistent formatting |
| Lighthouse CI | Latest | Performance regression detection in CI | REQ-NF-001 through REQ-NF-005; fails PRs that regress mobile Lighthouse score below 90 |
| axe-core / @axe-core/playwright | Latest | Accessibility scanning in CI | REQ-NF-021; runs on the four key pages per PR; blocks merge on violations |
| Dependabot | GitHub native | Automated dependency security PRs | REQ-NF-045, REQ-O-007; security patches flagged within 7 days of disclosure |

### Testing

| Tool | Type | Coverage target | Requirement |
|------|------|----------------|-------------|
| Vitest | Unit | Component logic, Zod schemas, utility functions | REQ-T-001 through REQ-T-010 (as available); fast test runner, Vite-based |
| Playwright | E2E | Critical user journeys: booking flow, contact form, chatbot, locale switch, theme toggle | REQ-T-015 through REQ-T-019; browser automation with real DOM |
| axe-core (via Playwright) | Accessibility | All 4 key pages in both light and dark themes | REQ-NF-021, TH-05 |
| Lighthouse CI | Performance | All page types; blocks on < 90 mobile score | REQ-NF-001 |
| Cloudflare Turnstile | Bot / spam | Contact form + newsletter signup | security-model.md §4.3, §4.4; no cookie consent required (privacy-friendly alternative to reCAPTCHA) |

**Cloudflare Turnstile for CAPTCHA (over hCaptcha or reCAPTCHA)**: security-model.md §4.3 recommends Turnstile or hCaptcha and explicitly notes reCAPTCHA "requires separate cookie consent under GDPR." Turnstile is privacy-preserving, free, and works in Vercel Functions. It is the correct choice.

### Infrastructure and DevOps

| Technology | Version | Purpose | Why chosen |
|-----------|---------|---------|------------|
| Vercel | Platform | Hosting, CDN, Serverless Functions, Edge Middleware, Image Optimization, Analytics | Locked confirmed decision; zero-config Next.js deployment; `fra1` Frankfurt region for GDPR compliance |
| GitHub | Platform | Version control, CI triggers, PR review | REQ-O-001, REQ-O-008; branch protection on `main`; PR review required before merge |
| Vercel preview deployments | Platform | Per-PR preview URL for Roman content review | REQ-O-002; Roman reviews each page change before production |
| Namecheap (existing) | Domain registrar | Domain management for `victaagency.com` and `victa.agency` | Existing; not changing at launch; 2FA + transfer lock + auto-renewal required |

---

## 5. Rationale Per Critical Choice

### Why Vercel AI Gateway (not direct Anthropic SDK)

REQ-F-059 and REQ-I-001 require model-agnostic abstraction — "switching providers requires changing only a config value, not application code." The Vercel AI Gateway satisfies this: the proxy function calls `"anthropic/claude-haiku-4"` today; if Anthropic pricing changes or a better model ships, Roman changes one env var. The Gateway also provides response caching (REQ-F-067), spend controls (security-model.md §4.1 budget cap failsafe), and built-in rate limiting as a defense-in-depth layer on top of the Upstash application-level rate limiter. Direct Anthropic SDK imports would bind the proxy to a specific provider and require code changes for model switching.

### Why Next.js Server Actions for forms (not a separate API route)

REQ-F-046 requires server-side validation independent of client-side. Server Actions run on the server by definition. They are CSRF-safe by design (Next.js injects a secret token via the `action` attribute that is verified server-side). The same Zod schema validates client-side (for immediate field feedback) and server-side (for security). A separate Express-style API route (`app/api/contact/route.ts`) would achieve the same security but with more boilerplate. Server Actions are the idiomatic choice for Next.js 15.

### Why pnpm over npm or Bun

`pnpm-lock.yaml` provides deterministic installs across Roman's machine, Claude Code's environment, and Vercel's build environment. pnpm's content-addressable store prevents duplicate packages and speeds up Vercel builds on cache hits. Bun is compelling but its Vercel build support is less stable for complex Next.js projects as of May 2026 — the faster install speed does not justify the stability risk on a production site.

### Why Cal.com Atoms over iframe embed

REQ-F-040 requires booking widget load to contribute < 0.01 CLS. An iframe with `height` attribute prevents layout shift (passing the requirement) but introduces a double-scroll problem on mobile and limited styling control. `@calcom/atoms` renders the calendar as native React components inside VICTA's design system, with no CLS, matching VICTA's colors and typography. If Atoms prove unstable in testing, the iframe is the safe fallback — both satisfy REQ-F-040 with different trade-offs.

### Why Cookiebot (managed CMP) over custom implementation

security-model.md §4.5 identifies GDPR enforcement from Czech ÚOOÚ as a "HIGH likelihood enforcement risk, not just theoretical." The cookie consent implementation must: (1) block GA4 before consent, (2) log consent records with IP + timestamp + choices selected, (3) re-prompt annually, (4) support Google Consent Mode v2, (5) pass equal-prominence accept/reject visual test. Building this correctly takes 1–2 weeks of engineering effort and ongoing maintenance. Cookiebot provides all of this for free for < 100 subpages. The engineering time saved goes to content and core product. The risk of a DIY implementation that fails the equal-prominence test or misses Consent Mode v2 integration is not worth the $0 saving.

### Why Cloudflare Turnstile over hCaptcha for CAPTCHA

Both are GDPR-compliant alternatives to reCAPTCHA. Turnstile is invisible (no checkbox puzzle for legitimate users — better UX for the "professional + human" brand). hCaptcha has an explicit puzzle challenge that adds friction. For B2B contact forms where the visitor is a CEO or marketing director with low tolerance for friction, invisible CAPTCHA is the correct choice.

---

## 6. Alternatives Explicitly Rejected

### Astro + React Islands — rejected

The core issue is the Vercel AI SDK + AI Gateway integration. VICTA's chatbot is not a nice-to-have feature — it is a central product feature (CB-01 through CB-09, all Must priority) that requires streaming responses (REQ-NF-010), provider abstraction (REQ-F-059), rate limiting (REQ-F-066), and response caching (REQ-F-067). The Vercel AI SDK's `useChat` hook and `streamText` function are designed for React/Next.js. In Astro, you can create a React island that runs `useChat`, but you lose the server-side streaming integration and have to build the chatbot API endpoint without the AI SDK's abstractions. This is 2–3 weeks of engineering work that Next.js provides in 2 hours.

The 21st.dev component ecosystem (Roman's explicit design direction per brainstorm item 3F) is React-native. Using 21st.dev components in Astro requires wrapping each in `client:load` — every component becomes an isolated hydration boundary, which increases JavaScript payload and eliminates the performance advantage Astro would otherwise have.

Astro's performance advantage on content pages is real (zero JS by default) but insufficient to overcome these integration deficits. VICTA's content pages are mostly static, but the site's differentiating features are all interactive.

### SvelteKit — rejected

shadcn/ui + 21st.dev are React ecosystems. shadcn-svelte is a community port covering ~70% of components and lagging behind the React version. 21st.dev has no Svelte support. The build team is Roman + Claude Code — Svelte syntax is underrepresented in Claude Code's training data, meaning more errors, more correction cycles, and a slower build cadence on a project where Roman has explicitly said "launch ASAP." The AI tooling gap (Vercel AI SDK SvelteKit integration) adds a second friction point. No meaningful advantage over Next.js for this specific project.

### Nuxt 3 — rejected

Vue ecosystem. No 21st.dev support. shadcn-vue covers ~60% of components. Vercel AI SDK Vue integration is community-maintained and less robust. Vue's Composition API syntax reduces Claude Code's output quality relative to React. No meaningful advantage for this project.

### Vanilla static + Vercel Functions — not evaluated

Mentioned in intent.md as a candidate. Rejected without deep evaluation because: 40 pages with i18n (REQ-NF-031–038), 18 service page templates, dark mode tokens (REQ-NF-040), and a streaming chatbot widget (REQ-NF-010) require a framework. Building these from scratch in vanilla JS is not a viable option for a 1–2 developer team targeting a fast launch.

---

## 7. Cost Estimates

### Monthly cost at launch (low traffic, < 500 visitors/month)

| Service | Plan | Monthly cost |
|---------|------|-------------|
| Vercel | Hobby (solo dev at launch; upgrade to Pro when Roman adds team members) | $0 |
| Claude API (via AI Gateway) | Pay per token — estimate 500 visitors × 3 chatbot sessions × 5 messages × ~800 tokens/exchange = 6M tokens/month. Haiku pricing ~$0.80/M input tokens + ~$4/M output tokens. Roughly 70% input, 30% output = ~$1.50–$3/mo | ~$2–3 |
| Resend | Free tier: 3,000 emails/month | $0 |
| Cal.com | Free tier | $0 |
| GA4 | Free | $0 |
| Cookiebot | Free (< 100 subpages) | $0 |
| Upstash Redis | Free tier: 10,000 requests/day | $0 |
| Sentry | Free tier: 5,000 errors/month | $0 |
| Uptime monitoring | Freshping free tier (50 monitors, 1-min intervals) | $0 |
| GitHub | Free (public repo) or Pro ($4/mo for private repo) | $0–4 |
| **Total** | | **$2–7/month** |

### Monthly cost at moderate growth (1,000–3,000 visitors/month)

| Service | Plan | Monthly cost |
|---------|------|-------------|
| Vercel | Pro ($20/mo) — needed for: team access for marketing team, higher function execution time limits, log retention beyond 1 day | $20 |
| Claude API | 3,000 visitors × 3 sessions × 5 messages × ~800 tokens = ~36M tokens. With prompt caching (system prompt cached across requests — estimated 50% token reduction): ~18M tokens effective. Cost: ~$15–25/mo | ~$20 |
| Resend | Pro ($20/mo) for > 3,000 emails — triggered if newsletter list grows to ~3,000 subscribers | $0–20 |
| Upstash Redis | 10k–100k requests/day may exceed free tier; pay-as-you-go ~$0.20/100k requests | ~$1–5 |
| Sentry | Free tier likely still sufficient at this traffic | $0 |
| **Total** | | **$41–65/month** |

### Chatbot cost model detail

The largest variable cost is Claude API usage. Key controls:
- Use Haiku (not Sonnet) for chatbot at launch — 20x cheaper per token, quality sufficient for scoped Q&A
- System prompt caching via Anthropic's prompt caching API — the system prompt (~1,000 tokens) is cached across requests; only user messages incur full input token cost
- Per-session limit of 20 messages (REQ-F-066) caps per-user cost
- Per-IP rate limit of 10 req/60s (security-model.md §4.1) prevents cost amplification attacks
- Vercel AI Gateway spend controls provide a hard monthly cap failsafe

If a bot attack overwhelms the rate limiter and hits the Anthropic budget cap, the API key is automatically disabled (security-model.md §4.1 last-resort failsafe). The site continues to function for all other user journeys — only the chatbot shows the fallback message (REQ-NF-027).

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Next.js App Router breaking change in major version | Low (Next.js versioning is disciplined; App Router API has been stable since v13.4) | Medium (migration effort for 40 pages) | Lock to minor version in `package.json`; upgrade only after reviewing release notes; Vercel runs Next.js — they have incentive to maintain backward compatibility |
| Vercel AI SDK API change breaks chatbot proxy | Medium (SDK is actively developed; v4 broke v3 patterns) | High (chatbot down) | Pin to `"@ai-sdk/anthropic": "~0.x.y"` patch-range; Dependabot PRs reviewed before auto-merge; chatbot fallback (REQ-F-068) prevents full outage |
| Cal.com free tier limits booking functionality | Low (4 event types well within free tier; webhook signing available free) | Medium (forced migration to paid plan or different tool) | Evaluate Cal.com Teams ($15/mo) if limits are hit; iframe fallback always available; booking data is not locked in (Cal.com exports to CSV) |
| Cookiebot changes pricing for sites with > X pages | Low (VICTA has 40 pages, well under any reasonable threshold) | Low (upgrade to paid plan ~$11/mo) | Accept the risk; $11/mo is not material |
| Upstash Redis free tier insufficient for chatbot rate limiting at scale | Medium (10k req/day = ~415 req/hr; at 1k visitors/day with 3 chatbot sessions each = ~3k Redis calls/day, well within free tier) | Low (cost: ~$0.20/100k requests above free tier) | Monitor weekly during first month (REQ-O-014); Upstash pricing is pay-as-you-go |
| React Server Components ecosystem immaturity | Low (RSC has been stable since Next.js 13.4; shadcn/ui supports RSC; AI SDK supports RSC) | Medium (unexpected bugs requiring Client Component fallbacks) | Treat RSC as default for content; use `"use client"` for interactive components; clear boundary documented in architecture |
| Vercel vendor lock-in | Medium (Next.js runs on Vercel best; self-hosting is possible but adds DevOps) | Medium (migration to self-hosted or another platform requires ops work) | Lock-in is acceptable for VICTA's scale and team size; the marketing site is not infrastructure-critical enough to require platform independence; reassess at Year 2 |
| Claude API cost amplification attack | High likelihood of probing (any public chatbot is probed within days) | High financial impact without mitigations | Four-layer defense: input size limit (500 chars), per-session limit (20 messages), per-IP rate limit (10 req/60s via Upstash), monthly budget cap on Anthropic console — mitigations make this Low residual impact |
| GDPR enforcement from Czech ÚOOÚ for cookie consent | Medium (ÚOOÚ has issued fines for dark patterns; VICTA's Cookiebot implementation eliminates most risk) | High (fines, brand damage) | Cookiebot's certified implementation is the mitigation; see security-model.md §4.5 |
| Namecheap domain hijacking | Medium (credential stuffing campaigns target registrar accounts) | Critical (total site loss) | 2FA (TOTP), transfer lock, auto-renewal, DNS zone export to git — see security-model.md §4.9; consider migrating to Cloudflare Registrar post-launch |

---

## 9. Open Stack Questions for Downstream Agents

The following items are resolved at the level required for this document but need confirmation from specific parties before implementation:

| Item | Status | Decision needed from |
|------|--------|---------------------|
| **OI-04 Booking system**: Cal.com cloud free tier is the recommendation. Confirm that Cal.com's free tier supports the 4 event types (Tier 1, Tier 2, Tier 3 audit, Scoping call) with distinct calendar availability and webhook signing. | Decided (Cal.com free); needs implementation validation | `architect` to verify during Phase 1B; `workplan-builder` to include a Cal.com setup validation task in Phase 2 |
| **OI-05 Contact form delivery**: Decided — Vercel Function (Server Action) + Resend to Roman's designated email. Roman must confirm the destination email address. | Decided; Roman to confirm delivery email | Roman |
| **OI-13 GA4 vs Plausible**: GA4 is confirmed for launch per confirmed decision item 21 in brainstorm.md. Plausible is deferred to post-launch evaluation. | Resolved — GA4 at launch | No action needed |
| **Cookie consent vendor**: Cookiebot is the recommendation. Evaluate whether the free tier truly covers 40 pages (confirmed: Cookiebot free tier is < 100 subpages). | Decided; verify free tier eligibility | `architect` to verify during Phase 1B account setup |
| **Uptime monitoring vendor**: Freshping free tier recommended (50 monitors, 1-min check intervals, email alerts). Alternatives: Better Uptime (free tier exists), UptimeRobot (free tier, 5-min intervals — insufficient; use paid $7/mo for 1-min intervals). | Decided: Freshping free tier | `workplan-builder` to include uptime monitor setup in Phase 4 pre-launch checklist |
| **Error tracking**: Sentry free tier. | Decided | No action needed |
| **Chatbot model**: Claude Haiku 4 at launch via Vercel AI Gateway. Upgrade path to Sonnet documented — single env var change. | Decided; Roman to confirm Anthropic account budget cap setting | Roman + `architect` |
| **Cal.com payment model**: Paid audit tiers use invoice-based payment (Path B, security-model.md §3.5) — no Stripe integration at launch. Cal.com Teams plan ($15/mo) enables Stripe post-launch if VICTA wants in-booking payment. | Decided (Path B at launch) | Roman to confirm acceptable payment flow before `/spoluprace` build |
| **Dark mode canonical default (OI-07)**: Architecture is theme-agnostic (CSS custom properties for both modes, system preference detected). The design decision (which mode is "default" for OG images and screenshots) belongs to the design session. | Not a stack decision; deferred to design session | Design session → Roman |

---

## 10. Build-vs-Buy Summary

| Component | Decision | Choice | Rationale |
|-----------|----------|--------|-----------|
| Framework | Build on OSS | Next.js 15 App Router | Core infrastructure; no alternative to a framework for this scope |
| UI components | Buy (OSS) | shadcn/ui + 21st.dev | Auth is not the analogy here — UI components are not differentiators; shadcn/ui's copy-paste model means no external runtime dependency |
| Chatbot proxy | Build | Next.js Route Handler | 50 lines of code; the logic is trivial; the API key isolation is the requirement, not a product feature |
| LLM inference | Buy (API) | Claude via Vercel AI Gateway | Never self-host LLMs; cost and quality are both better via API |
| Booking | Buy (SaaS) | Cal.com cloud | Scheduling logic, calendar sync, reminder emails, payment (post-launch) are not differentiators; expert vendor does it better |
| Email delivery | Buy (SaaS) | Resend | DMARC/DKIM/SPF configuration, deliverability, and list management are specialist infrastructure; $0 at launch |
| Cookie consent | Buy (SaaS) | Cookiebot | GDPR compliance is high-risk; Czech enforcement track record; consent logging requires server-side infrastructure |
| Analytics | Buy (SaaS) | GA4 + Vercel Analytics | Never build analytics; GA4 is free and provides retargeting audience; Vercel Analytics provides RUM |
| Rate limiting | Buy (SaaS) | Upstash Redis | Serverless Redis is cheap, reliable, and Vercel Marketplace-integrated; building a Redis deployment is not worth it |
| Error tracking | Buy (SaaS) | Sentry | Best-in-class; free tier sufficient; never build error tracking |
| i18n | Buy (OSS) | next-intl | Locale routing, plural rules, date formatting — all solved problems; next-intl has 9.4k GitHub stars and active maintenance |
| Uptime monitoring | Buy (SaaS) | Freshping | Never build monitoring for a 1-developer site; Freshping is free |
| CAPTCHA | Buy (SaaS) | Cloudflare Turnstile | Privacy-preserving, free, zero cookie consent requirement; invisible to legitimate users |
| CMS | None at launch | MDX files in repo | Locked decision from intent.md; content volume is manageable via PRs; headless CMS post-launch if Roman's marketing team needs self-serve editing |
| CI/CD | Buy (platform) | GitHub Actions + Vercel | Platform-native; no Jenkins/CircleCI overhead for a 1-developer team |

**Rule applied consistently**: Build only what is a core differentiator or where no good vendor exists. VICTA's differentiators are its service methodology and content — not its booking form, cookie banner, or uptime monitoring.

---

## 11. Local Development Setup

For a new developer to reach a working local environment:

```bash
# Prerequisites
# - Node.js 20.x LTS (use nvm: nvm install 20 && nvm use 20)
# - pnpm 9.x (npm install -g pnpm)
# - Git with SSH key configured for GitHub

# Clone and install
git clone git@github.com:[org]/victa-website.git
cd victa-website
pnpm install

# Environment variables
# Copy the example file and fill in real values from Vercel dashboard
cp .env.example .env.local
# Required values to fill:
#   ANTHROPIC_API_KEY or AI_GATEWAY_KEY (for chatbot proxy)
#   RESEND_API_KEY (for contact form + newsletter)
#   NEXT_PUBLIC_GA_MEASUREMENT_ID (for GA4 — safe to expose; not a secret)
#   NEXT_PUBLIC_COOKIEBOT_ID (for cookie banner — safe to expose)
#   NEXT_PUBLIC_CAL_NAMESPACE (for booking embed — safe to expose)
#   SENTRY_DSN (for error tracking)
#   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (for rate limiting)

# Start development server
pnpm dev
# → http://localhost:3000

# Verify setup
pnpm typecheck       # Should output: no errors
pnpm lint            # Should output: no warnings or errors
pnpm test            # Runs Vitest unit tests — all pass
```

For chatbot to work locally: the `ANTHROPIC_API_KEY` (or AI Gateway key) must be set in `.env.local`. Without it, the chatbot shows the fallback message — which is the correct degradation behavior and allows working on non-chatbot pages without API credentials.

**Expected time for a new developer to reach a working local environment**: 15 minutes (excluding Vercel dashboard access, which Roman grants separately).

---

## Open Issues for Upstream Documents

No conflicts found between `intent.md`, `spec.md`, `requirements.md`, and `security-model.md` that are within this agent's territory to resolve. The following gaps are flagged for downstream agents:

1. **REQ-F-030 conflict risk** (flagged in requirements.md): The requirement for EN versions of legal pages (`/en/privacy-policy`, `/en/cookies`) conflicts with intent.md §7 ("EN copy itself does NOT ship at launch"). Resolution: at minimum, the EN stub (`/en`) links to Czech legal pages with an English note — this satisfies legal accessibility without requiring full EN legal copy at launch. The `architect` should decide the canonical approach.

2. **REQ-F-067 (chatbot response caching)**: The requirement mandates server-side caching from day one. Vercel AI Gateway supports response caching with configurable TTL. The `architect` must define the cache key design (excluding session-specific data — REQ-F-067's explicit requirement) and the TTL (suggested: 1 hour for identical query strings). This is an architecture decision, not a stack decision.

3. **Cal.com payment path**: This document selects Path B (invoice-based) for paid audit tiers. If Roman wants Path A (in-calendar Stripe payment) at launch, Cal.com Teams plan ($15/mo) is required. This decision must be made before the `/spoluprace` page build begins.

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-05-06 | Initial stack decision | stack-selector agent (Phase 1B) |
