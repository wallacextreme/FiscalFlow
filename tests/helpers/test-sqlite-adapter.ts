import { createRequire } from 'node:module';
import type { IDatabase, QueryResult } from '../../src/database/types.ts';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: any };

export class NodeSqliteAdapter implements IDatabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any;

  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async execute(query: string, bindValues?: unknown[]): Promise<QueryResult> {
    if (!bindValues || bindValues.length === 0) {
      this.db.exec(query);
      return { rowsAffected: 1, lastInsertId: 0 };
    }
    const stmt = this.db.prepare(query);
    const normalized = bindValues.map(v => (v === undefined ? null : v));
    const info = stmt.run(...normalized);
    return {
      rowsAffected: Number(info.changes),
      lastInsertId: Number(info.lastInsertRowid)
    };
  }

  async select<T = unknown>(query: string, bindValues?: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(query);
    if (!bindValues || bindValues.length === 0) {
      return stmt.all() as T[];
    }
    const normalized = bindValues.map(v => (v === undefined ? null : v));
    return stmt.all(...normalized) as T[];
  }

  async close(): Promise<boolean> {
    this.db.close();
    return true;
  }
}
