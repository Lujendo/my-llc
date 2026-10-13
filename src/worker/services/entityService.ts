import { Database } from "../db/queries";
import { Entity } from "../types";
import { generateId } from "../utils/id";
import { NotFoundError, ValidationError } from "../utils/errors";

export class EntityService {
  constructor(private db: Database) {}

  async createEntity(
    userId: string,
    name: string,
    formationDate?: string,
    state?: string,
    membersCount?: number
  ): Promise<Entity> {
    if (!name) throw new ValidationError("Entity name is required");

    const id = generateId();
    await this.db.execute(
      "INSERT INTO entities (id, user_id, name, formation_date, state, members_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, userId, name, formationDate || null, state || null, membersCount || null, "active"]
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

    await this.db.execute("DELETE FROM entities WHERE id = ? AND user_id = ?", [id, userId]);
  }
}
