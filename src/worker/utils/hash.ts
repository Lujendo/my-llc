// ponytail: Simple SHA256 + salt for MVP (NOT production!)
// TODO: Replace with secure method before production

declare const crypto: Crypto;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = new Uint8Array(salt.length + encoder.encode(password).length);
  data.set(salt);
  data.set(encoder.encode(password), salt.length);
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  
  return `${saltB64}:${hashB64}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltB64, hashB64] = hash.split(":");
    const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
    const storedHash = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));
    
    const encoder = new TextEncoder();
    const data = new Uint8Array(salt.length + encoder.encode(password).length);
    data.set(salt);
    data.set(encoder.encode(password), salt.length);
    
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const computedHash = new Uint8Array(hashBuffer);
    
    return computedHash.every((v, i) => v === storedHash[i]);
  } catch (e) {
    return false;
  }
}
