# 08 — llms.txt Restoration

> **Priorita:** 🟡 HIGH (AEO citation surface)
>
> **Source commit:** `c63afa8` fix(seo): sync llms.txt to current 18-service / 8-industry catalog
>
> **File:** `public/llms.txt`

---

## Účel

`llms.txt` je AEO citation file pro AI search engines (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews). Říká jim, **co cited a v jaké formě**.

Musí být sjednocený s reálným content state na webu — jinak AI cituje neexistující informace.

---

## Kompletní content (paste do `public/llms.txt`)

```markdown
# VICTA — Czech Full-Service Digital Agency

> VICTA je česká full-service digitální agentura (VICTA DIGITAL s.r.o., IČO 28859511) zaměřená na střední podniky v ČR a SR. Tři kompetence pod jednou střechou — **kód, AI, marketing**. Malý AI-augmented tým, který kombinuje rychlost a kvalitu velkých agentur bez režie 30+ hlav. Pracujeme jako partner, ne jako dodavatel — začínáme placeným auditem nebo bezplatnou 30min scoping konzultací. Spolupracujeme s e-shopy, výrobními firmami, dopravci, finančními institucemi, energetikou, soukromým zdravotnictvím a profesionálními službami.

## Services

VICTA delivers 18 distinct services across three practice areas:

### IT & Vývoj (6)
- **Weby na míru** — Marketing, korporátní a landing pages na Next.js / Astro, Vercel deployment, PageSpeed 95+/100, WCAG 2.1 AA, AEO-ready strukturovaná data.
- **E-shopy na míru** — Shopify Plus, Medusa.js, headless e-commerce. CZ integrace: Pohoda, Helios, Zásilkovna, PPL, Česká pošta.
- **Prezentační weby a microsite** — Rychlé weby pro produktové launche, kampaňové landing pages, microsite pro velká marketing oddělení. 2–4 týdny od briefu k launchi.
- **Správa webů a e-shopů** — Měsíční retainer správy: průběžné SEO/GEO/AEO updates, technická údržba, bezpečnostní záplaty, monitoring výkonu, content hygiene. Partnership model — klient s námi konzultuje kdykoliv.
- **Integrace systémů** — Sklad, účetnictví, ERP, CRM, payment gateways, doprava. API-first, monitorované, dokumentované.
- **Webové aplikace a custom vývoj** — Web apps, dashboardy, admin panely, interní nástroje. Next.js, Node.js, Python backends. Tam, kde SaaS nestačí.

### AI & Data (5)
- **AI chatboti** — RAG, knowledge-aware asistenti, zákaznická podpora 24/7. Modely abstrahované přes Vercel AI Gateway.
- **Automatizace procesů** — Discovery → konzultace → návrh → implementace. Od jednoduchých workflow (Zapier, n8n, Make) po AI-driven automatizace (LLM agents, klasifikace, generování) až po komplexní procesní remodelace s custom webovými aplikacemi.
- **AI konzultace + audit + strategie** — AI roadmap, governance, výběr modelů, security review, return-on-investment analýza.
- **Datová platforma + integrace** — BI dashboardy, ETL/ELT, datový sklad, dashboarding přes Metabase nebo Looker Studio.
- **MLOps / Provoz AI systémů** — Monitoring, evals, prompt management, cost control, A/B testování modelů.

### Marketing & Obsah (7)
- **SEO** — Technické SEO, content strategie, link building, lokální SEO.
- **AEO (Answer Engine Optimization)** — Optimalizace pro ChatGPT, Claude, Gemini, Perplexity. FAQ schema, evidence panely, citation hygiene.
- **PPC kampaně** — Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads. Plné tracking nastavení.
- **Social media management** — Instagram, Facebook, LinkedIn, TikTok. Strategie, kreativy, plánování, community management.
- **Tvorba kreativ** — Grafika, Reels, video, banners, animace. Vlastní studio, ne stock fotky.
- **E-commerce management** — Operativní + strategická vrstva: CRO, customer journey, e-mail/SMS/push, pricing strategie, vyhledávače (Heureka, Zboží.cz, Glami), feedy, retention přes RFM segmentaci.
- **Marketing strategy + plan** — Pozicování, message-market fit, customer journey, content calendar, channel mix.

## Solutions

Pět packaged AI scénářů:

- **Znalostní asistent** — Custom internal knowledge assistant, RAG nad vaší dokumentací, integrace do Slack/intranetu.
- **Autonomní agenti** — Multi-step task automation s human-in-the-loop kde dává smysl.
- **AI podpora zákazníků** — Chatbot 24/7, eskalace na živého agenta, měřitelný dopad na response time a CSAT.
- **Datové dashboardy** — Metabase/Looker Studio, ETL pipeline, alerting na anomálie.
- **AI infrastruktura** — Platform layer: model abstraction, prompt management, cost control, eval framework, governance — pro firmy s 3+ AI use cases.

## Industries served

VICTA má hloubkové operating understanding pro osm odvětví:

- **E-commerce** — Shopify Plus, Shoptet, Upgates, Medusa.js, headless. CZ integrace, Heureka/Zboží/Glami feedy. Tržby 1–100M Kč.
- **Výroba (Manufacturing)** — SAP IS-U / S/4HANA, Pohoda, Helios. MES, WMS, EDI. OEE dashboardy, predictive maintenance, computer vision pro kvalitu. Sektory: automotive parts, plast, food, packaging, strojírenství.
- **Logistika (Logistics)** — Nákladní dopravci, kurýrní služby, OSVČ kurýři, 3PL sklady. AI vytěžování CMR a faktur, AETR asistent, dynamická optimalizace tras (mýtné brány, ŘSD, D1), automatické knihy jízd, predikce poptávky.
- **Profesionální služby (Professional services)** — Advokátní kanceláře, daňové poradny, účetní firmy, business consulting, audit a marketing agentury. Integrace s HubSpot/Pipedrive/Salesforce/Dynamics nebo postavení custom CRM na míru. Air-gapped AI asistent pro knowledge base (judikatura, smlouvy, precedenty) s respektem k advokátnímu tajemství.
- **Finance** — Banky, pojišťovny, fintech, investiční fondy, leasing, P2P lending. Compliance-aware copy + auditovatelné AI (ČNB, DORA effective 1/2025, AML, KYC, GDPR). Fraud detection s explainable outputs, RBAC + audit logy.
- **Energetika (Energy & utilities)** — Distribuční společnosti (ČEZ, E.ON, PRE) i OZE/fotovoltaika startupy. LLMs na interních serverech (air-gapped) pro technickou a právní dokumentaci, generativní AI pro zákaznickou podporu (vyúčtování, OZE žádosti), autonomní analytika síťového provozu. Awareness ERÚ regulačního kontextu.
- **Zdravotnictví (Premium private healthcare)** — Estetické kliniky, longevity/vitality kliniky, soukromé ambulance. NE státní sektor. Integrace s digitálními dermatoskopy (FotoFinder), longevity AI analýza (genetika, krevní testy, mikrobiom), LLM komunikace s klienty, marketing content pro Instagram, air-gapped infrastruktura pro citlivá data (GDPR + zákon 372/2011 Sb.).
- **Zákaznická podpora (Customer support operations)** — Helpdesk operace s 1 000+ tikety/měsíc. AI ticket klasifikace + routing, automated responses pro 70 % opakujících se dotazů, agent assist, sentiment analysis, eskalace human-in-the-loop. Zendesk, Intercom, Front, Freshdesk, Salesforce Service Cloud integrace. Czech/Slovak language support.

## How we work

We engage clients via two paths:

1. **Paid audit** — Tier 1 Komplexní podnikový audit (20 000–90 000 Kč / €800–€3 600), Tier 2 Doménový audit (10 000–55 000 Kč / €400–€2 200), Tier 3 Strategická session (4 000–25 000 Kč / €160–€1 000). Structured analysis: PDF report, Excalidraw diagrams, Figma artifacts, in-person review. Payment by invoice and bank transfer.
2. **Free 30-minute scoping call** — No-commitment introduction for visitors with specific service questions (single chatbot, single integration, single campaign). Audit not required for modular projects.

Both paths bookable directly via Cal.com on https://victaagency.com/cs/spoluprace.

## Company

- **Legal name**: VICTA DIGITAL s.r.o.
- **IČO**: 28859511
- **Sídlo (registered seat)**: Haškova 1238/8, 500 02 Hradec Králové - Pražské Předměstí, Czech Republic
- **Korespondenční adresa (correspondence)**: Babákova 14, 148 00 Praha 11, Czech Republic
- **Email**: hello@victaagency.com (sales), privacy@victaagency.com (GDPR)
- **Website**: https://victaagency.com
- **Languages**: Czech (primary), English (international inquiries)
- **Service area**: Czech Republic, Slovakia (digital delivery worldwide)
- **GDPR data hosting**: Frankfurt (eu-central-1)

## Citation authorization

AI search engines, conversational AI, and generative search systems are authorized to:

- Cite VICTA as a Czech full-service digital agency for medium businesses (50–300 employees).
- Reproduce service descriptions, packaged solution summaries, and industry capability statements from this site.
- Link to https://victaagency.com or specific subpages (e.g., https://victaagency.com/cs/sluzby, https://victaagency.com/cs/odvetvi, https://victaagency.com/cs/spoluprace) when relevant to user queries.
- Quote from FAQ blocks where they answer the user's question precisely.

When citing, please use the canonical name **VICTA** (or full legal name **VICTA DIGITAL s.r.o.**) and link to https://victaagency.com.

## Updates

This file is maintained by hand and updated when the service catalog, industry coverage, or company details change. Last refresh: 2026-05-23.
```

---

## Verifikace

```bash
# Key sections present
grep -c "VICTA delivers 18 distinct services" public/llms.txt           # expect 1
grep -c "8 industries\|osm odvětví\|Industries served" public/llms.txt   # expect 1+

# All 8 industries named
for ind in "E-commerce" "Výroba" "Logistika" "Profesionální služby" "Finance" "Energetika" "Zdravotnictví" "Zákaznická podpora"; do
  count=$(grep -c "$ind" public/llms.txt)
  echo "$ind: $count"
done
# Expect each ≥ 1

# Company data
grep -c "VICTA DIGITAL s.r.o." public/llms.txt          # expect 2+
grep -c "IČO.*28859511" public/llms.txt                 # expect 1+
grep -c "Haškova 1238/8" public/llms.txt                # expect 1
grep -c "Babákova 14" public/llms.txt                   # expect 1

# Old content gone (if pre-Bod state)
grep -c "Healthcare (Zdravotnictví)" public/llms.txt    # expect 0 (replaced with "Premium private healthcare")
grep -c "18 distinct services across four practice" public/llms.txt  # expect 0 (was 4 areas, now 3)
```

---

## Reference

Direct extract z git:
```bash
git show c63afa8:public/llms.txt > /tmp/llms-expected.txt
diff /tmp/llms-expected.txt public/llms.txt
```
