import { Hono } from "hono";
import { HoldingService } from "../services/holdingService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { fail } from "../utils/errors";
import { entityToApi, holdingMemberToApi, holdingToApi } from "../utils/serialize";
import { isStr, isOptionalStr, readJson, toSnakeKeys, MAX_NAME, MAX_SHORT } from "../utils/validate";

export function createHoldingRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // GET /api/holdings (constellations)
  router.get("/", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const holdingService = new HoldingService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
    const constellations = await holdingService.listConstellations(user.sub);
    return c.json({ success: true, data: { constellations } });
  });

  // POST /api/holdings
  router.post("/", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);

      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      const name = body.name;
      const jurisdictionCountry = body.jurisdictionCountry ?? body.jurisdiction_country;
      const jurisdictionSubdivision = body.jurisdictionSubdivision ?? body.jurisdiction_subdivision;
      const baseCurrency = body.baseCurrency ?? body.base_currency;
      const currencyAsOf = body.currencyAsOf ?? body.currency_as_of;
      const effectiveFrom = body.effectiveFrom ?? body.effective_from;

      if (!isStr(name, MAX_NAME)) return c.json({ success: false, error: "name is required" }, 400);
      if (!isStr(jurisdictionCountry, MAX_SHORT)) return c.json({ success: false, error: "jurisdictionCountry is required" }, 400);
      if (!isStr(baseCurrency, MAX_SHORT)) return c.json({ success: false, error: "baseCurrency is required" }, 400);
      if (!isStr(effectiveFrom, MAX_SHORT)) return c.json({ success: false, error: "effectiveFrom is required" }, 400);
      if (!isOptionalStr(jurisdictionSubdivision, MAX_SHORT) || !isOptionalStr(currencyAsOf, MAX_SHORT)) {
        return c.json({ success: false, error: "Invalid fields" }, 400);
      }

      const holding = await holdingService.createHolding(user.sub, {
        name,
        jurisdictionCountry,
        jurisdictionSubdivision,
        baseCurrency,
        currencyAsOf,
        effectiveFrom,
      });
      return c.json({ success: true, data: { holding: holdingToApi(holding) } }, 201);
    } catch (error) {
      return fail(c, error);
    }
  });

  // GET /api/holdings/:id
  router.get("/:id", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const holdingService = new HoldingService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
    const holding = await holdingService.getHolding(c.req.param("id"), user.sub);
    if (!holding) return c.json({ success: false, error: "Holding not found" }, 404);
    return c.json({ success: true, data: { holding: holdingToApi(holding) } });
  });

  // PATCH /api/holdings/:id
  router.patch("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const updates = await readJson(c);
      if (!updates) return c.json({ success: false, error: "Invalid JSON body" }, 400);
      // Accept camelCase from the client (mirrors POST); validate/persist snake_case.
      const normalized = toSnakeKeys(updates);
      // COMPLIANCE: enforce the same length caps on update as on create.
      if ("name" in normalized && !isStr(normalized.name, MAX_NAME)) {
        return c.json({ success: false, error: "Invalid name" }, 400);
      }
      for (const k of [
        "jurisdiction_country",
        "jurisdiction_subdivision",
        "base_currency",
        "currency_as_of",
        "effective_from",
        "effective_to",
      ]) {
        if (k in normalized && !isOptionalStr(normalized[k], MAX_SHORT)) {
          return c.json({ success: false, error: `Invalid ${k}` }, 400);
        }
      }
      const updated = await holdingService.updateHolding(c.req.param("id"), user.sub, normalized as any);
      return c.json({ success: true, data: { holding: holdingToApi(updated) } });
    } catch (error) {
      return fail(c, error);
    }
  });

  // DELETE /api/holdings/:id
  router.delete("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      await holdingService.deleteHolding(c.req.param("id"), user.sub);
      return c.json({ success: true });
    } catch (error) {
      return fail(c, error);
    }
  });

  // POST /api/holdings/:id/parent
  router.post("/:id/parent", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);
      const parentId = body.parentId ?? body.parent_id;
      const effectiveFrom = body.effectiveFrom ?? body.effective_from;
      if (!isStr(parentId, MAX_SHORT) || !isStr(effectiveFrom, MAX_SHORT)) {
        return c.json({ success: false, error: "parentId and effectiveFrom required" }, 400);
      }
      const rel = await holdingService.setParent(c.req.param("id"), parentId, effectiveFrom, user.sub);
      return c.json({ success: true, data: { relationship: rel } }, 201);
    } catch (error) {
      return fail(c, error);
    }
  });

  // POST /api/holdings/:id/members
  router.post("/:id/members", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);
      const entityId = body.entityId ?? body.entity_id;
      const effectiveFrom = body.effectiveFrom ?? body.effective_from;
      if (!isStr(entityId, MAX_SHORT) || !isStr(effectiveFrom, MAX_SHORT)) {
        return c.json({ success: false, error: "entityId and effectiveFrom required" }, 400);
      }
      const member = await holdingService.addMember(c.req.param("id"), entityId, effectiveFrom, user.sub);
      return c.json({ success: true, data: { member } }, 201);
    } catch (error) {
      return fail(c, error);
    }
  });

  // GET /api/holdings/:id/members
  router.get("/:id/members", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const rows = await holdingService.getActiveMembers(c.req.param("id"), user.sub);
      const members = rows.map((r) => ({ ...holdingMemberToApi(r.member), entity: entityToApi(r.entity) }));
      return c.json({ success: true, members });
    } catch (error) {
      return fail(c, error);
    }
  });

  // DELETE /api/holdings/:id/members/:entityId
  router.delete("/:id/members/:entityId", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      await holdingService.removeMember(c.req.param("id"), c.req.param("entityId"), user.sub);
      return c.json({ success: true });
    } catch (error) {
      return fail(c, error);
    }
  });

  // GET /api/holdings/:id/consolidated?asOf=
  router.get("/:id/consolidated", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const holdingService = new HoldingService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const asOf = c.req.query("asOf") ?? c.req.query("as_of") ?? undefined;
      const result = await holdingService.getConsolidated(c.req.param("id"), user.sub, asOf);
      return c.json({ success: true, data: result });
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
