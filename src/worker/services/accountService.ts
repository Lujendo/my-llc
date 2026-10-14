import { Database } from "../db/queries";

export class AccountService {
  constructor(private db: Database) {}

  // Delete all rows for the user across all tables. Order respects FKs.
  async deleteAccount(userId: string): Promise<void> {
    // Relationships and members referencing user's holdings/entities
    await this.db.execute(
      `DELETE FROM holding_relationships
       WHERE child_holding_id IN (SELECT id FROM holdings WHERE user_id = ?)
          OR parent_holding_id IN (SELECT id FROM holdings WHERE user_id = ?)`,
      [userId, userId]
    );
    await this.db.execute(
      `DELETE FROM holding_members
       WHERE holding_id IN (SELECT id FROM holdings WHERE user_id = ?)
          OR entity_id IN (SELECT id FROM entities WHERE user_id = ?)`,
      [userId, userId]
    );

    // Children of entities
    await this.db.execute("DELETE FROM tasks WHERE entity_id IN (SELECT id FROM entities WHERE user_id = ?)", [userId]);
    await this.db.execute("DELETE FROM documents WHERE entity_id IN (SELECT id FROM entities WHERE user_id = ?)", [userId]);

    // User-scoped
    await this.db.execute("DELETE FROM calendar_events WHERE user_id = ?", [userId]);
    await this.db.execute("DELETE FROM holdings WHERE user_id = ?", [userId]);
    await this.db.execute("DELETE FROM entities WHERE user_id = ?", [userId]);
    await this.db.execute("DELETE FROM document_acceptances WHERE user_id = ?", [userId]);
    await this.db.execute("DELETE FROM notifications WHERE user_id = ?", [userId]);
    await this.db.execute("DELETE FROM users WHERE id = ?", [userId]);
  }

  // Export all user data as a JSON-serializable object.
  async exportAccount(userId: string): Promise<any> {
    const [
      user,
      holdings,
      holdingRelationships,
      holdingMembers,
      calendarEvents,
      tasks,
      documents,
      entities,
      documentAcceptances,
      notifications,
    ] = await Promise.all([
      this.db.queryOne("SELECT * FROM users WHERE id = ?", [userId]),
      this.db.query("SELECT * FROM holdings WHERE user_id = ?", [userId]),
      this.db.query(
        `SELECT hr.* FROM holding_relationships hr
         JOIN holdings h ON h.id = hr.child_holding_id OR h.id = hr.parent_holding_id
         WHERE h.user_id = ?`,
        [userId]
      ),
      this.db.query(
        `SELECT hm.* FROM holding_members hm
         JOIN holdings h ON h.id = hm.holding_id
         WHERE h.user_id = ?`,
        [userId]
      ),
      this.db.query("SELECT * FROM calendar_events WHERE user_id = ?", [userId]),
      this.db.query("SELECT t.* FROM tasks t JOIN entities e ON e.id = t.entity_id WHERE e.user_id = ?", [userId]),
      this.db.query("SELECT d.* FROM documents d JOIN entities e ON e.id = d.entity_id WHERE e.user_id = ?", [userId]),
      this.db.query("SELECT * FROM entities WHERE user_id = ?", [userId]),
      this.db.query("SELECT * FROM document_acceptances WHERE user_id = ?", [userId]),
      this.db.query("SELECT * FROM notifications WHERE user_id = ?", [userId]),
    ]);

    // ponytail: never export credential material — strip password_hash from the
    // user row. Everything else here is already scoped to this user_id.
    const safeUser = user ? { ...(user as Record<string, unknown>) } : null;
    if (safeUser) delete safeUser.password_hash;

    return {
      user: safeUser,
      holdings,
      holdingRelationships,
      holdingMembers,
      calendarEvents,
      tasks,
      documents,
      entities,
      documentAcceptances,
      notifications,
    };
  }
}
