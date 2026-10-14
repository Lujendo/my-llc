// Form W-7 (ITIN) — validation + print-ready PDF generator.
//
// Content source of truth (do not invent):
//   content/W-7-FORM-SPEC.md
//   content/TAX-DISCLAIMERS.md
//   content/legal/REVIEW-CHECKBOX-COPY.md
//
// Approach: FAITHFUL, CLEARLY-LABELED FACSIMILE (not the genuine IRS PDF).
// The genuine fw7.pdf (Rev. Dec 2024) is an XFA-hybrid: pdf-lib strips the XFA
// layer that draws the live form, its AcroForm field names are opaque
// (f1_01..f1_48) and version-ambiguous, and no PDF renderer is available here to
// verify a fill. Shipping an unverified/misfilled government form is worse than a
// labeled draft. So we render a faithful facsimile with verbatim IRS labels, a
// blank signature line, a blank Acceptance-Agent page, the exact filing address,
// and the mandated disclaimers — every value we draw is verifiable.
//
// ponytail: single file, no relative imports, so `node w7-smoke.mjs` (type
// stripping) can import it directly while Vite imports it extensionless.

export const DISCLAIMER_VERSION = "v1.0";

// ---------------------------------------------------------------------------
// Verbatim copy (TAX-DISCLAIMERS.md / REVIEW-CHECKBOX-COPY.md). Wording is kept
// exactly; only markdown markers are dropped and U+2011 non-breaking hyphens are
// normalized to "-" (visually identical, WinAnsi-safe). Do not soften.
// ---------------------------------------------------------------------------

export const GLOBAL_TAX_DISCLAIMER =
  "This tool provides general information and document-preparation help only. It is not tax, legal, or accounting advice, and it is not a substitute for advice from a qualified professional. Using this tool does not create a CPA-client, attorney-client, or Enrolled Agent relationship, and we do not represent you before any tax authority. We do not review your facts and we do not guarantee any tax result. Tax law changes and depends on your country, your residency, and your situation. You are responsible for the accuracy of everything you enter. All information and output are provided \"as is,\" with no warranty of any kind. For advice about your own situation, consult a qualified tax professional in your country.";

export const W7_DISCLAIMER_PARAGRAPHS = [
  "This tool helps you fill out Form W-7, Application for IRS Individual Taxpayer Identification Number, from the information you type in. It is a typing and formatting aid only. It does not:",
];

export const W7_DISCLAIMER_BULLETS = [
  "file the form for you, or send anything to the IRS;",
  "decide which reason box (a-h) applies to you;",
  "decide whether a tax treaty benefit or exception applies;",
  "certify, review, or verify your documents; or",
  "tell you how the IRS will decide your case.",
];

export const W7_DISCLAIMER_PARAGRAPHS_2 = [
  "The IRS — not this tool — decides whether to issue an ITIN. An ITIN is for federal tax purposes only. It does not give you immigration status, work permission, or a Social Security number, and it does not change your immigration status.",
  "You must attach what the IRS requires — usually your passport (or an agency-certified copy), plus a completed federal tax return or a valid exception. Only the IRS, an IRS Taxpayer Assistance Center, or a Certifying Acceptance Agent can accept or certify your identity documents. Check the current instructions at irs.gov before you file. We are not the IRS and are not affiliated with the IRS.",
];

export const REVIEW_CHECKBOX_LABEL =
  "I confirm I have consulted, or will consult, a qualified US tax professional before filing this form with the IRS.";

export const REVIEW_CHECKBOX_SUPPORT =
  "This tool helps you prepare a draft. It is not tax, legal, or accounting advice. You are responsible for what you file.";

export const INLINE_WARNING_BANNER =
  "Draft only — not tax advice. This form was generated from the information you entered. It may contain errors or be out of date. Have a qualified US tax professional review it before you file. You are responsible for the final filing.";

// W-7-FORM-SPEC.md §6 (verified 2026-10-13, Pub 4757 Rev. 6-2026)
export const W7_FILING = {
  usps: "Internal Revenue Service, ITIN Operation, P.O. Box 149342, Austin, TX 78714-9342",
  privateDelivery:
    "Internal Revenue Service, ITIN Operation, Mail Stop 6090-AUSC, 3651 S. Interregional Hwy 35, Austin, TX 78741-0000",
  inPerson:
    "Designated IRS Taxpayer Assistance Centers (TACs), or through a Certifying Acceptance Agent (CAA) who can certify documents.",
};

// W-7-FORM-SPEC.md §3 — verbatim option text (Rev. December 2024).
export const REASON_BOXES: { id: ReasonBox; text: string }[] = [
  { id: "a", text: "Nonresident alien required to get an ITIN to claim tax treaty benefit" },
  { id: "b", text: "Nonresident alien filing a U.S. federal tax return" },
  { id: "c", text: "U.S. resident alien (based on days present in the United States) filing a U.S. federal tax return" },
  { id: "d", text: "Dependent of U.S. citizen/resident alien" },
  { id: "e", text: "Spouse of U.S. citizen/resident alien" },
  { id: "f", text: "Nonresident alien student, professor, or researcher filing a U.S. federal tax return or claiming an exception" },
  { id: "g", text: "Dependent/spouse of a nonresident alien holding a U.S. visa" },
  { id: "h", text: "Other (see instructions)" },
];

export const DOC_TYPES = [
  { id: "passport", label: "Passport" },
  { id: "drivers_license", label: "Driver's license / State I.D." },
  { id: "uscis", label: "USCIS documentation" },
  { id: "other", label: "Other" },
] as const;

export type AppType = "" | "new" | "renew";
export type ReasonBox = "" | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type YesNoDontKnow = "" | "yes" | "no" | "dont_know";
export type DocType = "" | (typeof DOC_TYPES)[number]["id"];
export type Sex = "" | "male" | "female";

export interface W7Data {
  appType: AppType;
  reasonBox: ReasonBox;
  reasonHText: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthFirstName: string;
  birthMiddleName: string;
  birthLastName: string;
  addr2Street: string;
  addr2City: string;
  addr2State: string;
  addr2Country: string;
  addr2Zip: string;
  addr3Street: string;
  addr3City: string;
  addr3State: string;
  addr3Country: string;
  addr3Zip: string;
  dob: string;
  countryBirth: string;
  cityStateBirth: string;
  sex: Sex;
  citizenship: string;
  foreignTin: string;
  visaType: string;
  visaNumber: string;
  visaExp: string;
  docType: DocType;
  docIssuedBy: string;
  docNumber: string;
  docExp: string;
  docEntryDate: string;
  // Box d — relationship to the U.S. citizen/resident alien (required if d).
  reasonDRelationship: string;
  // Boxes d/e — name + SSN/ITIN of the U.S. citizen/resident alien (required if d or e).
  uspName: string;
  uspId: string;
  // Line 6g — institution/company name, city and state, length of stay
  // (required if reason f, or a business visitor).
  institutionName: string;
  institutionCityState: string;
  lengthOfStay: string;
  prevItin: YesNoDontKnow;
  itin: string;
  irsn: string;
}

export const emptyW7 = (): W7Data => ({
  appType: "",
  reasonBox: "",
  reasonHText: "",
  firstName: "",
  middleName: "",
  lastName: "",
  birthFirstName: "",
  birthMiddleName: "",
  birthLastName: "",
  addr2Street: "",
  addr2City: "",
  addr2State: "",
  addr2Country: "",
  addr2Zip: "",
  addr3Street: "",
  addr3City: "",
  addr3State: "",
  addr3Country: "",
  addr3Zip: "",
  dob: "",
  countryBirth: "",
  cityStateBirth: "",
  sex: "",
  citizenship: "",
  foreignTin: "",
  visaType: "",
  visaNumber: "",
  visaExp: "",
  docType: "",
  docIssuedBy: "",
  docNumber: "",
  docExp: "",
  docEntryDate: "",
  reasonDRelationship: "",
  uspName: "",
  uspId: "",
  institutionName: "",
  institutionCityState: "",
  lengthOfStay: "",
  prevItin: "",
  itin: "",
  irsn: "",
});

// ---------------------------------------------------------------------------
// Validation (W-7-FORM-SPEC.md §7)
// ---------------------------------------------------------------------------

const PO_BOX = /(^|\s)(p\.?\s*o\.?\s*box|post\s+office\s+box|postfach)/i;

export function parseUsDate(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const mm = +m[1];
  const dd = +m[2];
  const yyyy = +m[3];
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) return null;
  return d;
}

export interface W7Validation {
  errors: string[];
  warnings: string[];
}

export function validateW7(d: W7Data, now: Date = new Date()): W7Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const req = (v: string, msg: string) => {
    if (!v || !v.trim()) errors.push(msg);
  };

  // §3 application type — exactly one
  if (!d.appType) errors.push("Section 1: select an application type (New ITIN or Renewal).");

  // §3 reason box — never auto-selected; blank is a warning, not a hard block
  if (!d.reasonBox) {
    warnings.push("Reason box (a-h) is blank — this is a factual/legal determination. Have a professional confirm it before filing.");
  }
  if (d.reasonBox === "a" || d.reasonBox === "f") {
    req(d.reasonHText, "Box h is required when reason (a) or (f) is selected — enter treaty country and article number.");
  }
  // Box d — relationship to the U.S. citizen/resident alien.
  if (d.reasonBox === "d") {
    req(d.reasonDRelationship, "Box d: enter your relationship to the U.S. citizen/resident alien (e.g. child, parent).");
  }
  // Boxes d/e — full name + SSN/ITIN of the U.S. citizen/resident alien.
  if (d.reasonBox === "d" || d.reasonBox === "e") {
    req(d.uspName, "Box d/e: enter the full name of the U.S. citizen/resident alien.");
    req(d.uspId, "Box d/e: enter the SSN/ITIN of the U.S. citizen/resident alien.");
  }
  // Line 6g — required for reason f (student/professor/researcher) or a business visitor.
  if (d.reasonBox === "f") {
    req(d.institutionName, "Line 6g: enter the name of the college/university or company.");
    req(d.institutionCityState, "Line 6g: enter the city and state of the college/university or company.");
    req(d.lengthOfStay, "Line 6g: enter your length of stay in the United States.");
  }
  if (["b", "c", "d", "e", "f", "g"].includes(d.reasonBox)) {
    warnings.push("Reason (b)-(g) generally requires attaching a filed U.S. federal return or a valid exception. Confirm you have one.");
  }

  // §4 line 1a — name
  req(d.firstName, "Line 1a: first name is required (match your passport spelling; Latin transliteration).");
  req(d.lastName, "Line 1a: last name is required (match your passport spelling; Latin transliteration).");

  // §4 line 2 — U.S. mailing address
  req(d.addr2Street, "Line 2: street address (or P.O. box) is required.");
  req(d.addr2City, "Line 2: city or town is required.");
  req(d.addr2Country, "Line 2: country is required.");
  req(d.addr2Zip, "Line 2: ZIP/postal code is required.");

  // §4 line 3 — foreign address (P.O. box NOT allowed)
  req(d.addr3Street, "Line 3: foreign street address/apt/rural route is required.");
  req(d.addr3City, "Line 3: city or town is required.");
  req(d.addr3Country, "Line 3: country is required.");
  req(d.addr3Zip, "Line 3: postal code is required.");
  if (d.addr3Street && PO_BOX.test(d.addr3Street)) {
    errors.push("Line 3: a P.O. box is not allowed in the foreign (non-U.S.) address — use a street address, apartment, or rural route.");
  }

  // §4 line 4 — DOB
  if (!d.dob.trim()) {
    errors.push("Line 4: date of birth is required (MM/DD/YYYY).");
  } else {
    const dob = parseUsDate(d.dob);
    if (!dob) errors.push("Line 4: date of birth must be a real date in MM/DD/YYYY format.");
    else {
      const min = Date.UTC(1900, 0, 1);
      if (dob.getTime() < min) warnings.push("Line 4: date of birth is before 1900 — double-check it.");
      if (dob.getTime() > now.getTime()) errors.push("Line 4: date of birth cannot be in the future.");
    }
  }
  req(d.countryBirth, "Line 4: country of birth is required.");

  // §4 line 5 — sex
  if (!d.sex) errors.push("Line 5: select Male or Female.");

  // §4 line 6a — citizenship
  req(d.citizenship, "Line 6a: country(ies) of citizenship is required.");

  // §4 line 6d — first identification document
  if (!d.docType) errors.push("Line 6d: select the identification document you will submit (usually your passport).");
  if (d.docType && d.docType !== "passport") {
    if (!d.docNumber.trim()) errors.push("Line 6d: document number is required for the selected document.");
    if (!d.docIssuedBy.trim()) errors.push("Line 6d: 'Issued by' is required for the selected document.");
  }

  // §4 line 6e/6f — previous ITIN/IRSN
  if (!d.prevItin) errors.push("Line 6e: answer whether you previously received an ITIN or IRSN.");
  if (d.prevItin === "yes") {
    if (!d.itin.trim() && !d.irsn.trim()) {
      errors.push("Line 6f: enter your previous ITIN and/or IRSN.");
    }
    if (d.itin.trim() && !/^9\d{2}-\d{2}-\d{4}$/.test(d.itin.trim())) {
      errors.push("Line 6f: ITIN must be in the format 9XX-XX-XXXX.");
    }
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Interactive clone field model (CEO decision: users copy each value into the
// genuine IRS Form W-7). Maps 1:1 to the real W-7 boxes in W-7-FORM-SPEC.md
// §2–§4. Single source for the on-screen clone AND "copy all", so the two can
// never drift. `box` is the real form label; `value` is what gets pasted/checked.
// ---------------------------------------------------------------------------

export const W7_OFFICIAL_URL = "https://www.irs.gov/pub/irs-pdf/fw7.pdf";

export interface W7CloneField {
  box: string; // real W-7 box / label (verbatim, per spec)
  value: string;
  required: boolean;
  note?: string; // caveat shown next to the field (e.g. "P.O. box not allowed")
}
export interface W7CloneSection {
  id: string;
  title: string;
  fields: W7CloneField[];
}

export function w7Clone(d: W7Data): W7CloneSection[] {
  const docLabel = DOC_TYPES.find((t) => t.id === d.docType)?.label ?? "";
  const reasonText = REASON_BOXES.find((r) => r.id === d.reasonBox)?.text ?? "";
  return [
    {
      id: "app-type",
      title: "Application type (check one)",
      fields: [
        {
          box: "Application type",
          value: d.appType === "new" ? "Apply for a new ITIN" : d.appType === "renew" ? "Renew an existing ITIN" : "",
          required: true,
        },
      ],
    },
    {
      id: "reason",
      title: "Reason you are submitting this form (check one, a-h)",
      fields: [
        {
          box: "Reason box (a-h)",
          value: d.reasonBox ? `(${d.reasonBox}) ${reasonText}` : "",
          required: false,
          note: "never auto-selected — confirm with a professional",
        },
        {
          box: "Box h (Other)",
          value: d.reasonHText,
          required: d.reasonBox === "a" || d.reasonBox === "f",
          note: "treaty country + article number; required for (a) or (f)",
        },
        {
          box: "If d, enter relationship to U.S. citizen/resident alien",
          value: d.reasonDRelationship,
          required: d.reasonBox === "d",
          note: "required for reason (d)",
        },
        {
          box: "If d or e, enter name of U.S. citizen/resident alien",
          value: d.uspName,
          required: d.reasonBox === "d" || d.reasonBox === "e",
          note: "required for reason (d) or (e)",
        },
        {
          box: "If d or e, enter SSN/ITIN of U.S. citizen/resident alien",
          value: d.uspId,
          required: d.reasonBox === "d" || d.reasonBox === "e",
          note: "required for reason (d) or (e)",
        },
      ],
    },
    {
      id: "line1",
      title: "Line 1 — Name",
      fields: [
        { box: "1a First name", value: d.firstName, required: true },
        { box: "1a Middle name", value: d.middleName, required: false },
        { box: "1a Last name", value: d.lastName, required: true },
        { box: "1b Name at birth — first", value: d.birthFirstName, required: false },
        { box: "1b Name at birth — middle", value: d.birthMiddleName, required: false },
        { box: "1b Name at birth — last", value: d.birthLastName, required: false },
      ],
    },
    {
      id: "line2",
      title: "Line 2 — U.S. mailing address (P.O. box permitted)",
      fields: [
        { box: "2 Street address, apt no., or rural route no.", value: d.addr2Street, required: true },
        { box: "2 City or town", value: d.addr2City, required: true },
        { box: "2 State or province", value: d.addr2State, required: false },
        { box: "2 Country", value: d.addr2Country, required: true },
        { box: "2 ZIP or postal code", value: d.addr2Zip, required: true },
      ],
    },
    {
      id: "line3",
      title: "Line 3 — Foreign address (P.O. box NOT allowed)",
      fields: [
        { box: "3 Foreign street address, apt no., or rural route no.", value: d.addr3Street, required: true, note: "P.O. box not allowed" },
        { box: "3 City or town", value: d.addr3City, required: true },
        { box: "3 State or province", value: d.addr3State, required: false },
        { box: "3 Country", value: d.addr3Country, required: true },
        { box: "3 Postal code", value: d.addr3Zip, required: true },
      ],
    },
    {
      id: "line4",
      title: "Line 4 — Birth",
      fields: [
        { box: "4 Date of birth (MM/DD/YYYY)", value: d.dob, required: true },
        { box: "4 Country of birth", value: d.countryBirth, required: true },
        { box: "4 City and state/province of birth", value: d.cityStateBirth, required: false },
      ],
    },
    {
      id: "line5",
      title: "Line 5 — Sex",
      fields: [{ box: "5 Sex", value: d.sex === "male" ? "Male" : d.sex === "female" ? "Female" : "", required: true }],
    },
    {
      id: "line6",
      title: "Line 6 — Other information",
      fields: [
        { box: "6a Country(ies) of citizenship", value: d.citizenship, required: true },
        { box: "6b Foreign tax I.D. number", value: d.foreignTin, required: false },
        { box: "6c U.S. visa type", value: d.visaType, required: false },
        { box: "6c U.S. visa number", value: d.visaNumber, required: false },
        { box: "6c Visa expiration date", value: d.visaExp, required: false },
        { box: "6d Identification document(s) submitted", value: docLabel, required: true },
        { box: "6d Issued by", value: d.docIssuedBy, required: false },
        { box: "6d Number", value: d.docNumber, required: false },
        { box: "6d Exp. date", value: d.docExp, required: false },
        { box: "6d Date of entry into the United States (MM/DD/YYYY)", value: d.docEntryDate, required: false },
        {
          box: "6e Previously received an ITIN or IRSN?",
          value: d.prevItin === "yes" ? "Yes" : d.prevItin === "no" ? "No" : d.prevItin === "dont_know" ? "Don't know" : "",
          required: true,
        },
        { box: "6f ITIN (9XX-XX-XXXX)", value: d.itin, required: false },
        { box: "6f IRSN (9XX-XX-XXXX)", value: d.irsn, required: false },
        {
          box: "6g Name of college/university or company",
          value: d.institutionName,
          required: d.reasonBox === "f",
          note: "required for reason (f) or a business visitor",
        },
        { box: "6g City and state", value: d.institutionCityState, required: d.reasonBox === "f" },
        { box: "6g Length of stay", value: d.lengthOfStay, required: d.reasonBox === "f" },
      ],
    },
    {
      id: "sign",
      title: "Sign Here",
      fields: [
        { box: "Signature", value: "", required: false, note: "sign in ink — left blank on purpose" },
        { box: "Date", value: "", required: false, note: "sign in ink — left blank on purpose" },
        { box: "Phone number", value: "", required: false },
      ],
    },
  ];
}

// "Copy all" — filled values only, in W-7 order, labelled so each line pastes into
// the matching box. Blank fields are skipped (nothing to paste).
export function w7CloneCopyAll(d: W7Data): string {
  const lines: string[] = ["IRS Form W-7 — values (paste each into the matching box):", ""];
  for (const s of w7Clone(d)) {
    const filled = s.fields.filter((f) => f.value.trim());
    if (!filled.length) continue;
    lines.push(s.title);
    for (const f of filled) lines.push(`${f.box}: ${f.value}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

// ---------------------------------------------------------------------------
// PDF generation — faithful facsimile
// ---------------------------------------------------------------------------

const LETTER: [number, number] = [612, 792];
const M = 48;

const CHAR_MAP: Record<string, string> = {
  "\u2011": "-",
  "\u2013": "-",
  "\u2014": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2026": "...",
  "\u00a0": " ",
};
// StandardFonts (WinAnsi) can't encode everything; map the common ones and mark
// the rest with "?" so nothing is silently dropped from a legal doc.
export const pdfText = (s: string): string =>
  s.replace(/[\u2011\u2013\u2014\u2018\u2019\u201c\u201d\u2026\u00a0]/g, (c) => CHAR_MAP[c] ?? c).replace(/[^\x20-\xFF]/g, "?");

function yesNo(v: YesNoDontKnow): string {
  return v === "yes" ? "Yes" : v === "no" ? "No" : v === "dont_know" ? "Don't know" : "(not answered)";
}

export interface W7Meta {
  entityName?: string;
  generatedAt?: Date;
}

export interface W7Result {
  bytes: Uint8Array;
  filename: string;
  fieldMap: Record<string, string>;
  pages: number;
}

export async function generateW7Pdf(data: W7Data, meta: W7Meta = {}): Promise<W7Result> {
  const v = validateW7(data, meta.generatedAt ?? new Date());
  if (v.errors.length) throw new Error("Cannot generate W-7: " + v.errors.join(" "));

  // ponytail: lazy — pdf-lib is ~450 KB and only needed when a user generates a
  // W-7, so it stays out of the initial bundle.
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const BLACK = rgb(0, 0, 0);
  const GRAY = rgb(0.4, 0.4, 0.4);
  const RED = rgb(0.72, 0.05, 0.05);
  const RULE = rgb(0.75, 0.75, 0.75);

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
    const size = opts.size ?? 9;
    const fnt = opts.bold ? boldFont : font;
    const gap = opts.gap ?? size + 3;
    need(gap);
    page.drawText(pdfText(s), { x: opts.indent ?? M, y: y - size, size, font: fnt, color: opts.color ?? BLACK });
    y -= gap;
  };
  const para = (s: string, opts: { size?: number; bold?: boolean; indent?: number; gap?: number; color?: typeof BLACK } = {}) => {
    const size = opts.size ?? 9;
    const fnt = opts.bold ? boldFont : font;
    const gap = opts.gap ?? size + 3;
    const indent = opts.indent ?? M;
    const maxW = LETTER[0] - M - indent;
    const words = pdfText(s).split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (fnt.widthOfTextAtSize(t, size) > maxW) {
        if (line) lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    for (const l of lines) {
      need(gap);
      page.drawText(l, { x: indent, y: y - size, size, font: fnt, color: opts.color ?? BLACK });
      y -= gap;
    }
  };
  const rule = (gap = 10) => {
    need(gap);
    page.drawLine({ start: { x: M, y: y - 2 }, end: { x: LETTER[0] - M, y: y - 2 }, thickness: 0.5, color: RULE });
    y -= gap;
  };
  const section = (t: string) => {
    need(24);
    y -= 6;
    draw(t, { size: 10, bold: true });
    rule(6);
  };
  const field = (label: string, value: string) => {
    draw(`${label}: ${value || "—"}`, { indent: M + 8, gap: 13 });
  };
  const box = (mark: boolean, label: string) => {
    para(`${mark ? "[x]" : "[ ]"} ${label}`, { indent: M + 8, gap: 12 });
  };

  const fieldMap: Record<string, string> = {
    app_type: data.appType,
    reason_box: data.reasonBox,
    name_1a: [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" "),
    dob: data.dob,
    country_birth: data.countryBirth,
    sex: data.sex,
    citizenship: data.citizenship,
    doc_type_6d: data.docType,
    prev_itin_6e: data.prevItin,
    itin_6f: data.itin,
    irsn_6f: data.irsn,
    reason_d_relationship: data.reasonDRelationship,
    usp_name: data.uspName,
    usp_id: data.uspId,
    institution_6g: data.institutionName,
    institution_city_state_6g: data.institutionCityState,
    length_of_stay_6g: data.lengthOfStay,
    addr2: [data.addr2Street, data.addr2City, data.addr2State, data.addr2Country, data.addr2Zip].filter(Boolean).join(", "),
    addr3: [data.addr3Street, data.addr3City, data.addr3State, data.addr3Country, data.addr3Zip].filter(Boolean).join(", "),
  };

  // Header
  draw("Form W-7 — DRAFT FACSIMILE", { size: 15, bold: true, gap: 18 });
  para("Application for IRS Individual Taxpayer Identification Number — mapped to Rev. December 2024.", {
    size: 9,
    color: GRAY,
  });
  draw("DRAFT — NOT AN IRS FORM. NOT FOR FILING AS-IS.", { size: 11, bold: true, color: RED, gap: 14 });
  para(
    "Generated by MY-LLC Dashboard as a preparation aid. Compare every field against the current official IRS Form W-7 (irs.gov/FormW7) and have a qualified US tax professional review it before you sign and file.",
    { size: 8.5, color: RED, gap: 11 }
  );
  y -= 4;
  const gen = meta.generatedAt ?? new Date();
  field("Prepared for entity", meta.entityName || "(none)");
  field("Generated", gen.toISOString().replace("T", " ").slice(0, 19) + " UTC");
  field("Disclaimer version", DISCLAIMER_VERSION);

  section("Section 1 — Application type (check one)");
  box(data.appType === "new", "Apply for a new ITIN");
  box(data.appType === "renew", "Renew an existing ITIN");

  section("Section 2 — Reason for applying (check one, a-h) — never auto-selected");
  for (const r of REASON_BOXES) box(data.reasonBox === r.id, `(${r.id}) ${r.text}`);
  if (data.reasonHText.trim()) field("Box h — treaty country + article", data.reasonHText);
  if (!data.reasonBox) para("(No reason box selected — flagged for professional review.)", { size: 8.5, color: RED, indent: M + 8 });

  section("Section 3 — Applicant name");
  field("Line 1a (name on passport)", [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ") || "—");
  if (data.birthFirstName || data.birthMiddleName || data.birthLastName) {
    field("Line 1b (name at birth)", [data.birthFirstName, data.birthMiddleName, data.birthLastName].filter(Boolean).join(" "));
  }

  section("Section 4 — Addresses, birth, citizenship, identification");
  field("Line 2 (U.S. mailing address)", fieldMap.addr2);
  field("Line 3 (foreign address — no P.O. box)", fieldMap.addr3);
  field("Line 4 — Date of birth (MM/DD/YYYY)", data.dob);
  field("Line 4 — Country of birth", data.countryBirth);
  if (data.cityStateBirth) field("Line 4 — City and state/province of birth (optional)", data.cityStateBirth);
  field("Line 5 — Sex", data.sex === "male" ? "Male" : data.sex === "female" ? "Female" : "—");
  field("Line 6a — Country(ies) of citizenship", data.citizenship);
  if (data.foreignTin) field("Line 6b — Foreign tax I.D. number", data.foreignTin);
  if (data.visaType || data.visaNumber || data.visaExp) {
    field("Line 6c — U.S. visa type / number / expiration", [data.visaType, data.visaNumber, data.visaExp].filter(Boolean).join(" / "));
  }
  field("Line 6d — Identification document(s) submitted", DOC_TYPES.find((d) => d.id === data.docType)?.label || "—");
  if (data.docIssuedBy || data.docNumber || data.docExp || data.docEntryDate) {
    field("Line 6d — Issued by / Number / Exp. / Entry date", [data.docIssuedBy, data.docNumber, data.docExp, data.docEntryDate].filter(Boolean).join(" / "));
  }
  field("Line 6e — Previously received an ITIN or IRSN?", yesNo(data.prevItin));
  if (data.itin || data.irsn) field("Line 6f — ITIN / IRSN", [data.itin && `ITIN ${data.itin}`, data.irsn && `IRSN ${data.irsn}`].filter(Boolean).join("  "));
  if (data.reasonDRelationship) field("Box d — relationship to U.S. citizen/resident alien", data.reasonDRelationship);
  if (data.uspName || data.uspId) {
    field("Box d/e — name / SSN-ITIN of U.S. citizen/resident alien", [data.uspName, data.uspId].filter(Boolean).join(" / "));
  }
  if (data.institutionName || data.institutionCityState || data.lengthOfStay) {
    field(
      "Line 6g — college/university or company / city and state / length of stay",
      [data.institutionName, data.institutionCityState, data.lengthOfStay].filter(Boolean).join(" / ")
    );
  }

  section("Sign Here (leave blank — the applicant signs in ink)");
  para("Under penalties of perjury, the applicant must sign in ink. This tool does not apply an e-signature.", {
    size: 8.5,
    color: GRAY,
    indent: M + 8,
  });
  draw("Signature: ________________________________          Date: ________________", { indent: M + 8, gap: 22 });

  // Instructions & disclaimers on their own page.
  newPage();
  draw("Instructions & Required Disclaimers", { size: 13, bold: true, gap: 18 });
  para(INLINE_WARNING_BANNER, { size: 9, bold: false, color: RED, gap: 11 });
  y -= 4;
  draw("Where to file (Form W-7, verified 2026-10-13)", { size: 10, bold: true, gap: 14 });
  para(`USPS mail: ${W7_FILING.usps}`, { size: 9 });
  para(`Private delivery: ${W7_FILING.privateDelivery}`, { size: 9 });
  para(`In person: ${W7_FILING.inPerson}`, { size: 9 });
  y -= 4;
  draw("The packet you submit must also include", { size: 10, bold: true, gap: 14 });
  for (const b of [
    "A completed U.S. federal tax return to which the ITIN applies (e.g. 1040 / 1040-NR), unless a documented exception applies.",
    "Original identity documents, or copies certified by the issuing agency. The passport is the most commonly used single document.",
    "Treaty country and article number if reason box (a) or (f) is used.",
    "If a Social Security number was denied: the SSA denial letter.",
    "Your signed Form W-7.",
  ]) para(`• ${b}`, { size: 9, indent: M + 8 });
  y -= 6;
  rule();
  draw("Global tax disclaimer", { size: 10, bold: true, gap: 14 });
  para(GLOBAL_TAX_DISCLAIMER, { size: 8.5, color: GRAY });
  y -= 6;
  rule();
  draw("Form W-7 generator disclaimer", { size: 10, bold: true, gap: 14 });
  for (const p of W7_DISCLAIMER_PARAGRAPHS) para(p, { size: 8.5, color: GRAY });
  for (const b of W7_DISCLAIMER_BULLETS) para(`- ${b}`, { size: 8.5, color: GRAY, indent: M + 8 });
  for (const p of W7_DISCLAIMER_PARAGRAPHS_2) para(p, { size: 8.5, color: GRAY });
  y -= 6;
  rule();
  draw("Professional-review acknowledgment", { size: 10, bold: true, gap: 14 });
  para(`[x] ${REVIEW_CHECKBOX_LABEL}`, { size: 8.5, color: GRAY });
  para(REVIEW_CHECKBOX_SUPPORT, { size: 8.5, color: GRAY });
  para(`Logged: ${gen.toISOString()} · Disclaimer version: ${DISCLAIMER_VERSION}`, { size: 8, color: GRAY });

  // Page 2 of the W-7 is "Acceptance Agent's Use ONLY". We are not an IRS
  // Acceptance Agent or CAA, so no certification is ever rendered.
  // ponytail: intentionally blank (spec §1) — the heading mirrors the real form.
  newPage();
  draw("Acceptance Agent's Use ONLY", { size: 12, bold: true, gap: 18 });
  para(
    "(Intentionally left blank. MY-LLC Dashboard is not an IRS Acceptance Agent or Certifying Acceptance Agent and does not certify documents.)",
    { size: 9, color: GRAY }
  );

  pdf.setTitle("Form W-7 (draft facsimile) — MY-LLC Dashboard");
  pdf.setCreator("MY-LLC Dashboard");
  pdf.setProducer("MY-LLC Dashboard (pdf-lib)");

  const bytes = await pdf.save();
  const safeName = (data.lastName || data.firstName || "applicant").replace(/[^\w-]+/g, "_");
  const stamp = gen.toISOString().slice(0, 10).replace(/-/g, "");
  return { bytes, filename: `W-7_DRAFT_${safeName}_${stamp}.pdf`, fieldMap, pages: pdf.getPageCount() };
}
