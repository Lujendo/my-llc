// Runnable self-check for the native date helpers. No framework:
//   node src/react-app/lib/date.smoke.mjs
import assert from "node:assert/strict";
import {
  parseDate,
  startOfDay,
  addDays,
  diffDays,
  isSameDay,
  startOfMonth,
  addMonths,
  formatDate,
  formatMonth,
  parseDateTime,
  isSameMonth,
  addMinutes,
  toISODate,
  formatTime,
  startOfWeek,
  weekDates,
  buildMonthWeeks,
} from "./date.ts";

// Date-only strings parse as LOCAL midnight (no UTC drift).
const d = parseDate("2026-01-01");
assert.equal(d.getFullYear(), 2026);
assert.equal(d.getMonth(), 0);
assert.equal(d.getDate(), 1);

// startOfDay clears the time.
const noon = new Date(2026, 5, 15, 13, 45, 30);
assert.equal(startOfDay(noon).getHours(), 0);
assert.equal(startOfDay(noon).getMinutes(), 0);

// addDays / diffDays across a month boundary.
assert.equal(diffDays("2026-01-30", "2026-02-02"), 3);
assert.equal(formatDate(addDays("2026-01-31", 1)), "Feb 1, 2026");

// DST spring-forward (US 2026-03-08): still counts as whole days.
assert.equal(diffDays("2026-03-07", "2026-03-09"), 2);

// isSameDay ignores time-of-day.
assert.equal(isSameDay("2026-01-01", new Date(2026, 0, 1, 23, 59)), true);
assert.equal(isSameDay("2026-01-01", "2026-01-02"), false);

// Month math.
assert.equal(formatMonth(startOfMonth("2026-07-19")), "Jul 2026");
assert.equal(formatMonth(addMonths("2026-12-15", 1)), "Jan 2027");
assert.equal(parseDate(startOfMonth("2026-07-19")).getDate(), 1);

// parseDateTime keeps the time on a datetime string (parseDate would drop it).
const dt = parseDateTime("2026-01-15T09:30:00");
assert.equal(dt.getHours(), 9);
assert.equal(dt.getMinutes(), 30);
assert.equal(dt.getDate(), 15);
// ...but date-only still parses as local midnight.
assert.equal(parseDateTime("2026-01-15").getHours(), 0);

assert.equal(isSameMonth("2026-01-31", new Date(2026, 0, 1)), true);
assert.equal(isSameMonth("2026-01-31", "2026-02-01"), false);

assert.equal(addMinutes("2026-01-15T09:30:00", 45).getHours(), 10);
assert.equal(addMinutes("2026-01-15T09:30:00", 45).getMinutes(), 15);

// toISODate is local, never UTC-shifted.
assert.equal(toISODate(new Date(2026, 0, 1, 23, 0)), "2026-01-01");
assert.equal(toISODate("2026-07-04T12:00:00"), "2026-07-04");

assert.match(formatTime("2026-01-15T09:30:00"), /\d{1,2}:\d{2}/);

// Sunday-first weeks. 2026-01-01 is a Thursday.
assert.equal(toISODate(startOfWeek("2026-01-01")), "2025-12-28");
const wk = weekDates("2026-01-01");
assert.equal(wk.length, 7);
assert.equal(wk[0].getDay(), 0);
assert.equal(wk[6].getDay(), 6);

// Month grid: Jan 2026 (Thu 1st) pads 4 leading nulls and fits in 5 weeks.
const weeks = buildMonthWeeks(2026, 0);
assert.equal(weeks.length, 5);
assert.equal(weeks[0][0], null);
assert.equal(weeks[0][4].getDate(), 1);
assert.equal(weeks.every((w) => w.length === 7), true);

console.log("date-helpers: PASSED");
