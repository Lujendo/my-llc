import { Hono } from "hono";
import { AuthService } from "../services/authService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";

export function createAuthRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // POST /api/auth/register
  router.post("/register", async (c) => {
    try {
      const db = new Database(c.env.DB);
      const authService = new AuthService(db, c.env.JWT_SECRET);
      const { email, password, name, citizenship, residency } = await c.req.json();

      if (!email || !password) {
        return c.json({ success: false, error: "Email and password required" }, 400);
      }

      const { user, token } = await authService.register(email, password, name, citizenship, residency);

      return c.json(
        {
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              citizenship: user.citizenship,
              residency: user.residency,
            },
            token,
          },
        },
        201
      );
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, error.statusCode || 400);
    }
  });

  // POST /api/auth/login
  router.post("/login", async (c) => {
    try {
      const db = new Database(c.env.DB);
      const authService = new AuthService(db, c.env.JWT_SECRET);
      const { email, password } = await c.req.json();

      if (!email || !password) {
        return c.json({ success: false, error: "Email and password required" }, 400);
      }

      const { user, token } = await authService.login(email, password);

      return c.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            citizenship: user.citizenship,
            residency: user.residency,
          },
          token,
        },
      });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, error.statusCode || 400);
    }
  });

  // POST /api/auth/logout
  router.post("/logout", async (c) => {
    // JWT is stateless, just return success
    return c.json({ success: true, data: { message: "Logged out" } });
  });

  // GET /api/auth/me
  router.get("/me", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const authService = new AuthService(db, c.env.JWT_SECRET);
      const user = getUserContext(c);
      if (!user) {
        return c.json({ success: false, error: "Not authenticated" }, 401);
      }

      const userDoc = await authService.getUser(user.sub);
      if (!userDoc) {
        return c.json({ success: false, error: "User not found" }, 404);
      }

      return c.json({
        success: true,
        data: {
          user: {
            id: userDoc.id,
            email: userDoc.email,
            name: userDoc.name,
            citizenship: userDoc.citizenship,
            residency: userDoc.residency,
            itin_status: userDoc.itin_status,
          },
        },
      });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, error.statusCode || 400);
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
