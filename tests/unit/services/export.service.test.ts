import { describe, it, expect } from 'vitest';
import { ExportService } from '../../../src/services/export.service.ts';
import type { FiscalDocument, DocumentItem, SpedFile } from '../../../src/types/models.ts';
import JSZip from 'jszip';

describe('ExportService', () => {
  const exportService = new ExportService();

  const mockDocuments: FiscalDocument[] = [
    {
      id: 'doc-1',
      companyId: 'comp-1',
      tipo: 'nfe',
      numero: '1001',
      serie: '1',
      dataEmissao: '2026-01-15T12:00:00-03:00',
      chaveAcesso: '35240111222333000181550010000000011000000015',
      valorTotal: 1250.5,
      emitenteCnpjCpf: '11222333000181',
      emitenteRazaoSocial: 'Empresa Teste & Cia; LTDA',
      emitenteUf: 'SP',
      destinatarioCnpjCpf: '99888777000166',
      destinatarioRazaoSocial: 'Cliente "Especial" SA',
      destinatarioUf: 'RJ',
      valorICMS: 225.09,
      valorIPI: 50.0,
      valorPIS: 20.63,
      valorCOFINS: 95.04,
      valorISS: 0,
      situacao: 'autorizada',
      xmlOriginal: '<nfeProc versao="4.00"><NFe><infNFe>XML Conteudo 1</infNFe></NFe></nfeProc>',
      xmlHash: 'hash-doc-1',
      nfeVersao: '4.00',
      naturezaOperacao: 'VENDA DE MERCADORIAS',
      createdAt: '2026-01-15T12:00:00Z',
      updatedAt: '2026-01-15T12:00:00Z'
    },
    {
      id: 'doc-2',
      companyId: 'comp-1',
      tipo: 'nfse',
      numero: '2024001',
      dataEmissao: '2026-01-20T14:30:00-03:00',
      valorTotal: 500.0,
      emitenteCnpjCpf: '11222333000181',
      emitenteRazaoSocial: 'Empresa Teste',
      emitenteUf: 'SP',
      destinatarioCnpjCpf: '55444333000122',
      destinatarioRazaoSocial: 'Tomador Serviços',
      destinatarioUf: 'MG',
      valorISS: 25.0,
      situacao: 'autorizada',
      xmlOriginal: '<nfse>XML Conteudo 2</nfse>',
      xmlHash: 'hash-doc-2',
      createdAt: '2026-01-20T14:30:00Z',
      updatedAt: '2026-01-20T14:30:00Z'
    }
  ];

  const mockItems: DocumentItem[] = [
    {
      id: 'item-1',
      documentId: 'doc-1',
      numeroItem: 1,
      codigo: 'PROD-01',
      descricao: 'Servidor Rack 1U; com processador',
      ncm: '84715010',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 2,
      valorUnitario: 625.25,
      valorTotal: 1250.5,
      baseCalculoICMS: 1250.5,
      valorICMS: 225.09,
      aliquotaICMS: 18,
      valorIPI: 50,
      valorPIS: 20.63,
      valorCOFINS: 95.04,
      cst: '00',
      origem: '0'
    }
  ];

  it('should export documents list to valid Brazilian CSV with BOM, semicolon and escaped values', () => {
    const csv = exportService.exportDocumentsToCsv(mockDocuments);

    // Starts with UTF-8 BOM
    expect(csv.startsWith('\uFEFF')).toBe(true);

    const lines = csv.substring(1).split(/\r?\n/);
    expect(lines.length).toBe(3); // header + 2 rows

    // Header check
    const header = lines[0];
    expect(header).toContain('Tipo;Número;Série;Data Emissão;Chave de Acesso');
    expect(header).toContain('Valor Total;Valor ICMS');

    // Row 1 values and escaping
    const row1 = lines[1];
    expect(row1).toContain('NFE;1001;1');
    expect(row1).toContain('35240111222333000181550010000000011000000015');
    // Semicolon in string escaped with quotes
    expect(row1).toContain('"Empresa Teste & Cia; LTDA"');
    // Quotes in string escaped
    expect(row1).toContain('"Cliente ""Especial"" SA"');
    // Decimal comma in numbers
    expect(row1).toContain('1250,50');
    expect(row1).toContain('225,09');

    // Row 2 values
    const row2 = lines[2];
    expect(row2).toContain('NFSE;2024001');
    expect(row2).toContain('500,00');
    expect(row2).toContain('25,00');
  });

  it('should export line items to analytical CSV with document mapping', () => {
    const docMap = new Map<string, FiscalDocument>();
    docMap.set('doc-1', mockDocuments[0]);

    const csv = exportService.exportItemsToCsv(mockItems, docMap);

    expect(csv.startsWith('\uFEFF')).toBe(true);

    const lines = csv.substring(1).split(/\r?\n/);
    expect(lines.length).toBe(2); // header + 1 item

    const header = lines[0];
    expect(header).toContain('Documento Número;Documento Tipo;Item Nº;Código;Descrição;NCM;CFOP');

    const row = lines[1];
    expect(row).toContain('1001;NFE;1;PROD-01');
    expect(row).toContain('"Servidor Rack 1U; com processador"');
    expect(row).toContain('84715010;5102;UN');
    expect(row).toContain('625,25;1250,50');
    expect(row).toContain('18,00;50,00;20,63;95,04');
  });

  it('should package XML documents into a valid ZIP archive with manifest', async () => {
    let progressCalls = 0;
    const blob = await exportService.exportDocumentsToZip(mockDocuments, (curr, tot) => {
      progressCalls++;
      expect(curr).toBeLessThanOrEqual(tot);
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(100);
    expect(progressCalls).toBe(2);

    // Verify ZIP contents using JSZip
    const buffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    // Verify manifest
    const manifestFile = zip.file('manifesto_exportacao.txt');
    expect(manifestFile).not.toBeNull();
    const manifestContent = await manifestFile!.async('string');
    expect(manifestContent).toContain('FiscalFlow — Manifesto de Exportação');
    expect(manifestContent).toContain('1001');
    expect(manifestContent).toContain('2024001');

    // Verify XML files inside XMLs folder
    const xml1 = zip.file('XMLs/NFE_1001_35240111222333000181550010000000011000000015.xml');
    expect(xml1).not.toBeNull();
    const content1 = await xml1!.async('string');
    expect(content1).toBe(mockDocuments[0].xmlOriginal);

    const xml2 = zip.file('XMLs/NFSE_2024001_doc-2.xml');
    expect(xml2).not.toBeNull();
    const content2 = await xml2!.async('string');
    expect(content2).toBe(mockDocuments[1].xmlOriginal);
  });

  it('should package SPED files into a valid ZIP archive', async () => {
    const mockSpeds: SpedFile[] = [
      {
        id: 'sped-1',
        companyId: 'comp-1',
        tipo: 'efd_icms_ipi',
        periodo: '202601',
        dataInicio: '2026-01-01',
        dataFim: '2026-01-31',
        cnpj: '11222333000181',
        razaoSocial: 'Empresa Teste',
        versaoLayout: '018',
        finalidade: 'original',
        conteudoOriginal: '|0000|018|0|01012026|31012026|Empresa Teste|...',
        conteudoHash: 'hash-sped-1',
        totalRegistros: 120,
        createdAt: '2026-02-01',
        updatedAt: '2026-02-01'
      }
    ];

    const blob = await exportService.exportSpedFilesToZip(mockSpeds);
    expect(blob).toBeInstanceOf(Blob);

    const buffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const file = zip.file('SPED_EFD_11222333000181_202601.txt');
    expect(file).not.toBeNull();
    const text = await file!.async('string');
    expect(text).toBe(mockSpeds[0].conteudoOriginal);
  });
});
