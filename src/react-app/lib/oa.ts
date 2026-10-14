// LLC Operating Agreement — validation + PDF generator (Wyoming single-member).
//
// Content source of truth (do not invent):
//   content/OPERATING-AGREEMENT-TEMPLATES.md  (§2 WY complete; §3 mapping; §4 review)
//   content/legal/REVIEW-CHECKBOX-COPY.md     (§1 checkbox; §3 entity-creation disclaimer)
//   content/TAX-DISCLAIMERS.md                (Block 1 global; Block 4 entity formation)
//
// Unlike the W-7 (a government form the IRS owns), the Operating Agreement is OUR
// document, so we emit the complete agreement — with the mandated DRAFT banner drawn
// INSIDE the file on every page, never only on screen.
//
// ponytail: self-contained by design, mirroring w7.ts — it only imports the shared
// already-tested copy/pdfText from w7.ts (allowImportingTsExtensions is on, so the
// relative "./w7.ts" import resolves under Node's type-stripping too). Everything else
// is local so `node oa-smoke.mjs` can import this file directly.

import {
  pdfText,
  DISCLAIMER_VERSION,
  GLOBAL_TAX_DISCLAIMER,
  REVIEW_CHECKBOX_LABEL,
  REVIEW_CHECKBOX_SUPPORT,
} from "./w7.ts";

// ---------------------------------------------------------------------------
// User-facing copy. Banner + entity disclaimer are verbatim from the source docs;
// the checkbox is the exact W-7 gate copy (REVIEW-CHECKBOX-COPY.md §1), reused so
// the gate can never drift between generators. Do not soften.
// ---------------------------------------------------------------------------

export const OA_SUPPORTED_STATES = ["WY"] as const;

// entity_manager instruction + template §4: this label must travel with every copy.
export const DRAFT_BANNER = "DRAFT - HAVE A LAWYER REVIEW";
export const DRAFT_BANNER_LONG = "DRAFT - HAVE A LAWYER REVIEW. NOT REVIEWED BY COUNSEL. NOT LEGAL ADVICE.";

// REVIEW-CHECKBOX-COPY.md §3 — entity creation disclaimer (verbatim).
export const ENTITY_CREATION_DISCLAIMER =
  "Creating an LLC is a legal act. This tool helps you organize information and prepare documents. It does not give legal, tax, or accounting advice, and it does not create a lawyer-client relationship. Rules differ by state and by your country. Consult a qualified professional before forming or operating an LLC.";

// TAX-DISCLAIMERS.md Block 4 — entity formation disclaimer (verbatim).
export const ENTITY_FORMATION_DISCLAIMER =
  "Forming an LLC or a corporation has tax and legal consequences that depend on your country of residence, your tax residency, and who owns the entity. A US LLC is not automatically tax-free or private, and forming one does not by itself reduce your taxes. Depending on your facts, you may have US filing duties (for example, obtaining an ITIN / filing a US return, or filing Form 5472 with a $25,000 penalty if missed), and you may also have duties in your home country. We do not choose an entity, a tax classification, or a jurisdiction for you, and we do not file anything. Get advice from a CPA or Enrolled Agent, and - where relevant - a lawyer in your country, before you form or operate an entity.";

// OPERATING-AGREEMENT-TEMPLATES.md §2 — document acknowledgment (verbatim intent).
export const OA_ACKNOWLEDGMENT =
  "I understand this is a draft operating agreement and that a licensed attorney should review it before I sign.";

// ---------------------------------------------------------------------------
// Inputs (entity record + user profile + the few fields the records don't hold)
// ---------------------------------------------------------------------------

export type OAManagement = "member" | "manager";

export interface OAInputs {
  // Entity record
  llcName: string;
  state: string; // "WY"
  fileId: string;
  formationDate: string; // YYYY-MM-DD
  principalAddress: string;
  registeredAgent: string;
  registeredAgentAddress: string;
  nextAnnualReportDue: string; // YYYY-MM-DD
  annualReportFee: string; // optional
  membersCount: number;
  // Member profile
  memberName: string;
  memberAddress: string;
  memberCitizenship: string;
  memberTaxResidence: string;
  noticeEmail: string; // optional
  // Optional / defaulted
  effectiveDate: string; // default = formation date
  capitalContribution: string; // default = "as recorded on the Company's books"
  purpose: string; // default = "any lawful purpose"
  management: OAManagement; // default = member-managed
  managerName: string; // required iff management === "manager"
  signatureDate: string; // default = generation date
}

export const emptyOA = (): OAInputs => ({
  llcName: "",
  state: "WY",
  fileId: "",
  formationDate: "",
  principalAddress: "",
  registeredAgent: "",
  registeredAgentAddress: "",
  nextAnnualReportDue: "",
  annualReportFee: "",
  membersCount: 1,
  memberName: "",
  memberAddress: "",
  memberCitizenship: "",
  memberTaxResidence: "",
  noticeEmail: "",
  effectiveDate: "",
  capitalContribution: "",
  purpose: "",
  management: "member",
  managerName: "",
  signatureDate: "",
});

// ---------------------------------------------------------------------------
// Validation (OPERATING-AGREEMENT-TEMPLATES.md §3 required/optional mapping)
// ---------------------------------------------------------------------------

export interface OAValidation {
  errors: string[];
  warnings: string[];
}

export function parseIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || "").trim());
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const da = +m[3];
  const d = new Date(Date.UTC(y, mo - 1, da));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== da) return null;
  return d;
}

const PO_BOX = /(^|\s)(p\.?\s*o\.?\s*box|post\s+office\s+box|postfach)/i;

function requiredDate(v: string, msg: string, errors: string[]) {
  if (!v || !v.trim()) errors.push(msg);
  else if (!parseIsoDate(v)) errors.push(msg.replace(/ is required\.?$/, "") + " must be a real date.");
}

export function validateOA(d: OAInputs): OAValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const req = (v: string, msg: string) => {
    if (!v || !String(v).trim()) errors.push(msg);
  };

  const state = (d.state || "").trim().toUpperCase();
  if (!OA_SUPPORTED_STATES.includes(state as (typeof OA_SUPPORTED_STATES)[number])) {
    errors.push(`Operating Agreement generation is only available for Wyoming (WY). ${state || "This state"} is coming soon - no incomplete document will be produced.`);
  }
  if (Number(d.membersCount) !== 1) {
    errors.push("This template is a single-member LLC operating agreement. Multi-member agreements are not available yet.");
  }

  req(d.llcName, "LLC legal name is required (must match the Articles of Organization).");
  req(d.fileId, "Wyoming file ID is required (from the filed Articles of Organization).");
  req(d.principalAddress, "Principal office address is required.");
  req(d.registeredAgent, "Registered agent name is required.");
  req(d.registeredAgentAddress, "Registered agent street address is required.");
  req(d.memberName, "Member legal name is required (as it appears on your ID).");
  req(d.memberAddress, "Member address is required.");
  req(d.memberCitizenship, "Member country of citizenship is required (never inferred from the address).");
  req(d.memberTaxResidence, "Member country of tax residence is required.");

  requiredDate(d.formationDate, "Formation date is required.", errors);
  requiredDate(d.nextAnnualReportDue, "Next Wyoming annual report due date is required.", errors);
  if (d.effectiveDate && d.effectiveDate.trim() && !parseIsoDate(d.effectiveDate)) {
    errors.push("Effective date must be a real date.");
  }
  if (d.signatureDate && d.signatureDate.trim() && !parseIsoDate(d.signatureDate)) {
    errors.push("Signature date must be a real date.");
  }

  if (d.management === "manager") {
    req(d.managerName, "Manager name is required for a manager-managed company.");
  }

  // Art. 1.2 — Wyoming requires "LLC" / "L.L.C." / "limited liability company" (W.S. 17-29-108).
  if (d.llcName && !/llc|l\.l\.c|limited liability company/i.test(d.llcName)) {
    warnings.push('The name does not contain "LLC" / "L.L.C." / "limited liability company" - Wyoming requires one of these (W.S. 17-29-108).');
  }
  // Art. 1.4 / J5 — some agents are not a physical Wyoming address.
  if (d.registeredAgentAddress && PO_BOX.test(d.registeredAgentAddress)) {
    warnings.push("The registered agent address looks like a P.O. box - Wyoming requires a physical Wyoming address (W.S. 17-29-113).");
  }
  if (!d.annualReportFee.trim()) {
    warnings.push("Annual report fee left blank - the agreement will cite W.S. 17-29-209(a) instead of a figure.");
  }
  // J1/J7 — routes to a professional, never resolved by the generator.
  warnings.push("Foreign ownership may create home-country and US filing duties (e.g. Form 5472, $25,000 penalty if missed). Have a CPA and a lawyer review before signing.");

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Token resolution + render (every {{TOKEN}} must resolve, or generation refuses)
// ---------------------------------------------------------------------------

const TOKEN_RE = /\{\{([A-Z0-9_]+)\}\}/g;
export const hasUnresolvedTokens = (s: string): boolean => /\{\{[^}]*\}\}/.test(s);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmtDate(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function resolveOAFields(d: OAInputs, now: Date = new Date()): Record<string, string> {
  const formation = d.formationDate.trim();
  const effective = d.effectiveDate.trim() || formation;
  const signature = d.signatureDate.trim() || now.toISOString().slice(0, 10);
  const purpose = d.purpose.trim();
  return {
    LLC_NAME: d.llcName.trim(),
    FILE_ID: d.fileId.trim(),
    FORMATION_DATE: fmtDate(formation),
    EFFECTIVE_DATE: fmtDate(effective),
    MEMBER_NAME: d.memberName.trim(),
    MEMBER_ADDRESS: d.memberAddress.trim(),
    MEMBER_CITIZENSHIP: d.memberCitizenship.trim(),
    MEMBER_TAX_RESIDENCE: d.memberTaxResidence.trim(),
    REGISTERED_AGENT: d.registeredAgent.trim(),
    REGISTERED_AGENT_ADDRESS: d.registeredAgentAddress.trim(),
    PRINCIPAL_ADDRESS: d.principalAddress.trim(),
    CAPITAL_CONTRIBUTION: d.capitalContribution.trim() || "as recorded on the Company's books",
    PURPOSE_CLAUSE: purpose
      ? `The Company is organized for the following purpose: ${purpose}, and for any other lawful purpose for which a limited liability company may be formed under the Act.`
      : "The Company is organized for any lawful purpose for which a limited liability company may be formed under the Act.",
    MANAGER_NAME: d.managerName.trim(),
    NOTICE_EMAIL: d.noticeEmail.trim() || d.memberAddress.trim(),
    NEXT_ANNUAL_REPORT_DUE: fmtDate(d.nextAnnualReportDue.trim()),
    ANNUAL_REPORT_FEE: d.annualReportFee.trim() || "see W.S. 17-29-209(a)",
    SIGNATURE_DATE: fmtDate(signature),
  };
}

export type OABlock =
  | { t: "title"; text: string }
  | { t: "subtitle"; text: string }
  | { t: "center"; text: string }
  | { t: "banner"; text: string }
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "rule" }
  | { t: "spacer" };

type Sec = { label: string; body: string };

function articles(d: OAInputs): { title: string; sections: Sec[] }[] {
  const A4: Sec[] =
    d.management === "manager"
      ? [
          {
            label: "4.1 Manager-Managed.",
            body: "The Company is manager-managed. The manager is {{MANAGER_NAME}}, with the authority to manage the Company and bind it. The Member retains the voting rights the Act reserves to members of a manager-managed company. (W.S. 17-29-407; W.S. 17-29-102(a)(xiii).)",
          },
        ]
      : [
          {
            label: "4.1 Management by the Member.",
            body: "The Company is member-managed within the meaning of W.S. 17-29-102(a)(xiii). The Member has full and exclusive authority to manage the Company's business and affairs and to bind the Company. (W.S. 17-29-407.)",
          },
        ];

  return [
    {
      title: "ARTICLE 1 - FORMATION, NAME, OFFICE, AGENT, PURPOSE",
      sections: [
        { label: "1.1 Formation.", body: "The Company was formed under the Act by the filing of Articles of Organization with the Wyoming Secretary of State on {{FORMATION_DATE}}. The rights and obligations of the Member are governed by the Act and this Agreement. (W.S. 17-29-201.)" },
        { label: "1.2 Name.", body: 'The name of the Company is {{LLC_NAME}}, which complies with W.S. 17-29-108(a) and contains the required words "limited liability company" or the abbreviation "LLC" or "L.L.C." (W.S. 17-29-108.)' },
        { label: "1.3 Principal Office.", body: "The principal office of the Company is {{PRINCIPAL_ADDRESS}}. The Member may change the principal office at any time." },
        { label: "1.4 Registered Office and Registered Agent.", body: "The Company shall continuously maintain a registered office and registered agent in Wyoming as required by W.S. 17-29-113 and the registered agent statutes at W.S. 17-28-101 through 17-28-111. The initial registered agent is {{REGISTERED_AGENT}}, and the registered office is {{REGISTERED_AGENT_ADDRESS}}. (W.S. 17-29-113; W.S. 17-29-201(b)(ii), (c).)" },
        { label: "1.5 Term.", body: "The Company's term is perpetual until it is dissolved and wound up under Article 8." },
        { label: "1.6 Purpose.", body: "{{PURPOSE_CLAUSE}}" },
        { label: "1.7 Title to Assets.", body: "All property acquired by the Company is owned in the Company's name and not in the name of the Member." },
        { label: "1.8 Limited Liability.", body: "Except as required by the Act or by this Agreement, the Member is not liable for the Company's debts, obligations, or liabilities solely by reason of being a member. (W.S. 17-29-304.) This clause does not shield the Member from their own taxes, personal guarantees, fraud, or failure to respect the entity's separateness." },
      ],
    },
    {
      title: "ARTICLE 2 - THE MEMBER; MEMBERSHIP INTEREST",
      sections: [
        { label: "2.1 Sole Member.", body: "{{MEMBER_NAME}} is the sole member of the Company and owns 100% of the membership interests." },
        { label: "2.2 Member Information.", body: "Member name: {{MEMBER_NAME}}. Address: {{MEMBER_ADDRESS}}. Country of citizenship: {{MEMBER_CITIZENSHIP}}. Country of tax residence: {{MEMBER_TAX_RESIDENCE}}." },
        { label: "2.3 No Additional Members.", body: "So long as this Agreement contemplates a single member, no other person may be admitted as a member except by amending this Agreement under Article 9." },
        { label: "2.4 Member Not an Agent (unless appointed).", body: "Except as stated in Article 4, the Member does not hold the Company out as bound by the Member's acts except in the Member's capacity as contemplated in this Agreement. (W.S. 17-29-402 - limits on apparent authority.)" },
      ],
    },
    {
      title: "ARTICLE 3 - CAPITAL CONTRIBUTIONS",
      sections: [
        { label: "3.1 Initial Contribution.", body: "The Member has contributed or has agreed to contribute to the Company: {{CAPITAL_CONTRIBUTION}}. (W.S. 17-29-501 et seq.)" },
        { label: "3.2 Additional Contributions.", body: "The Member may, but is not obligated to, make additional capital contributions. No additional contribution creates any right unless the Member documents it." },
        { label: "3.3 No Interest on Capital; No Withdrawal.", body: "No interest accrues on any capital contribution, and the Member has no right to withdraw or receive a return of capital except as provided in Article 5 or on dissolution under Article 8." },
      ],
    },
    {
      title: "ARTICLE 4 - MANAGEMENT",
      sections: [
        ...A4,
        { label: "4.2 Authority to Bind.", body: "The Member may execute any document, contract, or instrument on the Company's behalf and may open and operate bank accounts in the Company's name." },
        { label: "4.3 Officers and Agents.", body: "The Member may appoint officers or agents, delegate authority, and set compensation. A delegation of authority does not remove the Member's management rights unless this Agreement says so." },
        { label: "4.4 Reimbursement.", body: "The Company shall reimburse the Member for reasonable expenses incurred on the Company's behalf." },
        { label: "4.5 Duties; Good Faith and Fair Dealing.", body: "The Member owes to the Company and to any interest holders the contractual obligations of good faith and fair dealing that may not be eliminated under W.S. 17-29-110(c)(v) and W.S. 17-29-409(d). Any other duties - including the duty of loyalty and the duty of care - may be restricted as the Act permits, and are restricted here to the fullest extent permitted by W.S. 17-29-110(c) and W.S. 17-29-409." },
      ],
    },
    {
      title: "ARTICLE 5 - DISTRIBUTIONS",
      sections: [
        { label: "5.1 Distributions.", body: "The Member is entitled to all distributions of the Company's cash and other property, at times and in amounts the Member determines." },
        { label: "5.2 Tax Distributions.", body: "Nothing obligates the Company to make distributions to cover the Member's taxes, though the Member may cause the Company to do so." },
        { label: "5.3 Limits on Distributions.", body: "The Company shall not make a distribution if doing so would render the Company unable to pay its debts as they become due in the ordinary course, or would exceed the fair value of the Company's assets over its liabilities, as provided in the Act. A distribution made in violation of this limit must be returned. (W.S. 17-29-405; W.S. 17-29-406.)" },
      ],
    },
    {
      title: "ARTICLE 6 - BOOKS, RECORDS, AND ACCOUNTING",
      sections: [
        { label: "6.1 Books and Records.", body: "The Company shall keep complete books and records of account and a copy of its Articles of Organization, this Agreement, tax returns, and the Member's written records. (W.S. 17-29-410; W.S. 17-29-209(e).)" },
        { label: "6.2 Fiscal Year.", body: "The Company's fiscal year is the calendar year, unless the Member selects otherwise." },
        { label: "6.3 Bank Accounts.", body: "Company funds shall be kept in accounts in the Company's name, separate from the Member's personal funds." },
        { label: "6.4 Reports.", body: "The Member may prepare financial reports at any time. No separate periodic reporting is required in a single-member company." },
        { label: "6.5 Tax Classification.", body: "The Member intends the Company to be classified as a disregarded entity for U.S. federal income tax purposes, unless it makes or has made an election under Treas. Reg. 301.7701-3 to be classified otherwise. The Member may cause the Company to make or revoke tax elections and to file required returns and reports. This clause is educational and is not tax advice. See the tax note in the disclaimers at the end of this document." },
        { label: "6.6 Annual Report.", body: "The Company shall file its annual report and pay the annual license fee with the Wyoming Secretary of State on or before the first day of the month of the Company's organization each year. (W.S. 17-29-209. Fee: $60.00 or $0.0002 of Wyoming assets, whichever is greater - W.S. 17-29-209(a). Verify the current amount at filing.) The Company's next due date is {{NEXT_ANNUAL_REPORT_DUE}}, amount {{ANNUAL_REPORT_FEE}}." },
      ],
    },
    {
      title: "ARTICLE 7 - TRANSFER OF MEMBERSHIP INTERESTS",
      sections: [
        { label: "7.1 Restriction on Transfer.", body: "The Member may not transfer all or part of the membership interest except (a) to a trust or entity wholly controlled by the Member, (b) by will or operation of law on death, or (c) with a written amendment under Article 9. Any other purported transfer is void. (W.S. 17-29-110(a)(vi).)" },
        { label: "7.2 Effect of a Permitted Transfer.", body: "A transferee receives only the transferor's rights to distributions and allocations (a \"transferable interest\") and does not become a member with management rights unless admitted under Article 9. (W.S. 17-29-102(a)(xxiv).)" },
        { label: "7.3 No Transfer Creating a Second Member.", body: "No transfer may be made that would result in more than one member, except by an amendment under Article 9 that converts this to a multi-member agreement." },
      ],
    },
    {
      title: "ARTICLE 8 - DISSOLUTION AND WINDING UP",
      sections: [
        { label: "8.1 Events of Dissolution.", body: "The Company dissolves on the first of: (a) the Member's written election to dissolve; (b) the sale or disposition of all or substantially all the Company's assets; (c) an event that terminates the Member's membership, unless the Company continues under the Act; or (d) a decree of dissolution by a court in the circumstances the Act specifies. (W.S. 17-29-701.)" },
        { label: "8.2 Winding Up.", body: "On dissolution, the Company shall wind up its affairs: it shall cease business except as needed to wind up, collect assets, and sell or distribute property. (W.S. 17-29-702.)" },
        { label: "8.3 Distribution of Assets.", body: "On winding up, assets are applied in this order: (1) to creditors, including members who are creditors; (2) to any reserves the Member reasonably sets for contingent liabilities; (3) to the Member. (W.S. 17-29-708.) Distributing assets without first paying or providing for creditors creates personal exposure - a lawyer must confirm the wind-up order." },
        { label: "8.4 Filings.", body: "The Company shall file Articles of Dissolution with the Wyoming Secretary of State and obtain any certificate of cancellation. (W.S. 17-29-702; W.S. 17-29-705 et seq.)" },
      ],
    },
    {
      title: "ARTICLE 9 - AMENDMENT",
      sections: [
        { label: "9.1 Amendment.", body: "This Agreement may be amended only by a written instrument signed by the Member. (W.S. 17-29-110(a)(iv).) An amendment is effective when signed, unless it states a later date." },
        { label: "9.2 No Oral Amendment.", body: "No oral amendment is effective." },
      ],
    },
    {
      title: "ARTICLE 10 - INDEMNIFICATION AND EXCULPATION",
      sections: [
        { label: "10.1 Indemnification.", body: "The Company shall indemnify the Member (and any manager or officer) against expenses, judgments, and amounts paid in settlement reasonably incurred in connection with the Company's business, except for conduct that is fraud, willful misconduct, or a knowing violation of law, or a transaction from which the person received an improper personal benefit. (W.S. 17-29-408.)" },
        { label: "10.2 Exculpation.", body: "To the fullest extent the Act permits, the Member is not liable to the Company for any act or omission as a member, except as stated in 10.1. This does not eliminate the non-waivable good faith and fair dealing obligation under W.S. 17-29-110(c)(v)." },
      ],
    },
    {
      title: "ARTICLE 11 - MISCELLANEOUS",
      sections: [
        { label: "11.1 Governing Law.", body: "This Agreement is governed by, and shall be construed under, the laws of the State of Wyoming. (W.S. 17-29-106.)" },
        { label: "11.2 Entire Agreement.", body: "This Agreement, together with the Articles of Organization, is the entire agreement of the Member concerning the Company and supersedes any prior agreement." },
        { label: "11.3 Severability.", body: "If any provision is held invalid, the rest remains in effect." },
        { label: "11.4 Notices.", body: "Notices to the Member go to {{MEMBER_ADDRESS}} or {{NOTICE_EMAIL}}. Notices to the Company go to the principal office." },
        { label: "11.5 Counterparts and Electronic Signature.", body: "This Agreement may be signed in counterparts and by electronic signature. (W.S. 17-29-102(a)(xix).)" },
        { label: "11.6 No Third-Party Beneficiaries.", body: "Except as stated in Article 10, this Agreement creates no rights for anyone other than the Member and the Company." },
        { label: "11.7 Conflict.", body: "If this Agreement conflicts with the Articles of Organization, the Articles control as to matters the Act requires the Articles to contain; this Agreement controls as to all other matters. (W.S. 17-29-110.)" },
      ],
    },
  ];
}

export function renderOA(f: Record<string, string>, d: OAInputs): OABlock[] {
  const sub = (text: string): string => {
    const out = text.replace(TOKEN_RE, (_m, k: string) => {
      const v = f[k];
      if (v == null || v === "") throw new Error(`Missing value for {{${k}}} - refusing to emit a blank term.`);
      return v;
    });
    if (hasUnresolvedTokens(out)) throw new Error("Unresolved placeholder remained in the generated agreement.");
    return out;
  };
  const clean = (text: string) => pdfText(sub(text));

  const b: OABlock[] = [];
  b.push({ t: "title", text: clean("OPERATING AGREEMENT OF {{LLC_NAME}}") });
  b.push({ t: "subtitle", text: "A Wyoming Limited Liability Company" });
  b.push({ t: "banner", text: DRAFT_BANNER });
  b.push({
    t: "p",
    text: clean(
      'This Operating Agreement (this "Agreement") is adopted as of {{EFFECTIVE_DATE}} by {{MEMBER_NAME}} (the "Member"), the sole member of {{LLC_NAME}}, a Wyoming limited liability company (the "Company"), formed under the Wyoming Limited Liability Company Act, W.S. 17-29-101 et seq. (the "Act").'
    ),
  });

  b.push({ t: "h2", text: "RECITALS" });
  b.push({ t: "p", text: clean("A. The Company was formed by the filing of Articles of Organization with the Wyoming Secretary of State on {{FORMATION_DATE}}, File ID {{FILE_ID}}.") });
  b.push({ t: "p", text: "B. The Member owns 100% of the membership interests in the Company and is the Company's sole member." });
  b.push({ t: "p", text: "C. The Member wishes to adopt this Agreement to govern the Company's affairs, as permitted by W.S. 17-29-110." });
  b.push({ t: "p", text: "NOW, THEREFORE, the Member agrees as follows:" });

  for (const art of articles(d)) {
    b.push({ t: "rule" });
    b.push({ t: "h2", text: clean(art.title) });
    for (const s of art.sections) {
      b.push({ t: "h3", text: clean(s.label) });
      b.push({ t: "p", text: clean(s.body) });
    }
  }

  b.push({ t: "rule" });
  b.push({ t: "p", text: "IN WITNESS WHEREOF, the undersigned adopts this Operating Agreement as of the date first written above." });
  b.push({ t: "spacer" });
  b.push({ t: "p", text: "MEMBER:" });
  b.push({ t: "p", text: "Signature: ____________________________" });
  b.push({ t: "p", text: clean("Name: {{MEMBER_NAME}}") });
  b.push({ t: "p", text: "Title: Sole Member" });
  b.push({ t: "p", text: clean("Date: {{SIGNATURE_DATE}}") });
  b.push({ t: "spacer" });
  b.push({ t: "h3", text: "ACKNOWLEDGMENT - NOT REVIEWED BY COUNSEL" });
  b.push({ t: "p", text: `[ ] ${OA_ACKNOWLEDGMENT}` });

  return b;
}

// ---------------------------------------------------------------------------
// PDF generation — layout engine mirrors w7.ts; banner drawn on every page.
// ---------------------------------------------------------------------------

const LETTER: [number, number] = [612, 792];
const M = 54;

export interface OAResult {
  bytes: Uint8Array;
  filename: string;
  fieldMap: Record<string, string>;
  pages: number;
  plainText: string;
}

export async function generateOaPdf(d: OAInputs, meta: { generatedAt?: Date } = {}): Promise<OAResult> {
  const now = meta.generatedAt ?? new Date();
  const v = validateOA(d);
  if (v.errors.length) throw new Error("Cannot generate Operating Agreement: " + v.errors.join(" "));

  const fields = resolveOAFields(d, now);
  const blocks = renderOA(fields, d);

  // ponytail: lazy import — pdf-lib only loads when a user actually generates an OA.
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const BLACK = rgb(0, 0, 0);
  const GRAY = rgb(0.4, 0.4, 0.4);
  const RED = rgb(0.72, 0.05, 0.05);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage(LETTER);
  let y = LETTER[1] - M;

  const newPage = () => {
    page = pdf.addPage(LETTER);
    y = LETTER[1] - M;
  };
  const need = (h: number) => {
    if (y - h < M) newPage();
  };
  const draw = (s: string, opts: { size?: number; bold?: boolean; indent?: number; gap?: number; color?: typeof BLACK } = {}) => {
    const size = opts.size ?? 9.5;
    const fnt = opts.bold ? boldFont : font;
    const gap = opts.gap ?? size + 3;
    need(gap);
    page.drawText(pdfText(s), { x: opts.indent ?? M, y: y - size, size, font: fnt, color: opts.color ?? BLACK });
    y -= gap;
  };
  const para = (s: string, opts: { size?: number; bold?: boolean; indent?: number; gap?: number; color?: typeof BLACK } = {}) => {
    const size = opts.size ?? 9.5;
    const fnt = opts.bold ? boldFont : font;
    const gap = opts.gap ?? size + 3;
    const indent = opts.indent ?? M;
    const maxW = LETTER[0] - M - indent;
    const words = pdfText(s).split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const t = line ? `${line} ${word}` : word;
      if (fnt.widthOfTextAtSize(t, size) > maxW) {
        if (line) lines.push(line);
        line = word;
      } else line = t;
    }
    if (line) lines.push(line);
    for (const l of lines) {
      need(gap);
      page.drawText(l, { x: indent, y: y - size, size, font: fnt, color: opts.color ?? BLACK });
      y -= gap;
    }
  };

  for (const blk of blocks) {
    switch (blk.t) {
      case "title":
        draw(blk.text, { size: 15, bold: true, gap: 20 });
        break;
      case "subtitle":
        draw(blk.text, { size: 11, bold: true, color: GRAY, gap: 16 });
        break;
      case "banner": {
        need(34);
        const boxH = 24;
        page.drawRectangle({
          x: M,
          y: y - boxH + 4,
          width: LETTER[0] - 2 * M,
          height: boxH,
          color: rgb(0.99, 0.92, 0.92),
          borderColor: RED,
          borderWidth: 1,
        });
        const tw = boldFont.widthOfTextAtSize(pdfText(blk.text), 12);
        page.drawText(pdfText(blk.text), {
          x: M + (LETTER[0] - 2 * M - tw) / 2,
          y: y - boxH + 11,
          size: 12,
          font: boldFont,
          color: RED,
        });
        y -= boxH + 8;
        break;
      }
      case "center":
        draw(blk.text, { size: 10, bold: true, gap: 15 });
        break;
      case "h2":
        need(26);
        y -= 8;
        draw(blk.text, { size: 11, bold: true, gap: 6 });
        break;
      case "h3":
        draw(blk.text, { size: 9.5, bold: true, gap: 13 });
        break;
      case "p":
        para(blk.text, { size: 9.5 });
        break;
      case "rule":
        need(10);
        page.drawLine({ start: { x: M, y: y - 2 }, end: { x: LETTER[0] - M, y: y - 2 }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
        y -= 10;
        break;
      case "spacer":
        need(8);
        y -= 8;
        break;
    }
  }

  // Disclaimer & acknowledgment page.
  newPage();
  draw("Disclaimers & Required Acknowledgments", { size: 13, bold: true, gap: 20 });
  para(DRAFT_BANNER_LONG, { size: 10, bold: true, color: RED });
  y -= 6;
  draw("Global disclaimer", { size: 10, bold: true, gap: 14 });
  para(GLOBAL_TAX_DISCLAIMER, { size: 8.5, color: GRAY });
  y -= 6;
  draw("Entity formation disclaimer", { size: 10, bold: true, gap: 14 });
  para(ENTITY_CREATION_DISCLAIMER, { size: 8.5, color: GRAY });
  para(ENTITY_FORMATION_DISCLAIMER, { size: 8.5, color: GRAY });
  y -= 6;
  draw("Professional-review acknowledgment", { size: 10, bold: true, gap: 14 });
  para(`[x] ${REVIEW_CHECKBOX_LABEL}`, { size: 8.5, color: GRAY });
  para(REVIEW_CHECKBOX_SUPPORT, { size: 8.5, color: GRAY });
  para(`Reviewed document: Operating Agreement (Wyoming). Logged: ${now.toISOString()} - Disclaimer version: ${DISCLAIMER_VERSION}`, { size: 8, color: GRAY });

  // The DRAFT banner must travel INSIDE the file, on every page — never only on screen.
  const pages = pdf.getPages();
  const stamp = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  pages.forEach((pg, i) => {
    pg.drawText(pdfText(DRAFT_BANNER_LONG), { x: M, y: LETTER[1] - 26, size: 8.5, font: boldFont, color: RED });
    pg.drawText(
      pdfText(`Template v${DISCLAIMER_VERSION.replace("v", "")} - generated ${stamp} - page ${i + 1} of ${pages.length}`),
      { x: M, y: 30, size: 7.5, font, color: GRAY }
    );
  });

  pdf.setTitle(`Operating Agreement (draft) - ${fields.LLC_NAME} - MY-LLC Dashboard`);
  pdf.setCreator("MY-LLC Dashboard");
  pdf.setProducer("MY-LLC Dashboard (pdf-lib)");

  const bytes = await pdf.save();
  const safeName = (d.llcName || "company").replace(/[^\w-]+/g, "_").slice(0, 60);
  const stampDay = now.toISOString().slice(0, 10).replace(/-/g, "");
  return {
    bytes,
    filename: `Operating_Agreement_DRAFT_${safeName}_${stampDay}.pdf`,
    fieldMap: fields,
    pages: pages.length,
    plainText: blocks.map((blk) => ("text" in blk ? blk.text : "")).join("\n"),
  };
}
