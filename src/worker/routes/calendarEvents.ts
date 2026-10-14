import { Hono } from "hono";
import { CalendarEventService } from "../services/calendarEventService";
import { Database } from "../db/queries";
import { getUserContext, authGuard } from "../middleware/auth";
import { fail } from "../utils/errors";
import { calendarEventToApi } from "../utils/serialize";
import { isStr, isOptionalStr, readJson, toSnakeKeys, MAX_SHORT, MAX_TEXT } from "../utils/validate";

export function createCalendarEventRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // GET /api/calendar-events?start=&end=
  router.get("/", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const service = new CalendarEventService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
    const start = c.req.query("start") ?? undefined;
    const end = c.req.query("end") ?? undefined;
    const events = await service.listEvents(user.sub, start, end);
    return c.json({ success: true, data: { events: events.map(calendarEventToApi) } });
  });

  // POST /api/calendar-events
  router.post("/", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const service = new CalendarEventService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const body = await readJson(c);
      if (!body) return c.json({ success: false, error: "Invalid JSON body" }, 400);

      const title = body.title;
      const startTime = body.startTime ?? body.start_time;
      if (!isStr(title, MAX_TEXT)) return c.json({ success: false, error: "title is required" }, 400);
      if (!isStr(startTime, MAX_SHORT)) return c.json({ success: false, error: "startTime is required" }, 400);
      if (!isOptionalStr(body.description, MAX_TEXT) || !isOptionalStr(body.location, MAX_TEXT)) {
        return c.json({ success: false, error: "Invalid fields" }, 400);
      }
      // COMPLIANCE: cap every other free-text field too (was unbounded).
      if (
        !isOptionalStr(body.color, MAX_SHORT) ||
        !isOptionalStr(body.endTime ?? body.end_time, MAX_SHORT) ||
        !isOptionalStr(body.jurisdictionCountry ?? body.jurisdiction_country, MAX_SHORT) ||
        !isOptionalStr(body.eventType ?? body.event_type, MAX_SHORT) ||
        !isOptionalStr(body.reminder, MAX_TEXT) ||
        !isOptionalStr(body.recurrence, MAX_TEXT) ||
        !isOptionalStr(body.entityId ?? body.entity_id, MAX_SHORT)
      ) {
        return c.json({ success: false, error: "Invalid fields" }, 400);
      }

      const ev = await service.createEvent(user.sub, {
        title,
        description: body.description,
        location: body.location,
        color: body.color,
        startTime,
        endTime: body.endTime ?? body.end_time,
        isAllDay: body.isAllDay ?? body.is_all_day,
        jurisdictionCountry: body.jurisdictionCountry ?? body.jurisdiction_country,
        eventType: body.eventType ?? body.event_type,
        source: body.source,
        reminder: body.reminder,
        recurrence: body.recurrence,
        entityId: body.entityId ?? body.entity_id,
      });
      return c.json({ success: true, data: { event: calendarEventToApi(ev) } }, 201);
    } catch (error) {
      return fail(c, error);
    }
  });

  // GET /api/calendar-events/:id
  router.get("/:id", authGuard, async (c) => {
    const db = new Database(c.env.DB);
    const service = new CalendarEventService(db);
    const user = getUserContext(c);
    if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
    const ev = await service.getEvent(c.req.param("id"), user.sub);
    if (!ev) return c.json({ success: false, error: "Calendar event not found" }, 404);
    return c.json({ success: true, data: { event: calendarEventToApi(ev) } });
  });

  // PATCH /api/calendar-events/:id
  router.patch("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const service = new CalendarEventService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      const updates = await readJson(c);
      if (!updates) return c.json({ success: false, error: "Invalid JSON body" }, 400);
      // COMPLIANCE: enforce the same length caps on update as on create.
      if ("title" in updates && !isStr(updates.title, MAX_TEXT)) {
        return c.json({ success: false, error: "Invalid title" }, 400);
      }
      if (!isOptionalStr(updates.description, MAX_TEXT) || !isOptionalStr(updates.location, MAX_TEXT)) {
        return c.json({ success: false, error: "Invalid fields" }, 400);
      }
      // COMPLIANCE: cap every other free-text field too (was unbounded).
      if (
        !isOptionalStr(updates.color, MAX_SHORT) ||
        !isOptionalStr(updates.end_time ?? updates.endTime, MAX_SHORT) ||
        !isOptionalStr(updates.jurisdiction_country ?? updates.jurisdictionCountry, MAX_SHORT) ||
        !isOptionalStr(updates.event_type ?? updates.eventType, MAX_SHORT) ||
        !isOptionalStr(updates.reminder, MAX_TEXT) ||
        !isOptionalStr(updates.recurrence, MAX_TEXT) ||
        !isOptionalStr(updates.entity_id ?? updates.entityId, MAX_SHORT)
      ) {
        return c.json({ success: false, error: "Invalid fields" }, 400);
      }
      const updated = await service.updateEvent(c.req.param("id"), user.sub, toSnakeKeys(updates) as any);
      return c.json({ success: true, data: { event: calendarEventToApi(updated) } });
    } catch (error) {
      return fail(c, error);
    }
  });

  // DELETE /api/calendar-events/:id
  router.delete("/:id", authGuard, async (c) => {
    try {
      const db = new Database(c.env.DB);
      const service = new CalendarEventService(db);
      const user = getUserContext(c);
      if (!user) return c.json({ success: false, error: "Not authenticated" }, 401);
      await service.deleteEvent(c.req.param("id"), user.sub);
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
