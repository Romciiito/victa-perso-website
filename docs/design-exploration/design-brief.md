# VICTA — Design Exploration Brief

> Brief for a parallel Claude Code session that runs visual/design exploration using installed design skills. Output of that session: `docs/design-exploration/design-directions.md` with 3 differentiated design directions for Roman to choose from.

---

## Project context (one paragraph)

VICTA is a Czech/Slovak full-service digital agency targeting medium and medium-large businesses. We are building VICTA's own marketing website (~38 pages, Czech-only customer copy at launch with EN-capable architecture). The site is not a primary cold-traffic lead-gen funnel — it is a **credibility validator for warm referrals** (existing first clients are giving referrals; site converts those warm leads). Primary conversion path: paid audit (3 tiers, see `audit pricing` below). Secondary conversion path: free 30-min scoping call for modular single-service work. Deployed on Vercel. AI chatbot powered by Claude API with strict guardrails. Booking system in scope (Cal.com or Calendly TBD).

## Positioning (load-bearing for design)

**Strategic positioning:** "Partner, not vendor." VICTA does not deliver-and-disappear. VICTA conducts a deep business audit → designs a comprehensive solution → integrates (often custom) → operates → grows the client's business long-term. Three fluencies under one roof: **code + industry/e-commerce + marketing**.

**Competitive wedge:** vs the Czech digital agency market — most competitors are either (a) big corporate agencies with depersonalized, slow, multi-layered communication, or (b) split into "marketing only" or "dev only" silos. Many sandbag on AI to keep charging legacy prices. VICTA is a **small AI-augmented team that is faster, leaner, and has equal-or-better quality** because AI handles details while humans hold strategic judgment.

**Emotional targets** (in priority order):
1. **Trustworthy** — "we'll do what we say, on time, with full transparency"
2. **Capable** — "we have the depth (technical + marketing + industry knowledge)"
3. **Professional** — "this is a real agency with real methodology, not a freelancer"
4. **Personal + listening** — "we hear what you actually need before proposing"
5. **Modern + AI-native** — "we use AI ourselves; we're ahead of the curve"

## Audience persona (primary at launch)

A medium / medium-large CZ or SK business decision-maker — owner, CEO, marketing director, operations director, head of digital. Established business with real digital budget. Evaluating outsourcing of comprehensive digital work. Comparing VICTA against Atol Solutions, regional CZ/SK agencies, mid-tier digital shops. Already heard of VICTA via referral and is now checking the website to confirm "are these people credible?"

**NOT the audience at launch:** micro-businesses, hobby projects, white-label agency partnerships, English-only visitors (deferred).

## Design references provided by Roman

- **atolsolutions.cz** — layout reference: service rows, dark sticky sidebar, megamenu, light/clean base
- **buildinamsterdam.com** — typography reference: editorial serif, cinematic feel, large hero typography
- **21st.dev** — Roman intends to use this for component sourcing (shadcn/ui ecosystem). Strongly suggests Next.js + shadcn/ui as stack candidate.
- **nano banana (Google AI image gen)** — for SEO/AEO/hero image production
- **Kling** — for AI video generation (possible hero motion, product demos)

## Constraints (hard)

1. **Must support both light AND dark themes** from the start, design tokens defined for both. WCAG 2.1 AA contrast required in both modes.
2. **Mobile-first responsive** — Lighthouse mobile performance ≥ 90 target.
3. **Czech typography correctness** — proper Czech quote marks („…"), em-dashes, no orphans, etc. Use the `typography` skill rules.
4. **Brand voice is "we / our team"** (first-person plural) — design must signal "real agency, real team", not solo freelancer.
5. **No portfolio / case studies / testimonials at launch** — design must convey credibility through other means: methodology depth, process transparency, design quality itself, copy substance.
6. **Currency tied to locale** — `/cs` shows CZK, `/en` shows EUR. Visual treatment of price tags must read clearly in both currencies.

## Constraints (soft / preferences)

- Prior session shortlisted these palette candidates (Indigo, Teal, Rose, Violet, Terracotta) and avoidance list (orange, electric blue, pure black). **Treat these as ONE input, not as constraint.** Do a fresh psychology analysis from first principles for the persona above.
- Prior session tentative typo: Fraunces (serif headings) + Plus Jakarta Sans (body). Treat as one input, not constraint.
- Roman wants editorial serif headings in the BIA mood — but this is a starting hypothesis to validate, not a fixed decision.

## Three pillars to make visible in the design

1. **Methodology + strategic thinking** (one combined trust pillar — show our process AND our thinking)
2. **Industry-specific expertise** (6 industries: e-commerce, manufacturing/logistics, professional services, finance, healthcare, customer support)
3. **Design quality itself** (the website IS part of the credibility argument)

## Audit pricing (visible on site, in CZK + EUR)

| Tier | CZK | EUR |
|---|---|---|
| Tier 1 — Komplexní podnikový audit | 20 000 – 90 000 Kč | €800 – €3 600 |
| Tier 2 — Doménový audit | 10 000 – 55 000 Kč | €400 – €2 200 |
| Tier 3 — Strategická session | 4 000 – 25 000 Kč | €160 – €1 000 |

Plus free 30-min scoping call for modular small projects.

## Output expected from design exploration

A single document `docs/design-exploration/design-directions.md` containing **3 differentiated design directions**, each:

1. **Name + one-line philosophy** ("Editorial Trust", "Quiet Confidence", "AI-Native Modern" — examples)
2. **Strategic rationale** (300-500 words — why this direction signals VICTA's positioning to the persona, what it does that the other two don't)
3. **Color palette** (light + dark variants, with HEX values + accessibility notes — primary, secondary, accent, surface, text, semantic colors)
4. **Typography pairing** (headline + body + UI — with font names + Google Fonts URLs + reasoning for the pairing's psychology)
5. **Shape & form vocabulary** (corner radii, border weights, shadow language, spacing scale, density)
6. **Reference visual language** (3-5 reference websites or design movements that share the DNA, with why)
7. **Anti-patterns** (what this direction explicitly rejects — for clarity)
8. **Sample component sketches** (text descriptions OR ASCII / markdown mockups OR if visual companion is used, real mockups: hero section, service card, audit pricing card, testimonial placeholder, footer)
9. **AEO/SEO image direction** — what nano-banana-generated assets would look like in this direction (for OG images, hero illustrations, blog headers later)
10. **Trade-offs + risks** (where this direction could go wrong, who it might alienate)

Three directions should be **genuinely different**, not three flavors of the same idea. Pull from **5 distinct schools** in `huashu-design`'s Pentagram / Field.io / Kenya Hara / Sagmeister / Bauhaus framework. Show breadth, then let Roman converge.

## Skills to use (all installed)

- **`huashu-design`** — primary direction generator; consultant mode (5 schools × 20 philosophies → 3 differentiated directions)
- **`ui-ux-pro-max`** — palette database (96 palettes), typography pairing database (57), shape/style guidelines
- **`bencium-controlled-ux-designer`** — always-ask-first protocol for visual decisions (use it to NOT pick favorites for Roman; let him choose from 3)
- **`bencium-innovative-ux-designer`** — bold creative options (use as stretch direction — at least 1 of the 3 should be bolder)
- **`bencium-impact-designer`** — anti-AI-slop frontend grounding (avoid generic AI gradients, AI purple/pink, etc.)
- **`typography`** — typography rules enforcement (correct Czech quotes, em-dashes, hierarchy, all directions must pass)
- **`frontend-design`** (vercel) — distinctive frontend patterns
- **Optional `vercel:shadcn`** — if any sample components are sketched as code

## Inputs to read first

1. `/Users/trungle/Desktop/websites/VICTA/.workforce/intent.md` — full intent contract
2. `/Users/trungle/Desktop/websites/VICTA/CLAUDE.md` — placeholder, will be enriched in Phase 3 (less critical now)
3. (When ready) `/Users/trungle/Desktop/websites/VICTA/brainstorm.md` — full brainstorm output (will be written soon by the parallel session)

## Process suggestion

1. Read intent.md fully, this brief fully
2. Run `huashu-design` in consultant mode to generate 3 differentiated direction proposals
3. For each direction: pull palette + typo + shape vocabulary using `ui-ux-pro-max`, validate with `bencium-controlled-ux-designer` and `typography`
4. Write `docs/design-exploration/design-directions.md` with structured comparison
5. (Optional) Use visual companion to render hero section mockups for all 3 side-by-side for Roman
6. Present to Roman for selection; iterate; final pick goes to Phase 1B `architect` for design tokens

## Definition of done

Roman has a `design-directions.md` document with 3 distinct, well-justified directions. Each is clear enough that Roman can pick one (or hybrid) within 30 minutes of reading. Selected direction will inform Phase 1B `architect`'s design token decisions and Phase 4 frontend implementation.

**Do NOT pre-pick or pre-rank for Roman.** Use `bencium-controlled-ux-designer`'s "always-ask-first" protocol — present 3 options, let him decide.
