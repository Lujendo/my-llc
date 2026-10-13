import { Context, Next } from "hono";
import { errorResponse } from "../utils/errors";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    const { statusCode, message } = errorResponse(error);
    return c.json({ success: false, error: message }, statusCode as any);
  }
}
