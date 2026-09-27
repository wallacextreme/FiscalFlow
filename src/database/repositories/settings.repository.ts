/**
 * FiscalFlow — Settings & Maintenance Repository
 * 
 * Manages key-value system settings (`app_settings`), database health metrics,
 * full database backup export / import, and SQLite maintenance operations.
 */

import type { IDatabase } from '../types.ts';
import { getDb } from '../connection.ts';
import type { 
  AppSetting, 
  DatabaseStats, 
  BackupData, 
  Company, 
  FiscalDocument, 
  DocumentItem, 
  SpedFile, 
  ImportRecord 
} from '../../types/models.ts';

interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

export class SettingsRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb ?? getDb();
  }

  /**
   * Get setting value by key
   */
  async get(key: string): Promise<string | null> {
    const rows = await this.db.select<SettingRow>(
      'SELECT key, value, updated_at FROM app_settings WHERE key = ?',
      [key]
    );
    if (!rows || rows.length === 0) return null;
    return rows[0].value;
  }

  /**
   * Set or update a setting value
   */
  async set(key: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `INSERT INTO app_settings (key, value, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, now]
    );
  }

  /**
   * Get all settings as key-value pairs
   */
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.select<SettingRow>(
      'SELECT key, value FROM app_settings'
    );
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }

  /**
   * Count total records in each database table
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const [companiesCount] = await this.db.select<{ total: number }>('SELECT COUNT(*) as total FROM companies');
    const [docsCount] = await this.db.select<{ total: number }>('SELECT COUNT(*) as total FROM fiscal_documents');
    const [itemsCount] = await this.db.select<{ total: number }>('SELECT COUNT(*) as total FROM document_items');
    const [spedCount] = await this.db.select<{ total: number }>('SELECT COUNT(*) as total FROM sped_files');
    const [importCount] = await this.db.select<{ total: number }>('SELECT COUNT(*) as total FROM import_records');

    return {
      companies: companiesCount?.total || 0,
      fiscalDocuments: docsCount?.total || 0,
      documentItems: itemsCount?.total || 0,
      spedFiles: spedCount?.total || 0,
      importRecords: importCount?.total || 0
    };
  }

  /**
   * Export all data tables as a complete backup payload
   */
  async exportBackup(): Promise<BackupData> {
    const companiesRows = await this.db.select<any>('SELECT * FROM companies');
    const docsRows = await this.db.select<any>('SELECT * FROM fiscal_documents');
    const itemsRows = await this.db.select<any>('SELECT * FROM document_items');
    const spedRows = await this.db.select<any>('SELECT * FROM sped_files');
    const importRows = await this.db.select<any>('SELECT * FROM import_records');
    const settingsRows = await this.db.select<SettingRow>('SELECT * FROM app_settings');

    const companies: Company[] = (companiesRows || []).map((r: any) => ({
      id: r.id,
      cnpj: r.cnpj,
      razaoSocial: r.razao_social,
      nomeFantasia: r.nome_fantasia ?? undefined,
      inscricaoEstadual: r.inscricao_estadual ?? undefined,
      inscricaoMunicipal: r.inscricao_municipal ?? undefined,
      endereco: {
        logradouro: r.logradouro ?? undefined,
        numero: r.numero ?? undefined,
        complemento: r.complemento ?? undefined,
        bairro: r.bairro ?? undefined,
        municipio: r.municipio ?? undefined,
        codigoMunicipio: r.codigo_municipio ?? undefined,
        uf: r.uf ?? undefined,
        cep: r.cep ?? undefined
      },
      regimeTributario: r.regime_tributario ?? undefined,
      ativa: Boolean(r.ativa),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    const fiscalDocuments: FiscalDocument[] = (docsRows || []).map((r: any) => ({
      id: r.id,
      companyId: r.company_id,
      tipo: r.tipo,
      chaveAcesso: r.chave_acesso ?? undefined,
      numero: r.numero,
      serie: r.serie ?? undefined,
      dataEmissao: r.data_emissao,
      valorTotal: r.valor_total,
      emitenteCnpjCpf: r.emitente_cnpj_cpf,
      emitenteRazaoSocial: r.emitente_razao_social,
      emitenteUf: r.emitente_uf ?? undefined,
      destinatarioCnpjCpf: r.destinatario_cnpj_cpf ?? undefined,
      destinatarioRazaoSocial: r.destinatario_razao_social ?? undefined,
      destinatarioUf: r.destinatario_uf ?? undefined,
      valorICMS: r.valor_icms ?? undefined,
      valorIPI: r.valor_ipi ?? undefined,
      valorPIS: r.valor_pis ?? undefined,
      valorCOFINS: r.valor_cofins ?? undefined,
      valorISS: r.valor_iss ?? undefined,
      situacao: r.situacao,
      xmlOriginal: r.xml_original,
      xmlHash: r.xml_hash,
      nfeVersao: r.nfe_versao ?? undefined,
      naturezaOperacao: r.natureza_operacao ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    const documentItems: DocumentItem[] = (itemsRows || []).map((r: any) => ({
      id: r.id,
      documentId: r.document_id,
      numeroItem: r.numero_item,
      codigo: r.codigo ?? undefined,
      descricao: r.descricao,
      ncm: r.ncm ?? undefined,
      cfop: r.cfop ?? undefined,
      unidade: r.unidade ?? undefined,
      quantidade: r.quantidade,
      valorUnitario: r.valor_unitario,
      valorTotal: r.valor_total,
      baseCalculoICMS: r.base_calculo_icms ?? undefined,
      valorICMS: r.valor_icms ?? undefined,
      aliquotaICMS: r.aliquota_icms ?? undefined,
      valorIPI: r.valor_ipi ?? undefined,
      valorPIS: r.valor_pis ?? undefined,
      valorCOFINS: r.valor_cofins ?? undefined,
      cst: r.cst ?? undefined,
      origem: r.origem ?? undefined
    }));

    const spedFiles: SpedFile[] = (spedRows || []).map((r: any) => ({
      id: r.id,
      companyId: r.company_id,
      tipo: r.tipo,
      periodo: r.periodo,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      cnpj: r.cnpj,
      razaoSocial: r.razao_social,
      inscricaoEstadual: r.inscricao_estadual ?? undefined,
      versaoLayout: r.versao_layout,
      finalidade: r.finalidade,
      conteudoOriginal: r.conteudo_original,
      conteudoHash: r.conteudo_hash,
      totalRegistros: r.total_registros,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    const importRecords: ImportRecord[] = (importRows || []).map((r: any) => ({
      id: r.id,
      companyId: r.company_id,
      dataImportacao: r.data_importacao,
      totalArquivos: r.total_arquivos,
      importados: r.importados,
      rejeitados: r.rejeitados,
      erros: r.erros,
      detalhes: r.detalhes ? JSON.parse(r.detalhes) : []
    }));

    const appSettings: AppSetting[] = (settingsRows || []).map((r: SettingRow) => ({
      key: r.key,
      value: r.value,
      updatedAt: r.updated_at
    }));

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      companies,
      fiscalDocuments,
      documentItems,
      spedFiles,
      importRecords,
      appSettings
    };
  }

  /**
   * Restore full backup data into the database
   */
  async restoreBackup(backup: BackupData): Promise<{ success: boolean; stats: DatabaseStats }> {
    if (!backup || !backup.companies || !backup.fiscalDocuments) {
      throw new Error('Arquivo de backup inválido ou formato incompatível.');
    }

    // 1. Clear existing application data (cascade handles items, but we clear explicitly)
    await this.db.execute('DELETE FROM document_items');
    await this.db.execute('DELETE FROM fiscal_documents');
    await this.db.execute('DELETE FROM sped_files');
    await this.db.execute('DELETE FROM import_records');
    await this.db.execute('DELETE FROM companies');

    // 2. Insert companies
    for (const c of backup.companies) {
      await this.db.execute(
        `INSERT INTO companies (
          id, cnpj, razao_social, nome_fantasia, inscricao_estadual, inscricao_municipal,
          logradouro, numero, complemento, bairro, municipio, codigo_municipio,
          uf, cep, regime_tributario, ativa, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.cnpj,
          c.razaoSocial,
          c.nomeFantasia ?? null,
          c.inscricaoEstadual ?? null,
          c.inscricaoMunicipal ?? null,
          c.endereco?.logradouro ?? null,
          c.endereco?.numero ?? null,
          c.endereco?.complemento ?? null,
          c.endereco?.bairro ?? null,
          c.endereco?.municipio ?? null,
          c.endereco?.codigoMunicipio ?? null,
          c.endereco?.uf ?? null,
          c.endereco?.cep ?? null,
          c.regimeTributario ?? null,
          c.ativa ? 1 : 0,
          c.createdAt,
          c.updatedAt
        ]
      );
    }

    // 3. Insert fiscal documents
    for (const doc of backup.fiscalDocuments) {
      await this.db.execute(
        `INSERT INTO fiscal_documents (
          id, company_id, tipo, chave_acesso, numero, serie, data_emissao, valor_total,
          emitente_cnpj_cpf, emitente_razao_social, emitente_uf,
          destinatario_cnpj_cpf, destinatario_razao_social, destinatario_uf,
          valor_icms, valor_ipi, valor_pis, valor_cofins, valor_iss,
          situacao, xml_original, xml_hash, nfe_versao, natureza_operacao,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doc.id,
          doc.companyId,
          doc.tipo,
          doc.chaveAcesso ?? null,
          doc.numero,
          doc.serie ?? null,
          doc.dataEmissao,
          doc.valorTotal,
          doc.emitenteCnpjCpf,
          doc.emitenteRazaoSocial,
          doc.emitenteUf ?? null,
          doc.destinatarioCnpjCpf ?? null,
          doc.destinatarioRazaoSocial ?? null,
          doc.destinatarioUf ?? null,
          doc.valorICMS ?? null,
          doc.valorIPI ?? null,
          doc.valorPIS ?? null,
          doc.valorCOFINS ?? null,
          doc.valorISS ?? null,
          doc.situacao,
          doc.xmlOriginal,
          doc.xmlHash,
          doc.nfeVersao ?? null,
          doc.naturezaOperacao ?? null,
          doc.createdAt,
          doc.updatedAt
        ]
      );
    }

    // 4. Insert document items
    if (backup.documentItems) {
      for (const item of backup.documentItems) {
        await this.db.execute(
          `INSERT INTO document_items (
            id, document_id, numero_item, codigo, descricao, ncm, cfop, unidade,
            quantidade, valor_unitario, valor_total,
            base_calculo_icms, valor_icms, aliquota_icms, valor_ipi, valor_pis, valor_cofins,
            cst, origem
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.documentId,
            item.numeroItem,
            item.codigo ?? null,
            item.descricao,
            item.ncm ?? null,
            item.cfop ?? null,
            item.unidade ?? null,
            item.quantidade,
            item.valorUnitario,
            item.valorTotal,
            item.baseCalculoICMS ?? null,
            item.valorICMS ?? null,
            item.aliquotaICMS ?? null,
            item.valorIPI ?? null,
            item.valorPIS ?? null,
            item.valorCOFINS ?? null,
            item.cst ?? null,
            item.origem ?? null
          ]
        );
      }
    }

    // 5. Insert SPED files
    if (backup.spedFiles) {
      for (const sped of backup.spedFiles) {
        await this.db.execute(
          `INSERT INTO sped_files (
            id, company_id, tipo, periodo, data_inicio, data_fim, cnpj, razao_social,
            inscricao_estadual, versao_layout, finalidade, conteudo_original, conteudo_hash,
            total_registros, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sped.id,
            sped.companyId,
            sped.tipo,
            sped.periodo,
            sped.dataInicio,
            sped.dataFim,
            sped.cnpj,
            sped.razaoSocial,
            sped.inscricaoEstadual ?? null,
            sped.versaoLayout,
            sped.finalidade,
            sped.conteudoOriginal,
            sped.conteudoHash,
            sped.totalRegistros,
            sped.createdAt,
            sped.updatedAt
          ]
        );
      }
    }

    // 6. Insert import records
    if (backup.importRecords) {
      for (const rec of backup.importRecords) {
        await this.db.execute(
          `INSERT INTO import_records (
            id, company_id, data_importacao, total_arquivos, importados, rejeitados, erros, detalhes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rec.id,
            rec.companyId,
            rec.dataImportacao,
            rec.totalArquivos,
            rec.importados,
            rec.rejeitados,
            rec.erros,
            JSON.stringify(rec.detalhes || [])
          ]
        );
      }
    }

    // 7. Update settings if present
    if (backup.appSettings) {
      for (const s of backup.appSettings) {
        await this.set(s.key, s.value);
      }
    }

    const stats = await this.getDatabaseStats();
    return { success: true, stats };
  }

  /**
   * Run SQLite VACUUM optimization
   */
  async vacuum(): Promise<void> {
    try {
      await this.db.execute('VACUUM');
    } catch (err) {
      console.warn('VACUUM failed or not supported in current environment:', err);
    }
  }

  /**
   * Delete all data from database (reset to empty state)
   */
  async clearAllData(): Promise<void> {
    await this.db.execute('DELETE FROM document_items');
    await this.db.execute('DELETE FROM fiscal_documents');
    await this.db.execute('DELETE FROM sped_files');
    await this.db.execute('DELETE FROM import_records');
    await this.db.execute('DELETE FROM companies');
  }
}

export const settingsRepo = new SettingsRepository();
