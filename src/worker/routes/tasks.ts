import { Hono } from "hono";
import { TaskService } from "../services/taskService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { EntityService } from "../services/entityService";

export function createTaskRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // GET /api/tasks/upcoming?days=30&entity_id=... -- MUST come before /:id
  router.get("/upcoming", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const taskService = new TaskService(db);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    const entityId = c.req.query("entity_id");
    const days = parseInt(c.req.query("days") || "30");

    if (!entityId) return c.json({ success: false, error: "entity_id query param required" }, 400);

    const entity = await entityService.getEntity(entityId, user.sub);
    if (!entity) return c.json({ success: false, error: "Entity not found" }, 404);

    const tasks = await taskService.getUpcomingTasks(entityId, days);
    return c.json({ success: true, data: { tasks } });
  });

  // GET /api/tasks?entity_id=...
  router.get("/", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const taskService = new TaskService(db);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    const entityId = c.req.query("entity_id");
    if (!entityId) return c.json({ success: false, error: "entity_id query param required" }, 400);

    // Verify user owns entity
    const entity = await entityService.getEntity(entityId, user.sub);
    if (!entity) return c.json({ success: false, error: "Entity not found" }, 404);

    const tasks = await taskService.getTasks(entityId);
    return c.json({ success: true, data: { tasks } });
  });

  // GET /api/tasks/:id
  router.get("/:id", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const taskService = new TaskService(db);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    const task = await taskService.getTask(c.req.param("id"));
    if (!task) return c.json({ success: false, error: "Task not found" }, 404);

    // Verify user owns entity
    const entity = await entityService.getEntity(task.entity_id, user.sub);
    if (!entity) return c.json({ success: false, error: "Not authorized" }, 403);

    return c.json({ success: true, data: { task } });
  });

  // PATCH /api/tasks/:id
  router.patch("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const taskService = new TaskService(db);
      const entityService = new EntityService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const task = await taskService.getTask(c.req.param("id"));
      if (!task) return c.json({ success: false, error: "Task not found" }, 404);

      const entity = await entityService.getEntity(task.entity_id, user.sub);
      if (!entity) return c.json({ success: false, error: "Not authorized" }, 403);

      const updates = await c.req.json();
      const updated = await taskService.updateTask(c.req.param("id"), updates);

      return c.json({ success: true, data: { task: updated } });
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
