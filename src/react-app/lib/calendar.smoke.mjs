// Runnable self-check for the pure calendar helpers. No framework:
//   node src/react-app/lib/calendar.smoke.mjs
import assert from "node:assert/strict";
import { normalizeCalendarEvent, overlapsDay, eventOnDay, readableTextColor } from "./calendar.ts";

// camelCase row (calendarEventToApi shape).
const camel = normalizeCalendarEvent({
  id: "e1",
  userId: "u1",
  title: "Board meeting",
  startTime: "2026-01-15T09:00:00",
  endTime: "2026-01-15T10:00:00",
  isAllDay: false,
});
assert.equal(camel.title, "Board meeting");
assert.equal(camel.startTime, "2026-01-15T09:00:00");
assert.equal(camel.isAllDay, false);

// snake_case row normalizes to the same shape; missing fields default safely.
const snake = normalizeCalendarEvent({
  id: "e2",
  title: "Filing",
  start_time: "2026-02-01",
  is_all_day: 1,
});
assert.equal(snake.startTime, "2026-02-01");
assert.equal(snake.endTime, null);
assert.equal(snake.isAllDay, true);
assert.equal(snake.color, "");
assert.equal(snake.description, null);

// A timed event overlaps its own day, not the next.
const day = new Date(2026, 0, 15);
const s = new Date(2026, 0, 15, 9, 0).getTime();
const e = new Date(2026, 0, 15, 10, 0).getTime();
assert.equal(overlapsDay(s, e, day), true);
assert.equal(overlapsDay(s, e, new Date(2026, 0, 16)), false);
assert.equal(overlapsDay(s, e, new Date(2026, 0, 14)), false);

// Boundary: an event ending at the last millisecond of the day still counts.
const dayEnd = new Date(2026, 0, 15, 23, 59, 59, 999).getTime();
assert.equal(overlapsDay(dayEnd - 1000, dayEnd, day), true);

// eventOnDay: an all-day (date-only) event lands on its date.
const allDay = normalizeCalendarEvent({ id: "e3", title: "Holiday", start_time: "2026-03-08", is_all_day: true });
assert.equal(eventOnDay(allDay, "2026-03-08"), true);
assert.equal(eventOnDay(allDay, "2026-03-09"), false);

// ...and a multi-day span covers every day between.
const span = normalizeCalendarEvent({ id: "e4", title: "Trip", start_time: "2026-03-08", end_time: "2026-03-10", is_all_day: true });
assert.equal(eventOnDay(span, "2026-03-09"), true);
assert.equal(eventOnDay(span, "2026-03-11"), false);

// Chip text contrast: every preset swatch keeps ≥4.5:1 with the auto-picked color.
const relLum = (hex) => {
  const c = hex.replace("#", "");
  const ch = (i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
};
const contrast = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
assert.equal(readableTextColor("#f59e0b"), "#000000"); // amber → black text
assert.equal(readableTextColor("#64748b"), "#ffffff"); // slate → white text
for (const sw of ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#64748b"]) {
  assert.ok(contrast(sw, readableTextColor(sw)) >= 4.5, `${sw} chip contrast < 4.5`);
}

console.log("calendar-helpers: PASSED");
