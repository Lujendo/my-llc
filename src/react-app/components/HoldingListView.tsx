import React, { useMemo, useState } from "react";
import { Building2, Coins, Globe, LayoutGrid, List as ListIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./UI/card";
import { Badge } from "./UI/badge";
import { formatDate } from "../lib/date";
import type { Holding } from "../types";

// Member entity as the consolidated rollup returns it (snake_case `holding_id`,
// normalized by HoldingHub).
export interface HubEntity {
  id: string;
  name: string;
  state?: string | null;
  status?: string | null;
  holdingId?: string | null;
}

interface Props {
  holdings: Holding[];
  entities: HubEntity[];
  loading?: boolean;
}

const window = (h: Holding) =>
  `${formatDate(h.effectiveFrom)} → ${h.effectiveTo ? formatDate(h.effectiveTo) : "present"}`;

const HoldingBadges: React.FC<{ h: Holding }> = ({ h }) => (
  <>
    <Badge variant="outline" className="gap-1">
      <Globe className="h-3 w-3" />
      {h.jurisdictionCountry}
      {h.jurisdictionSubdivision ? ` · ${h.jurisdictionSubdivision}` : ""}
    </Badge>
    <Badge variant="secondary" className="gap-1">
      <Coins className="h-3 w-3" />
      {h.baseCurrency}
    </Badge>
  </>
);

const EntityRow: React.FC<{ e: HubEntity }> = ({ e }) => (
  <div className="flex items-center gap-3 px-3 py-2">
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Building2 className="h-3.5 w-3.5" />
    </div>
    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{e.name}</span>
    {e.state && <Badge variant="outline">{e.state}</Badge>}
    {e.status && <Badge variant="secondary">{e.status}</Badge>}
  </div>
);

// Ported from the reference TodosPage grouped|list toggle — just the toggle and
// the two row layouts, not the page.
export const HoldingListView: React.FC<Props> = ({ holdings, entities, loading }) => {
  const [mode, setMode] = useState<"grouped" | "list">("grouped");

  const byHolding = useMemo(() => {
    const map = new Map<string, HubEntity[]>();
    for (const e of entities) {
      if (!e.holdingId) continue;
      const list = map.get(e.holdingId) ?? [];
      list.push(e);
      map.set(e.holdingId, list);
    }
    return map;
  }, [entities]);

  const toggle = (
    <div className="flex items-center gap-1 rounded-md border border-input p-1" role="group" aria-label="View layout">
      <button
        type="button"
        onClick={() => setMode("grouped")}
        aria-pressed={mode === "grouped"}
        title="Grouped view"
        className={cn(
          "rounded p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mode === "grouped" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setMode("list")}
        aria-pressed={mode === "list"}
        title="List view"
        className={cn(
          "rounded p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
        )}
      >
        <ListIcon className="h-4 w-4" />
      </button>
    </div>
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading holdings…</p>;
  }

  if (!holdings.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No holdings in this constellation yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{toggle}</div>

      {mode === "grouped" ? (
        <div className="space-y-4">
          {holdings.map((h) => {
            const members = byHolding.get(h.id) ?? [];
            return (
              <Card key={h.id}>
                <CardHeader className="gap-2 p-4">
                  <CardTitle className="text-base">{h.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <HoldingBadges h={h} />
                    <span className="text-xs text-muted-foreground">{window(h)}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {members.length ? (
                    <div className="divide-y divide-border border-t border-border">
                      {members.map((e) => (
                        <EntityRow key={e.id} e={e} />
                      ))}
                    </div>
                  ) : (
                    <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                      No member entities.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {holdings.map((h) => {
                const members = byHolding.get(h.id) ?? [];
                return (
                  <div key={h.id} className="flex flex-col gap-1 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{h.name}</span>
                      <HoldingBadges h={h} />
                      <span className="text-xs text-muted-foreground">{window(h)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {members.length
                        ? members.map((m) => m.name).join(", ")
                        : "No member entities"}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
