import { Hono } from "hono";
import { TaskService } from "../services/taskService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { EntityService } from "../services/entityService";
import { fail } from "../utils/errors";
import { taskToApi } from "../utils/serialize";
import { isStr, isOptionalStr, readJson, MAX_NAME, MAX_SHORT, MAX_TEXT } from "../utils/validate";

const TASK_SECTIONS = ["Formation", "ITIN", "Federal", "Germany", "Banking", "Ongoing"] as const;

export function createTaskRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // GET /api/tasks/upcoming?days=30&entity_id=... -- MUST come before /:id
  router.get("/upcoming", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const taskService = new TaskService(db);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    const entityId = c.req.query("entity_id") ?? c.req.query("entityId");
    // Clamp so a garbage/NaN `days` cannot produce an Invalid Date downstream.
    const days = Math.min(Math.max(parseInt(c.req.query("days") || "30", 10) || 30, 1), 365);

    if (!entityId) return c.json({ success: false, error: "entity_id query param required" }, 400);

    const entity = await entityService.getEntity(entityId, user.sub);
    if (!entity) return c.json({ success: false, error: "Entity not found" }, 404);

    const tasks = await taskService.getUpcomingTasks(entityId, days);
    return c.json({ success: true, data: { tasks: tasks.map(taskToApi) } });
  });

  // GET /api/tasks?entity_id=... (accepts entityId too)
  router.get("/", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const taskService = new TaskService(db);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    // ponytail: frontend sends `entity_id`, the spec says `entityId` — accept both.
    const entityId = c.req.query("entity_id") ?? c.req.query("entityId");
    if (!entityId) return c.json({ success: false, error: "entity_id query param required" }, 400);

    // Verify user owns entity
    const entity = await entityService.getEntity(entityId, user.sub);
    if (!entity) return c.json({ success: false, error: "Entity not found" }, 404);

    const tasks = await taskService.getTasks(entityId);
    return c.json({ success: true, data: { tasks: tasks.map(taskToApi) } });
  });

  // POST /api/tasks
  router.post("/", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const taskService = new TaskService(db);
      const entityService = new EntityService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      const entityId = body.entityId ?? body.entity_id;
      const dueDate = body.dueDate ?? body.due_date;

      if (!isStr(body.title, MAX_NAME)) {
        return c.json({ success: false, error: "title is required" }, 400);
      }
      if (!TASK_SECTIONS.includes(body.section)) {
        return c.json({ success: false, error: `section must be one of: ${TASK_SECTIONS.join(", ")}` }, 400);
      }
      if (!isOptionalStr(dueDate, MAX_SHORT) || !isOptionalStr(body.instructions, MAX_TEXT)) {
        return c.json({ success: false, error: "Invalid dueDate or instructions" }, 400);
      }
      if (!isStr(entityId, MAX_SHORT)) {
        return c.json({ success: false, error: "entityId is required" }, 400);
      }

      // Verify user owns entity
      const entity = await entityService.getEntity(entityId, user.sub);
      if (!entity) return c.json({ success: false, error: "Entity not found" }, 404);

      const task = await taskService.createTask(entityId, {
        title: body.title,
        section: body.section,
        dueDate,
        instructions: body.instructions,
      });

      return c.json({ success: true, data: { task: taskToApi(task) } }, 201);
    } catch (error) {
      return fail(c, error);
    }
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

    return c.json({ success: true, data: { task: taskToApi(task) } });
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

      const updates = await readJson(c);
      if (!updates) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      if ("completed" in updates && typeof updates.completed !== "boolean") {
        return c.json({ success: false, error: "completed must be a boolean" }, 400);
      }
      if ("title" in updates && !isStr(updates.title, MAX_NAME)) {
        return c.json({ success: false, error: "Invalid title" }, 400);
      }

      const updated = await taskService.updateTask(c.req.param("id"), updates);

      return c.json({ success: true, data: { task: taskToApi(updated) } });
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
