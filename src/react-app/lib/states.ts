// Canonical US state storage = 2-letter code (e.g. "WY"). The UI shows the full
// name. The OA generator gates on the code (lib/oa.ts: OA_SUPPORTED_STATES = ["WY"]),
// so every entity write goes through toStateCode() — never store a full name.
export const US_STATES: { code: string; name: string }[] = [
  { code: "WY", name: "Wyoming" },
  { code: "DE", name: "Delaware" },
  { code: "NV", name: "Nevada" },
];

const NAME_TO_CODE = new Map(US_STATES.map((s) => [s.name.toLowerCase(), s.code]));

export function toStateCode(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  if (!s) return "";
  if (s.length === 2) return s.toUpperCase();
  return NAME_TO_CODE.get(s.toLowerCase()) ?? s.toUpperCase();
}

export function stateLabel(v: string | null | undefined): string {
  const code = toStateCode(v);
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}
