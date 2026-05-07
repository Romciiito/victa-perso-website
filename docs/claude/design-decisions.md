# Technology Stack and Design Decisions: VICTA Marketing Website

**Version**: 1.0
**Date**: 2026-05-06
**Author**: stack-selector agent (Phase 1B)
**Status**: Draft
**Derived from**: spec.md v1.0, security-model.md v1.0, requirements.md v1.0, .workforce/intent.md
**Full evaluation**: See `/stack-decision.md` at project root for the complete scored analysis.

---

## 1. The Recommendation (Summary)

**Next.js 15 App Router** with TypeScript strict mode, Tailwind CSS v4, shadcn/ui, next-intl, and the Vercel AI SDK. See stack-decision.md §4 for the complete component list.

This was not a close call. The three deciding constraints were: (1) Vercel AI SDK + AI Gateway for the model-agnostic chatbot proxy (REQ-F-059, REQ-I-001), (2) shadcn/ui + 21st.dev component ecosystem (Roman's explicit design direction), and (3) Claude Code as the primary build agent (highest velocity on Next.js/React patterns). All three constraints point to the same stack.

---

## 2. Key Architectural Choices and Why

### Framework: Next.js 15 App Router, not Astro

Astro would produce slightly better Lighthouse scores on pure content pages (zero JS by default). We did not choose Astro because:

- The Vercel AI SDK streaming chatbot integration (REQ-NF-010, REQ-F-059) is a first-class Next.js feature requiring 2 hours to implement. In Astro, it requires building custom streaming endpoint plumbing — estimated 2–3 extra weeks.
- Roman explicitly intends to use 21st.dev components. They are React-native. Astro requires wrapping each in `client:load`, degrading performance and adding architectural friction.
- Claude Code (the primary build agent) produces higher quality and fewer errors on Next.js/React than on Astro. Slower build velocity on a "launch ASAP" project is a concrete cost.

### UI: shadcn/ui, not a component library with an npm runtime dependency

shadcn/ui uses a copy-paste model: you own the component code. There is no `@shadcn/ui` package to version-lock or get breaking changes from. This is the correct choice for a site that will be maintained for 2–5 years by a small team — no dependency to abandon you.

### i18n: next-intl, not next-i18next or a custom solution

`next-intl` is the only i18n library with documented, maintained App Router support. `next-i18next` targets the Pages Router. A custom solution for 40 pages with Czech typography rules (REQ-NF-036), locale-tied currency (REQ-NF-032), and hreflang generation (REQ-F-091) would take weeks to build correctly. next-intl takes hours.

### Chatbot model: Claude Haiku 4, not Sonnet

The chatbot answers scoped questions about VICTA's services. It does not generate marketing copy, write code, or reason over long contexts. Haiku is approximately 20x cheaper than Sonnet per token. The quality difference is irrelevant for this use case. If quality proves insufficient after testing, upgrading is a single env var change — that is the explicit design of REQ-I-001.

### CAPTCHA: Cloudflare Turnstile, not Google reCAPTCHA

security-model.md §4.3 explicitly prohibits reCAPTCHA: "NOT Google reCAPTCHA, which requires separate cookie consent under GDPR." Turnstile is invisible to legitimate users (better UX for the B2B persona), free, and cookie-consent-free.

### Cookie consent: Cookiebot, not custom

security-model.md §4.5 identifies Czech ÚOOÚ enforcement as "HIGH likelihood, not just theoretical" and explicitly advises against custom implementation. Cookiebot provides certified GDPR compliance, Google Consent Mode v2, Czech-language UI, and consent logging — for free on a 40-page site. The engineering time saved pays for itself immediately.

### Rate limiting: Upstash Redis, not in-memory

In-memory rate limiting breaks across Vercel Function cold starts and multiple edge replicas. Upstash provides serverless Redis that persists rate limit counters across invocations. It integrates with Vercel Marketplace. Free tier (10k req/day) covers launch-scale traffic with room to spare.

### Booking: Cal.com, not Calendly

Calendly free tier shows "Powered by Calendly" branding in the embed — incompatible with the high-design credibility argument. Cal.com free tier has no forced branding. Cal.com is also React-native via `@calcom/atoms`, enabling design-system-consistent embedding.

### Forms: Server Actions, not separate API routes

Next.js 15 Server Actions are CSRF-safe by design (the framework injects a secret token verified server-side). A separate API route achieves the same security but requires explicit CSRF middleware. Server Actions are the idiomatic Next.js 15 pattern; they reduce boilerplate for REQ-F-041 through REQ-F-048.

### Contact form delivery: Resend (same as newsletter)

Resend is already locked for newsletter (confirmed decision item 5). Using the same SDK for contact form notification emails eliminates a second integration, second DPA, and second API key management task. Separate Resend API keys for newsletter vs form delivery (security-model.md minimum scope recommendation).

---

## 3. What Was Rejected and Why

| Option | Rejected for |
|--------|-------------|
| Astro + React Islands | AI SDK streaming integration requires 2–3 weeks of custom plumbing vs 2 hours in Next.js; 21st.dev components require island wrappers; Claude Code velocity is lower |
| SvelteKit | shadcn/ui + 21st.dev unsupported; AI SDK integration is community-maintained and lagging; Svelte syntax underrepresented in Claude Code training data |
| Nuxt 3 | Same ecosystem gaps as SvelteKit; Vue diverges from the build team's effective knowledge base |
| Custom cookie consent | security-model.md explicitly advises against it; consent logging alone requires server-side infrastructure |
| reCAPTCHA | Requires cookie consent under GDPR (security-model.md §4.3 explicit prohibition) |
| Calendly | Free tier forces "Powered by Calendly" branding — incompatible with design credibility argument |
| CMS at launch | Locked out-of-scope decision (intent.md); 40 pages edited via PR is manageable for the build team |
| In-memory rate limiting | Breaks across Vercel Function cold starts and multi-region replicas |
| Direct Anthropic SDK (no gateway) | Binds proxy to specific provider, requires code change to swap model, eliminates REQ-F-059 compliance |

---

## 4. Decisions Locked by Upstream Documents (Do Not Revisit)

These are not stack-selector decisions — they are confirmed by intent.md or brainstorm.md. Do not re-open them.

| Decision | Source |
|----------|--------|
| Vercel deployment | intent.md hard constraint |
| Functions region: fra1 (Frankfurt) | brainstorm.md confirmed decision |
| AI provider abstraction: Vercel AI Gateway | brainstorm.md confirmed decision |
| Analytics: GA4 | brainstorm.md confirmed decision 21 |
| Email: Resend | brainstorm.md confirmed decision 5 |
| No user auth at launch | intent.md out-of-scope, permanent |
| No custom payment code (Stripe via Cal.com only, or invoice) | intent.md hard constraint |
| Single repo, single Vercel project | brainstorm.md confirmed decision |
| Dark mode mandatory | intent.md success criterion 8 |
| i18n route-based locale (/cs + /en) | brainstorm.md confirmed decision 14 |
| No CMS at launch | intent.md out-of-scope |
| Primary domain: victaagency.com | brainstorm.md confirmed decision 16 |

---

## 5. Open Decisions (Flagged for Downstream Agents)

| Decision | Owner | Needed before |
|----------|-------|--------------|
| Cal.com payment model at launch: invoice (Path B) vs in-calendar Stripe (Path A, $15/mo) | Roman | `/spoluprace` page build |
| EN legal page approach: link to Czech pages vs abbreviated EN copy | architect | i18n architecture design |
| Chatbot response cache key design and TTL | architect | chatbot proxy implementation |
| Contact form destination email | Roman | contact form backend implementation |
| Dark mode canonical default for OG images | design session → Roman | OG image generation |
| Anthropic budget cap amount | Roman | Phase 2 (before chatbot goes to production) |
