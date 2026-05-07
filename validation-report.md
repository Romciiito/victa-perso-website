# VICTA Validation Report

**Generated**: 2026-05-06
**Phase**: 1B.5 — Output Validator
**Validator inputs**: `intent.md`, `brainstorm.md`, `spec.md`, `security-model.md`, `market-analysis.md`, `requirements.md`, `architecture.md`, `stack-decision.md`

---

## Status: PASSED-WITH-NOTES

The artifacts are internally coherent on the high-impact architecture and security commitments. Five **Moderate** findings — all linked to the post-Phase-1B Supabase + GA4 + `/odvetvi/` revisions — must be addressed before workplan-builder runs to avoid downstream rework. No **Critical** findings: nothing forces a re-run of architect or requirements-engineer. All Moderate findings are documentation-update tasks that fit cleanly into Phase 1C Phase 0/1 task sequencing.

---

## Summary

| Metric | Count |
|---|---|
| **Total findings** | 19 |
| Critical (🔴) | 0 |
| Moderate (🟡) | 7 |
| Minor (🟢) | 12 |
| **Cross-document consistency findings** | 11 |
| **Coverage gap findings** | 5 |
| **Open Issue consolidation items** | 3 |

**Recommendation**: **Proceed to Phase 1C `workplan-builder`** with the Priority-1 documentation updates listed in §4 added as Phase 0 tasks in the workplan. Do **not** re-run `architect` or `requirements-engineer` — the architecture and requirements are sound; only their downstream artifacts need consistency patches.

---

## 1. Cross-Document Consistency Findings

### 1.1 Page count divergence (40 vs 41) — 🟡 Moderate

**Issue**: spec.md §4.1 and §5 say "**40 total pages**: 38 Czech + `/en` stub + 404". architecture.md §4.2 says "Total actual pages: **41** (40 specified + 1 industries overview)" because `/cs/odvetvi/` was added as an explicit overview rozcestník per Roman's confirmed post-1B decision.

**Where it shows**:
- `spec.md` §4.1 (P-01..P-40 inventory) — does NOT contain a row for `/cs/odvetvi/` (overview); spec.md §5 explicitly says "Top-level `/cs/odvetvi/` overview page is implied but not counted separately in the 40 — it is either a combined page or the navigation dropdown covers it without a dedicated overview page. `architect` to decide".
- `architecture.md` §4.2 — `/cs/odvetvi/` is listed as a real route and §16 traceability calls it out: "OQ-05 resolution (per Roman's confirmed decision): `/cs/odvetvi/` is a standalone overview page".
- `requirements.md` REQ-F-012 — already requires the index page ("An industries index page (`/odvetvi`) must list all 6 industry verticals") — this is **consistent with architecture.md**, not spec.md.
- `sitemap.xml` plans (REQ-F-084) say "all 38+ public pages"; architecture.md updates target to 41 sitemap entries (excluding 404).

**Risk-of-rework**: Moderate. URL structure is locked at launch (REQ-NF-031 + AR-03 + spec.md §8.1 explicit warning "URL structure must be stable at launch — changing post-launch breaks inbound links and SEO"). If spec.md and architecture.md disagree on which pages exist, the workplan-builder will pick one count, the build will follow it, and the missing/extra page will surface only at sitemap QA. Moderate, not Critical, because requirements.md already aligns with architecture.md.

**Affected docs**: spec.md (canonical), implicit ripple to all "38 pages" / "40 pages" mentions.

**Recommended fix**: Update spec.md §4.1 to add row P-26b (or P-26.5) for `/cs/odvetvi/` overview page, and update spec.md §5 navigation tree + page inventory table accordingly. Change "40 total pages" to "41 total pages (39 Czech + 1 EN stub + 1 utility 404)". Trivial edit; ~10 lines. Phase 0 documentation task.

---

### 1.2 Database authoritative scope contradicts spec.md and security-model.md — 🟡 Moderate

**Issue**: architecture.md §5 was revised to add Supabase Postgres at launch with 7 tables (leads, contact_submissions, chatbot_sessions, chatbot_messages, newsletter_subscribers, booking_events, aeo_citations, audit_log). However, spec.md and security-model.md still describe a **no-database, stateless** architecture in multiple places.

**Where it shows**:
- `spec.md` §13.3 (Availability SLA): "**No custom database to back up at launch.**"
- `spec.md` §13.4 (Security baseline): "Chatbot messages are not persisted (stateless). Newsletter emails stored in Resend (their security model applies). Bookings in booking tool (their security model applies)." — Now contradicted: chatbot_messages ARE persisted in Supabase per architecture.md §5.4 table 3.
- `spec.md` §7.4: "**No user input is logged in plaintext to persistent storage at launch.** (Logging strategy revisited post-launch if needed for quality review — requires GDPR assessment.)" — directly contradicts the new chatbot_messages table, which logs exactly that.
- `security-model.md` §3.1 data inventory: "Chatbot conversation content | User messages, bot responses | Internal / potentially PII | **NOT stored at launch (stateless)** | Yes | **Not retained — stateless design eliminates retention risk**" — directly contradicted by the new schema.
- `security-model.md` §3.2: "**VICTA does not operate its own databases at launch.** All data at rest lives in third-party platforms (Resend for newsletter subscribers, Cal.com for bookings, Vercel logs)." — directly contradicted.
- `security-model.md` §10 Open Q4 mentions "no VICTA-operated database" as the assumed model.
- `requirements.md` REQ-NF-024: "Chatbot messages must not be logged server-side in a way that would constitute personal data processing without a lawful basis. If logging is needed for abuse detection, the log must be anonymized (IP hashed, message content not stored beyond the session)." — **partly compatible** (architecture.md hashes IPs into `ip_hash`), but the schema stores `chatbot_messages.content` (full message text), which conflicts with "message content not stored beyond the session".

**Risk-of-rework**: Moderate-bordering-on-High. Three concerns:
1. **GDPR lawful basis**: storing chatbot message content + email + IP hash on VICTA's own infrastructure changes the data-controller posture (VICTA is now the controller for this data, not just a processor of Anthropic-handled chatbot messages). This requires a privacy-policy update beyond what spec.md §13.4 and security-model.md §5.1 currently describe.
2. **Threat model expansion**: Supabase Postgres adds attack surface that security-model.md §4 does NOT cover today: SQL injection at the Vercel-Function ↔ Supabase boundary, RLS bypass if a future feature mistakenly uses anon role, service-role key exfiltration (analogous to Anthropic API key risk), cross-region data leakage, backup leakage.
3. **DPA expansion**: REQ-C-006 lists DPAs needed (Google, Resend, booking, Sentry). It does NOT list **Supabase**, which is now a sub-processor handling PII (email, IP hash, message content).

**Affected docs**: spec.md §13.3, §13.4, §7.4 (and any "no DB" mention); security-model.md §3.1 (data inventory row), §3.2 (encryption-at-rest scope), §3.4 (data residency — add Supabase Frankfurt), §4 (add new attack-surface section for Supabase), §5.1 sub-processor DPA list, §6 Phase 0 checklist (add Supabase setup tasks); requirements.md REQ-NF-024 (revise to allow logging with the controls described in architecture.md §5.4 + AR-21..AR-24); REQ-C-006 (add Supabase DPA).

**Recommended fix**: Pass these documents through a **single coordinated update sweep** in Phase 0 of the workplan. The architect already wrote the rationale for the revision in architecture.md §5 — that text becomes the authoritative source. spec.md and security-model.md need to be brought into alignment, not rewritten from scratch. Estimated effort: 1–2 hours. NOT a re-run of any agent — purely documentation reconciliation.

---

### 1.3 GA4 vs Plausible — analytics tool is now confirmed but not consistently documented — 🟢 Minor

**Issue**: Roman's post-1B confirmation: **GA4 + Cookiebot CMP + Consent Mode v2** at launch. Plausible deferred to post-launch evaluation.

**Where it shows correctly**:
- `architecture.md` §11.2 names GA4 as the analytics tool with consent gating + Vercel Analytics for cookieless RUM.
- `stack-decision.md` §9 OI-13 marks "Resolved — GA4 at launch".
- `requirements.md` REQ-F-097..REQ-F-100 + REQ-C-003 (Consent Mode v2) lock GA4.

**Where it still shows ambiguity**:
- `security-model.md` §4.5 says: "**Consider Plausible Analytics as an alternative or supplement**" and §10 Open Q7 says "The architect should evaluate Plausible". This is now stale — the decision is closed.
- `requirements.md` OI-13 in the open-issues table at top still says "confirm GA4 is locked for MVP" — should be marked "RESOLVED: GA4 confirmed".
- `spec.md` §4.6 (AN-01..AN-05) names GA4 but doesn't mention Consent Mode v2 explicitly (architecture.md and requirements.md cover it).

**Risk-of-rework**: Minor. None of the open language changes implementation; it just causes confusion when workplan-builder reads stale "alternatives still under evaluation" prose.

**Affected docs**: security-model.md §4.5 + §10 Q7 (downgrade to "post-launch evaluation, not in scope at launch"); requirements.md OI-13 (mark RESOLVED).

**Recommended fix**: 5-minute edit. Phase 0 doc-tidy.

---

### 1.4 `aeo_citations` table not referenced outside architecture.md — 🟢 Minor

**Issue**: architecture.md §5.4 introduces `aeo_citations` as a strategic operational table for Roman + marketing team (manual entry of LLM citations observed; later auto-scrape). This is a Roman-specific operational asset — but it has zero cross-references in spec.md, requirements.md, or market-analysis.md.

**Where it shows**: only architecture.md §5.4 + AR-21..AR-25.

**Where it could/should be referenced**:
- `spec.md` §12.3 (AEO citation rate): currently says measurement is "manually operated metric until a monitoring tool is selected post-launch". Now there IS a system (manual entry → `aeo_citations` table) — spec.md should mention it as the operational tool.
- `requirements.md`: no REQ for "operational ability for Roman to record observed AEO citations". Should likely have a REQ-F-XXX added.
- `market-analysis.md` §6.3 priority actions: AEO citation tracking is a strategic recommendation, but the `aeo_citations` table fulfills it. Loose linkage today.

**Risk-of-rework**: Minor. The table exists in architecture.md and Roman approved it; spec/requirements/market-analysis catching up is purely documentation hygiene.

**Recommended fix**: Phase 1C `workplan-builder` should add a Phase 1 task: "Stand up Supabase Studio access for Roman to manually log observed AEO citations (acceptance: Roman can insert/edit `aeo_citations` rows via Studio)". And spec.md §12.3 should be updated to reference the table. Phase 0 doc-tidy.

---

### 1.5 AI Gateway abstraction — universally consistent ✅

**Verified across all 5 docs**:
- `intent.md` §Constraints → Claude API key never in frontend (hard constraint).
- `brainstorm.md` §Risks (Anthropic dep) → "Vercel AI Gateway abstraction mandatory; Vercel AI SDK with `provider/model` strings; chatbot MUST be model-agnostic — no direct provider SDK imports".
- `spec.md` CB-02, CB-03, §7.8: "model-agnostic via Vercel AI SDK; abstraction layer that accepts provider/model as a string".
- `security-model.md` §7 Rule 2: "All AI calls route through Vercel AI Gateway. No Vercel Function MAY import the Anthropic SDK directly".
- `requirements.md` REQ-F-058, REQ-F-059, REQ-I-001 codify the same.
- `architecture.md` AR-01: "Anthropic API access ONLY via Vercel AI Gateway. No `@ai-sdk/anthropic` direct imports. No `@anthropic-ai/sdk` direct imports".
- `stack-decision.md` §3 + §5 ("Why Vercel AI Gateway") repeats the rule.

**No drift across any of the 5 artifacts.** This is the cleanest cross-cut.

---

### 1.6 Locale ↔ currency tying — universally consistent ✅

**Verified across all docs**:
- `intent.md`, `brainstorm.md` decision 13, `spec.md` I18N-02 + §8.2, `security-model.md` §4.6, `requirements.md` REQ-NF-032, `architecture.md` AR-04 + §5.3, `stack-decision.md` mentions next-intl.

**Architectural rule AR-04**: "Currency display always derives from the validated server-side locale. Never from client-supplied cookie, query parameter, or JavaScript calculation. CZK for `/cs`, EUR for `/en`."

**No drift.** No artifact suggests a manual currency switcher.

---

### 1.7 Chatbot rate-limit triple constraint — minor inconsistency on per-day limit — 🟢 Minor

**The architectural rule (AR-17)**: per-IP (10 req/60s) AND per-session (20 messages/conversation) AND per-day (1 conversation/IP/day).

**Where each appears**:
- per-IP 10/60s: `security-model.md` §4.1, `architecture.md` AR-17, `requirements.md` REQ-F-066 (covers session 20-msg limit), security spec; `spec.md` CB-07 is more general ("Max requests per chat session enforced server-side") and doesn't pin numbers.
- per-session 20 messages: `spec.md` §7.4, `security-model.md` §4.1, `requirements.md` REQ-F-066, `architecture.md` AR-17 — all aligned.
- **per-day 1 conversation/IP/day**: ONLY in `architecture.md` AR-17 + §8.5 (a third dimension added at architect time). This is **NOT in spec.md, requirements.md, or security-model.md**.

**Risk-of-rework**: Minor. The architect chose to add a third dimension; build agents will follow architecture.md, but unfamiliar reviewers reading spec.md or requirements.md would not see this layer.

**Affected docs**: requirements.md should add a REQ-F (or amend REQ-F-066) for the per-day limit. security-model.md §4.1 should mention 3-dimensional rate limit. spec.md §7.4 should add "per-day session creation limit (1 IP/day) for cost amplification defense".

**Recommended fix**: 10-minute doc edit. Phase 0 doc-tidy.

---

### 1.8 Cookie consent + GA4 Consent Mode v2 — consistent — ✅

**Verified**:
- `intent.md` Concrete Success #9 — GA4 with GDPR-compliant cookie consent banner.
- `brainstorm.md` decision 21 — same.
- `spec.md` AN-01, AN-02 — GA4 fires only after consent.
- `security-model.md` §4.5 + §7 (no explicit AR# but §7 covers compliance), §5.4 ePrivacy.
- `requirements.md` REQ-F-093..REQ-F-097 + REQ-C-003 (Consent Mode v2), REQ-C-004 (no dark patterns).
- `architecture.md` AR-09 + §2.2 cookie consent module + §11.2 analytics gated on consent.
- `stack-decision.md` §4 cookie consent → Cookiebot.

**One minor gap**: `requirements.md` OI-14 still says "Cookie consent manager: custom implementation vs Cookiebot vs Osano vs CookieYes... Decision: Phase 1B stack-selector." Stack-selector has now decided **Cookiebot** — OI-14 should be marked RESOLVED.

**Risk-of-rework**: 🟢 Minor. Doc-tidy.

---

### 1.9 Path B (invoice/bank transfer) — consistent — ✅

**Verified**:
- `security-model.md` §3.5 explicitly defines Path A (Stripe via Cal.com), Path B (invoice), Path C (custom — PROHIBITED).
- `architecture.md` AR-25 + §1.2 + §5.4 (booking_events.invoice_status), confirms Path B.
- `stack-decision.md` §4 Booking, §9 — Path B confirmed.
- `requirements.md` REQ-C-013 covers PCI compliance contingent on payment path.
- `spec.md` §6 (Audit Page Deep-Dive) — does NOT explicitly mention "invoice flow" or "no online payment". The visitor reads pricing ranges, books a slot, receives confirmation email. Spec.md is silent on the post-booking payment mechanism.

**Risk-of-rework**: 🟡 Moderate. The audit booking → invoice → payment → audit flow is not described in spec.md. Visitors arriving at `/cs/spoluprace/` don't see "you'll receive an invoice after the slot is booked" anywhere in the spec; the build agent could plausibly omit this critical visitor-facing communication. The architect codified Path B in AR-25 but didn't reach back into spec.md to add the corresponding visitor experience.

**Affected docs**: spec.md §6 (`/cs/spoluprace/` deep-dive) needs a new sub-section or paragraph: "After booking, visitor receives invoice via email; payment by bank transfer; audit begins on confirmed payment." This is also a content task (Phase 4) but the spec must declare the flow.

Also: `requirements.md` has no REQ-F entry for invoice tracking visibility (e.g., "Roman can mark `booking_events.invoice_status = paid`"). architecture.md §5.4 + §17 mentions a "simple admin endpoint or direct Supabase Studio" as the launch mechanism — this should appear in requirements.md for completeness.

**Recommended fix**: Add a paragraph to spec.md §6 describing the post-booking invoice flow. Add REQ-F-XXX for invoice-status update mechanism (Roman-facing). Phase 0 doc-tidy + small content task in Phase 4.

---

### 1.10 Supabase RLS — public clients have no DB access — internally consistent — ✅

**Verified in architecture.md AR-21**: "Public clients have no direct database access. All writes to Supabase Postgres go through validated, rate-limited Vercel Functions that hold the SUPABASE_SERVICE_KEY server-only. Row-Level Security is enabled on every table and the anon role has no policies (default deny)."

**No requirement or spec.md statement contradicts this.** No client-side Supabase usage is implied anywhere. The chatbot widget calls `/api/chat` (Vercel Function), which calls Supabase. Same for `/api/contact`, `/api/newsletter`, `/api/booking-webhook`. All consistent.

---

### 1.11 Czech typography linter — consistent — ✅

- `requirements.md` REQ-NF-036 — defines the rules (Czech quotation marks, em-dashes, single-letter prepositions, number+unit nbsp, no orphans).
- `spec.md` does not have a dedicated section but consistent with brand voice (§14.1 "first-person plural").
- `architecture.md` AR-08 + §6.4 — implements as a CI build-time linter on `.cs.mdx` and Czech locale JSON files; build fails on violation.

**No drift.** REQ-T-014 (testing) confirms CI integration.

---

### 1.12 Anti-flash dark mode — consistent — ✅

- `requirements.md` REQ-F-074 — anti-flash inline script in `<head>`.
- `architecture.md` AR-10 + §7.2 — concrete inline-script implementation reading `localStorage.victa-theme`.
- `spec.md` TH-03 (system preference) + §9.1 (defaults).

**No drift.**

---

### 1.13 Booking webhook signature — consistent — ✅

- `requirements.md` REQ-F-036 — signed webhook with replay protection.
- `architecture.md` AR-11 + §8.6 — HMAC-SHA256 verification, 5-min replay window, idempotency via webhook_id.
- `security-model.md` §4.10 — webhook signing required.

**No drift.**

---

## 2. Coverage Gap Findings

### 2.1 Concrete Success criteria → functional requirements coverage — Mostly complete — 🟢 Minor

I traced each of intent.md's 14 Concrete Success criteria to at least one REQ in requirements.md.

| # | Intent criterion | Mapped to | Status |
|---|---|---|---|
| 1 | Live at custom domain (HTTPS, redirects) | REQ-O-004, REQ-I-006, REQ-I-012, REQ-NF-026 | ✅ |
| 2 | Complete content on every page (Czech, Roman-approved) | REQ-CON-001, REQ-CON-005, REQ-CON-021 | ✅ |
| 3 | Working AI chatbot (Claude via proxy, sanitized, off-topic refusal, system-prompt defense, Czech, stateless) | REQ-F-057..REQ-F-071 | ✅ |
| 4 | Working contact form | REQ-F-041..REQ-F-048 | ✅ |
| 5 | Booking system live | REQ-F-032..REQ-F-040 | ✅ |
| 6 | Newsletter signup + designed welcome email | REQ-F-049..REQ-F-056, REQ-F-075..REQ-F-078 | ✅ |
| 7 | i18n architecture ready (EN-capable, route-based, hreflang) | REQ-NF-031..REQ-NF-038, REQ-F-028..REQ-F-030, REQ-F-091 | ✅ |
| 8 | Dark mode supported (system preference + toggle, both themes WCAG 2.1 AA) | REQ-F-072..REQ-F-074, REQ-NF-011..REQ-NF-014, TH-01..TH-05 | ✅ |
| 9 | Analytics live (GA4 + GDPR consent) | REQ-F-093..REQ-F-100, REQ-C-003 | ✅ |
| 10 | Baseline SEO + AEO (robots, sitemap, OG, schema, llms.txt, AEO content patterns) | REQ-F-079..REQ-F-092 | ✅ |
| 11 | Indexed on Google (Search Console verified, homepage indexed) | REQ-I-005, REQ-F-100 | ✅ |
| 12 | Fast on mobile (Lighthouse ≥ 90, LCP < 2.5s, CLS < 0.1, INP < 200ms) | REQ-NF-001..REQ-NF-005 | ✅ |
| 13 | Accessible (WCAG 2.1 AA on key pages, both themes) | REQ-NF-011..REQ-NF-021 | ✅ |
| 14 | Team page added last (sequenced, can ship as stub) | REQ-F-019, REQ-F-027 | ✅ |

**One gap**: criterion #2 ("page-by-page walkthrough with Claude during build") implies a content-review workflow that requirements.md acknowledges (REQ-CON-001) but does NOT define cadence (synchronous per-page approval gate vs batched milestone reviews). This is OQ-11 in spec.md and OI in requirements.md. **Decision belongs to workplan-builder** (Phase 1C) per the docs themselves — not a gap, just a flag.

---

### 2.2 Architectural rules (AR-01..AR-25) → driving requirements/threats trace — Complete — ✅

I traced each AR# to at least one driving requirement or threat:

| AR | Driver | Verified |
|---|---|---|
| AR-01 | REQ-F-059, REQ-I-001, intent.md hard constraint | ✅ |
| AR-02 | REQ-F-058, security-model.md §7 Rule 1 | ✅ |
| AR-03 | REQ-NF-031, security-model.md §4.6 (locale validation) | ✅ |
| AR-04 | REQ-NF-032, security-model.md §4.6 (currency arbitrage) | ✅ |
| AR-05 | REQ-F-073 (theme persistence) | ✅ |
| AR-06 | REQ-NF-032..REQ-NF-034, brainstorm decision 13 | ✅ |
| AR-07 | REQ-F-085..REQ-F-088 (consistent schema generation) | ✅ |
| AR-08 | REQ-NF-036, REQ-T-014 (Czech typography) | ✅ |
| AR-09 | REQ-F-097, REQ-C-003 | ✅ |
| AR-10 | REQ-F-074 | ✅ |
| AR-11 | REQ-F-036, REQ-T-011, security-model.md §4.10 | ✅ |
| AR-12 | TH-01..TH-05, REQ-NF-014 | ✅ |
| AR-13 | security-model.md §3.4 (data residency) | ✅ |
| AR-14 | security-model.md §1.2, Phase 0 checklist | ✅ |
| AR-15 | REQ-F-065, security-model.md §4.1 | ✅ |
| AR-16 | REQ-O-013 (cost control), security-model.md §4.1 cost amplification | ✅ |
| AR-17 | REQ-F-066, security-model.md §4.1 (with the per-day caveat from §1.7) | partial — see §1.7 |
| AR-18 | REQ-F-061 (off-topic refusal) | ✅ |
| AR-19 | security-model.md §7 Rule 11 (SRI) | ✅ |
| AR-20 | security-model.md §7 Rule 4 (CSP) | ✅ |
| AR-21..AR-24 | architecture.md §5 itself (Supabase decision); **NOT yet driven by spec.md or security-model.md** | partial — see §1.2 |
| AR-25 | security-model.md §3.5 (Path B), no Stripe at launch | ✅ |

**Gap**: AR-21..AR-24 (Supabase) trace ONLY to architecture.md's own rationale section, not to upstream spec.md / security-model.md / requirements.md. They were added in the post-1B revision. This is the same root cause as §1.2 — bringing spec.md and security-model.md into alignment closes this trace.

---

### 2.3 External integrations (stack-decision.md) → integration requirements (REQ-I) — Mostly complete — 🟢 Minor

| Stack-decision external integration | Mapped to REQ-I-XXX | Status |
|---|---|---|
| Vercel AI Gateway / Anthropic Claude | REQ-I-001 | ✅ |
| Cal.com Cloud | REQ-I-002 | ✅ |
| Resend | REQ-I-003 | ✅ |
| GA4 + GTM | REQ-I-004 | ✅ |
| Search Console | REQ-I-005 | ✅ |
| Namecheap | REQ-I-006, REQ-I-012 | ✅ |
| Vercel deployment | REQ-I-007 | ✅ |
| Sentry | REQ-I-008 | ✅ |
| Vercel Image Optimization | REQ-I-009 | ✅ |
| Cookiebot | REQ-I-014 | ✅ |
| Upstash Redis | **MISSING from REQ-I-XXX** | 🟡 Moderate |
| Cloudflare Turnstile | **MISSING from REQ-I-XXX** | 🟡 Moderate |
| **Supabase Postgres** | **MISSING from REQ-I-XXX** | 🟡 Moderate |
| Freshping (uptime) | REQ-I-015 | ✅ |
| Vercel Analytics | mentioned in REQ-NF-048 (not REQ-I) | partial — OK |

**Gap**: Three integrations selected by stack-selector and architect have NO corresponding REQ-I entry in requirements.md:
- **Upstash Redis** — handles ALL rate limiting (chatbot, contact, newsletter). It is on the critical path for security and cost control. Should have a REQ-I covering: failure behavior (fail open vs fail closed), DPA (Upstash data residency), free tier limits.
- **Cloudflare Turnstile** — runs on every form submission. Privacy-friendly CAPTCHA. Should have a REQ-I covering: failure behavior (block submission vs allow with flag), site key vs secret key handling, fallback.
- **Supabase Postgres** — handles 7 tables of operational data. Largest data residency + DPA + breach-notification surface introduced after Phase 1A. Should have REQ-I covering: connection auth (service role), DPA (Supabase Inc.), data residency (Frankfurt eu-central-1 — AR-22), backup cadence, schema migration policy (AR-23).

**Risk-of-rework**: Moderate. Build agents will use these tools (architecture.md is canonical) but the absence in requirements.md creates a traceability gap that surfaces in compliance audits and post-launch maintenance handoffs.

**Recommended fix**: Add three new REQ-I entries to requirements.md. Estimated 30-minute doc task. Phase 0.

---

### 2.4 Page types from spec.md → rendering strategy in architecture.md §4.1 — Complete — ✅

architecture.md §4.1 covers:
- Homepage: SSG + ISR (24h)
- Service pages (18): SSG
- Solution pages (5): SSG
- Industry pages (6): SSG
- /cs/spoluprace: SSG
- /cs/o-nas: SSG
- /cs/kontakt: SSG (form via API route)
- /cs/blog: SSG (placeholder)
- /cs/ochrana-soukromi: SSG
- /cs/cookies: SSG
- /en: SSG (stub)
- /404: SSG
- /api/*: Serverless Function

**Implicit gap**: `/cs/odvetvi/` (the new overview page from §1.1) is NOT explicitly listed in §4.1's table — though architecture.md §4.2 lists it in the URL structure with intent SSG. This is a documentation hygiene issue tied to §1.1.

**Risk-of-rework**: 🟢 Minor. Same root-cause as §1.1; closing §1.1 closes this.

---

### 2.5 Phase 0 security blockers → workplan precursor — pending Phase 1C — ✅ (deferred, not a gap)

security-model.md §6 contains 50+ Phase 0 blocking checkboxes (admin 2FA, secret management, infrastructure setup, chatbot security, contact form + newsletter, GDPR, booking, build pipeline). architecture.md AR-14 anchors 2FA. Each item is a Phase 0 task to be enumerated by `workplan-builder` in Phase 1C.

This is the **input to workplan-builder**, not a gap in upstream documents. Workplan-builder MUST consume security-model.md §6 verbatim into the Phase 0 checklist.

**One addition** that workplan-builder must include given the §1.2 reconciliation: Supabase setup blockers (project creation in Frankfurt, RLS verification, service-key env var, schema migration, DPA signing).

---

## 3. Open Issues Consolidation for Phase 1C

Both spec.md (§15) and architecture.md (§Open Issues) have unresolved-decision lists. Plus requirements.md has its own "Open Issues" table at top. Consolidating:

### 3.1 RESOLVED (mark as closed in respective documents)

| Item | Original location | Resolution |
|---|---|---|
| OQ-01 / OI-02 / OI-A: Stack choice | spec.md, requirements.md, architecture.md | **RESOLVED**: Next.js 15 App Router (stack-decision.md §1) |
| OQ-02 / OI-04 / OI-C: Booking system | spec.md, requirements.md, architecture.md | **RESOLVED**: Cal.com Cloud free tier (stack-decision.md §4) |
| OQ-03 / OI-05 / OI-D: Contact form delivery | spec.md, requirements.md, architecture.md | **RESOLVED**: Vercel Server Action + Resend (stack-decision.md §4) |
| OQ-04 / OI-03: i18n implementation | spec.md, requirements.md | **RESOLVED**: route-based `/cs/...` + `/en/...` with next-intl (architecture.md §6, stack-decision.md §4) |
| OQ-05: `/cs/odvetvi/` overview page | spec.md | **RESOLVED**: standalone overview page added (architecture.md §4.2) — but spec.md still describes it as "implied" — see Finding §1.1 |
| OI-13: GA4 vs Plausible | requirements.md | **RESOLVED**: GA4 at launch, Plausible deferred (stack-decision.md §9) |
| OI-14: Cookie consent CMP | requirements.md | **RESOLVED**: Cookiebot (stack-decision.md §4) |
| OI-15 / REQ-I-015: Uptime monitoring | requirements.md | **RESOLVED**: Freshping free tier (stack-decision.md §9) |
| OI-E: Rate limiting store | architecture.md | **RESOLVED**: Upstash Redis (stack-decision.md §4) |
| OI-F: Sentry vs alt | architecture.md | **RESOLVED**: Sentry (stack-decision.md §4) |
| OI-G: Payment path | architecture.md | **RESOLVED**: Path B invoice (stack-decision.md §4, AR-25) |
| **(NEW): No DB at launch** | architecture.md original | **RESOLVED via revision**: Supabase Postgres at launch with 7 tables (AR-21..AR-24) |
| **(NEW): Analytics tool** | brainstorm.md soft-decision | **RESOLVED**: GA4 + Cookiebot + Consent Mode v2 |
| **(NEW): Industries overview page** | spec.md OQ-05 | **RESOLVED**: `/cs/odvetvi/` as standalone rozcestník (Roman approved) |
| **(NEW): Pricing CZK/EUR** | brainstorm.md item 8 | **RESOLVED & locked**: T1 20-90k Kč / €800-3600; T2 10-55k Kč / €400-2200; T3 4-25k Kč / €160-1000 |

### 3.2 STILL OPEN (Roman decision required pre-Phase 4)

| Item | Decision needed from | Phase to resolve |
|---|---|---|
| OI-07: Dark-mode canonical default (light vs dark) | Design session → Roman | Pre-Phase 4 (design freeze) |
| OI-10: Team page content depth (names + photos vs roles-only vs hybrid) | Roman | End of build sequence (Phase 4 late) |
| OI-11: Color palette / font-pairing direction (A/B/C/hybrid from design-directions.md) | Roman | Pre-Phase 4 (design freeze) |
| Newsletter lawful basis (consent checkbox vs legitimate interest) | Roman + Czech legal advisor | Pre-launch |
| Privacy policy + cookie policy legal review | Roman + Czech legal advisor | Pre-launch (REQ-CON-009 Phase 0/1) |
| OQ-15: Audit page exact copy detail | Roman + Claude Code | Phase 4 |
| OQ-17: Chatbot system prompt full content | Roman + Claude Code | Phase 4 |
| OQ-18: Domain registrar migration to Cloudflare | Roman | Post-launch |

### 3.3 STILL OPEN (build-time decisions — no agent owner; surface to workplan-builder)

| Item | Phase to resolve |
|---|---|
| OQ-06: Chatbot embed method (inline vs floating) — `architect` left to build | Phase 4 build, default = floating per CB-01 |
| OQ-07: Booking widget embed method (inline vs modal vs redirect) — `architect` left to build | Phase 4 build, default = `@calcom/atoms` inline |
| OQ-11: Content review workflow cadence | Phase 1C `workplan-builder` |
| OQ-13: Existing draft reuse (mine vs blank) | Phase 4, recommendation = scratch input only |
| OQ-16: Blog placeholder content | Phase 4 content sprint |
| OQ-20: Specific 21st.dev components used vs custom | Phase 1B/4 build decision |
| Invoicing tool integration (Fakturoid recommended) | Phase 1C workplan-builder |
| AEO citation tracking automation | Post-launch |
| `unsafe-inline` style-src CSP exception (next-themes nonce strategy) | Phase 4 build |

### 3.4 STILL OPEN (post-launch)

- Plausible Analytics evaluation (post-launch)
- Headless CMS evaluation (Sanity/Payload) — post-launch
- AEO citation auto-scrape (Apify, Bright Data) — post-launch
- HSTS preload — post-launch (after 60+ days stable)
- Cloudflare Registrar migration — post-launch
- Cal.com Teams + Stripe (if Path A becomes desired) — post-launch
- Secondary LLM judge for chatbot output review — Phase 2/3

---

## 4. Recommended Actions

### Priority 1 — Must fix before Phase 1C `workplan-builder` runs (🟡 Moderate findings)

1. **Reconcile spec.md, security-model.md, requirements.md to the Supabase decision** (Finding §1.2, §2.2 AR-21..AR-24). Single coordinated documentation pass:
   - spec.md §13.3 — replace "no custom database" with the Supabase Postgres scope.
   - spec.md §13.4 — update "Chatbot messages are not persisted" to reflect new conversation logging policy + GDPR lawful basis.
   - spec.md §7.4 — same correction for chatbot logging.
   - security-model.md §3.1 — add Supabase to data inventory.
   - security-model.md §3.2, §3.4 — update encryption-at-rest scope and add Supabase Frankfurt residency.
   - security-model.md §4 — add §4.x "Supabase Postgres" attack surface (SQL injection at Function/Supabase boundary, RLS bypass, service-role key exfil, backup leakage).
   - security-model.md §5.1 sub-processor list — add Supabase DPA.
   - security-model.md §6 Phase 0 checklist — add Supabase setup blockers.
   - requirements.md REQ-NF-024 — revise to allow controlled chatbot logging per architecture.md §5.4.
   - requirements.md REQ-C-006 — add Supabase to DPA list.

2. **Update spec.md page count from 40 to 41 and add `/cs/odvetvi/` to the page inventory** (Finding §1.1). Also explicitly add `/cs/odvetvi/` to spec.md §4.1 rendering-strategy table.

3. **Add three new REQ-I entries to requirements.md** (Finding §2.3): Upstash Redis, Cloudflare Turnstile, Supabase Postgres. Each with: failure behavior, rate/cost limits, DPA status, data residency.

4. **Add Path B invoice flow description to spec.md §6** (Finding §1.9). Visitor experience: book → email confirmation → invoice email → bank transfer → audit kickoff. Plus REQ-F-XXX for Roman's invoice-status update mechanism.

### Priority 2 — Should fix during Phase 1C (🟢 Minor findings)

5. **Mark resolved Open Issues across all 4 docs** (§3.1 list above). 30-minute pass.
6. **Add per-day rate-limit (1 conversation/IP/day, AR-17 dimension 3) to security-model.md §4.1, requirements.md, and spec.md §7.4** (Finding §1.7).
7. **Update security-model.md §4.5 + §10 Q7 to mark Plausible as post-launch evaluation** (Finding §1.3).
8. **Cross-reference `aeo_citations` table in spec.md §12.3** and add a workplan task for Roman's manual-entry workflow (Finding §1.4).
9. **Update spec.md §4.6 (AN-01..AN-05) to explicitly mention Consent Mode v2** (Finding §1.8).

### Priority 3 — Acceptable as ACCEPTED GAPs (workplan-builder may proceed)

10. The `architect` left several "OQ-XX" items to "Phase 4 build" (e.g., chatbot floating vs inline, exact embed method). These are **acceptable gaps** for workplan-builder to surface as Phase 4 decisions; they don't require pre-Phase 1C resolution.
11. The "unsafe-inline" CSP exception note (architecture.md §8.2) is an acceptable gap — it's a build-time decision once next-themes Next.js 15 nonce-support is confirmed.

---

## 5. Risk-of-Rework Recap

| Finding | Severity | Doc edit effort | Build cost if missed |
|---|---|---|---|
| §1.1 Page count 40 vs 41 | 🟡 Moderate | 10 min | Sitemap/QA find at end of Phase 4 — ~half day rework |
| §1.2 Supabase scope across spec/security/requirements | 🟡 Moderate | 1–2 hrs | Significant: privacy policy needs additional disclosures, DPA needs new vendor (Supabase Inc.), new attack surfaces uncovered late = potential pre-launch security re-audit |
| §1.3 Plausible language stale | 🟢 Minor | 5 min | None — just confusion |
| §1.4 `aeo_citations` orphaned | 🟢 Minor | 10 min | None — feature still works; just doc trace gap |
| §1.7 Per-day rate limit not in spec/req | 🟢 Minor | 10 min | Build agent might miss it — ~1 hour fix |
| §1.9 Path B flow not in spec.md §6 | 🟡 Moderate | 30 min | Visitor-facing ambiguity, missing copy "you'll receive an invoice" — content task at content review time |
| §2.3 Missing REQ-I for Upstash, Turnstile, Supabase | 🟡 Moderate | 30 min | Compliance trace gap; potential surprise during DPA review |
| §3.1 Many Open Issues unresolved-status | 🟢 Minor | 30 min | Workplan-builder duplicates resolved decisions — 1 hr rework |

**Total estimated documentation reconciliation effort**: 4–6 hours of editing across 3 files (spec.md, security-model.md, requirements.md). Architecture.md and stack-decision.md are NOT modified — they are canonical for the post-1B reality.

---

## 6. Decision

**Status**: PASSED-WITH-NOTES.

**Recommendation to Roman / Phase 1C orchestrator**:

> Proceed to Phase 1C `workplan-builder`. Add the Priority-1 actions (1–4 above) as Phase 0 documentation-reconciliation tasks at the very top of the workplan. Phase 0 of the build then runs them as the first 4–6 hours of Phase 4 work. No architect re-run needed; no requirements-engineer re-run needed; no security-analyst re-run needed.

The architecture and security model are **structurally sound**. The post-1B revisions (Supabase, GA4 confirmation, `/odvetvi/` rozcestník, Path B codification, pricing freeze) were Roman-approved decisions made AFTER spec.md, security-model.md, and requirements.md were written. The only remediation required is propagating those decisions back into the upstream documents so that spec/security/requirements stop describing the OLD model. This is documentation hygiene, not a structural problem.

The validation deliberately avoided false precision: it does NOT block on minor wording inconsistencies, does NOT block on legitimate "Phase 4 build decisions" left open by the architect, and does NOT block on items already resolved by stack-selector. It DOES block on documentation drift that would mislead build agents reading spec.md or security-model.md as the source of truth.

---

*End of validation report. Hand-off: Phase 1C `workplan-builder` — consume this report's §3 (Open Issues consolidation) and §4 (Recommended Actions) directly.*
