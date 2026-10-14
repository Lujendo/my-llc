# MY-LLC Dashboard — Tax Disclaimers (copy‑paste ready)

**Doc version:** 1.0
**Effective:** 2026-10-13
**Author:** Federal Advisor (US) — MY-LLC Dashboard
**Legal basis (references to confirm as needed):** IRC §7701(a)(36) & Circular 230 (practice before the IRS); IRC §7216 (use/disclosure of tax return information); IRC §6109 (taxpayer ID numbers); PATH Act 2015 (P.L. 114-113, Div. Q); FTC Act §5 (deceptive claims).

> These are informational, not legal advice. Consider having counsel review and localize them over time; they are not a launch gate. Plain English, short sentences, ESL‑friendly.

**Framing:** MY-LLC Dashboard is a **pre-filling helper** that helps you pre-fill forms and documents from what you type and produces **drafts**. It does not file, submit, or act on your behalf, does not give legal, tax, or accounting advice, and does not create any professional, client, preparer, or fiduciary relationship. **You are the actor** who reviews, signs, and files.

**Do not reword Blocks 1–5 without also updating the mirrored copy in code** (`src/react-app/lib/w7.ts`, `src/react-app/lib/oa.ts`). Those blocks are copied verbatim into generated documents; the source file and the code must not drift.

**Use rules**
- Show **before** the user generates or downloads any document.
- Log the acknowledgment checkbox with **timestamp + disclaimer version**.
- Keep the language as written unless you choose to have counsel revise it.

---

## Block 1 — Global tax disclaimer

**Short (footer / tooltip):**
> This tool gives general information and helps you prepare documents. It is **not** tax, legal, or accounting advice. No CPA–client, attorney–client, or Enrolled Agent relationship is created. Tax rules change and depend on your country and your facts. For advice about your own taxes, talk to a qualified tax professional (a CPA, Enrolled Agent, or tax attorney) in your country.

**Full (on any page that produces a document):**
> This tool provides general information and document‑preparation help only. It is not tax, legal, or accounting advice, and it is not a substitute for advice from a qualified professional. Using this tool does **not** create a CPA–client, attorney–client, or Enrolled Agent relationship, and we do not represent you before any tax authority. We do not review your facts and we do not guarantee any tax result. Tax law changes and depends on your country, your residency, and your situation. You are responsible for the accuracy of everything you enter. All information and output are provided "as is," with no warranty of any kind. For advice about your own situation, consult a qualified tax professional in your country.

---

## Block 2 — Form W‑7 generator disclaimer

> This tool helps you fill out **Form W‑7, Application for IRS Individual Taxpayer Identification Number**, from the information you type in. It is a **typing and formatting aid only**. It does **not**:
> - file the form for you, or send anything to the IRS;
> - decide which reason box (a–h) applies to you;
> - decide whether a tax treaty benefit or exception applies;
> - certify, review, or verify your documents; or
> - tell you how the IRS will decide your case.
>
> **The IRS — not this tool — decides whether to issue an ITIN.** An ITIN is for **federal tax purposes only**. It does **not** give you immigration status, work permission, or a Social Security number, and it does **not** change your immigration status.
>
> You must attach what the IRS requires — usually your **passport (or an agency‑certified copy)**, plus a **completed federal tax return** or a **valid exception**. Only the IRS, an IRS Taxpayer Assistance Center, or a **Certifying Acceptance Agent** can accept or certify your identity documents. Check the current instructions at **irs.gov** before you file. **We are not the IRS and are not affiliated with the IRS.**

---

## Block 3 — Professional‑review acknowledgment (checkbox)

> **I understand that:** this tool only prepares a document; it does not give tax or legal advice and it does not file for me. A qualified tax professional should review my situation and my completed form **before** I sign and submit it. **I am responsible** for the accuracy of the information and for filing my form.
>
> *Logged at: [timestamp] · Disclaimer version: [v1.0]*

---

## Block 4 — Entity formation disclaimer

> Forming an LLC or a corporation has tax and legal consequences that depend on **your country of residence, your tax residency, and who owns the entity**. A US LLC is **not** automatically tax‑free or private, and forming one does **not** by itself reduce your taxes.
>
> Depending on your facts, you may have US filing duties (for example, obtaining an ITIN / filing a US return, or filing **Form 5472** with a **$25,000 penalty if missed**), and you may also have duties in your home country. **We do not choose an entity, a tax classification, or a jurisdiction for you, and we do not file anything.** Get advice from a CPA or Enrolled Agent, and — where relevant — a lawyer in your country, **before** you form or operate an entity.

---

## Block 5 — Right of refusal / IRS‑rejection liability

> **We may decline or stop preparing a document** — for example, if information is incomplete or inconsistent, or if the request appears to be for a non‑tax purpose. Producing a document does **not** mean the IRS will accept it.
>
> The IRS can **reject, deny, or delay** an ITIN for many reasons, including: a wrong or missing reason box; a missing federal return or exception; uncertified or unacceptable identity documents; a name that does not match your passport; a missing treaty country or article; an expired ID; an unsigned form; or a situation where you already qualify for a Social Security number.
>
> **We are not responsible for IRS decisions, delays, rejections, penalties, or losses.** You (the applicant) sign the form **under penalties of perjury** and are responsible for its truth and correctness. Submitting false or fraudulent information may lead to **civil and criminal penalties**. *(Confirm the current penalty provisions with counsel before publishing a specific figure.)*

---

## Red flags to CEO (non‑blocking, but decide before build)

1. **"Pub 1918" is a phantom.** The task cited *Pub 1918* for ITIN guidance. `irs.gov/forms-pubs/about-publication-1918` → **404** (checked 2026‑10‑13). Correct sources: **Pub 1915 (Rev. 12‑2025)** and **Pub 4757 (Rev. 6‑2026)**. Anyone building to "Pub 1918" is building to nothing.
2. **We are not an IRS Acceptance Agent / CAA.** The generator must never certify documents or fill Page 2. Copy must never imply IRS affiliation — that is an FTC deceptive‑claims risk.
3. **Annual form‑revision risk.** The W‑7 is revised each December; a new rev invalidates this mapping. Add a release‑time check.
4. **Sensitive PII.** The W‑7 flow handles passports, ITINs, and dates of birth. This needs a data‑security/retention review (legal + security) — separate from tax. Consider IRC §7216 consent issues if any third‑party preparer touches the data.
5. **Don't oversell "3 questions, done."** Because we cannot choose the reason box, the product should **push toward professional review**, not present itself as an answer.
6. **Out of my lane — hand off.** State/local tax and the owner's home‑country consequences belong to `entity_manager`, `international_law`, `steuerberater_de`, and `commercialista_italiano`.
