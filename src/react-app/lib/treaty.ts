// Treaty Memo output — a plain-text draft the user can hand to a professional.
// ponytail: text, not PDF — no new dep, and the memo is a draft for review anyway.
// The gate (review checkbox + disclaimer) is enforced in the components; this file
// only builds the content.
import { GLOBAL_TAX_DISCLAIMER, REVIEW_CHECKBOX_LABEL } from "./w7";

export const TREATY_MEMO_DISCLAIMER =
  "Draft only — not tax advice. This memo was generated from the information you entered. It may contain errors or be out of date. Have a qualified tax professional review it before you rely on it or file anything. You are responsible for the final filing.";

export interface TreatyMemoInput {
  taxpayer: string;
  entity: string;
  citizenship: string;
  residency: string;
  membersCount: number;
  disregarded: boolean;
  hasIncome: boolean;
  foreignAccounts: boolean;
  riskLevel: "low" | "high";
}

export function buildTreatyMemo(input: TreatyMemoInput): { filename: string; text: string } {
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = (input.entity || input.taxpayer || "entity").replace(/[^\w-]+/g, "_");
  const lines = [
    "TREATY POSITION MEMO — DRAFT",
    "=".repeat(40),
    "",
    `Taxpayer: ${input.taxpayer || "—"}`,
    `Entity: ${input.entity || "—"}`,
    `Citizenship: ${input.citizenship || "—"}`,
    `Country of tax residence: ${input.residency || "—"}`,
    `Members: ${input.membersCount}`,
    `Entity structure: ${input.disregarded ? "Disregarded LLC (single-member)" : "C-corp or partnership"}`,
    `Income status: ${input.hasIncome ? "Active income generator" : "No income (holding/future)"}`,
    `Foreign accounts/assets over $10k: ${input.foreignAccounts ? "Yes" : "No"}`,
    `Double-taxation risk (tool estimate): ${input.riskLevel.toUpperCase()}`,
    "",
    "Position",
    "--------",
    `Under the income tax treaty between the United States and ${input.citizenship || "the taxpayer's country"},`,
    `and as a ${input.membersCount}-member LLC treated as a disregarded entity for U.S. tax purposes,`,
    "the undersigned claims treaty relief under the applicable article (Relief from Double Taxation).",
    "Confirm the exact treaty article and the filing position with a qualified tax professional.",
    "",
    "Disclaimer",
    "----------",
    TREATY_MEMO_DISCLAIMER,
    "",
    GLOBAL_TAX_DISCLAIMER,
    "",
    `[x] ${REVIEW_CHECKBOX_LABEL}`,
    `Generated: ${new Date().toISOString()}`,
  ];
  return { filename: `Treaty_Memo_DRAFT_${safe}_${stamp.replace(/-/g, "")}.txt`, text: lines.join("\n") };
}
