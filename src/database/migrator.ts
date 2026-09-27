import type { IDatabase, Migration } from './types.ts';
import type { SchemaMigration } from '../types/models.ts';
import { migration001 } from './migrations/001_initial.ts';

export const ALL_MIGRATIONS: Migration[] = [
  migration001
];

/**
 * Split multi-statement SQL text into executable individual statements
 */
export function splitSqlStatements(sql: string): string[] {
  return sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => {
      // Ignore empty statements or pure comment lines
      if (!stmt) return false;
      const stripped = stmt.replace(/--.*$/gm, '').trim();
      return stripped.length > 0;
    });
}

export class Migrator {
  private migrations: Migration[];

  constructor(migrations: Migration[] = ALL_MIGRATIONS) {
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
  }

  /**
   * Ensure schema_migrations table exists
   */
  async ensureMigrationTable(db: IDatabase): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now')),
        description TEXT
      );
    `);
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(db: IDatabase): Promise<SchemaMigration[]> {
    await this.ensureMigrationTable(db);
    const rows = await db.select<{ version: number; applied_at: string; description?: string }>(
      'SELECT version, applied_at, description FROM schema_migrations ORDER BY version ASC'
    );
    return rows.map(r => ({
      version: r.version,
      appliedAt: r.applied_at,
      description: r.description
    }));
  }

  /**
   * Get latest applied version
   */
  async getCurrentVersion(db: IDatabase): Promise<number> {
    const applied = await this.getAppliedMigrations(db);
    if (applied.length === 0) return 0;
    return Math.max(...applied.map(m => m.version));
  }

  /**
   * Run all pending migrations in order
   */
  async runMigrations(db: IDatabase): Promise<{ applied: number; currentVersion: number }> {
    await this.ensureMigrationTable(db);
    
    // Enable foreign keys
    try {
      await db.execute('PRAGMA foreign_keys = ON;');
    } catch {
      // Some mock adapters may not support pragma, ignore in those cases
    }

    const appliedList = await this.getAppliedMigrations(db);
    const appliedVersions = new Set(appliedList.map(m => m.version));
    let appliedCount = 0;

    for (const migration of this.migrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      console.info(`Applying migration ${migration.version}: ${migration.description}`);

      // Split into individual executable statements
      const statements = splitSqlStatements(migration.sql);
      for (const statement of statements) {
        await db.execute(statement);
      }

      // Record migration
      await db.execute(
        'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
        [migration.version, migration.description]
      );

      // Update app_settings schema_version if app_settings exists
      try {
        await db.execute(
          'INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))',
          ['schema_version', String(migration.version)]
        );
      } catch {
        // Ignored if table doesn't exist yet
      }

      appliedCount++;
    }

    const currentVersion = await this.getCurrentVersion(db);
    return { applied: appliedCount, currentVersion };
  }
}
