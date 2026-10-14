import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimit } from "./middleware/rateLimit";
import { createAuthRoutes } from "./routes/auth";
import { createEntityRoutes } from "./routes/entities";
import { createTaskRoutes } from "./routes/tasks";
import { createDocumentRoutes } from "./routes/documents";

declare global {
  interface Env {
    DB: D1Database;
    JWT_SECRET: string;
    CORS_ORIGIN?: string;
    ASSETS: Fetcher;
  }

  interface D1Database {
    prepare(sql: string): D1PreparedStatement;
  }

  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    all(): Promise<D1Result<any>>;
    first(): Promise<any>;
    run(): Promise<D1Result<any>>;
  }

  interface D1Result<T> {
    success: boolean;
    results: T[];
    error?: string;
  }
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use(errorHandler);
// ponytail: wildcard CORS is acceptable while auth is Bearer-token only (no
// cookies). Lock to c.env.CORS_ORIGIN before enabling cookie sessions.
app.use("*", cors({ origin: "*" }));

// Security headers + request size cap on API responses.
// ponytail: applied to /api/* only — static assets are served by the assets
// layer, not this Worker. Add a `_headers` file for the SPA shell if needed.
app.use(
  "/api/*",
  secureHeaders({
    contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  })
);
app.use(
  "/api/*",
  bodyLimit({
    maxSize: 100 * 1024, // 100 KB — no legitimate JSON body here is larger
    onError: (c) => c.json({ success: false, error: "Payload too large" }, 413),
  })
);

// Rate limiting: auth endpoints strictest, then a general API ceiling.
app.use("/api/auth/register", rateLimit("AUTH_RATE_LIMITER"));
app.use("/api/auth/login", rateLimit("AUTH_RATE_LIMITER"));
app.use("/api/*", rateLimit("API_RATE_LIMITER"));

// Health check
app.get("/api/health", (c) => c.json({ success: true, status: "ok" }));

// Mount routes
app.route("/api/auth", createAuthRoutes());
app.route("/api/entities", createEntityRoutes());
app.route("/api/tasks", createTaskRoutes());
app.route("/api/documents", createDocumentRoutes());

// 404 handler. API paths stay JSON; everything else defers to the static-assets
// layer, whose `not_found_handling: single-page-application` returns index.html
// so deep links (/terms, /privacy) survive a direct GET / reload / new tab.
app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ success: false, error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
