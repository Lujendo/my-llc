// ponytail: simple D1 helper, no ORM overhead
export class Database {
  constructor(private db: any) {}

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.db.prepare(sql).bind(...params).all();
      return (result.results as T[]) || [];
    } catch (error) {
      console.error("Database query error:", sql, params, error);
      throw error;
    }
  }

  async queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    try {
      await this.db.prepare(sql).bind(...params).run();
    } catch (error) {
      console.error("Database execute error:", sql, params, error);
      throw error;
    }
  }
}

export type DatabaseResult<T> = T[];
