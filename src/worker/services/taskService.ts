import { Database } from "../db/queries";
import { Task } from "../types";
import { NotFoundError } from "../utils/errors";
import { generateId } from "../utils/id";

type TaskSection = Task["section"];

// ponytail: annual deadlines modeled as a fixed month/day, rolled forward to the
// next occurrence from today. CEILING: ignores weekends/holidays and IRS
// extensions (Form 7004 → Oct 15); upgrade path is a real tax-calendar table if
// accuracy matters.
function nextOccurrence(month: number, day: number, from = new Date()): string {
  const today = from.toISOString().split("T")[0];
  const year = from.getUTCFullYear();
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const candidate = `${year}-${mm}-${dd}`;
  return candidate >= today ? candidate : `${year + 1}-${mm}-${dd}`;
}

// Starter compliance checklist for a foreign-owned single-member US LLC.
// Seeded once per entity on creation (H1). `due` is an annual month/day; the
// concrete date is computed per entity at seed time.
const DEFAULT_COMPLIANCE_TASKS: {
  title: string;
  section: TaskSection;
  instructions: string;
  due?: { month: number; day: number };
}[] = [
  {
    section: "Formation",
    title: "Sign the LLC Operating Agreement",
    instructions: "All members must sign the Operating Agreement. Keep a signed copy with the company records.",
  },
  {
    section: "Federal",
    title: "Obtain an EIN from the IRS (Form SS-4)",
    instructions: "Apply for an Employer Identification Number. A foreign owner without an SSN/ITIN can apply by fax or mail using Form SS-4.",
  },
  {
    section: "ITIN",
    title: "File Form W-7 to obtain an ITIN",
    instructions: "Foreign owners without an SSN need an ITIN for US filings. Submit Form W-7 with identity documents or a certifying acceptance agent.",
  },
  {
    section: "Federal",
    title: "File Form 5472 with a pro forma Form 1120",
    instructions: "A foreign-owned single-member LLC treated as a disregarded entity files Form 5472 attached to a pro forma Form 1120. Due by April 15 (extension to October 15 with Form 7004).",
    due: { month: 4, day: 15 },
  },
  {
    section: "Federal",
    title: "File FBAR (FinCEN 114) if foreign accounts exceed $10,000",
    instructions: "If the owner holds foreign financial accounts exceeding $10,000 in aggregate at any point in the year, file FinCEN Form 114. Due April 15 with automatic extension to October 15.",
    due: { month: 4, day: 15 },
  },
  {
    section: "Germany",
    title: "File the German income tax return (Einkommensteuererklärung)",
    instructions: "A German-resident owner reports worldwide income in Germany. The return is generally due by July 31 of the following year (later when filed by a tax advisor).",
    due: { month: 7, day: 31 },
  },
  {
    section: "Ongoing",
    title: "File the annual state report",
    instructions: "Most states require an annual or biennial report and a fee. Confirm the deadline for your formation state.",
  },
  {
    section: "Ongoing",
    title: "Renew the registered agent service",
    instructions: "Keep the registered agent active and paid. A lapsed agent can put the LLC in bad standing with the state.",
  },
];

export class TaskService {
  constructor(private db: Database) {}

  async getTasks(entityId: string): Promise<Task[]> {
    return this.db.query<Task>("SELECT * FROM tasks WHERE entity_id = ? ORDER BY due_date ASC", [entityId]);
  }

  async getTask(id: string): Promise<Task | null> {
    return this.db.queryOne<Task>("SELECT * FROM tasks WHERE id = ?", [id]);
  }

  async createTask(
    entityId: string,
    data: { title: string; section: TaskSection; dueDate?: string | null; instructions?: string | null }
  ): Promise<Task> {
    const id = generateId();
    await this.db.execute(
      "INSERT INTO tasks (id, entity_id, title, section, due_date, instructions) VALUES (?, ?, ?, ?, ?, ?)",
      [id, entityId, data.title, data.section, data.dueDate ?? null, data.instructions ?? null]
    );

    const task = await this.getTask(id);
    if (!task) throw new Error("Failed to create task");
    return task;
  }

  // ponytail: one insert per task (~7 rows) — fine at this scale; batch if seed
  // sets grow or entity creation gets hot.
  async seedDefaultTasks(entityId: string): Promise<Task[]> {
    const created: Task[] = [];
    for (const t of DEFAULT_COMPLIANCE_TASKS) {
      const dueDate = t.due ? nextOccurrence(t.due.month, t.due.day) : null;
      created.push(
        await this.createTask(entityId, {
          title: t.title,
          section: t.section,
          instructions: t.instructions,
          dueDate,
        })
      );
    }
    return created;
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
