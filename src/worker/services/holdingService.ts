import { Database } from "../db/queries";
import { Entity, Holding, HoldingMember, HoldingRelationship } from "../types";
import { generateId } from "../utils/id";
import { NotFoundError, ValidationError } from "../utils/errors";
import { toSnakeKeys } from "../utils/validate";

// Holdings (constellations) + membership. Every read/write is scoped to the
// authenticated user_id — a holding id from another tenant must 404, never leak.
//
// Parent links are HISTORY rows in holding_relationships: the current parent is
// the row with effective_to IS NULL. A constellation root is a holding with no
// active relationship as a child.

const now = () => new Date().toISOString();

// Active-as-of predicate for a relationship/membership row, qualified with the
// row's table alias (both holdings and the history tables carry these columns).
// ponytail: half-open interval [effective_from, effective_to); a row with
// effective_to IS NULL is open-ended. One predicate, reused by every query.
const activeAsOf = (t: string) =>
  `${t}.effective_from <= ? AND (${t}.effective_to IS NULL OR ${t}.effective_to > ?)`;

export class HoldingService {
  constructor(private db: Database) {}

  // ---- holdings CRUD -------------------------------------------------------

  async createHolding(
    userId: string,
    data: {
      name: string;
      jurisdictionCountry: string;
      jurisdictionSubdivision?: string | null;
      baseCurrency: string;
      currencyAsOf?: string | null;
      effectiveFrom: string;
    }
  ): Promise<Holding> {
    if (!data.name) throw new ValidationError("Holding name is required");
    if (!data.jurisdictionCountry) throw new ValidationError("jurisdictionCountry is required");
    if (!data.baseCurrency) throw new ValidationError("baseCurrency is required");
    if (!data.effectiveFrom) throw new ValidationError("effectiveFrom is required");

    const id = generateId();
    await this.db.execute(
      `INSERT INTO holdings
        (id, user_id, name, jurisdiction_country, jurisdiction_subdivision,
         base_currency, currency_as_of, effective_from, effective_to, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        id,
        userId,
        data.name,
        data.jurisdictionCountry,
        data.jurisdictionSubdivision ?? null,
        data.baseCurrency,
        data.currencyAsOf ?? null,
        data.effectiveFrom,
        now(),
      ]
    );

    const holding = await this.getHolding(id, userId);
    if (!holding) throw new Error("Failed to create holding");
    return holding;
  }

  async getHolding(id: string, userId: string): Promise<Holding | null> {
    return this.db.queryOne<Holding>("SELECT * FROM holdings WHERE id = ? AND user_id = ?", [id, userId]);
  }

  async listHoldings(userId: string): Promise<Holding[]> {
    return this.db.query<Holding>("SELECT * FROM holdings WHERE user_id = ? ORDER BY created_at ASC", [userId]);
  }

  async updateHolding(id: string, userId: string, updates: Partial<Holding>): Promise<Holding> {
    const holding = await this.getHolding(id, userId);
    if (!holding) throw new NotFoundError("Holding not found");

    // Accept camelCase from the client (the route forwards the body); columns are
    // snake_case. Idempotent for callers already sending snake_case.
    updates = toSnakeKeys(updates) as Partial<Holding>;

    const sets: string[] = [];
    const params: any[] = [];
    const fields: [keyof Holding, string][] = [
      ["name", "name"],
      ["jurisdiction_country", "jurisdiction_country"],
      ["jurisdiction_subdivision", "jurisdiction_subdivision"],
      ["base_currency", "base_currency"],
      ["currency_as_of", "currency_as_of"],
      ["effective_from", "effective_from"],
      ["effective_to", "effective_to"],
    ];
    for (const [key, col] of fields) {
      if (key in updates) {
        sets.push(`${col} = ?`);
        params.push((updates as any)[key] ?? null);
      }
    }
    if (sets.length === 0) return holding;

    params.push(id, userId);
    await this.db.execute(`UPDATE holdings SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);

    const updated = await this.getHolding(id, userId);
    if (!updated) throw new Error("Failed to update holding");
    return updated;
  }

  // Delete the subtree rooted at this holding: the holding itself plus all its
  // descendants via active parent links, leaving ancestors and siblings intact.
  // Deleting a root therefore removes the whole constellation. Scoped to userId.
  // ponytail: explicit deletes rather than relying on ON DELETE CASCADE, so the
  // sweep holds even if PRAGMA foreign_keys is off on some connection.
  async deleteHolding(id: string, userId: string): Promise<void> {
    const holding = await this.getHolding(id, userId);
    if (!holding) throw new NotFoundError("Holding not found");

    const subtree = await this.db.query<{ id: string }>(
      `WITH RECURSIVE sub(id) AS (
         SELECT ?
         UNION
         SELECT hr.child_holding_id
         FROM holding_relationships hr
         JOIN sub s ON hr.parent_holding_id = s.id
         WHERE hr.effective_to IS NULL
       )
       SELECT s.id FROM sub s JOIN holdings h ON h.id = s.id WHERE h.user_id = ?`,
      [id, userId]
    );
    const ids = subtree.map((r) => r.id);
    if (ids.length === 0) return;
    const ph = ids.map(() => "?").join(",");

    await this.db.execute(
      `DELETE FROM holding_relationships WHERE child_holding_id IN (${ph}) OR parent_holding_id IN (${ph})`,
      [...ids, ...ids]
    );
    await this.db.execute(`DELETE FROM holding_members WHERE holding_id IN (${ph})`, ids);
    await this.db.execute(`DELETE FROM holdings WHERE id IN (${ph}) AND user_id = ?`, [...ids, userId]);
  }

  // ---- constellations ------------------------------------------------------

  // Roots = holdings with no parent link active as of today, each with its
  // nested descendants built from the active parent links.
  async listConstellations(userId: string): Promise<(Holding & { children: any[] })[]> {
    const holdings = await this.listHoldings(userId);
    const at = now();
    const rels = await this.db.query<HoldingRelationship>(
      `SELECT hr.* FROM holding_relationships hr
       JOIN holdings h ON h.id = hr.child_holding_id
       WHERE h.user_id = ? AND ${activeAsOf("hr")}`,
      [userId, at, at]
    );

    const childrenOf = new Map<string, string[]>();
    const hasParent = new Set<string>();
    for (const r of rels) {
      hasParent.add(r.child_holding_id);
      const list = childrenOf.get(r.parent_holding_id) ?? [];
      list.push(r.child_holding_id);
      childrenOf.set(r.parent_holding_id, list);
    }

    const byId = new Map(holdings.map((h) => [h.id, h]));
    const build = (id: string, seen: Set<string>): any => {
      const h = byId.get(id)!;
      // ponytail: `seen` guards against a pre-existing cycle in bad data; the
      // setParent cycle check prevents new ones.
      const kids = (childrenOf.get(id) ?? []).filter((c) => !seen.has(c));
      const nextSeen = new Set(seen).add(id);
      return { ...h, children: kids.map((c) => build(c, nextSeen)) };
    };

    return holdings.filter((h) => !hasParent.has(h.id)).map((h) => build(h.id, new Set()));
  }

  // Set (or replace) the parent of `childId`. Rejects cycles (A⊂B⊂A) via an
  // ancestor walk from the proposed parent. Closes the prior active link.
  async setParent(childId: string, parentId: string, effectiveFrom: string, userId: string): Promise<HoldingRelationship> {
    if (childId === parentId) throw new ValidationError("A holding cannot be its own parent");
    if (!effectiveFrom) throw new ValidationError("effectiveFrom is required");

    const child = await this.getHolding(childId, userId);
    if (!child) throw new NotFoundError("Child holding not found");
    const parent = await this.getHolding(parentId, userId);
    if (!parent) throw new NotFoundError("Parent holding not found");

    // Ancestor walk: if `childId` is reachable from `parentId` going up, linking
    // child under parent would close a cycle.
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === childId) throw new ValidationError("Cycle detected: parent is a descendant of child");
      if (seen.has(cursor)) break; // pre-existing cycle in data; stop walking
      seen.add(cursor);
      const rel: HoldingRelationship | null = await this.db.queryOne<HoldingRelationship>(
        "SELECT * FROM holding_relationships WHERE child_holding_id = ? AND effective_to IS NULL",
        [cursor]
      );
      cursor = rel?.parent_holding_id ?? null;
    }

    // Close the current active link (if any), then insert the new one.
    await this.db.execute(
      "UPDATE holding_relationships SET effective_to = ? WHERE child_holding_id = ? AND effective_to IS NULL",
      [effectiveFrom, childId]
    );
    const id = generateId();
    await this.db.execute(
      `INSERT INTO holding_relationships
        (id, child_holding_id, parent_holding_id, effective_from, effective_to, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [id, childId, parentId, effectiveFrom, now()]
    );

    const rel: HoldingRelationship | null = await this.db.queryOne<HoldingRelationship>("SELECT * FROM holding_relationships WHERE id = ?", [id]);
    if (!rel) throw new Error("Failed to set parent");
    return rel;
  }

  // ---- members -------------------------------------------------------------

  // The entity must belong to the SAME user (IDOR guard).
  async addMember(holdingId: string, entityId: string, effectiveFrom: string, userId: string): Promise<HoldingMember> {
    const holding = await this.getHolding(holdingId, userId);
    if (!holding) throw new NotFoundError("Holding not found");
    const entity = await this.db.queryOne<Entity>("SELECT * FROM entities WHERE id = ? AND user_id = ?", [
      entityId,
      userId,
    ]);
    if (!entity) throw new NotFoundError("Entity not found");
    if (!effectiveFrom) throw new ValidationError("effectiveFrom is required");

    // Supersede any open membership for this (holding, entity): close it at the
    // new start so exactly one active row remains — mirrors setParent's prior-link
    // close and keeps the half-open history. ponytail: unconditional close; a
    // backdated add over an open membership is not a supported flow.
    await this.db.execute(
      "UPDATE holding_members SET effective_to = ? WHERE holding_id = ? AND entity_id = ? AND effective_to IS NULL",
      [effectiveFrom, holdingId, entityId]
    );

    const id = generateId();
    await this.db.execute(
      `INSERT INTO holding_members (id, holding_id, entity_id, effective_from, effective_to, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [id, holdingId, entityId, effectiveFrom, now()]
    );

    const member = await this.db.queryOne<HoldingMember>("SELECT * FROM holding_members WHERE id = ?", [id]);
    if (!member) throw new Error("Failed to add member");
    return member;
  }

  // Active members of a holding, each joined to its entity so the client gets
  // full entity details in one call. Scoped to the holding's owner (IDOR guard).
  async getActiveMembers(holdingId: string, userId: string): Promise<{ member: HoldingMember; entity: Entity }[]> {
    const holding = await this.getHolding(holdingId, userId);
    if (!holding) throw new NotFoundError("Holding not found");

    const rows = await this.db.query<
      Entity & {
        member_id: string;
        member_effective_from: string;
        member_effective_to: string | null;
        member_created_at: string;
      }
    >(
      `SELECT hm.id AS member_id, hm.effective_from AS member_effective_from,
              hm.effective_to AS member_effective_to, hm.created_at AS member_created_at,
              e.*
       FROM holding_members hm
       JOIN entities e ON e.id = hm.entity_id
       WHERE hm.holding_id = ? AND hm.effective_to IS NULL AND e.user_id = ?
       ORDER BY e.created_at ASC`,
      [holdingId, userId]
    );

    return rows.map((r) => ({
      member: {
        id: r.member_id,
        holding_id: holdingId,
        entity_id: r.id,
        effective_from: r.member_effective_from,
        effective_to: r.member_effective_to,
        created_at: r.member_created_at,
      },
      entity: r,
    }));
  }

  // Close the active membership (history-preserving) rather than hard-delete.
  async removeMember(holdingId: string, entityId: string, userId: string): Promise<void> {
    const holding = await this.getHolding(holdingId, userId);
    if (!holding) throw new NotFoundError("Holding not found");

    await this.db.execute(
      "UPDATE holding_members SET effective_to = ? WHERE holding_id = ? AND entity_id = ? AND effective_to IS NULL",
      [now(), holdingId, entityId]
    );
  }

  // ---- consolidated rollup -------------------------------------------------

  // Recursive rollup over active parent links as of `asOf` (default now),
  // aggregating the entities that are members of any holding in the tree.
  async getConsolidated(rootHoldingId: string, userId: string, asOf?: string) {
    const root = await this.getHolding(rootHoldingId, userId);
    if (!root) throw new NotFoundError("Holding not found");

    const at = asOf || now();

    const treeCte = `WITH RECURSIVE tree(id) AS (
      SELECT ?
      UNION
      SELECT hr.child_holding_id
      FROM holding_relationships hr
      JOIN tree t ON hr.parent_holding_id = t.id
      WHERE ${activeAsOf("hr")}
    )`;

    const holdings = await this.db.query<Holding>(
      `${treeCte} SELECT h.* FROM holdings h JOIN tree t ON h.id = t.id ORDER BY h.created_at ASC`,
      [rootHoldingId, at, at]
    );

    // Each entity also carries the tree holding it is an active member of, so
    // the client can group entities by holding without extra calls. The
    // correlated subquery keeps exactly one row per entity even if it is a
    // member of several holdings in the tree.
    const entities = await this.db.query<Entity & { holding_id: string | null }>(
      `${treeCte}
       SELECT DISTINCT e.*,
         (SELECT hm2.holding_id FROM holding_members hm2
          JOIN tree t2 ON hm2.holding_id = t2.id
          WHERE hm2.entity_id = e.id AND ${activeAsOf("hm2")}
          ORDER BY hm2.effective_from ASC LIMIT 1) AS holding_id
       FROM entities e
       JOIN holding_members hm ON hm.entity_id = e.id
       JOIN tree t ON hm.holding_id = t.id
       WHERE ${activeAsOf("hm")}
       ORDER BY e.created_at ASC`,
      [rootHoldingId, at, at, at, at, at, at]
    );

    const membersCount = entities.reduce((sum, e) => sum + (e.members_count ?? 0), 0);
    const activeEntities = entities.filter((e) => e.status === "active").length;

    return {
      rootHoldingId,
      asOf: at,
      holdings,
      entities,
      totals: {
        holdings: holdings.length,
        entities: entities.length,
        membersCount,
        activeEntities,
      },
    };
  }
}
