import initSqlJs, { type Database } from 'sql.js';
import type { IDatabase, QueryResult } from './types.ts';

const STORAGE_KEY = 'fiscalflow_wasm_db';

/**
 * Browser SQLite Adapter backed by sql.js (WebAssembly SQLite)
 * and persisted to localStorage.
 */
export class BrowserSqliteAdapter implements IDatabase {
  private db: Database;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(db: Database) {
    this.db = db;
    try {
      this.db.exec('PRAGMA foreign_keys = ON;');
    } catch {
      // Ignore
    }
  }

  async execute(query: string, bindValues?: unknown[]): Promise<QueryResult> {
    const normalized = bindValues ? bindValues.map(v => (v === undefined ? null : v)) : [];
    
    if (normalized.length > 0) {
      this.db.run(query, normalized as (string | number | null | Uint8Array)[]);
    } else {
      this.db.exec(query);
    }

    const rowsAffected = this.db.getRowsModified();
    let lastInsertId = 0;
    try {
      const idRes = this.db.exec('SELECT last_insert_rowid() AS id;');
      if (idRes && idRes[0] && idRes[0].values && idRes[0].values[0]) {
        lastInsertId = Number(idRes[0].values[0][0]) || 0;
      }
    } catch {
      // Ignore
    }

    this.persistDebounced();

    return {
      rowsAffected,
      lastInsertId
    };
  }

  async select<T = unknown>(query: string, bindValues?: unknown[]): Promise<T[]> {
    const normalized = bindValues ? bindValues.map(v => (v === undefined ? null : v)) : [];
    const stmt = this.db.prepare(query);
    if (normalized.length > 0) {
      stmt.bind(normalized as (string | number | null | Uint8Array)[]);
    }

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  async close(): Promise<boolean> {
    this.persistImmediately();
    this.db.close();
    return true;
  }

  /**
   * Persist current SQLite binary to localStorage
   */
  private persistImmediately(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const binary = this.db.export();
        // Convert to base64 for reliable localStorage storage
        let binaryString = '';
        const len = binary.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = binary.subarray(i, Math.min(i + chunkSize, len));
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binaryString);
        window.localStorage.setItem(STORAGE_KEY, base64);
      }
    } catch (err) {
      console.warn('FiscalFlow: Could not save database to localStorage:', err);
    }
  }

  private persistDebounced(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistImmediately();
      this.saveTimeout = null;
    }, 250);
  }
}

/**
 * Initialize WebAssembly SQLite for browser environments (e.g. GitHub Pages)
 */
export async function initBrowserSqlite(): Promise<IDatabase> {
  const SQL = await initSqlJs({
    locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm'
  });

  let initialData: Uint8Array | undefined;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const binaryString = atob(saved);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        initialData = bytes;
      }
    }
  } catch (err) {
    console.warn('FiscalFlow: Error reading saved database from localStorage, initializing fresh:', err);
  }

  const db = initialData ? new SQL.Database(initialData) : new SQL.Database();
  return new BrowserSqliteAdapter(db);
}
