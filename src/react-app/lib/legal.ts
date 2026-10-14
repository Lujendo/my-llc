// Verbatim legal content. Source of truth: content/legal/*.md — do not edit here.
// Rendered as-is at /terms and /privacy; the strings below must stay byte-for-byte
// identical to content/legal/REVIEW-CHECKBOX-COPY.md (legal-smoke.mjs enforces it).
import termsMd from "../../../content/legal/TERMS-OF-SERVICE.md?raw";
import privacyMd from "../../../content/legal/PRIVACY-POLICY.md?raw";

export const TERMS_MARKDOWN = termsMd;
export const PRIVACY_MARKDOWN = privacyMd;

// Verbatim user-facing strings from content/legal/REVIEW-CHECKBOX-COPY.md.
// `**bold**` and `[Terms of Service]` / `[Privacy Policy]` markers are rendered
// by <LegalCopy>. Keep these byte-for-byte identical to the source file.
export const ENTITY_DISCLAIMER =
  "**Creating an LLC is a legal act.** This tool helps you organize information and prepare documents. It does not give legal, tax, or accounting advice, and it does not create a lawyer–client relationship. Rules differ by state and by your country. Consult a qualified professional before forming or operating an LLC.";

export const FOOTER_COPY =
  "MY-LLC Dashboard is an educational tool. It is **not** tax, legal, or accounting advice, and using it does not create a professional relationship. Always review your filings with a qualified professional. See our [Terms of Service] and [Privacy Policy].";

export const COOKIE_BANNER_COPY =
  "We use cookies to run the site and, with your consent, to understand how it is used. You can accept or reject non-essential cookies.";

export const SIGNUP_CONSENT_COPY =
  "By creating an account, I agree to the [Terms of Service] and the [Privacy Policy]. I understand that MY-LLC Dashboard is an educational tool, not tax, legal, or accounting advice, and that I must consult a qualified professional before filing anything with the IRS.";

export const SIGNUP_ATTESTATION_COPY =
  "I confirm I am at least 18 years old and have the legal capacity to enter into this agreement.";

// Published document versions. Bump when the content/legal/*.md files change so
// the consent record points at the version the user actually agreed to.
export const TERMS_VERSION = "v1.0";
export const PRIVACY_VERSION = "v1.0";

// What we send to /api/auth/register as evidence of informed consent. The backend
// may ignore it today; the record is still captured client-side.
export interface SignupConsent {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  attestedAdult: boolean;
  termsVersion: string;
  privacyVersion: string;
  timestamp: string;
}
