import { Database } from "../db/queries";
import { Entity } from "../types";
import { generateId } from "../utils/id";
import { NotFoundError, ValidationError } from "../utils/errors";

export class EntityService {
  constructor(private db: Database) {}

  async createEntity(
    userId: string,
    data: {
      name: string;
      formationDate?: string | null;
      state?: string | null;
      membersCount?: number | null;
      ownerName?: string | null;
      ownerCitizenship?: string | null;
      ownerResidency?: string | null;
      ownerType?: "foreign" | "domestic" | null;
      taxClassification?: string | null;
    }
  ): Promise<Entity> {
    if (!data.name) throw new ValidationError("Entity name is required");

    const id = generateId();
    await this.db.execute(
      `INSERT INTO entities
        (id, user_id, name, formation_date, state, members_count, status,
         owner_name, owner_citizenship, owner_residency, owner_type, tax_classification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.name,
        data.formationDate || null,
        data.state || null,
        data.membersCount ?? null,
        "active",
        data.ownerName || null,
        data.ownerCitizenship || null,
        data.ownerResidency || null,
        data.ownerType || null,
        data.taxClassification || null,
      ]
    );

    const entity = await this.db.queryOne<Entity>("SELECT * FROM entities WHERE id = ?", [id]);
    if (!entity) throw new Error("Failed to create entity");

    return entity;
  }

  async getEntity(id: string, userId?: string): Promise<Entity | null> {
    let entity: Entity | null;
    if (userId) {
      entity = await this.db.queryOne<Entity>("SELECT * FROM entities WHERE id = ? AND user_id = ?", [id, userId]);
    } else {
      entity = await this.db.queryOne<Entity>("SELECT * FROM entities WHERE id = ?", [id]);
    }
    return entity;
  }

  async listEntities(userId: string): Promise<Entity[]> {
    return this.db.query<Entity>("SELECT * FROM entities WHERE user_id = ? ORDER BY created_at DESC", [userId]);
  }

  async updateEntity(id: string, userId: string, updates: Partial<Entity>): Promise<Entity> {
    const entity = await this.getEntity(id, userId);
    if (!entity) throw new NotFoundError("Entity not found");

    const updates_arr = [];
    const params: any[] = [];

    if ("name" in updates) {
      updates_arr.push("name = ?");
      params.push(updates.name);
    }
    if ("status" in updates) {
      updates_arr.push("status = ?");
      params.push(updates.status);
    }
    if ("formation_date" in updates) {
      updates_arr.push("formation_date = ?");
      params.push(updates.formation_date);
    }
    if ("state" in updates) {
      updates_arr.push("state = ?");
      params.push(updates.state);
    }
    if ("owner_name" in updates) {
      updates_arr.push("owner_name = ?");
      params.push(updates.owner_name);
    }
    if ("owner_citizenship" in updates) {
      updates_arr.push("owner_citizenship = ?");
      params.push(updates.owner_citizenship);
    }
    if ("owner_residency" in updates) {
      updates_arr.push("owner_residency = ?");
      params.push(updates.owner_residency);
    }
    if ("owner_type" in updates) {
      updates_arr.push("owner_type = ?");
      params.push(updates.owner_type);
    }
    if ("tax_classification" in updates) {
      updates_arr.push("tax_classification = ?");
      params.push(updates.tax_classification);
    }

    if (updates_arr.length === 0) return entity;

    params.push(id);
    params.push(userId);
    const sql = `UPDATE entities SET ${updates_arr.join(", ")} WHERE id = ? AND user_id = ?`;
    await this.db.execute(sql, params);

    const updated = await this.getEntity(id, userId);
    if (!updated) throw new Error("Failed to update entity");

    return updated;
  }

  async deleteEntity(id: string, userId: string): Promise<void> {
    const entity = await this.getEntity(id, userId);
    if (!entity) throw new NotFoundError("Entity not found");

    // BUG-01: tasks/documents FK to entities with no ON DELETE CASCADE, so the
    // parent delete fails while children exist. Delete children first.
    // ponytail: two extra statements; a schema-level ON DELETE CASCADE would be
    // cleaner but SQLite cannot add it without a full table rebuild.
    await this.db.execute("DELETE FROM tasks WHERE entity_id = ?", [id]);
    await this.db.execute("DELETE FROM documents WHERE entity_id = ?", [id]);
    await this.db.execute("DELETE FROM entities WHERE id = ? AND user_id = ?", [id, userId]);
  }
}
