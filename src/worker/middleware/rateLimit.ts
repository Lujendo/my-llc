import { Context, Next } from "hono";

// Global fixed-window rate limiter backed by D1 (BUG-02).
//
// ponytail: Cloudflare's native `ratelimits` binding is per-isolate and
// eventually consistent, so a burst fanned across isolates enforces roughly
// `limit × N_isolates` — not a real global limit (verified: 60 keep-alive
// register calls → 22×201/38×429, but 40 parallel connections → 39×201/1×429).
// D1 is a single logical database, so one atomic upsert per request gives a
// globally correct counter. CEILING: one D1 write per request on the hot path;
// upgrade path is a Durable Object per key if throughput ever matters.
const LIMITS = {
  AUTH_RATE_LIMITER: { limit: 10, window: 60 },
  API_RATE_LIMITER: { limit: 100, window: 60 },
} as const;

export function rateLimit(binding: keyof typeof LIMITS) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const { limit, window } = LIMITS[binding];
    const key = `${binding}:${c.req.header("CF-Connecting-IP") || "unknown"}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % window);

    try {
      // Atomic increment: insert-or-bump within the current window, reset on a
      // new window. RETURNING gives the post-increment count in one round trip.
      const res = await c.env.DB.prepare(
        `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN window_start = ? THEN count + 1 ELSE 1 END,
           window_start = ?
         RETURNING count`
      )
        .bind(key, windowStart, windowStart, windowStart)
        .all();

      const count = (res.results?.[0] as { count: number } | undefined)?.count ?? 0;
      if (count > limit) {
        return c.json({ success: false, error: "Too many requests, slow down" }, 429);
      }
    } catch (error) {
      // Fail open: a limiter outage must not take down the API.
      console.error("Rate limit check failed:", error);
    }
    await next();
  };
}
