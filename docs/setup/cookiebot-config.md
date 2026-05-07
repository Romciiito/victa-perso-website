# Setup: Cookiebot (CMP) — Czech market

**Last updated**: 2026-05-07
**Owner**: Roman (account creation + 2FA + DPA) · devops-engineer (banner config + script wiring)
**Reference**: `requirements.md` REQ-I-014, REQ-C-003, REQ-C-004, REQ-C-014 · `decisions.md` D-006 · `architecture.md` §8.2 · `workplan.md` §0.8

Cookiebot is the **GDPR-compliant cookie consent CMP** for VICTA. It blocks GA4 (and any future marketing scripts) until the visitor grants consent, integrates with Google Consent Mode v2 (REQ-C-003 mandatory), and supports Czech-language UI (the launch language).

---

## 1. Account creation

- [ ] Sign up at https://www.cookiebot.com — choose Free plan (covers up to 100,000 page views/month, 1 domain). Use Roman's primary work email (`hello@victaagency.com` or his admin email).
- [ ] **Enable 2FA** at Account → Security → Two-Factor Authentication (TOTP via authenticator app, never SMS — AR-14 / D-005)
- [ ] Add managed domain: Manage → Settings → Domains → enter `victaagency.com`. Cookiebot does NOT need DNS changes (CMP is JS-only); domain is a logical association.
- [ ] **Sign DPA**: https://www.cookiebot.com/en/dpa/ — download, countersign with Roman's legal entity name + IČO, retain PDF in private drive (NOT in repo)

---

## 2. Banner configuration (REQ-C-004 — no dark patterns)

Cookiebot Manager → Settings → Banner.

### Banner template choice

- **Template**: choose the variant where **"Accept" and "Decline" buttons are equally prominent** (same size, same color weight, same hierarchy). Cookiebot's default templates `Inline` or `Popup` with the "Accept / Decline / Show details" three-button layout meet REQ-C-004.
- **Reject style**: NOT a tiny grey link. Same visual weight as Accept.
- **Position**: Bottom (recommended) — least disruptive to visitor flow. Don't use "popover middle of screen" — feels intrusive on a B2B agency site.
- **Auto-hide on consent**: ON (banner disappears once visitor decides; reappears via the "Změnit nastavení" footer link)

### Languages

- **Primary language**: **Czech (cs)**
- **Additional language**: English (en) — auto-selected by Cookiebot for `/en` route based on `<html lang>` attribute (Phase 1 frontend will set this per locale)
- **Geo-targeting**: leave OFF — language is selected by the page locale, not visitor IP

### Cookie categories

Cookiebot scans the site and auto-categorizes detected cookies. Configure category visibility:

| Category | Visible to visitor | Default state | Notes |
|----------|--------------------|---------------|-------|
| **Necessary** (Nezbytné) | Yes (locked ON) | Always granted | Cookiebot's own consent cookie + any Cal.com session cookie used for booking flow |
| **Statistics** (Statistické) | Yes | OFF (opt-in) | GA4 — REQ-C-003 |
| **Marketing** (Marketingové) | Yes | OFF (opt-in) | None at launch — but **enable category** to support future ads/retargeting without UI re-config |
| **Preferences** (Preferenční) | Hidden | n/a | Skipped at launch — none in use |

Why enable Marketing even though we don't use it: if Roman adds LinkedIn Insight Tag or Meta Pixel post-launch, the category UI is already there. Otherwise, adding a category later requires re-publishing the cookie policy + re-banner-firing every existing visitor.

### Auto-blocking

- **Cookie auto-blocking**: ON (Cookiebot intercepts script tags before they execute and blocks them until consent matches their category — this is the **GDPR safety net**, REQ-F-097)
- **Manual implementation**: Phase 1 build will additionally use the gtag wrapper in §4 below for explicit Google Consent Mode v2 — auto-blocking is the belt, gtag wrapper is the suspenders.

### Cookie scan

- [ ] Settings → Scan → Add scan URL `https://victaagency.com` and `https://victaagency.com/cs` and `https://victaagency.com/en`
- [ ] Schedule monthly auto-scan
- [ ] Initial scan must run **after** Phase 5 deploy when GA4 is loaded — pre-launch the scan finds zero cookies and is meaningless

---

## 3. Czech UI text (paste-ready)

Cookiebot Manager → Settings → Banner → Texts → Czech (cs). Paste each string exactly as written — Czech typography rules already applied (uvozovky „...", em-dashes —, nbsp after k/s/v/z/o/u/i/a/I).

### Banner intro

**Heading**:
```
Tento web používá cookies
```

**Body paragraph** (friendly Czech B2B tone, partner-not-vendor):
```
Cookies nám pomáhají rozumět tomu, jak náš web používáte, a vylepšovat ho. Některé jsou nezbytné pro chod stránek, další používáme jen tehdy, když nám k tomu dáte souhlas. Vaše rozhodnutí můžete kdykoli změnit v zápatí webu.
```

### Buttons

- **Accept all**: `Přijmout vše`
- **Decline all** (visually equal weight to Accept): `Odmítnout vše`
- **Customize / Show details**: `Změnit nastavení`
- **Save preferences** (in detail view): `Uložit volby`

### Category labels (in detail view)

| Category | Czech label |
|----------|-------------|
| Necessary | `Nezbytné` |
| Statistics | `Statistické` |
| Marketing | `Marketingové` |
| Preferences | `Preferenční` |

### Category descriptions (paste-ready)

**Necessary** (Nezbytné):
```
Tyto cookies jsou nezbytné pro správné fungování webu — bez nich by například nešlo objednat audit přes náš rezervační kalendář. Vždy aktivní.
```

**Statistics** (Statistické):
```
Pomáhají nám pochopit, jak návštěvníci web používají — kolik lidí se kam dostane, kde odejdou, co je zajímá. Data jsou anonymní a slouží jen ke zlepšování webu.
```

**Marketing** (Marketingové):
```
Aktuálně žádné marketingové cookies nepoužíváme. Tato kategorie je připravená pro budoucí využití (např. LinkedIn Insight Tag) — nebude aktivní bez vašeho souhlasu.
```

### Footer "Change settings" link

The Cookiebot script auto-injects a small "renew consent" link via JavaScript. Phase 1 frontend will additionally render an explicit footer link:

```
Změnit nastavení cookies
```

That link triggers `window.Cookiebot.renew()` to re-open the banner. (REQ-F-095 — "consent must be as easy to withdraw as to give".)

---

## 4. Google Consent Mode v2 integration (REQ-C-003 — mandatory)

Cookiebot has a built-in toggle for Consent Mode v2. **Enable it.** Manager → Settings → Banner → Google Consent Mode v2 → toggle ON.

This makes Cookiebot fire the `gtag('consent', 'update', ...)` calls automatically when the visitor changes consent. We additionally ship our own gtag wrapper for the **default-deny** initial state (Cookiebot only handles the update, not the default).

### Phase 1 frontend snippet — paste into `app/layout.tsx` (or `<head>` injection point)

Two pieces, in this exact order:

**A) Default-deny gtag wrapper (loads BEFORE Cookiebot script):**

```tsx
// app/layout.tsx — inside <head>, BEFORE the Cookiebot Script
<Script
  id="gtag-consent-default"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: 500
      });
    `,
  }}
/>
```

**B) Cookiebot loader script:**

```tsx
// app/layout.tsx — inside <head>, AFTER the gtag default-deny block
<Script
  id="Cookiebot"
  src="https://consent.cookiebot.com/uc.js"
  data-cbid={process.env.NEXT_PUBLIC_COOKIEBOT_ID}
  data-blockingmode="auto"
  strategy="beforeInteractive"
/>
```

**C) Optional explicit listener (if Cookiebot's auto-fire doesn't reach gtag for some reason — defensive):**

```tsx
<Script
  id="cookiebot-consent-update"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      window.addEventListener('CookiebotOnAccept', function () {
        if (window.Cookiebot && window.Cookiebot.consent) {
          if (window.Cookiebot.consent.statistics) {
            gtag('consent', 'update', { analytics_storage: 'granted' });
          }
          if (window.Cookiebot.consent.marketing) {
            gtag('consent', 'update', {
              ad_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted'
            });
          }
        }
      });
      window.addEventListener('CookiebotOnDecline', function () {
        gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
      });
    `,
  }}
/>
```

The Cookiebot built-in Consent Mode toggle (Settings → Banner → Google Consent Mode v2) handles the listener automatically, but the explicit version above is a safety net if Cookiebot ever changes their integration.

---

## 5. Required env var

```
NEXT_PUBLIC_COOKIEBOT_ID      # The CBID from Cookiebot dashboard, e.g. "12345678-90ab-cdef-..."
```

Add to:
- Vercel UI → Project → Settings → Environment Variables (all environments: production, preview, development)
- `.env.example` (placeholder value already present per Wave 1 setup)

The CBID is **public-safe** — it's literally embedded in the `<script>` tag served to every visitor's browser. Treat it as not-secret but still environment-scoped (so the dev environment can use a separate Cookiebot test site if Roman wants — optional).

---

## 6. CSP allowance (already documented in D-006)

Cookiebot CDN domains must be in the CSP allowlist. From `decisions.md` D-006, these are already included in the report-only CSP:

- `script-src https://consent.cookiebot.com https://consentcdn.cookiebot.com`
- `img-src https://imgsct.cookiebot.com`
- `connect-src https://consent.cookiebot.com`

When CSP moves from report-only to enforced (Phase 5 — D-006), these stay. No additional config needed in Cookiebot.

---

## 7. Privacy policy / cookie policy link

Cookiebot can auto-generate a cookie policy in Czech. We DON'T use Cookiebot's auto-generated text — we use our own (`docs/legal/cookie-policy-cs.md` already authored Wave 1) because it integrates better with the rest of the legal pages.

In Cookiebot Manager → Settings → Banner → "Show your privacy policy", paste:
```
https://victaagency.com/cs/zasady-pouzivani-cookies/
```

(URL must match the actual cookie policy slug in Phase 4 build.)

---

## 8. Verification (Phase 5 pre-launch)

- [ ] Open `https://victaagency.com` in private window → banner appears within 1 second of page load → Czech text renders correctly (uvozovky display as „..." not "...")
- [ ] Click "Odmítnout vše" → banner closes → check DevTools → Application → Cookies → no GA4 cookies (`_ga*`) present → check Network → no requests to `googletagmanager.com` or `google-analytics.com`
- [ ] Open new private window → click "Přijmout vše" → check Network → GA4 requests fire → check GA4 DebugView (https://analytics.google.com → Admin → DebugView) → `analytics_storage: granted` visible
- [ ] Click footer "Změnit nastavení cookies" link → banner re-opens → toggle Statistics OFF → click "Uložit volby" → check Network → GA4 stops firing on next page nav
- [ ] Switch to `/en` → banner text appears in English
- [ ] Mobile (Chrome iOS, Safari iOS) → banner is fully readable, buttons tap-target ≥ 44px (REQ-NF-013), keyboard navigation works (REQ-NF-016)

---

## 9. When you finish

- [ ] Cookiebot account created, 2FA enabled
- [ ] Domain added, banner configured with Czech UI strings from §3
- [ ] Google Consent Mode v2 toggle enabled in Cookiebot
- [ ] `NEXT_PUBLIC_COOKIEBOT_ID` pasted into Vercel env vars
- [ ] DPA signed and stored privately
- [ ] Phase 1 frontend agent has read this doc + has the snippets from §4 to install in `app/layout.tsx`
- [ ] Workplan §0.8 ticked

You're ready for Phase 1 build of the consent infrastructure.
