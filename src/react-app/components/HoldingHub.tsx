import React, { useEffect, useMemo, useState } from "react";
import {
  Network,
  Boxes,
  Building2,
  Globe,
  Coins,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./UI/button";
import { Card, CardHeader, CardTitle, CardContent } from "./UI/card";
import { Badge } from "./UI/badge";
import { Input } from "./UI/input";
import { Label } from "./UI/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./UI/tabs";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./UI/dialog";
import { useHoldings, type ConstellationInput } from "../hooks/useHoldings";
import {
  normalizeHolding,
  countNodes,
  distinctJurisdictions,
  flattenHoldings,
  groupEntitiesByHolding,
  type HoldingNode,
} from "../lib/holdings";
import { HoldingListView, type HubEntity } from "./HoldingListView";
import { HoldingTimeline } from "./HoldingTimeline";
import { HoldingCalendar } from "./HoldingCalendar";
import { normalizeCalendarEvent } from "../lib/calendar";
import { toISODate } from "../lib/date";
import type { Holding, CalendarEvent } from "../types";
import { api } from "../lib/api";

interface HoldingHubProps {
  userId: string;
}

// Local date, not toISOString(): the UTC form slides to tomorrow in
// negative-offset timezones (same trap date.ts documents).
const today = () => toISODate(new Date());

const emptyForm = (): ConstellationInput => ({
  name: "",
  jurisdictionCountry: "",
  baseCurrency: "USD",
  effectiveFrom: today(),
});

// ---- presentational bits ---------------------------------------------------

const Stat: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}> = ({ icon: Icon, label, value }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-semibold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

// One member entity row, shown under the holding it belongs to.
const MemberRow: React.FC<{ entity: HubEntity }> = ({ entity }) => (
  <div className="flex items-center gap-3 px-4 py-2">
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Building2 className="h-3.5 w-3.5" />
    </div>
    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{entity.name}</span>
    {entity.state && <Badge variant="outline">{entity.state}</Badge>}
    {entity.status && <Badge variant="secondary">{entity.status}</Badge>}
  </div>
);

// A tidy indented tree of cards — root holding, then sub-holdings nested under
// a guide line. Each node shows its own member entities (Phase 2). No graph
// library; hierarchy comes from spacing + the rule.
const HoldingTreeNode: React.FC<{
  node: HoldingNode;
  depth: number;
  membersByHolding: Map<string, HubEntity[]>;
}> = ({ node, depth, membersByHolding }) => {
  const members = membersByHolding.get(node.id) ?? [];
  return (
    <div>
      <Card className={cn(depth === 0 && "border-primary/40")}>
        <div className="flex items-start gap-3 p-4">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md",
              depth === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {depth === 0 ? <Network className="h-5 w-5" /> : <Boxes className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{node.name}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                {node.jurisdictionCountry}
                {node.jurisdictionSubdivision ? ` · ${node.jurisdictionSubdivision}` : ""}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Coins className="h-3 w-3" />
                {node.baseCurrency}
              </Badge>
              {members.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {members.length} member{members.length > 1 ? "s" : ""}
                </span>
              )}
              {node.children.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {node.children.length} sub-holding{node.children.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {members.length > 0 && (
          <div className="divide-y divide-border border-t border-border">
            {members.map((m) => (
              <MemberRow key={m.id} entity={m} />
            ))}
          </div>
        )}
      </Card>

      {node.children.length > 0 && (
        <ul className="ml-4 mt-3 space-y-3 border-l-2 border-border pl-4">
          {node.children.map((child) => (
            <li key={child.id}>
              <HoldingTreeNode node={child} depth={depth + 1} membersByHolding={membersByHolding} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---- view ------------------------------------------------------------------

export const HoldingHub: React.FC<HoldingHubProps> = ({ userId }) => {
  const { constellations, loading, error, createConstellation } = useHoldings(userId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [consolidated, setConsolidated] = useState<any | null>(null);
  const [consLoading, setConsLoading] = useState(false);
  const [consError, setConsError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ConstellationInput>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View mode + lazily-loaded calendar events (Only fetched once the Timeline
  // tab is opened — users who never open it pay nothing.)
  const [view, setView] = useState<"constellation" | "list" | "timeline" | "calendar">("constellation");
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);

  const selected = useMemo(
    () => constellations.find((c) => c.id === selectedId) ?? constellations[0] ?? null,
    [constellations, selectedId]
  );

  // Keep the selection valid as the list loads or changes.
  useEffect(() => {
    if (constellations.length && !constellations.some((c) => c.id === selectedId)) {
      setSelectedId(constellations[0].id);
    }
  }, [constellations, selectedId]);

  // Fetch the consolidated rollup whenever the selected constellation changes.
  useEffect(() => {
    if (!selected) {
      setConsolidated(null);
      return;
    }
    let cancelled = false;
    setConsLoading(true);
    setConsError(null);
    api
      .getHoldingConsolidated(selected.id)
      .then((data) => !cancelled && setConsolidated(data))
      .catch((e) => {
        if (cancelled) return;
        setConsError(e instanceof Error ? e.message : "Failed to load rollup");
        setConsolidated(null);
      })
      .finally(() => !cancelled && setConsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Fetch calendar events the first time the Timeline tab is opened.
  useEffect(() => {
    if (view !== "timeline" || events !== null) return;
    let cancelled = false;
    api
      .listCalendarEvents()
      .then((d) => !cancelled && setEvents((d.events || []).map(normalizeCalendarEvent)))
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, [view, events]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError(null);
    setShowCreate(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.jurisdictionCountry.trim() || !form.baseCurrency.trim()) {
      setFormError("Name, jurisdiction and base currency are required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const created = await createConstellation({
        name: form.name.trim(),
        jurisdictionCountry: form.jurisdictionCountry.trim().toUpperCase(),
        baseCurrency: form.baseCurrency.trim().toUpperCase(),
        effectiveFrom: form.effectiveFrom || today(),
      });
      setSelectedId(created.id);
      setShowCreate(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create constellation");
    } finally {
      setBusy(false);
    }
  };

  const totals = consolidated?.totals ?? {};
  const holdingsCount = totals.holdings ?? (selected ? countNodes(selected) : 0);
  const entitiesCount = totals.entities ?? 0;
  const jurisdictions = consolidated?.holdings
    ? distinctJurisdictions(consolidated.holdings.map(normalizeHolding))
    : null;

  // Flat holding list for the List/Timeline views: prefer the consolidated
  // rollup, fall back to the selected constellation's tree before it loads.
  const flatHoldings = useMemo<Holding[]>(() => {
    const rows = consolidated?.holdings;
    if (Array.isArray(rows) && rows.length) return rows.map(normalizeHolding);
    return selected ? flattenHoldings(selected) : [];
  }, [consolidated, selected]);

  const hubEntities = useMemo<HubEntity[]>(() => {
    const rows: any[] = consolidated?.entities ?? [];
    return rows.map((e) => ({
      id: e.id,
      name: e.name,
      state: e.state ?? null,
      status: e.status ?? null,
      holdingId: e.holding_id ?? e.holdingId ?? null,
    }));
  }, [consolidated]);

  // Phase 2: members rendered under their own holding node; the rest surface
  // below as "Unassigned".
  const membersByHolding = useMemo(() => groupEntitiesByHolding(hubEntities), [hubEntities]);
  const unassigned = useMemo(() => hubEntities.filter((e) => !e.holdingId), [hubEntities]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Holding Hub</h1>
        <p className="mt-1 text-muted-foreground">
          Map your ownership constellations — holdings, sub-holdings and the entities they own.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Constellation selector */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Constellations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            )}
            {error && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
            {!loading && !error && constellations.length === 0 && (
              <p className="text-sm text-muted-foreground">No constellations yet.</p>
            )}

            <ul className="space-y-1">
              {constellations.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Network className="h-4 w-4 flex-shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{countNodes(c)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <Button variant="outline" size="sm" className="w-full" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New constellation
            </Button>
          </CardContent>
        </Card>

        {/* Selected constellation */}
        {!selected ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Network className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-semibold text-foreground">No constellation selected</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a constellation to map your holding structure.
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" /> New constellation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Consolidated KPIs */}
            <section aria-label="Consolidated totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={Boxes} label="Holdings" value={holdingsCount} />
              <Stat icon={Building2} label="Entities" value={entitiesCount} />
              <Stat icon={Globe} label="Jurisdictions" value={jurisdictions ?? "—"} />
              <Stat icon={Coins} label="Base currency" value={selected.baseCurrency || "—"} />
            </section>

            {consError && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {consError}
              </p>
            )}

            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
              <TabsList aria-label="View mode">
                <TabsTrigger value="constellation">Constellation</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="constellation" className="space-y-6">
            {/* Hierarchy — each node carries its own member entities */}
            <section aria-label="Holding structure">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
                {consLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <HoldingTreeNode node={selected} depth={0} membersByHolding={membersByHolding} />
            </section>

            {/* Entities not tied to a holding */}
            {unassigned.length > 0 && (
              <section aria-label="Unassigned entities">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Unassigned
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{unassigned.length}</span>
                </h2>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {unassigned.map((e) => (
                      <MemberRow key={e.id} entity={e} />
                    ))}
                  </CardContent>
                </Card>
              </section>
            )}
              </TabsContent>

              <TabsContent value="list">
                <HoldingListView holdings={flatHoldings} entities={hubEntities} loading={consLoading} />
              </TabsContent>

              <TabsContent value="timeline">
                <HoldingTimeline holdings={flatHoldings} tasks={events ?? []} />
              </TabsContent>

              <TabsContent value="calendar">
                <HoldingCalendar entities={hubEntities} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Create constellation dialog */}
      {showCreate && (
        <Dialog onClose={() => !busy && setShowCreate(false)}>
          <DialogOverlay onClick={() => !busy && setShowCreate(false)} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New constellation</DialogTitle>
              <DialogDescription>
                A constellation is a root holding. Add sub-holdings and members afterwards.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Name</Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Global Holdings"
                  autoFocus
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-country">Jurisdiction (country)</Label>
                  <Input
                    id="c-country"
                    value={form.jurisdictionCountry}
                    onChange={(e) => setForm({ ...form, jurisdictionCountry: e.target.value })}
                    placeholder="US"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-currency">Base currency</Label>
                  <Input
                    id="c-currency"
                    value={form.baseCurrency}
                    onChange={(e) => setForm({ ...form, baseCurrency: e.target.value })}
                    placeholder="USD"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-from">Effective from</Label>
                <Input
                  id="c-from"
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                />
              </div>

              {formError && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> {formError}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
