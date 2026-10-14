import type { Holding } from "../types";

// Pure helpers for the Holding Hub. No React, no fetch — so they can be
// exercised by holdings.smoke.mjs under plain node.

export interface HoldingNode extends Holding {
  children: HoldingNode[];
}

// The constellations endpoint returns raw snake_case rows (worker
// listConstellations) while the rest of the API is camelCase (holdingToApi).
// Accept either so the UI only ever sees the camelCase Holding shape.
const pick = (row: any, camel: string, snake: string) =>
  row?.[camel] ?? row?.[snake] ?? null;

export function normalizeHolding(row: any): HoldingNode {
  return {
    id: row.id,
    userId: pick(row, "userId", "user_id") ?? "",
    name: row.name ?? "",
    jurisdictionCountry: pick(row, "jurisdictionCountry", "jurisdiction_country") ?? "",
    jurisdictionSubdivision: pick(row, "jurisdictionSubdivision", "jurisdiction_subdivision"),
    baseCurrency: pick(row, "baseCurrency", "base_currency") ?? "",
    currencyAsOf: pick(row, "currencyAsOf", "currency_as_of"),
    effectiveFrom: pick(row, "effectiveFrom", "effective_from") ?? "",
    effectiveTo: pick(row, "effectiveTo", "effective_to"),
    createdAt: pick(row, "createdAt", "created_at") ?? "",
    children: Array.isArray(row?.children) ? row.children.map(normalizeHolding) : [],
  };
}

// Number of holdings in a constellation subtree (root included).
export function countNodes(node: HoldingNode): number {
  return 1 + node.children.reduce((n, c) => n + countNodes(c), 0);
}

// Depth-first flatten of a constellation subtree into a plain Holding list
// (used by the List and Timeline views).
export function flattenHoldings(node: HoldingNode): Holding[] {
  return [node, ...node.children.flatMap(flattenHoldings)];
}

// Distinct non-empty jurisdictions across a set of holdings.
export function distinctJurisdictions(rows: { jurisdictionCountry?: string | null }[]): number {
  return new Set(rows.map((r) => r.jurisdictionCountry).filter(Boolean)).size;
}

// Bucket entities by the holding they belong to, so each holding node can render
// its own members. Entities with no holdingId are dropped (caller shows them
// separately as unassigned).
export function groupEntitiesByHolding<T extends { holdingId?: string | null }>(entities: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const e of entities) {
    if (!e.holdingId) continue;
    const list = map.get(e.holdingId);
    if (list) list.push(e);
    else map.set(e.holdingId, [e]);
  }
  return map;
}
