# Brainstorm: VICTA Marketing Website

> Phase 0 output of the Foundation pipeline. Captures the full strategic conversation between Roman (client) and Claude that follows the **five lenses** prescribed by the brainstorming protocol: Problem Space, Solution Design, Competitive Landscape, Risk & Assumptions, Sustainability. **Status: COMPLETE.**
>
> Inputs: `.workforce/intent.md` (Phase -1 contract).
> Output: this file. Hands off to Phase 1A (parallel deep analysis: idea-refiner / security-analyst / market-researcher / requirements-engineer) and a parallel Design Exploration track (`docs/design-exploration/design-brief.md`).

---

## Confirmed Decisions

### Strategic positioning

1. **Primary entry point service** = "**komplexní transformace byznysu**" (comprehensive package): full audit → solution design → integration → operation → growth. Secondary entry: web/e-shop development. Tertiary: marketing strategy + creative + campaign management.
2. **Wedge = "Partner, not vendor."** VICTA does not deliver-and-disappear. Deep audit → custom solution → ongoing operation → continuous growth. Three fluencies under one roof: **code + industry/e-commerce + marketing**. Self-positioning as the AI-native evolution of the digital agency category, not an alternative to legacy agencies.
3. **Trust signals (top 3 at launch)** in priority order:
   - **A+B (combined): Methodology + strategic thinking** — show our process AND our thinking. Rich-content commitment: every page has both "how we do it" and "why we think about it that way" components.
   - **E: Industry-specific expertise** — dedicated pages for 6 industries; visitor sees we understand their world, not just our skills.
   - **F: Design quality itself** — the website IS part of the credibility argument. High design ambition (21st.dev components, AI-generated assets via nano banana / Kling).
   - **D: Personal/team approach** — added post-launch when team page is unveiled (sequencing rule from intent.md: team page is built last).
4. **Brand voice = company, not individual.** First-person plural always ("my", "náš tým", "navrhneme"). VICTA presented as a real agency with two delivery teams (marketing/content + IT/dev). Roman is the primary contact for IT/dev, but is not the only person delivering.
5. **Both partner AND vendor models offered** — customer chooses. Service pages must accommodate both ("dlouhodobé partnerství" CTA AND "jednorázová zakázka" CTA).
6. **Self-demonstrating positioning.** VICTA's own website maintenance uses the same playbook offered to clients: small AI-augmented team where Roman + marketing team steer Claude Code agent. The site itself is the case study for "this is how we work."

### Conversion funnel

7. **Two paths**:
   - **Cesta 1: Comprehensive partnership** → **paid audit** (3 tiers, see pricing) → roadmap → ongoing partnership. Audit copy and landing page is the **#1 conversion target** for the website.
   - **Cesta 2: Modular / single-service** (chatbot, single integration, AI tool, technical consulting) → **free 30-min scoping video call** → custom quote → plan of execution → decision. **No audit required** for small projects — €3K audit for €5K project doesn't make economic sense.
8. **Audit pricing structure** (visible on `/spoluprace` page):

| Tier | Use case | Doba | Sezení | CZK | EUR |
|---|---|---|---|---|---|
| **Tier 1 — Komplexní podnikový audit** | Whole-business digitization analysis | 1-3 weeks | 3-4 (intro + brainstorm + analysis + in-person plan presentation) | **20 000 – 90 000 Kč** | **€800 – €3 600** |
| **Tier 2 — Doménový audit** | One domain depth (full marketing strategy, full e-commerce strategy, full AI strategy) | a few days – 2 weeks | 2 (intro + plan presentation) | **10 000 – 55 000 Kč** | **€400 – €2 200** |
| **Tier 3 — Strategická session** | Single-issue strategic consultation | a few days – 2 weeks | 1 (90 min session + analysis) | **4 000 – 25 000 Kč** | **€160 – €1 000** |

   - All tiers include **interactive communication during the audit** (not black box).
   - **Audit deliverables** (consistent across all tiers): PDF report + Excalidraw problem-framing schema + Figma visual artifacts + in-person consultation of outputs and next steps.
9. **Free 30-min scoping video call** is the entry CTA on every individual service page (cesta 2 entry).

### Information architecture

10. **Top-level navigation = Structure A (three-category model)**:

```
🏠 Domů
📋 Služby           ← raw skill catalog: 16 services across IT/Vývoj (4) + AI/Data (5) + Marketing (7)
🎯 Řešení           ← packaged solutions / use cases: 5 at launch (znalostní asistent, autonomní agenti,
                       AI podpora, dashboardy, AI infrastruktura). Designed to host real or clearly-labeled
                       illustrative case studies post-launch.
🏢 Odvětví          ← industry-specific: 6 (e-commerce, manufacturing/logistika, profesionální služby,
                       finance, zdravotnictví, zákaznická podpora)
🤝 Spolupráce       ← audit tiers + scoping call + how-we-work — #1 conversion landing
👥 O nás            ← about page (later expanded with team page near end of build sequence)
📞 Kontakt
📰 Blog (placeholder) ← /blog with "Připravujeme" page; URL exists for SEO/AEO authority establishment;
                        first articles are post-launch
```

11. **Total page count: ~38 pages** at launch in Czech (vs 23 in original draft = +65% scope expansion).
12. **Service catalogue (18 services)** validated as drafted:
    - **IT & Vývoj (4)**: Weby na míru, E-shopy na míru, Integrace (sklad/účetnictví/ERP/CRM/payment/shipping), Custom solution development.
    - **AI & Data (5)**: AI chatboti (RAG, knowledge-aware), AI automatizace procesů (e-mails, reports, pipelines), AI konzultace + audit + strategie + governance, Datová platforma + integrace (BI, ETL/ELT, dashboardy), MLOps / Provoz AI systémů.
    - **Marketing & Obsah (7)**: SEO, AEO, PPC kampaně (Google / Meta / LinkedIn / TikTok), Social media management (IG / FB / LinkedIn / TikTok), Tvorba kreativ (graphics, Reels, video, banners, animations), E-commerce management (Heureka, Zboží.cz, Glami, e-mail mkt), Marketing strategy + plan.
    - **Cross-team (2)**: Komplexní transformace byznysu (flagship), Dlouhodobá správa & růst klienta (retainer model).
13. **Currency tied to locale routing**: `/cs` → CZK, `/en` → EUR. **No separate currency switcher** — locale switcher does it. Architectural rule for Phase 1B `architect`.
14. **i18n architecture mandatory at launch** (per intent.md success criterion #7). Route-based locale (`/cs/...` + `/en/...`) so EN can be added without refactor. EN copy itself is deferred — minimum at launch is `/en` landing stub or hreflang signaling so foreign clients can find VICTA.
15. **Dark mode mandatory at launch** (per intent.md success criterion #8). Design tokens for light + dark from start, both pass WCAG 2.1 AA contrast.
16. **Primary domain = `victaagency.com`**. Secondary `victa.agency` becomes 301 redirect.
17. **Booking system** = tool with **free plan**. Phase 1B candidates (in priority): **Cal.com cloud free tier** (modern, customizable, embeddable, opensource ethos fits AI-native positioning) → Calendly free (with Calendly branding) → Microsoft Bookings (if M365 owned). Final selection by `stack-selector` based on integration depth (embed, API, payment integration for paid audit).

### AEO / SEO strategy

18. **AEO treated with equal weight as SEO** ("SEO is gradually folding into AEO" — Roman's stated position).
19. **AI-driven AEO for AI strategy** — VICTA uses AI tools (`bencium-aeo`, `claude-seo` GEO sub-skills, `seo-image-gen` via banana) to optimize for AI search citations. Self-demonstrating: "we help clients be visible in AI search because we know how — see our own page."
20. **AEO content patterns must be modular** (FAQ blocks, evidence panels as reusable components) to absorb LLM citation behavior changes without refactor.
21. **Conversion tracking from Day 1** required (per intent.md success criterion #9 expanded): GA4 + event tracking for form submissions, calendar bookings, chatbot engagements, newsletter signups. Without this, cold ad spend is blind investment.

### Maintenance & operations model

22. **Maintenance owner = Roman + marketing team (steer) + AI agent (Claude Code) (execute)**. Hybrid D+F:
   - **Roman**: strategic direction, quarterly audit of changes
   - **Marketing team**: weekly content production, AEO refresh, blog (post-launch)
   - **AI agent (Claude Code)**: heavy lifting per Roman/marketing team direction
23. **Content cadence**: weekly content production starting ~1 month post-launch, ramping up. Quarterly Roman strategic review.
24. **Maintenance is itself a marketing showcase** — "this is the same playbook we offer clients."

---

## Problem

### Target user

A medium / medium-large business decision-maker in **Czech Republic and Slovakia** — owner, CEO, marketing director, operations director, head of digital — running an established business with real digital budget. Mix of B2B and B2C verticals. Across e-commerce, manufacturing/logistics, professional services, finance, healthcare, customer-support-heavy operations.

Secondary audience: AI search engines (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews) — VICTA needs to surface as a credible citation when LLMs are asked about Czech/Slovak digital agencies.

Roadmap audience (post-launch): international outreach into foreign markets (English-language version added when international expansion starts).

### Current alternatives & their failures

The Czech digital agency landscape has structural problems that VICTA targets:

1. **Identical impersonal output across most agencies** — "produce stejný výstup". Insufficient interest in client's actual needs.
2. **Big corporate-style agencies** — communication passes through 5+ people, takes days to review/decide/approve, slow. SMB clients feel deprioritized.
3. **AI is widely sandbagged** — many agencies don't mention AI to keep charging "prices like 5-10 years ago", capturing the spread.
4. **Market is split into silos** — marketing-only agencies OR development-only firms. No integration. Client pays for expensive template + warehouse/accounting integration → static site → sales don't grow because nothing is optimized for sales, nothing iterates, client has no idea what to do because they thought "one payment runs forever."

### How painful is this?

For a Czech medium business spending €30K–€200K on a "digital push" through a legacy agency:
- **Money lost**: paying agency rates set 5-10 years ago for less-AI-augmented delivery.
- **Time lost**: 3-6 month delivery cycles where 30% is communication / approval friction.
- **Outcomes lost**: site delivered but conversions don't grow → client has no in-house expertise to operate or iterate → digital investment becomes write-off → client sours on outsourced digital and stays on legacy systems.

VICTA's claim: with a small AI-augmented team, the same outcome arrives in **3-4 weeks** at lower cost, AND the partnership continues — the client gets ongoing expertise on tap.

### Why hasn't someone solved this well?

- Big agencies have organizational gravity and cost structures that make "small AI-augmented" reform hard internally.
- Pure freelancers can't deliver "code + industry + marketing" breadth.
- AI-native agencies are appearing but most are US-focused, English-only, or too generalist (chatbot consultancies, no full-stack delivery).
- The CZ/SK market specifically has under-served medium-business tier between freelancers (too small) and enterprise consultancies (Atol Solutions tier — €100K+ engagements only).

VICTA fits the gap: small AI-native shop with full-stack capability for CZ/SK medium business.

---

## Solution

### Core value proposition

"**Parťák, ne dodavatel.** Postavíme s vámi systém, ne jenom web. Audit byznysu, návrh řešení, integrace na míru, správa, růst — všechno pod jednou střechou. Tři kompetence: kód, marketing, znalost odvětví. Malý AI-augmented tým — rychlejší, levnější, profesionálnější než velké korporátní agentury."

(English: "Partner, not vendor. We build a system with you, not just a website. Business audit, custom solution design, custom integrations, ongoing operation, sustained growth — all under one roof. Three competencies: code, marketing, industry knowledge. Small AI-augmented team — faster, leaner, more professional than legacy big-agency.")

### MVP scope (must ship at launch)

- ~38 Czech-language pages across the IA structure described above.
- Working AI chatbot powered by Claude API via server-side proxy (Vercel Function), with sanitization, off-topic refusal, system-prompt protection, model-agnostic via Vercel AI Gateway. Stateless at launch (no cross-session memory).
- Working contact form with submissions delivered to Roman's chosen channel.
- Working booking system (free-plan tool, likely Cal.com cloud) for paid audit + free scoping calls.
- Newsletter signup with Resend integration + 1 designed welcome email (designed in parallel design session).
- i18n architecture (route-based locale `/cs` + `/en`); minimum EN at launch is landing stub.
- Dark mode supported with design tokens for both modes.
- GA4 + cookie consent banner (Czech, GDPR-compliant).
- Baseline SEO/AEO: robots.txt, sitemap.xml, OpenGraph, Twitter cards, Organization + LocalBusiness + Service schema, FAQ schema where applicable, llms.txt, meta titles/descriptions.
- Lighthouse mobile ≥ 90, Core Web Vitals all green, WCAG 2.1 AA on key pages in both light and dark.
- Conversion event tracking from Day 1.

### Deferred (post-launch)

- Portfolio / case studies / project showcase (built in background, published when ready).
- Full client testimonials.
- Blog content (URL placeholder ships, articles come post-launch).
- Full English copy across all pages (architecture supports it; copy comes when international outreach starts).
- Live human chat agents (chatbot is AI-only at launch).
- Chatbot with cross-session memory (requires auth + DB).
- A/B testing infrastructure.
- Full email marketing automation (only signup + welcome email at launch).
- Team page with individual photos/bios (team page itself ships near end of build, but profile depth comes post-launch).
- Video production (embeds OK).
- CMS / admin UI (content lives in code/MD; revisit post-launch if marketing team needs self-serve editing).

### Permanently out of scope

- E-commerce / product checkout on the marketing site (VICTA sells services via consultation, not products through their site).
- Customer login / account dashboard (internal client portals live elsewhere — Notion / Linear).
- Self-service quote calculator (contradicts subjective-pricing positioning).
- Multi-tenant / white-label / SaaS-style platform (this site is single-tenant single-brand; future SaaS products are separate projects).
- Native mobile apps (web is mobile-first responsive).

---

## Competitive Landscape

Roman did not name three specific competitors — instead he articulated a structural critique of the **whole category**, which is more strategically useful. The wedge is not "VICTA vs Acme Agency"; it's **"VICTA vs the legacy CZ digital agency model."**

### What competitors do, and where they fail

- **Big corporate agencies** (Atol Solutions–tier and below): high quality but enterprise-focused; SMB clients face slow communication, high minimum budgets, depersonalized delivery, no AI fluency at the implementation level, no long-term partnership model — engagement ends with the deliverable.
- **Marketing-only agencies**: deliver campaigns but cannot build, integrate, or iterate the technical product underneath. Client must hire two vendors.
- **Development-only firms**: deliver code but have no marketing intuition or campaign expertise. The site goes live and dies.
- **Freelancers**: cannot deliver "code + industry + marketing" breadth at consistent quality; client juggles many freelancers.
- **AI-sandbagging agencies**: pretend AI doesn't exist to maintain legacy pricing; client gets 2018-style delivery in 2026.

### VICTA's wedge (synthesized into draft positioning copy)

> "Velké korporátní agentury procházejí 5 lidmi pro každé rozhodnutí. My jsme malý AI-augmented tým — rychlejší, levnější a často kvalitnější. AI drží detaily, lidé drží myšlení. Co u jiných trvá 3 měsíce, u nás 3 týdny — bez režie 30+ hlav, kterou si platí klient."

This is the candidate **homepage subhero / about copy**. To be refined in Phase 4 by Roman and the marketing team.

### Switch trigger (why someone moves from current vendor TO VICTA)

1. **Frustrated with legacy speed and bureaucracy** — "I have to wait 2 weeks for a one-line fix on my e-shop."
2. **Frustrated with split vendors** — "I'm tired of explaining context to my dev shop AND my PPC agency every time."
3. **Recognizes AI is being withheld** — "Why is my agency not using AI? Their competitors clearly are."
4. **Wants long-term partnership** — "I don't want a one-shot project, I want someone who knows my business."
5. **Mid-size budget** — "I'm too small for Atol, too established for a freelancer."

---

## Risks

### Riskiest assumption

**A. Lead generation will work** — warm referrals + cold-ad outreach + portfolio buildup + team buildup, **all four channels** must materialize for VICTA's marketing site to do its job. Roman's first clients are giving referrals, so the warm channel is in motion. Cold ad spend will drive the rest.

This **also covers C** (no portfolio risk): if leads come from warm + cold + organic-as-portfolio-grows, absence of portfolio at Day 0 is bridgeable.

### How we'd test this in 1 week without building

1. **Pre-launch warm referral check**: Roman lists 5-10 referral sources / first clients and asks "if I send you VICTA's site when it goes live, will you forward to your network?" Measurable yes/no count.
2. **Cold outreach dry-run**: 20 LinkedIn / cold email sends to medium-business prospects with current copy direction → response rate.
3. **Pre-launch landing stub test**: minimal LP with primary value prop + booking link → drive 50-100 paid LinkedIn impressions → measure click-through and booking attempt rate.

### External dependencies that could kill this

Top 3 external dependencies (Roman's selection) with mitigation plans:

| Dep | Probability (1y) | What breaks | Mitigation (architectural rule) |
|---|---|---|---|
| **Anthropic Claude API** | Medium-High | Chatbot breaks, AI-driven AEO content production breaks | **Vercel AI Gateway abstraction** mandatory; **Vercel AI SDK** with `"provider/model"` strings; **runtime-cache** for common Q&A; **prompt caching**; **per-session rate limiting**; **fallback messaging** when API 503. Architectural rule: chatbot MUST be model-agnostic — no direct provider SDK imports. |
| **AI search ranking algorithms** | High | AEO investment loses signal; LLM citation behavior changes | **Don't over-invest in AEO alone** — keep traditional SEO baseline strong; **diversify** across ChatGPT / Claude / Gemini / Perplexity (their behaviors differ); **modular AEO content patterns** (FAQ blocks, evidence panels) for fast adaptation; **`seo-drift` baseline + diff** monitoring; **brand entity signals** (Wikidata, Knowledge Graph schema). |
| **Domain registrar (Namecheap)** | Low | Pricing change, downtime during DNS, hijacking risk | **Auto-renewal + backup payment**; **2FA**; **transfer lock**; **DNS zone export to git** before each change; consider migration to **Cloudflare Registrar** post-launch (at-cost renewal pricing). |

Lower-risk dependencies (Vercel, Google services, Resend, Cal.com, Czech privacy law) are accepted with standard mitigation patterns.

---

## Sustainability

### Revenue model

This site is not directly monetized — it is the **lead-gen and credibility validator** for VICTA's services revenue. The agency's revenue model is:

- **Tier 1/2/3 audits** (paid entry) → roadmap deliverable
- **Comprehensive partnership engagements** (post-audit, custom-priced)
- **Modular single-service projects** (post free-scoping-call, custom-priced)
- **Long-term retainer relationships** (operate + grow client's digital, monthly recurring)

The marketing site converts visitors into **paid audits** and **scoping calls**, which then convert into engagements via the off-site sales process.

### Maintenance ownership (post-launch)

**Hybrid D+F model**:

| Role | Owner | Cadence | Examples |
|---|---|---|---|
| **Strategic direction** | Roman | Quarterly review | What new services to add, what pages to rewrite, AEO strategy shifts |
| **Content production** | Marketing team | Weekly (ramp-up post-launch) | Blog articles (post-launch), FAQ updates, case study additions, AEO content |
| **Tech maintenance** | Marketing team + IT team | Monthly | Dependency updates, performance fixes, integration upgrades |
| **Execution agent** | Claude Code (steered by Roman + marketing team) | On-demand | All code changes, content updates, AI/AEO content generation, mockup iteration |

This model is itself **part of the marketing message** — "We use the same AI-augmented playbook on our own site that we use for clients." The site's own update cadence and modernity become a self-demonstrating credential.

### Content cadence (post-launch ramp)

- Weeks 1-4 post-launch: focus on launch fixes + copy refinement based on early feedback
- Months 2-6: ramp content production (1 artifact per 2 weeks initially, FAQ + AEO content)
- Month 6+: weekly cadence with blog articles + AEO refresh
- Ongoing: quarterly strategic review by Roman; quarterly AEO drift audit via `seo-drift` skill

---

## Open Questions (for Phase 1A / 1B / 4)

These items remain unresolved and will be addressed in downstream phases:

1. **Stack** — Next.js App Router (most likely given Vercel + AI chatbot + claude-seo + bencium-code-conventions + 21st.dev hint) vs Astro vs vanilla. Decision: Phase 1B `stack-selector`.
2. **Booking system specific** — Cal.com cloud free vs Calendly free vs Microsoft Bookings. Decision: Phase 1B based on integration depth (embed, payment integration for paid audit, branding flex).
3. **Contact form backend** — Vercel Function + Resend email vs Formspree vs Web3Forms vs delivery to Slack/Linear. Decision: Phase 1B.
4. **Chatbot system prompt scope** — what topics it answers (services, process, pricing approach, contact); what it refuses (specific quotes, technical advice, off-topic); knowledge base setup. Decision: Phase 1A `idea-refiner` spec + security-analyst threat model.
5. **AEO/SEO depth at launch** — which `claude-seo` sub-skills run pre-launch (technical, schema, GEO baseline) vs post-launch (FLOW framework, drift monitoring, competitor pages, image optimization deep-dive). Decision: Phase 1A `requirements-engineer`.
6. **Content review workflow** — Roman wants page-by-page walkthrough during build. Synchronous (per-page approval gate) vs batched (milestone reviews). Affects Phase 4 task structure. Decision: Phase 1C `workplan-builder`.
7. **Existing draft reuse** — does the existing ZIP draft's copy/structure feed forward as starting input, or do we write from blank? **Recommendation**: extract any genuinely useful content from the draft (specific copy, page structure ideas) but treat it as scratch input, not authoritative. New IA already deviates from the draft significantly.
8. **i18n strategy specifics** — route-based locale (`/cs` + `/en`) vs subdomain vs separate domain — and what minimum EN content ships at launch (full English homepage stub, hreflang signaling, `/en` redirect to "coming soon"). Decision: Phase 1B `architect`.
9. **Newsletter email design** — HTML vs plain text, branded heavy vs minimal, CTA target (back to site / direct booking). Decision: parallel design session.
10. **Dark mode default** — which theme is canonical (light or dark) and which is the toggle. Decision: parallel design session based on customer-psychology analysis.
11. **Pre-launch blog stub** — confirmed: `/blog` placeholder ships at launch with "Připravujeme" / "Coming soon" content for SEO/AEO URL authority establishment.
12. **Team page content approach** — names + photos + bios vs roles-only vs hybrid. Decision: end of build sequence (per intent.md sequencing rule).
13. **Visual / design direction** — color psychology + typography + shape vocabulary + 3 differentiated design directions. **Decision: parallel design session** (`docs/design-exploration/design-brief.md` + the parallel terminal Claude Code session running design exploration via huashu-design + ui-ux-pro-max + bencium suite).
14. **Audit page content depth** — exact copy for `/spoluprace`, including what each tier gets in detail, how the 3-4 sessions are structured, what the deliverables look like. Decision: Phase 4 build, written by Roman + marketing team + Claude Code.
15. **Conversion ROI tracking** — exact event taxonomy (form submits, booking attempts, chatbot engagements, newsletter signups), Plausible vs GA4 confirmation, UTM parameter strategy for cold ad spend. Decision: Phase 1A `requirements-engineer` + Phase 1B `architect`.

---

## Hand-off

This brainstorm is the contract for Phase 1A and Phase 1B. Every Phase 1A artifact (spec.md, security-model.md, market-analysis.md, requirements.md) must trace back to this document for strategic direction, and back to `intent.md` for falsifiable scope.

Parallel **Design Exploration track** is launched in a separate Claude Code session per `docs/design-exploration/design-brief.md`. Output of that session (`design-directions.md`) feeds into Phase 1B `architect` as design-token input.

**Brainstorm status:** COMPLETE. Proceed to Phase 1A (4 parallel agents).
