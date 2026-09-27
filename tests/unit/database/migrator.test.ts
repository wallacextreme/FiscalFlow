import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Migrator, splitSqlStatements } from '../../../src/database/migrator.ts';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';

describe('Database Migrator', () => {
  let db: NodeSqliteAdapter;

  beforeEach(() => {
    db = new NodeSqliteAdapter();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should split SQL statements correctly', () => {
    const sql = `
      -- comment line
      CREATE TABLE a (id INT);
      INSERT INTO a VALUES (1);
    `;
    const stmts = splitSqlStatements(sql);
    expect(stmts).toHaveLength(2);
    expect(stmts[0]).toContain('CREATE TABLE a');
    expect(stmts[1]).toContain('INSERT INTO a');
  });

  it('should run migration 001 and create schema_migrations', async () => {
    const migrator = new Migrator();
    const result = await migrator.runMigrations(db);

    expect(result.applied).toBe(1);
    expect(result.currentVersion).toBe(1);

    const version = await migrator.getCurrentVersion(db);
    expect(version).toBe(1);

    const applied = await migrator.getAppliedMigrations(db);
    expect(applied).toHaveLength(1);
    expect(applied[0].version).toBe(1);
    expect(applied[0].description).toBe('Schema inicial do FiscalFlow');
  });

  it('should be idempotent when running migrations multiple times', async () => {
    const migrator = new Migrator();
    const firstRun = await migrator.runMigrations(db);
    expect(firstRun.applied).toBe(1);

    const secondRun = await migrator.runMigrations(db);
    expect(secondRun.applied).toBe(0);
    expect(secondRun.currentVersion).toBe(1);
  });

  it('should have seeded initial app_settings', async () => {
    const migrator = new Migrator();
    await migrator.runMigrations(db);

    const settings = await db.select<{ key: string; value: string }>(
      'SELECT key, value FROM app_settings ORDER BY key ASC'
    );
    expect(settings.length).toBeGreaterThanOrEqual(4);

    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
    expect(map['theme']).toBe('dark');
    expect(map['schema_version']).toBe('1');
    expect(map['page_size']).toBe('50');
  });
});
