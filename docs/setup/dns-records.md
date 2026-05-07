# Setup: Namecheap DNS records

**Last updated**: 2026-05-07
**Owner**: Roman (account access + record changes) · devops-engineer (verification)
**Reference**: `requirements.md` REQ-I-006, REQ-O-003 · `decisions.md` D-005 · `workplan.md` §0.4 · `architecture.md` §8.7

This is the **paste-ready DNS configuration** for both `victaagency.com` (primary) and `victa.agency` (redirect target). Apply records in Namecheap → Domain List → Manage → Advanced DNS.

---

## Pre-flight (REQ-O-003 — non-negotiable)

**Before changing a single record**, export the current zone for both domains:

- [ ] Namecheap → `victaagency.com` → Advanced DNS → take a full screenshot/copy of every record currently set
- [ ] Save to `dns-backup/victaagency.com-2026-05-07.txt` (one record per line, format `TYPE  HOST  VALUE  TTL`)
- [ ] Same for `victa.agency` → save to `dns-backup/victa.agency-2026-05-07.txt`
- [ ] `git add dns-backup/ && git commit -m "Pre-Wave-2 DNS zone snapshot"`

Without this snapshot, an accidentally clobbered record may be unrecoverable. Namecheap does not version zone files.

---

## 1. Records for `victaagency.com`

Apply these in Namecheap → Domain List → `victaagency.com` → Advanced DNS. Existing parking/default records (the Namecheap CPanel placeholder, redirect to namecheap.com, etc.) should be **deleted** before adding the records below.

### 1.1 Vercel apex + www routing

Vercel recommends an `ALIAS`/`ANAME` (CNAME at apex) where supported, with an A-record fallback. Namecheap supports `ALIAS`-style records via their "ALIAS Record" type in Advanced DNS. If `ALIAS` is unavailable in Roman's Namecheap UI for any reason, fall back to the A record.

| Type | Host | Value | TTL | Notes |
|------|------|-------|-----|-------|
| ALIAS Record | `@` | `cname.vercel-dns.com.` | Automatic | Preferred — apex CNAME |
| A Record | `@` | `76.76.21.21` | Automatic | **Fallback** — only if ALIAS isn't available; remove ALIAS if A is used (don't keep both) |
| CNAME Record | `www` | `cname.vercel-dns.com.` | Automatic | Sends www → Vercel; Vercel project should redirect www → apex |

Vercel project settings: in Vercel → Project → Settings → Domains, add **both** `victaagency.com` and `www.victaagency.com`. Set the primary to `victaagency.com` so `www` 301s to the apex.

### 1.2 Resend email authentication (DKIM + SPF + DMARC)

Resend assigns 3 unique DKIM CNAME records to the domain. Roman copies these from Resend dashboard → Domains → victaagency.com → DNS records (visible immediately after adding the domain in Resend, before verification completes).

| Type | Host | Value | TTL | Notes |
|------|------|-------|-----|-------|
| CNAME Record | `[ROMAN: paste DKIM selector 1 from Resend, e.g., `resend._domainkey`]` | `[ROMAN: paste DKIM target 1 from Resend]` | Automatic | DKIM signing key 1 |
| CNAME Record | `[ROMAN: paste DKIM selector 2 from Resend]` | `[ROMAN: paste DKIM target 2 from Resend]` | Automatic | DKIM signing key 2 |
| CNAME Record | `[ROMAN: paste DKIM selector 3 from Resend]` | `[ROMAN: paste DKIM target 3 from Resend]` | Automatic | DKIM signing key 3 |
| TXT Record | `@` (or `send`, depending on Resend's instructions) | `v=spf1 include:_spf.resend.com ~all` | Automatic | SPF — authorizes Resend to send on the domain's behalf |
| TXT Record | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@victaagency.com; pct=100; aspf=r; adkim=r;` | Automatic | DMARC — start with `quarantine`; escalate to `reject` after 30 days of clean reports |

**DMARC escalation plan**: After Resend is live and 30 days of `rua` reports show no unauthorized senders, change `p=quarantine` to `p=reject`. Track this as a post-launch task.

**SPF host note**: Some Namecheap accounts use `@` for apex TXT, others require leaving Host empty. Use whatever Namecheap's UI says is "the apex/root record" for TXT — they're equivalent.

**DMARC mailbox**: `dmarc@victaagency.com` is a placeholder address. Roman can either:
- Set up a forward in his email provider so DMARC reports land in his inbox, or
- Use a free DMARC report aggregator like Postmark DMARC Digests (https://dmarc.postmarkapp.com) — change `rua=mailto:` to the address they provide.

### 1.3 MX records (email receiving)

`hello@victaagency.com` is the From address (workplan brief). Roman needs a real mailbox to **receive** replies. Pick one of:

**Option A — Forward via existing email provider (simplest)**
- [ROMAN: paste your MX records from your existing provider, e.g., Gmail / Seznam / Zoho]
- Set up a forwarding rule on the existing mailbox: `hello@victaagency.com` → Roman's primary inbox

**Option B — Resend Inbound (advanced — only if you want webhook-based reply handling)**
- Not recommended for launch (over-engineered for low reply volume)

**Option C — Google Workspace / Fastmail / Proton (paid, full mailbox at the domain)**
- Roman creates account at chosen provider, follows their MX setup wizard

`[ROMAN: choose email provider]` — fill in MX records for chosen option. Without MX records, replies to outbound emails will bounce.

### 1.4 CAA records (certificate authority hardening)

CAA restricts which certificate authorities are allowed to issue TLS certs for the domain. Vercel uses Let's Encrypt; Comodo (now Sectigo) is included as a backup CA Vercel may rotate to. This blocks any other CA from issuing a cert even if an attacker compromises a CA upstream.

| Type | Host | Value | TTL | Notes |
|------|------|-------|-----|-------|
| CAA Record | `@` | `0 issue "letsencrypt.org"` | Automatic | Allow Let's Encrypt |
| CAA Record | `@` | `0 issue "comodoca.com"` | Automatic | Allow Sectigo/Comodo |
| CAA Record | `@` | `0 iodef "mailto:security@victaagency.com"` | Automatic | Optional — receive notifications of CAA violations |

**Namecheap CAA flag/tag formatting note**: Namecheap's Advanced DNS UI splits CAA records into separate fields (Flag, Tag, Value). The values above translate to:
- Flag: `0`
- Tag: `issue`
- Value: `letsencrypt.org` (or `comodoca.com`, or for iodef: `mailto:security@victaagency.com` and Tag: `iodef`)

### 1.5 Verification records (Vercel + Google Search Console)

| Type | Host | Value | TTL | Notes |
|------|------|-------|-----|-------|
| TXT Record | `_vercel` | `[ROMAN: Vercel will provide this when you add the domain — copy from Project → Domains → Verification value]` | Automatic | Confirms domain ownership to Vercel |
| TXT Record | `@` | `[ROMAN: Google Search Console will provide a TXT value, format `google-site-verification=...`]` | Automatic | Confirms Search Console ownership |

Multiple TXT records on `@` (apex) are valid — DNS allows many TXT records per host. Don't try to combine them.

---

## 2. Records for `victa.agency` (301 redirect target)

`victa.agency` is the legacy domain. Visitors typing it must land on `https://victaagency.com/{same path}`. Recommended approach: use Vercel as the redirect engine (auto-HTTPS, instant propagation, easy to change).

### 2.1 Recommended: Vercel-based redirect

Step-by-step:

- [ ] In Vercel project → Settings → Domains → Add `victa.agency` (and `www.victa.agency`)
- [ ] Vercel will request DNS verification — apply the records below in Namecheap
- [ ] Once verified, in Vercel → Domains → `victa.agency` → click "Edit" → choose "Redirect to" → enter `victaagency.com` → status code `301 Permanent` → preserve path & query string `Yes`
- [ ] Repeat for `www.victa.agency` (if Vercel doesn't auto-cover it via the apex setting)

| Type | Host | Value | TTL | Notes |
|------|------|-------|-----|-------|
| ALIAS Record | `@` | `cname.vercel-dns.com.` | Automatic | Preferred at apex |
| A Record | `@` | `76.76.21.21` | Automatic | Fallback if ALIAS unavailable |
| CNAME Record | `www` | `cname.vercel-dns.com.` | Automatic | www → Vercel |
| TXT Record | `_vercel` | `[ROMAN: Vercel will provide this verification value]` | Automatic | Vercel ownership |

### 2.2 Alternative: Namecheap URL Forwarding (not recommended)

Namecheap offers a "URL Redirect Record" type that 301s at the registrar level. This works but:
- Slower SSL provisioning (Namecheap doesn't auto-issue HTTPS for redirects on free DNS)
- No edge caching on the redirect itself
- Harder to change later

Use only if Vercel-based redirect can't be configured for some reason.

---

## 3. Verification (after 30 minutes — DNS propagation time)

### 3.1 Check apex resolves to Vercel

```bash
dig victaagency.com +short
# Expected: list of Vercel anycast IPs (e.g., 76.76.21.21 or similar)

dig www.victaagency.com +short
# Expected: cname.vercel-dns.com. then a Vercel IP
```

### 3.2 Check Resend DKIM / SPF / DMARC

```bash
dig TXT victaagency.com +short
# Expected: SPF record visible: "v=spf1 include:_spf.resend.com ~all"

dig TXT _dmarc.victaagency.com +short
# Expected: "v=DMARC1; p=quarantine; rua=..."

# Resend's domain status will switch from "Pending" to "Verified" automatically after DKIM+SPF+DMARC all resolve.
```

### 3.3 MXtoolbox visual checks

Open https://mxtoolbox.com/SuperTool.aspx and run:
- `victaagency.com` → MX Lookup → confirms email receiving setup
- `victaagency.com` → SPF Record Lookup → confirms SPF syntax + Resend include
- `victaagency.com` → DMARC Lookup → confirms DMARC policy
- `victaagency.com` → DKIM Lookup → enter selector from Resend (e.g., `resend`) → confirms DKIM key published

### 3.4 CAA check

```bash
dig CAA victaagency.com +short
# Expected: "0 issue letsencrypt.org" + "0 issue comodoca.com"
```

### 3.5 HTTPS check

```bash
curl -I https://victaagency.com
# Expected: HTTP/2 200, headers include "strict-transport-security: max-age=31536000; includeSubDomains"

curl -I https://victa.agency
# Expected: HTTP/2 301, Location: https://victaagency.com/...
```

### 3.6 SSL Labs grade (optional, post-launch)

After 24h propagation, run https://www.ssllabs.com/ssltest/analyze.html?d=victaagency.com — target grade A or A+.

---

## 4. Rollback procedure

If a DNS change breaks the site:

1. In Namecheap, restore from `dns-backup/victaagency.com-2026-05-07.txt` (the snapshot taken in §pre-flight)
2. DNS propagation timeline: changes typically active within 5-15 min on Namecheap; full global propagation can take up to TTL window (3600s default). To minimize rollback time, **set TTL low (300s = 5 min) on any record being changed in production**, then raise back to default once stable.
3. Notify Roman + check Sentry/Vercel for downtime alerts during propagation window

---

## 5. When you finish

- [ ] All Vercel records applied; `dig victaagency.com` returns Vercel IPs
- [ ] All Resend records applied; Resend dashboard shows domain "Verified"
- [ ] All CAA records applied; `dig CAA victaagency.com` returns expected CAs
- [ ] Vercel verification TXT applied; `_vercel` resolves
- [ ] Google Search Console TXT applied; verification successful in Search Console
- [ ] `victa.agency` → 301s to `https://victaagency.com` (test with `curl -I`)
- [ ] `dns-backup/` snapshots committed to git
- [ ] Workplan §0.4 ticked

You're ready for Phase 1 deploy.
