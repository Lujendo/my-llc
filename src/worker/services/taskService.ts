import { Database } from "../db/queries";
import { Task } from "../types";
import { NotFoundError } from "../utils/errors";

export class TaskService {
  constructor(private db: Database) {}

  async getTasks(entityId: string): Promise<Task[]> {
    return this.db.query<Task>("SELECT * FROM tasks WHERE entity_id = ? ORDER BY due_date ASC", [entityId]);
  }

  async getTask(id: string): Promise<Task | null> {
    return this.db.queryOne<Task>("SELECT * FROM tasks WHERE id = ?", [id]);
  }

  async getUpcomingTasks(entityId: string, days: number = 30): Promise<Task[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    return this.db.query<Task>(
      "SELECT * FROM tasks WHERE entity_id = ? AND due_date IS NOT NULL AND due_date <= ? AND completed = 0 ORDER BY due_date ASC",
      [entityId, futureDateStr]
    );
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) throw new NotFoundError("Task not found");

    const update_strs = [];
    const params: any[] = [];

    if ("completed" in updates) {
      update_strs.push("completed = ?");
      params.push(updates.completed ? 1 : 0);
      if (updates.completed) {
        update_strs.push("completed_at = ?");
        params.push(new Date().toISOString());
      } else {
        update_strs.push("completed_at = NULL");
      }
    }

    if ("title" in updates) {
      update_strs.push("title = ?");
      params.push(updates.title);
    }

    if (update_strs.length === 0) return task;

    params.push(id);
    const sql = `UPDATE tasks SET ${update_strs.join(", ")} WHERE id = ?`;
    await this.db.execute(sql, params);

    const updated = await this.getTask(id);
    if (!updated) throw new Error("Failed to update task");

    return updated;
  }
}
