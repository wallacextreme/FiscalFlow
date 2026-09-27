import type { IDatabase, QueryResult } from './types.ts';
import { Migrator } from './migrator.ts';

let activeDb: IDatabase | null = null;

/**
 * Adapter wrapping Tauri SQL plugin into IDatabase interface
 */
export class TauriSqlAdapter implements IDatabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: any) {
    this.client = client;
  }

  async execute(query: string, bindValues?: unknown[]): Promise<QueryResult> {
    const res = await this.client.execute(query, bindValues ?? []);
    return {
      rowsAffected: res.rowsAffected ?? 0,
      lastInsertId: res.lastInsertId ?? 0
    };
  }

  async select<T = unknown>(query: string, bindValues?: unknown[]): Promise<T[]> {
    return this.client.select(query, bindValues ?? []);
  }

  async close(): Promise<boolean> {
    if (this.client && typeof this.client.close === 'function') {
      return this.client.close();
    }
    return true;
  }
}

/**
 * Get the currently active database instance
 */
export function getDb(): IDatabase {
  if (!activeDb) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return activeDb;
}

/**
 * Manually set active database (useful for testing)
 */
export function setDatabase(db: IDatabase | null): void {
  activeDb = db;
}

/**
 * Initialize database and execute any pending migrations
 */
export async function initDatabase(customDb?: IDatabase): Promise<IDatabase> {
  if (customDb) {
    activeDb = customDb;
    const migrator = new Migrator();
    await migrator.runMigrations(activeDb);
    return activeDb;
  }

  // 1. Desktop mode (Tauri 2)
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const DatabasePlugin = await import('@tauri-apps/plugin-sql');
      const Database = DatabasePlugin.default || DatabasePlugin;
      const client = await Database.load('sqlite:fiscalflow.db');
      activeDb = new TauriSqlAdapter(client);

      const migrator = new Migrator();
      const result = await migrator.runMigrations(activeDb);
      console.info(`Tauri SQLite database initialized successfully. Version: ${result.currentVersion}`);
      return activeDb;
    } catch (error) {
      console.error('Failed to initialize Tauri SQL database:', error);
      throw error;
    }
  }

  // 2. Web / Browser mode (GitHub Pages, PWA) via WebAssembly SQLite (sql.js)
  try {
    const { initBrowserSqlite } = await import('./browser-sqlite.ts');
    activeDb = await initBrowserSqlite();

    const migrator = new Migrator();
    const result = await migrator.runMigrations(activeDb);
    console.info(`Browser WebAssembly SQLite initialized successfully. Version: ${result.currentVersion}`);
    return activeDb;
  } catch (error) {
    console.error('Failed to initialize Browser WebAssembly SQLite database:', error);
    throw error;
  }
}
