import { Hono } from "hono";
import { EntityService } from "../services/entityService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";

export function createEntityRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // GET /api/entities
  router.get("/", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    const entities = await entityService.listEntities(user.sub);
    return c.json({ success: true, data: { entities } });
  });

  // POST /api/entities
  router.post("/", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const entityService = new EntityService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const { name, formation_date, state, members_count } = await c.req.json();
      const entity = await entityService.createEntity(user.sub, name, formation_date, state, members_count);

      return c.json({ success: true, data: { entity } }, 201);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, error.statusCode || 400);
    }
  });

  // GET /api/entities/:id
  router.get("/:id", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    const entity = await entityService.getEntity(c.req.param("id"), user.sub);
    if (!entity) return c.json({ success: false, error: "Entity not found" }, 404);

    return c.json({ success: true, data: { entity } });
  });

  // PATCH /api/entities/:id
  router.patch("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const entityService = new EntityService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const updates = await c.req.json();
      const entity = await entityService.updateEntity(c.req.param("id"), user.sub, updates);

      return c.json({ success: true, data: { entity } });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, error.statusCode || 400);
    }
  });

  // DELETE /api/entities/:id
  router.delete("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const entityService = new EntityService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      await entityService.deleteEntity(c.req.param("id"), user.sub);
      return c.json({ success: true });
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
