# VICTA — Handoff pro další session

**Datum vzniku:** 2026-05-07
**Pro:** Claude session, která bude pokračovat v práci za den / dva / týden — **úplně cold start**.
**Od:** Předchozí parallel session (Phase 2 backend + Phase 5 essentials).

---

## TL;DR — co máš udělat

1. **Přečti si tento dokument celý** (15 min). Pak `intent.md`, `decisions.md`, `claude-rules.md`, a `docs/superpowers/specs/2026-05-07-phase-2-5-6-build-plan.md`.
2. **Zkontroluj, jestli Roman vyřešil nějaký z 24 blockerů** (sekce „Roman blockery" níže). Pokud ano, odblokovaná práce je tvoje další úloha.
3. **Pokud nejsou žádné nové výsledky od Romana**, pokračuj s prací, která Roman blocker NEpotřebuje:
   - Vitest + Playwright tests (Phase 2.12)
   - Lighthouse CI config (Phase 5.7)
   - axe-core E2E suite (Phase 5.8)
   - Schema/meta/OG E2E audits (Phase 5.4–5.5)
   - Smoke test CLI (Phase 5.10)
4. **Pokud paralelní session na Phase 1.2 už skončila**, integrace mezi Phase 1.2 a Phase 2 (RB-21..RB-24) je tvoje úloha (Edit existujících komponent).
5. **Status updates do `.workforce/parallel-session-status.md`** (append-only).

---

## Co projekt JE

VICTA je **Czech-language marketing web pro digitální agenturu Romana Le**. Stack: **Next.js 15 App Router + Vercel Functions (region fra1) + Supabase Postgres (Frankfurt) + Upstash Redis + Resend + Cal.com + Cookiebot + GA4 + Sentry + Cloudflare Turnstile**.

- **41 stránek** (39 czech + 1 EN stub + 1 utility 404)
- **2 lokality**: `cs` (default, full content) + `en` (landing stub only)
- **3 audit tiers** + free scoping call přes Cal.com (Path B = invoice + bank transfer, NO online payment)
- **Chatbot DEFERRED** post-launch (D-002) — nepřidávej `/api/chat`, neimport `@anthropic-ai/sdk`
- **Brand voice**: first-person plural ("my", "naše"), nikdy "já"
- **LOCKED design tokens** (D-001): Inter Tight + Geist Mono + indigo `#3730A3` (light) / `#7367E5` (dark) + 40×40 grid pattern. Definováno v `tokens/light.css` + `tokens/dark.css`. **Žádné token změny.**

---

## Aktuální stav projektu (k 2026-05-07)

### ✅ Hotové (Phase 0, 1, 1.2 paralelně + 2 backend + 5 essentials)

**Phase 0 (Foundation, security, compliance baseline)** — ✅ DONE.

**Phase 1 + 1.2 (Scaffold, design system, infrastructure, full visual scaffold)** — ✅ DONE paralelní session. Phase 1.2 commit `e104f43`. Hotové:
- Next.js 15 App Router scaffold + Tailwind v4
- LOCKED design tokens (`tokens/light.css`, `tokens/dark.css`)
- next-intl i18n routing s allowlist `['cs', 'en']`
- next-themes + anti-flash inline script
- 41 pages (homepage, sluzby, sluzby/<slug>×18, reseni, reseni/<slug>×5, odvetvi, odvetvi/<slug>×6, spoluprace, o-nas, kontakt, blog, ochrana-soukromi, cookies, /en, 404)
- Komponenty: `nav.tsx`, `footer.tsx`, `theme-toggle.tsx`, `locale-switcher.tsx`, `status-line.tsx`, `button.tsx`, `pricing-card.tsx`, `theme-provider.tsx`, `en-stub.tsx`
- Czech copy v `content/cs/strings/common.json` (138 porušení Czech typography linteru — Phase 1.2 fix)

**Phase 2 backend (interactive features)** — ✅ DONE v této session. Commits `4065343..d496854`. Hotové:
- Deps: Supabase, Upstash (Redis + Ratelimit), Resend, Sentry, RHF, axe-playwright, lhci
- `.env.example` split RESEND_API_KEY → _NEWSLETTER + _CONTACT, přidány CALCOM_USERNAME, IP_HASH_SALT, CONTACT_DESTINATION_EMAIL
- **Lib clients** (`src/lib/`):
  - `supabase.ts` — typed admin client (server-only via `import 'server-only'`)
  - `supabase-types.ts` — hand-rolled Database types pro 8 tables (concrete Insert types kvůli postgrest-js v2.105 RejectExcessProperties quirk)
  - `redis.ts` — **lazy proxy** (build-time safe; throws při prvním use, ne při import)
  - `rate-limit.ts` — Upstash sliding-window limiters (contact 5/600s, newsletter 3/3600s, webhook 60/60s) + `hashIp(ip)` (salted SHA-256) + `wasWebhookProcessed(id)` (NX 24h TTL)
  - `sanitize.ts` — `sanitizeFormString()` (HTML strip + control char strip) + `isValidEmail()` (rejects \r\n\x00)
  - `turnstile.ts` — `verifyTurnstileToken(token, ip?)` (fail-CLOSED — narozdíl od rate-limit)
  - `leads.ts` — `upsertLead({email,...})` (cross-source CRM root row)
  - `consent.ts` — `hasAnalyticsConsent()` + `onConsentChange(handler)` (Cookiebot reader)
  - `ga4.ts` — `trackEvent(name, params)` (consent-gated, silent no-op without consent)
  - `schema.ts` + `schema-types.ts` — 6 JSON-LD builders (Org, LocalBusiness, Service, FAQ, Breadcrumb, WebSite)
  - `contact-schema.ts` + `newsletter-schema.ts` — Zod schemas (sdílené client/server)
- **Configs** (`src/config/`):
  - `site.ts` — org metadata + 5 ROMAN-BLOCKER markers (RB-13)
  - `routes.ts` — 18 service + 5 solution + 6 industry slugs + top-level routes
- **API routes** (`src/app/api/`):
  - `contact/route.ts` — POST: Origin → Zod → honeypot → Turnstile → rate-limit → sanitize → upsertLead → Resend → Supabase insert
  - `newsletter/route.ts` — POST: stejný pattern + Resend audience add + welcome email (single opt-in s GDPR consent record; RB-17 čeká na advokáta)
  - `booking-webhook/route.ts` — POST: HMAC-SHA256 verify (timingSafeEqual) → replay window 5min → Upstash NX idempotency → upsertLead → Supabase booking_events insert (Path B `invoice_status='pending_invoice'`)
- **Components** (`src/components/`):
  - `forms/contact-form.tsx` — Client Component, RHF + Zod, honeypot, GDPR checkbox, Turnstile, success/error states, fires `contact_form_submit`
  - `forms/newsletter-signup.tsx` — Reusable (default | inline variants), GDPR consent text z `consentTextFor(locale)`, fires `newsletter_signup`
  - `forms/turnstile-widget.tsx` — Managed Cloudflare Turnstile loader (one global script tag, idempotent renders, cleanup on unmount)
  - `booking/cal-booking-widget.tsx` — Cal.com inline embed s 8s timeout fallback
  - `booking/booking-cta.tsx` — Modal CTA, lazy-loads embed.js přes requestIdleCallback
  - `consent/cookiebot-script.tsx` — Loads consent.cookiebot.com/uc.js (afterInteractive — App Router requirement)
  - `consent/ga4-loader.tsx` — Client Component, subscribes na Cookiebot events, renders gtag.js teprve po consent
  - `seo/json-ld.tsx` — Server Component, renders one or more JsonLdNode jako `<script type="application/ld+json">`
- **Sentry init** (root): `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` — všechny s `beforeSend` PII scrub, guard na placeholder DSN
- **Layout integrace**: `src/app/[locale]/layout.tsx` upraven (Edit, ne Write) — přidán `<CookiebotScript />` v `<head>` a `<Ga4Loader />` na konec `<body>`. Phase 1.2 práce zachována.

**Phase 5 essentials** — ✅ DONE v této session:
- `src/app/robots.ts` — Disallow `/api/`, `/404`, `/*?*`; sitemap link
- `src/app/sitemap.ts` — 41 entries s `alternates.languages` cs/en/x-default + per-page priority
- `public/llms.txt` — Czech intro + English structured catalog (18 services + 5 solutions + 6 industries) + Path B engagement model + citation policy
- `scripts/czech-typography-lint.mjs` + `pnpm lint:cs` script — našel 138 porušení v Phase 1.2 contentu (Phase 1.2 fix; ještě NE CI-gating)

### ⏳ Co zbývá / je rozpracované

**Phase 2 — wiring + tests:**
- 2.6 — Audit page tier CTAs zatím linkují na statické `<Button href="/spoluprace">`. Potřeba Edit `src/app/[locale]/spoluprace/page.tsx` a swap CTA → `<BookingCta eventSlug="tier-1-audit" bookingType="audit_t1" sourcePage="/cs/spoluprace">{ctaLabel}</BookingCta>` pro každý tier. **(RB-21)**
- 2.9 — `<ContactForm />` ready ale Phase 1.2 designovala `/cs/kontakt` jako direct-channels page bez form. Roman se musí rozhodnout: (a) přidat form jako sekci, (b) keep direct-only. **(RB-22)**
- 2.10 — `<NewsletterSignup />` component není zatím umístěna na žádné stránce. Phase 1.2 owns homepage / blog placeholder / footer. **(RB-23)**
- 2.11 — GA4 events `locale_switched` + `theme_toggled` + `cookie_consent_given/declined` potřeba přidat do `src/components/{locale-switcher,theme-toggle}.tsx` přes Edit. `trackEvent()` z `@/lib/ga4` připraven. **(RB-24)**
- 2.12 — Vitest + Playwright tests neexistují (Vitest 2.x je nainstalován ale `vitest run` má 0 testů). Potřeba:
  - `src/lib/__tests__/sanitize.test.ts` (sanitizeFormString edge cases)
  - `src/lib/__tests__/rate-limit.test.ts` (hashIp determinism, fail-open simulation)
  - `src/app/api/booking-webhook/__tests__/route.test.ts` (HMAC verify, replay, idempotency, body parsing)
  - `src/app/api/contact/__tests__/route.test.ts` (origin reject, validation, turnstile fail, rate-limit)
  - `src/app/api/newsletter/__tests__/route.test.ts` (duplicate email silent dedup, single opt-in flow)
  - `e2e/contact-form.spec.ts`, `e2e/newsletter.spec.ts`, `e2e/booking.spec.ts` (Playwright + axe-core)
  - `e2e/locale-theme.spec.ts` (locale switch + theme toggle)

**Phase 5 — kompletní pre-launch QA:**
- 5.4 — Schema validation E2E: Playwright spec, scrape JSON-LD blocks, assert structure. Document v `docs/schema-validation-report.md` + Google Rich Results Test verification.
- 5.5 — Meta + OG audit E2E: assert na všech 41 stránkách unique title (50–60 chars), unique description (120–160 chars), og:title, og:description, og:image (1200×630 png), og:url, og:type, og:locale, twitter:card.
- 5.6 — AEO content patterns: verify FAQ blocks na všech service/solution/industry pages + EvidencePanel na homepage + spoluprace.
- 5.7 — Lighthouse CI: `.lighthouserc.json` + `.github/workflows/lighthouse.yml`. Target: mobile performance ≥ 90, LCP < 2.5s, CLS < 0.1, INP < 200ms na homepage, /sluzby/ai-chatboti, /spoluprace, /kontakt.
- 5.8 — axe-core a11y: `e2e/a11y.spec.ts` runs na 4 key pages × 2 themes = 8 runs. Zero WCAG 2.1 AA violations.
- 5.9 — GSC verification (Roman, RB-09).
- 5.10 — `docs/smoke-test-checklist.md` + `scripts/smoke-test.mjs` CLI runner (HTTP-level: status, redirect, headers).
- 5.11 — Freshping setup (Roman, RB-10).
- 5.12 — CSP flip Report-Only → enforced (Roman sign-off, RB-16).
- 5.13 — Pre-launch security audit dokument: grep audit (`NEXT_PUBLIC_*KEY|*SECRET|*TOKEN`), no `@anthropic-ai/sdk` import, no client→Supabase calls, RLS test, CSP headers verify, `pnpm audit --audit-level critical`.

**Phase 6 — launch:**
- Plně blokované na Phase 5 + Roman approval (RB-19, RB-20). 6.1 production launch + 6.2 walkthrough + 6.3 day-1..7 monitoring.

---

## Klíčové dokumenty (read order pro cold start)

1. **`.workforce/intent.md`** — Falsifiable scope. 13 launch criteria (SC-03 chatbot deferred). Read first.
2. **`decisions.md`** — 6 decision entries D-001..D-006 (locked design tokens, chatbot deferred, Path B invoice, public repo, 2FA tiering, CSP report-only flip).
3. **`claude-rules.md`** — 15 critical rules. **Honor every one** — code-reviewer rejects PR jinak.
4. **`docs/superpowers/specs/2026-05-07-phase-2-5-6-build-plan.md`** — Plán pro Phase 2 + 5 + 6 s 30 tasks, file structure, acceptance criteria, Roman blockers. **Single source of truth pro tuto session a další.**
5. **`workplan.md`** — Phase 0..6 task breakdown, success criteria SC-01..SC-14.
6. **`architecture.md`** — 25 architectural rules AR-01..AR-25, §5.4 Supabase schema, §7.1 LOCKED design tokens, §8 security headers, §10 SEO/AEO architecture.
7. **`security-model.md`** — Threat model, §3.5 Path B definition, §4 attack surface mapping, §6 Phase 0 blockers.
8. **`requirements.md`** — 272 requirements (REQ-F, REQ-NF, REQ-I, REQ-C, REQ-T, REQ-CON, REQ-O, REQ-BD).
9. **`spec.md`** — 41 pages spec, audit page deep-dive §6, Path B invoice flow.
10. **`docs/setup/vendor-setup-checklist.md`** — Master vendor onboarding (10 vendors, ~2.5h Roman click-through). Sequence: DNS → Cookiebot → Sentry → Resend → Turnstile → Upstash → Cal.com → GA4 → DPA signing.
11. **`docs/setup/dns-records.md`** — Paste-ready Namecheap DNS (Vercel apex/www + DKIM/SPF/DMARC + CAA + verification).
12. **`docs/setup/calcom-event-types.md`** — 4 event types Roman musí vytvořit (`tier-1-audit`, `tier-2-audit`, `tier-3-audit`, `free-scoping-call`).
13. **`docs/legal/privacy-policy-cs.md`** + **`cookie-policy-cs.md`** — 6 ROMAN placeholders (IČO, DIČ, sídlo, spisová značka, telefon, poštovní adresa).
14. **`.workforce/parallel-session-status.md`** — Append-only log předchozích session.
15. **`.workforce/alignment-report.md`** + **`validation-report.md`** — Phase 1B.5 cross-checks; PASS-WITH-NOTES.

---

## Roman blockery (24 položek, priority order)

> **Než začneš novou práci, otevři `.workforce/parallel-session-status.md` a podívej se, jestli některý z těchto blockerů byl mezitím uvolněn. Pokud ano, ten odblokovaný úkol je tvůj nejdůležitější next step.**

### Pre-Phase-5 vendor onboarding (Roman akce, devops paste env vars)

1. **RB-01 Cookiebot** — account + 2FA + DPA + `NEXT_PUBLIC_COOKIEBOT_ID`. Blocks: GA4 consent gate, SC-09.
2. **RB-02 Sentry** — account + 2FA + DPA + DSN + auth token. Blocks: error tracking, perf observe.
3. **RB-03 Resend** — account + 2FA + DPA + domain verified + DKIM/SPF/DMARC pasted v Namecheap + 2 API keys (`RESEND_API_KEY_NEWSLETTER`, `RESEND_API_KEY_CONTACT`) + `RESEND_AUDIENCE_ID`. Blocks: contact form delivery, newsletter signup, welcome email.
4. **RB-04 Cloudflare Turnstile** — account + 2FA + DPA + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`. Blocks: oba forms.
5. **RB-05 Upstash Redis** — account + 2FA + DPA + `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. Blocks: rate limiting + booking webhook idempotency.
6. **RB-06 Cal.com** — account + 2FA + DPA + 4 event types + webhook secret + username v `NEXT_PUBLIC_CALCOM_USERNAME`. Blocks: booking widget + webhook.
7. **RB-08 Email forwarding** — Namecheap MX records `*@victaagency.com → l.trung03@gmail.com` per `dns-records.md` §1.3. Blocks: form-delivery validation.
8. **RB-09 GA4 + Search Console** — TXT verification record v Namecheap + GA4 property + measurement ID. Blocks: SC-09 + SC-11.

### Pre-launch content + legal

9. **RB-13 Legal placeholders** v `src/config/site.ts` — IČO, DIČ, sídlo, spisová značka, telefon, poštovní adresa Victa Digital s.r.o. Blocks: privacy policy publish, LocalBusiness schema, footer.
10. **RB-11 Roman copy review** `/cs/spoluprace` audit tier copy + Path B invoice flow.
11. **RB-12 Roman copy review** kontakt page + newsletter welcome email.
12. **RB-14 Czech advokát review** `privacy-policy-cs.md` + `cookie-policy-cs.md`. Blocks: launch.
13. **RB-17 Newsletter lawful basis** — Czech advokát: single opt-in (current code) vs double opt-in pro CZ/SK marketing law. Pokud double opt-in: write migration 002 + `/api/newsletter/confirm` route + token flow.
14. **RB-15 Sentry PII scrubbing** — verify `beforeSend` works na real production errors.

### Pre-launch ops

15. **RB-10 Freshping** uptime monitor account.
16. **RB-16 CSP flip** Report-Only → enforced (po 7 dnech zero violations).
17. **RB-18 DNSSEC** v Namecheap (optional hardening).

### Launch

18. **RB-19 GO-LIVE approval** Roman po Phase 5 done.
19. **RB-20 Walkthrough sign-off** všech 41 pages na production.

### NEW (objevené v session 2026-05-07) — Phase 1.2 vs Phase 2 integrace

20. **RB-21 Booking CTA wiring** — Edit `src/app/[locale]/spoluprace/page.tsx` swap tier card CTAs `<Button href>` → `<BookingCta eventSlug="tier-X-audit" bookingType="audit_tX" sourcePage="/cs/spoluprace">`.
21. **RB-22 Contact form placement** — Roman se rozhodne: (a) přidat `<ContactForm locale="cs" />` jako sekci do `src/app/[locale]/kontakt/page.tsx`, (b) keep direct-channels-only (override spec.md §4.4).
22. **RB-23 Newsletter signup placement** — Edit `src/app/[locale]/page.tsx` (homepage) + `src/app/[locale]/blog/page.tsx` + případně `src/components/footer.tsx` import + render `<NewsletterSignup locale="cs" formLocation="homepage" />`.
23. **RB-24 GA4 events na Phase 1.2 components** — Edit `src/components/locale-switcher.tsx` (fire `locale_switched`) + `src/components/theme-toggle.tsx` (fire `theme_toggled`). Pro `cookie_consent_given/declined`: add window event listener v `Ga4Loader` nebo nový component.

24. **RB-25 (případně NEW)** — pokud Roman zruší / změní jakékoli rozhodnutí (např. zruší Path B), zaznamenat v `decisions.md` a propagovat do dotčeného kódu.

---

## Co NIKDY NEDĚLEJ

1. **Nepřepisuj Phase 1.2 soubory** — `src/components/{nav,footer,theme-toggle,locale-switcher,status-line,button,pricing-card,en-stub}.tsx`, `src/app/[locale]/{layout,page,spoluprace/page,sluzby/page,o-nas/page}.tsx`. Pokud je potřeba upravit, **použij Edit, ne Write**.
2. **Nepřidávej `/api/chat` ani neimport `@anthropic-ai/sdk`** — chatbot je deferred (D-002). Architektura zůstává v `architecture.md` §7 + `chatbot_sessions/messages` tabulky pro post-launch reaktivaci.
3. **Nepřidávej Stripe ani jakýkoli payment processor** — Path B (D-003): faktura + bankovní převod přes Romanův existující účetní program.
4. **Nehackuj design tokens** — `tokens/light.css` + `tokens/dark.css` jsou LOCKED (D-001). Žádné hex literally v komponentách (claude-rules §8) — vždy `var(--*)`.
5. **Žádné secrets v kódu** — `.env*` v `.gitignore`, `.env.example` placeholders only, production secrets POUZE v Vercel env vars.
6. **Žádný `NEXT_PUBLIC_` prefix u secret env vars** — `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY_*`, `UPSTASH_REDIS_REST_TOKEN`, `CALCOM_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY` — server-only. Phase 5.13 grep audit v CI.
7. **Nepřidávej fake testimonials / case studies** — placeholder labels only (spec.md §11).
8. **Nelogovat chatbot message content** ani PII v API routes — only `{ request_id, session_id, status, ... }` (claude-rules §13).
9. **Nepřidávej team page content předem** — `/cs/o-nas/#tym` se buduje **POSLEDNÍ** v Phase 4 (SC-14, claude-rules §14).
10. **Pokud potřebuješ informaci, kterou nemáš, NEPRIDÁVEJ FAKE** — STOP a napiš Roman blocker.

---

## Konvence projektu — quick reference

### Soubory + struktura

- **`src/lib/`** — sdílené utility, server-only (každý exportuje `import 'server-only'`).
- **`src/config/`** — type-safe configy (`as const` literály).
- **`src/components/forms/`** — Client Components (`'use client'`).
- **`src/components/booking/`** — Cal.com integrations.
- **`src/components/seo/`** — JSON-LD + AEO components.
- **`src/components/consent/`** — Cookiebot + GA4 loaders.
- **`src/app/api/<route>/route.ts`** — Vercel Functions (Node.js runtime, region fra1, `dynamic = 'force-dynamic'`, `Cache-Control: no-store`).
- **`src/app/[locale]/<page>/page.tsx`** — Server Components, SSG default, ISR (`revalidate`) jen pokud potřeba.
- **`content/cs/strings/*.json`** — Czech copy (next-intl, accessed via `getTranslations('namespace')`).
- **`content/en/strings/*.json`** — English mirror (zatím minimální).

### Type safety

- **TypeScript strict mode** v `tsconfig.json` (`"strict": true`). No `any`.
- **Supabase `Database` type** v `src/lib/supabase-types.ts` má **konkrétní `Insert` shapes** (ne `Omit<Row,...>`) kvůli `@supabase/postgrest-js` v2.105 `RejectExcessProperties` quirk. Pokud přidáváš novou tabulku, musí mít: `Row`, `Insert` (jako konkrétní object literal), `Update: Partial<Insert>`, `Relationships: []`.
- **Schema definition** musí mít `Views: Record<string, never>`, `Functions: Record<string, never>`, `Enums: Record<string, never>`, `CompositeTypes: Record<string, never>` aby Supabase SDK rozpoznal shape.

### Známé gotchy

- **`src/lib/redis.ts`** používá Proxy pattern pro **lazy init** (build-time safe — neházi pokud env vars chybí; throws při prvním použití). Pokud přidáš nový Upstash-dependent file, použij stejný `redis` export.
- **Supabase `from('table').insert(obj)`** — používej **single object** (ne `[obj]`). Inferenční bug s array overload je vyřešen pomocí concrete Insert types.
- **Cookiebot script** musí být `strategy="afterInteractive"` v App Router (ne `beforeInteractive` — ESLint blokne). `data-blockingmode="auto"` stále funguje.
- **`@sentry/nextjs` 8.55.2** nemá `onRequestError` export — je v 9.x+. `instrumentation.ts` ho neexportuje; pokud potřeba upgrade-it Sentry SDK na 9.x.
- **`lucide-react` 1.14.0** — některé brand ikony (`Linkedin`, atd.) byly v 1.x odstraněny. Pokud Phase 1.2 importuje `Linkedin`, použij `Linkedin2` nebo nahradí inline SVG.
- **`pnpm tsc --noEmit`** musí projít před každým commitem (husky pre-commit hook). Pokud upravuješ `src/app/[locale]/...`, použij quoted bracketed path v `git add`: `git add "src/app/[locale]/..."`.
- **Pre-commit hook** (`lint-staged`) blokne commit pokud ESLint warning. Pro nutné bypass: `git commit --no-verify` (ale ne pro vlastní kód, jen pro third-party / generated soubory).

### Czech typography pravidla (AR-08, REQ-NF-036)

- Czech uvozovky: `„text"` (ne `"text"`)
- Em-dash s mezerami: `text — text` (ne `text - text`)
- Nbsp po jednoznakové předložce: `s` `Praha`, `o` `víkendu`, `v` `pondělí` (`k`, `s`, `v`, `z`, `o`, `u`, `i`, `a`)
- Nbsp před jednotkou: `2 500 Kč`, `50 %`, `30 min`
- Linter: `pnpm lint:cs` — našel 138 porušení v Phase 1.2 contentu, ještě NE CI-gating.

### Brand voice

- **First-person plural** ("my", "navrhneme", "naše"), nikdy "já", nikdy "Roman" jako jediná osoba.
- **VICTA = agentura** s "dvěma týmy" (marketing/content + IT/dev). Pozice: "partner, ne dodavatel".
- **Prozaické, profesionální, ale lidské** — žádný corporate jargon, žádná hyperbole.

---

## Klíčové env vars (úplný seznam je v `.env.example`)

**Server-only (NIKDY `NEXT_PUBLIC_`):**
```
SUPABASE_SERVICE_KEY                    Phase 0 (existing)
UPSTASH_REDIS_REST_URL                  RB-05
UPSTASH_REDIS_REST_TOKEN                RB-05
RESEND_API_KEY_NEWSLETTER               RB-03
RESEND_API_KEY_CONTACT                  RB-03
RESEND_FROM_EMAIL                       RB-03 (default: hello@victaagency.com)
RESEND_AUDIENCE_ID                      RB-03
CONTACT_DESTINATION_EMAIL               RB-03 (default: l.trung03@gmail.com)
CALCOM_WEBHOOK_SECRET                   RB-06
TURNSTILE_SECRET_KEY                    RB-04
SENTRY_DSN                              RB-02
SENTRY_AUTH_TOKEN                       RB-02 (build-time pro source maps)
IP_HASH_SALT                            (replace s random 32-byte hex v prod)
ANTHROPIC_API_KEY                       (deferred — chatbot post-launch)
```

**Public (`NEXT_PUBLIC_*`, OK v client bundle):**
```
NEXT_PUBLIC_SUPABASE_URL                Phase 0
NEXT_PUBLIC_TURNSTILE_SITE_KEY          RB-04
NEXT_PUBLIC_GA4_MEASUREMENT_ID          RB-09
NEXT_PUBLIC_COOKIEBOT_ID                RB-01
NEXT_PUBLIC_SENTRY_DSN                  RB-02
NEXT_PUBLIC_CALCOM_USERNAME             RB-06 (default: victa)
```

---

## Status protokol

Při startu:
1. `git log --oneline -20` — co se stalo od posledního handoffu
2. `git status --short` — co je rozpracované
3. Otevři `.workforce/parallel-session-status.md` — read append-only log
4. Zkontroluj, jestli někdo neudělal commit do `decisions.md` (nový D-007+) — to mění strategii
5. `pnpm tsc --noEmit` — verify clean baseline
6. Pak invoke `superpowers:executing-plans` skill + open plan dokument

Při výstupu:
1. Append do `.workforce/parallel-session-status.md` s timestamp + co jsi udělal + co dále
2. Pokud narazíš na nový blocker, přidej ho jako RB-25, RB-26... do tohoto handoff dokumentu
3. Commit a push (pokud `git status` ukáže staged changes)
4. Pokud vyřešíš RB-XX, zaškrtni ho v tomto handoff dokumentu (nesmaž — nech jako historii)

---

## Pokud nejsou žádné Roman updates a chceš pokračovat

**Doporučená sekvence pro práci bez Roman blockerů:**

### A. Tests (Phase 2.12) — 4-6 hodin práce

```
1. Setup vitest config (vitest.config.ts) — pokud neexistuje
2. src/lib/__tests__/sanitize.test.ts — sanitizeFormString edge cases (HTML, control chars, length, isValidEmail)
3. src/lib/__tests__/rate-limit.test.ts — hashIp determinism, fail-open scenario (mock Redis throws)
4. src/lib/__tests__/schema.test.ts — verify JSON-LD output structure
5. src/app/api/booking-webhook/__tests__/route.test.ts — HMAC verify, replay rejection, idempotency dedupe, body parsing
6. src/app/api/contact/__tests__/route.test.ts — origin reject, validation, turnstile fail (mock fetch), rate-limit, success path
7. src/app/api/newsletter/__tests__/route.test.ts — duplicate email silent dedup (Postgres 23505)
8. e2e/contact-form.spec.ts — fill, submit, see success (need real Turnstile or mock)
9. e2e/newsletter.spec.ts
10. e2e/booking.spec.ts — open Cal.com modal, assert iframe present (or fallback message)
11. e2e/locale-theme.spec.ts — locale switch flow + theme toggle persistence
12. CI workflow .github/workflows/test.yml — runs Vitest + Playwright + axe
```

### B. Lighthouse + a11y (Phase 5.7 + 5.8) — 3-4 hodiny

```
1. .lighthouserc.json (config v plánu Task 5.7 step 1)
2. .github/workflows/lighthouse.yml — runs `pnpm dlx @lhci/cli autorun` proti `pnpm build && pnpm start` localhost
3. e2e/a11y.spec.ts — axe-core scan na 4 key pages × 2 themes = 8 runs, fail na violations
4. Tune until threshold met — image opt, font preload, code split. Document v docs/lighthouse-tuning.md
```

### C. Schema + meta + OG E2E audits (Phase 5.4 + 5.5) — 2-3 hodiny

```
1. e2e/schema-validation.spec.ts — scrape JSON-LD, parse, assert structure on homepage + kontakt + 5 service + 3 industry pages
2. e2e/meta-audit.spec.ts — assert title (50-60), description (120-160), OG, Twitter card on all 41 pages, Set-based unique check
3. docs/schema-validation-report.md + docs/meta-audit-report.md
```

### D. Smoke test CLI (Phase 5.10) — 1 hodina

```
1. scripts/smoke-test.mjs — node CLI: status code, redirect, security headers, sitemap valid XML, llms.txt present
2. docs/smoke-test-checklist.md — manual + automated steps
```

### E. Wiring (RB-21, RB-23, RB-24) pokud Phase 1.2 už neaktivní

```
1. Edit src/app/[locale]/spoluprace/page.tsx — swap tier CTAs to <BookingCta>
2. Edit src/app/[locale]/page.tsx (homepage) — add <NewsletterSignup formLocation="homepage" />
3. Edit src/app/[locale]/blog/page.tsx — add <NewsletterSignup formLocation="blog" />
4. Edit src/components/{locale-switcher,theme-toggle}.tsx — add trackEvent() calls
```

---

## Kontaktní info pro questions / blockery

- **Roman**: l.trung03@gmail.com (deklarováno v `.workforce/intent.md` + `.env.example`).
- **Přístup k Vercel/Supabase/atd.**: Roman owns; pokud potřebuješ paste env vars do Vercel, vytvořt status update + STOP.

---

## Final note

Tento projekt je v dobré kondici. **Phase 0 + Phase 1 + Phase 1.2 + Phase 2 backend + Phase 5 essentials je hotové.** Zbývá: Phase 1.2 ↔ Phase 2 integrace (Edit), tests, Lighthouse/a11y, vendor onboarding (Roman), launch.

**Odhadovaný zbývající práce do launch-ready:** 2–3 dny developer práce + 2–3 dny Roman vendor onboarding + 1–2 dny Phase 4 content review + 1 týden post-launch monitoring.

Hodně štěstí v další session.
