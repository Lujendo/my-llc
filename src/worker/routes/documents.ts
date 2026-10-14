import { Hono } from "hono";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { fail } from "../utils/errors";
import { generateId } from "../utils/id";
import { isStr, isOptionalStr, readJson, MAX_SHORT } from "../utils/validate";

// Every document/form the app gates behind the professional-review tick.
// Keep in sync with the CHECK in schema.sql and the frontend DocumentType union.
const DOCUMENT_TYPES = ["terms", "privacy", "w7", "oa", "treaty_memo"] as const;

export function createDocumentRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // POST /api/documents/acceptance — record that the user accepted a document version.
  router.post("/acceptance", authGuard, async (c) => {
    try {
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      // ponytail: frontend sends camelCase; accept snake_case too for parity with
      // the other routes.
      const documentType = body.documentType ?? body.document_type;
      const documentVersion = body.documentVersion ?? body.document_version;
      const acceptedAt = body.acceptedAt ?? body.accepted_at;

      if (!DOCUMENT_TYPES.includes(documentType)) {
        return c.json({ success: false, error: `documentType must be one of: ${DOCUMENT_TYPES.join(", ")}` }, 400);
      }
      if (!isStr(documentVersion, MAX_SHORT)) {
        return c.json({ success: false, error: "documentVersion is required" }, 400);
      }
      if (!isOptionalStr(acceptedAt, MAX_SHORT)) {
        return c.json({ success: false, error: "acceptedAt must be a string" }, 400);
      }

      const db = new Database(c.env.DB);
      const id = generateId();
      // ponytail: always write accepted_at explicitly (client timestamp when
      // given, else now) so the row carries the same instant the UI logged.
      await db.execute(
        "INSERT INTO document_acceptances (id, user_id, document_type, document_version, accepted_at) VALUES (?, ?, ?, ?, ?)",
        [id, user.sub, documentType, documentVersion, acceptedAt ?? new Date().toISOString()]
      );

      return c.json({ success: true, data: { acceptance: { id, documentType, documentVersion } } }, 201);
    } catch (error) {
      return fail(c, error);
    }
  });

  return router;
}

declare global {
  interface Env {
    DB: D1Database;
    JWT_SECRET: string;
  }
}
