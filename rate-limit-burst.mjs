// Runnable check: node rate-limit-burst.mjs [baseUrl]
// Proves BUG-02 is fixed: the D1-backed limiter enforces a GLOBAL limit.
// Before the fix the native binding was per-isolate, so a parallel burst spread
// across isolates let ~39/40 through. Now AUTH is 10/60s per IP, so a burst of
// 40 concurrent register calls must yield ~10 successes and the rest 429.
const baseUrl = process.argv[2] || process.env.VITE_API_URL || "https://my-llc-staging.info-eac.workers.dev";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ok  -", msg);
  else {
    failures++;
    console.error("  FAIL-", msg);
  }
};

const consent = {
  acceptedTerms: true,
  acceptedPrivacy: true,
  attestedAdult: true,
  termsVersion: "v1.0",
  privacyVersion: "v1.0",
  timestamp: new Date().toISOString(),
};

const register = async (i) => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `burst_${Date.now()}_${i}@example.com`,
      password: "password123",
      name: "Burst",
      consent,
    }),
  });
  return res.status;
};

console.log(`base: ${baseUrl}\nparallel burst of 40 register calls (AUTH limit 10/60s):`);
const statuses = await Promise.all(Array.from({ length: 40 }, (_, i) => register(i)));
const created = statuses.filter((s) => s === 201).length;
const limited = statuses.filter((s) => s === 429).length;
console.log(`  -> ${created}×201, ${limited}×429, other=${statuses.length - created - limited}`);

// Global enforcement: successes must be near the limit, not near the burst size.
// (Slack of +5 covers a window boundary landing mid-burst.)
ok(created <= 15, `successes capped near the limit (${created} <= 15) — not per-isolate`);
ok(limited >= 20, `most of the burst was rejected (${limited} >= 20)`);

console.log("immediate follow-up burst (same window) must be fully rejected:");
const follow = await Promise.all(Array.from({ length: 10 }, (_, i) => register(100 + i)));
const followCreated = follow.filter((s) => s === 201).length;
ok(followCreated === 0, `no successes in the same window (${followCreated} === 0)`);

console.log(failures === 0 ? "\nRate-limit burst check PASSED" : `\nRate-limit burst check FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
