// Pure calendar helpers shared by HoldingCalendar and HoldingHub (Phase 3c).
import type { CalendarEvent } from "../types";
import { addDays, parseDateTime, startOfDay, type DateInput } from "./date.ts";

// Row → CalendarEvent. The API returns camelCase (calendarEventToApi); snake_case
// is tolerated for legacy rows. Every field is defaulted so a partial row is safe.
export function normalizeCalendarEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    userId: row.userId ?? row.user_id ?? "",
    title: row.title ?? "",
    description: row.description ?? null,
    location: row.location ?? null,
    color: row.color ?? "",
    startTime: row.startTime ?? row.start_time ?? "",
    endTime: row.endTime ?? row.end_time ?? null,
    isAllDay: !!(row.isAllDay ?? row.is_all_day),
    jurisdictionCountry: row.jurisdictionCountry ?? row.jurisdiction_country ?? null,
    eventType: row.eventType ?? row.event_type ?? null,
    source: row.source ?? "user",
    reminder: row.reminder ?? null,
    recurrence: row.recurrence ?? null,
    entityId: row.entityId ?? row.entity_id ?? null,
    createdAt: row.createdAt ?? row.created_at ?? "",
  };
}

// Does [startMs, endMs] (inclusive) touch the given calendar day? DST-safe: the
// day's end is the next local midnight minus a millisecond, not a fixed 86_400_000.
export function overlapsDay(startMs: number, endMs: number, day: DateInput): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = addDays(startOfDay(day), 1).getTime() - 1;
  return startMs <= dayEnd && endMs >= dayStart;
}

// Does the event occur on the day? All-day and zero-length events are handled:
// a missing/earlier end collapses to the start instant.
export function eventOnDay(ev: CalendarEvent, day: DateInput): boolean {
  const s = parseDateTime(ev.startTime).getTime();
  const e = ev.endTime ? parseDateTime(ev.endTime).getTime() : s;
  return overlapsDay(s, Math.max(s, e), day);
}

// WCAG-AA foreground for a solid hex chip background: black or white, whichever
// contrasts more. The ~0.179 crossover keeps every preset swatch ≥4.5:1, and it
// holds for arbitrary user-picked colors (custom color input) too.
export function readableTextColor(hex: string): "#000000" | "#ffffff" {
  const c = (hex || "").replace("#", "").trim();
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const channel = (i: number) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    if (Number.isNaN(v)) return 0;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return L > 0.179 ? "#000000" : "#ffffff";
}
