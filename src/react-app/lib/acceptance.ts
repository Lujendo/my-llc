// Document-gate acknowledgment logging (trust boundary).
//
// The professional-review tick + download must leave a record. We POST it to the
// backend and keep localStorage as a fallback, so a network/route failure never
// loses the evidence locally. Reused by every gated output (W-7, OA, Treaty).
import { api } from "./api";

// Must match the backend contract (worker/routes/documents.ts DOCUMENT_TYPES).
export type DocumentType = "terms" | "privacy" | "w7" | "oa" | "treaty_memo";

export interface AcceptanceEntry {
  documentType: DocumentType;
  documentVersion: string;
  acceptedAt: string;
  // Local-only context — kept in localStorage, not sent to the backend.
  event?: "ticked" | "downloaded";
  form?: string;
  userId?: string | null;
}

const KEY = "doc_acceptance_log";

export function logDocAcceptance(entry: AcceptanceEntry): void {
  // ponytail: localStorage first (synchronous, survives a failed POST).
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
    localStorage.setItem(KEY, JSON.stringify([...prev, entry]));
  } catch {
    /* storage unavailable — non-fatal */
  }
  // Server record (fire-and-forget). Send the exact backend contract
  // ({documentType, documentVersion, acceptedAt}); api.request throws on
  // failure, swallow it so the download is never blocked by the logging call.
  const { documentType, documentVersion, acceptedAt } = entry;
  void api
    .request("/api/documents/acceptance", {
      method: "POST",
      body: JSON.stringify({ documentType, documentVersion, acceptedAt }),
    })
    .catch(() => {
      /* backend route may not be deployed yet — localStorage already holds it */
    });
  console.info(`[${entry.form ?? documentType}] professional-review acknowledgment`, entry);
}
