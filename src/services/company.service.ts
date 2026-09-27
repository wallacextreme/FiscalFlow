/**
 * FiscalFlow — Company Service
 * 
 * Business logic for company management, validations, and active company context.
 */

import { CompanyRepository } from '../database/repositories/company.repository.ts';
import type { Company, CompanyAddress, RegimeTributario } from '../types/models.ts';
import { isValidCnpj, cleanDigits } from '../utils/validators.ts';
import { getDb } from '../database/connection.ts';

export interface CompanyInput {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  endereco?: CompanyAddress;
  regimeTributario?: RegimeTributario;
  ativa?: boolean;
}

export class CompanyService {
  private customRepository?: CompanyRepository;
  private activeCompany: Company | null = null;
  private activeCompanyListeners: ((company: Company | null) => void)[] = [];

  constructor(repository?: CompanyRepository) {
    this.customRepository = repository;
  }

  setRepository(repository: CompanyRepository): void {
    this.customRepository = repository;
  }

  private get repository(): CompanyRepository {
    if (!this.customRepository) {
      this.customRepository = new CompanyRepository();
    }
    return this.customRepository;
  }

  /**
   * List companies with optional search and active status filter
   */
  async list(search?: string, onlyActive: boolean = false): Promise<Company[]> {
    if (search && search.trim().length > 0) {
      const results = await this.repository.search(search.trim());
      if (onlyActive) {
        return results.filter(c => c.ativa);
      }
      return results;
    }
    return this.repository.findAll(onlyActive);
  }

  /**
   * Get single company by ID
   */
  async getById(id: string): Promise<Company | null> {
    return this.repository.findById(id);
  }

  /**
   * Get single company by CNPJ
   */
  async getByCnpj(cnpj: string): Promise<Company | null> {
    return this.repository.findByCnpj(cnpj);
  }

  /**
   * Register a new company with validation
   */
  async create(input: CompanyInput): Promise<Company> {
    // 1. Validate required fields
    if (!input.razaoSocial || input.razaoSocial.trim().length === 0) {
      throw new Error('A Razão Social é obrigatória.');
    }

    if (!input.cnpj || input.cnpj.trim().length === 0) {
      throw new Error('O CNPJ é obrigatório.');
    }

    // 2. Validate CNPJ format and check digits
    const cleanedCnpj = cleanDigits(input.cnpj);
    if (!isValidCnpj(cleanedCnpj)) {
      throw new Error('O CNPJ informado é inválido.');
    }

    // 3. Verify uniqueness
    const existing = await this.repository.findByCnpj(cleanedCnpj);
    if (existing) {
      throw new Error(`Já existe uma empresa cadastrada com o CNPJ ${input.cnpj}.`);
    }

    // 4. Create record
    const created = await this.repository.create({
      id: input.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`),
      cnpj: cleanedCnpj,
      razaoSocial: input.razaoSocial.trim(),
      nomeFantasia: input.nomeFantasia?.trim() || undefined,
      inscricaoEstadual: input.inscricaoEstadual?.trim() || undefined,
      inscricaoMunicipal: input.inscricaoMunicipal?.trim() || undefined,
      endereco: input.endereco,
      regimeTributario: input.regimeTributario,
      ativa: input.ativa !== false
    });

    // If no active company is currently set, set the newly created one as active
    if (!this.activeCompany) {
      await this.setActiveCompany(created.id);
    }

    return created;
  }

  /**
   * Update company details
   */
  async update(id: string, input: Partial<CompanyInput>): Promise<Company> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Empresa com ID "${id}" não encontrada.`);
    }

    if (input.razaoSocial !== undefined && input.razaoSocial.trim().length === 0) {
      throw new Error('A Razão Social não pode ser vazia.');
    }

    let cleanedCnpj = existing.cnpj;
    if (input.cnpj !== undefined) {
      cleanedCnpj = cleanDigits(input.cnpj);
      if (!isValidCnpj(cleanedCnpj)) {
        throw new Error('O CNPJ informado é inválido.');
      }

      if (cleanedCnpj !== existing.cnpj) {
        const duplicate = await this.repository.findByCnpj(cleanedCnpj);
        if (duplicate && duplicate.id !== id) {
          throw new Error(`Já existe outra empresa com o CNPJ ${input.cnpj}.`);
        }
      }
    }

    const updated = await this.repository.update(id, {
      ...input,
      cnpj: cleanedCnpj,
      razaoSocial: input.razaoSocial ? input.razaoSocial.trim() : existing.razaoSocial,
      nomeFantasia: input.nomeFantasia !== undefined ? input.nomeFantasia.trim() : existing.nomeFantasia
    });

    if (!updated) {
      throw new Error(`Falha ao atualizar a empresa ${id}.`);
    }

    // If active company was updated, refresh active reference
    if (this.activeCompany && this.activeCompany.id === id) {
      this.activeCompany = updated;
      this.notifyActiveCompanyListeners();
    }

    return updated;
  }

  /**
   * Delete company and handle active company reference
   */
  async delete(id: string): Promise<boolean> {
    const success = await this.repository.delete(id);
    if (success && this.activeCompany && this.activeCompany.id === id) {
      // Find another active company or null
      const remaining = await this.repository.findAll(true);
      if (remaining.length > 0) {
        await this.setActiveCompany(remaining[0].id);
      } else {
        await this.setActiveCompany(null);
      }
    }
    return success;
  }

  /**
   * Get active company
   */
  async getActiveCompany(): Promise<Company | null> {
    if (this.activeCompany) return this.activeCompany;

    // Check localStorage first
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('fiscalflow_active_company_id');
      if (savedId) {
        const found = await this.repository.findById(savedId);
        if (found) {
          this.activeCompany = found;
          return found;
        }
      }
    }

    // Check app_settings database
    try {
      const db = getDb();
      const rows = await db.select<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        ['default_company_id']
      );
      if (rows && rows.length > 0 && rows[0].value) {
        const found = await this.repository.findById(rows[0].value);
        if (found) {
          this.activeCompany = found;
          return found;
        }
      }
    } catch {
      // DB not ready or not in Tauri context
    }

    // Default to the first active company in DB
    const list = await this.repository.findAll(true);
    if (list.length > 0) {
      await this.setActiveCompany(list[0].id);
      return list[0];
    }

    return null;
  }

  /**
   * Clear active company selection
   */
  async clearActiveCompany(): Promise<void> {
    await this.setActiveCompany(null);
  }

  /**
   * Set active company
   */
  async setActiveCompany(id: string | null): Promise<Company | null> {
    if (!id) {
      this.activeCompany = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fiscalflow_active_company_id');
      }
      this.notifyActiveCompanyListeners();
      return null;
    }

    const company = await this.repository.findById(id);
    if (!company) {
      throw new Error(`Empresa com ID "${id}" não encontrada.`);
    }

    this.activeCompany = company;

    if (typeof window !== 'undefined') {
      localStorage.setItem('fiscalflow_active_company_id', company.id);
    }

    try {
      const db = getDb();
      await db.execute(
        'INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))',
        ['default_company_id', company.id]
      );
    } catch {
      // DB not ready or test env
    }

    this.notifyActiveCompanyListeners();
    return company;
  }

  /**
   * Subscribe to active company change
   */
  onActiveCompanyChange(callback: (company: Company | null) => void): () => void {
    this.activeCompanyListeners.push(callback);
    return () => {
      this.activeCompanyListeners = this.activeCompanyListeners.filter(cb => cb !== callback);
    };
  }

  private notifyActiveCompanyListeners(): void {
    this.activeCompanyListeners.forEach(cb => cb(this.activeCompany));
  }
}

export const companyService = new CompanyService();
