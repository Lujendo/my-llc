import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./UI/button";
import { Card, CardContent } from "./UI/card";
import { Input } from "./UI/input";
import { Label } from "./UI/label";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./UI/dialog";
import { api } from "../lib/api";
import { normalizeCalendarEvent, overlapsDay, readableTextColor } from "../lib/calendar";
import {
  addDays,
  addMinutes,
  buildMonthWeeks,
  formatDate,
  formatMonth,
  formatTime,
  isSameDay,
  isSameMonth,
  parseDateTime,
  startOfDay,
  toISODate,
  weekDates,
} from "../lib/date";
import type { CalendarEvent } from "../types";

// ponytail: single color fallback; the API has no palette concept, presets are UI-only.
const DEFAULT_COLOR = "#6366f1";
const SWATCHES = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#64748b"];

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_PX = 48; // month/week grid density; taller = more scroll
const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const hourLabel = (h: number) => (h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`);

type ViewMode = "month" | "week" | "day" | "year";
type CalDated = { e: CalendarEvent; s: number; en: number };

export interface CalendarEntityOption {
  id: string;
  name: string;
}

interface HoldingCalendarProps {
  entities: CalendarEntityOption[];
}

const colorOf = (e: CalendarEvent) => e.color || DEFAULT_COLOR;

// ---- Modal -----------------------------------------------------------------

interface EventModalProps {
  event: CalendarEvent | null;
  date: Date;
  hour?: number;
  entities: CalendarEntityOption[];
  onClose: () => void;
  onSave: (payload: Record<string, unknown>, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EventModal: React.FC<EventModalProps> = ({ event, date, hour, entities, onClose, onSave, onDelete }) => {
  const start = useMemo(() => {
    if (event) return parseDateTime(event.startTime);
    const d = new Date(date);
    d.setHours(hour ?? 9, 0, 0, 0);
    return d;
  }, [event, date, hour]);
  const end = useMemo(
    () => (event?.endTime ? parseDateTime(event.endTime) : addMinutes(start, 60)),
    [event, start]
  );

  const [title, setTitle] = useState(event?.title ?? "");
  const [allDay, setAllDay] = useState(event ? event.isAllDay : hour == null);
  const [startDate, setStartDate] = useState(toISODate(start));
  const [startTimeV, setStartTimeV] = useState(hhmm(start));
  const [endDate, setEndDate] = useState(toISODate(end));
  const [endTimeV, setEndTimeV] = useState(hhmm(end));
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [entityId, setEntityId] = useState(event?.entityId ?? "");
  const [color, setColor] = useState(event?.color || DEFAULT_COLOR);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      // Local wall-clock strings (no trailing Z) so they round-trip to the same
      // local time regardless of the viewer's timezone.
      const startISO = allDay ? startDate : `${startDate}T${startTimeV}:00`;
      const endISO = allDay ? endDate || startDate : `${endDate || startDate}T${endTimeV}:00`;
      await onSave(
        {
          title: title.trim(),
          isAllDay: allDay,
          startTime: startISO,
          endTime: endISO,
          location: location.trim() || null,
          description: description.trim() || null,
          entityId: entityId || null,
          color,
        },
        event?.id
      );
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to save event.");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!event || !window.confirm(`Delete "${event.title}"?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await onDelete(event.id);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to delete event.");
      setBusy(false);
    }
  };

  return (
    <Dialog onClose={() => !busy && onClose()}>
      <DialogOverlay onClick={() => !busy && onClose()} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription>Events live on your calendar and can be linked to an entity.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Title</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Board meeting" />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            All day
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-start-date">Starts</Label>
              <Input id="ev-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              {!allDay && (
                <Input aria-label="Start time" type="time" value={startTimeV} onChange={(e) => setStartTimeV(e.target.value)} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end-date">Ends</Label>
              <Input id="ev-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              {!allDay && (
                <Input aria-label="End time" type="time" value={endTimeV} onChange={(e) => setEndTimeV(e.target.value)} />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-entity">Entity</Label>
              <select
                id="ev-entity"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— None —</option>
                {entities.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-location">Location</Label>
              <Input id="ev-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">Description</Label>
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-6 w-6 rounded-full ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    color === c && "ring-2 ring-foreground"
                  )}
                />
              ))}
              <input
                type="color"
                aria-label="Custom color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-input bg-transparent"
              />
            </div>
          </div>

          {err && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> {err}
            </p>
          )}

          <DialogFooter className="items-center">
            {event && (
              <Button type="button" variant="ghost" className="mr-auto text-destructive hover:bg-destructive/10" onClick={del} disabled={busy}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {event ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---- Month -----------------------------------------------------------------

const EventChip: React.FC<{
  item: CalDated;
  onOpen: (e: CalendarEvent) => void;
  onDragStart: (ev: React.DragEvent, e: CalendarEvent) => void;
}> = ({ item, onOpen, onDragStart }) => (
  <button
    type="button"
    draggable
    onDragStart={(ev) => onDragStart(ev, item.e)}
    onClick={(ev) => {
      ev.stopPropagation();
      onOpen(item.e);
    }}
    title={item.e.title}
    style={{ backgroundColor: colorOf(item.e), color: readableTextColor(colorOf(item.e)) }}
    className={cn(
      "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] transition-opacity hover:opacity-90",
      item.e.isAllDay && "font-medium"
    )}
  >
    {!item.e.isAllDay && <span className="flex-shrink-0 opacity-80">{formatTime(item.s)}</span>}
    <span className="truncate">{item.e.title}</span>
  </button>
);

interface MonthViewProps {
  cursor: Date;
  onDay: (d: Date) => CalDated[];
  onCreate: (d: Date) => void;
  onOpen: (e: CalendarEvent) => void;
  onDragStart: (ev: React.DragEvent, e: CalendarEvent) => void;
  onDrop: (ev: React.DragEvent, d: Date) => void;
  dragOver: string | null;
  setDragOver: (k: string | null) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ cursor, onDay, onCreate, onOpen, onDragStart, onDrop, dragOver, setDragOver }) => {
  const weeks = useMemo(() => buildMonthWeeks(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const today = new Date();
  const gridRef = useRef<HTMLDivElement>(null);
  // Roving tabindex: one day cell is tabbable, arrows move focus within the grid.
  const [focusKey, setFocusKey] = useState<string>(() => toISODate(cursor));

  const focusDate = (key: string) =>
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${key}"]`)?.focus();

  const onCellKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, day: Date) => {
    if (e.target !== e.currentTarget) return; // let nested event chips handle their own keys
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCreate(day);
      return;
    }
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in delta) {
      e.preventDefault();
      focusDate(toISODate(addDays(day, delta[e.key])));
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div role="grid" aria-label="Month view">
          <div role="row" className="grid grid-cols-7 border-b bg-muted/30">
            {WEEKDAY.map((d) => (
              <div key={d} role="columnheader" className="py-1.5 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div ref={gridRef} role="rowgroup">
            {weeks.map((week, wi) => (
              <div key={wi} role="row" className="grid grid-cols-7">
                {week.map((day, di) => {
                  if (!day)
                    return (
                      <div
                        key={di}
                        role="gridcell"
                        aria-hidden="true"
                        className="min-h-[108px] border-b border-r border-border bg-muted/5"
                      />
                    );
                  const items = onDay(day);
                  const key = toISODate(day);
                  return (
                    <div
                      key={di}
                      role="gridcell"
                      data-date={key}
                      tabIndex={key === focusKey ? 0 : -1}
                      aria-label={day.toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      onFocus={() => setFocusKey(key)}
                      onKeyDown={(e) => onCellKeyDown(e, day)}
                      className={cn(
                        "min-h-[108px] cursor-pointer border-b border-r border-border p-1 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        !isSameMonth(day, cursor) && "bg-muted/20",
                        dragOver === key && "bg-primary/10"
                      )}
                      onClick={() => onCreate(day)}
                      onDragOver={(ev) => {
                        ev.preventDefault();
                        setDragOver(key);
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(ev) => onDrop(ev, day)}
                    >
                      <div
                        className={cn(
                          "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          isSameDay(day, today) ? "bg-primary font-semibold text-primary-foreground" : "text-foreground"
                        )}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {items.slice(0, 3).map((item) => (
                          <EventChip key={item.e.id} item={item} onOpen={onOpen} onDragStart={onDragStart} />
                        ))}
                        {items.length > 3 && (
                          <div className="px-1 text-[11px] text-muted-foreground">+{items.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ---- Time grid (week + day) ------------------------------------------------

interface TimeGridProps {
  days: Date[];
  onDay: (d: Date) => CalDated[];
  onCreate: (d: Date, hour: number) => void;
  onOpen: (e: CalendarEvent) => void;
  onDragStart: (ev: React.DragEvent, e: CalendarEvent) => void;
  onDrop: (ev: React.DragEvent, d: Date, hour?: number) => void;
  dragOver: string | null;
  setDragOver: (k: string | null) => void;
}

const TimeGrid: React.FC<TimeGridProps> = ({ days, onDay, onCreate, onOpen, onDragStart, onDrop, dragOver, setDragOver }) => {
  const today = new Date();
  const gridRef = useRef<HTMLDivElement>(null);
  // Roving tabindex over hour slots, keyed `${isoDate}:${hour}`.
  const [focusKey, setFocusKey] = useState<string>(() => `${toISODate(days[0])}:0`);

  const focusSlot = (key: string) =>
    gridRef.current?.querySelector<HTMLElement>(`[data-key="${key}"]`)?.focus();

  const onHourKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, d: Date, h: number, di: number) => {
    const iso = toISODate(d);
    let next: string | null = null;
    if (e.key === "ArrowUp") next = h > 0 ? `${iso}:${h - 1}` : null;
    else if (e.key === "ArrowDown") next = h < 23 ? `${iso}:${h + 1}` : null;
    else if (e.key === "ArrowLeft" && di > 0) next = `${toISODate(days[di - 1])}:${h}`;
    else if (e.key === "ArrowRight" && di < days.length - 1) next = `${toISODate(days[di + 1])}:${h}`;
    if (next) {
      e.preventDefault();
      focusSlot(next);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="max-h-[70vh] overflow-auto">
        <div ref={gridRef} className="min-w-[560px]">
          <div className="sticky top-0 z-20 flex border-b bg-card">
            <div className="w-14 flex-shrink-0" />
            {days.map((d, i) => (
              <div
                key={i}
                className={cn("flex-1 border-l border-border py-1 text-center", isSameDay(d, today) && "bg-primary/5")}
              >
                <div className="text-xs text-muted-foreground">{WEEKDAY[d.getDay()]}</div>
                <div
                  className={cn(
                    "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isSameDay(d, today) ? "bg-primary font-semibold text-primary-foreground" : "text-foreground"
                  )}
                >
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* All-day strip */}
          <div className="flex min-h-[28px] border-b bg-muted/30">
            <div className="w-14 flex-shrink-0 py-1 pr-1 text-right text-[10px] uppercase text-muted-foreground">all-day</div>
            {days.map((d, i) => (
              <div
                key={i}
                className={cn("flex-1 space-y-0.5 border-l border-border p-0.5", dragOver === toISODate(d) && "bg-primary/10")}
                onDragOver={(ev) => {
                  ev.preventDefault();
                  setDragOver(toISODate(d));
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(ev) => onDrop(ev, d)}
              >
                {onDay(d)
                  .filter((it) => it.e.isAllDay)
                  .map((item) => (
                    <EventChip key={item.e.id} item={item} onOpen={onOpen} onDragStart={onDragStart} />
                  ))}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="flex">
            <div className="w-14 flex-shrink-0">
              {HOURS.map((h) => (
                <div key={h} className="relative text-right" style={{ height: HOUR_PX }}>
                  <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground">{hourLabel(h)}</span>
                </div>
              ))}
            </div>
            {days.map((d, di) => (
              <div key={di} className="relative flex-1 border-l border-border">
                {HOURS.map((h) => {
                  const iso = toISODate(d);
                  const key = `${iso}:${h}`;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-key={key}
                      tabIndex={key === focusKey ? 0 : -1}
                      aria-label={`Create event ${iso} ${hourLabel(h)}`}
                      onFocus={() => setFocusKey(key)}
                      onKeyDown={(e) => onHourKeyDown(e, d, h, di)}
                      style={{ height: HOUR_PX }}
                      className={cn(
                        "block w-full cursor-pointer border-b border-dashed border-border/60 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        dragOver === key && "bg-primary/10"
                      )}
                      onClick={() => onCreate(d, h)}
                      onDragOver={(ev) => {
                        ev.preventDefault();
                        setDragOver(key);
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(ev) => onDrop(ev, d, h)}
                    />
                  );
                })}
                {onDay(d)
                  .filter((it) => !it.e.isAllDay && isSameDay(parseDateTime(it.e.startTime), d))
                  .map((item) => {
                    const s = parseDateTime(item.e.startTime);
                    const e = item.e.endTime ? parseDateTime(item.e.endTime) : addMinutes(s, 30);
                    const top = ((s.getHours() * 60 + s.getMinutes()) / 60) * HOUR_PX;
                    const height = Math.max(((e.getTime() - s.getTime()) / 3_600_000) * HOUR_PX, 18);
                    return (
                      <button
                        key={item.e.id}
                        type="button"
                        draggable
                        onDragStart={(ev) => onDragStart(ev, item.e)}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onOpen(item.e);
                        }}
                        style={{ top, height, backgroundColor: colorOf(item.e), color: readableTextColor(colorOf(item.e)) }}
                        className="absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-90"
                        title={item.e.title}
                      >
                        <div className="truncate font-medium">{item.e.title}</div>
                        <div className="truncate opacity-80">{formatTime(s)}</div>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ---- Year ------------------------------------------------------------------

interface YearViewProps {
  cursor: Date;
  onDay: (d: Date) => CalDated[];
  onPick: (d: Date) => void;
}

const YearView: React.FC<YearViewProps> = ({ cursor, onDay, onPick }) => {
  const year = cursor.getFullYear();
  const today = new Date();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, m) => (
        <Card key={m}>
          <CardContent className="p-3">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              {new Date(year, m, 1).toLocaleDateString("en-US", { month: "long" })}
            </h3>
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {WEEKDAY.map((d) => (
                <div key={d} className="text-[10px] text-muted-foreground">
                  {d[0]}
                </div>
              ))}
              {buildMonthWeeks(year, m).flat().map((day, i) => {
                if (!day) return <div key={i} />;
                const colors = Array.from(new Set(onDay(day).map((it) => colorOf(it.e)))).slice(0, 3);
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onPick(day)}
                    className={cn(
                      "mx-auto flex h-6 w-6 flex-col items-center justify-center rounded text-[11px] transition-colors hover:bg-accent",
                      isToday && "bg-primary font-semibold text-primary-foreground"
                    )}
                    title={`${toISODate(day)}`}
                  >
                    {day.getDate()}
                    <span className="flex h-1 items-center gap-px">
                      {colors.map((c) => (
                        <span key={c} className="h-1 w-1 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ---- Parent ----------------------------------------------------------------

export const HoldingCalendar: React.FC<HoldingCalendarProps> = ({ entities }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));
  const [modal, setModal] = useState<{ event: CalendarEvent | null; date: Date; hour?: number } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.listCalendarEvents();
      setEvents(((d.events as unknown[]) ?? []).map(normalizeCalendarEvent));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const dated = useMemo<CalDated[]>(
    () =>
      events.map((e) => {
        const s = parseDateTime(e.startTime).getTime();
        const en = e.endTime ? parseDateTime(e.endTime).getTime() : s;
        return { e, s, en: Math.max(s, en) };
      }),
    [events]
  );

  const onDay = useCallback((day: Date) => dated.filter((d) => overlapsDay(d.s, d.en, day)), [dated]);

  const step = (dir: 1 | -1) =>
    setCursor((c) => {
      if (view === "year") return new Date(c.getFullYear() + dir, c.getMonth(), 1);
      if (view === "month") return new Date(c.getFullYear(), c.getMonth() + dir, 1);
      return addDays(c, dir * (view === "week" ? 7 : 1));
    });

  const title = useMemo(() => {
    if (view === "year") return String(cursor.getFullYear());
    if (view === "month") return formatMonth(cursor);
    if (view === "week") {
      const w = weekDates(cursor);
      return `${formatDate(w[0])} – ${formatDate(w[6])}`;
    }
    return cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [view, cursor]);

  const days = view === "week" ? weekDates(cursor) : [cursor];

  const handleSave = async (payload: Record<string, unknown>, id?: string) => {
    if (id) await api.updateCalendarEvent(id, payload);
    else await api.createCalendarEvent(payload);
    await load();
    flash(id ? "Event updated" : "Event created");
  };

  const handleDelete = async (id: string) => {
    await api.deleteCalendarEvent(id);
    await load();
    flash("Event deleted");
  };

  const onDragStart = (ev: React.DragEvent, e: CalendarEvent) => {
    ev.dataTransfer.setData("text/plain", e.id);
    ev.dataTransfer.effectAllowed = "move";
  };

  const onDrop = async (ev: React.DragEvent, day: Date, hour?: number) => {
    ev.preventDefault();
    setDragOver(null);
    const id = ev.dataTransfer.getData("text/plain");
    const target = events.find((x) => x.id === id);
    if (!target) return;

    const origStart = parseDateTime(target.startTime);
    const origEnd = target.endTime ? parseDateTime(target.endTime) : origStart;
    const durationMs = Math.max(0, origEnd.getTime() - origStart.getTime());

    const newStart = startOfDay(day);
    if (!target.isAllDay) {
      newStart.setHours(hour ?? origStart.getHours(), hour != null ? 0 : origStart.getMinutes(), 0, 0);
    }
    const newEnd = new Date(newStart.getTime() + durationMs);
    const toLocal = (d: Date) => (target.isAllDay ? toISODate(d) : `${toISODate(d)}T${hhmm(d)}:00`);
    const payload = { startTime: toLocal(newStart), endTime: target.isAllDay ? toISODate(newEnd) : toLocal(newEnd) };

    // Optimistic; reload on failure to stay truthful.
    setEvents((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
    try {
      await api.updateCalendarEvent(id, payload);
      flash("Event moved");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Failed to move event", false);
      void load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(startOfDay(new Date()))}>
            Today
          </Button>
          <h2 className="ml-2 text-lg font-semibold text-foreground">{title}</h2>
          {loading && <Loader2 className="ml-1 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="View mode" className="flex rounded-md border border-input p-0.5">
            {(["month", "week", "day", "year"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-2.5 py-1 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setModal({ event: null, date: cursor })}>
            <Plus className="h-4 w-4" /> Event
          </Button>
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {!loading && events.length === 0 && !error && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" /> No events yet — click a day to add one.
        </p>
      )}

      {view === "month" && (
        <MonthView
          cursor={cursor}
          onDay={onDay}
          onCreate={(d) => setModal({ event: null, date: d })}
          onOpen={(e) => setModal({ event: e, date: cursor })}
          onDragStart={onDragStart}
          onDrop={onDrop}
          dragOver={dragOver}
          setDragOver={setDragOver}
        />
      )}
      {view === "year" && <YearView cursor={cursor} onDay={onDay} onPick={(d) => { setCursor(d); setView("day"); }} />}
      {(view === "week" || view === "day") && (
        <TimeGrid
          days={days}
          onDay={onDay}
          onCreate={(d, hour) => setModal({ event: null, date: d, hour })}
          onOpen={(e) => setModal({ event: e, date: cursor })}
          onDragStart={onDragStart}
          onDrop={onDrop}
          dragOver={dragOver}
          setDragOver={setDragOver}
        />
      )}

      {modal && (
        <EventModal
          event={modal.event}
          date={modal.date}
          hour={modal.hour}
          entities={entities}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {toast && (
        <div
          role="status"
          className={cn(
            "fixed bottom-4 right-4 z-[60] rounded-md px-4 py-2 text-sm text-white shadow-lg",
            toast.ok ? "bg-emerald-600" : "bg-destructive"
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};
