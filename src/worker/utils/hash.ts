// Password hashing: PBKDF2-SHA256 via WebCrypto (native, no deps).
//
// ponytail: 100_000 iterations is the Cloudflare Workers WebCrypto ceiling —
// higher counts throw "Pbkdf2 failed: iteration counts above 100000". Raise only
// if the platform lifts the cap. 100k PBKDF2-SHA256 is the OWASP-recommended
// floor for this KDF, so we are at the max the runtime allows.
const ITERATIONS = 100_000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

const enc = new TextEncoder();

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

// Constant-time compare so verification time does not leak hash bytes.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

// Stored format: pbkdf2$<iterations>$<saltB64>$<hashB64>
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

// Legacy format (pre-hardening): <saltB64>:<sha256B64>. Kept only so existing
// users can still log in; they are rehashed to PBKDF2 on next successful login.
async function verifyLegacySha256(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const salt = fromB64(saltB64);
  const expected = fromB64(hashB64);
  const data = new Uint8Array(salt.length + enc.encode(password).length);
  data.set(salt);
  data.set(enc.encode(password), salt.length);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return timingSafeEqual(digest, expected);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith("pbkdf2$")) {
      const [, iterStr, saltB64, hashB64] = stored.split("$");
      const iterations = parseInt(iterStr, 10);
      if (!iterations || !saltB64 || !hashB64) return false;
      const actual = await pbkdf2(password, fromB64(saltB64), iterations);
      return timingSafeEqual(actual, fromB64(hashB64));
    }
    return verifyLegacySha256(password, stored);
  } catch {
    return false;
  }
}

// True when a stored hash uses an outdated scheme and should be upgraded on the
// next successful login (we only have the plaintext at that moment).
export function needsRehash(stored: string): boolean {
  if (!stored.startsWith("pbkdf2$")) return true;
  const iterations = parseInt(stored.split("$")[1], 10);
  return !iterations || iterations < ITERATIONS;
}
