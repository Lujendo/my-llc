> ⚠️ **TEMPLATE — requires review by a licensed attorney in the relevant jurisdiction before publication.**
> These are user-facing strings. Copy them **verbatim** into the UI. Do not soften or shorten the warnings without counsel.
> Tokens in `[SQUARE BRACKETS]` must be filled in.

---

# User-Facing Copy — Verbatim Strings

Plain English, short sentences, ESL-friendly. Keep the meaning if you translate; keep the English version as the controlling text.

---

## 1. Professional review checkbox (required before downloading any form)

**Label (verbatim):**

> ☐ I confirm I have consulted, or will consult, a qualified US tax professional before filing this form with the IRS.

**Supporting line under the checkbox (verbatim):**

> This tool helps you prepare a draft. It is not tax, legal, or accounting advice. You are responsible for what you file.

**Behavior notes (for the developer):**
- The download button stays disabled until this box is ticked.
- Do not pre-tick it. Do not remember it across sessions for a different form.
- Log the tick (timestamp + user + form) as evidence of acknowledgment.

---

## 2. Inline warning banner (form generators)

**Banner (verbatim):**

> ⚠️ **Draft only — not tax advice.** This form was generated from the information you entered. It may contain errors or be out of date. Have a qualified US tax professional review it before you file. You are responsible for the final filing.

**Short version (for tight spaces, verbatim):**

> ⚠️ Draft only — not tax advice. Review with a qualified professional before filing.

---

## 3. Entity creation disclaimer

**Text (verbatim):**

> **Creating an LLC is a legal act.** This tool helps you organize information and prepare documents. It does not give legal, tax, or accounting advice, and it does not create a lawyer–client relationship. Rules differ by state and by your country. Consult a qualified professional before forming or operating an LLC.

---

## 4. "Not advice" footer

**Text (verbatim):**

> MY-LLC Dashboard is an educational tool. It is **not** tax, legal, or accounting advice, and using it does not create a professional relationship. Always review your filings with a qualified professional. See our [Terms of Service] and [Privacy Policy].

---

## 5. Cookie consent banner

**Banner (verbatim):**

> We use cookies to run the site and, with your consent, to understand how it is used. You can accept or reject non-essential cookies. [Accept all] [Reject non-essential] [Cookie settings]

**Behavior notes (for the developer):**
- "Reject non-essential" must be as easy to find and as prominent as "Accept all". No pre-ticked boxes.
- Do not set analytics/marketing cookies before consent (EU/UK/EEA).
- Link "Cookie settings" to a page where choices can be changed later.

---

## 6. Signup consent

**Text (verbatim):**

> By creating an account, I agree to the [Terms of Service] and the [Privacy Policy]. I understand that MY-LLC Dashboard is an educational tool, not tax, legal, or accounting advice, and that I must consult a qualified professional before filing anything with the IRS.

**Attestation (verbatim):**

> I confirm I am at least 18 years old and have the legal capacity to enter into this agreement.

**Behavior notes (for the developer):**
- The signup button stays disabled until this is ticked.
- Do not pre-tick it.
- Link Terms and Privacy Policy to the current published versions.
- Record the accepted document versions (Terms + Privacy) and a timestamp with the account.

---

## 7. Optional: payment / checkout consent (if you charge)

**Text (verbatim):**

> I understand that MY-LLC Dashboard is an educational tool and not tax, legal, or accounting advice, and that fees are for use of the software only. [Refund policy link]

---

### ⚖️ Copy that genuinely REQUIRES a licensed attorney before launch

1. **§1 Professional review checkbox** — the exact wording of the acknowledgment is your main evidence of informed consent; counsel should approve it.
2. **§3 Entity creation disclaimer** — forming an entity is a legal act; the disclaimer must match the states/countries you serve.
3. **§5 Cookie banner** — consent wording and "reject" parity must satisfy GDPR/ePrivacy and CCPA/CPRA.
4. **§6 Signup consent** — must correctly incorporate the Terms and Privacy Policy and any arbitration/class-action notice required by law.
5. **Any translation** — translated warnings must be reviewed so they carry the same legal meaning.
