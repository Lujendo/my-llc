// Runnable check: node w7-smoke.mjs
// Verifies W-7 validation rules and that a real PDF is produced.
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import {
  emptyW7,
  validateW7,
  generateW7Pdf,
  w7Clone,
  w7CloneCopyAll,
  W7_OFFICIAL_URL,
} from "./src/react-app/lib/w7.ts";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ok  -", msg);
  else {
    failures++;
    console.error("  FAIL-", msg);
  }
};
const validData = () => {
  const d = emptyW7();
  Object.assign(d, {
    appType: "new",
    reasonBox: "b",
    firstName: "Maria",
    lastName: "Rossi",
    addr2Street: "1 Main St",
    addr2City: "Austin",
    addr2State: "TX",
    addr2Country: "USA",
    addr2Zip: "78701",
    addr3Street: "Via Roma 10",
    addr3City: "Milan",
    addr3Country: "Italy",
    addr3Zip: "20100",
    dob: "01/15/1980",
    countryBirth: "Italy",
    sex: "female",
    citizenship: "Italy",
    docType: "passport",
    prevItin: "no",
  });
  return d;
};

console.log("validation:");
ok(validateW7(emptyW7()).errors.length >= 8, "empty form is blocked with many errors");
ok(validateW7(validData()).errors.length === 0, "valid form has no errors");

const poBox = validData();
poBox.addr3Street = "P.O. Box 12";
ok(validateW7(poBox).errors.some((e) => /P\.O\. box/i.test(e)), "P.O. box in foreign address is rejected");

const reasonA = validData();
reasonA.reasonBox = "a";
ok(validateW7(reasonA).errors.some((e) => /Box h/i.test(e)), "reason (a) requires Box h (treaty country + article)");

const noReason = validData();
noReason.reasonBox = "";
ok(validateW7(noReason).errors.length === 0 && validateW7(noReason).warnings.some((w) => /Reason box/i.test(w)), "blank reason box warns but does not hard-block");

const prevYes = validData();
prevYes.prevItin = "yes";
ok(validateW7(prevYes).errors.some((e) => /6f/i.test(e)), "6e=Yes requires a prior ITIN/IRSN");
prevYes.itin = "123-45-6789";
ok(validateW7(prevYes).errors.some((e) => /9XX-XX-XXXX/.test(e)), "ITIN must match 9XX-XX-XXXX");
prevYes.itin = "912-34-5678";
ok(validateW7(prevYes).errors.length === 0, "valid 9XX-XX-XXXX ITIN passes");

// Box d — relationship + U.S. person name/SSN-ITIN.
const reasonD = validData();
reasonD.reasonBox = "d";
ok(validateW7(reasonD).errors.some((e) => /relationship/i.test(e)), "reason (d) requires the relationship to the U.S. person");
reasonD.reasonDRelationship = "child";
ok(validateW7(reasonD).errors.some((e) => /U\.S\. citizen\/resident alien/i.test(e)), "reason (d) requires the U.S. person's name + SSN/ITIN");
reasonD.uspName = "John Doe";
reasonD.uspId = "123-45-6789";
ok(validateW7(reasonD).errors.length === 0, "reason (d) passes once relationship + U.S. person are filled");

// Box e — U.S. person name/SSN-ITIN (no relationship field).
const reasonE = validData();
reasonE.reasonBox = "e";
ok(validateW7(reasonE).errors.some((e) => /U\.S\. citizen\/resident alien/i.test(e)), "reason (e) requires the U.S. person's name + SSN/ITIN");
reasonE.uspName = "Jane Doe";
reasonE.uspId = "987-65-4321";
ok(validateW7(reasonE).errors.length === 0, "reason (e) passes once the U.S. person is filled");

// Line 6g — required for reason (f).
const reasonF = validData();
reasonF.reasonBox = "f";
reasonF.reasonHText = "Germany, Article 10";
ok(validateW7(reasonF).errors.some((e) => /6g/i.test(e)), "reason (f) requires line 6g (institution/company)");
reasonF.institutionName = "TU Munich";
reasonF.institutionCityState = "Munich, Bavaria";
reasonF.lengthOfStay = "2 years";
ok(validateW7(reasonF).errors.length === 0, "reason (f) passes once 6g is filled");

// Item 2 lock-in: the reason box is never pre-selected and no advisory mapping
// reaches the UI (the tool must not "tell you which box").
ok(emptyW7().reasonBox === "", "reason box is never pre-selected (defaults to blank)");
const genSrcForAdvisory = readFileSync(new URL("./src/react-app/components/DocumentGenerator.tsx", import.meta.url), "utf8");
ok(!/recommend|advisory|suggest/i.test(genSrcForAdvisory), "no box recommendation/advisory mapping reaches the UI");

const badDob = validData();
badDob.dob = "13/45/1980";
ok(validateW7(badDob).errors.some((e) => /MM\/DD\/YYYY/i.test(e)), "malformed DOB is rejected");
badDob.dob = "01/15/2999";
ok(validateW7(badDob).errors.some((e) => /future/i.test(e)), "future DOB is rejected");

console.log("clone model (copy into the genuine IRS W-7):");
ok(W7_OFFICIAL_URL === "https://www.irs.gov/pub/irs-pdf/fw7.pdf", "official IRS W-7 URL points at the genuine fw7.pdf");
const sections = w7Clone(validData());
const fields = sections.flatMap((s) => s.fields);
const boxes = fields.map((f) => f.box);

// Real W-7 boxes from W-7-FORM-SPEC.md §2–§4 (Rev. December 2024).
for (const b of [
  "Application type",
  "Reason box (a-h)",
  "1a First name",
  "1a Last name",
  "1b Name at birth — first",
  "2 City or town",
  "2 Country",
  "3 Foreign street address, apt no., or rural route no.",
  "4 Date of birth (MM/DD/YYYY)",
  "4 Country of birth",
  "5 Sex",
  "6a Country(ies) of citizenship",
  "6b Foreign tax I.D. number",
  "6c U.S. visa type",
  "6d Identification document(s) submitted",
  "6e Previously received an ITIN or IRSN?",
  "6f ITIN (9XX-XX-XXXX)",
  "6g Name of college/university or company",
  "6g City and state",
  "6g Length of stay",
  "If d, enter relationship to U.S. citizen/resident alien",
  "If d or e, enter name of U.S. citizen/resident alien",
  "If d or e, enter SSN/ITIN of U.S. citizen/resident alien",
]) {
  ok(boxes.includes(b), `clone maps real W-7 box: ${b}`);
}
ok(boxes.some((b) => /6g/.test(b)), "Line 6g is present (exists on Rev. 12-2024)");
const g6 = fields.filter((f) => /6g/.test(f.box));
ok(g6.length === 3 && g6.every((f) => f.required === false), "6g boxes are optional unless reason (f) is selected");
const signSection = sections.find((s) => s.id === "sign");
ok(!!signSection && signSection.fields.every((f) => !f.value), "Sign Here is present and left blank (no e-signature)");

const missingRequired = fields.filter((f) => f.required && !f.value.trim());
ok(missingRequired.length === 0, "every required W-7 box is filled for a valid form");
ok(fields.some((f) => !f.required && !f.value.trim()), "optional/empty boxes are shown, not hidden");

console.log("copy values:");
const all = w7CloneCopyAll(validData());
for (const [box, val] of [
  ["1a First name", "Maria"],
  ["4 Date of birth (MM/DD/YYYY)", "01/15/1980"],
  ["6a Country(ies) of citizenship", "Italy"],
]) {
  ok(all.includes(`${box}: ${val}`), `copy-all carries ${box} -> ${val}`);
}
ok(all.includes("Reason box (a-h): (b)"), "copy-all carries the selected reason box");
ok(!w7CloneCopyAll(emptyW7()).includes("1a First name:"), "copy-all skips empty fields");

console.log("gate (source-level):");
const genSrc = readFileSync(new URL("./src/react-app/components/DocumentGenerator.tsx", import.meta.url), "utf8");
ok(/const canCopyAll = ack && canGenerate/.test(genSrc), "Copy all is gated on the ack checkbox");
ok(/const canDownload = ack && canGenerate && !generating/.test(genSrc), "PDF download is gated on the ack checkbox");
ok(/W7_OFFICIAL_URL/.test(genSrc) && /target="_blank"/.test(genSrc), "official IRS link is rendered (opens in a new tab)");

console.log("pdf generation:");
const res = await generateW7Pdf(validData(), { entityName: "Rossi LLC", generatedAt: new Date("2026-10-13T12:00:00Z") });
const head = new TextDecoder().decode(res.bytes.slice(0, 5));
ok(head === "%PDF-", "output starts with the PDF magic header");
ok(res.bytes.length > 2000, `output is a non-trivial file (${res.bytes.length} bytes)`);
ok(res.filename.endsWith(".pdf") && res.filename.includes("DRAFT"), `filename is ${res.filename}`);
ok(res.pages >= 3, `has the form + instructions + blank Acceptance-Agent page (${res.pages} pages)`);

const reloaded = await PDFDocument.load(res.bytes);
ok(reloaded.getPageCount() === res.pages, "generated PDF reloads with pdf-lib");

ok(res.fieldMap.reason_box === "b", "fieldMap carries the selected reason box");
ok(res.fieldMap.dob === "01/15/1980", "fieldMap carries the DOB");
ok(res.fieldMap.name_1a === "Maria Rossi", "fieldMap carries the applicant name");

let threw = false;
try {
  await generateW7Pdf(emptyW7());
} catch {
  threw = true;
}
ok(threw, "generation refuses invalid data (no silent bad PDF)");

console.log(failures === 0 ? "\nW-7 smoke check PASSED" : `\nW-7 smoke check FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
