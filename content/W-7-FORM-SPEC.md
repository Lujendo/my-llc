# Form W-7 — Generator Field Specification

**Doc version:** 1.0
**Prepared:** 2026-10-13
**Author:** Federal Advisor (US) — MY-LLC Dashboard
**Scope:** Exact field mapping for a print-ready Form W-7 generator. No application code. Research + authoring only.

> **Verify before build.** The IRS revises the W-7 each December. A new revision changes line labels and can add/remove fields. Re-check the Rev. date on irs.gov before every release and re-map if it changed.

---

## 0. Sources (verify before every release)

| Item | Version | Link |
|---|---|---|
| Form W-7 | **Rev. December 2024** | https://www.irs.gov/forms-pubs/about-form-w-7 (PDF: https://www.irs.gov/pub/irs-pdf/fw7.pdf) |
| Instructions for Form W-7 | **12/2024** | https://www.irs.gov/instructions/iw7 |
| Pub 1915 — Understanding Your IRS ITIN | **Rev. 12-2025** | https://www.irs.gov/pub/irs-pdf/p1915.pdf |
| Pub 4757 — Individual Taxpayer Identification Number (ITIN) | **Rev. 6-2026** | https://www.irs.gov/pub/irs-pdf/p4757.pdf |
| Statute | IRC §6109; PATH Act 2015 (P.L. 114-113, Div. Q) | irs.gov / uscode |

**Correction to internal task:** the task cited *"Pub 1918 for ITIN."* No such publication exists — `https://www.irs.gov/forms-pubs/about-publication-1918` returns **404** (checked 2026-10-13). The correct ITIN taxpayer publications are **Pub 1915** and **Pub 4757**. Do not build to "Pub 1918."

---

## 1. Page layout

- **Page 1** — applicant fields (sections in §2–§4) + the "Sign Here" area.
- **Page 2** — **"Acceptance Agent's Use ONLY."**

**Generator rule:** Page 2 must render **completely blank**. MY-LLC Dashboard is **not** an IRS Acceptance Agent (AA) or Certifying Acceptance Agent (CAA). Any AA/CAA certification block is completed only by a credentialed agent. Never render an agent certification on the user's behalf.

---

## 2. Application type (check one)

- `Apply for a new ITIN`
- `Renew an existing ITIN`

Rule: exactly one. Renewal applies only to an ITIN that has already expired (see IRS revalidation/expiry rules).

---

## 3. Reason box (check one, a–h)

Verbatim option text from the Rev. December 2024 form:

| Box | Text |
|---|---|
| a | Nonresident alien required to get an ITIN to claim tax treaty benefit |
| b | Nonresident alien filing a U.S. federal tax return |
| c | U.S. resident alien (based on days present in the United States) filing a U.S. federal tax return |
| d | Dependent of U.S. citizen/resident alien — *if d, enter relationship to U.S. citizen/resident alien* |
| e | Spouse of U.S. citizen/resident alien — *if d or e, enter name and SSN/ITIN of U.S. citizen/resident alien* |
| f | Nonresident alien student, professor, or researcher filing a U.S. federal tax return or claiming an exception |
| g | Dependent/spouse of a nonresident alien holding a U.S. visa |
| h | Other (see instructions) |

**Additional-information rules (verbatim intent):**
- Box **a** → must **also check and complete box h**; enter **treaty country** and **treaty article number**.
- Box **f** → if claiming an **exception**, must **also check and complete box h**; enter **treaty country** and **treaty article number**.
- **Caution:** boxes **b, c, d, e, f, and g** generally require the applicant to **file a U.S. federal tax return with the Form W-7**, unless an exception applies.

**Generator rule (critical):** **Never auto-select a reason box.** Which box applies is a factual/legal determination (is a return being filed? does an exception apply? is a treaty benefit claimed?). Ask plain-language questions, let the user pick, and offer an **"I'm not sure"** path → leave blank + flag for professional review. A defaulted reason box can cause rejection or a false statement.

*Advisory mapping only (never automatic, and never rendered in the UI as a suggestion):* a nonresident-alien owner of a US LLC who needs an ITIN to file a US return → **b**; if claiming a treaty benefit → **a (+ h)**; a nonresident-alien student/professor/researcher → **f**. This mapping is documentation for reviewers only — the product must not display a recommended box, because that would be the tool "telling you which box" (§8).

---

## 4. Applicant fields (map 1:1 to the form)

| Field ID | Form label (verbatim) | Input | Validation | Notes |
|---|---|---|---|---|
| `app_type` | Application type | radio | exactly one | new / renew |
| `reason_box` | Reason a–h | radio | exactly one | **never auto-selected** |
| `reason_h_text` | Other (box h) | text | required if `a` or `f` | treaty country + article number |
| `reason_d_relationship` | If d, enter relationship to U.S. citizen/resident alien | text | required if `d` | e.g. child, parent |
| `usp_name` | If d or e, enter name of U.S. citizen/resident alien | text | required if `d` or `e` | |
| `usp_id` | If d or e, enter SSN/ITIN of U.S. citizen/resident alien | text | required if `d` or `e` | |
| `1a_first/middle/last` | Line 1a — name | text | required; match passport spelling; Latin transliteration | |
| `1b_first/middle/last` | Line 1b — name at birth if different | text | optional | |
| `addr2_street` | Line 2 — street address, apt number, or rural route number | text | required | P.O. box permitted per instructions |
| `addr2_city/state/country/zip` | city or town, state or province, and country; ZIP/postal | text | required | |
| `addr3_street` | Line 3 — foreign (non-U.S.) address, street/apt/rural route | text | required | **P.O. box NOT allowed** |
| `addr3_city/state/country/zip` | city or town, state or province, and country; postal code | text | required | |
| `4_dob` | Line 4 — date of birth (MM/DD/YYYY) | date | required; `MM/DD/YYYY` | |
| `4_country_birth` | Country of birth | text | required | |
| `4_city_state_birth` | City and state or province | text | optional | labeled "(optional)" |
| `5_sex` | Line 5 — Male / Female | radio | required | form uses Male/Female |
| `6a_citizenship` | Line 6a — country(ies) of citizenship | text | required | |
| `6b_foreign_tin` | Line 6b — foreign tax I.D. number (if any) | text | optional | |
| `6c_visa_type/number/exp` | Line 6c — type of U.S. visa (if any), number, and expiration date | text/date | optional | |
| `6d_doc_type` | Line 6d — identification document(s) submitted: Passport / Driver's license/State I.D. / USCIS documentation / Other | radio | required (first document) | multiple docs → see instructions |
| `6d_issued_by` | Issued by | text | conditional | |
| `6d_number` | Number | text | conditional | |
| `6d_exp` | Exp. date | date | conditional | |
| `6d_entry_date` | Date of entry into the United States (MM/DD/YYYY) | date | conditional | |
| `6e_prev_itin` | Line 6e — previously received an ITIN or IRSN? Yes / No / Don't know | radio | required | |
| `6f_itin` | Line 6f — ITIN `___-__-____` | text | required if `6e = Yes` | format `9xx-xx-xxxx` |
| `6f_irsn` | Line 6f — IRSN `___-__-____` | text | required if `6e = Yes` | |
| `6g_institution` | Line 6g — Name of college/university or company | text | required if `f` | |
| `6g_city_state` | Line 6g — City and state | text | required if `f` | |
| `6g_length_of_stay` | Line 6g — Length of stay | text | required if `f` | |
| `sign_name/date/phone` | Sign Here | — | **leave blank** | see signature rule |

**Rules:**
- **Line 6g exists** on the Rev. 12-2024 form: *"Name of college/university or company"*, *"City and state"*, and *"Length of stay"*. It is **required for reason (f)** (student/professor/researcher) or a business visitor. (An earlier internal note claimed 6g was removed — that was wrong; re-verify against the current PDF before release.)
- **Box d** requires the **relationship** to the U.S. citizen/resident alien. **Boxes d and e** require the **name and SSN/ITIN** of that U.S. citizen/resident alien.
- **Signature area must be left blank** — the generator prints a signature line only. Do **not** apply an e-signature; the applicant signs in ink. Under penalties of perjury, the *applicant* signs.
- Render IRS labels verbatim. Do not paraphrase field captions.

---

## 5. Required attachments (what the packet must contain)

The generator produces **the form only**. The packet the user submits must also include:

1. A completed **U.S. federal tax return** to which the ITIN applies (e.g., 1040 / 1040-NR), **unless a documented exception applies** (spouse, dependent, student, etc.).
2. **Original identity documents, or copies certified by the issuing agency** — only originals or agency-certified copies are accepted (Pub 1915). The **passport** is the most commonly used single document.
3. **Treaty country + article number** if box **a** or **f** is used (§3).
4. If a Social Security number was denied: the **SSA denial letter**.
5. The **signed Form W-7**.

The tool cannot substitute for any of these. State this in the UI.

---

## 6. Where to file (verified 2026-10-13, Pub 4757 Rev. 6-2026)

- **USPS mail:** Internal Revenue Service, ITIN Operation, P.O. Box 149342, Austin, TX 78714-9342
- **Private delivery:** Internal Revenue Service, ITIN Operation, Mail Stop 6090-AUSC, 3651 S. Interregional Hwy 35, Austin, TX 78741-0000
- **In person:** designated IRS Taxpayer Assistance Centers (TACs), or through a **Certifying Acceptance Agent (CAA)** who can certify documents.

Re-verify before release.

---

## 7. Validation rules (minimum)

- Exactly one application type; exactly one reason box.
- `reason = a` or `f` → box **h** required (treaty country + article).
- `reason = d` → relationship required; `reason = d` or `e` → name + SSN/ITIN of the U.S. citizen/resident alien required.
- `reason = f` → line **6g** required (institution/company name, city and state, length of stay).
- All required fields present; `MM/DD/YYYY`; date of birth plausible.
- Line 3 foreign address: **reject P.O. box**.
- `6e = Yes` → `6f` required; ITIN format `9xx-xx-xxxx`.
- Signature area left blank.
- **Warn (do not hard-block):** reason box blank; no return referenced; citizenship/visa inconsistent; treaty article missing.

---

## 8. Prohibited generator claims (product copy)

The tool is a **document-preparation aid**. It must never claim or imply:

- "We file your W-7" / "we submit to the IRS."
- "Guaranteed acceptance" / "approved ITIN."
- "IRS-approved," "official IRS partner," or "Certifying Acceptance Agent" (unless actually credentialed — we are not).
- "Free tax advice" / "we tell you which box."
- "We certify your documents."
- "Attorney / CPA / Enrolled Agent."
- That it auto-selects the reason box.

---

## 9. Known rejection causes (surface as warnings)

- Reason box missing, or box **b/c/d/e/f/g** without an attached return or a valid exception.
- Box **a/f** checked but no treaty country/article.
- Name not matching passport spelling.
- Uncertified copies / non-acceptable ID document.
- P.O. box in the foreign address.
- Expired identification document.
- Unsigned form.
- Applicant already has an SSN / is eligible for one.
- ITIN requested for a non-tax purpose (ITIN is **tax-only**).
- Duplicate vs. renewal confusion.

---

## 10. Build-time checklist

- [ ] Current rev dates confirmed (W-7, iw7, 1915, 4757).
- [ ] Labels rendered verbatim.
- [ ] Reason box never auto-selected.
- [ ] Page 2 ("Acceptance Agent's Use ONLY") blank.
- [ ] Signature area blank — no e-signature.
- [ ] Disclaimers from `TAX-DISCLAIMERS.md` shown before download.
- [ ] Filing address re-verified.
