# 01 — Legal Data Restoration

> **Priorita:** 🔴 CRITICAL — bez tohoto je VICTA v rozporu s GDPR (privacy policy musí obsahovat IČO a sídlo)
>
> **Source commit:** `ff858d1` fix(content): replace TBD/doplnit placeholders with VICTA DIGITAL legal data

---

## Co se má změnit

Pět specifických JSON klíčů v `content/cs/strings/common.json`:

### 1. Footer copyright

**Key:** `footer.bottom.copyright`

```diff
- "© 2026 Victa Digital s.r.o."
+ "© 2026 VICTA DIGITAL s.r.o."
```

### 2. Footer IČO

**Key:** `footer.bottom.ico`

```diff
- "IČO [doplnit]"
+ "IČO 28859511"
```

### 3. Kontakt page address — sídlo

**Key:** `kontakt.channels.address.value`

```diff
- "Praha [TBD]"
+ "Haškova 1238/8, 500 02 Hradec Králové"
```

### 4. Kontakt page address — note s korespondenční adresou

**Key:** `kontakt.channels.address.note`

```diff
- "Sídlo Victa Digital s.r.o. — přesnou adresu doplníme po dokončení registrace."
+ "Sídlo VICTA DIGITAL s.r.o. (IČO 28859511). Korespondenční adresa: Babákova 14, 148 00 Praha 11."
```

### 5. Privacy policy intro

**Key:** `legal.privacy.intro`

```diff
- "...my, společnost Victa Digital s.r.o., nakládáme..."
+ "...my, společnost VICTA DIGITAL s.r.o., nakládáme..."
```

### 6. Privacy policy §1 (Provozovatel)

**Key:** `legal.privacy.sections[0].body`

**Před:**
> "Správcem osobních údajů ve smyslu čl. 4 odst. 7 GDPR je Victa Digital s.r.o., se sídlem v Praze, IČO [doplnit]. Pro veškeré dotazy týkající se ochrany osobních údajů se prosím obracejte na adresu privacy@victaagency.com."

**Po:**
> "Správcem osobních údajů ve smyslu čl. 4 odst. 7 GDPR je VICTA DIGITAL s.r.o., IČO 28859511, se sídlem Haškova 1238/8, 500 02 Hradec Králové - Pražské Předměstí. Pro veškeré dotazy týkající se ochrany osobních údajů se prosím obracejte na adresu privacy@victaagency.com nebo poštou na korespondenční adresu Babákova 14, 148 00 Praha 11."

### 7. Cookies policy intro

**Key:** `legal.cookies.intro`

```diff
- "V těchto zásadách vám my, společnost Victa Digital s.r.o., vysvětlujeme..."
+ "V těchto zásadách vám my, společnost VICTA DIGITAL s.r.o., vysvětlujeme..."
```

---

## Stále TBD (čeká na Romana)

### Phone number

**Key:** `kontakt.channels.phone.value`

```diff
  "+420 [TBD]"
```

Roman musí dodat skutečné telefonní číslo. Po update remove `[TBD]` placeholder.

**Pre-launch blocker** — tracked v TaskCreate #3.

---

## Verifikace

```bash
# Co MÁ být přítomné (každý expect 1+ match)
grep -c "VICTA DIGITAL s.r.o." content/cs/strings/common.json     # expect 5+
grep -c "IČO 28859511" content/cs/strings/common.json             # expect 2 (footer + privacy)
grep -c "Haškova 1238/8" content/cs/strings/common.json           # expect 2 (kontakt + privacy)
grep -c "Babákova 14" content/cs/strings/common.json              # expect 2 (kontakt + privacy)
grep -c "500 02 Hradec Králové" content/cs/strings/common.json    # expect 2

# Co NESMÍ být v dokumentu
grep -c "Victa Digital" content/cs/strings/common.json            # expect 0 (old casing)
grep -c "\[doplnit\]" content/cs/strings/common.json              # expect 0
grep -c "Praha \[TBD\]" content/cs/strings/common.json            # expect 0
```

## Použité info pro debug

- Plný název: **VICTA DIGITAL s.r.o.**
- IČO: **28859511**
- Sídlo (registered seat): **Haškova 1238/8, 500 02 Hradec Králové - Pražské Předměstí**
- Korespondenční adresa: **Babákova 14, 148 00 Praha 11**
- Email (GDPR): privacy@victaagency.com
- Email (sales): hello@victaagency.com
- Region datového hostingu: Frankfurt (eu-central-1)
