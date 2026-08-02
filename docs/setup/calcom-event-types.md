# Setup: Cal.com — booking event types + webhook

**Last updated**: 2026-05-07
**Owner**: Roman (account + event types) · devops-engineer (webhook + env vars)
**Reference**: `requirements.md` REQ-I-002, REQ-F-032..037, REQ-C-006, REQ-C-013 · `decisions.md` D-003 (Path B invoice flow) · `architecture.md` §3.3, §8.6 · `workplan.md` §0.9

Cal.com is the booking system for VICTA's audit and scoping flows. **Free Cloud tier** (cal.com/your-username) covers all requirements at launch: 4 event types, unlimited bookings, webhook with HMAC signing, Czech locale support, theme matching via Cal Atoms.

---

## 1. Account creation

- [ ] Sign up at https://cal.com — choose username `victa` (preferred — short, brandable; booking URL becomes `cal.com/victa`). Fallback: `victaagency` if `victa` is taken.
- [ ] **Enable 2FA** at Settings → Security → Two-Factor Authentication (TOTP)
- [ ] Settings → General → Time zone → **Europe/Prague**
- [ ] Settings → General → Time format → **24-hour** (Czech market default)
- [ ] Settings → General → First day of week → **Monday**
- [ ] Settings → Calendars → connect Roman's working calendar (Google/Outlook/iCloud) so Cal.com knows when he's busy. Direction: **One-way (read availability)** at minimum; two-way (write events) recommended.
- [ ] Configure availability windows: Settings → Availability → name `Default`, set Roman's working hours (e.g., Mon-Fri 09:00-17:00 Europe/Prague). Add buffer windows around lunch / focus blocks per Roman's preference.
- [ ] **Sign DPA**: Settings → Security → "Sign Data Processing Agreement" (or download from https://cal.com/dpa). Countersign and store PDF in private drive.

---

## 2. Event types — paste-ready Czech configurations

Create 4 event types in Cal.com. For each: Event Types → New → Solo → fill in the fields below exactly. After creation, the slug becomes part of the booking URL: `cal.com/victa/{slug}`.

> **⚠️ Canonical slugs (D-010)**: the slugs below are generated from `src/config/booking.ts` (`CAL_EVENTS`) — the single source of truth shared by the frontend CTAs and the `/api/booking-webhook` tier mapping. If a slug must ever change, change it in that file first and update Cal.com to match; never invent slugs here.

### Event 1 — Tier 1 audit (komplexní podnikový audit)

| Field | Value |
|-------|-------|
| Title | `Tier 1 — Komplexní podnikový audit` |
| Slug (URL) | `tier-1-audit` |
| Description (Czech) | (paste below) |
| Length | `60` minutes |
| Booking frequency | Single |
| Buffer before | `15` min |
| Buffer after | `15` min |
| Minimum notice | `1` day (24 hours) |
| Time slot intervals | `30` min |
| Future booking limit | 60 days into future |

**Description** (paste verbatim — Czech typography applied):

```
První konzultační hovor pro Tier 1 audit (komplexní analýza firmy: web, e-shop, sklad, marketing, AI). Po hovoru obdržíte fakturu na bankovní převod (částka 20 000 – 90 000 Kč podle rozsahu). Po platbě začne kompletní audit (3-4 sezení během 1-3 týdnů, výstup: PDF report + Excalidraw schéma + Figma vizuály + osobní prezentace plánu).
```

**Booking questions** (Event → Advanced → Booking Questions). Add the following custom fields, in order:

| # | Label (Czech) | Type | Required | Placeholder / Options |
|---|---------------|------|----------|------------------------|
| 1 | `Jméno a příjmení` | Short text | Yes | `Jana Nováková` |
| 2 | `E-mail` | Email | Yes | `jana@firma.cz` |
| 3 | `Firma` | Short text | Yes | `Název vaší firmy s.r.o.` |
| 4 | `Telefon` | Phone | No | `+420 ...` |
| 5 | `Webová stránka firmy` | URL | No | `https://...` |
| 6 | `Krátký popis vašeho byznysu / situace` | Long text | Yes | `Pro lepší přípravu — co řešíte, kde tlačí bota?` |
| 7 | `Orientační rozpočet` | Select | No | `do 5 000 €` / `5 000 – 25 000 €` / `25 000 – 100 000 €` / `nad 100 000 €` |

> **Field 7 (P1-09)**: paste the four option labels **exactly as written above** (including the en dash `–`, not a hyphen, and the `€` sign) — `/api/booking-webhook`'s `extractBudgetTier()` (`src/app/api/booking-webhook/route.ts`) matches them against the same enum `contact-schema.ts`'s `budget_tier` field uses (`under_5k` / `5k-25k` / `25k-100k` / `100k+`), so a booking-sourced lead and a contact-form-sourced lead end up comparable in the `leads` table — the primary KPI (vision.md §2) is measured across both channels. If the pasted label doesn't match byte-for-byte, the webhook still stores the raw text rather than dropping it, but it won't roll up into the same enum bucket as contact-form submissions — worth a quick visual diff against this table after creating the field. Field 3 (`Firma`) already exists on every tier event and doubles as the "company" custom field the same P1-09 fix reads (`extractCompany()`) — no new field needed for that half of P1-09.

**Reschedule policy**: Allow rescheduling until **24 hours before** event. Settings within event → Limits → Allow reschedule.

**Cancellation policy**: Allow cancellation until **24 hours before** event. Display cancellation note (Czech):
```
Audit se platí na základě faktury — pokud zrušíte před vystavením faktury, žádné storno poplatky neúčtujeme. Pokud byla faktura už uhrazena, kontaktujte nás na hello@victaagency.com.
```

### Event 2 — Tier 2 audit (doménový audit)

| Field | Value |
|-------|-------|
| Title | `Tier 2 — Doménový audit` |
| Slug | `tier-2-audit` |
| Length | `45` minutes |
| Buffer before / after | `15` min each |
| Minimum notice | `1` day |
| Slot intervals | `30` min |

**Description**:

```
Konzultační hovor pro Tier 2 audit zaměřený na jednu oblast (marketing strategy / e-commerce strategy / AI strategy / atd.). Po hovoru faktura 10 000 – 55 000 Kč. Po platbě audit (2 sezení, pár dní – 2 týdny, výstup stejný jako Tier 1 — PDF report + schémata + osobní prezentace).
```

**Booking questions**: Same 7 fields as Tier 1, including field 7 (`Orientační rozpočet`) — Cal.com lets you duplicate the question set when creating from existing event.

**Reschedule + cancellation**: Same policies as Tier 1.

### Event 3 — Tier 3 audit (strategická session)

| Field | Value |
|-------|-------|
| Title | `Tier 3 — Strategická session` |
| Slug | `tier-3-audit` |
| Length | `30` minutes |
| Buffer before / after | `10` min each |
| Minimum notice | `1` day |
| Slot intervals | `30` min |

**Description**:

```
Konzultační hovor pro Tier 3 strategickou session — jednorázová analýza konkrétního problému. Po hovoru faktura 4 000 – 25 000 Kč. Po platbě 90minutová session + analýza (pár dní – 2 týdny, výstup: krátký plán s konkrétními kroky).
```

**Booking questions**: Same 7 fields as Tier 1/2, including field 7 (`Orientační rozpočet`).

**Reschedule + cancellation**: Same policies as Tier 1.

### Event 4 — Bezplatná konzultace (free 30-min scoping call)

| Field | Value |
|-------|-------|
| Title | `Bezplatná konzultace — modulární služby` |
| Slug | `free-scoping-call` |
| Length | `30` minutes |
| Buffer before / after | `10` min each |
| Minimum notice | `1` day |
| Slot intervals | `30` min |

**Description**:

```
Bezplatný 30minutový hovor pro klienty se specifickou modulární zakázkou (chatbot, integrace, jednorázový vývoj, atd.). Probereme rozsah, dáme vám custom quote a plán execution. Žádný audit, žádný závazek.
```

**Booking questions** (different — shorter, no business-deep-dive needed):

| # | Label (Czech) | Type | Required | Placeholder |
|---|---------------|------|----------|-------------|
| 1 | `Jméno a příjmení` | Short text | Yes | `Jana Nováková` |
| 2 | `E-mail` | Email | Yes | `jana@firma.cz` |
| 3 | `Firma` | Short text | No | (optional — sole traders welcome) |
| 4 | `O jaké službě uvažujete?` | Long text | Yes | `Stručně popište, na co byste se rádi podívali — chatbot? Integrace? Jednorázový vývoj? Něco jiného?` |

**Reschedule + cancellation**: Allow up to 12 hours before (free call — more flexible).

---

## 3. Webhook configuration (architecture.md §8.6, AR-11)

Cal.com → Settings → Developer → Webhooks → New Webhook.

| Field | Value |
|-------|-------|
| Subscriber URL | `https://victaagency.com/api/booking-webhook` |
| Active | ✅ |
| Event Triggers | Select: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED` (3 events) |
| Payload Template | (leave default — Cal.com sends full booking JSON) |
| Secret | Click "Generate" — Cal.com generates a webhook signing secret. **Copy this immediately** — it's shown only once |

**Paste the generated secret into**:
- Vercel UI → Project → Settings → Environment Variables → key `CALCOM_WEBHOOK_SECRET` → value `[generated secret]` → environments: Production + Preview + Development → save
- (Roman: also save a copy in his password manager / private notes — Cal.com won't show it again unless you regenerate, which invalidates existing signed payloads)

**HMAC verification**: The Phase 2 webhook handler (`/api/booking-webhook`) reads `X-Cal-Signature-256` header from incoming requests, computes HMAC-SHA256 of the raw body using `CALCOM_WEBHOOK_SECRET`, and rejects mismatches with HTTP 401. Implementation reference: `architecture.md` §8.6 (paste-ready TypeScript). Replay protection: reject if webhook timestamp > 300 seconds old.

**Phase 2 placeholder behavior**: Until `/api/booking-webhook` is implemented Phase 2, this URL will return 404. Cal.com will retry failed webhooks per their retry policy (5 attempts with exponential backoff). This is acceptable — Cal.com's retry queue will deliver the events once the endpoint exists. To verify webhook setup before Phase 2: use Cal.com's "Send test webhook" button in the webhook settings.

---

## 4. Embed configuration (Phase 2 frontend wiring)

Cal.com offers two embed approaches. **Use Cal Atoms (React components)** — better theme integration, smaller bundle, native dark/light mode follow.

### Phase 2 install command (frontend agent runs this)

```bash
pnpm add @calcom/atoms
```

### Paste-ready embed snippet (Phase 2 audit page)

```tsx
// src/app/[locale]/spoluprace/page.tsx (or whichever route)
"use client";

import { Booker } from "@calcom/atoms";
import { useTheme } from "next-themes";

export function AuditBooker({ slug }: { slug: "tier-1-audit" | "tier-2-audit" | "tier-3-audit" | "free-scoping-call" }) {
  const { resolvedTheme } = useTheme();

  return (
    <Booker
      eventSlug={slug}
      username={process.env.NEXT_PUBLIC_CALCOM_USERNAME!}
      hideBranding={false}
      onCreateBookingSuccess={(booking) => {
        // GA4 conversion event (post-consent only)
        if (window.gtag) {
          window.gtag("event", "booking_created", {
            audit_tier: slug,
            booking_id: booking.id,
          });
        }
      }}
      customClassNames={{
        bookerContainer: "rounded-lg border border-[var(--border-color)]",
      }}
      // Cal Atoms auto-applies dark/light theme based on parent — no explicit theme prop needed
    />
  );
}
```

**Why Cal Atoms over iframe embed**: iframe-based embeds require a `frame-src https://app.cal.com` CSP rule (already in D-006 anyway, but Atoms render natively in our DOM, simpler theme matching, no iframe focus-trap issues for keyboard nav). Atoms also avoid the booking widget appearing in a different visual style than the rest of the site.

---

## 5. Email customization (Czech)

Cal.com → Settings → Workflows → (built-in) → Booking Confirmation. Customize the email Cal.com sends to the visitor after booking. Two options:

**Option A — Edit Cal.com's built-in confirmation email language (preferred, simplest)**

Settings → Profile → Locale → set to **Czech (cs)** — this auto-translates Cal.com's standard emails to Czech.

**Option B — Custom workflow with paste-ready Czech body**

Cal.com → Workflows → New → trigger `WHEN_NEW_EVENT_BOOKED` → action `Send Email to Booker` → customize body:

```
Ahoj {ATTENDEE_NAME},

děkujeme za rezervaci hovoru — {EVENT_NAME}.

📅 Termín: {EVENT_DATE_TIME}
🕒 Délka: {EVENT_DURATION}
🔗 Odkaz na hovor: {MEETING_URL}

Co bude následovat
————————————————————————
1. Setkáme se v daném termínu — krátký úvodní hovor o vašem byznysu
2. Po hovoru vám pošleme fakturu na bankovní převod (cena dle Tieru)
3. Po úhradě začne audit — sezení rozplánujeme společně

Pokud potřebujete termín posunout, použijte odkaz „Přeplánovat" v této pozvánce (do 24 hodin před hovorem).

Těšíme se,
tým VICTA
hello@victaagency.com
```

For the **bezplatná konzultace** (scoping call, Event 4), the email body should NOT mention faktura — replace step 2-3 with:

```
2. Po hovoru vám zašleme stručné shrnutí + custom quote na navrhované řešení
3. Pokud bude zájem, dojednáme si rozsah a začátek prací
```

Roman creates a separate workflow filtered to Event 4 only.

---

## 6. Required env vars

```
CALCOM_WEBHOOK_SECRET             # Server-only, sensitive — webhook HMAC signing key
NEXT_PUBLIC_CALCOM_USERNAME       # Public — used to construct embed URL, e.g., "victa"
```

Add both to Vercel UI → Project → Settings → Environment Variables (all environments).

Note: `.env.example` already has `CALCOM_WEBHOOK_SECRET` placeholder. Add `NEXT_PUBLIC_CALCOM_USERNAME` to `.env.example` in the same Wave 2 commit:

```dotenv
# ── Cal.com (booking webhook) ─────────────────────────────────────────────────
CALCOM_WEBHOOK_SECRET=your-calcom-webhook-secret-here
NEXT_PUBLIC_CALCOM_USERNAME=victa
```

---

## 7. CSP allowance (already in D-006)

D-006 already includes the Cal.com domains:
- `frame-src https://app.cal.com`
- `script-src https://app.cal.com` (when Atoms loads cal-internal scripts)

When CSP enforcement promotes from report-only (Phase 5), these stay. Confirm no new Cal.com subdomain is referenced; if it is, add to CSP via a new `decisions.md` entry per AR-20.

---

## 8. Verification

### Pre-Phase-2 (after event types created, before webhook handler exists)

- [ ] Visit `https://cal.com/victa/tier-1-audit` in private window → page loads → Czech UI strings render → all 7 booking questions visible (including `Orientační rozpočet`, P1-09) → can step through to time selection
- [ ] Same for `tier-2-audit`, `tier-3-audit`, `free-scoping-call`
- [ ] Cal.com → Webhooks → "Send test webhook" → expected: HTTP 404 from `/api/booking-webhook` (route doesn't exist yet); Cal.com queues retries — that's fine

### Post-Phase-2 (after webhook handler implemented)

- [ ] Make a real test booking (Roman's own email) on `tier-3-audit` (cheap-to-cancel) → confirm:
  - Confirmation email arrives in Czech with the correct flow text
  - Webhook fires → HTTP 200 from `/api/booking-webhook` → Cal.com Webhook log shows green
  - Supabase `booking_events` table has new row with `webhook_signature_verified = true`, `audit_tier = 'tier_3'`, `event_type = 'BOOKING_CREATED'`
- [ ] Cancel the test booking → second webhook fires with `event_type = 'BOOKING_CANCELLED'` → Supabase row inserted
- [ ] Verify with `curl -i -X POST https://victaagency.com/api/booking-webhook -d 'tampered=true'` (no signature header) → must return 401 (unauthorized)

---

## 9. When you finish

- [ ] Cal.com account created, 2FA enabled, locale Czech, timezone Europe/Prague
- [ ] All 4 event types created with paste-ready Czech text from §2
- [ ] Webhook configured + secret pasted into Vercel env vars
- [ ] Email templates Czech-localized (Option A or B from §5)
- [ ] DPA signed and stored privately
- [ ] Phase 2 frontend agent has read this doc + has the Atoms snippet from §4
- [ ] Phase 2 backend agent has read this doc + knows the webhook signature scheme + Supabase `booking_events` insert pattern
- [ ] Workplan §0.9 ticked

You're ready for Phase 2 booking widget integration.
