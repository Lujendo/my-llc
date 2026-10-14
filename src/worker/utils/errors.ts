import { Context } from "hono";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export function errorResponse(error: unknown): { statusCode: number; message: string } {
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, message: error.message };
  }
  // BUG-05: map D1 constraint violations to 409 instead of a generic 500.
  const msg = error instanceof Error ? error.message : String(error);
  if (/UNIQUE constraint failed/i.test(msg)) {
    return { statusCode: 409, message: "Resource already exists" };
  }
  if (/FOREIGN KEY constraint failed/i.test(msg)) {
    return { statusCode: 409, message: "Resource is still referenced" };
  }
  // ponytail: never surface internal error text (D1 messages, stack hints) to
  // clients — log it server-side, return a generic 500.
  console.error("Unhandled error:", error);
  return { statusCode: 500, message: "Internal server error" };
}

// Shared catch-block responder so routes cannot accidentally leak error.message.
export function fail(c: Context, error: unknown) {
  const { statusCode, message } = errorResponse(error);
  return c.json({ success: false, error: message }, statusCode as any);
}
