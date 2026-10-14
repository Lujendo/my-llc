// Runnable check: node oa-smoke.mjs
// Verifies Operating Agreement validation, that a real PDF is produced, that every
// token is resolved, and that the DRAFT banner travels inside the file.
import { PDFDocument } from "pdf-lib";
import zlib from "node:zlib";
import {
  emptyOA,
  validateOA,
  generateOaPdf,
  renderOA,
  resolveOAFields,
  hasUnresolvedTokens,
} from "./src/react-app/lib/oa.ts";

// pdf-lib Flate-compresses content streams and hex-encodes StandardFont text, so a
// raw byte search misses it. Inflate each stream and look for the hex form of the text.
function pdfContains(bytes, text) {
  const needle = Buffer.from(text, "latin1").toString("hex").toUpperCase();
  const buf = Buffer.from(bytes);
  const s = buf.toString("latin1");
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(s))) {
    const start = m.index + m[0].length;
    const end = s.indexOf("endstream", start);
    if (end < 0) continue;
    const chunk = buf.subarray(start, end);
    for (const c of [chunk, chunk.subarray(0, chunk.length - 1), chunk.subarray(0, chunk.length - 2)]) {
      let out;
      try {
        out = zlib.inflateSync(c).toString("latin1");
      } catch {
        out = c.toString("latin1");
      }
      if (out.toUpperCase().includes(needle)) return true;
    }
  }
  return false;
}

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ok  -", msg);
  else {
    failures++;
    console.error("  FAIL-", msg);
  }
};

const validData = () => {
  const d = emptyOA();
  Object.assign(d, {
    llcName: "Rossi Holdings LLC",
    state: "WY",
    fileId: "2026-000123456",
    formationDate: "2026-03-04",
    principalAddress: "30 N Gould St, Sheridan, WY 82801",
    registeredAgent: "Registered Agents Inc.",
    registeredAgentAddress: "30 N Gould St, Ste R, Sheridan, WY 82801",
    nextAnnualReportDue: "2027-03-01",
    annualReportFee: "$60.00",
    membersCount: 1,
    memberName: "Maria Rossi",
    memberAddress: "Via Roma 10, Milan, Italy",
    memberCitizenship: "Italy",
    memberTaxResidence: "Italy",
    noticeEmail: "maria@example.com",
  });
  return d;
};

console.log("validation:");
ok(validateOA(emptyOA()).errors.length >= 10, "empty form is blocked with many errors");
ok(validateOA(validData()).errors.length === 0, "valid Wyoming single-member form has no errors");

const de = validData();
de.state = "DE";
ok(validateOA(de).errors.some((e) => /Wyoming/i.test(e)), "Delaware is blocked (coming soon, no incomplete doc)");

const nv = validData();
nv.state = "NV";
ok(validateOA(nv).errors.some((e) => /Wyoming/i.test(e)), "Nevada is blocked (coming soon)");

const multi = validData();
multi.membersCount = 2;
ok(validateOA(multi).errors.some((e) => /single-member/i.test(e)), "multi-member is blocked");

const noFile = validData();
noFile.fileId = "";
ok(validateOA(noFile).errors.some((e) => /file ID/i.test(e)), "missing file ID blocks generation");

const badDate = validData();
badDate.formationDate = "2026-13-40";
ok(validateOA(badDate).errors.some((e) => /real date/i.test(e)), "malformed formation date is rejected");

const mgr = validData();
mgr.management = "manager";
ok(validateOA(mgr).errors.some((e) => /[Mm]anager name/i.test(e)), "manager-managed requires a manager name");
mgr.managerName = "Maria Rossi";
ok(validateOA(mgr).errors.length === 0, "manager-managed with a name passes");

const poBox = validData();
poBox.registeredAgentAddress = "P.O. Box 100, Sheridan, WY";
ok(validateOA(poBox).warnings.some((w) => /P\.O\. box/i.test(w)), "P.O. box registered-agent address warns (physical required)");

console.log("token resolution:");
const fields = resolveOAFields(validData(), new Date("2026-10-13T12:00:00Z"));
const blocks = renderOA(fields, validData());
const txt = blocks.map((b) => ("text" in b ? b.text : "")).join("\n");
ok(!hasUnresolvedTokens(txt), "no unresolved {{...}} tokens remain in the rendered document");
ok(txt.includes("Rossi Holdings LLC"), "LLC name is merged");
ok(txt.includes("Maria Rossi"), "member name is merged");
ok(!txt.includes("{{"), "no stray opening braces remain");

console.log("pdf generation:");
const res = await generateOaPdf(validData(), { generatedAt: new Date("2026-10-13T12:00:00Z") });
const head = new TextDecoder().decode(res.bytes.slice(0, 5));
ok(head === "%PDF-", "output starts with the PDF magic header");
ok(res.bytes.length > 4000, `output is a non-trivial file (${res.bytes.length} bytes)`);
ok(res.filename.endsWith(".pdf") && res.filename.includes("DRAFT"), `filename is ${res.filename}`);
ok(res.pages >= 2, `has the agreement + disclaimer page (${res.pages} pages)`);

ok(pdfContains(res.bytes, "HAVE A LAWYER REVIEW"), "DRAFT banner text is embedded inside the PDF file");
ok(pdfContains(res.bytes, "DRAFT - HAVE A LAWYER REVIEW. NOT REVIEWED BY COUNSEL. NOT LEGAL ADVICE."), "full DRAFT banner travels inside the file");
ok(pdfContains(res.bytes, "Rossi Holdings LLC"), "LLC name is drawn into the PDF content");

const reloaded = await PDFDocument.load(res.bytes);
ok(reloaded.getPageCount() === res.pages, "generated PDF reloads with pdf-lib");

ok(res.fieldMap.LLC_NAME === "Rossi Holdings LLC", "fieldMap carries the LLC name");
ok(res.fieldMap.FILE_ID === "2026-000123456", "fieldMap carries the file ID");
ok(!hasUnresolvedTokens(res.plainText), "returned plainText has no unresolved tokens");

let threw = false;
try {
  await generateOaPdf(emptyOA());
} catch {
  threw = true;
}
ok(threw, "generation refuses invalid data (no silent incomplete OA)");

let threwDe = false;
try {
  const bad = validData();
  bad.state = "DE";
  await generateOaPdf(bad);
} catch {
  threwDe = true;
}
ok(threwDe, "generation refuses an unsupported state (no incomplete document)");

console.log(failures === 0 ? "\nOA smoke check PASSED" : `\nOA smoke check FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
