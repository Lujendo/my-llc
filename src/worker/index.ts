import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/errorHandler";
import { createAuthRoutes } from "./routes/auth";
import { createEntityRoutes } from "./routes/entities";
import { createTaskRoutes } from "./routes/tasks";

declare global {
  interface Env {
    DB: D1Database;
    JWT_SECRET: string;
    CORS_ORIGIN?: string;
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
app.use("*", cors({ origin: "*" })); // Allow all origins for MVP

// Health check
app.get("/api/health", (c) => c.json({ success: true, status: "ok" }));

// Mount routes
app.route("/api/auth", createAuthRoutes());
app.route("/api/entities", createEntityRoutes());
app.route("/api/tasks", createTaskRoutes());

// 404 handler
app.notFound((c) => c.json({ success: false, error: "Not found" }, 404));

export default app;
