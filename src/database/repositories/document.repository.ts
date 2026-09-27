import type { IDatabase, DocumentFilter, PaginatedResult } from '../types.ts';
import { getDb } from '../connection.ts';
import type { 
  FiscalDocument, 
  DocumentItem, 
  DocumentType, 
  DocumentSituacao 
} from '../../types/models.ts';

interface FiscalDocumentRow {
  id: string;
  company_id: string;
  tipo: string;
  chave_acesso: string | null;
  numero: string;
  serie: string | null;
  data_emissao: string;
  valor_total: number;
  emitente_cnpj_cpf: string;
  emitente_razao_social: string;
  emitente_uf: string | null;
  destinatario_cnpj_cpf: string | null;
  destinatario_razao_social: string | null;
  destinatario_uf: string | null;
  valor_icms: number | null;
  valor_ipi: number | null;
  valor_pis: number | null;
  valor_cofins: number | null;
  valor_iss: number | null;
  situacao: string;
  xml_original: string;
  xml_hash: string;
  nfe_versao: string | null;
  natureza_operacao: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentItemRow {
  id: string;
  document_id: string;
  numero_item: number;
  codigo: string | null;
  descricao: string;
  ncm: string | null;
  cfop: string | null;
  unidade: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  base_calculo_icms: number | null;
  valor_icms: number | null;
  aliquota_icms: number | null;
  valor_ipi: number | null;
  valor_pis: number | null;
  valor_cofins: number | null;
  cst: string | null;
  origem: string | null;
}

function mapRowToDocument(row: FiscalDocumentRow): FiscalDocument {
  return {
    id: row.id,
    companyId: row.company_id,
    tipo: row.tipo as DocumentType,
    chaveAcesso: row.chave_acesso ?? undefined,
    numero: row.numero,
    serie: row.serie ?? undefined,
    dataEmissao: row.data_emissao,
    valorTotal: row.valor_total,
    emitenteCnpjCpf: row.emitente_cnpj_cpf,
    emitenteRazaoSocial: row.emitente_razao_social,
    emitenteUf: row.emitente_uf ?? undefined,
    destinatarioCnpjCpf: row.destinatario_cnpj_cpf ?? undefined,
    destinatarioRazaoSocial: row.destinatario_razao_social ?? undefined,
    destinatarioUf: row.destinatario_uf ?? undefined,
    valorICMS: row.valor_icms ?? undefined,
    valorIPI: row.valor_ipi ?? undefined,
    valorPIS: row.valor_pis ?? undefined,
    valorCOFINS: row.valor_cofins ?? undefined,
    valorISS: row.valor_iss ?? undefined,
    situacao: row.situacao as DocumentSituacao,
    xmlOriginal: row.xml_original,
    xmlHash: row.xml_hash,
    nfeVersao: row.nfe_versao ?? undefined,
    naturezaOperacao: row.natureza_operacao ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRowToItem(row: DocumentItemRow): DocumentItem {
  return {
    id: row.id,
    documentId: row.document_id,
    numeroItem: row.numero_item,
    codigo: row.codigo ?? undefined,
    descricao: row.descricao,
    ncm: row.ncm ?? undefined,
    cfop: row.cfop ?? undefined,
    unidade: row.unidade ?? undefined,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario,
    valorTotal: row.valor_total,
    baseCalculoICMS: row.base_calculo_icms ?? undefined,
    valorICMS: row.valor_icms ?? undefined,
    aliquotaICMS: row.aliquota_icms ?? undefined,
    valorIPI: row.valor_ipi ?? undefined,
    valorPIS: row.valor_pis ?? undefined,
    valorCOFINS: row.valor_cofins ?? undefined,
    cst: row.cst ?? undefined,
    origem: row.origem ?? undefined
  };
}

export class DocumentRepository {
  private customDb?: IDatabase;

  constructor(db?: IDatabase) {
    this.customDb = db;
  }

  private get db(): IDatabase {
    return this.customDb ?? getDb();
  }

  /**
   * Find document by primary key
   */
  async findById(id: string): Promise<FiscalDocument | null> {
    const rows = await this.db.select<FiscalDocumentRow>(
      'SELECT * FROM fiscal_documents WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) return null;
    return mapRowToDocument(rows[0]);
  }

  /**
   * Find document by access key for a specific company
   */
  async findByChaveAcesso(companyId: string, chaveAcesso: string): Promise<FiscalDocument | null> {
    const rows = await this.db.select<FiscalDocumentRow>(
      'SELECT * FROM fiscal_documents WHERE company_id = ? AND chave_acesso = ?',
      [companyId, chaveAcesso]
    );
    if (!rows || rows.length === 0) return null;
    return mapRowToDocument(rows[0]);
  }

  /**
   * Find document by XML SHA-256 hash for a specific company
   */
  async findByHash(companyId: string, xmlHash: string): Promise<FiscalDocument | null> {
    const rows = await this.db.select<FiscalDocumentRow>(
      'SELECT * FROM fiscal_documents WHERE company_id = ? AND xml_hash = ?',
      [companyId, xmlHash]
    );
    if (!rows || rows.length === 0) return null;
    return mapRowToDocument(rows[0]);
  }

  /**
   * Find all documents of a company ordered by date descending
   */
  async findAllByCompany(companyId: string): Promise<FiscalDocument[]> {
    const rows = await this.db.select<FiscalDocumentRow>(
      'SELECT * FROM fiscal_documents WHERE company_id = ? ORDER BY data_emissao DESC, created_at DESC',
      [companyId]
    );
    return rows.map(mapRowToDocument);
  }

  /**
   * Get items of a document
   */
  async findItemsByDocumentId(documentId: string): Promise<DocumentItem[]> {
    const rows = await this.db.select<DocumentItemRow>(
      'SELECT * FROM document_items WHERE document_id = ? ORDER BY numero_item ASC',
      [documentId]
    );
    return rows.map(mapRowToItem);
  }

  /**
   * Insert a document and its optional items
   */
  async create(doc: FiscalDocument, items: DocumentItem[] = []): Promise<FiscalDocument> {
    const id = doc.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}`);
    const now = new Date().toISOString();

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
        id,
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
        doc.createdAt || now,
        doc.updatedAt || now
      ]
    );

    // Insert items if any
    for (const item of items) {
      const itemId = item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`);
      await this.db.execute(
        `INSERT INTO document_items (
          id, document_id, numero_item, codigo, descricao, ncm, cfop, unidade,
          quantidade, valor_unitario, valor_total,
          base_calculo_icms, valor_icms, aliquota_icms, valor_ipi, valor_pis, valor_cofins,
          cst, origem
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          id,
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

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve document after insert: ${id}`);
    }
    return created;
  }

  /**
   * Search documents with pagination and filters
   */
  async findPaginated(filter: DocumentFilter): Promise<PaginatedResult<FiscalDocument>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, filter.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['company_id = ?'];
    const params: unknown[] = [filter.companyId];

    if (filter.tipo) {
      conditions.push('tipo = ?');
      params.push(filter.tipo);
    }

    if (filter.situacao) {
      conditions.push('situacao = ?');
      params.push(filter.situacao);
    }

    if (filter.dataInicio) {
      conditions.push('data_emissao >= ?');
      params.push(filter.dataInicio);
    }

    if (filter.dataFim) {
      conditions.push('data_emissao <= ?');
      params.push(filter.dataFim);
    }

    if (filter.search) {
      const term = `%${filter.search}%`;
      conditions.push(`(
        numero LIKE ? OR 
        chave_acesso LIKE ? OR 
        emitente_razao_social LIKE ? OR 
        destinatario_razao_social LIKE ? OR 
        emitente_cnpj_cpf LIKE ? OR 
        destinatario_cnpj_cpf LIKE ?
      )`);
      params.push(term, term, term, term, term, term);
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countRows = await this.db.select<{ total: number }>(
      `SELECT COUNT(*) as total FROM fiscal_documents WHERE ${whereClause}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    // Fetch page data
    const dataRows = await this.db.select<FiscalDocumentRow>(
      `SELECT * FROM fiscal_documents WHERE ${whereClause} ORDER BY data_emissao DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const data = dataRows.map(mapRowToDocument);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Delete document (cascades items automatically via foreign key)
   */
  async delete(id: string): Promise<boolean> {
    const res = await this.db.execute('DELETE FROM fiscal_documents WHERE id = ?', [id]);
    return res.rowsAffected > 0;
  }

  /**
   * Get metrics summary for a company
   */
  async getSummaryByCompany(companyId: string): Promise<{
    totalDocs: number;
    totalValor: number;
    byTipo: Record<string, number>;
  }> {
    const rows = await this.db.select<{ tipo: string; count: number; total_valor: number }>(
      `SELECT tipo, COUNT(*) as count, SUM(valor_total) as total_valor 
       FROM fiscal_documents 
       WHERE company_id = ? 
       GROUP BY tipo`,
      [companyId]
    );

    let totalDocs = 0;
    let totalValor = 0;
    const byTipo: Record<string, number> = {};

    for (const r of rows) {
      totalDocs += r.count;
      totalValor += r.total_valor || 0;
      byTipo[r.tipo] = r.count;
    }

    return { totalDocs, totalValor, byTipo };
  }
}
