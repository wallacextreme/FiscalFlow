/**
 * FiscalFlow — Accounting and Operational Export Service
 * 
 * Provides:
 * - Structured Brazilian CSV exports (semicolon delimited, UTF-8 BOM, Excel/Calc compatible)
 * - Line item analytical CSV exports
 * - Batch XML ZIP packaging with manifest for accounting audits
 * - SPED Fiscal digital packaging
 * - Native desktop save via Tauri dialog/fs with browser fallback
 */

import JSZip from 'jszip';
import type { FiscalDocument, DocumentItem, SpedFile } from '../types/models.ts';

export class ExportService {
  /**
   * Export fiscal documents list to Brazilian Excel-compatible CSV
   */
  exportDocumentsToCsv(documents: FiscalDocument[]): string {
    const headers = [
      'ID',
      'Tipo',
      'Número',
      'Série',
      'Data Emissão',
      'Chave de Acesso',
      'Situação',
      'Natureza Operação',
      'Emitente CNPJ/CPF',
      'Emitente Razão Social',
      'Emitente UF',
      'Destinatário CNPJ/CPF',
      'Destinatário Razão Social',
      'Destinatário UF',
      'Valor Total',
      'Valor ICMS',
      'Valor IPI',
      'Valor PIS',
      'Valor COFINS',
      'Valor ISS',
      'Versão Layout',
      'Hash SHA-256'
    ];

    const lines: string[] = [headers.join(';')];

    for (const doc of documents) {
      const row = [
        this.escapeCsv(doc.id),
        this.escapeCsv(doc.tipo.toUpperCase()),
        this.escapeCsv(doc.numero),
        this.escapeCsv(doc.serie || ''),
        this.escapeCsv(doc.dataEmissao),
        this.escapeCsv(doc.chaveAcesso || ''),
        this.escapeCsv(doc.situacao),
        this.escapeCsv(doc.naturezaOperacao || ''),
        this.escapeCsv(doc.emitenteCnpjCpf),
        this.escapeCsv(doc.emitenteRazaoSocial),
        this.escapeCsv(doc.emitenteUf || ''),
        this.escapeCsv(doc.destinatarioCnpjCpf || ''),
        this.escapeCsv(doc.destinatarioRazaoSocial || ''),
        this.escapeCsv(doc.destinatarioUf || ''),
        this.formatFloatPtBr(doc.valorTotal),
        this.formatFloatPtBr(doc.valorICMS || 0),
        this.formatFloatPtBr(doc.valorIPI || 0),
        this.formatFloatPtBr(doc.valorPIS || 0),
        this.formatFloatPtBr(doc.valorCOFINS || 0),
        this.formatFloatPtBr(doc.valorISS || 0),
        this.escapeCsv(doc.nfeVersao || ''),
        this.escapeCsv(doc.xmlHash)
      ];

      lines.push(row.join(';'));
    }

    // Prefix with UTF-8 BOM (\uFEFF) for immediate Excel recognition
    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Export document line items to analytical CSV
   */
  exportItemsToCsv(items: DocumentItem[], documentsMap?: Map<string, FiscalDocument>): string {
    const headers = [
      'Documento ID',
      'Documento Número',
      'Documento Tipo',
      'Item Nº',
      'Código',
      'Descrição',
      'NCM',
      'CFOP',
      'Unidade',
      'Quantidade',
      'Valor Unitário',
      'Valor Total',
      'Base ICMS',
      'Valor ICMS',
      'Alíquota ICMS',
      'Valor IPI',
      'Valor PIS',
      'Valor COFINS',
      'CST',
      'Origem'
    ];

    const lines: string[] = [headers.join(';')];

    for (const item of items) {
      const doc = documentsMap?.get(item.documentId);

      const row = [
        this.escapeCsv(item.documentId),
        this.escapeCsv(doc?.numero || ''),
        this.escapeCsv(doc ? doc.tipo.toUpperCase() : ''),
        item.numeroItem.toString(),
        this.escapeCsv(item.codigo || ''),
        this.escapeCsv(item.descricao),
        this.escapeCsv(item.ncm || ''),
        this.escapeCsv(item.cfop || ''),
        this.escapeCsv(item.unidade || 'UN'),
        this.formatFloatPtBr(item.quantidade),
        this.formatFloatPtBr(item.valorUnitario),
        this.formatFloatPtBr(item.valorTotal),
        this.formatFloatPtBr(item.baseCalculoICMS || 0),
        this.formatFloatPtBr(item.valorICMS || 0),
        this.formatFloatPtBr(item.aliquotaICMS || 0),
        this.formatFloatPtBr(item.valorIPI || 0),
        this.formatFloatPtBr(item.valorPIS || 0),
        this.formatFloatPtBr(item.valorCOFINS || 0),
        this.escapeCsv(item.cst || ''),
        this.escapeCsv(item.origem || '')
      ];

      lines.push(row.join(';'));
    }

    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Package fiscal documents into a ZIP archive with manifest
   */
  async exportDocumentsToZip(
    documents: FiscalDocument[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder('XMLs') || zip;

    let manifest = '============================================================\r\n';
    manifest += 'FiscalFlow — Manifesto de Exportação para Contabilidade\r\n';
    manifest += '============================================================\r\n';
    manifest += `Data da Exportação: ${new Date().toISOString()}\r\n`;
    manifest += `Total de Documentos no Pacote: ${documents.length}\r\n\r\n`;
    manifest += 'ARQUIVOS INCLUÍDOS:\r\n';
    manifest += 'Nº | TIPO | DATA | CHAVE DE ACESSO | VALOR | HASH SHA-256\r\n';
    manifest += '------------------------------------------------------------\r\n';

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const filename = `${doc.tipo.toUpperCase()}_${doc.numero}_${doc.chaveAcesso || doc.id}.xml`;
      folder.file(filename, doc.xmlOriginal);

      manifest += `${doc.numero} | ${doc.tipo.toUpperCase()} | ${doc.dataEmissao} | ${doc.chaveAcesso || '-'} | R$ ${doc.valorTotal.toFixed(2)} | ${doc.xmlHash}\r\n`;
      onProgress?.(i + 1, documents.length);
    }

    zip.file('manifesto_exportacao.txt', manifest);

    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  }

  /**
   * Package SPED Fiscal files into a ZIP archive
   */
  async exportSpedFilesToZip(spedFiles: SpedFile[]): Promise<Blob> {
    const zip = new JSZip();

    for (const sped of spedFiles) {
      const filename = `SPED_EFD_${sped.cnpj}_${sped.periodo}.txt`;
      zip.file(filename, sped.conteudoOriginal);
    }

    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  }

  /**
   * Save a blob using native Tauri dialog if available, with browser fallback
   */
  async saveBlobFile(
    blob: Blob, 
    defaultFilename: string, 
    filters?: { name: string; extensions: string[] }[]
  ): Promise<string | null> {
    // 1. Check if Tauri native save dialog is available
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');

        const filePath = await save({
          defaultPath: defaultFilename,
          filters: filters && filters.length > 0 ? filters : [
            {
              name: 'Arquivo Exportado',
              extensions: [defaultFilename.split('.').pop() || '*']
            }
          ]
        });

        if (filePath) {
          const arrayBuffer = await blob.arrayBuffer();
          await writeFile(filePath, new Uint8Array(arrayBuffer));
          return filePath;
        }

        return null; // Cancelled by user
      }
    } catch (err) {
      console.warn('Native Tauri save dialog unavailable, falling back to browser download:', err);
    }

    // 2. Browser fallback
    this.triggerBrowserDownload(blob, defaultFilename);
    return defaultFilename;
  }

  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: string): string {
    if (!value) return '';
    const str = String(value);
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private formatFloatPtBr(value: number): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0,00';
    }
    return value.toFixed(2).replace('.', ',');
  }
}

export const exportService = new ExportService();
