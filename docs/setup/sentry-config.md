# Setup: Sentry — error tracking + PII scrubbing

**Last updated**: 2026-05-07
**Owner**: Roman (account creation + 2FA + DPA) · devops-engineer (project + DSN + scrubbing config)
**Reference**: `requirements.md` REQ-I-008, REQ-NF-046, REQ-O-013 · `architecture.md` §8.7, §11.1 · `security-model.md` §4.8 · `workplan.md` §0.2

Sentry is the **error tracking + performance monitoring** platform for VICTA. Captures exceptions from both client (browser) and server (Vercel Functions). Free **Developer tier**: 5,000 errors/month + 10,000 performance events/month + 50 replays/month — sufficient for launch traffic.

**Critical**: REQ-NF-046 + security-model.md §4.8 require **PII scrubbing in `beforeSend`**. Sentry is the highest-risk observability vendor for accidental PII leakage (a stack trace can include form field values, query strings with email tokens, or even Supabase service keys captured from `process.env`). The `beforeSend` hooks in §4 below are mandatory before any deploy.

---

## 1. Account creation

- [ ] Sign up at https://sentry.io — choose Developer plan (free)
- [ ] **Enable 2FA** at User Settings → Security → Two-Factor Authentication (TOTP)
- [ ] Create organization slug: `victa` (or Roman's preferred slug — used in DSN URL and source-map upload paths)
- [ ] **Sign DPA**: Settings → Legal & Compliance → Data Processing Agreement → review & accept (Sentry's DPA is self-execute, included in account terms)

---

## 2. Project creation

- [ ] Projects → Create Project
  - Platform: **Next.js**
  - Project name: `victa-website`
  - Default alert rule: **"Alert me on every new issue"** (changes can be tuned post-launch)
  - Team: leave default (just Roman)
- [ ] After creation, copy the values shown:
  - **DSN**: `https://[hash]@o[orgId].ingest.sentry.io/[projectId]` — from Settings → Projects → victa-website → Client Keys (DSN)
  - **Org slug**: `victa` (from URL bar: `sentry.io/settings/victa/...`)
  - **Project slug**: `victa-website`

### Auth token (for source-map upload during build)

- [ ] User Settings → Account → API → Auth Tokens → Create New Token
- [ ] Scopes (minimum): `project:releases`, `project:read`, `org:read`
- [ ] Token name: `victa-vercel-build`
- [ ] **Copy the token immediately** (shown only once)

---

## 3. Required env vars

```
SENTRY_DSN                    # Server-side DSN — treat as sensitive (Sentry events may contain PII server-side)
NEXT_PUBLIC_SENTRY_DSN        # Client-side DSN — same value, public-safe by Sentry's design but treat as sensitive
SENTRY_AUTH_TOKEN             # Sensitive — for source-map upload; never client-bundled
SENTRY_ORG                    # Org slug, e.g., "victa"
SENTRY_PROJECT                # Project slug, e.g., "victa-website"
```

**Note**: Sentry's public DSN is technically designed to be public (it identifies the project, not the org). However, exposing it does enable a malicious actor to spam-send events to your project, eating into the 5K/month quota. We treat both DSNs as sensitive.

Add to:
- Vercel UI → Project → Settings → Environment Variables (all environments)
- `.env.example` (both DSN placeholders already present per Wave 1 setup; add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in same Wave 2 commit):

```dotenv
# ── Sentry ────────────────────────────────────────────────────────────────────
SENTRY_DSN=https://your-sentry-dsn-here
NEXT_PUBLIC_SENTRY_DSN=https://your-public-sentry-dsn-here
SENTRY_AUTH_TOKEN=your-sentry-auth-token-here
SENTRY_ORG=victa
SENTRY_PROJECT=victa-website
```

---

## 4. PII scrubbing config (REQ-NF-046 — mandatory before any deploy)

These config files MUST be installed before the first preview deploy that captures real errors. Phase 1 frontend agent installs them as part of §1.1 project scaffold.

### `sentry.client.config.ts` — paste-ready

```ts
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — keep low to stay under free tier
  tracesSampleRate: 0.1,

  // Environment from Vercel system env var
  environment: process.env.VERCEL_ENV ?? "development",

  // Release tracking — git SHA from Vercel
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // PII scrubbing (REQ-NF-046, security-model.md §4.8)
  beforeSend(event, hint) {
    // Strip request body (may contain form data — emails, names, messages)
    if (event.request?.data) {
      event.request.data = "[REDACTED]";
    }

    // Strip cookies (may contain Cookiebot consent state, session tokens)
    if (event.request?.cookies) {
      event.request.cookies = "[REDACTED]";
    }

    // Strip query strings that may leak email tokens / UTM-PII
    if (event.request?.query_string) {
      const qs = event.request.query_string;
      event.request.query_string = (typeof qs === "string" ? qs : String(qs))
        .replace(/email=[^&]*/gi, "email=[REDACTED]")
        .replace(/token=[^&]*/gi, "token=[REDACTED]")
        .replace(/api_key=[^&]*/gi, "api_key=[REDACTED]");
    }

    // Strip user context email + IP (we set neither, but defensive)
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }

    // Strip extra contexts that may contain PII or partial state
    if (event.contexts?.state) {
      event.contexts.state = { type: "[REDACTED]", value: "[REDACTED]" };
    }

    return event;
  },

  // Reduce noise: ignore harmless or user-side errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "Network request failed", // user offline / network blocked extensions
    /^Loading chunk \d+ failed/, // hydration/code-split errors usually transient
    "AbortError", // cancelled fetch requests
  ],

  // Don't track common bot/crawler errors
  denyUrls: [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^safari-extension:\/\//,
  ],
});
```

### `sentry.server.config.ts` — paste-ready

```ts
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Lower than client — server traces are more expensive
  tracesSampleRate: 0.05,

  environment: process.env.VERCEL_ENV ?? "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  beforeSend(event, hint) {
    // Same scrubbing as client
    if (event.request?.data) event.request.data = "[REDACTED]";
    if (event.request?.cookies) event.request.cookies = "[REDACTED]";
    if (event.request?.headers) {
      // Drop auth/cookie headers explicitly (Sentry usually strips these but defensive)
      const safeHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(event.request.headers as Record<string, string>)) {
        const lc = key.toLowerCase();
        if (lc === "authorization" || lc === "cookie" || lc === "x-api-key" || lc.startsWith("x-supabase")) {
          safeHeaders[key] = "[REDACTED]";
        } else {
          safeHeaders[key] = value;
        }
      }
      event.request.headers = safeHeaders;
    }

    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }

    // Critical: catch accidental Supabase service-key or Anthropic key in event context
    // Both keys begin with eyJ (JWT-style — Supabase) or sk- (Anthropic)
    if (event.contexts) {
      Object.keys(event.contexts).forEach((key) => {
        const ctx = event.contexts![key];
        if (typeof ctx === "string") {
          if (ctx.includes("eyJ") || ctx.includes("sk-ant-") || ctx.includes("sk-")) {
            event.contexts![key] = "[POSSIBLE_KEY_REDACTED]" as any;
          }
        } else if (typeof ctx === "object" && ctx !== null) {
          // Recursively scan one level deep for stringified keys
          for (const subKey of Object.keys(ctx)) {
            const subVal = (ctx as Record<string, unknown>)[subKey];
            if (typeof subVal === "string" && (subVal.includes("eyJ") || subVal.includes("sk-ant-"))) {
              (ctx as Record<string, unknown>)[subKey] = "[POSSIBLE_KEY_REDACTED]";
            }
          }
        }
      });
    }

    // Strip extra payload that may contain raw form fields
    if (event.extra) {
      delete event.extra.body;
      delete event.extra.formData;
      delete event.extra.payload;
    }

    return event;
  },

  ignoreErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "Vercel Function timeout", // these are infrastructure-level, not actionable as bugs
  ],
});
```

### `sentry.edge.config.ts` — paste-ready (for middleware + edge functions)

```ts
// sentry.edge.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.05,
  environment: process.env.VERCEL_ENV ?? "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  beforeSend(event) {
    // Edge runtime is mostly i18n middleware — minimal data flows here, but still scrub defensively
    if (event.request?.cookies) event.request.cookies = "[REDACTED]";
    if (event.request?.query_string) {
      const qs = event.request.query_string;
      event.request.query_string = (typeof qs === "string" ? qs : String(qs))
        .replace(/email=[^&]*/gi, "email=[REDACTED]")
        .replace(/token=[^&]*/gi, "token=[REDACTED]");
    }
    return event;
  },
});
```

### `next.config.js` Sentry wrapper

The `@sentry/nextjs` SDK injects build-time config via `withSentryConfig`. Paste:

```js
// next.config.js (or next.config.mjs)
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // ... existing Next.js config ...
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress source-map upload warnings during local dev (no auth token there)
  silent: !process.env.CI,

  // Upload source maps for production deploys only
  widenClientFileUpload: true,
  hideSourceMaps: true, // don't expose source maps publicly (security: hide internals)
  disableLogger: true, // remove Sentry's own console logs from prod
});
```

---

## 5. Phase 1 install commands

Phase 1 frontend agent runs these (after `pnpm install` completes for the scaffold):

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs --skip-connect
```

Wizard prompts:
- "Are you using Sentry SaaS or self-hosted?" → SaaS
- DSN → paste from §2 above
- "Want example error code?" → No (we have our own)
- The wizard creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and a `next.config.js` wrapper. **Replace the wizard-generated content with the paste-ready versions in §4** — the wizard's defaults do NOT include PII scrubbing, which is mandatory.

---

## 6. Alert rules (Sentry dashboard)

Sentry → Alerts → Create Alert. Recommended ruleset:

| Name | Condition | Action |
|------|-----------|--------|
| **P1: error spike** | > 10 errors in 5 minutes | Email Roman immediately |
| **P2: new issue type** | New issue grouping created | Email Roman within 1 hour |
| **P3: weekly digest** | Schedule | Email Roman every Monday 09:00 Europe/Prague |

(Match `devops-engineer.md` "Monitoring" section — these alert rules are the canonical set.)

---

## 7. Performance monitoring

`tracesSampleRate: 0.1` (client) + `0.05` (server) means 10% / 5% of transactions are sampled. At expected launch traffic (~5K visits/month), this stays comfortably under the 10K performance events/month free quota.

Increase rates only if issues arise that need higher sampling for diagnosis. Decrease if free tier quota gets hit.

---

## 8. CSP allowance (already in D-006)

D-006 includes `connect-src https://*.sentry.io` for Sentry event reporting. No additional CSP config needed.

Sentry's CDN script (for Replay feature, if enabled later) would need `script-src https://js.sentry-cdn.com` — not required at launch since we don't use Replay (50 replay/month free quota is too tight + has its own PII concerns).

---

## 9. Verification (Phase 1 first-deploy)

- [ ] After Phase 1 first deploy, intentionally throw an error from a test page → confirm event arrives in Sentry dashboard within 30 seconds
- [ ] Inspect the event in Sentry → Issues → click event → "Request" tab → confirm:
  - `data` field shows `[REDACTED]` (not raw form payload)
  - `cookies` field shows `[REDACTED]`
  - `headers` shows `[REDACTED]` for any auth/cookie/x-api-key
  - User email/IP NOT present
- [ ] Trigger a server-side error (e.g., from a test API route) → confirm event arrives → confirm same scrubbing
- [ ] Test `event.contexts` scrubbing: throw an error from a Vercel Function that has `process.env.SUPABASE_SERVICE_KEY` in scope → manually inspect event → confirm no `eyJ...` substring leaked
- [ ] Verify source-map symbolication: stack traces show original source file names (e.g., `app/page.tsx:42`) not minified bundle names — confirms `SENTRY_AUTH_TOKEN` upload working

---

## 10. When you finish

- [ ] Sentry account created, 2FA enabled
- [ ] Project `victa-website` created
- [ ] DSN, auth token, org slug, project slug pasted into Vercel env vars
- [ ] DPA signed
- [ ] Alert rules configured per §6
- [ ] Phase 1 frontend agent has read this doc + has the paste-ready configs from §4
- [ ] First deploy verified PII scrubbing per §9
- [ ] Workplan §0.2 line "Create Sentry project" ticked

You're ready for Phase 1 first deploy with error tracking active.
