# VICTA — Intent

> Phase -1 output of the Foundation pipeline. Falsifiable scope of what we are building, for whom, and what counts as done. Authored from Roman's brief and two clarifying rounds. **Status: COMPLETE.**

---

## What it is

A Czech-language marketing website for **VICTA agency** (Roman's full-service digital agency) — approximately 23+ pages presenting service offerings, target industries, AI solutions, and contact channels — combined with a **Claude-API-powered AI chatbot** (with input sanitization and topic guardrails) and a **contact form**. Deployed on **Vercel** under one of two owned domains (`victaagency.com` or `victa.agency`).

The site is the agency's primary commercial storefront — its purpose is to let prospective SMB clients understand what VICTA offers and start a conversation, **before** any portfolio or reference content exists.

---

## Who it's for

**Primary visitor at launch**: a **medium and medium-large business** decision-maker in **Czech Republic and Slovakia** — owner, CEO, marketing director, operations director, head of digital — who is:
- running an established business with real budget for digital services (not a freelancer, not a micro-business looking for a $200 logo)
- evaluating whether to outsource websites/e-shops, SEO/AEO, AI automation, social media, PPC, content, or full-service marketing
- comparing VICTA to other Czech/Slovak digital agencies (Atol Solutions, regional CZ/SK agencies, mid-tier digital shops)
- expects to deal with a **real agency team**, not a freelancer — but wants the personal touch and direct conversation, not an enterprise account-management funnel
- across B2B and B2C verticals: e-commerce, manufacturing/logistics, professional services, finance, healthcare, customer-support-heavy operations

**Secondary visitor**: AI search engines (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews) — the site must be optimized for **AEO with equal weight to SEO** (Roman's explicit position: "SEO is gradually folding into AEO"). When users ask LLMs about Czech/Slovak digital agencies, VICTA must surface as a credible citation.

**Roadmap audience (post-launch, NOT in MVP)**: international outreach into foreign markets — expected to require an English-language version and possibly other localizations later. Scope and timing TBD; not a launch blocker.

**Not the audience at launch**: micro-businesses with <€10k digital budgets, hobby projects, white-label/agency-to-agency partnerships, English-only visitors at launch (deferred to roadmap).

---

## Concrete success

The launch is **falsifiably done** when **all** of the following are true:

1. **Live at custom domain** — site resolves at the chosen primary domain (`victaagency.com` or `victa.agency`, decision in Phase 1B), HTTPS, redirects from the secondary domain configured.
2. **Complete content on every page** — every service / industry / solution / overview / contact page has full Czech copy that Roman has personally reviewed and approved (page-by-page walkthrough with Claude during build).
3. ~~**Working AI chatbot**~~ **DEFERRED post-launch (2026-05-07)** — Roman decided to defer chatbot from launch scope. Site launches without AI chatbot. Architecture, Supabase tables, and REQs remain in place for post-launch activation.
4. **Working contact form** — submissions reliably delivered to Roman's chosen channel (email/Slack/Linear/etc., decision in Phase 1B).
5. **Booking system live** — visitors can book a consultation slot directly from the site without back-and-forth email. Tool choice TBD (Cal.com self-hosted vs Calendly free vs alternative — decision in Phase 1B based on cost / control / branding fit).
6. **Newsletter signup + welcome email** — visitors can submit their email; addresses stored in a Resend audience (or equivalent); a single designed welcome email is automatically sent thanking them for signing up. Designed using `huashu-design` + `typography` + `bencium-impact-designer` skills. No further marketing automation at launch.
7. **i18n architecture ready (EN-capable)** — site is built with route-based locale support (e.g., `/cs/...` + `/en/...` or equivalent) so English content can be added later without refactor. **English copy itself does NOT ship at launch** — but the site must be discoverable to foreign clients searching for VICTA in English (minimum: an English-language `/en` landing stub with core pitch + contact, or hreflang signaling that EN is forthcoming). Final i18n strategy in Phase 1B (`architect`).
8. **Dark mode supported** — site renders correctly in both light and dark themes; user preference respected (`prefers-color-scheme`) plus an explicit toggle. Design tokens defined for both modes from the start, not retrofitted.
9. **Analytics live** — GA4 installed with a GDPR-compliant cookie consent banner (Czech-language, opt-in for non-essential cookies).
10. **Baseline SEO + AEO** — `robots.txt`, `sitemap.xml`, OpenGraph + Twitter cards on every page, Organization + LocalBusiness + Service schema where applicable, meta titles/descriptions reviewed for every page, `llms.txt` for AI search compliance. **AEO treated with equal weight as SEO** — content structured for LLM citation extraction, FAQ schema, evidence panels.
11. **Indexed on Google** — site verified in Search Console; at least the homepage indexed within the first crawl cycle after launch.
12. **Fast on mobile** — Lighthouse mobile performance ≥ 90, LCP < 2.5s, CLS < 0.1, INP < 200ms on a representative real device test.
13. **Accessible** — WCAG 2.1 AA on key pages (homepage, contact, services overview); no visible color-contrast or keyboard-trap regressions; both light and dark themes pass contrast.
14. **Team page added (last)** — added near the end of the build sequence, after all other launch sections are complete. Sequencing rule: team page work must NOT block or reorder any earlier dependency. If a deadline-pressed launch happens, team page can ship as a stub ("more about our team coming soon") without blocking the rest.

**Post-launch (NOT blocking initial launch)**: **AI chatbot (whole Phase 3 deferred 2026-05-07)**, portfolio/case-studies section, full client testimonials/references, blog/articles section, AEO/SEO depth optimization (FLOW framework, drift monitoring, competitor pages), live chat with human agents, chatbot with cross-session memory, A/B testing infrastructure, full English copy across all pages, conversion-rate optimization, performance fine-tuning beyond baseline.

---

## Constraints

**Hard constraints (non-negotiable):**
- **Czech-only customer-facing content at launch.** Slovak readers handled implicitly (mutual intelligibility); explicit SK localization not required at launch. English/other languages deferred to roadmap.
- **Vercel deployment** target. Stack must run cleanly on Vercel's Fluid Compute.
- **Claude API key never in frontend.** Chatbot must call a server-side proxy (Vercel Function) that holds the key as an env var.
- **GDPR/Czech/Slovak privacy compliance.** Cookie consent banner required because GA4 is used. Privacy policy + cookie policy pages mandatory in Czech.
- **Brand voice = company, not individual.** Site speaks as VICTA agency in **first-person plural** ("my", "náš tým", "navrhneme") — never as Roman in first-person singular. VICTA is presented as a real agency with **two delivery teams**: a marketing/content team and an IT/dev team. Roman is the primary contact for IT/dev work but is not the only person delivering it.
- **Brand positioning emotional targets:** trustworthy, capable, professional, with a personal approach and willingness to listen to client needs. The site must feel like quality + professional + human, not corporate + cold or solo-freelancer + scrappy. Specific colors and typography are NOT pre-decided — they emerge from a fresh customer-psychology analysis (color/shape/typography psychology) performed in Phase 0 brainstorm + Phase 1A. Prior session's color shortlist (Indigo/Teal/Rose/Violet/Terracotta) and avoidance list (orange/electric-blue/pure-black) are **archived as one input**, not a constraint.
- **No portfolio/references at launch** — explicitly deferred. Site must read credibly without them (clear methodology, transparent process, strong copy). Portfolio is built in the background and goes live when ready, post-launch.

**Soft constraints (preferences, can flex):**
- "Launch ASAP" — no fixed deadline, but Roman wants to start receiving inquiries through the site, not delay months for polish.
- Content is **drafted collaboratively in Claude Code**, with occasional drafts from Gemini/ChatGPT that Roman edits in.
- Subjective pricing — no public price lists; CTAs always lead to consultation/contact, never to a checkout flow.
- **Build team for THIS website**: Roman + Claude Code. (Distinct from VICTA's delivery teams that serve clients — those are separate marketing and IT teams not involved in building VICTA's own site.)

---

## Out of scope

**Explicitly NOT in launch scope** (deferred to post-launch unless noted "permanent"):
- Portfolio / case-studies / project showcase — built in background, published post-launch when Roman is satisfied
- Client testimonials / references — added post-launch as first satisfied clients accumulate
- E-commerce / product checkout — **permanent**: VICTA sells services via consultation, not products. (VICTA *builds* e-shops for clients, but doesn't operate them through this site.)
- Customer login / account dashboard — **permanent for the marketing site**. (Internal client portals for active engagements live elsewhere — Notion / Linear / etc.)
- Self-service quote calculator — **permanent**: contradicts positioning ("subjective pricing after personal consultation"). Optional: a budget-tier qualifying signal in the contact form ("od €5k / €10k / €25k+") may be added during build if Roman wants.
- Full English (or other-language) copy across all pages — **deferred** to international outreach phase. (i18n architecture itself IS in launch — see Concrete Success #7. Foreign clients can find an EN landing path; full localization comes later.)
- CMS / admin UI for non-technical content editing — content lives in code/MD files, edited by Roman + IT team via PRs. (If marketing/content team later needs self-serve editing without PRs, headless CMS — Sanity / Contentful / Payload — can be added post-launch. NOT in launch.)
- Multi-tenant / white-label / SaaS-style platform features — **permanent for the marketing site**. This site is single-tenant, single-brand: one marketing presentation site for VICTA agency. A future VICTA SaaS product (1–2 year horizon, currently negligible) would be a **separate project** with its own intent, architecture, and codebase — likely living at a separate subdomain/domain (e.g. `app.victa.agency`). It must not influence this marketing site's architecture.
- Native mobile apps — **permanent**: web is mobile-first responsive, no iOS/Android apps.
- Live chat with human agents — **deferred**: chatbot is AI-only at launch; human live chat post-launch when staffing model is decided.
- Video production at launch — embeds (YouTube/Vimeo) allowed where natural; no in-house video production or hosting at launch.
- Full email marketing automation (drip campaigns, segmentation, behavioral triggers) — **deferred**: launch has only signup + welcome email via Resend. Mailchimp/ConvertKit/Brevo-style automation comes later if needed.
- Blog / articles section — **deferred** to post-launch. (AEO + SEO authority benefits hugely from a blog, but it's a separate scope: editorial calendar, content production, possibly a CMS choice. First 3–5 launch articles could be considered if Roman wants — open question for brainstorm.)
- Chatbot with cross-session memory — **deferred**: launch chatbot is stateless. Persistent memory requires auth + DB; revisit post-launch.
- A/B testing infrastructure (PostHog / GrowthBook / VWO) — **deferred** to post-launch when there's traffic to test against.

---

## Open questions

To be resolved in Phase 0 brainstorm and Phase 1A–1B analysis:

1. **Stack choice** — Next.js App Router (most likely, given Vercel + AI chatbot + claude-seo + bencium-code-conventions skill alignment) vs Astro (lighter, content-first) vs vanilla static + Vercel Functions. Decision in Phase 1B (`stack-selector`).
2. **Primary domain** — `victaagency.com` (conventional, .com) vs `victa.agency` (clever, brand-aligned, doubles as tagline). Other becomes 301 redirect.
3. **Color palette + visual psychology — full fresh analysis required.** Prior session's shortlist (Indigo, Teal, Rose, Violet, Terracotta) and avoidance list (orange, electric blue, pure black) are archived as one input but **not a constraint**. Brainstorm + Phase 1A must produce a customer-psychology analysis covering: (a) which color combinations + saturations + temperatures signal "trustworthy + capable + professional + personal" to the medium-business CZ/SK decision-maker persona; (b) which shapes/forms/borders/corner-radii reinforce vs undermine that perception; (c) which typography moods (editorial serif vs neo-grotesque vs humanist sans) support those signals. Use `huashu-design`, `ui-ux-pro-max`, `bencium-controlled-ux-designer`, `bencium-innovative-ux-designer`, and `typography` skills. Final palette + type system selected in Phase 1B with Roman's visual sign-off.
4. **Font pairing** — Fraunces + Plus Jakarta Sans was a prior-session tentative pairing. Treat as one input among many; final pairing emerges from the same psychology analysis above.
5. **Page-list expansion + complete VICTA scope** — Roman wants the **complete service catalogue** documented (not just what was in the 23-page draft) and pages added for whatever is missing. Brainstorm must enumerate every service VICTA offers across all teams (marketing/content team + IT/dev team), distinguish "unique service" vs "bundled offering", and decide which need dedicated landing pages vs being grouped under category overviews. Roman wants to walk through every page during build to verify content makes sense.
6. **Contact form backend** — Vercel Function + Resend/SendGrid email vs Formspree vs Web3Forms vs delivering directly to Slack/Linear. Decision in Phase 1B.
7. **Chatbot system prompt scope** — what topics is it allowed to answer (services, process, pricing approach, contact)? What does it refuse (specific quotes, technical advice, off-topic)? To be defined in Phase 1A spec.
8. **AEO/SEO depth at launch** — which `claude-seo` sub-skills run pre-launch (technical, schema, GEO, sitemap baseline) vs post-launch (FLOW framework, drift monitoring, competitor pages, image optimization deep-dive).
9. **Content review workflow** — page-by-page synchronous walkthrough with Roman during build, or batched review at milestones? Affects build cadence and Phase 4 task structure.
10. **Existing draft reuse** — Roman said the existing ZIP draft is "just a sketch" and structure can change completely. Brainstorm must decide: do we mine the existing copy/structure as a starting point, or write from a blank page?
11. **i18n strategy at launch** — Roman wants i18n architecture ready at launch (so foreign clients can find them) but full EN copy is deferred. Decision in Phase 1B (`architect`): route-based locale (`/cs` + `/en`) vs subdomain (`en.victaagency.com`) vs separate domain (`victaagency.com` for EN, `.cz` for CS) — and what minimum EN content ships at launch (full English homepage stub? hreflang signaling only? `/en` redirect to a "coming soon" with English contact form?).
12. **Team page approach** — built last in the sequence. Open question: how do we present the team — names + photos + bios? Or roles-only ("our IT team", "our marketing team") without naming individuals? Or a hybrid (roles-only at launch, names added when each member is comfortable being public)? Decision before team-page build, brainstorm-led.
13. **Booking system choice** — `Cal.com` self-hosted (free, full control, deploys on Vercel) vs `Calendly` free tier (zero setup, branded with their logo on free) vs `Cal.com` cloud free vs `SavvyCal` vs `Tidycal` vs simple "request a call" form. Decision in Phase 1B based on cost / branding / integration with the site design.
14. **Newsletter design** — single welcome email designed using `huashu-design` + `typography` + `bencium-impact-designer`. Open: HTML email vs plain-text? Branded heavy vs minimal? CTA — back to the site, or to schedule a consultation directly?
15. **Dark mode design parity** — design tokens for both light and dark. Open: which is the canonical/default? Most CZ B2B sites default light; what does customer-psychology analysis say for the trustworthy/professional persona? Brainstorm-led.
16. **Pre-launch blog stub** — even if blog itself is deferred, do we want a placeholder ("Blog coming soon" with newsletter signup) to establish the URL structure for SEO/AEO? Or wait until first articles are ready? Brainstorm decision.

---

## Hand-off

This intent is the contract for Phase 0 brainstorm and all downstream analysis. **Falsifiable success** lives in section 3 — every Phase 1A artifact (spec, requirements, security, market) must trace back to it. Drift beyond this scope without an explicit re-validation triggers Alignment Guard (Phase 3.6) BLOCK.

**Intent status:** COMPLETE. Proceed to Phase 0 (Socratic brainstorm via `superpowers:brainstorming`).
