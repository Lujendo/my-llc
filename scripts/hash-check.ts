// ponytail: one runnable check for the password-hash path (security-critical).
// Run: node scripts/hash-check.ts
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, needsRehash } from "../src/worker/utils/hash.ts";

// Legacy seed hash for "password123" (salt:sha256B64) — must still verify.
const LEGACY = "jSnzF6gUn1ZUn30Ar7+/Eg==:7GOuCzum85+Yd97WpAn/BTSEKO42nCvnocCouGWu5wY=";

const h = await hashPassword("password123");

// 1. New hashes use PBKDF2, not a bare SHA-256 digest.
assert.match(h, /^pbkdf2\$100000\$/, "hash must be PBKDF2 with 100k iterations");
assert.doesNotMatch(h, /^[0-9a-f]{64}$/, "hash must NOT be a bare SHA-256 hex digest");

// 2. Round-trip + rejection.
assert.equal(await verifyPassword("password123", h), true, "correct password verifies");
assert.equal(await verifyPassword("wrong", h), false, "wrong password rejected");

// 3. Same password hashes differently (random salt).
assert.notEqual(await hashPassword("password123"), h, "salt must be random per hash");

// 4. Legacy SHA-256 hashes still verify (backward compat / migration path).
assert.equal(await verifyPassword("password123", LEGACY), true, "legacy hash verifies");
assert.equal(await verifyPassword("wrong", LEGACY), false, "legacy wrong password rejected");

// 5. Rehash detection drives the login-time upgrade.
assert.equal(needsRehash(LEGACY), true, "legacy hash needs rehash");
assert.equal(needsRehash(h), false, "pbkdf2 hash does not need rehash");

console.log("hash-check passed");
