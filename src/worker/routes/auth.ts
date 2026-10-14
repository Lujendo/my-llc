import { Hono } from "hono";
import { AuthService } from "../services/authService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { fail } from "../utils/errors";
import { isEmail, isStr, isOptionalStr, readJson, MIN_PASSWORD, MAX_PASSWORD, MAX_NAME, MAX_SHORT } from "../utils/validate";

export function createAuthRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // POST /api/auth/register
  router.post("/register", async (c) => {
    try {
      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      const { email, password, name, citizenship, residency, consent } = body;
      if (!isEmail(email)) return c.json({ success: false, error: "Valid email required" }, 400);
      if (!isStr(password, MAX_PASSWORD, MIN_PASSWORD)) {
        return c.json({ success: false, error: `Password must be ${MIN_PASSWORD}-${MAX_PASSWORD} characters` }, 400);
      }
      if (!isOptionalStr(name, MAX_NAME) || !isOptionalStr(citizenship, MAX_SHORT) || !isOptionalStr(residency, MAX_SHORT)) {
        return c.json({ success: false, error: "Invalid profile fields" }, 400);
      }
      // Consent is required and enforced in the service (trust boundary).
      if (!consent || typeof consent !== "object" || consent.acceptedTerms !== true || consent.acceptedPrivacy !== true) {
        return c.json({ success: false, error: "You must accept the Terms of Service and Privacy Policy" }, 400);
      }

      const db = new Database(c.env.DB);
      const authService = new AuthService(db, c.env.JWT_SECRET);
      const { user, token } = await authService.register(email, password, name as string, citizenship as string, residency as string, consent);

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
    } catch (error) {
      return fail(c, error);
    }
  });

  // POST /api/auth/login
  router.post("/login", async (c) => {
    try {
      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      const { email, password } = body;
      // Login only checks shape, not min length — legacy users may predate the policy.
      if (!isEmail(email) || !isStr(password, MAX_PASSWORD, 1)) {
        return c.json({ success: false, error: "Email and password required" }, 400);
      }

      const db = new Database(c.env.DB);
      const authService = new AuthService(db, c.env.JWT_SECRET);
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
    } catch (error) {
      return fail(c, error);
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
