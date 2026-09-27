import type { IDatabase } from '../types.ts';
import { getDb } from '../connection.ts';
import type { Company, RegimeTributario } from '../../types/models.ts';

interface CompanyRow {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  codigo_municipio: string | null;
  uf: string | null;
  cep: string | null;
  regime_tributario: string | null;
  ativa: number;
  created_at: string;
  updated_at: string;
}

function mapRowToCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia ?? undefined,
    inscricaoEstadual: row.inscricao_estadual ?? undefined,
    inscricaoMunicipal: row.inscricao_municipal ?? undefined,
    endereco: {
      logradouro: row.logradouro ?? undefined,
      numero: row.numero ?? undefined,
      complemento: row.complemento ?? undefined,
      bairro: row.bairro ?? undefined,
      municipio: row.municipio ?? undefined,
      codigoMunicipio: row.codigo_municipio ?? undefined,
      uf: row.uf ?? undefined,
      cep: row.cep ?? undefined
    },
    regimeTributario: (row.regime_tributario as RegimeTributario) ?? undefined,
    ativa: Boolean(row.ativa),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class CompanyRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb ?? getDb();
  }

  /**
   * Find company by primary key
   */
  async findById(id: string): Promise<Company | null> {
    const rows = await this.db.select<CompanyRow>(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) return null;
    return mapRowToCompany(rows[0]);
  }

  /**
   * Find company by CNPJ (numeric only)
   */
  async findByCnpj(cnpj: string): Promise<Company | null> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const rows = await this.db.select<CompanyRow>(
      'SELECT * FROM companies WHERE cnpj = ?',
      [cleanCnpj]
    );
    if (!rows || rows.length === 0) return null;
    return mapRowToCompany(rows[0]);
  }

  /**
   * List all companies with optional active filter
   */
  async findAll(onlyActive: boolean = false): Promise<Company[]> {
    const query = onlyActive
      ? 'SELECT * FROM companies WHERE ativa = 1 ORDER BY razao_social ASC'
      : 'SELECT * FROM companies ORDER BY razao_social ASC';
    const rows = await this.db.select<CompanyRow>(query);
    return rows.map(mapRowToCompany);
  }

  /**
   * Search companies by CNPJ or Razao Social or Nome Fantasia
   */
  async search(term: string): Promise<Company[]> {
    const pattern = `%${term}%`;
    const cleanNumeric = term.replace(/\D/g, '');
    const rows = await this.db.select<CompanyRow>(
      `SELECT * FROM companies 
       WHERE razao_social LIKE ? 
          OR nome_fantasia LIKE ? 
          OR cnpj LIKE ? 
       ORDER BY razao_social ASC`,
      [pattern, pattern, cleanNumeric ? `%${cleanNumeric}%` : pattern]
    );
    return rows.map(mapRowToCompany);
  }

  /**
   * Create a new company
   */
  async create(company: Omit<Company, 'createdAt' | 'updatedAt'>): Promise<Company> {
    const cleanCnpj = company.cnpj.replace(/\D/g, '');
    const id = company.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`);
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO companies (
        id, cnpj, razao_social, nome_fantasia,
        inscricao_estadual, inscricao_municipal,
        logradouro, numero, complemento, bairro, municipio, codigo_municipio, uf, cep,
        regime_tributario, ativa, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cleanCnpj,
        company.razaoSocial,
        company.nomeFantasia ?? null,
        company.inscricaoEstadual ?? null,
        company.inscricaoMunicipal ?? null,
        company.endereco?.logradouro ?? null,
        company.endereco?.numero ?? null,
        company.endereco?.complemento ?? null,
        company.endereco?.bairro ?? null,
        company.endereco?.municipio ?? null,
        company.endereco?.codigoMunicipio ?? null,
        company.endereco?.uf ?? null,
        company.endereco?.cep?.replace(/\D/g, '') ?? null,
        company.regimeTributario ?? null,
        company.ativa !== false ? 1 : 0,
        now,
        now
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve company after insert: ${id}`);
    }
    return created;
  }

  /**
   * Update existing company
   */
  async update(id: string, updates: Partial<Company>): Promise<Company | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const cleanCnpj = updates.cnpj !== undefined ? updates.cnpj.replace(/\D/g, '') : existing.cnpj;
    const razaoSocial = updates.razaoSocial ?? existing.razaoSocial;
    const nomeFantasia = updates.nomeFantasia !== undefined ? updates.nomeFantasia : existing.nomeFantasia;
    const inscricaoEstadual = updates.inscricaoEstadual !== undefined ? updates.inscricaoEstadual : existing.inscricaoEstadual;
    const inscricaoMunicipal = updates.inscricaoMunicipal !== undefined ? updates.inscricaoMunicipal : existing.inscricaoMunicipal;
    
    const endereco = { ...existing.endereco, ...updates.endereco };
    const regimeTributario = updates.regimeTributario !== undefined ? updates.regimeTributario : existing.regimeTributario;
    const ativa = updates.ativa !== undefined ? (updates.ativa ? 1 : 0) : (existing.ativa ? 1 : 0);
    const now = new Date().toISOString();

    await this.db.execute(
      `UPDATE companies SET 
        cnpj = ?, razao_social = ?, nome_fantasia = ?,
        inscricao_estadual = ?, inscricao_municipal = ?,
        logradouro = ?, numero = ?, complemento = ?, bairro = ?, municipio = ?, codigo_municipio = ?, uf = ?, cep = ?,
        regime_tributario = ?, ativa = ?, updated_at = ?
      WHERE id = ?`,
      [
        cleanCnpj,
        razaoSocial,
        nomeFantasia ?? null,
        inscricaoEstadual ?? null,
        inscricaoMunicipal ?? null,
        endereco.logradouro ?? null,
        endereco.numero ?? null,
        endereco.complemento ?? null,
        endereco.bairro ?? null,
        endereco.municipio ?? null,
        endereco.codigoMunicipio ?? null,
        endereco.uf ?? null,
        endereco.cep ? endereco.cep.replace(/\D/g, '') : null,
        regimeTributario ?? null,
        ativa,
        now,
        id
      ]
    );

    return this.findById(id);
  }

  /**
   * Delete company and cascading records
   */
  async delete(id: string): Promise<boolean> {
    const res = await this.db.execute('DELETE FROM companies WHERE id = ?', [id]);
    return res.rowsAffected > 0;
  }
}
