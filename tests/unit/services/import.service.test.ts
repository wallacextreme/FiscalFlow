import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';
import { DocumentRepository } from '../../../src/database/repositories/document.repository.ts';
import { SpedRepository } from '../../../src/database/repositories/sped.repository.ts';
import { ImportService } from '../../../src/services/import.service.ts';
import { setDatabase } from '../../../src/database/connection.ts';

describe('ImportService', () => {
  let db: NodeSqliteAdapter;
  let importService: ImportService;
  let docRepo: DocumentRepository;
  let spedRepo: SpedRepository;
  const companyId = 'comp-test-imp';

  const validNfeXml = `<?xml version="1.0" encoding="UTF-8"?>
    <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
      <NFe>
        <infNFe Id="NFe35240111222333000181550010000000011000000015" versao="4.00">
          <ide>
            <mod>55</mod>
            <serie>1</serie>
            <nNF>1001</nNF>
            <dhEmi>2026-01-15T12:00:00-03:00</dhEmi>
            <natOp>VENDA DE MERCADORIAS</natOp>
          </ide>
          <emit>
            <CNPJ>11222333000181</CNPJ>
            <xNome>Fornecedor Modelo LTDA</xNome>
            <enderEmit><UF>SP</UF></enderEmit>
          </emit>
          <dest>
            <CNPJ>99888777000166</CNPJ>
            <xNome>Cliente Destinatario SA</xNome>
            <enderDest><UF>RJ</UF></enderDest>
          </dest>
          <det nItem="1">
            <prod>
              <cProd>SKU001</cProd>
              <xProd>Produto Teste 1</xProd>
              <NCM>84713012</NCM>
              <CFOP>5102</CFOP>
              <uCom>UN</uCom>
              <qCom>2.00</qCom>
              <vUnCom>100.00</vUnCom>
              <vProd>200.00</vProd>
            </prod>
          </det>
          <total>
            <ICMSTot>
              <vNF>200.00</vNF>
              <vICMS>36.00</vICMS>
            </ICMSTot>
          </total>
        </infNFe>
      </NFe>
    </nfeProc>`;

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    setDatabase(db);

    const compRepo = new CompanyRepository(db);
    await compRepo.create({
      id: companyId,
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Matriz LTDA',
      ativa: true
    });

    docRepo = new DocumentRepository(db);
    spedRepo = new SpedRepository(db);
    importService = new ImportService(docRepo, undefined, undefined, undefined, spedRepo);
  });

  afterEach(async () => {
    await db.close();
    setDatabase(null);
  });

  it('should successfully import a valid NF-e and extract fields', async () => {
    const summary = await importService.importBatch(
      [{ name: 'nfe_1001.xml', content: validNfeXml }],
      companyId
    );

    expect(summary.totalFiles).toBe(1);
    expect(summary.imported).toBe(1);
    expect(summary.duplicates).toBe(0);
    expect(summary.errors).toBe(0);

    // Verify document was persisted in DB
    const saved = await docRepo.findByChaveAcesso(companyId, '35240112345678000199550010000000011000000015') ||
                  await docRepo.findById(summary.details[0].documentId!);

    expect(saved).not.toBeNull();
    expect(saved?.numero).toBe('1001');
    expect(saved?.valorTotal).toBe(200);
    expect(saved?.emitenteRazaoSocial).toBe('Fornecedor Modelo LTDA');

    // Verify items were persisted
    const items = await docRepo.findItemsByDocumentId(saved!.id);
    expect(items).toHaveLength(1);
    expect(items[0].descricao).toBe('Produto Teste 1');
  });

  it('should identify and skip duplicate files on re-import', async () => {
    // First import
    await importService.importBatch(
      [{ name: 'nota.xml', content: validNfeXml }],
      companyId
    );

    // Second import of same content
    const secondSummary = await importService.importBatch(
      [{ name: 'nota_copia.xml', content: validNfeXml }],
      companyId
    );

    expect(secondSummary.imported).toBe(0);
    expect(secondSummary.duplicates).toBe(1);
    expect(secondSummary.details[0].status).toBe('duplicado');
  });

  it('should reject invalid or unsupported files', async () => {
    const invalidXml = '<unknownRoot><test>not fiscal</test></unknownRoot>';

    const summary = await importService.importBatch(
      [{ name: 'invalid.xml', content: invalidXml }],
      companyId
    );

    expect(summary.imported).toBe(0);
    expect(summary.rejected).toBe(1);
    expect(summary.details[0].status).toBe('formato_invalido');
  });

  it('should trigger onProgress callback during batch execution', async () => {
    const progressSpy = vi.fn();

    await importService.importBatch(
      [
        { name: 'nfe1.xml', content: validNfeXml },
        { name: 'invalid.txt', content: 'Random text content' }
      ],
      companyId,
      progressSpy
    );

    expect(progressSpy).toHaveBeenCalledTimes(2);
    expect(progressSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ current: 1, total: 2, status: 'importado' })
    );
    expect(progressSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ current: 2, total: 2, status: 'formato_invalido' })
    );
  });

  it('should throw an error when companyId is missing', async () => {
    await expect(
      importService.importBatch([{ name: 'doc.xml', content: validNfeXml }], '')
    ).rejects.toThrow('Nenhuma empresa selecionada');
  });

  it('should import real fixture files using specialized NfeParser and persist all items', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const fixturesDir = path.resolve(__dirname, '../../fixtures/nfe');

    const completaXml = fs.readFileSync(path.join(fixturesDir, 'nfe_completa.xml'), 'utf-8');
    const minimaXml = fs.readFileSync(path.join(fixturesDir, 'nfe_minima.xml'), 'utf-8');
    const multiXml = fs.readFileSync(path.join(fixturesDir, 'nfe_multiplos_itens.xml'), 'utf-8');

    const summary = await importService.importBatch(
      [
        { name: 'nfe_completa.xml', content: completaXml },
        { name: 'nfe_minima.xml', content: minimaXml },
        { name: 'nfe_multiplos_itens.xml', content: multiXml }
      ],
      companyId
    );

    expect(summary.totalFiles).toBe(3);
    expect(summary.imported).toBe(3);
    expect(summary.duplicates).toBe(0);

    // Verify 1st doc items
    const doc1 = await docRepo.findById(summary.details[0].documentId!);
    expect(doc1?.numero).toBe('123');
    expect(doc1?.valorTotal).toBe(10050);
    const items1 = await docRepo.findItemsByDocumentId(doc1!.id);
    expect(items1).toHaveLength(2);
    expect(items1[0].codigo).toBe('NOTE-001');

    // Verify 3rd doc items (5 items)
    const doc3 = await docRepo.findById(summary.details[2].documentId!);
    expect(doc3?.numero).toBe('126');
    const items3 = await docRepo.findItemsByDocumentId(doc3!.id);
    expect(items3).toHaveLength(5);
  });

  it('should import NFS-e fixtures using NfseParser and persist service items', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const fixturesDir = path.resolve(__dirname, '../../fixtures/nfse');

    const nacionalXml = fs.readFileSync(path.join(fixturesDir, 'nfse_nacional.xml'), 'utf-8');
    const abrasfXml = fs.readFileSync(path.join(fixturesDir, 'nfse_abrasf.xml'), 'utf-8');

    const summary = await importService.importBatch(
      [
        { name: 'nfse_nacional.xml', content: nacionalXml },
        { name: 'nfse_abrasf.xml', content: abrasfXml }
      ],
      companyId
    );

    expect(summary.totalFiles).toBe(2);
    expect(summary.imported).toBe(2);
    expect(summary.duplicates).toBe(0);

    // Verify Nacional doc
    const docNac = await docRepo.findById(summary.details[0].documentId!);
    expect(docNac?.tipo).toBe('nfse');
    expect(docNac?.numero).toBe('2024001');
    expect(docNac?.valorTotal).toBe(5000);
    expect(docNac?.valorISS).toBe(250);
    const itemsNac = await docRepo.findItemsByDocumentId(docNac!.id);
    expect(itemsNac).toHaveLength(1);
    expect(itemsNac[0].codigo).toBe('01.07');

    // Verify ABRASF doc
    const docAbr = await docRepo.findById(summary.details[1].documentId!);
    expect(docAbr?.tipo).toBe('nfse');
    expect(docAbr?.numero).toBe('12345');
    expect(docAbr?.valorTotal).toBe(3500);
    expect(docAbr?.valorISS).toBe(105);
  });

  it('should import CT-e fixtures using CteParser and persist transport items', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const fixturesDir = path.resolve(__dirname, '../../fixtures/cte');

    const completoXml = fs.readFileSync(path.join(fixturesDir, 'cte_completo.xml'), 'utf-8');
    const minimoXml = fs.readFileSync(path.join(fixturesDir, 'cte_minimo.xml'), 'utf-8');

    const summary = await importService.importBatch(
      [
        { name: 'cte_completo.xml', content: completoXml },
        { name: 'cte_minimo.xml', content: minimoXml }
      ],
      companyId
    );

    expect(summary.totalFiles).toBe(2);
    expect(summary.imported).toBe(2);
    expect(summary.duplicates).toBe(0);

    // Verify Completo doc
    const docComp = await docRepo.findById(summary.details[0].documentId!);
    expect(docComp?.tipo).toBe('cte');
    expect(docComp?.numero).toBe('501');
    expect(docComp?.valorTotal).toBe(2800);
    expect(docComp?.valorICMS).toBe(336);
    expect(docComp?.chaveAcesso).toBe('35240211222333000181570010000005011778899001');

    const itemsComp = await docRepo.findItemsByDocumentId(docComp!.id);
    expect(itemsComp).toHaveLength(1);
    expect(itemsComp[0].descricao).toContain('SAO PAULO/SP -> RIO DE JANEIRO/RJ');

    // Verify Minimo doc
    const docMin = await docRepo.findById(summary.details[1].documentId!);
    expect(docMin?.tipo).toBe('cte');
    expect(docMin?.numero).toBe('502');
    expect(docMin?.valorTotal).toBe(450);
  });

  it('should import SPED Fiscal fixtures and persist them in sped_files', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const fixturesDir = path.resolve(__dirname, '../../fixtures/sped');

    const completoTxt = fs.readFileSync(path.join(fixturesDir, 'sped_fiscal_completo.txt'), 'utf-8');
    const minimoTxt = fs.readFileSync(path.join(fixturesDir, 'sped_fiscal_minimo.txt'), 'utf-8');

    const summary = await importService.importBatch(
      [
        { name: 'sped_fiscal_completo.txt', content: completoTxt },
        { name: 'sped_fiscal_minimo.txt', content: minimoTxt }
      ],
      companyId
    );

    expect(summary.totalFiles).toBe(2);
    expect(summary.imported).toBe(2);
    expect(summary.duplicates).toBe(0);
    expect(summary.errors).toBe(0);

    // Verify SPED completo in spedRepo
    const spedComp = await spedRepo.findById(summary.details[0].documentId!);
    expect(spedComp).not.toBeNull();
    expect(spedComp?.tipo).toBe('efd_icms_ipi');
    expect(spedComp?.periodo).toBe('202401');
    expect(spedComp?.razaoSocial).toBe('ALPHA COMERCIO DE ELETRONICOS LTDA');
    expect(spedComp?.cnpj).toBe('11222333000181');
    expect(spedComp?.versaoLayout).toBe('018');
    expect(spedComp?.totalRegistros).toBeGreaterThan(10);

    // Verify SPED files list for company
    const companySpeds = await spedRepo.findByCompany(companyId);
    expect(companySpeds).toHaveLength(2);

    // Verify deduplication on re-import
    const reimportSummary = await importService.importBatch(
      [{ name: 'sped_fiscal_completo.txt', content: completoTxt }],
      companyId
    );
    expect(reimportSummary.imported).toBe(0);
    expect(reimportSummary.duplicates).toBe(1);
    expect(reimportSummary.details[0].status).toBe('duplicado');
  });
});

