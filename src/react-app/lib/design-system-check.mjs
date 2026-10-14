// Runnable self-check for the Phase 0 design-system foundation.
//   node src/react-app/lib/design-system-check.mjs
// No test framework: plain asserts, non-zero exit on failure.
import assert from "node:assert/strict";
import { cn } from "./utils.ts";
import config from "../../../tailwind.config.ts";

// 1. cn() merges class lists and resolves Tailwind conflicts.
assert.equal(cn("a", "b"), "a b");
assert.equal(cn("p-2", "p-4"), "p-4");
assert.equal(cn("text-red-500", "text-blue-500"), "text-blue-500");

// 2. Every semantic token key exists in tailwind.config.ts theme colors.
const REQUIRED = [
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "destructive", "destructive-foreground",
  "border", "input", "ring",
];

const colors = config?.theme?.extend?.colors;
assert.ok(colors, "tailwind.config.ts is missing theme.extend.colors");

// Flatten {card:{DEFAULT,foreground}} -> {"card","card-foreground"}.
function flatten(obj, prefix = "", out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object") {
      if ("DEFAULT" in value) out.add(prefix + key);
      for (const [sub] of Object.entries(value)) {
        if (sub !== "DEFAULT") out.add(`${prefix}${key}-${sub}`);
      }
    } else {
      out.add(prefix + key);
    }
  }
  return out;
}

const present = flatten(colors);
const missing = REQUIRED.filter((t) => !present.has(t));
assert.deepEqual(missing, [], `missing token keys in tailwind.config.ts: ${missing.join(", ")}`);

// Existing semantic colors must survive the extension.
for (const legacy of ["success", "warning", "danger"]) {
  assert.ok(present.has(legacy), `legacy color "${legacy}" was dropped`);
}

console.log(`PASS  cn(): merges + dedupes (3 assertions)`);
console.log(`PASS  tokens: ${REQUIRED.length} present, 0 missing`);
console.log(`PASS  legacy colors preserved (success/warning/danger)`);
