/**
 * FiscalFlow — SPED Files Repository
 * 
 * Handles database operations for imported SPED Fiscal (EFD ICMS/IPI) files.
 */

import type { IDatabase } from '../types.ts';
import { getDb } from '../connection.ts';
import type { SpedFile, SpedType, SpedFinalidade } from '../../types/models.ts';

interface SpedFileRow {
  id: string;
  company_id: string;
  tipo: string;
  periodo: string;
  data_inicio: string;
  data_fim: string;
  cnpj: string;
  razao_social: string;
  inscricao_estadual: string | null;
  versao_layout: string;
  finalidade: string;
  conteudo_original: string;
  conteudo_hash: string;
  total_registros: number;
  created_at: string;
  updated_at: string;
}

function mapRowToSpedFile(row: SpedFileRow): SpedFile {
  return {
    id: row.id,
    companyId: row.company_id,
    tipo: row.tipo as SpedType,
    periodo: row.periodo,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    inscricaoEstadual: row.inscricao_estadual ?? undefined,
    versaoLayout: row.versao_layout,
    finalidade: row.finalidade as SpedFinalidade,
    conteudoOriginal: row.conteudo_original,
    conteudoHash: row.conteudo_hash,
    totalRegistros: row.total_registros,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class SpedRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb ?? getDb();
  }

  /**
   * Find SPED file by ID
   */
  async findById(id: string): Promise<SpedFile | null> {
    const rows = await this.db.select<SpedFileRow>(
      'SELECT * FROM sped_files WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) return null;
    return mapRowToSpedFile(rows[0]);
  }

  /**
   * Find SPED file by SHA-256 hash for a specific company
   */
  async findByHash(companyId: string, hash: string): Promise<SpedFile | null> {
    const rows = await this.db.select<SpedFileRow>(
      'SELECT * FROM sped_files WHERE company_id = ? AND conteudo_hash = ?',
      [companyId, hash]
    );
    if (!rows || rows.length === 0) return null;
    return mapRowToSpedFile(rows[0]);
  }

  /**
   * Find all SPED files of a company ordered by period descending
   */
  async findByCompany(companyId: string): Promise<SpedFile[]> {
    const rows = await this.db.select<SpedFileRow>(
      'SELECT * FROM sped_files WHERE company_id = ? ORDER BY periodo DESC, data_inicio DESC',
      [companyId]
    );
    return rows.map(mapRowToSpedFile);
  }

  /**
   * Create a new SPED file record
   */
  async create(file: SpedFile): Promise<SpedFile> {
    const id = file.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sped-${Date.now()}`);
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO sped_files (
        id, company_id, tipo, periodo, data_inicio, data_fim,
        cnpj, razao_social, inscricao_estadual, versao_layout,
        finalidade, conteudo_original, conteudo_hash, total_registros,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        file.companyId,
        file.tipo,
        file.periodo,
        file.dataInicio,
        file.dataFim,
        file.cnpj,
        file.razaoSocial,
        file.inscricaoEstadual ?? null,
        file.versaoLayout,
        file.finalidade,
        file.conteudoOriginal,
        file.conteudoHash,
        file.totalRegistros,
        file.createdAt || now,
        file.updatedAt || now
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve created SPED file: ${id}`);
    }
    return created;
  }

  /**
   * Delete SPED file by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.execute(
      'DELETE FROM sped_files WHERE id = ?',
      [id]
    );
    return result.rowsAffected > 0;
  }
}
