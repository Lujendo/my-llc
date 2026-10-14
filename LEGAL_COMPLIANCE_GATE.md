# LEGAL COMPLIANCE GATE — MANDATORY APPROVAL BEFORE SHIP

**Effective:** October 13, 2026  
**Enforced By:** Legal Team + CEO  
**Scope:** ALL dashboard features (frontend, backend, documents, calculations, forms)

---

## THE RULE (ABSOLUTE)

```
NO FEATURE SHIPS WITHOUT LEGAL SIGN-OFF

         Code Complete
               ↓
         Submit Review Package
               ↓
         Legal Review (2-3 days)
               ↓
    REJECTED ← APPROVED WITH DISCLAIMERS ← APPROVED
       ↓            ↓                           ↓
    Redesign    Add Warnings            SHIP IT
       ↓            ↓
    Resubmit    Retest
       ↓            ↓
      ↑ ─────────────┘
```

---

## LEGAL REVIEW PACKAGE (What To Submit)

**When:** Feature is code-complete (frontend + backend done, locally tested)

**Submit To:** Legal Team (legal-review@my-llc.dev)

**Package Contents:**

```markdown
# LEGAL REVIEW PACKAGE

## Feature
- [X] W-7 Form Generator
- Date submitted: Oct 20, 2026
- Assigned to: [Dev Lead Name]

## Description
Brief description of what the feature does and who uses it.

## Files Changed
- src/components/DocumentGenerator.tsx (Frontend)
- src/worker/routes/documents.ts (Backend)
- src/worker/services/documentService.ts (PDF generation)

## Tax/Legal Impact
- [ ] Generates US tax form (W-7)
- [ ] Provides treaty analysis
- [ ] Calculates tax amounts
- [ ] Makes legal claims (e.g., "You are a non-resident alien")
- [ ] Makes treaty-based recommendations
- [ ] Other: ________________

## Compliance Checklist
[Attach relevant checklist(s) filled out]
- [ ] Tax Forms Checklist (if generating forms)
- [ ] Treaty Analysis Checklist (if analyzing treaties)
- [ ] Calculation Checklist (if doing calculations)
- [ ] Entity Management Checklist (if managing entities)

## Disclaimer Language Shown to Users
[Copy exact text users will see]

Example:
```
LEGAL DISCLAIMER:
This tool is NOT a substitute for professional tax advice.
Review with a CPA/EA before filing.
```

## Test Cases (Including Edge Cases)
- [ ] Test: Single-member LLC (Andrea Lujendo scenario) → W-7 generated correctly
- [ ] Test: Multi-member LLC → Form shows correct number of members
- [ ] Test: User with foreign accounts → FBAR threshold warning shown
- [ ] Test: User with income spikes → Foreign tax credit calculated
- [ ] Test: Form submitted to IRS → User knows what to do next

## Risk Assessment
- [ ] Low risk (e.g., reminder notification)
- [ ] Medium risk (e.g., checklist task)
- [ ] HIGH RISK (e.g., tax form generation, treaty analysis, calculations)

If HIGH RISK, explain:
___________________________________________________________

## Approval Status
- [ ] PENDING (awaiting legal review)
- [ ] APPROVED
- [ ] APPROVED WITH DISCLAIMERS (add warnings: ________________)
- [ ] REJECTED (reason: ________________)

## Approved By
Name: ________________
Title: Legal Team Lead
Date: ________________
```

---

## REVIEW CHECKLIST BY FEATURE TYPE

### IF GENERATING TAX FORMS (W-7, 1040-NR, etc.)

```markdown
LEGAL REVIEW CHECKLIST — TAX FORMS

Feature: [Form Name]
Date: [Today]

[ ] Form matches current IRS version (2024/2025)
[ ] Current version checked: _____________
[ ] All required fields present in form
[ ] No missing fields that IRS requires
[ ] Pre-fill logic is 100% correct
    - Name: matches user profile
    - Address: matches user residency
    - Citizenship: matches selected country
    - Date of birth: matches user input (not calculated)
[ ] Instructions align with official IRS guidance
    - IRS Publication: ___________
    - Instructions dated: ________
[ ] Form works for non-resident aliens (your primary user)
    - [ ] German residents? YES
    - [ ] Italian residents? YES
    - [ ] Multi-member LLCs? TESTED
[ ] User is warned to review with CPA/EA before filing
[ ] User is warned form may be rejected if incorrect
[ ] No false claims about form acceptance rate
[ ] Disclaimers present before user starts form
[ ] Compliant with state law (if applicable)
    - State: Wyoming LLC
    - Compliance checked with: ___________

APPROVAL DECISION:
[ ] APPROVED
[ ] APPROVED WITH DISCLAIMERS (list: _______________)
[ ] REJECTED (reason: _______________)

Approved By: _________________ Date: _______
```

### IF ANALYZING TREATIES

```markdown
LEGAL REVIEW CHECKLIST — TREATY ANALYSIS

Feature: [Feature Name]
Date: [Today]

[ ] Treaty identified correctly
    - Treaty: ________________
    - Effective date: _______
    - Protocol applied: _______
[ ] Treaty articles referenced are current (as of Oct 2026)
    - Articles cited: ________________
    - Source (IRS/Treasury): ________________
[ ] Treaty interpretation is conservative
    - [ ] Errs on side of over-reporting (not under-reporting)
    - [ ] Flags all risks, even small ones
[ ] Foreign authority positions flagged
    - [ ] BZSt (Germany): Disregarded entity treatment flagged? YES
    - [ ] Other: ________________
[ ] Risk assessment ranges from "low" to "high"
    - Risk labeled correctly for user profile
[ ] Filing order recommendations match current guidance
    - [ ] Germany filing first: verified with German tax authority position
    - [ ] US filing second: verified with IRS guidance
    - [ ] Other: ________________
[ ] Disclaimer present: "Treaty interpretations change"
[ ] User warned to consult tax advisor
[ ] No promises of specific tax rates or savings
[ ] No guarantees about treaty benefits acceptance

APPROVAL DECISION:
[ ] APPROVED
[ ] APPROVED WITH DISCLAIMERS (list: _______________)
[ ] REJECTED (reason: _______________)

Approved By: _________________ Date: _______
```

### IF DOING TAX CALCULATIONS (FBAR, FATCA, Credits)

```markdown
LEGAL REVIEW CHECKLIST — TAX CALCULATIONS

Feature: [Feature Name]
Date: [Today]

[ ] Calculation formula is mathematically correct
    - Formula: ________________________
    - Verified by: ___________
[ ] Formula matches IRS guidance
    - Source publication: ____________
    - Verified date: ________
[ ] Thresholds match current rules (2026)
    - FBAR threshold: $10,000 USD
    - FATCA threshold: $200k (year-end) or $300k (any time)
    - Other: ________________
[ ] Currency conversions transparent
    - [ ] Exchange rate source disclosed (e.g., "XE.com on Oct 13, 2026")
    - [ ] Conversion method disclosed (e.g., "end-of-year rate")
[ ] Rounding rules documented
    - [ ] Rounding method disclosed (e.g., "round to nearest cent")
    - [ ] User can see intermediate steps
[ ] Edge cases handled correctly
    - [ ] Partial-year income: tested
    - [ ] Mid-year residency change: tested
    - [ ] Currency fluctuations: disclosed
    - [ ] Multiple accounts/assets: tested
[ ] No over-simplification that creates legal risk
    - Calculation shows limitations
    - Disclaimers warn about edge cases
[ ] Calculation results are auditable
    - User can see: inputs, formula, result
    - User can save/export calculation
[ ] Disclaimer present: "Calculations are estimates; verify with advisor"

APPROVAL DECISION:
[ ] APPROVED
[ ] APPROVED WITH DISCLAIMERS (list: _______________)
[ ] REJECTED (reason: _______________)

Approved By: _________________ Date: _______
```

### IF MANAGING ENTITIES (Operating Agreements, LLCs)

```markdown
LEGAL REVIEW CHECKLIST — ENTITY MANAGEMENT

Feature: [Feature Name]
Date: [Today]

[ ] Operating agreement complies with state law
    - State: Wyoming
    - Statute: Chapter 17-29 (Wyoming LLC Act)
    - Compliance verified by: ___________
[ ] All required provisions included
    - [ ] Name & registered agent
    - [ ] Management authority
    - [ ] Capital contributions
    - [ ] Distributions
    - [ ] Amendments
    - [ ] Dissolution
[ ] Template covers single-member LLCs (primary case)
    - [ ] Single-member tested
    - [ ] Multi-member possible: tested / not yet
[ ] User is warned this is NOT legal advice
    - [ ] Disclaimer appears before template
    - [ ] Disclaimer says "consult attorney for your situation"
[ ] User instructed to retain signed copy
    - [ ] Instructions clear about storage
    - [ ] Instructions mention: "keep with formation documents"
[ ] No false claims about legal validity
    - [ ] Template is guide, not guarantee
    - [ ] User responsible for accuracy
[ ] Tax treatment documented
    - [ ] Disregarded entity discussed
    - [ ] S-corp election option mentioned
    - [ ] Tax implications disclosed

APPROVAL DECISION:
[ ] APPROVED
[ ] APPROVED WITH DISCLAIMERS (list: _______________)
[ ] REJECTED (reason: _______________)

Approved By: _________________ Date: _______
```

---

## REJECTION SCENARIOS (Why Features Get Sent Back)

### REJECTED: Tax Form Missing Required Field
```
Feature: W-7 Form Generator
Reason: Form does not capture "Visa Number" (line 6c)

Issues:
1. IRS Form W-7 requires visa info for certain applicants
2. Your form skips this field entirely
3. Users with visas will file incomplete forms → IRS rejection

Fix Required:
- Add visa number input field
- Make it conditional: "Do you hold a US visa? [Yes/No]"
- If Yes, show visa type + number + expiration fields
- Resubmit for review

Timeline: 5 business days (blocking feature)
```

### REJECTED: Treaty Analysis Overstates Benefits
```
Feature: Treaty Analyzer for Germany
Reason: Claims disregarded entity gets treaty relief without flagging BZSt challenge

Issues:
1. BZSt is currently questioning treaty relief for disregarded entities (2026)
2. Your analysis implies relief is guaranteed
3. Users rely on this + face unexpected German taxes

Fix Required:
- Add prominent warning: "GERMAN TAX AUTHORITIES CURRENTLY CHALLENGING THIS POSITION"
- Show probability: "Relief is likely but not certain"
- Recommend professional review: "Consult German tax advisor"
- Resubmit for review

Timeline: 3 business days (blocking feature)
```

### REJECTED: Calculation Missing Edge Case
```
Feature: FATCA Asset Threshold Calculator
Reason: Does not handle mid-year asset acquisition

Issues:
1. FATCA triggers at $200k year-end OR $300k any time
2. Your calculation only checks year-end
3. User adds $350k in stocks mid-year → your tool misses threshold

Fix Required:
- Track highest balance during year (not just end balance)
- Show: "Highest balance: $350k (June 15) → FATCA filing required"
- Resubmit for review

Timeline: 5 business days (blocking feature)
```

---

## APPROVAL TIMELINE

### Standard Review (Medium/Low Risk)
```
Submitted Monday morning
  ↓ (2–3 business days)
Legal Review Complete
  ↓
Approved / Approved with Disclaimers / Rejected
  ↓ (If approved: ship immediately)
  ↓ (If rejected: fix + resubmit → 5 business days)
```

### Expedited Review (High Risk or Urgent)
```
Request expedited review (24-hour SLA)
Legal Lead drops other work
  ↓ (24 hours)
Urgent feedback provided
  ↓
Dev team acts immediately
  ↓ (48 hours)
Resubmit
  ↓
Final decision
```

---

## WHO APPROVES WHAT

| Feature Type | Approver | SLA |
|-------------|----------|-----|
| UI/Navigation | Dev Lead (no legal review) | 1 day |
| Documentation/Guides | Legal Lead | 2-3 days |
| Forms (W-7, Operating Agreement) | Legal Lead + Tax Advisor | 3-5 days |
| Treaty Analysis | Legal Lead + Tax Advisor | 5-7 days |
| Calculations (FBAR, FATCA) | Tax Advisor | 2-3 days |
| Entity Management | Legal Lead | 3-5 days |
| Disclaimers/ToS | External Attorney | 5-10 days |

---

## WORKFLOW INTEGRATION (Dev Team)

### Before You Start Coding
1. Tell Legal Team what you're building
2. Get preliminary feedback (avoids wrong direction)
3. Sketch plans for disclaimers/warnings

### After Code Is Done
1. Create Legal Review Package (use template above)
2. Attach relevant checklist(s)
3. Submit to legal-review@my-llc.dev
4. Get on legal team's calendar (3-5 day wait typical)

### While Waiting for Review
- DON'T commit to production yet
- DO test edge cases
- DO prepare deployment plan
- DO create rollback plan (if needed)

### When Approved
1. Update code with approved disclaimer language (verbatim)
2. Add comments linking to approval memo
3. Tag git commit: `[LEGAL-APPROVED-XXX]`
4. Merge to main branch
5. Deploy to production
6. Archive approval memo in compliance folder

---

## ESCALATION: What If You Disagree With Rejection?

### Process
1. Dev Lead presents counter-argument to Legal Lead (1-on-1 meeting)
2. If still disagreed: escalate to Legal Oversight Committee
3. Committee votes on feature approval (CEO has final say)
4. Decision documented in Escalation Log

### Example Escalation
```
Dev Lead: "Our FATCA calculation IS correct. Here's why:"
  - [Technical justification]
  - [IRS reference]

Legal Lead: "I understand, but [risk concern]"

Committee votes: 2-1 to APPROVE WITH DISCLAIMERS
  - Disclaimers list specific assumptions
  - User must confirm understanding

Result: Feature can ship IF disclaimers are added exactly as specified
```

---

## APPROVAL MEMO TEMPLATE (What Legal Returns to You)

```markdown
# APPROVAL MEMO

**Feature:** W-7 Form Generator  
**Submitted:** Oct 20, 2026  
**Approved:** Oct 23, 2026  
**Status:** APPROVED WITH DISCLAIMERS  
**Approved By:** [Legal Team Lead], [Tax Advisor]  

## Issues Found & Resolved
- [ ] Missing visa number field (FIXED)
- [ ] Disclaimer needed about form rejection risk (ADDED)
- [ ] Test case for multi-member LLC (ADDED)

## Required Disclaimers (Add to UI Exactly As Written)
```
IMPORTANT: This W-7 is a template only. You must review it
carefully and verify all information with your CPA or tax advisor
before submitting to the IRS. Incomplete or incorrect forms will
be rejected. This platform is not responsible for IRS rejections
or penalties resulting from user errors.
```

## Conditions of Approval
1. Disclaimer must appear BEFORE user starts form
2. Disclaimer must be in user's language (EN/DE/IT)
3. User must click "I understand" before proceeding
4. Form cannot be submitted from dashboard to IRS directly
5. User must print and mail manually (ensures human review)

## Approved Code
- src/components/DocumentGenerator.tsx
- src/worker/routes/documents.ts
- src/worker/services/documentService.ts

## Testing Verified
- Single-member LLC (Andrea Lujendo scenario)
- Multi-member LLC
- Non-resident alien from Germany
- Form exports correctly to PDF
- All fields match IRS Form W-7 (Rev. 12-2024)

## Ship Decision
**STATUS: READY TO SHIP**
- Disclaimers added to code? [Check before merge]
- Approval memo in compliance folder? [Archive after approval]
- Tag commit: [LEGAL-APPROVED-W7-OCT23]

---

Approved by:
[Signature] [Date]
Legal Team Lead

Review chain:
1. Dev team submitted package
2. Legal lead reviewed (Oct 20-23)
3. Tax advisor reviewed (Oct 21-23)
4. Committee approved (Oct 23)
5. Approved memo returned (Oct 23)
```

---

## ANNUAL COMPLIANCE AUDIT

Once per year, ALL approved features are re-reviewed:

```
Jan 2027: Annual Compliance Audit
  ├─ Check each feature against current IRS guidance
  ├─ Verify all forms still match current version
  ├─ Verify treaty analysis reflects current authority positions
  ├─ Check calculations against 2027 rules/thresholds
  └─ Document any changes needed

If changes found:
  ├─ Create fix tickets
  ├─ Deploy updates
  ├─ Update approval memo
  ├─ Notify users of changes
  └─ Archive new approval memo
```

---

## SUMMARY FOR CEO

**This gate exists to:**

Prevent bad forms from shipping → No IRS rejections  
Prevent bad treaty advice → No double taxation surprises  
Prevent calculation errors → No penalties for users  
Keep disclaimers strong → Liability protection for company  
Track all decisions → Audit trail for defense  
Catch law changes → Quarterly monitoring catches updates  

**It requires:**
- Legal team bandwidth (5-10 hours per feature)
- Tax advisor input (3-5 hours per feature)
- Attorney sign-off on disclaimers (one-time)
- E&O insurance (annual cost)

**It protects:**
- Users (from penalties, incorrect filings, double taxation)
- Company (from lawsuits, liability, regulatory fines)
- Product reputation (users trust this is correct)

---

**NO EXCEPTIONS. NO FEATURE SHIPS WITHOUT SIGN-OFF.**

