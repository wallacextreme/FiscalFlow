import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';
import { DocumentRepository } from '../../../src/database/repositories/document.repository.ts';
import { SpedRepository } from '../../../src/database/repositories/sped.repository.ts';
import { DashboardService } from '../../../src/services/dashboard.service.ts';
import { setDatabase } from '../../../src/database/connection.ts';
import type { FiscalDocument, SpedFile } from '../../../src/types/models.ts';

describe('DashboardService', () => {
  let db: NodeSqliteAdapter;
  let docRepo: DocumentRepository;
  let spedRepo: SpedRepository;
  let dashboardService: DashboardService;

  const companyId = 'comp-dash-1';
  const companyCnpj = '11222333000181';

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    setDatabase(db);

    const compRepo = new CompanyRepository(db);
    await compRepo.create({
      id: companyId,
      cnpj: companyCnpj,
      razaoSocial: 'Xtreme Sistemas e Tecnologia LTDA',
      ativa: true
    });

    docRepo = new DocumentRepository(db);
    spedRepo = new SpedRepository(db);
    dashboardService = new DashboardService(docRepo, spedRepo);
  });

  afterEach(async () => {
    await db.close();
    setDatabase(null);
  });

  it('should return zeroed metrics when company has no documents or SPED files', async () => {
    const metrics = await dashboardService.getMetrics(companyId, companyCnpj);

    expect(metrics.totalDocs).toBe(0);
    expect(metrics.totalFiscalDocs).toBe(0);
    expect(metrics.totalSpedFiles).toBe(0);
    expect(metrics.totalValor).toBe(0);
    expect(metrics.entradas.total).toBe(0);
    expect(metrics.entradas.count).toBe(0);
    expect(metrics.saidas.total).toBe(0);
    expect(metrics.saidas.count).toBe(0);
    expect(metrics.impostos.total).toBe(0);
    expect(metrics.evolucaoMensal).toHaveLength(0);
    expect(metrics.topFornecedores).toHaveLength(0);
    expect(metrics.topClientes).toHaveLength(0);
    expect(metrics.documentosRecentes).toHaveLength(0);
    expect(metrics.ultimoSped).toBeUndefined();
  });

  it('should calculate correct totals, inputs and outputs based on company CNPJ', async () => {
    // 1. Saída (Empresa é emitente -> Venda)
    const docSaida: FiscalDocument = {
      id: 'doc-saida-1',
      companyId,
      tipo: 'nfe',
      numero: '101',
      dataEmissao: '2026-01-10T10:00:00-03:00',
      valorTotal: 1500,
      emitenteCnpjCpf: companyCnpj,
      emitenteRazaoSocial: 'Xtreme Sistemas e Tecnologia LTDA',
      destinatarioCnpjCpf: '99888777000166',
      destinatarioRazaoSocial: 'Cliente Alpha SA',
      valorICMS: 270,
      valorPIS: 24.75,
      valorCOFINS: 114,
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'hash1',
      createdAt: '2026-01-10T10:05:00Z',
      updatedAt: '2026-01-10T10:05:00Z'
    };

    // 2. Entrada (Empresa é destinatária -> Compra)
    const docEntrada: FiscalDocument = {
      id: 'doc-entrada-1',
      companyId,
      tipo: 'nfe',
      numero: '202',
      dataEmissao: '2026-01-15T14:00:00-03:00',
      valorTotal: 800,
      emitenteCnpjCpf: '44555666000122',
      emitenteRazaoSocial: 'Fornecedor Beta LTDA',
      destinatarioCnpjCpf: companyCnpj,
      destinatarioRazaoSocial: 'Xtreme Sistemas e Tecnologia LTDA',
      valorICMS: 144,
      valorIPI: 40,
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'hash2',
      createdAt: '2026-01-15T14:05:00Z',
      updatedAt: '2026-01-15T14:05:00Z'
    };

    // 3. Documento Cancelado (não deve somar no financeiro)
    const docCancelado: FiscalDocument = {
      id: 'doc-canc-1',
      companyId,
      tipo: 'nfe',
      numero: '303',
      dataEmissao: '2026-01-20T16:00:00-03:00',
      valorTotal: 5000,
      emitenteCnpjCpf: companyCnpj,
      emitenteRazaoSocial: 'Xtreme Sistemas e Tecnologia LTDA',
      destinatarioCnpjCpf: '99888777000166',
      destinatarioRazaoSocial: 'Cliente Alpha SA',
      valorICMS: 900,
      situacao: 'cancelada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'hash3',
      createdAt: '2026-01-20T16:05:00Z',
      updatedAt: '2026-01-20T16:05:00Z'
    };

    await docRepo.create(docSaida);
    await docRepo.create(docEntrada);
    await docRepo.create(docCancelado);

    const metrics = await dashboardService.getMetrics(companyId, companyCnpj);

    expect(metrics.totalDocs).toBe(3);
    expect(metrics.totalFiscalDocs).toBe(3);
    expect(metrics.totalValor).toBe(2300); // 1500 + 800 (cancelado = 0)
    expect(metrics.saidas.total).toBe(1500);
    expect(metrics.saidas.count).toBe(2); // 1 autorizada + 1 cancelada em contagem
    expect(metrics.entradas.total).toBe(800);
    expect(metrics.entradas.count).toBe(1);

    // Impostos
    expect(metrics.impostos.icms).toBe(414); // 270 + 144
    expect(metrics.impostos.pis).toBe(24.75);
    expect(metrics.impostos.cofins).toBe(114);
    expect(metrics.impostos.ipi).toBe(40);
    expect(metrics.impostos.total).toBe(592.75);
  });

  it('should include SPED files in distribution and identify latest SPED', async () => {
    const spedFile: SpedFile = {
      id: 'sped-test-1',
      companyId,
      tipo: 'efd_icms_ipi',
      periodo: '202601',
      dataInicio: '2026-01-01',
      dataFim: '2026-01-31',
      cnpj: companyCnpj,
      razaoSocial: 'Xtreme Sistemas',
      versaoLayout: '018',
      finalidade: 'original',
      conteudoOriginal: '|0000|018|...',
      conteudoHash: 'spedhash123',
      totalRegistros: 450,
      createdAt: '2026-02-05T12:00:00Z',
      updatedAt: '2026-02-05T12:00:00Z'
    };

    await spedRepo.create(spedFile);

    const metrics = await dashboardService.getMetrics(companyId, companyCnpj);

    expect(metrics.totalDocs).toBe(1);
    expect(metrics.totalSpedFiles).toBe(1);
    expect(metrics.ultimoSped).not.toBeUndefined();
    expect(metrics.ultimoSped?.periodo).toBe('202601');

    const spedDist = metrics.distribuicaoTipos.find(t => t.tipo === 'sped');
    expect(spedDist).toBeDefined();
    expect(spedDist?.count).toBe(1);
    expect(spedDist?.percentage).toBe(100);
  });

  it('should rank top suppliers and top clients correctly', async () => {
    // 2 Saídas para clientes diferentes
    await docRepo.create({
      id: 's1',
      companyId,
      tipo: 'nfe',
      numero: '1',
      dataEmissao: '2026-02-01',
      valorTotal: 5000,
      emitenteCnpjCpf: companyCnpj,
      emitenteRazaoSocial: 'Xtreme',
      destinatarioCnpjCpf: '11111111000101',
      destinatarioRazaoSocial: 'Cliente Maior SA',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'h1',
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01'
    });

    await docRepo.create({
      id: 's2',
      companyId,
      tipo: 'nfe',
      numero: '2',
      dataEmissao: '2026-02-02',
      valorTotal: 2000,
      emitenteCnpjCpf: companyCnpj,
      emitenteRazaoSocial: 'Xtreme',
      destinatarioCnpjCpf: '22222222000102',
      destinatarioRazaoSocial: 'Cliente Menor LTDA',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'h2',
      createdAt: '2026-02-02',
      updatedAt: '2026-02-02'
    });

    // 1 Entrada de fornecedor
    await docRepo.create({
      id: 'e1',
      companyId,
      tipo: 'nfe',
      numero: '3',
      dataEmissao: '2026-02-03',
      valorTotal: 3400,
      emitenteCnpjCpf: '33333333000103',
      emitenteRazaoSocial: 'Fornecedor Principal',
      destinatarioCnpjCpf: companyCnpj,
      destinatarioRazaoSocial: 'Xtreme',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'h3',
      createdAt: '2026-02-03',
      updatedAt: '2026-02-03'
    });

    const metrics = await dashboardService.getMetrics(companyId, companyCnpj);

    expect(metrics.topClientes).toHaveLength(2);
    expect(metrics.topClientes[0].razaoSocial).toBe('Cliente Maior SA');
    expect(metrics.topClientes[0].total).toBe(5000);
    expect(metrics.topClientes[1].razaoSocial).toBe('Cliente Menor LTDA');
    expect(metrics.topClientes[1].total).toBe(2000);

    expect(metrics.topFornecedores).toHaveLength(1);
    expect(metrics.topFornecedores[0].razaoSocial).toBe('Fornecedor Principal');
    expect(metrics.topFornecedores[0].total).toBe(3400);

    // Monthly trend
    expect(metrics.evolucaoMensal).toHaveLength(1);
    expect(metrics.evolucaoMensal[0].mes).toBe('2026-02');
    expect(metrics.evolucaoMensal[0].saidas).toBe(7000);
    expect(metrics.evolucaoMensal[0].entradas).toBe(3400);
    expect(metrics.evolucaoMensal[0].total).toBe(10400);
  });

  it('should throw an error when companyId is missing', async () => {
    await expect(dashboardService.getMetrics('', companyCnpj)).rejects.toThrow('ID da empresa é obrigatório');
  });

  it('should correctly calculate document distribution across NF-e, NFC-e, NFS-e, and CT-e', async () => {
    await docRepo.create({
      id: 'd-nfe',
      companyId,
      tipo: 'nfe',
      numero: '1',
      dataEmissao: '2026-03-01',
      valorTotal: 1000,
      emitenteCnpjCpf: companyCnpj,
      emitenteRazaoSocial: 'Xtreme',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'h-nfe',
      createdAt: '2026-03-01',
      updatedAt: '2026-03-01'
    });

    await docRepo.create({
      id: 'd-nfce',
      companyId,
      tipo: 'nfce',
      numero: '2',
      dataEmissao: '2026-03-02',
      valorTotal: 50,
      emitenteCnpjCpf: companyCnpj,
      emitenteRazaoSocial: 'Xtreme',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'h-nfce',
      createdAt: '2026-03-02',
      updatedAt: '2026-03-02'
    });

    await docRepo.create({
      id: 'd-nfse',
      companyId,
      tipo: 'nfse',
      numero: '3',
      dataEmissao: '2026-03-03',
      valorTotal: 500,
      emitenteCnpjCpf: companyCnpj,
      emitenteRazaoSocial: 'Xtreme',
      valorISS: 25,
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'h-nfse',
      createdAt: '2026-03-03',
      updatedAt: '2026-03-03'
    });

    await docRepo.create({
      id: 'd-cte',
      companyId,
      tipo: 'cte',
      numero: '4',
      dataEmissao: '2026-03-04',
      valorTotal: 300,
      emitenteCnpjCpf: '99999999000199',
      emitenteRazaoSocial: 'Transportadora',
      destinatarioCnpjCpf: companyCnpj,
      destinatarioRazaoSocial: 'Xtreme',
      valorICMS: 36,
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'h-cte',
      createdAt: '2026-03-04',
      updatedAt: '2026-03-04'
    });

    const metrics = await dashboardService.getMetrics(companyId, companyCnpj);

    expect(metrics.totalDocs).toBe(4);
    expect(metrics.totalValor).toBe(1850);
    expect(metrics.impostos.iss).toBe(25);
    expect(metrics.impostos.icms).toBe(36);

    const nfe = metrics.distribuicaoTipos.find(t => t.tipo === 'nfe');
    const nfce = metrics.distribuicaoTipos.find(t => t.tipo === 'nfce');
    const nfse = metrics.distribuicaoTipos.find(t => t.tipo === 'nfse');
    const cte = metrics.distribuicaoTipos.find(t => t.tipo === 'cte');

    expect(nfe?.count).toBe(1);
    expect(nfce?.count).toBe(1);
    expect(nfse?.count).toBe(1);
    expect(cte?.count).toBe(1);

    expect(metrics.documentosRecentes).toHaveLength(4);
  });
});

