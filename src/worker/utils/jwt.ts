import { sign, verify } from "hono/jwt";

export async function generateJWT(
  userId: string,
  email: string,
  secret: string,
  expirationSeconds: number = 900 // 15 minutes
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: userId,
      email,
      iat: now,
      exp: now + expirationSeconds,
    },
    secret
  );
}

export async function verifyJWT(token: string, secret: string): Promise<{ sub: string; email: string } | null> {
  try {
    const payload = await verify(token, secret);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}
