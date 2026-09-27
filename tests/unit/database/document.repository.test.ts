import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';
import { DocumentRepository } from '../../../src/database/repositories/document.repository.ts';
import type { FiscalDocument, DocumentItem } from '../../../src/types/models.ts';

describe('DocumentRepository', () => {
  let db: NodeSqliteAdapter;
  let companyRepo: CompanyRepository;
  let docRepo: DocumentRepository;
  const companyId = 'company-test-1';

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    companyRepo = new CompanyRepository(db);
    docRepo = new DocumentRepository(db);

    // Create required parent company
    await companyRepo.create({
      id: companyId,
      cnpj: '12345678000199',
      razaoSocial: 'Empresa Teste Docs LTDA',
      ativa: true
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should insert document and items, and retrieve them correctly', async () => {
    const doc: FiscalDocument = {
      id: 'doc-1',
      companyId,
      tipo: 'nfe',
      chaveAcesso: '35240112345678000199550010000000011000000015',
      numero: '000001',
      serie: '1',
      dataEmissao: '2026-01-15T10:00:00Z',
      valorTotal: 1500.50,
      emitenteCnpjCpf: '12345678000199',
      emitenteRazaoSocial: 'Empresa Teste Docs LTDA',
      emitenteUf: 'SP',
      destinatarioCnpjCpf: '98765432000100',
      destinatarioRazaoSocial: 'Cliente Comprador SA',
      destinatarioUf: 'RJ',
      valorICMS: 180.00,
      valorIPI: 50.00,
      valorPIS: 24.75,
      valorCOFINS: 114.00,
      situacao: 'autorizada',
      xmlOriginal: '<nfeProc versao="4.00"><NFe><infNFeId="NFe352401..."></infNFe></NFe></nfeProc>',
      xmlHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      nfeVersao: '4.00',
      naturezaOperacao: 'VENDA DE MERCADORIA',
      createdAt: '2026-01-15T10:05:00Z',
      updatedAt: '2026-01-15T10:05:00Z'
    };

    const items: DocumentItem[] = [
      {
        id: 'item-1',
        documentId: 'doc-1',
        numeroItem: 1,
        codigo: 'PROD001',
        descricao: 'Notebook Gamer Pro 16GB',
        ncm: '84713012',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 1,
        valorUnitario: 1500.50,
        valorTotal: 1500.50,
        valorICMS: 180.00,
        aliquotaICMS: 12.0
      }
    ];

    const created = await docRepo.create(doc, items);
    expect(created.id).toBe('doc-1');
    expect(created.valorTotal).toBe(1500.50);

    const retrieved = await docRepo.findById('doc-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.chaveAcesso).toBe(doc.chaveAcesso);
    expect(retrieved?.emitenteRazaoSocial).toBe(doc.emitenteRazaoSocial);

    const retrievedItems = await docRepo.findItemsByDocumentId('doc-1');
    expect(retrievedItems).toHaveLength(1);
    expect(retrievedItems[0].descricao).toBe('Notebook Gamer Pro 16GB');
    expect(retrievedItems[0].ncm).toBe('84713012');
  });

  it('should find by chaveAcesso and by xmlHash', async () => {
    const doc: FiscalDocument = {
      id: 'doc-chave-test',
      companyId,
      tipo: 'nfe',
      chaveAcesso: '41240112345678000199550010000000021000000028',
      numero: '000002',
      dataEmissao: '2026-01-16T14:30:00Z',
      valorTotal: 200.0,
      emitenteCnpjCpf: '12345678000199',
      emitenteRazaoSocial: 'Empresa Teste Docs LTDA',
      situacao: 'autorizada',
      xmlOriginal: '<xml>dummy</xml>',
      xmlHash: 'hash1234567890',
      createdAt: '2026-01-16T14:30:00Z',
      updatedAt: '2026-01-16T14:30:00Z'
    };

    await docRepo.create(doc);

    const byChave = await docRepo.findByChaveAcesso(companyId, doc.chaveAcesso!);
    expect(byChave?.id).toBe('doc-chave-test');

    const byHash = await docRepo.findByHash(companyId, 'hash1234567890');
    expect(byHash?.id).toBe('doc-chave-test');
  });

  it('should filter and paginate documents', async () => {
    // Insert 3 documents
    for (let i = 1; i <= 3; i++) {
      await docRepo.create({
        id: `doc-page-${i}`,
        companyId,
        tipo: i === 3 ? 'cte' : 'nfe',
        numero: `00000${i}`,
        dataEmissao: `2026-01-0${i}T12:00:00Z`,
        valorTotal: i * 100,
        emitenteCnpjCpf: '12345678000199',
        emitenteRazaoSocial: `Emitente ${i}`,
        situacao: 'autorizada',
        xmlOriginal: '<xml></xml>',
        xmlHash: `hash-page-${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Filter by type
    const nfeResult = await docRepo.findPaginated({
      companyId,
      tipo: 'nfe'
    });
    expect(nfeResult.total).toBe(2);
    expect(nfeResult.data).toHaveLength(2);

    // Search by number
    const searchResult = await docRepo.findPaginated({
      companyId,
      search: '000002'
    });
    expect(searchResult.total).toBe(1);
    expect(searchResult.data[0].id).toBe('doc-page-2');

    // Filter by situacao
    const sitResult = await docRepo.findPaginated({
      companyId,
      situacao: 'autorizada'
    });
    expect(sitResult.total).toBe(3);

    // Paginate pageSize = 1
    const pagedResult = await docRepo.findPaginated({
      companyId,
      page: 1,
      pageSize: 1
    });
    expect(pagedResult.total).toBe(3);
    expect(pagedResult.data).toHaveLength(1);
    expect(pagedResult.totalPages).toBe(3);
  });

  it('should delete document and cascade delete items', async () => {
    await docRepo.create(
      {
        id: 'doc-to-delete',
        companyId,
        tipo: 'nfe',
        numero: '999',
        dataEmissao: '2026-01-20T12:00:00Z',
        valorTotal: 50,
        emitenteCnpjCpf: '12345678000199',
        emitenteRazaoSocial: 'Emitente',
        situacao: 'autorizada',
        xmlOriginal: '<xml></xml>',
        xmlHash: 'hash-del',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      [
        {
          id: 'item-del-1',
          documentId: 'doc-to-delete',
          numeroItem: 1,
          descricao: 'Item Cascata',
          quantidade: 1,
          valorUnitario: 50,
          valorTotal: 50
        }
      ]
    );

    const deleted = await docRepo.delete('doc-to-delete');
    expect(deleted).toBe(true);

    const docAfter = await docRepo.findById('doc-to-delete');
    expect(docAfter).toBeNull();

    const itemsAfter = await docRepo.findItemsByDocumentId('doc-to-delete');
    expect(itemsAfter).toHaveLength(0);
  });

  it('should calculate metrics summary by company', async () => {
    await docRepo.create({
      id: 'doc-sum-1',
      companyId,
      tipo: 'nfe',
      numero: '101',
      dataEmissao: '2026-01-20T12:00:00Z',
      valorTotal: 1000,
      emitenteCnpjCpf: '12345678000199',
      emitenteRazaoSocial: 'Emitente',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'hash-sum-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await docRepo.create({
      id: 'doc-sum-2',
      companyId,
      tipo: 'cte',
      numero: '102',
      dataEmissao: '2026-01-20T12:00:00Z',
      valorTotal: 500,
      emitenteCnpjCpf: '12345678000199',
      emitenteRazaoSocial: 'Emitente',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'hash-sum-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const summary = await docRepo.getSummaryByCompany(companyId);
    expect(summary.totalDocs).toBe(2);
    expect(summary.totalValor).toBe(1500);
    expect(summary.byTipo['nfe']).toBe(1);
    expect(summary.byTipo['cte']).toBe(1);
  });
});
