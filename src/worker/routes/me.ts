import { Hono } from "hono";
import { AccountService } from "../services/accountService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { fail } from "../utils/errors";

export function createMeRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // DELETE /api/me — user-initiated account deletion
  router.delete("/", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const accountService = new AccountService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      await accountService.deleteAccount(user.sub);
      return c.json({ success: true });
    } catch (error) {
      return fail(c, error);
    }
  });

  // GET /api/me/export — JSON dump of all user data
  router.get("/export", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const accountService = new AccountService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const data = await accountService.exportAccount(user.sub);
      return c.json({ success: true, data });
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
