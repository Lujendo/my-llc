// Runnable check: node legal-smoke.mjs
// Guards the legal/trust boundary: the verbatim copy from
// content/legal/REVIEW-CHECKBOX-COPY.md must reach the UI unchanged, and the
// signup consent gate must be enforced (not cosmetic).
import { readFileSync } from "node:fs";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ok  -", msg);
  else {
    failures++;
    console.error("  FAIL-", msg);
  }
};

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
// Normalize markdown emphasis / link brackets / whitespace so formatting does
// not cause false negatives.
const norm = (s) =>
  s
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
const has = (haystack, needle) => norm(haystack).includes(norm(needle));

const copy = read("./content/legal/REVIEW-CHECKBOX-COPY.md");
const legal = read("./src/react-app/lib/legal.ts");
const auth = read("./src/react-app/components/AuthForms.tsx");
const footer = read("./src/react-app/components/Footer.tsx");
const cookie = read("./src/react-app/components/CookieConsent.tsx");
const entity = read("./src/react-app/components/EntityManager.tsx");
const app = read("./src/react-app/App.tsx");

const quotes = copy
  .split("\n")
  .filter((l) => l.startsWith("> "))
  .map((l) => l.slice(2));
const findQuote = (needle) => quotes.find((q) => q.includes(needle));

console.log("verbatim copy matches the source file:");
const cases = [
  ["Creating an LLC is a legal act", "ENTITY_DISCLAIMER"],
  ["MY-LLC Dashboard is an educational tool. It is", "FOOTER_COPY"],
  ["We use cookies to run the site", "COOKIE_BANNER_COPY"],
  ["By creating an account, I agree", "SIGNUP_CONSENT_COPY"],
  ["I confirm I am at least 18 years old", "SIGNUP_ATTESTATION_COPY"],
];
for (const [needle, name] of cases) {
  let q = findQuote(needle);
  // §5's source line ends with the button labels; those are rendered as buttons.
  if (name === "COOKIE_BANNER_COPY") q = q.replace(/\s*\[Accept all\][\s\S]*$/, "");
  ok(q && has(legal, q), `${name} is byte-for-byte the source copy`);
}

console.log("components render the shared constants:");
ok(footer.includes("FOOTER_COPY"), "Footer renders FOOTER_COPY");
ok(auth.includes("SIGNUP_CONSENT_COPY"), "AuthForms renders SIGNUP_CONSENT_COPY");
ok(auth.includes("SIGNUP_ATTESTATION_COPY"), "AuthForms renders SIGNUP_ATTESTATION_COPY");
ok(cookie.includes("COOKIE_BANNER_COPY"), "CookieConsent renders COOKIE_BANNER_COPY");
ok(entity.includes("ENTITY_DISCLAIMER"), "EntityManager renders ENTITY_DISCLAIMER");

console.log("signup consent gate is enforced:");
ok(
  /disabled=\{mode === "signup" && \(!consent \|\| !attestation\)\}/.test(auth),
  "Sign Up button is disabled until consent AND attestation are ticked"
);
ok(
  /if \(!consent\)/.test(auth) && /if \(!attestation\)/.test(auth) && /throw new Error/.test(auth),
  "handleSubmit throws when consent or attestation is missing (not cosmetic)"
);
ok(
  auth.includes("checked={consent}") && auth.includes("checked={attestation}") && !/checked=\{true\}/.test(auth),
  "consent + attestation checkboxes are not pre-ticked"
);
ok(
  auth.includes("acceptedTerms") && auth.includes("termsVersion") && auth.includes("timestamp"),
  "signup sends a consent record (terms/privacy versions + timestamp)"
);
ok(!/test@example\.com/.test(auth), "no test credentials are shown on the login screen");

console.log("cookie banner has reject parity:");
ok(
  cookie.includes("Reject non-essential") && cookie.includes("Accept all"),
  "both Accept all and Reject non-essential are real buttons"
);
ok(
  /variant="primary"[\s\S]*?Accept all[\s\S]*?variant="primary"[\s\S]*?Reject non-essential/.test(cookie),
  "Accept and Reject are equal-prominence (both primary)"
);
ok(cookie.includes("Cookie settings"), "Cookie settings is reachable to change choices");

console.log("legal links are real routes:");
const legalCopy = read("./src/react-app/components/LegalCopy.tsx");
ok(
  legalCopy.includes('href="/terms"') && legalCopy.includes('href="/privacy"'),
  "Terms/Privacy render as real <a href> links"
);
ok(
  app.includes("window.location.pathname") && app.includes('"/terms"') && app.includes('"/privacy"'),
  "App reads the pathname for /terms and /privacy"
);

console.log("legal pages render from the content files:");
ok(
  legal.includes("TERMS-OF-SERVICE.md?raw") && legal.includes("PRIVACY-POLICY.md?raw"),
  "ToS + Privacy are imported verbatim from content/legal/*.md"
);
ok(
  app.includes("TERMS_MARKDOWN") && app.includes("PRIVACY_MARKDOWN"),
  "App renders the legal pages from those imports"
);
ok(
  copy.includes("TEMPLATE — requires review by a licensed attorney"),
  "source copy still carries the attorney-review banner"
);

console.log(failures === 0 ? "\nLegal smoke check PASSED" : `\nLegal smoke check FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
