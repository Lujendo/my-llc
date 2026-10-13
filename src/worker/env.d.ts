interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all(): Promise<D1Result<any>>;
  first(): Promise<any>;
  run(): Promise<D1Result<any>>;
}

interface D1Result<T> {
  success: boolean;
  results: T[];
  error?: string;
}
