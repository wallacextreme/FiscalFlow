import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NodeSqliteAdapter } from '../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../src/database/migrator.ts';
import { setDatabase } from '../../src/database/connection.ts';
import { CompanyRepository } from '../../src/database/repositories/company.repository.ts';
import { DocumentRepository } from '../../src/database/repositories/document.repository.ts';
import { SpedRepository } from '../../src/database/repositories/sped.repository.ts';
import { SettingsRepository } from '../../src/database/repositories/settings.repository.ts';
import { CompanyService } from '../../src/services/company.service.ts';
import { ImportService } from '../../src/services/import.service.ts';
import { DashboardService } from '../../src/services/dashboard.service.ts';
import { ExportService } from '../../src/services/export.service.ts';
import { SettingsService } from '../../src/services/settings.service.ts';
import JSZip from 'jszip';

describe('FiscalFlow — End-to-End Complete Fiscal Lifecycle Integration', () => {
  let db: NodeSqliteAdapter;
  let companyRepo: CompanyRepository;
  let docRepo: DocumentRepository;
  let spedRepo: SpedRepository;
  let settingsRepo: SettingsRepository;

  let companyService: CompanyService;
  let importService: ImportService;
  let dashboardService: DashboardService;
  let exportService: ExportService;
  let settingsService: SettingsService;

  const fixturesDir = join(__dirname, '../fixtures');

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    setDatabase(db);

    companyRepo = new CompanyRepository(db);
    docRepo = new DocumentRepository(db);
    spedRepo = new SpedRepository(db);
    settingsRepo = new SettingsRepository(db);

    companyService = new CompanyService(companyRepo);
    importService = new ImportService(docRepo, undefined, undefined, undefined, spedRepo);
    dashboardService = new DashboardService(docRepo, spedRepo);
    exportService = new ExportService();
    settingsService = new SettingsService(settingsRepo);
  });

  afterEach(async () => {
    await db.close();
    setDatabase(null);
    vi.restoreAllMocks();
  });

  it('should execute the full fiscal flow: Company Registration -> Multi-format Batch Import -> Deduplication -> Audit & Query -> Dashboard KPIs -> Accounting Export -> Backup & Restore', async () => {
    // -------------------------------------------------------------
    // Step 1: Register Active Company
    // -------------------------------------------------------------
    const company = await companyService.create({
      id: 'comp-xtreme',
      cnpj: '11.222.333/0001-81',
      razaoSocial: 'Xtreme Sistemas e Tecnologia LTDA',
      nomeFantasia: 'Xtreme Sistemas',
      inscricaoEstadual: '123456789',
      endereco: {
        logradouro: 'Av. Paulista',
        numero: '1000',
        municipio: 'São Paulo',
        uf: 'SP',
        cep: '01310-100'
      },
      regimeTributario: 'simples_nacional',
      ativa: true
    });

    expect(company.id).toBe('comp-xtreme');
    expect(company.cnpj).toBe('11222333000181');

    await companyService.setActiveCompany(company.id);
    const activeComp = await companyService.getActiveCompany();
    expect(activeComp?.id).toBe('comp-xtreme');

    // -------------------------------------------------------------
    // Step 2: Read Real Fiscal Fixtures (NF-e, NFS-e, CT-e, SPED)
    // -------------------------------------------------------------
    const nfeCompleta = readFileSync(join(fixturesDir, 'nfe/nfe_completa.xml'), 'utf-8');
    const nfeItens = readFileSync(join(fixturesDir, 'nfe/nfe_multiplos_itens.xml'), 'utf-8');
    const nfseNacional = readFileSync(join(fixturesDir, 'nfse/nfse_nacional.xml'), 'utf-8');
    const nfseAbrasf = readFileSync(join(fixturesDir, 'nfse/nfse_abrasf.xml'), 'utf-8');
    const cteCompleto = readFileSync(join(fixturesDir, 'cte/cte_completo.xml'), 'utf-8');
    const spedFiscal = readFileSync(join(fixturesDir, 'sped/sped_fiscal_completo.txt'), 'utf-8');

    // -------------------------------------------------------------
    // Step 3: Batch Import Mixed Documents
    // -------------------------------------------------------------
    const importResult = await importService.importBatch([
      { name: 'nfe_completa.xml', content: nfeCompleta },
      { name: 'nfe_multiplos_itens.xml', content: nfeItens },
      { name: 'nfse_nacional.xml', content: nfseNacional },
      { name: 'nfse_abrasf.xml', content: nfseAbrasf },
      { name: 'cte_completo.xml', content: cteCompleto },
      { name: 'sped_fiscal.txt', content: spedFiscal }
    ], company.id);

    expect(importResult.totalFiles).toBe(6);
    expect(importResult.imported).toBe(6);
    expect(importResult.duplicates).toBe(0);
    expect(importResult.errors).toBe(0);

    // -------------------------------------------------------------
    // Step 4: Test Automatic Deduplication
    // -------------------------------------------------------------
    const reimportResult = await importService.importBatch([
      { name: 'nfe_completa.xml', content: nfeCompleta },
      { name: 'sped_fiscal.txt', content: spedFiscal }
    ], company.id);

    expect(reimportResult.imported).toBe(0);
    expect(reimportResult.duplicates).toBe(2);

    // -------------------------------------------------------------
    // Step 5: Verify Persistence & Query Documents
    // -------------------------------------------------------------
    const paginated = await docRepo.findPaginated({
      companyId: company.id,
      page: 1,
      pageSize: 50
    });

    expect(paginated.total).toBe(5); // 5 XML documents (2 NF-e, 2 NFS-e, 1 CT-e)
    expect(paginated.data.length).toBe(5);

    // Check item persistence for multi-item document
    const multiItemDoc = paginated.data.find(d => d.numero === '126');
    expect(multiItemDoc).toBeDefined();
    if (multiItemDoc) {
      const items = await docRepo.findItemsByDocumentId(multiItemDoc.id);
      expect(items.length).toBe(5);
      expect(items[0].descricao).toContain('TECLADO');
    }

    // Check SPED Fiscal persistence
    const speds = await spedRepo.findByCompany(company.id);
    expect(speds.length).toBe(1);
    expect(speds[0].periodo).toBe('202401');
    expect(speds[0].totalRegistros).toBeGreaterThan(10);

    // -------------------------------------------------------------
    // Step 6: Verify Dashboard Executive Metrics
    // -------------------------------------------------------------
    const metrics = await dashboardService.getMetrics(company.id, company.cnpj);
    expect(metrics.totalFiscalDocs).toBe(5);
    expect(metrics.totalSpedFiles).toBe(1);
    expect(metrics.totalValor).toBeGreaterThan(0);
    expect(metrics.distribuicaoTipos.find(t => t.tipo === 'nfe')?.count).toBe(2);
    expect(metrics.distribuicaoTipos.find(t => t.tipo === 'nfse')?.count).toBe(2);
    expect(metrics.distribuicaoTipos.find(t => t.tipo === 'cte')?.count).toBe(1);
    expect(metrics.distribuicaoTipos.find(t => t.tipo === 'sped')?.count).toBe(1);
    expect(metrics.topClientes.length).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // Step 7: Export Documents & Line Items to CSV (BR Standard)
    // -------------------------------------------------------------
    const docsCsv = exportService.exportDocumentsToCsv(paginated.data);
    expect(docsCsv.startsWith('\uFEFF')).toBe(true);
    expect(docsCsv).toContain('ID;Tipo;Número;Série;Data Emissão;Chave de Acesso');
    expect(docsCsv).toContain('NFE');
    expect(docsCsv).toContain('NFSE');
    expect(docsCsv).toContain('CTE');

    const allItems = [];
    const docMap = new Map();
    for (const doc of paginated.data) {
      docMap.set(doc.id, doc);
      const its = await docRepo.findItemsByDocumentId(doc.id);
      allItems.push(...its);
    }

    const itemsCsv = exportService.exportItemsToCsv(allItems, docMap);
    expect(itemsCsv.startsWith('\uFEFF')).toBe(true);
    expect(itemsCsv).toContain('Documento Número;Documento Tipo;Item Nº;Código;Descrição');
    expect(itemsCsv).toContain('TECLADO');

    // -------------------------------------------------------------
    // Step 8: Package XML Documents & SPED into ZIP
    // -------------------------------------------------------------
    const zipBlob = await exportService.exportDocumentsToZip(paginated.data);
    expect(zipBlob.size).toBeGreaterThan(0);

    const zipBuffer = await zipBlob.arrayBuffer();
    const zip = await JSZip.loadAsync(zipBuffer);
    expect(zip.file('manifesto_exportacao.txt')).not.toBeNull();
    const manifestContent = await zip.file('manifesto_exportacao.txt')!.async('text');
    expect(manifestContent).toContain('FiscalFlow — Manifesto de Exportação para Contabilidade');
    expect(manifestContent).toContain('Total de Documentos no Pacote: 5');

    // -------------------------------------------------------------
    // Step 9: Export Full Database Backup
    // -------------------------------------------------------------
    const backup = await settingsRepo.exportBackup();
    expect(backup.companies.length).toBe(1);
    expect(backup.fiscalDocuments.length).toBe(5);
    expect(backup.documentItems.length).toBeGreaterThan(0);
    expect(backup.spedFiles.length).toBe(1);

    // -------------------------------------------------------------
    // Step 10: Wipe Database & Confirm Empty State
    // -------------------------------------------------------------
    await settingsService.resetDatabase();
    const emptyStats = await settingsService.getDatabaseStats();
    expect(emptyStats.companies).toBe(0);
    expect(emptyStats.fiscalDocuments).toBe(0);
    expect(emptyStats.documentItems).toBe(0);
    expect(emptyStats.spedFiles).toBe(0);

    // -------------------------------------------------------------
    // Step 11: Restore Backup & Confirm 100% Data Fidelity
    // -------------------------------------------------------------
    const restoreResult = await settingsService.importBackup(JSON.stringify(backup));
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.stats.companies).toBe(1);
    expect(restoreResult.stats.fiscalDocuments).toBe(5);
    expect(restoreResult.stats.spedFiles).toBe(1);

    const restoredCompany = await companyRepo.findById('comp-xtreme');
    expect(restoredCompany?.razaoSocial).toBe('Xtreme Sistemas e Tecnologia LTDA');

    const restoredDocs = await docRepo.findPaginated({ companyId: 'comp-xtreme' });
    expect(restoredDocs.total).toBe(5);

    const restoredSpeds = await spedRepo.findByCompany('comp-xtreme');
    expect(restoredSpeds.length).toBe(1);
    expect(restoredSpeds[0].periodo).toBe('202401');
  });
});
