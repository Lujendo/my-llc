// Runnable smoke test: exercises holdings/calendar logic against node:sqlite.
// Uses esbuild to bundle real service code (no duplication).
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function bundleServices() {
  const tmp = mkdtempSync(join(tmpdir(), "hcsmoke-"));
  const entry = join(tmp, "entry.mjs");
  writeFileSync(
    entry,
    `export * from '${join(repoRoot, "src/worker/services/holdingService.ts")}';\n` +
      `export * from '${join(repoRoot, "src/worker/services/accountService.ts")}';\n` +
      `export * from '${join(repoRoot, "src/worker/services/calendarEventService.ts")}';\n`
  );
  const out = join(tmp, "bundle.mjs");
  const esbuild = join(repoRoot, "node_modules/.bin/esbuild");
  const res = spawnSync(esbuild, [entry, "--bundle", "--format=esm", "--platform=node", "--outfile=" + out], {
    stdio: "inherit",
  });
  if (res.status !== 0) throw new Error("esbuild failed");
  return { out, tmp };
}

import { readFileSync } from "node:fs";

function loadSchema(db) {
  const schema = readFileSync(join(repoRoot, "src/worker/db/schema.sql"), "utf8");
  db.exec(schema);
}

function createD1Shim(db) {
  return {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        bind(...params) {
          return {
            all: async () => ({ success: true, results: stmt.all(...params) }),
            first: async () => stmt.get(...params) ?? null,
            run: async () => {
              const r = stmt.run(...params);
              return { success: true, meta: r };
            },
          };
        },
      };
    },
  };
}

async function main() {
  const { out, tmp } = bundleServices();
  const { HoldingService, AccountService, CalendarEventService } = await import(out);
  const db = new DatabaseSync(":memory:");
  loadSchema(db);
  const shim = createD1Shim(db);
  class Database {
    constructor(db) { this.db = db; }
    async query(sql, params = []) { const r = await this.db.prepare(sql).bind(...params).all(); return r.results || []; }
    async queryOne(sql, params = []) { const res = await this.query(sql, params); return res.length > 0 ? res[0] : null; }
    async execute(sql, params = []) { await this.db.prepare(sql).bind(...params).run(); }
  }
  const d = new Database(shim);
  const hs = new HoldingService(d);

  // Create user + entities
  const now = () => new Date().toISOString();
  const userId = "u1";
  db.prepare("INSERT INTO users (id,email,password_hash,name,created_at) VALUES (?,?,?,?,?)").run(
    userId,
    "test@example.com",
    "hash",
    "Test",
    now()
  );
  const e1 = "e1";
  const e2 = "e2";
  db.prepare(
    "INSERT INTO entities (id,user_id,name,status,created_at) VALUES (?,?,?,?,?)"
  ).run(e1, userId, "Entity 1", "active", now());
  db.prepare(
    "INSERT INTO entities (id,user_id,name,status,created_at) VALUES (?,?,?,?,?)"
  ).run(e2, userId, "Entity 2", "active", now());

  // Create holdings
  const h1 = await hs.createHolding(userId, {
    name: "Root",
    jurisdictionCountry: "US",
    baseCurrency: "USD",
    effectiveFrom: "2026-01-01",
  });
  const h2 = await hs.createHolding(userId, {
    name: "Child",
    jurisdictionCountry: "US",
    baseCurrency: "USD",
    effectiveFrom: "2026-01-01",
  });
  const h3 = await hs.createHolding(userId, {
    name: "Grandchild",
    jurisdictionCountry: "US",
    baseCurrency: "USD",
    effectiveFrom: "2026-01-01",
  });

  // Set parent chain: h2 under h1, h3 under h2
  await hs.setParent(h2.id, h1.id, "2026-01-01", userId);
  await hs.setParent(h3.id, h2.id, "2026-01-01", userId);

  // Add members
  await hs.addMember(h1.id, e1, "2026-01-01", userId);
  await hs.addMember(h3.id, e2, "2026-01-01", userId);

  // Consolidated rollup
  const cons = await hs.getConsolidated(h1.id, userId);
  if (cons.holdings.length !== 3) throw new Error(`expected 3 holdings, got ${cons.holdings.length}`);
  if (cons.entities.length !== 2) throw new Error(`expected 2 entities, got ${cons.entities.length}`);
  // Every consolidated entity carries the holding it is an active member of.
  const consE1 = cons.entities.find((e) => e.id === e1);
  const consE2 = cons.entities.find((e) => e.id === e2);
  if (!consE1 || consE1.holding_id !== h1.id) throw new Error(`e1 holding_id expected ${h1.id}, got ${consE1?.holding_id}`);
  if (!consE2 || consE2.holding_id !== h3.id) throw new Error(`e2 holding_id expected ${h3.id}, got ${consE2?.holding_id}`);

  // getActiveMembers returns only this holding's active members, entity-joined.
  const h1Members = await hs.getActiveMembers(h1.id, userId);
  if (h1Members.length !== 1) throw new Error(`expected 1 member for h1, got ${h1Members.length}`);
  if (h1Members[0].entity.id !== e1) throw new Error(`expected e1 member of h1, got ${h1Members[0].entity.id}`);
  if (h1Members[0].entity.name !== "Entity 1") throw new Error(`missing entity details for member`);
  if (h1Members[0].member.holding_id !== h1.id) throw new Error(`member holding_id mismatch`);
  const h3Members = await hs.getActiveMembers(h3.id, userId);
  if (h3Members.length !== 1 || h3Members[0].entity.id !== e2) throw new Error(`expected e2 member of h3`);
  const h2Members = await hs.getActiveMembers(h2.id, userId);
  if (h2Members.length !== 0) throw new Error(`expected 0 members for h2, got ${h2Members.length}`);

  // Cycle rejection
  let cycleThrown = false;
  try {
    await hs.setParent(h1.id, h3.id, "2026-02-01", userId);
  } catch (e) {
    cycleThrown = true;
  }
  if (!cycleThrown) throw new Error("cycle rejection failed");

  // listConstellations returns roots
  const consts = await hs.listConstellations(userId);
  if (consts.length !== 1) throw new Error(`expected 1 root, got ${consts.length}`);

  // deleteHolding subtree sweep: h2 + its descendant h3 go, ancestor h1 stays.
  await hs.deleteHolding(h2.id, userId);
  const h1After = db.prepare("SELECT count(*) as c FROM holdings WHERE id = ?").get(h1.id).c;
  const h2After = db.prepare("SELECT count(*) as c FROM holdings WHERE id = ?").get(h2.id).c;
  const h3After = db.prepare("SELECT count(*) as c FROM holdings WHERE id = ?").get(h3.id).c;
  const relsAfter = db.prepare("SELECT count(*) as c FROM holding_relationships").get().c;
  const memsAfter = db.prepare("SELECT count(*) as c FROM holding_members").get().c;
  if (h1After !== 1) throw new Error(`expected h1 (ancestor) to survive, got ${h1After}`);
  if (h2After !== 0) throw new Error(`expected h2 (deleted) to be gone, got ${h2After}`);
  if (h3After !== 0) throw new Error(`expected h3 (descendant) to be gone, got ${h3After}`);
  if (relsAfter !== 0) throw new Error(`expected 0 relationships after delete, got ${relsAfter}`);
  if (memsAfter !== 1) throw new Error(`expected 1 member (h1's e1) after delete, got ${memsAfter}`);

  // ---- calendar events: CRUD + date-range list ----------------------------
  const cs = new CalendarEventService(d);

  const ev = await cs.createEvent(userId, {
    title: "Board meeting",
    startTime: "2026-10-14T09:00:00",
    endTime: "2026-10-14T10:00:00",
  });
  if (ev.title !== "Board meeting") throw new Error("createEvent title mismatch");
  if (ev.start_time !== "2026-10-14T09:00:00") throw new Error("createEvent start mismatch");
  if (ev.is_all_day !== 0) throw new Error("createEvent is_all_day should default to 0");
  const gotEv = await cs.getEvent(ev.id, userId);
  if (!gotEv || gotEv.id !== ev.id) throw new Error("getEvent failed");

  // The service's update contract is snake_case (see FINDING-1 for the route gap).
  const updEv = await cs.updateEvent(ev.id, userId, { start_time: "2026-10-20T09:00:00", title: "Board meeting v2" });
  if (updEv.start_time !== "2026-10-20T09:00:00") throw new Error("snake_case update did not persist start_time");
  if (updEv.title !== "Board meeting v2") throw new Error("update did not persist title");

  // Date-range list: an end past the event's day includes it.
  const inRange = await cs.listEvents(userId, "2026-10-10", "2026-10-21");
  if (!inRange.some((e) => e.id === ev.id)) throw new Error("date-range list missed the event");

  await cs.deleteEvent(ev.id, userId);
  if (await cs.getEvent(ev.id, userId)) throw new Error("deleteEvent left the row");

  // Consolidated rollup is temporal: asOf before a membership starts excludes it.
  const hT = await hs.createHolding(userId, {
    name: "Temporal",
    jurisdictionCountry: "US",
    baseCurrency: "USD",
    effectiveFrom: "2026-01-01",
  });
  await hs.addMember(hT.id, e2, "2026-06-01", userId);
  const beforeStart = await hs.getConsolidated(hT.id, userId, "2026-01-01");
  if (beforeStart.entities.length !== 0) throw new Error(`asOf before membership start should be empty, got ${beforeStart.entities.length}`);
  const afterStart = await hs.getConsolidated(hT.id, userId, "2026-07-01");
  if (afterStart.entities.length !== 1) throw new Error(`asOf after membership start should include e2, got ${afterStart.entities.length}`);

  // ---- regression checks for the fixed defects ----------------------------
  // FINDING-1 (fixed): the calendar UI sends camelCase; updateEvent normalizes
  // camelCase→snake_case, so a drag-to-move / modal edit is no longer a no-op.
  {
    const e = await cs.createEvent(userId, { title: "Move me", startTime: "2026-10-14T09:00:00" });
    const after = await cs.updateEvent(e.id, userId, { startTime: "2026-10-20T09:00:00" });
    if (after.start_time !== "2026-10-20T09:00:00") throw new Error("camelCase update was dropped");
  }

  // FINDING-2 (fixed): a date-only range end includes timed events on that day.
  {
    const e = await cs.createEvent(userId, { title: "Timed", startTime: "2026-10-14T09:00:00" });
    const rows = await cs.listEvents(userId, "2026-10-10", "2026-10-14");
    if (!rows.some((r) => r.id === e.id)) throw new Error("same-day timed event excluded by date-only end");
  }

  // FINDING-3 (fixed): a second addMember supersedes the open row (closes it at
  // the new effective_from) instead of leaving two active memberships.
  {
    const h = await hs.createHolding(userId, { name: "Dup", jurisdictionCountry: "US", baseCurrency: "USD", effectiveFrom: "2026-01-01" });
    await hs.addMember(h.id, e1, "2026-01-01", userId);
    await hs.addMember(h.id, e1, "2026-06-01", userId);
    const active = await hs.getActiveMembers(h.id, userId);
    if (active.length !== 1) throw new Error(`expected 1 active membership, got ${active.length}`);
  }

  // FINDING-4 (fixed): a future-effective parent link no longer hides the child
  // from today's roots — root detection respects effective_from <= today.
  {
    const p = await hs.createHolding(userId, { name: "P", jurisdictionCountry: "US", baseCurrency: "USD", effectiveFrom: "2026-01-01" });
    const c = await hs.createHolding(userId, { name: "C", jurisdictionCountry: "US", baseCurrency: "USD", effectiveFrom: "2026-01-01" });
    await hs.setParent(c.id, p.id, "2030-01-01", userId);
    const roots = await hs.listConstellations(userId);
    if (!roots.some((r) => r.id === c.id)) throw new Error("child with a future parent link is missing from roots");
  }

  // Account delete clears all
  const as = new AccountService(d);
  await as.deleteAccount(userId);
  const tables = ["users", "holdings", "holding_relationships", "holding_members", "calendar_events", "tasks", "documents", "entities", "document_acceptances", "notifications"];
  for (const t of tables) {
    const c = db.prepare(`SELECT count(*) as c FROM ${t}`).get().c;
    if (c !== 0) throw new Error(`expected 0 in ${t}, got ${c}`);
  }

  rmSync(tmp, { recursive: true, force: true });
  console.log("holdings-calendar-smoke: PASSED");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
