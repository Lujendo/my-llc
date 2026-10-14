import { Context } from "hono";

// ponytail: hand-rolled validators for a handful of fields — a schema lib is not
// worth the dependency here. Swap for zod/valibot if the surface grows.
export const MAX_EMAIL = 254;
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 200;
export const MAX_NAME = 200;
export const MAX_SHORT = 64;
export const MAX_TEXT = 2000;

export function isEmail(v: unknown): v is string {
  return typeof v === "string" && v.length <= MAX_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isStr(v: unknown, max: number, min = 1): v is string {
  return typeof v === "string" && v.length >= min && v.length <= max;
}

// Optional string: absent/null is fine, otherwise must be a bounded string.
export function isOptionalStr(v: unknown, max: number): boolean {
  return v === undefined || v === null || isStr(v, max, 0);
}

export function isOptionalInt(v: unknown, min: number, max: number): boolean {
  return v === undefined || v === null || (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max);
}

// Parse a JSON object body; returns null on malformed JSON or non-object payloads.
// ponytail: `any` values keep the parsed body assignable to the service Partial<T>
// params; every field is still explicitly validated at the call site.
export async function readJson(c: Context): Promise<Record<string, any> | null> {
  try {
    const body = await c.req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, any>) : null;
  } catch {
    return null;
  }
}
