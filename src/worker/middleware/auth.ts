import { Context, Next } from "hono";
import { verifyJWT } from "../utils/jwt";

export async function authGuard(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return c.json({ success: false, error: "Invalid authorization format" }, 401);
  }

  const jwtSecret = c.env.JWT_SECRET;
  if (!jwtSecret) {
    return c.json({ success: false, error: "JWT_SECRET not configured" }, 500);
  }

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }

  c.set("user", payload);
  await next();
}

export function getUserContext(c: Context): { sub: string; email: string } | null {
  return c.get("user");
}
