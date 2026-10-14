# MY-LLC Dashboard — Operating Agreement Templates

**Doc version:** 1.0 (MVP — Wyoming complete; DE/NV stubs)
**Effective:** 2026-10-13
**Author:** Entity Manager — MY-LLC Dashboard
**Statutory basis (verified 2026-10-13):** Wyoming Limited Liability Company Act, W.S. 17-29-101 *et seq.*; 6 Del. C. ch. 18; NRS ch. 86; Treas. Reg. §§ 301.7701-2, 301.7701-3, 1.6038A-1, 1.6038A-2; IRC § 6038A. See § 8 for source checks.

---

> # NOT LEGAL ADVICE — CONSIDER PROFESSIONAL REVIEW BEFORE SIGNING
>
> **Every operating agreement generated from these templates is a draft.** Using this
> template does **not** create an attorney–client relationship. The generator
> **prepares a document from the data you enter** — it does **not** review your facts,
> choose your structure, or confirm that the result is correct or enforceable.
>
> **Before anyone signs the generated document, consider having a licensed attorney**
> in the state of organization review the completed draft against the user's ownership,
> tax, and home-country facts. This is a recommendation, not a gate — the sections
> flagged **High priority** in § 4 are the ones where a wrong or missing term creates real exposure.
>
> Do **not** present the output as "ready to sign" or "attorney-approved." Present it as
> **"draft — review before signing."** The product logs this acknowledgment with a
> timestamp and template version (see `TAX-DISCLAIMERS.md`, Block 3).

---

## 1. How these templates are structured

Three layers so states can be added without rewriting the core:

| Layer | Contents | Changes per state? |
|---|---|---|
| **L1 — Common articles** | Purpose, capital, membership, distributions, books, transfer, amendment, indemnification, miscellaneous | **No** — boilerplate, reused verbatim |
| **L2 — State-specific articles** | Formation, name rules, registered agent, governing law, dissolution mechanics, statutory non-waivable clauses | **Yes** — one file per state |
| **L3 — Tax/treatment notes** | Educational federal notes (disregarded entity, filings) | **No** — federal, state-agnostic |

**Adding a state** = copy the L2 block, swap the statute cites and the 3–4 state-unique
terms (see § 7). L1 and L3 are unchanged. Do not fork the whole document.

### Placeholder convention

- `{{TOKEN}}` — merged from the entity record / user profile at generation time.
- A token with **no value** must **block generation** (never print a blank or a guess).
- `‹TODO-STATE›` — an intentional stub in an incomplete template. If present, the
  generator must refuse to output the document as "complete."

---

## 2. WYOMING — Single-Member LLC Operating Agreement (MVP, COMPLETE)

> **Status: COMPLETE draft.** Every article below is authored. **Consider professional review before signing.**

---

### OPERATING AGREEMENT OF {{LLC_NAME}}
### A Wyoming Limited Liability Company

This Operating Agreement (this **"Agreement"**) is adopted as of **{{EFFECTIVE_DATE}}** by
**{{MEMBER_NAME}}** (the **"Member"**), the sole member of **{{LLC_NAME}}**, a Wyoming
limited liability company (the **"Company"**), formed under the Wyoming Limited Liability
Company Act, W.S. 17-29-101 *et seq.* (the **"Act"**).

**RECITALS**

A. The Company was formed by the filing of Articles of Organization with the Wyoming
Secretary of State on **{{FORMATION_DATE}}**, File ID **{{FILE_ID}}**.

B. The Member owns 100% of the membership interests in the Company and is the Company's
sole member.

C. The Member wishes to adopt this Agreement to govern the Company's affairs, as permitted
by W.S. 17-29-110.

**NOW, THEREFORE,** the Member agrees as follows:

---

#### ARTICLE 1 — FORMATION, NAME, OFFICE, AGENT, PURPOSE

**1.1 Formation.** The Company was formed under the Act by the filing of Articles of
Organization with the Wyoming Secretary of State on **{{FORMATION_DATE}}**. The rights and
obligations of the Member are governed by the Act and this Agreement. *(W.S. 17-29-201.)*

**1.2 Name.** The name of the Company is **{{LLC_NAME}}**, which complies with W.S.
17-29-108(a) and contains the required words "limited liability company" or the
abbreviation "LLC" or "L.L.C." *(W.S. 17-29-108.)*

**1.3 Principal Office.** The principal office of the Company is
**{{PRINCIPAL_ADDRESS}}**. The Member may change the principal office at any time.

**1.4 Registered Office and Registered Agent.** The Company shall continuously maintain a
registered office and registered agent in Wyoming as required by W.S. 17-29-113 and the
registered agent statutes at W.S. 17-28-101 through 17-28-111. The initial registered
agent is **{{REGISTERED_AGENT}}**, and the registered office is
**{{REGISTERED_AGENT_ADDRESS}}**. *(W.S. 17-29-113; W.S. 17-29-201(b)(ii), (c).)*

**1.5 Term.** The Company's term is perpetual until it is dissolved and wound up under
Article 8.

**1.6 Purpose.** The Company is organized for any lawful purpose for which a limited
liability company may be formed under the Act. *[Generator option: insert a specific
purpose from {{PURPOSE}} if the user supplied one; otherwise use "any lawful purpose."]*

**1.7 Title to Assets.** All property acquired by the Company is owned in the Company's
name and not in the name of the Member.

**1.8 Limited Liability.** Except as required by the Act or by this Agreement, the Member
is not liable for the Company's debts, obligations, or liabilities solely by reason of
being a member. *(W.S. 17-29-304.)* **This clause does not shield the Member from their
own taxes, personal guarantees, fraud, or failure to respect the entity's separateness.**

---

#### ARTICLE 2 — THE MEMBER; MEMBERSHIP INTEREST

**2.1 Sole Member.** **{{MEMBER_NAME}}** is the sole member of the Company and owns 100%
of the membership interests.

**2.2 Member Information.**

| Field | Value |
|---|---|
| Member name | {{MEMBER_NAME}} |
| Address | {{MEMBER_ADDRESS}} |
| Country of citizenship | {{MEMBER_CITIZENSHIP}} |
| Country of tax residence | {{MEMBER_TAX_RESIDENCE}} |

**2.3 No Additional Members.** So long as this Agreement contemplates a single member, no
other person may be admitted as a member except by amending this Agreement under Article 9.

**2.4 Member Not an Agent (unless appointed).** Except as stated in Article 4, the Member
does not hold the Company out as bound by the Member's acts except in the Member's capacity
as contemplated in this Agreement. *(W.S. 17-29-402 — limits on apparent authority.)*

---

#### ARTICLE 3 — CAPITAL CONTRIBUTIONS

**3.1 Initial Contribution.** The Member has contributed or has agreed to contribute to the
Company: **{{CAPITAL_CONTRIBUTION}}**. *(W.S. 17-29-501 et seq.)*

**3.2 Additional Contributions.** The Member may, but is not obligated to, make additional
capital contributions. No additional contribution creates any right unless the Member
documents it.

**3.3 No Interest on Capital; No Withdrawal.** No interest accrues on any capital
contribution, and the Member has no right to withdraw or receive a return of capital
except as provided in Article 5 or on dissolution under Article 8.

---

#### ARTICLE 4 — MANAGEMENT

**4.1 Management by the Member.** The Company is **member-managed** within the meaning of
W.S. 17-29-102(a)(xiii). The Member has full and exclusive authority to manage the
Company's business and affairs and to bind the Company. *[Generator option: if the user
selects manager-managed, use § 4.6 instead.]* *(W.S. 17-29-407.)*

**4.2 Authority to Bind.** The Member may execute any document, contract, or instrument on
the Company's behalf and may open and operate bank accounts in the Company's name.

**4.3 Officers and Agents.** The Member may appoint officers or agents, delegate authority,
and set compensation. A delegation of authority does not remove the Member's management
rights unless this Agreement says so.

**4.4 Reimbursement.** The Company shall reimburse the Member for reasonable expenses
incurred on the Company's behalf.

**4.5 Duties; Good Faith and Fair Dealing.** The Member owes to the Company and to any
interest holders the contractual obligations of good faith and fair dealing that may not
be eliminated under W.S. 17-29-110(c)(v) and W.S. 17-29-409(d). Any other duties — including
the duty of loyalty and the duty of care — may be restricted as the Act permits, and are
restricted here to the fullest extent permitted by W.S. 17-29-110(c) and W.S. 17-29-409.

**4.6 Manager-Managed Option (only if selected).** The Company is manager-managed. The
manager is **{{MANAGER_NAME}}**, with the authority to manage the Company and bind it. The
Member retains the voting rights the Act reserves to members of a manager-managed company.
*(W.S. 17-29-407; W.S. 17-29-102(a)(xiii).)*

---

#### ARTICLE 5 — DISTRIBUTIONS

**5.1 Distributions.** The Member is entitled to all distributions of the Company's cash
and other property, at times and in amounts the Member determines.

**5.2 Tax Distributions.** Nothing obligates the Company to make distributions to cover the
Member's taxes, though the Member may cause the Company to do so.

**5.3 Limits on Distributions.** The Company shall not make a distribution if doing so
would render the Company unable to pay its debts as they become due in the ordinary
course, or would exceed the fair value of the Company's assets over its liabilities, as
provided in the Act. A distribution made in violation of this limit must be returned.
*(W.S. 17-29-405; W.S. 17-29-406.)*

---

#### ARTICLE 6 — BOOKS, RECORDS, AND ACCOUNTING

**6.1 Books and Records.** The Company shall keep complete books and records of account and
a copy of its Articles of Organization, this Agreement, tax returns, and the Member's
written records. *(W.S. 17-29-410 — member's right to information; W.S. 17-29-209(e) —
records retention for the annual report.)*

**6.2 Fiscal Year.** The Company's fiscal year is the calendar year, unless the Member
selects otherwise.

**6.3 Bank Accounts.** Company funds shall be kept in accounts in the Company's name,
separate from the Member's personal funds.

**6.4 Reports.** The Member may prepare financial reports at any time. No separate periodic
reporting is required in a single-member company.

**6.5 Tax Classification.** The Member intends the Company to be classified as a
**disregarded entity** for U.S. federal income tax purposes, unless it makes or has made an
election under Treas. Reg. § 301.7701-3 to be classified otherwise. The Member may cause
the Company to make or revoke tax elections and to file required returns and reports.
**See § 6 below — this clause is educational and is not tax advice.**

**6.6 Annual Report.** The Company shall file its annual report and pay the annual license
fee with the Wyoming Secretary of State on or before the first day of the month of the
Company's organization each year. *(W.S. 17-29-209. Fee: $60.00 or $0.0002 of Wyoming
assets, whichever is greater — W.S. 17-29-209(a). Verify the current amount at filing.)*
The Company's next due date is **{{NEXT_ANNUAL_REPORT_DUE}}**, amount **{{ANNUAL_REPORT_FEE}}**.

---

#### ARTICLE 7 — TRANSFER OF MEMBERSHIP INTERESTS

**7.1 Restriction on Transfer.** The Member may not transfer all or part of the membership
interest except (a) to a trust or entity wholly controlled by the Member, (b) by will or
operation of law on death, or (c) with a written amendment under Article 9. Any other
purported transfer is void. *(W.S. 17-29-110(a)(vi) — transferability is governed by the
operating agreement.)*

**7.2 Effect of a Permitted Transfer.** A transferee receives only the transferor's rights
to distributions and allocations (a "transferable interest") and does **not** become a
member with management rights unless admitted under Article 9. *(W.S. 17-29-102(a)(xxiv).)*

**7.3 No Transfer Creating a Second Member.** No transfer may be made that would result in
more than one member, except by an amendment under Article 9 that converts this to a
multi-member agreement.

---

#### ARTICLE 8 — DISSOLUTION AND WINDING UP

**8.1 Events of Dissolution.** The Company dissolves on the first of: (a) the Member's
written election to dissolve; (b) the sale or disposition of all or substantially all the
Company's assets; (c) an event that terminates the Member's membership, unless the Company
continues under the Act; or (d) a decree of dissolution by a court in the circumstances
the Act specifies. *(W.S. 17-29-701.)*

**8.2 Winding Up.** On dissolution, the Company shall wind up its affairs: it shall cease
business except as needed to wind up, collect assets, and sell or distribute property.
*(W.S. 17-29-702.)*

**8.3 Distribution of Assets.** On winding up, assets are applied in this order:
(1) to creditors, including members who are creditors; (2) to any reserves the Member
reasonably sets for contingent liabilities; (3) to the Member. *(W.S. 17-29-708.)*
**Distributing assets without first paying or providing for creditors creates personal
exposure — a lawyer must confirm the wind-up order.**

**8.4 Filings.** The Company shall file Articles of Dissolution with the Wyoming Secretary
of State and obtain any certificate of cancellation. *(W.S. 17-29-702; W.S. 17-29-705 et
seq.)*

---

#### ARTICLE 9 — AMENDMENT

**9.1 Amendment.** This Agreement may be amended only by a written instrument signed by the
Member. *(W.S. 17-29-110(a)(iv) — the operating agreement governs its own amendment.)*
An amendment is effective when signed, unless it states a later date.

**9.2 No Oral Amendment.** No oral amendment is effective.

---

#### ARTICLE 10 — INDEMNIFICATION AND EXCULPATION

**10.1 Indemnification.** The Company shall indemnify the Member (and any manager or
officer) against expenses, judgments, and amounts paid in settlement reasonably incurred in
connection with the Company's business, except for conduct that is fraud, willful
misconduct, or a knowing violation of law, or a transaction from which the person received
an improper personal benefit. *(W.S. 17-29-408.)*

**10.2 Exculpation.** To the fullest extent the Act permits, the Member is not liable to
the Company for any act or omission as a member, except as stated in § 10.1. **This does
not eliminate the non-waivable good faith and fair dealing obligation under W.S.
17-29-110(c)(v).**

---

#### ARTICLE 11 — MISCELLANEOUS

**11.1 Governing Law.** This Agreement is governed by, and shall be construed under, the
laws of the State of Wyoming. *(W.S. 17-29-106 — the Act's internal-affairs choice of law
may not be varied.)*

**11.2 Entire Agreement.** This Agreement, together with the Articles of Organization, is
the entire agreement of the Member concerning the Company and supersedes any prior
agreement.

**11.3 Severability.** If any provision is held invalid, the rest remains in effect.

**11.4 Notices.** Notices to the Member go to **{{MEMBER_ADDRESS}}** or
**{{NOTICE_EMAIL}}**. Notices to the Company go to the principal office.

**11.5 Counterparts and Electronic Signature.** This Agreement may be signed in
counterparts and by electronic signature. *(W.S. 17-29-102(a)(xix) — "sign" includes
electronic signature.)*

**11.6 No Third-Party Beneficiaries.** Except as stated in Article 10, this Agreement
creates no rights for anyone other than the Member and the Company.

**11.7 Conflict.** If this Agreement conflicts with the Articles of Organization, the
Articles control as to matters the Act requires the Articles to contain; this Agreement
controls as to all other matters. *(W.S. 17-29-110.)*

---

**IN WITNESS WHEREOF,** the undersigned adopts this Operating Agreement as of the date
first written above.

**MEMBER:**

Signature: ____________________________
Name: {{MEMBER_NAME}}
Title: Sole Member
Date: {{SIGNATURE_DATE}}

**ACKNOWLEDGMENT — NOT REVIEWED BY COUNSEL**
> I understand this is a **draft operating agreement** and that a licensed attorney
> should review it before I sign. *Logged at: [timestamp] · Template version: [v1.0]*

---

## 3. Placeholder → data-source mapping

Source of truth: the **entity record** (see the Entity Record template in the
`entity-structure` skill) plus the **user profile**. The generator must not guess.

| Placeholder | Meaning | Source | Required? | If missing |
|---|---|---|---|---|
| `{{LLC_NAME}}` | Legal name of the LLC | Entity record: `ENTITY` | Yes | **Block** |
| `{{STATE}}` | State of organization | Entity record: `STATE` | Yes | **Block** (selects template) |
| `{{FILE_ID}}` | State file number | Entity record: `FILE ID` | Yes | **Block** |
| `{{FORMATION_DATE}}` | Date Articles filed / effective | Entity record: `FORMED` | Yes | **Block** |
| `{{EFFECTIVE_DATE}}` | Date the OA takes effect | User input (default = formation date) | Yes | Default to `FORMATION_DATE` |
| `{{MEMBER_NAME}}` | Sole member's legal name (as on ID) | User profile | Yes | **Block** |
| `{{MEMBER_ADDRESS}}` | Member's address | User profile | Yes | **Block** |
| `{{MEMBER_CITIZENSHIP}}` | Member's country of citizenship | User profile | Yes | **Block** (drives flags) |
| `{{MEMBER_TAX_RESIDENCE}}` | Member's country of tax residence | User profile | Yes | **Block** (drives flags) |
| `{{REGISTERED_AGENT}}` | Registered agent name | Entity record: `REGISTERED AGENT` | Yes | **Block** |
| `{{REGISTERED_AGENT_ADDRESS}}` | RA physical street address | Entity record: RA address (verify physical) | Yes | **Block** |
| `{{PRINCIPAL_ADDRESS}}` | Principal office | Entity record: `PRINCIPAL ADDRESS` | Yes | **Block** |
| `{{CAPITAL_CONTRIBUTION}}` | Initial contribution | User input | No | "as recorded on the Company's books" |
| `{{PURPOSE}}` | Specific business purpose (optional) | User input | No | "any lawful purpose" |
| `{{MANAGER_NAME}}` | Manager name (manager-managed only) | User input | Conditional | N/A if member-managed |
| `{{NOTICE_EMAIL}}` | Notice email | User profile | No | Fall back to `MEMBER_ADDRESS` |
| `{{NEXT_ANNUAL_REPORT_DUE}}` | Next WY report due date | Entity record: `NEXT ANNUAL REPORT DUE` | Yes | **Block** |
| `{{ANNUAL_REPORT_FEE}}` | Current license fee | Entity record: `FEE` | Yes | "see W.S. 17-29-209(a)" |
| `{{SIGNATURE_DATE}}` | Signing date | User input | Yes | Default to generation date |

**Generator rules**
- Any **required** placeholder that is empty → refuse to generate, show which field is missing.
- `{{STATE}}` selects the L2 (state-specific) block. Today only `WY` is complete.
- If the chosen state's template contains `‹TODO-STATE›`, the generator must label the
  output **INCOMPLETE** and either block it or add the banner `DRAFT — INCOMPLETE TEMPLATE`.
- Never infer citizenship from address, nor vice versa.

---

## 4. Legal-sufficiency notes — what to review carefully

The banner in § 0 covers the whole document. These are the sections where a defect is
**load-bearing**.

| # | Section | Risk if wrong | Review level |
|---|---|---|---|
| 1 | **Art. 1.1–1.4** Formation / name / RA | Wrong formation date or non-compliant RA address → the OA references a company that isn't validly formed, or an RA that violates W.S. 17-29-113. | **High priority** |
| 2 | **Art. 4** Management / authority | Wrong management structure changes who can bind the company and who owes duties. | **High priority** |
| 3 | **Art. 5.3** Distribution limits | Distribution while insolvent can be clawed back and creates personal liability. | **High priority** |
| 4 | **Art. 6.5** Tax classification | Classification drives every federal filing obligation. Must match the EIN application and any Form 8832 already filed. | **High priority** |
| 5 | **Art. 7** Transfer restrictions | A defective restriction may be unenforceable, or may fail to prevent a second member. | **High priority** |
| 6 | **Art. 8.3** Winding-up waterfall | Paying members before creditors = personal exposure under the Act. | **High priority** |
| 7 | **Art. 10** Indemnification / exculpation | Over-broad exculpation may be void under W.S. 17-29-110(c); under-broad may expose the member. | Review |
| 8 | **Art. 11.1** Governing law | If the Act's internal-affairs choice of law is varied, the clause is void. | Review |
| 9 | **Signature block** | Must be executed by the correct party in the correct capacity. | Review |
| 10 | **Purpose (Art. 1.6)** | An overly narrow purpose can invalidate acts; an overly broad one may affect licensing. | Review |
| 11 | **Boilerplate (Art. 2, 3, 11.2–11.7)** | Low risk, but still unreviewed. | Low |

**Product implication.** The "download" button carries the `DRAFT — REVIEW BEFORE SIGNING`
label and the § 0 banner travels with every generated copy (also inside the PDF/DOCX, not
only on screen). Consider having a licensed attorney review the template over time.

---

## 5. State-extension model (how to add a state)

Each state file supplies only these **L2 slots**. L1 and L3 are shared.

| Slot | Wyoming answer | What a new state must supply |
|---|---|---|
| Formation statute & mechanics | W.S. 17-29-201 (file Articles of Organization) | Cite + filing mechanic |
| Name statute | W.S. 17-29-108 (must contain LLC/L.L.C.) | Name rule |
| Registered agent statute | W.S. 17-29-113 + W.S. 17-28-101 *et seq.* | Cite + physical-address rule |
| Non-waivable provisions list | W.S. 17-29-110(c) | Cite the state's list |
| Governing-law / internal affairs | W.S. 17-29-106 | Cite |
| Distribution limit | W.S. 17-29-405/406 | Cite |
| Dissolution & wind-up | W.S. 17-29-701, -702, -708 | Cite |
| Annual report / fee | W.S. 17-29-209 (first day of formation month) | Cite + due date + fee |
| Series LLC available? | Yes (W.S. 17-29-1001 *et seq.*) | Yes/No |
| Default management | Member-managed | Default |

**Selection logic:** `{{STATE}}` → load L2 for that state → merge. Unsupported state →
do not silently fall back to Wyoming.

---

## 6. Federal treatment note — single-member LLC with a foreign owner (educational, not advice)

> **This section is general information. It is not tax advice and it is not a
> recommendation for any person's facts. Tax treatment depends on the owner's country,
> residency, and activity. Route any specific question to a licensed CPA, Enrolled Agent,
> or tax attorney.**

**Default classification.** A domestic LLC with a single owner is, by default,
**disregarded as an entity separate from its owner** for U.S. federal income tax purposes.
*(Treas. Reg. § 301.7701-2(a); § 301.7701-3(b)(1)(ii).)* The owner reports the LLC's items
on the owner's own return. The LLC may instead elect to be taxed as a corporation by filing
**Form 8832** (entity classification election). *(Treas. Reg. § 301.7701-3(c).)*

**S-corporation is not available.** An S-corporation election requires all shareholders to
be U.S. individuals (or certain eligible estates and trusts). A **non-resident-alien owner
cannot hold S-corporation stock**, so an S election is unavailable to this structure.
*(IRC § 1361(b)(1)(B)–(C).)* This is a fact of the rule, not a cost trade-off.

**A disregarded entity is not ignored for all filing purposes.** A **foreign-owned U.S.
disregarded entity** is treated as a separate entity and classified as a domestic
corporation **for the limited purposes of the section 6038A reporting rules**. That means,
when it has reportable transactions with a related party, it must file **Form 5472** —
attached to a **pro forma Form 1120** — and maintain related records.
*(Treas. Reg. § 1.6038A-1(c)(1) (T.D. 9796); Treas. Reg. § 1.6038A-2; see the Form 5472
instructions.)* **Failing to file Form 5472 when due carries a $25,000 penalty, with more
if the failure continues after IRS notice.** *(IRC § 6038A(d); Treas. Reg. § 1.6038A-4.)*

**What this document does and does not do.** This Operating Agreement does not determine
the LLC's tax classification, does not elect one, and does not decide whether any filing is
due. Those follow from the owner's facts and the returns actually filed. **The generator
must not tell the user their tax result.** It may state the default rule and point to a
professional.

**Home-country note.** The owner's country of residence may also tax the LLC's income or
treat the entity differently from the U.S. (for example, as a controlled foreign
corporation or a transparent entity). That analysis is outside this document. Flag it and
route to an adviser — see § 7.

---

## 7. Jurisdiction & structure risks — MENU for foreign single-member LLCs

These are **flags**, not conclusions. Each is routed to a licensed professional.

| # | Risk | Why it matters | Route to |
|---|---|---|---|
| J1 | **S-corp unavailable** to a non-resident owner | Rules out an entire structure; doing it anyway is invalid | CPA / tax attorney |
| J2 | **Form 5472 + pro forma 1120** for foreign-owned disregarded entity | $25,000 penalty if missed; commonly overlooked because the entity is "disregarded" | CPA |
| J3 | **No EIN / ITIN** | Cannot file 5472, open a bank account, or make elections | CPA |
| J4 | **Doing business in another state without foreign qualification** | Fines, taxes, and loss of limited liability in that state | Entity counsel |
| J5 | **Registered agent not a physical address** | Some states now prohibit virtual-office/mail-forwarding RAs — entity can be invalidated or fined | Entity counsel |
| J6 | **Commingling / no separate bank account** | Piercing the liability shield — the single biggest self-inflicted wound | Attorney |
| J7 | **Home country treats the LLC as a CFC or as transparent** | Double taxation or unexpected home-country filing | Adviser in the owner's country |
| J8 | **Permanent establishment / branch** if operations occur abroad | A branch is not a separate entity; it can create a PE | International tax adviser |
| J9 | **Missing the annual report** (Wyoming: first day of formation month) | Administrative dissolution → reinstatement cost and delay | Entity manager (internal) |
| J10 | **"Ready to sign" claim** | Unreviewed template held out as attorney-approved = misleading and risky | Product / legal |

**Escalation rule for the product:** if any of J1–J8 applies to the user's facts, the
generator should surface a plain-English flag and the "talk to a professional" CTA — **not**
attempt to resolve it.

---

## 8. Sources checked (2026-10-13)

- **W.S. 17-29-101 *et seq.*** (Wyoming LLC Act) — operating agreement scope and
  non-waivable limits (17-29-110); formation/articles (17-29-201); name (17-29-108);
  registered office/agent (17-29-113; 17-28-101 *et seq.*); annual report and license fee
  (17-29-209, 17-29-210); definitions (17-29-102).
  Source: Wyoming Secretary of State, *Wyoming LLC Act* PDF; Wyoming Legislature statutes.
- **6 Del. C. ch. 18** — "limited liability company agreement" definition, including the
  single-member enforceability rule (§ 18-101(9)). Source: Delaware Code Online.
- **NRS ch. 86** — "operating agreement" definition (NRS 86.101); adoption and amendment
  (NRS 86.286). Source: Nevada Legislature, NRS-086.
- **Treas. Reg. §§ 301.7701-2, 301.7701-3**; **§§ 1.6038A-1, 1.6038A-2**; **IRC § 6038A**;
  **IRC § 1361** — disregarded entity, check-the-box election, foreign-owned DE reporting,
  S-corp eligibility. Sources: IRS Form 5472 instructions (Rev. 12/2024); eCFR;
  govinfo CFR.
- **FinCEN BOI:** the requirement for **US domestic entities** was removed effective
  August 2026. **The group is compliant by doing nothing** on that point. Verify at
  fincen.gov before acting — this area has moved repeatedly.

> **Verify before relying.** Fees, due dates, and penalties change. Confirm the Wyoming
> annual-report amount and date at the Secretary of State before filing, and confirm the
> § 6038A penalty amount against the current Form 5472 instructions.

---

## 9. DELAWARE — Single-Member LLC Operating Agreement — **INCOMPLETE (STUB)**

> **Status: INCOMPLETE. ‹TODO-STATE› markers below are not authored.**
> **Do NOT ship this as a finished document. Do NOT present as ready to sign.**
> A Delaware attorney should author the missing sections before this template is used.

**Why Delaware differs (verified):**
- The governing document is the **"limited liability company agreement"**; a
  single-member agreement is expressly **not unenforceable merely because there is one
  party**. *(6 Del. C. § 18-101(9).)*
- Delaware allows **oral or implied** agreements under the statute; this product should
  still **require a written, signed** agreement.
- Delaware has a **franchise tax** with a stated maximum and an annual report; the
  calculation differs from Wyoming's flat license tax. **‹TODO-STATE: cite current
  6 Del. C. § 18-1105 / franchise-tax section and the current amount; do not use memory.›**

**Skeleton (L2 slots to author):**

| Article | Delaware status |
|---|---|
| Formation & cite | ‹TODO-STATE: cite 6 Del. C. § 18-201 / § 18-202› |
| Name rule | ‹TODO-STATE: cite § 18-102› |
| Registered agent | ‹TODO-STATE: cite § 18-104 + physical-address rule› |
| Non-waivable provisions | ‹TODO-STATE: cite § 18-1101(c)–(e)› |
| Governing law / internal affairs | ‹TODO-STATE: cite § 18-1101› |
| Distributions limit | ‹TODO-STATE: cite § 18-607› |
| Dissolution & wind-up | ‹TODO-STATE: cite § 18-801, § 18-804› |
| Annual report / franchise tax | ‹TODO-STATE: cite § 18-1105; current fee› |
| Series LLC | Available (Subchapter VI) — ‹TODO-STATE› |
| L1 common articles | **Reuse from Wyoming verbatim** |

**Delaware-specific risk flag:** Delaware **prohibits virtual-office/mail-forwarding
registered agents**. Confirm the RA holds a genuine physical Delaware address.
**‹TODO-STATE: cite the amended § 18-104 language.›**

---

## 10. NEVADA — Single-Member LLC Operating Agreement — **INCOMPLETE (STUB)**

> **Status: INCOMPLETE. ‹TODO-STATE› markers below are not authored.**
> **Do NOT ship as finished. Do NOT present as ready to sign.**

**Why Nevada differs (verified):**
- A Nevada LLC **may, but is not required to, adopt** an operating agreement. It may be
  adopted **by the sole member** and may be adopted **before, at, or after** formation.
  *(NRS 86.286; NRS 86.101.)*
- If the agreement sets its own amendment procedure, it may be amended **only** that way,
  and any other attempt is **void**. *(NRS 86.286(1).)*

**Skeleton (L2 slots to author):**

| Article | Nevada status |
|---|---|
| Formation & cite | ‹TODO-STATE: cite NRS 86.151 / 86.201 filing› |
| Name rule | ‹TODO-STATE: cite NRS 86.171/86.179› |
| Registered agent | ‹TODO-STATE: cite NRS 86.231 + physical-address rule› |
| Non-waivable provisions | ‹TODO-STATE: cite NRS 86.286(7)–(9)› |
| Governing law | ‹TODO-STATE: cite NRS 86.010 / 86.286› |
| Distributions limit | ‹TODO-STATE: cite NRS 86.341› |
| Dissolution & wind-up | ‹TODO-STATE: cite NRS 86.445 et seq.› |
| Annual list / fee | ‹TODO-STATE: cite NRS 86.263; current fee› |
| Series LLC | Available (NRS 86.296) — ‹TODO-STATE› |
| L1 common articles | **Reuse from Wyoming verbatim** |
| Amendment clause | **Must mirror NRS 86.286(1)** or an attempted amendment is void — ‹TODO-STATE› |

**Nevada-specific risk flag:** the **amendment clause is self-locking** under NRS 86.286(1);
get the wording exactly right before publishing. **‹TODO-STATE: attorney-author this.›**

---

## 11. Change log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-10-13 | Wyoming SMA authored; DE/NV stubs; mapping, review notes, tax note | Entity Manager |

**Open items for counsel (optional, non-blocking):**
- [ ] Optional attorney review of the Wyoming template (§ 4 review list).
- [ ] Author Delaware and Nevada L2 blocks; replace every `‹TODO-STATE›`.
- [ ] Confirm current WY license fee and annual-report date at the Secretary of State.
- [ ] Confirm current § 6038A penalty figure against the live Form 5472 instructions.
- [ ] Product posture: download carries the `DRAFT — REVIEW BEFORE SIGNING` label and
      the banner travels with every copy. *(Never block outright — the user came for a
      document.)*
