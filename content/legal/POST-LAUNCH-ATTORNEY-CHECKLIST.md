<!--
  INTERNAL DOCUMENT — not rendered in the product. Do not publish as user-facing copy.
  OPTIONAL counsel scope. Nothing here blocks launch — this is a menu of items to
  consider having a qualified professional review over time, by CEO decision.
-->

# Optional Counsel Review Checklist

**Status:** **optional / non-blocking.** The legal docs ship as-is by CEO decision. This file lists items a qualified professional *could* review over time and why — so nothing is silently forgotten. None of these gate launch.

**Reviewer (if you choose one):** licensed attorney (US) with privacy/DPO capability; where EU/UK users are served, also EU/UK-qualified counsel.

**Rule of thumb:** a missing clause is recoverable; a bad clause (void, illegal, or misleading) is not. Ship a clean, honest document, and have counsel look at the items below when it suits you — none of them is a launch gate.

---

## A. Items to consider (review when convenient — not launch blockers)

| # | Item | Where it matters | Why it is optional |
|---|---|---|---|
| 1 | **Arbitration clause + class-action waiver** | Terms §14 | Enforceability varies drastically by user country and can be **void or illegal** (notably in the EU). Must be drafted by counsel, not copied. A defective clause is worse than none. |
| 2 | **International transfer mechanism (SCCs and/or EU-US DPF) + Transfer Impact Assessment (TIA)** | Privacy §6.2 | Mechanism selection and the TIA are law- and fact-specific (Schrems II lineage). Cannot be finalized from a template; must stay current. |
| 3 | **Data Processing Agreements (DPAs) with every subprocessor** | Privacy §9 | Required by GDPR Art. 28 for each processor; each needs a signed, current DPA. Cannot be produced from a template alone. |
| 4 | **EU/UK representative + DPO appointment** | Privacy §13 | Appointment thresholds are fact-specific (e.g. systematic monitoring / large-scale special-category data). Requires an assessment. |
| 5 | **CCPA/CPRA "sale"/"share" mechanics and opt-out** | Privacy §4.5, §7.8 | Whether the Service is covered and the exact "Do Not Sell or Share" mechanics depend on counsel's coverage analysis. |
| 6 | **Age attestation wording** | Signup §6; Review-Copy §6 | The exact acknowledgment is the main evidence of informed consent; counsel should approve it, together with any COPPA / child-age rules. |
| 7 | **Jurisdiction-specific consumer overlays** | Terms §6, §7, §8, §14; Privacy §7 | Mandatory consumer-protection, warranty, and withdrawal rights differ per market and must be conformed per jurisdiction. |

---

## B. Other items counsel should confirm (carried over from the draft review)

1. **Governing-law / forum selection enforceability** against non-US users (Terms §14.1–14.2). We state Wyoming + Wyoming courts; counsel must confirm it binds foreign consumers or narrow it.
2. **Liability cap amount and scope** (Terms §7.2 — currently `the greater of fees paid in the prior 12 months or USD 100 [confirm]`). Caps are unenforceable in some jurisdictions and must be paired correctly with the warranty disclaimer.
3. **Warranty disclaimers** (Terms §6) conformed to mandatory consumer-protection law in each target market.
4. **Indemnification** (Terms §8) — may be unenforceable against consumers in the EU/UK and must be limited accordingly.
5. **Tool-vs-advice boundary** (Terms §2–4; TAX-DISCLAIMERS) — confirm the "self-help organizer / not advice" framing is sufficient for each market we sell into, and that no tax-preparation-software registration or license is required.
6. **Refund / withdrawal rights** (Terms §9) — EU 14-day right of withdrawal and processor terms, once paid plans launch.
7. **Breach-notification duties** (Privacy §10.2) — per-market timelines and formats.
8. **Retention schedule** (Privacy §5) — confirm the 7-year tax retention and the account/usage defaults against the jurisdictions served.
9. **Government-access / transparency claims** (Privacy §4.3) — any public statement must be accurate.
10. **Local privacy laws** (LGPD, PIPL, etc.) for markets we sell into.
11. **Translations** — any translated warning must carry the same legal meaning (Review-Copy §1–§6).

---

## C. Fill-ins for the CEO (supply before you publish)

| Token | Appears in | Notes |
|---|---|---|
| `[EFFECTIVE DATE — set at launch]` | ToS, Privacy | Set the real date at launch; do not back-date. |
| `[LAST UPDATED — set at launch]` | ToS, Privacy | Same as effective date at launch. |
| `[COMPANY LEGAL NAME]` | ToS (operator, indemnity), Privacy (controller, contact) | The legal entity name, exactly as registered. |
| `[CONTACT EMAIL]` | ToS (contact) | A monitored support/legal inbox. |
| `[PRIVACY CONTACT EMAIL]` | Privacy | A monitored privacy inbox. |
| `[BUSINESS ADDRESS]` | Privacy (controller) | Registered/business address. |
| `[confirm]` markers | ToS §7.2, §9.2, §14.2; Privacy §3.1, §5.2–5.3, §6.2, §9 | Defaults chosen conservatively; confirm or adjust. |
| `[CONFIRM ...]` markers | ToS §1.3; Privacy §9 (subprocessors), §13 (EU/UK reps) | Decisions the CEO/team must make. |

---

## D. Post-launch wiring (not legal, but required to publish)

1. **Rebuild + redeploy.** ToS and Privacy are imported at build time via `?raw`, so a rebuild is required to reflect content changes.
2. **Document versions.** Bump `TERMS_VERSION` / `PRIVACY_VERSION` in `src/react-app/lib/legal.ts` when the content changes, so the signup consent record points at the version the user actually accepted.
3. **Internal comment markers removed.** The `<!-- ... -->` notes were removed from ToS/Privacy (the renderer does not strip HTML comments, so they would have rendered as visible text). Keep new internal notes out of the rendered `.md` files.
