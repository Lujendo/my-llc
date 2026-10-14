> **User-facing copy — ready to ship (pre-filling-helper framing).** Consider having a qualified professional review this wording over time; you remain responsible for what you file.
> These are user-facing strings. Copy them **verbatim** into the UI. Do not soften or shorten the warnings.
> Tokens in `[SQUARE BRACKETS]` must be filled in by the CEO.

---

# User-Facing Copy — Verbatim Strings

Plain English, short sentences, ESL-friendly. Keep the meaning if you translate; keep the English version as the controlling text.

**Framing (applies to every string below):** MY-LLC Dashboard is a **pre-filling helper**. It helps you pre-fill forms and documents from what you type, and it produces **drafts**. It does **not** file, submit, or act on your behalf, and it does **not** give legal, tax, or accounting advice or create any professional, client, preparer, or fiduciary relationship. **You are the actor** — you review, sign, and file.

**Do not edit the `>` lines in sections 1–6 without also updating the mirrored copy in code** (`src/react-app/lib/legal.ts`, `src/react-app/lib/w7.ts`, `src/react-app/lib/oa.ts`) — the automated check `legal-smoke.mjs` enforces they stay identical.

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

## 7. Payment / checkout consent (only when paid plans launch)

The Service is **free today** and **no payments are collected**. There is therefore **no checkout consent to show and no refund policy to state yet** — refunds are "not applicable until paid plans launch" (see the Terms of Service §9). Use the copy below **only** once a payment system is live, and publish a matching refund policy at the same time.

**Text to use when paid plans launch (verbatim):**

> I understand that MY-LLC Dashboard is a self-help document-preparation tool and not tax, legal, or accounting advice, and that any fees are for use of the software only. [Refund policy link]

---

### Internal — optional counsel review items (non-blocking)

Nothing here blocks launch. See `content/legal/POST-LAUNCH-ATTORNEY-CHECKLIST.md` for the optional list: the exact §1 acknowledgment wording, the §3 entity disclaimer per target market, the §5/§6 GDPR + ePrivacy + CCPA/CPRA wording, the age attestation wording, and any translation.
