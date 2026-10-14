import { Database } from "../db/queries";
import { CalendarEvent } from "../types";
import { generateId } from "../utils/id";
import { NotFoundError, ValidationError } from "../utils/errors";
import { toSnakeKeys } from "../utils/validate";

const now = () => new Date().toISOString();

export class CalendarEventService {
  constructor(private db: Database) {}

  async createEvent(
    userId: string,
    data: {
      title: string;
      description?: string | null;
      location?: string | null;
      color?: string | null;
      startTime: string;
      endTime?: string | null;
      isAllDay?: boolean | number;
      jurisdictionCountry?: string | null;
      eventType?: string | null;
      source?: "system" | "user";
      reminder?: string | null;
      recurrence?: string | null;
      entityId?: string | null;
    }
  ): Promise<CalendarEvent> {
    if (!data.title) throw new ValidationError("title is required");
    if (!data.startTime) throw new ValidationError("startTime is required");

    // IDOR guard: an event may only reference an entity the caller owns.
    if (data.entityId) {
      const owned = await this.db.queryOne<{ id: string }>(
        "SELECT id FROM entities WHERE id = ? AND user_id = ?",
        [data.entityId, userId]
      );
      if (!owned) throw new NotFoundError("Entity not found");
    }

    const id = generateId();
    const isAllDay = data.isAllDay ? 1 : 0;
    const source = data.source === "system" ? "system" : "user";

    await this.db.execute(
      `INSERT INTO calendar_events
        (id, user_id, title, description, location, color, start_time, end_time,
         is_all_day, jurisdiction_country, event_type, source, reminder, recurrence,
         entity_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.title,
        data.description ?? null,
        data.location ?? null,
        data.color ?? "#6366f1",
        data.startTime,
        data.endTime ?? null,
        isAllDay,
        data.jurisdictionCountry ?? null,
        data.eventType ?? null,
        source,
        data.reminder ?? null,
        data.recurrence ?? null,
        data.entityId ?? null,
        now(),
      ]
    );

    const ev = await this.getEvent(id, userId);
    if (!ev) throw new Error("Failed to create calendar event");
    return ev;
  }

  async getEvent(id: string, userId: string): Promise<CalendarEvent | null> {
    return this.db.queryOne<CalendarEvent>("SELECT * FROM calendar_events WHERE id = ? AND user_id = ?", [id, userId]);
  }

  async listEvents(userId: string, start?: string, end?: string): Promise<CalendarEvent[]> {
    // A date-only `end` ("2026-10-14") must include that whole day: without this
    // the lexicographic `start_time <= end` drops a 2026-10-14T09:00 event.
    const endBound = end && /^\d{4}-\d{2}-\d{2}$/.test(end) ? `${end}T23:59:59` : end;
    if (start && endBound) {
      return this.db.query<CalendarEvent>(
        "SELECT * FROM calendar_events WHERE user_id = ? AND start_time >= ? AND start_time <= ? ORDER BY start_time ASC",
        [userId, start, endBound]
      );
    }
    if (start) {
      return this.db.query<CalendarEvent>(
        "SELECT * FROM calendar_events WHERE user_id = ? AND start_time >= ? ORDER BY start_time ASC",
        [userId, start]
      );
    }
    if (endBound) {
      return this.db.query<CalendarEvent>(
        "SELECT * FROM calendar_events WHERE user_id = ? AND start_time <= ? ORDER BY start_time ASC",
        [userId, endBound]
      );
    }
    return this.db.query<CalendarEvent>("SELECT * FROM calendar_events WHERE user_id = ? ORDER BY start_time ASC", [userId]);
  }

  async updateEvent(id: string, userId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const ev = await this.getEvent(id, userId);
    if (!ev) throw new NotFoundError("Calendar event not found");

    // The route forwards the client body; the calendar UI sends camelCase while
    // the columns are snake_case. Normalize here so a camelCase PATCH persists.
    updates = toSnakeKeys(updates) as Partial<CalendarEvent>;

    // IDOR guard: an event may only reference an entity the caller owns.
    if (updates.entity_id) {
      const owned = await this.db.queryOne<{ id: string }>(
        "SELECT id FROM entities WHERE id = ? AND user_id = ?",
        [updates.entity_id, userId]
      );
      if (!owned) throw new NotFoundError("Entity not found");
    }

    const sets: string[] = [];
    const params: any[] = [];

    if ("title" in updates) {
      sets.push("title = ?");
      params.push(updates.title);
    }
    if ("description" in updates) {
      sets.push("description = ?");
      params.push(updates.description ?? null);
    }
    if ("location" in updates) {
      sets.push("location = ?");
      params.push(updates.location ?? null);
    }
    if ("color" in updates) {
      sets.push("color = ?");
      params.push(updates.color ?? null);
    }
    if ("start_time" in updates) {
      sets.push("start_time = ?");
      params.push(updates.start_time);
    }
    if ("end_time" in updates) {
      sets.push("end_time = ?");
      params.push(updates.end_time ?? null);
    }
    if ("is_all_day" in updates) {
      sets.push("is_all_day = ?");
      params.push(updates.is_all_day ? 1 : 0);
    }
    if ("jurisdiction_country" in updates) {
      sets.push("jurisdiction_country = ?");
      params.push(updates.jurisdiction_country ?? null);
    }
    if ("event_type" in updates) {
      sets.push("event_type = ?");
      params.push(updates.event_type ?? null);
    }
    if ("source" in updates) {
      sets.push("source = ?");
      params.push(updates.source === "system" ? "system" : "user");
    }
    if ("reminder" in updates) {
      sets.push("reminder = ?");
      params.push(updates.reminder ?? null);
    }
    if ("recurrence" in updates) {
      sets.push("recurrence = ?");
      params.push(updates.recurrence ?? null);
    }
    if ("entity_id" in updates) {
      sets.push("entity_id = ?");
      params.push(updates.entity_id ?? null);
    }

    if (sets.length === 0) return ev;
    params.push(id, userId);
    await this.db.execute(`UPDATE calendar_events SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);

    const updated = await this.getEvent(id, userId);
    if (!updated) throw new Error("Failed to update calendar event");
    return updated;
  }

  async deleteEvent(id: string, userId: string): Promise<void> {
    const ev = await this.getEvent(id, userId);
    if (!ev) throw new NotFoundError("Calendar event not found");
    await this.db.execute("DELETE FROM calendar_events WHERE id = ? AND user_id = ?", [id, userId]);
  }
}
