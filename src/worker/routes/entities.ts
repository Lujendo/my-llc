import { Hono } from "hono";
import { EntityService } from "../services/entityService";
import { TaskService } from "../services/taskService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { fail } from "../utils/errors";
import { entityToApi } from "../utils/serialize";
import { isStr, isOptionalStr, isOptionalInt, readJson, MAX_NAME, MAX_SHORT } from "../utils/validate";

const ENTITY_STATUSES = ["idle", "active", "dormant"];
const OWNER_TYPES = ["foreign", "domestic"];

export function createEntityRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // GET /api/entities
  router.get("/", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const entityService = new EntityService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

    const entities = await entityService.listEntities(user.sub);
    return c.json({ success: true, data: { entities: entities.map(entityToApi) } });
  });

  // POST /api/entities
  router.post("/", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const entityService = new EntityService(db);
      const taskService = new TaskService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      const { name, formation_date, state, members_count } = body;
      const ownerName = body.owner_name;
      const ownerCitizenship = body.owner_citizenship;
      const ownerResidency = body.owner_residency;
      const ownerType = body.owner_type;
      // ponytail: frontend still posts `business_type`; treat it as an alias for
      // tax_classification so we don't need a second entity column.
      const taxClassification = body.tax_classification ?? body.business_type ?? body.businessType;

      if (!isStr(name, MAX_NAME)) return c.json({ success: false, error: "Entity name is required" }, 400);
      if (!isOptionalStr(formation_date, MAX_SHORT) || !isOptionalStr(state, MAX_SHORT)) {
        return c.json({ success: false, error: "Invalid entity fields" }, 400);
      }
      if (!isOptionalInt(members_count, 0, 100000)) {
        return c.json({ success: false, error: "members_count must be a non-negative integer" }, 400);
      }
      if (
        !isOptionalStr(ownerName, MAX_NAME) ||
        !isOptionalStr(ownerCitizenship, MAX_SHORT) ||
        !isOptionalStr(ownerResidency, MAX_SHORT) ||
        !isOptionalStr(taxClassification, MAX_SHORT)
      ) {
        return c.json({ success: false, error: "Invalid owner fields" }, 400);
      }
      if (ownerType != null && !OWNER_TYPES.includes(ownerType)) {
        return c.json({ success: false, error: "owner_type must be 'foreign' or 'domestic'" }, 400);
      }

      const entity = await entityService.createEntity(user.sub, {
        name,
        formationDate: formation_date,
        state,
        membersCount: members_count,
        ownerName,
        ownerCitizenship,
        ownerResidency,
        ownerType,
        taxClassification,
      });

      // H1: every new entity gets the default compliance checklist.
      await taskService.seedDefaultTasks(entity.id);

      return c.json({ success: true, data: { entity: entityToApi(entity) } }, 201);
    } catch (error) {
      return fail(c, error);
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

    return c.json({ success: true, data: { entity: entityToApi(entity) } });
  });

  // PATCH /api/entities/:id
  router.patch("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const entityService = new EntityService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const updates = await readJson(c);
      if (!updates) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      if ("name" in updates && !isStr(updates.name, MAX_NAME)) {
        return c.json({ success: false, error: "Invalid name" }, 400);
      }
      if ("status" in updates && !ENTITY_STATUSES.includes(updates.status as string)) {
        return c.json({ success: false, error: "Invalid status" }, 400);
      }
      if ("formation_date" in updates && !isOptionalStr(updates.formation_date, MAX_SHORT)) {
        return c.json({ success: false, error: "Invalid formation_date" }, 400);
      }
      if ("state" in updates && !isOptionalStr(updates.state, MAX_SHORT)) {
        return c.json({ success: false, error: "Invalid state" }, 400);
      }
      // Owner/tax fields are optional strings; business_type is accepted as an alias.
      for (const k of ["owner_name", "owner_citizenship", "owner_residency", "tax_classification"]) {
        if (k in updates && !isOptionalStr(updates[k], MAX_NAME)) {
          return c.json({ success: false, error: `Invalid ${k}` }, 400);
        }
      }
      if ("owner_type" in updates && updates.owner_type != null && !OWNER_TYPES.includes(updates.owner_type)) {
        return c.json({ success: false, error: "owner_type must be 'foreign' or 'domestic'" }, 400);
      }
      if ("business_type" in updates && !("tax_classification" in updates)) {
        updates.tax_classification = updates.business_type;
      }

      const entity = await entityService.updateEntity(c.req.param("id"), user.sub, updates);

      return c.json({ success: true, data: { entity: entityToApi(entity) } });
    } catch (error) {
      return fail(c, error);
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
