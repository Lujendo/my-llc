// Runnable self-check for the pure Holding Hub helpers. No framework:
//   node src/react-app/lib/holdings.smoke.mjs
import assert from "node:assert/strict";
import { normalizeHolding, countNodes, distinctJurisdictions, flattenHoldings, groupEntitiesByHolding } from "./holdings.ts";

// Raw snake_case row as the constellations endpoint actually returns it.
const raw = {
  id: "h1",
  user_id: "u1",
  name: "Root",
  jurisdiction_country: "US",
  jurisdiction_subdivision: null,
  base_currency: "USD",
  effective_from: "2026-01-01",
  created_at: "2026-01-01",
  children: [
    {
      id: "h2",
      name: "Child",
      jurisdiction_country: "DE",
      base_currency: "EUR",
      effective_from: "2026-01-01",
      created_at: "2026-01-01",
      children: [],
    },
  ],
};

const root = normalizeHolding(raw);
assert.equal(root.jurisdictionCountry, "US");
assert.equal(root.baseCurrency, "USD");
assert.equal(root.jurisdictionSubdivision, null);
assert.equal(root.children.length, 1);
assert.equal(root.children[0].jurisdictionCountry, "DE");
assert.equal(countNodes(root), 2);
assert.equal(distinctJurisdictions([root, ...root.children]), 2);

// flattenHoldings is depth-first and root-first.
const flat = flattenHoldings(root);
assert.equal(flat.length, 2);
assert.equal(flat[0].id, "h1");
assert.equal(flat[1].id, "h2");

// camelCase input (holdingToApi shape) normalizes identically.
const camel = normalizeHolding({ id: "x", name: "X", jurisdictionCountry: "GB", baseCurrency: "GBP", effectiveFrom: "2026-01-01", createdAt: "2026-01-01" });
assert.equal(camel.jurisdictionCountry, "GB");
assert.equal(camel.children.length, 0);
assert.equal(distinctJurisdictions([camel]), 1);

// groupEntitiesByHolding buckets members under their holding; unassigned dropped.
const grouped = groupEntitiesByHolding([
  { id: "e1", holdingId: "h1" },
  { id: "e2", holdingId: "h1" },
  { id: "e3", holdingId: "h2" },
  { id: "e4", holdingId: null },
]);
assert.equal(grouped.get("h1").length, 2);
assert.equal(grouped.get("h2").length, 1);
assert.equal(grouped.get("e4"), undefined);
assert.equal(grouped.has(undefined), false);
assert.equal([...grouped.values()].flat().length, 3);

console.log("holdings-helpers: PASSED");
