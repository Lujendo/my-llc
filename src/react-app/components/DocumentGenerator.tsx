import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Entity, User } from "../types";
import { Card, Button, Modal, Alert } from "./UI";
import {
  emptyW7,
  validateW7,
  generateW7Pdf,
  w7Clone,
  w7CloneCopyAll,
  W7_OFFICIAL_URL,
  REASON_BOXES,
  DOC_TYPES,
  DISCLAIMER_VERSION,
  GLOBAL_TAX_DISCLAIMER,
  W7_DISCLAIMER_PARAGRAPHS,
  W7_DISCLAIMER_BULLETS,
  W7_DISCLAIMER_PARAGRAPHS_2,
  REVIEW_CHECKBOX_LABEL,
  REVIEW_CHECKBOX_SUPPORT,
  INLINE_WARNING_BANNER,
  type W7Data,
} from "../lib/w7";
import {
  emptyOA,
  validateOA,
  generateOaPdf,
  OA_SUPPORTED_STATES,
  DRAFT_BANNER,
  ENTITY_CREATION_DISCLAIMER,
  ENTITY_FORMATION_DISCLAIMER,
  type OAInputs,
} from "../lib/oa";
import { logDocAcceptance, type DocumentType } from "../lib/acceptance";
import { buildTreatyMemo, TREATY_MEMO_DISCLAIMER } from "../lib/treaty";

interface DocumentGeneratorProps {
  entity: Entity | null;
  user: User | null;
}

const inputCls =
  "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

// UI form label -> backend documentType (worker/routes/documents.ts).
const DOC_TYPE_BY_FORM = {
  "W-7": "w7",
  "Operating Agreement": "oa",
  "Treaty Memo": "treaty_memo",
} as const satisfies Record<string, DocumentType>;
type FormName = keyof typeof DOC_TYPE_BY_FORM;

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

const initForm = (user: User | null): W7Data => {
  const base = emptyW7();
  const parts = String(user?.name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length) {
    base.firstName = parts[0];
    base.lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    base.middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  }
  base.citizenship = String(user?.citizenship || "");
  return base;
};

// Pre-fill the OA from the entity record + user profile. Fields the records don't
// hold (file ID, addresses, RA, annual-report date) are left for the user to enter.
const initOA = (user: User | null, entity: Entity | null): OAInputs => {
  const base = emptyOA();
  const iso = (s?: string) => {
    const d = s ? new Date(s) : null;
    return d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
  };
  base.llcName = entity?.name ?? "";
  base.state = (entity?.state ?? "WY").toUpperCase();
  base.formationDate = iso(entity?.formationDate);
  base.membersCount = entity?.membersCount ?? 1;
  base.memberName = user?.name ?? "";
  base.memberCitizenship = user?.citizenship ?? "";
  base.memberTaxResidence = user?.residency ?? "";
  base.noticeEmail = user?.email ?? "";
  return base;
};

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ entity, user }) => {
  const [activeTab, setActiveTab] = useState<"w7" | "agreement" | "memo">("w7");
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [ack, setAck] = useState(false); // ponytail: never pre-tick, never persist across reloads
  const [form, setForm] = useState<W7Data>(() => initForm(user));
  const [oaForm, setOaForm] = useState<OAInputs>(() => initOA(user, entity));
  const [oaAck, setOaAck] = useState(false); // separate gate — never shared with the W-7
  const [memoAck, setMemoAck] = useState(false); // separate gate — never shared with W-7/OA
  const previewUrlRef = useRef<string | null>(null);

  // Re-seed the OA form if the selected entity/user changes after mount.
  useEffect(() => {
    setOaForm(initOA(user, entity));
    setOaAck(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.id, user?.id]);

  const validation = useMemo(() => validateW7(form), [form]);
  const canGenerate = validation.errors.length === 0;
  const canDownload = ack && canGenerate && !generating;

  const oaValidation = useMemo(() => validateOA(oaForm), [oaForm]);
  const oaStateOk = OA_SUPPORTED_STATES.includes(oaForm.state.trim().toUpperCase() as (typeof OA_SUPPORTED_STATES)[number]);
  const oaCanDownload = oaAck && oaValidation.errors.length === 0 && !generating;

  const set = <K extends keyof W7Data>(k: K, v: W7Data[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setOA = <K extends keyof OAInputs>(k: K, v: OAInputs[K]) => setOaForm((f) => ({ ...f, [k]: v }));

  // Interactive W-7 clone: copy each value into the genuine IRS form. Copy-all
  // sits behind the same gate as download (ack + no validation errors).
  const cloneSections = useMemo(() => w7Clone(form), [form]);
  const canCopyAll = ack && canGenerate;
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setGenError("Copy failed — select the value and copy it manually.");
    }
  };
  const copyAll = () => {
    copy("__all__", w7CloneCopyAll(form));
    logAcceptance("W-7", "downloaded");
  };

  // Evidence of acknowledgment (TAX-DISCLAIMERS.md "Use rules": timestamp + version).
  // POSTs to /api/documents/acceptance with a localStorage fallback (lib/acceptance).
  const logAcceptance = (formName: FormName, event: "ticked" | "downloaded") => {
    logDocAcceptance({
      documentType: DOC_TYPE_BY_FORM[formName],
      documentVersion: DISCLAIMER_VERSION,
      acceptedAt: new Date().toISOString(),
      event,
      form: formName,
      userId: user?.id ?? null,
    });
  };

  const onAckToggle = (checked: boolean) => {
    setAck(checked);
    if (checked) logAcceptance("W-7", "ticked");
  };

  const onOaAckToggle = (checked: boolean) => {
    setOaAck(checked);
    if (checked) logAcceptance("Operating Agreement", "ticked");
  };

  const onMemoAckToggle = (checked: boolean) => {
    setMemoAck(checked);
    if (checked) logAcceptance("Treaty Memo", "ticked");
  };

  // Treaty memo download — gated on memoAck. Plain-text draft (lib/treaty).
  const downloadMemo = () => {
    const { filename, text } = buildTreatyMemo({
      taxpayer: user?.name ?? "",
      entity: entity?.name ?? "",
      citizenship: user?.citizenship ?? "",
      residency: user?.residency ?? "",
      membersCount: entity?.membersCount ?? 1,
      disregarded: true,
      hasIncome: false,
      foreignAccounts: false,
      riskLevel: "low",
    });
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logAcceptance("Treaty Memo", "downloaded");
  };

  const emit = async (asPreview: boolean, formName: FormName, make: () => Promise<{ bytes: Uint8Array; filename: string }>) => {
    setGenError(null);
    setGenerating(true);
    try {
      const result = await make();
      const blob = new Blob([new Uint8Array(result.bytes)], { type: "application/pdf" });
      if (asPreview) {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setShowPreview(true);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        logAcceptance(formName, "downloaded");
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "PDF generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  if (!entity || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please add an entity to generate documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Document Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate and download tax forms for {entity.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        {["w7", "agreement", "memo"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            {tab === "w7" && "Form W-7"}
            {tab === "agreement" && "Operating Agreement"}
            {tab === "memo" && "Treaty Memo"}
          </button>
        ))}
      </div>

      {/* W-7 Form */}
      {activeTab === "w7" && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Form W-7: ITIN Application</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            A typing and formatting aid. The IRS decides whether to issue an ITIN. Reason box (a-h) is never selected for
            you.
          </p>

          <Alert type="warning" message={INLINE_WARNING_BANNER} />

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Section 1 */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Section 1 — Application type</h3>
              <div className="flex gap-6">
                {[
                  { v: "new", l: "Apply for a new ITIN" },
                  { v: "renew", l: "Renew an existing ITIN" },
                ].map(({ v, l }) => (
                  <label key={v} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="appType"
                      checked={form.appType === v}
                      onChange={() => set("appType", v as W7Data["appType"])}
                      className="h-4 w-4"
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Section 2 — Reason for applying</h3>
              <Field label="Reason box (a-h) — not sure? leave as “I'm not sure” and have a professional confirm">
                <select
                  value={form.reasonBox}
                  onChange={(e) => set("reasonBox", e.target.value as W7Data["reasonBox"])}
                  className={inputCls}
                >
                  <option value="">I'm not sure / decide with a professional</option>
                  {REASON_BOXES.map((r) => (
                    <option key={r.id} value={r.id}>
                      ({r.id}) {r.text}
                    </option>
                  ))}
                </select>
              </Field>
              {(form.reasonBox === "a" || form.reasonBox === "f") && (
                <div className="mt-4">
                  <Field label="Box h — treaty country and article number (required for a or f)">
                    <input
                      type="text"
                      value={form.reasonHText}
                      onChange={(e) => set("reasonHText", e.target.value)}
                      placeholder="e.g. Germany, Article 10"
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
              {form.reasonBox === "d" && (
                <div className="mt-4">
                  <Field label="If d — relationship to U.S. citizen/resident alien (e.g. child, parent)">
                    <input
                      type="text"
                      value={form.reasonDRelationship}
                      onChange={(e) => set("reasonDRelationship", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
              {(form.reasonBox === "d" || form.reasonBox === "e") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="If d or e — name of U.S. citizen/resident alien">
                    <input
                      type="text"
                      value={form.uspName}
                      onChange={(e) => set("uspName", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="If d or e — SSN/ITIN of U.S. citizen/resident alien">
                    <input
                      type="text"
                      value={form.uspId}
                      onChange={(e) => set("uspId", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Section 3 */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Section 3 — Applicant name</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Line 1a — First name">
                  <input type="text" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Line 1a — Middle name">
                  <input type="text" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Line 1a — Last name">
                  <input type="text" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Section 4 — addresses */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Line 2 — U.S. mailing address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street address, apt, or P.O. box">
                  <input type="text" value={form.addr2Street} onChange={(e) => set("addr2Street", e.target.value)} className={inputCls} />
                </Field>
                <Field label="City or town">
                  <input type="text" value={form.addr2City} onChange={(e) => set("addr2City", e.target.value)} className={inputCls} />
                </Field>
                <Field label="State or province">
                  <input type="text" value={form.addr2State} onChange={(e) => set("addr2State", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Country">
                  <input type="text" value={form.addr2Country} onChange={(e) => set("addr2Country", e.target.value)} className={inputCls} />
                </Field>
                <Field label="ZIP / postal code">
                  <input type="text" value={form.addr2Zip} onChange={(e) => set("addr2Zip", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Line 3 — Foreign address <span className="text-danger text-sm">(P.O. box not allowed)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street, apt, or rural route">
                  <input type="text" value={form.addr3Street} onChange={(e) => set("addr3Street", e.target.value)} className={inputCls} />
                </Field>
                <Field label="City or town">
                  <input type="text" value={form.addr3City} onChange={(e) => set("addr3City", e.target.value)} className={inputCls} />
                </Field>
                <Field label="State or province">
                  <input type="text" value={form.addr3State} onChange={(e) => set("addr3State", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Country">
                  <input type="text" value={form.addr3Country} onChange={(e) => set("addr3Country", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Postal code">
                  <input type="text" value={form.addr3Zip} onChange={(e) => set("addr3Zip", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Section 4 — personal */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Line 4-5 — Birth and sex</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of birth (MM/DD/YYYY)">
                  <input type="text" value={form.dob} onChange={(e) => set("dob", e.target.value)} placeholder="01/15/1980" className={inputCls} />
                </Field>
                <Field label="Country of birth">
                  <input type="text" value={form.countryBirth} onChange={(e) => set("countryBirth", e.target.value)} className={inputCls} />
                </Field>
                <Field label="City and state/province of birth (optional)">
                  <input type="text" value={form.cityStateBirth} onChange={(e) => set("cityStateBirth", e.target.value)} className={inputCls} />
                </Field>
                <div>
                  <label className={labelCls}>Sex</label>
                  <div className="flex gap-6 pt-2">
                    {[
                      { v: "male", l: "Male" },
                      { v: "female", l: "Female" },
                    ].map(({ v, l }) => (
                      <label key={v} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="sex"
                          checked={form.sex === v}
                          onChange={() => set("sex", v as W7Data["sex"])}
                          className="h-4 w-4"
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Line 6 — Citizenship and identification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="6a — Country(ies) of citizenship">
                  <input type="text" value={form.citizenship} onChange={(e) => set("citizenship", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6b — Foreign tax I.D. number (if any)">
                  <input type="text" value={form.foreignTin} onChange={(e) => set("foreignTin", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6c — U.S. visa type (if any)">
                  <input type="text" value={form.visaType} onChange={(e) => set("visaType", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6c — Visa number">
                  <input type="text" value={form.visaNumber} onChange={(e) => set("visaNumber", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6c — Visa expiration date (MM/DD/YYYY)">
                  <input type="text" value={form.visaExp} onChange={(e) => set("visaExp", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6d — Identification document(s) submitted">
                  <select value={form.docType} onChange={(e) => set("docType", e.target.value as W7Data["docType"])} className={inputCls}>
                    <option value="">Select…</option>
                    {DOC_TYPES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="6d — Issued by">
                  <input type="text" value={form.docIssuedBy} onChange={(e) => set("docIssuedBy", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6d — Number">
                  <input type="text" value={form.docNumber} onChange={(e) => set("docNumber", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6d — Exp. date (MM/DD/YYYY)">
                  <input type="text" value={form.docExp} onChange={(e) => set("docExp", e.target.value)} className={inputCls} />
                </Field>
                <Field label="6d — Date of entry into the United States (MM/DD/YYYY)">
                  <input type="text" value={form.docEntryDate} onChange={(e) => set("docEntryDate", e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div className="mt-4">
                <label className={labelCls}>6e — Have you previously received an ITIN or IRSN?</label>
                <div className="flex gap-6 pt-1">
                  {[
                    { v: "yes", l: "Yes" },
                    { v: "no", l: "No" },
                    { v: "dont_know", l: "Don't know" },
                  ].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="prevItin"
                        checked={form.prevItin === v}
                        onChange={() => set("prevItin", v as W7Data["prevItin"])}
                        className="h-4 w-4"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              {form.prevItin === "yes" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="6f — ITIN (9XX-XX-XXXX)">
                    <input type="text" value={form.itin} onChange={(e) => set("itin", e.target.value)} placeholder="900-00-0000" className={inputCls} />
                  </Field>
                  <Field label="6f — IRSN (9XX-XX-XXXX)">
                    <input type="text" value={form.irsn} onChange={(e) => set("irsn", e.target.value)} className={inputCls} />
                  </Field>
                </div>
              )}

              {form.reasonBox === "f" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="6g — Name of college/university or company">
                    <input type="text" value={form.institutionName} onChange={(e) => set("institutionName", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="6g — City and state">
                    <input type="text" value={form.institutionCityState} onChange={(e) => set("institutionCityState", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="6g — Length of stay">
                    <input type="text" value={form.lengthOfStay} onChange={(e) => set("lengthOfStay", e.target.value)} placeholder="e.g. 2 years" className={inputCls} />
                  </Field>
                </div>
              )}
            </div>

            {/* Validation feedback */}
            {validation.errors.length > 0 && (
              <Alert type="error" title="Fix these before you can download" message={validation.errors.join(" ")} />
            )}
            {validation.warnings.length > 0 && (
              <Alert type="warning" title="Warnings (not blocking)" message={validation.warnings.join(" ")} />
            )}
            {genError && <Alert type="error" title="PDF generation failed" message={genError} />}

            {/* Interactive W-7 clone — copy each value into the GENUINE IRS form.
                (CEO decision: replaces the draft facsimile as the W-7 output.) */}
            <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Your W-7 — copy each value into the official IRS form
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                  This is a replica for reference, mapped to the real W-7 boxes (Rev. December 2024). Open the genuine
                  form, then paste each value above into the matching box.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={W7_OFFICIAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-blue-600 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50 dark:hover:bg-gray-600"
                  >
                    Open the official IRS Form W-7 ↗
                  </a>
                  <Button variant="primary" onClick={copyAll} disabled={!canCopyAll}>
                    {copied === "__all__" ? "Copied!" : "Copy all values"}
                  </Button>
                </div>
                {!ack && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    “Copy all values” stays disabled until you tick the acknowledgment below.
                  </p>
                )}
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {cloneSections.map((section) => (
                  <div key={section.id} className="p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{section.title}</h4>
                    <div className="space-y-1">
                      {section.fields.map((f) => (
                        <div key={f.box} className="flex items-start justify-between gap-3 py-1">
                          <div className="min-w-0">
                            <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {f.box}
                              {f.required && (
                                <span className="ml-2 font-sans not-italic text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400">
                                  {f.value.trim() ? "required" : "required — missing"}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 break-words">
                              {f.value.trim() ? (
                                f.value
                              ) : (
                                <span className="italic text-gray-400 dark:text-gray-500">
                                  (empty — {f.required ? "enter above" : "optional"})
                                </span>
                              )}
                            </div>
                            {f.note && <div className="text-[11px] text-gray-500 dark:text-gray-400">{f.note}</div>}
                          </div>
                          <button
                            type="button"
                            onClick={() => copy(f.box, f.value)}
                            disabled={!f.value.trim()}
                            className="shrink-0 px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {copied === f.box ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimers — shown before the user generates any document */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700/40 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Before you download</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{GLOBAL_TAX_DISCLAIMER}</p>
              {W7_DISCLAIMER_PARAGRAPHS.map((p) => (
                <p key={p} className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {p}
                </p>
              ))}
              <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {W7_DISCLAIMER_BULLETS.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {W7_DISCLAIMER_PARAGRAPHS_2.map((p) => (
                <p key={p} className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {p}
                </p>
              ))}

              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => onAckToggle(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{REVIEW_CHECKBOX_LABEL}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-400 mt-1">{REVIEW_CHECKBOX_SUPPORT}</span>
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => emit(true, "W-7", () => generateW7Pdf(form, { entityName: entity?.name }))}
                disabled={!canDownload}
                className="flex-1"
              >
                Preview prep sheet (PDF)
              </Button>
              <Button
                variant="success"
                onClick={() => emit(false, "W-7", () => generateW7Pdf(form, { entityName: entity?.name }))}
                disabled={!canDownload}
                isLoading={generating}
                className="flex-1"
              >
                Download prep sheet (PDF)
              </Button>
            </div>
            {!ack && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The download and “Copy all values” stay disabled until you tick the acknowledgment above.
              </p>
            )}
          </form>
        </Card>
      )}

      {/* Operating Agreement */}
      {activeTab === "agreement" && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">LLC Operating Agreement</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Wyoming single-member operating agreement, pre-filled from your entity and profile. A draft only — have a
            lawyer review it before signing.
          </p>

          {!oaStateOk ? (
            <Alert
              type="info"
              title="Coming soon"
              message={`Operating Agreement generation is available for Wyoming only. ${entity.state} is not supported yet — we will not produce an incomplete document.`}
            />
          ) : (
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <Alert type="warning" message={DRAFT_BANNER} />

              {/* Entity */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Entity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="LLC name">
                    <input type="text" value={oaForm.llcName} onChange={(e) => setOA("llcName", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="State (Wyoming only)">
                    <input type="text" value={oaForm.state} readOnly className={`${inputCls} opacity-70`} />
                  </Field>
                  <Field label="Secretary of State filing ID">
                    <input type="text" value={oaForm.fileId} onChange={(e) => setOA("fileId", e.target.value)} placeholder="2026-000123456" className={inputCls} />
                  </Field>
                  <Field label="Formation date">
                    <input type="date" value={oaForm.formationDate} onChange={(e) => setOA("formationDate", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Principal office address">
                    <input type="text" value={oaForm.principalAddress} onChange={(e) => setOA("principalAddress", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Registered agent name">
                    <input type="text" value={oaForm.registeredAgent} onChange={(e) => setOA("registeredAgent", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Registered agent address (physical, no P.O. box)">
                    <input type="text" value={oaForm.registeredAgentAddress} onChange={(e) => setOA("registeredAgentAddress", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Next annual report due">
                    <input type="date" value={oaForm.nextAnnualReportDue} onChange={(e) => setOA("nextAnnualReportDue", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Annual report fee">
                    <input type="text" value={oaForm.annualReportFee} onChange={(e) => setOA("annualReportFee", e.target.value)} placeholder="$60.00" className={inputCls} />
                  </Field>
                  <Field label="Members (single-member only)">
                    <input type="text" value={oaForm.membersCount} readOnly className={`${inputCls} opacity-70`} />
                  </Field>
                </div>
              </div>

              {/* Member */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Sole member</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Member name">
                    <input type="text" value={oaForm.memberName} onChange={(e) => setOA("memberName", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Member address">
                    <input type="text" value={oaForm.memberAddress} onChange={(e) => setOA("memberAddress", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Country of citizenship">
                    <input type="text" value={oaForm.memberCitizenship} onChange={(e) => setOA("memberCitizenship", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Country of tax residence">
                    <input type="text" value={oaForm.memberTaxResidence} onChange={(e) => setOA("memberTaxResidence", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Notice email">
                    <input type="email" value={oaForm.noticeEmail} onChange={(e) => setOA("noticeEmail", e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>

              {/* Optional */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Optional</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Effective date (defaults to formation date)">
                    <input type="date" value={oaForm.effectiveDate} onChange={(e) => setOA("effectiveDate", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Capital contribution">
                    <input type="text" value={oaForm.capitalContribution} onChange={(e) => setOA("capitalContribution", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Purpose of the LLC">
                    <input type="text" value={oaForm.purpose} onChange={(e) => setOA("purpose", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Management">
                    <select value={oaForm.management} onChange={(e) => setOA("management", e.target.value as OAInputs["management"])} className={inputCls}>
                      <option value="member">Member-managed</option>
                      <option value="manager">Manager-managed</option>
                    </select>
                  </Field>
                  {oaForm.management === "manager" && (
                    <Field label="Manager name (required for manager-managed)">
                      <input type="text" value={oaForm.managerName} onChange={(e) => setOA("managerName", e.target.value)} className={inputCls} />
                    </Field>
                  )}
                  <Field label="Signature date (defaults to today)">
                    <input type="date" value={oaForm.signatureDate} onChange={(e) => setOA("signatureDate", e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>

              {/* Validation feedback */}
              {oaValidation.errors.length > 0 && (
                <Alert type="error" title="Fix these before you can download" message={oaValidation.errors.join(" ")} />
              )}
              {oaValidation.warnings.length > 0 && (
                <Alert type="warning" title="Warnings (not blocking)" message={oaValidation.warnings.join(" ")} />
              )}
              {genError && <Alert type="error" title="PDF generation failed" message={genError} />}

              {/* Disclaimers — shown before the user generates the document */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700/40 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Before you download</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{GLOBAL_TAX_DISCLAIMER}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{ENTITY_CREATION_DISCLAIMER}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{ENTITY_FORMATION_DISCLAIMER}</p>

                <label className="flex items-start gap-3 pt-2 cursor-pointer">
                  <input type="checkbox" checked={oaAck} onChange={(e) => onOaAckToggle(e.target.checked)} className="mt-0.5 h-4 w-4" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">{REVIEW_CHECKBOX_LABEL}</span>
                    <span className="block text-xs text-gray-600 dark:text-gray-400 mt-1">{REVIEW_CHECKBOX_SUPPORT}</span>
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => emit(true, "Operating Agreement", () => generateOaPdf(oaForm))}
                  disabled={!oaCanDownload}
                  className="flex-1"
                >
                  Preview PDF
                </Button>
                <Button
                  variant="success"
                  onClick={() => emit(false, "Operating Agreement", () => generateOaPdf(oaForm))}
                  disabled={!oaCanDownload}
                  isLoading={generating}
                  className="flex-1"
                >
                  Download PDF
                </Button>
              </div>
              {!oaAck && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The download stays disabled until you tick the acknowledgment above.
                </p>
              )}
            </form>
          )}
        </Card>
      )}

      {/* Treaty Memo */}
      {activeTab === "memo" && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Treaty Position Memo</h2>
          <div className="space-y-4">
            <Alert
              type="info"
              message="This memo documents your tax treaty election and foreign tax credit strategy. Required for German tax filing."
            />
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Treaty Position Statement</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">Taxpayer: {user.name}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">Entity: {entity.name}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">Citizenship: {user.citizenship}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Under the income tax treaty between the United States and {user.citizenship}, and as a {entity.membersCount}-member LLC treated as a disregarded entity for U.S. tax purposes, the undersigned claims treaty relief under Article 23 (Relief from Double Taxation).
              </p>
            </div>

            {/* Disclaimers + enforced review gate (same pattern as W-7 / OA). */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700/40 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Before you download</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{TREATY_MEMO_DISCLAIMER}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{GLOBAL_TAX_DISCLAIMER}</p>
              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input type="checkbox" checked={memoAck} onChange={(e) => onMemoAckToggle(e.target.checked)} className="mt-0.5 h-4 w-4" />
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{REVIEW_CHECKBOX_LABEL}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-400 mt-1">{REVIEW_CHECKBOX_SUPPORT}</span>
                </span>
              </label>
            </div>

            <Button variant="success" onClick={downloadMemo} disabled={!memoAck} className="w-full">
              Download Treaty Memo
            </Button>
            {!memoAck && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The download stays disabled until you tick the acknowledgment above.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        title={`${activeTab === "w7" ? "Form W-7" : activeTab === "agreement" ? "Operating Agreement" : "Treaty Memo"} Preview`}
        onClose={() => setShowPreview(false)}
      >
        {activeTab === "w7" && previewUrl ? (
          <div className="space-y-3">
            <Alert type="warning" message={INLINE_WARNING_BANNER} />
            <iframe title="W-7 preview" src={previewUrl} className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded" />
            <a href={previewUrl} download className="text-sm text-blue-600 dark:text-blue-400 underline">
              Open in a new tab
            </a>
          </div>
        ) : activeTab === "agreement" && previewUrl ? (
          <div className="space-y-3">
            <Alert type="warning" message={DRAFT_BANNER} />
            <iframe title="Operating Agreement preview" src={previewUrl} className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded" />
            <a href={previewUrl} download className="text-sm text-blue-600 dark:text-blue-400 underline">
              Open in a new tab
            </a>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Preview available from the Form W-7 tab.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
