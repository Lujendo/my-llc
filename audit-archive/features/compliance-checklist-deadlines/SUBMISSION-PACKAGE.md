# Feature Legal Review Submission

**Feature Name:** Compliance Checklist & Deadline Content (Tasks + Deadlines dataset)
**Submitted By:** dev_backend (repo audit, 2026-10-13)
**Feature Type:** TIER 1 (US tax deadlines) with international content (Germany) — per AGENT-TEAM-EXECUTION-PLAN.md
**Complexity:** MEDIUM
**Assigned To:** federal_advisor_us (primary) · steuerberater_de (German content) · legal (disclaimer language)

---

## Feature Description

The only fully-functional, user-facing feature in the repo that makes tax/legal claims.
It renders a fixed task checklist and a deadline timeline for a foreign-owned US LLC.

**Where it lives (real, built):**
- Data (the actual claims): `src/react-app/data/sampleData.ts` — `SAMPLE_TASKS` (20 tasks) + `SAMPLE_DEADLINES` (6 deadlines)
- Checklist UI: `src/react-app/components/Checklist.tsx` (6 sections, progress bars, help modals)
- Timeline UI: `src/react-app/components/Timeline.tsx` (list + partial calendar view)
- Dashboard surfacing: `src/react-app/components/Dashboard.tsx` (compliance status, "next 30 days" deadlines)

**How it works today (truth):**
- Content is **hard-coded sample data**, served to every user, seeded into `localStorage` on first load.
- Task completion is stored per-entity in `localStorage` only.
- **Not** wired to the backend. The Hono API (`/api/tasks`, `/api/entities`) exists and is deployed to staging, but no frontend `fetch()` call exists (verified: zero network calls in `src/react-app`).
- Section label mismatch: UI uses section `"German"` (`Checklist.tsx` L10); DB schema `CHECK` allows `"Germany"` (`src/worker/db/schema.sql` L35). These never meet today because the frontend never touches the DB.

**Scope of this submission:** the *content* (task titles, instructions, deadlines, filing order) and its *presentation*. No calculation code exists.

---

## Tax/Legal Positions Claimed

Every claim below is shown to the user as fact. Each needs verification.

**Deadlines (exact dates asserted as authoritative):**
- "Mail W-7 to IRS" — 2026-10-20 (urgency HIGH)
- "Complete German Form" — 2026-11-15
- "FATCA Questionnaire" — 2026-12-01
- "German tax return due" — 2027-05-31
- "Form 1040-NR due" — 2027-06-15
- "Wyoming annual report due" — 2027-08-12

**Task instructions (asserted tax/legal positions):**
- "Apply for EIN with IRS Form SS-4" (EIN "if multi-member")
- "ITIN notice received from IRS (typically 7-10 weeks)"
- "Prepare blank 1040-NR form to submit with W-7"
- "Prepare Form 1040-NR for US tax filing"
- "Determine if Form 5472 is required"
- "Answer FBAR (FinCEN 114) questionnaire"
- "Answer FATCA (Form 8938) questionnaire"
- "Complete US-Germany treaty analysis"
- "Prepare German Steuererklärung (income tax return)"
- "Document foreign tax credit strategy"
- "File Articles of Organization with Wyoming Secretary of State"

**Structural claims implied by the UI:**
- Six compliance sections ("Formation, ITIN, Federal, German, Banking, Ongoing") are a complete and correct compliance lifecycle.
- Wyoming is the default/assumed state; the deadline "Wyoming annual report 2027-08-12" is asserted for a Wyoming LLC.
- The ordering/urgency (HIGH/MEDIUM/LOW) reflects real risk.

**Note:** `TreatyAnalyzer.tsx` makes a hardcoded treaty claim ("...Article 23 (Relief from Double Taxation)") but is **out of scope for this package** — see Blockers in the audit report; it is stub logic.

---

## User-Facing Disclaimers (EXACT strings from code)

**This is the complete set of legal-ish text in this feature.** There is **no** global disclaimer, **no** tax-advice disclaimer, and **no** professional-review checkbox anywhere in the codebase.

The only strings rendered by this feature:

1. `Checklist.tsx` line 215 (inside task "Help" modal only):
```
For detailed guidance, consult IRS publication or your tax advisor.
```

2. `Timeline.tsx` line 256-258 (inside deadline details modal only):
```
Set reminders in your calendar for this deadline. Consider marking this complete once filed.
```
(this is guidance, not a disclaimer — included for completeness)

Everything else shown by this feature is an **unqualified factual assertion**. No "not tax advice", no "consult a professional", no "may be rejected", no liability limitation, no acceptance gate.

---

## Edge Cases Handled

**Honest answer: none in code.** Items below are legal/tax edge cases the *content* must be correct for, but nothing branches on them:

- **Multi-member vs single-member LLC** — content says EIN "if multi-member" but presents it as a task for everyone; disregarded-entity vs partnership treatment not addressed.
- **State variance** — only Wyoming deadlines present; UI allows Delaware/Nevada/Florida entities (`EntityManager.tsx`) but shows Wyoming annual-report dates for all.
- **Formation date** — W-7 "within 30 days of formation" is implied; no logic derives the date from the entity's actual `formationDate`.
- **Leap year / timezone** — deadline day-math is naive (`new Date()` diff); no timezone handling (listed as an edge case to test in the execution plan).
- **Filing status / income existence** — 1040-NR and 5472 tasks are shown regardless of income; conditionality is instructional text only ("if income exists").
- **Home-country variance** — German content assumed; Italian/Canadian/etc. users get German tasks.

---

## Legal Questions for Reviewer

1. **Deadline accuracy:** Are the six asserted dates (esp. W-7 2026-10-20, German 2027-05-31, 1040-NR 2027-06-15, Wyoming annual report 2027-08-12) correct for a foreign-owned LLC formed 2024-06-15 in Wyoming, owned by a German resident? Are the urgency labels defensible?
2. **W-7 "within 30 days of formation":** Is this timing claim accurate/defensible, and does it apply to a pre-existing entity?
3. **Filing order:** The content implies German filing before US. Is that a defensible recommendation to present as fact, or must it be hedged?
4. **FBAR/FATCA framing:** Is presenting "Answer FBAR questionnaire" / "Answer FATCA questionnaire" without thresholds, forms, or the ">$10k" trigger misleading?
5. **5472:** Is a generic "assess if required" line sufficient, or does it understate the $25,000 penalty exposure?
6. **Wyoming-only deadlines for non-Wyoming entities:** What is the required disclaimer/conditionality, or is state-specific data mandatory before shipping?
7. **Disclaimer requirement:** What exact disclaimer and placement (before first render? before task completion? acceptance checkbox?) is required to make this educational-only vs. advice?
8. **Unlicensed-advice risk:** Does showing IRS deadlines, form names, and filing order constitute unlicensed tax/legal advice in any target jurisdiction (US/DE/IT)?
9. **Professional review checkbox:** Roadmap mandates a "professional review checkbox before form submission." It does not exist. What exact language/mechanism does legal require, and for which actions?
10. **Content staleness:** Who owns re-verifying these dates each tax year (the plan claims quarterly + annual review)?

---

## Status / Evidence

- **Build state:** REAL (functional UI) but **MOCK content** (hardcoded `sampleData.ts`, localStorage persistence).
- **No tests** exist for this or any feature (`find src -name "*.test.*"` → none).
- **Evidence paths:**
  - `src/react-app/data/sampleData.ts` (L4-216 tasks, L218-273 deadlines)
  - `src/react-app/components/Checklist.tsx`, `Timeline.tsx`, `Dashboard.tsx`
  - `src/worker/db/schema.sql` (section enum mismatch L35)
- **Related features deliberately NOT included** (nothing to review — UI stubs, no output):
  - W-7 generator — `DocumentGenerator.tsx` renders inputs; "Download PDF" is `alert("coming soon")`; preview is a placeholder.
  - Operating Agreement generator — hardcoded 3-line snippet in `DocumentGenerator.tsx`.
  - Treaty Memo — hardcoded text in `DocumentGenerator.tsx`.
  - Treaty Analyzer — `riskLevel = hasIncome ? "high" : "low"` only.
  - Professional review checkbox — does not exist.
