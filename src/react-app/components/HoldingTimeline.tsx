import React, { useMemo } from "react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./UI/card";
import {
  startOfDay,
  diffDays,
  startOfMonth,
  addMonths,
  formatMonth,
  formatDate,
} from "../lib/date";
import type { Holding, CalendarEvent } from "../types";

interface Props {
  holdings: Holding[];
  tasks: CalendarEvent[];
}

interface Bar {
  id: string;
  label: string;
  start: Date;
  end: Date;
  kind: "holding" | "task";
}

// ponytail: hand-rolled Gantt. Days are the only unit, one fixed px/day, native
// scroll. Ceiling: a multi-year range scrolls a long way — swap in zoom/px-per-
// day control if ranges ever exceed ~3 years.
const DAY_W = 3;
const LABEL_W = 190;
const ROW_H = 34;

export const HoldingTimeline: React.FC<Props> = ({ holdings, tasks }) => {
  const today = useMemo(() => startOfDay(new Date()), []);

  const { bars, rangeStart, trackW, ticks, todayLeft } = useMemo(() => {
    const holdingBars: Bar[] = holdings
      .filter((h) => h.effectiveFrom)
      .map((h) => {
        const start = startOfDay(h.effectiveFrom);
        // Open-ended = "now".
        let end = h.effectiveTo ? startOfDay(h.effectiveTo) : today;
        if (end.getTime() < start.getTime()) end = start;
        return { id: h.id, label: h.name, start, end, kind: "holding" as const };
      });

    const taskBars: Bar[] = tasks
      .filter((t) => t.startTime)
      .map((t) => {
        const start = startOfDay(t.startTime);
        const end = t.endTime ? startOfDay(t.endTime) : start;
        return {
          id: t.id,
          label: t.title,
          start,
          end: end.getTime() < start.getTime() ? start : end,
          kind: "task" as const,
        };
      });

    const all = [...holdingBars, ...taskBars];
    if (!all.length) {
      return { bars: all, rangeStart: today, trackW: 0, ticks: [], todayLeft: 0 };
    }

    let lo = all[0].start.getTime();
    let hi = all[0].end.getTime();
    for (const b of all) {
      lo = Math.min(lo, b.start.getTime());
      hi = Math.max(hi, b.end.getTime());
    }
    const rs = startOfMonth(Math.min(lo, today.getTime()));
    const re = new Date(Math.max(hi, today.getTime()));
    const totalDays = diffDays(rs, re) + 1;

    const tks: { label: string; left: number }[] = [];
    for (let m = startOfMonth(rs); m.getTime() <= re.getTime(); m = addMonths(m, 1)) {
      tks.push({ label: formatMonth(m), left: diffDays(rs, m) * DAY_W });
    }

    return {
      bars: all,
      rangeStart: rs,
      trackW: totalDays * DAY_W,
      ticks: tks,
      todayLeft: diffDays(rs, today) * DAY_W,
    };
  }, [holdings, tasks, today]);

  if (!bars.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nothing to plot yet — holdings and events with dates will appear here.
        </CardContent>
      </Card>
    );
  }

  const barGeom = (b: Bar) => ({
    left: diffDays(rangeStart, b.start) * DAY_W,
    width: Math.max(DAY_W, (diffDays(b.start, b.end) + 1) * DAY_W),
  });

  const groups: { title: string; rows: Bar[] }[] = [
    { title: "Holdings", rows: bars.filter((b) => b.kind === "holding") },
    { title: "Tasks & events", rows: bars.filter((b) => b.kind === "task") },
  ].filter((g) => g.rows.length > 0);

  return (
    <div
      className="overflow-x-auto rounded-lg border bg-card"
      tabIndex={0}
      role="region"
      aria-label="Ownership timeline"
    >
      <div className="min-w-max">
        {/* Header: month ticks + today marker */}
        <div className="flex" style={{ height: ROW_H }}>
          <div
            className="sticky left-0 z-20 flex-shrink-0 border-b border-r border-border bg-card"
            style={{ width: LABEL_W }}
          />
          <div className="relative border-b border-border" style={{ width: trackW }}>
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 flex h-full items-center border-l border-border pl-1 text-xs text-muted-foreground"
                style={{ left: t.left }}
              >
                {t.label}
              </div>
            ))}
            <div
              className="absolute top-0 h-full w-px bg-primary/60"
              style={{ left: todayLeft }}
              aria-hidden="true"
            />
          </div>
        </div>

        {groups.map((g) => (
          <React.Fragment key={g.title}>
            <div className="flex">
              <div
                className="sticky left-0 z-20 flex-shrink-0 border-b border-r border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                style={{ width: LABEL_W }}
              >
                {g.title}
              </div>
              <div className="border-b border-border" style={{ width: trackW }} />
            </div>

            {g.rows.map((b) => {
              const { left, width } = barGeom(b);
              return (
                <div key={b.id} className="flex" style={{ height: ROW_H }}>
                  <div
                    className="sticky left-0 z-20 flex flex-shrink-0 items-center gap-2 overflow-hidden border-b border-r border-border bg-card px-3"
                    style={{ width: LABEL_W }}
                  >
                    <span className="truncate text-sm text-foreground" title={b.label}>
                      {b.label}
                    </span>
                  </div>
                  <div className="relative border-b border-border" style={{ width: trackW }}>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-sm"
                      style={{ left, width, height: ROW_H - 14 }}
                    >
                      <div
                        role="img"
                        title={`${b.label} · ${formatDate(b.start)} → ${
                          b.kind === "task" && !b.end ? "same day" : formatDate(b.end)
                        }`}
                        aria-label={`${b.label} from ${formatDate(b.start)} to ${formatDate(b.end)}`}
                        className={cn(
                          "h-full w-full rounded-sm border",
                          b.kind === "holding"
                            ? "border-primary/60 bg-primary/70"
                            : "border-success/60 bg-success/70"
                        )}
                      />
                    </div>
                    <div
                      className="absolute top-0 h-full w-px bg-primary/40"
                      style={{ left: todayLeft }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
