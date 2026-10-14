// Native-Date-only helpers for the hub's List/Timeline views. No date lib.
//
// ponytail: date-only strings ("2026-01-01") are parsed as LOCAL midnight.
// `new Date("2026-01-01")` is UTC midnight, which slides to the previous day in
// negative-offset timezones — every day-diff here would be off by one. Parsing
// the parts by hand keeps the axis honest regardless of the viewer's clock.

export type DateInput = string | number | Date;

export function parseDate(input: DateInput): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === "number") return new Date(input);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return new Date(input);
}

export function startOfDay(input: DateInput): Date {
  const d = parseDate(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(input: DateInput, days: number): Date {
  const d = parseDate(input);
  d.setDate(d.getDate() + days);
  return d;
}

// Whole days from `a` to `b` (b - a). Rounded so a DST day (23h/25h) still
// counts as one.
export function diffDays(a: DateInput, b: DateInput): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function isSameDay(a: DateInput, b: DateInput): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function startOfMonth(input: DateInput): Date {
  const d = startOfDay(input);
  d.setDate(1);
  return d;
}

export function addMonths(input: DateInput, months: number): Date {
  const d = startOfMonth(input);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function formatDate(input: DateInput, withYear = true): string {
  return parseDate(input).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

// "Jan 2026"
export function formatMonth(input: DateInput): string {
  return parseDate(input).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ---- calendar helpers (Phase 3c) -------------------------------------------

// Datetime-aware parse. A string WITH a time component is handed to Date (a
// local wall-clock string like "2026-01-15T09:00:00" round-trips to local 9am);
// a date-only string keeps parseDate's local-midnight rule. parseDate() alone
// would truncate the time off an ISO datetime, so timed events must come here.
export function parseDateTime(input: DateInput): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === "number") return new Date(input);
  if (typeof input === "string" && input.includes("T")) {
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d;
  }
  return parseDate(input);
}

export function isSameMonth(a: DateInput, b: DateInput): boolean {
  const x = parseDate(a);
  const y = parseDate(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
}

export function addMinutes(input: DateInput, minutes: number): Date {
  const d = parseDateTime(input);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

// Local YYYY-MM-DD. NOT toISOString(): that is UTC and shifts the day backward
// in negative-offset timezones.
export function toISODate(input: DateInput): string {
  const d = parseDate(input);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// "9:00 AM"
export function formatTime(input: DateInput): string {
  return parseDateTime(input).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Sunday-first start of week.
export function startOfWeek(input: DateInput): Date {
  const d = startOfDay(input);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// The 7 dates (Sun→Sat) of the week containing `input`.
export function weekDates(input: DateInput): Date[] {
  const start = startOfWeek(input);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// A month laid out as weeks of Dates, null-padded to full Sunday-first weeks.
export function buildMonthWeeks(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) week.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}
