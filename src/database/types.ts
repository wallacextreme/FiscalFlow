/**
 * FiscalFlow — Database Abstraction Types
 */

export interface QueryResult {
  rowsAffected: number;
  lastInsertId: number;
}

export interface IDatabase {
  /**
   * Execute an arbitrary query (INSERT, UPDATE, DELETE, DDL)
   */
  execute(query: string, bindValues?: unknown[]): Promise<QueryResult>;

  /**
   * Execute a SELECT query and return typed array of rows
   */
  select<T = unknown>(query: string, bindValues?: unknown[]): Promise<T[]>;

  /**
   * Close connection if supported
   */
  close?(): Promise<boolean>;
}

export interface Migration {
  version: number;
  description: string;
  sql: string;
}

export interface DocumentFilter {
  companyId: string;
  tipo?: string;
  situacao?: string;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
