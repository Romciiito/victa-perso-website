# Setup: Cloudflare Turnstile — bot defense for forms

**Last updated**: 2026-05-07
**Owner**: Roman (account creation + 2FA + DPA) · devops-engineer (site config + env vars) · Phase 2 backend (server verification)
**Reference**: `requirements.md` REQ-I-021, REQ-F-045, REQ-F-055 · `decisions.md` D-006 · `architecture.md` §8.5 · `security-model.md` §4.3, §4.4 · `workplan.md` §0.2, §0.7

Cloudflare Turnstile is the **bot defense layer** for VICTA's contact form (REQ-F-045) and newsletter signup (REQ-F-055). Replaces hCaptcha/reCAPTCHA with privacy-friendly invisible challenges. **Free + unlimited usage**. No cookies, no fingerprinting (REQ-I-021). GDPR-friendly out of the box.

Pairs with Upstash rate limiting (already documented elsewhere) as a two-layer defense: **Turnstile = bot detection at form load**, **Upstash rate limit = abuse throttling at submission**. Both checks must pass for a submission to be accepted.

---

## 1. Account creation

- [ ] Sign up at Cloudflare https://dash.cloudflare.com (free account — Turnstile does NOT require Cloudflare-proxied DNS, so adding Cloudflare here has zero impact on the Namecheap-hosted DNS for `victaagency.com`)
- [ ] **Enable 2FA** at Profile → Authentication → Two-Factor Authentication (TOTP via authenticator)
- [ ] **Sign DPA**: the Cloudflare Customer DPA is a self-execute document at https://www.cloudflare.com/cloudflare-customer-dpa/ — no signature page; acceptance is recorded by using the service. For audit retention, download the PDF version from the URL above and store in Roman's private drive with note "Auto-applied via service usage 2026-05-07".

---

## 2. Turnstile site configuration

Cloudflare dashboard → Turnstile → Add Site.

| Field | Value |
|-------|-------|
| Site name | `VICTA marketing` |
| Domain (production) | `victaagency.com` |
| Domain (preview) | `*.vercel.app` |
| Widget mode | **Managed** (recommended — Cloudflare auto-decides invisible vs interactive challenge based on risk signals) |
| Pre-clearance | **Enabled** (one challenge unlocks multiple form submissions in same session — better UX) |

**Why two domain entries**: Turnstile rejects tokens generated for non-allowlisted hostnames. Production runs on `victaagency.com`; preview deploys run on Vercel-generated URLs like `victa-website-git-feature-x.vercel.app`. Allowlisting `*.vercel.app` covers all preview environments.

**Why Managed mode** (not Invisible or Non-Interactive Visible):
- **Invisible** is the most user-friendly but offers Cloudflare less signal — bots that pass invisible mode are increasingly common
- **Non-Interactive Visible** always shows a checkbox even for legitimate users — UX friction
- **Managed** = Cloudflare's risk engine picks per-request: silent for clean visitors, interactive challenge for suspicious ones. Best balance.

**Why pre-clearance ON**: A visitor who submits the contact form, then later submits the newsletter signup, doesn't get re-challenged. Reduces friction without weakening security.

After site creation, Cloudflare displays:
- **Site key** (public, OK in client bundle): copy → Vercel env var `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **Secret key** (server-only): copy → Vercel env var `TURNSTILE_SECRET_KEY`

---

## 3. Required env vars

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY    # Public — embedded in client widget HTML
TURNSTILE_SECRET_KEY              # Server-only, sensitive — used only in Vercel Function for token verification
```

Both already in `.env.example` per Wave 1 setup. Paste real values into Vercel UI → Project → Settings → Environment Variables (all environments: Production + Preview + Development).

**Important**: Do NOT use the same site key/secret pair across production and preview if you want stricter separation. For launch, the same pair is acceptable since `*.vercel.app` is allowlisted. Post-launch, consider creating a separate Turnstile site (with separate keys) for preview-only use.

---

## 4. Phase 2 client component (paste-ready)

Phase 2 backend agent installs the React widget on contact form (REQ-F-045) and newsletter signup (REQ-F-055).

### Install

```bash
pnpm add react-turnstile
```

### Usage in a form component

```tsx
// src/components/forms/ContactForm.tsx (Phase 2 build)
"use client";

import { useState } from "react";
import Turnstile from "react-turnstile";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";

export function ContactForm() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const locale = useLocale(); // 'cs' | 'en'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!turnstileToken) {
      // Block submission until Turnstile resolves
      // (UI disables submit button while token is null — see template below)
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("turnstile_token", turnstileToken);

    const res = await fetch("/api/contact", {
      method: "POST",
      body: formData,
    });
    // ... handle response
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}

      <Turnstile
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
        onError={() => setTurnstileToken(null)}
        options={{
          theme: resolvedTheme === "dark" ? "dark" : "light",
          language: locale === "cs" ? "cs" : "en",
          size: "flexible",
        }}
      />

      <button type="submit" disabled={!turnstileToken}>
        Odeslat
      </button>
    </form>
  );
}
```

**Theme matching**: `theme` option follows the site's resolved theme — the widget visually integrates with light/dark mode (REQ-F-073 alignment).

**Language**: Turnstile supports Czech (`cs`) — the challenge prompt translates if shown.

**Size flexible**: widget adapts to container width (recommended for VICTA's responsive forms).

---

## 5. Phase 2 server-side verification (paste-ready)

Phase 2 backend agent implements server-side token verification in `/api/contact` and `/api/newsletter` Vercel Functions.

```ts
// src/lib/turnstile.ts (Phase 2 build)

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verify a Turnstile token server-side.
 * Returns true if token is valid, false otherwise.
 * Throws no errors — failure modes return false (caller decides response).
 */
export async function verifyTurnstile(
  token: string,
  ip: string | undefined
): Promise<boolean> {
  if (!token || token.length < 10) return false;

  const formData = new FormData();
  formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      // Turnstile responds in <200ms typically; 5s is plenty
      signal: AbortSignal.timeout(5000),
    });

    if (!result.ok) {
      // Cloudflare API error — fail open or closed?
      // Per security-model.md §4.3: forms fail open (rate limiter is fail-closed instead)
      // Return false here means submission rejected — re-evaluate based on security review
      return false;
    }

    const outcome = (await result.json()) as TurnstileVerifyResponse;
    return outcome.success === true;
  } catch (error) {
    // Network timeout or other error
    // Log to Sentry (without token — it may be reusable for replay)
    console.error("Turnstile verify failed");
    return false;
  }
}
```

### Calling pattern in a Vercel Function

```ts
// src/app/api/contact/route.ts (Phase 2 build)
import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Get client IP (Vercel forwards via x-forwarded-for)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim();

  // 1. Parse form data
  const formData = await req.formData();
  const turnstileToken = formData.get("turnstile_token")?.toString();

  if (!turnstileToken) {
    return NextResponse.json({ error: "Missing security check" }, { status: 400 });
  }

  // 2. Verify Turnstile token
  const turnstileValid = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileValid) {
    return NextResponse.json({ error: "Security check failed" }, { status: 403 });
  }

  // 3. Rate limit (Upstash)
  const rateLimitResult = await rateLimit(`contact:${ip}`, { limit: 5, window: 600 });
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 4. Honeypot check + sanitization + validation
  // ... (see security-model.md §4.3)

  // 5. Insert into Supabase + send via Resend
  // ...

  return NextResponse.json({ success: true });
}
```

**Two-layer defense**: Turnstile blocks bots at the widget; Upstash rate-limits any submissions that get past Turnstile. Both must pass.

---

## 6. CSP allowance (already in D-006)

D-006 includes:
- `script-src https://challenges.cloudflare.com` (Turnstile widget JS)
- `frame-src https://challenges.cloudflare.com` (interactive challenge iframe when shown)

Both stay when CSP enforcement promotes from report-only Phase 5. No additional CSP config needed.

---

## 7. Czech UX strings (paste-ready)

When Turnstile fails verification, the form shows an error. Czech strings for use in Phase 2 forms:

| Scenario | Czech UI string |
|----------|----------------|
| Token missing (form submitted without widget loading) | `Bezpečnostní kontrola nedoběhla. Zkuste prosím znovu načíst stránku.` |
| Token verification failed (server-side `success=false`) | `Bezpečnostní kontrola se nezdařila. Pokud problém přetrvává, kontaktujte nás na hello@victaagency.com.` |
| Network error during verification | `Něco se pokazilo na naší straně. Zkuste prosím za chvíli znovu, případně nám napište přímo.` |

---

## 8. Verification

### Pre-Phase-2 (after site config exists, before forms ship)

- [ ] Cloudflare Turnstile dashboard → site shows status "Active"
- [ ] Use Cloudflare's test page (https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/widget) with the production site key — confirm widget loads correctly

### Post-Phase-2 (after forms shipped)

- [ ] Visit `https://victaagency.com/cs/kontakt` → fill form fields → confirm Turnstile widget renders (visible or invisible depending on Managed mode decision) → confirm form submission succeeds
- [ ] Try submitting with empty Turnstile token (use DevTools to delete the hidden `turnstile_token` input value before submit) → confirm server returns 400 / 403
- [ ] Use a known bot UA + headless browser (e.g., raw `curl` POST to `/api/contact`) without Turnstile token → confirm 403
- [ ] Inspect Cloudflare Turnstile dashboard → Analytics → confirm legitimate submissions show as "Solved" and bot attempts (if any) show as "Challenged" or "Blocked"

---

## 9. When you finish

- [ ] Cloudflare account created, 2FA enabled
- [ ] Turnstile site created with production + preview domains
- [ ] Site key + secret key pasted into Vercel env vars
- [ ] DPA accepted (and PDF retained)
- [ ] Phase 2 backend agent has read this doc + has paste-ready snippets from §4-§5
- [ ] Workplan §0.2 line "Create Cloudflare Turnstile site" ticked
- [ ] Workplan §0.7 form security section linked

You're ready for Phase 2 form integration with bot defense in place.
