/**
 * FiscalFlow — Import Pipeline Service
 * 
 * Orchestrates parsing, deduplication, hash checking, and persistence.
 */

import { DocumentRepository } from '../database/repositories/document.repository.ts';
import { SpedRepository } from '../database/repositories/sped.repository.ts';
import { DocumentDetector } from '../domain/parsers/detector.ts';
import { BaseXmlParser } from '../domain/parsers/base.parser.ts';
import { NfeParser } from '../domain/parsers/nfe.parser.ts';
import { NfseParser } from '../domain/parsers/nfse.parser.ts';
import { CteParser } from '../domain/parsers/cte.parser.ts';
import { SpedParser } from '../domain/parsers/sped.parser.ts';
import { sha256 } from '../utils/crypto.ts';
import type { ImportDetail, ImportRecord, ImportStatus } from '../types/models.ts';
import { getDb } from '../database/connection.ts';

export interface FileToImport {
  name: string;
  content: string;
}

export interface ImportProgressEvent {
  current: number;
  total: number;
  fileName: string;
  status: ImportStatus;
  message?: string;
}

export interface ImportSummary {
  recordId: string;
  totalFiles: number;
  imported: number;
  duplicates: number;
  rejected: number;
  errors: number;
  details: ImportDetail[];
}

export class ImportService {
  private documentRepo: DocumentRepository;
  private spedRepo: SpedRepository;
  private xmlParser: BaseXmlParser;
  private nfeParser: NfeParser;
  private nfseParser: NfseParser;
  private cteParser: CteParser;
  private spedParser: SpedParser;

  constructor(
    documentRepo?: DocumentRepository, 
    nfeParser?: NfeParser,
    nfseParser?: NfseParser,
    cteParser?: CteParser,
    spedRepo?: SpedRepository,
    spedParser?: SpedParser
  ) {
    this.documentRepo = documentRepo || new DocumentRepository();
    this.spedRepo = spedRepo || new SpedRepository();
    this.xmlParser = new BaseXmlParser();
    this.nfeParser = nfeParser || new NfeParser();
    this.nfseParser = nfseParser || new NfseParser();
    this.cteParser = cteParser || new CteParser();
    this.spedParser = spedParser || new SpedParser();
  }

  /**
   * Run the import pipeline for a list of files
   */
  async importBatch(
    files: FileToImport[],
    companyId: string,
    onProgress?: (event: ImportProgressEvent) => void
  ): Promise<ImportSummary> {
    if (!companyId) {
      throw new Error('Nenhuma empresa selecionada para importação.');
    }

    if (!files || files.length === 0) {
      throw new Error('Nenhum arquivo fornecido para importação.');
    }

    const details: ImportDetail[] = [];
    let imported = 0;
    let duplicates = 0;
    let rejected = 0;
    let errors = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let status: ImportStatus = 'erro';
      let message: string | undefined = undefined;
      let documentId: string | undefined = undefined;

      try {
        // 1. Calculate SHA-256 hash
        const hash = await sha256(file.content);

        // 2. Detect format
        const detection = DocumentDetector.detect(file.content);
        if (detection.type === 'unknown' || (!detection.isXml && detection.type !== 'sped')) {
          status = 'formato_invalido';
          message = detection.error || 'Formato de arquivo não suportado';
          rejected++;
          details.push({ nomeArquivo: file.name, status, mensagem: message });
          onProgress?.({ current: i + 1, total: files.length, fileName: file.name, status, message });
          continue;
        }

        // 3. Handle SPED Fiscal file
        if (detection.type === 'sped') {
          // Check for duplicate by content hash in sped_files
          const existingSped = await this.spedRepo.findByHash(companyId, hash);
          if (existingSped) {
            status = 'duplicado';
            message = `Arquivo SPED já importado anteriormente (Período: ${existingSped.periodo})`;
            duplicates++;
            details.push({ nomeArquivo: file.name, status, mensagem: message, documentId: existingSped.id });
            onProgress?.({ current: i + 1, total: files.length, fileName: file.name, status, message });
            continue;
          }

          // Parse and persist SPED
          const parseResult = await this.spedParser.parse(file.content, companyId, hash);
          const savedSped = await this.spedRepo.create(parseResult.spedFile);
          status = 'importado';
          documentId = savedSped.id;
          imported++;

          details.push({
            nomeArquivo: file.name,
            status,
            mensagem: message,
            documentId
          });
          onProgress?.({
            current: i + 1,
            total: files.length,
            fileName: file.name,
            status,
            message
          });
          continue;
        }

        // 4. Handle XML Fiscal Documents (NF-e, NFC-e, NFS-e, CT-e)
        // Check for duplicate by content hash in fiscal_documents
        const existingByHash = await this.documentRepo.findByHash(companyId, hash);
        if (existingByHash) {
          status = 'duplicado';
          message = `Documento já importado anteriormente (Número: ${existingByHash.numero})`;
          duplicates++;
          details.push({ nomeArquivo: file.name, status, mensagem: message, documentId: existingByHash.id });
          onProgress?.({ current: i + 1, total: files.length, fileName: file.name, status, message });
          continue;
        }

        // 5. Parse XML document
        let parseResult;
        if (this.nfeParser.canParse(detection)) {
          parseResult = await this.nfeParser.parse(file.content, companyId, hash);
        } else if (this.nfseParser.canParse(detection)) {
          parseResult = await this.nfseParser.parse(file.content, companyId, hash, detection);
        } else if (this.cteParser.canParse(detection)) {
          parseResult = await this.cteParser.parse(file.content, companyId, hash);
        } else {
          parseResult = await this.xmlParser.parse(file.content, companyId, hash, detection);
        }

        // 6. Check duplicate by Access Key if available
        if (parseResult.document.chaveAcesso) {
          const existingByChave = await this.documentRepo.findByChaveAcesso(companyId, parseResult.document.chaveAcesso);
          if (existingByChave) {
            status = 'duplicado';
            message = `Documento com a mesma chave de acesso já existe (Número: ${existingByChave.numero})`;
            duplicates++;
            details.push({ nomeArquivo: file.name, status, mensagem: message, documentId: existingByChave.id });
            onProgress?.({ current: i + 1, total: files.length, fileName: file.name, status, message });
            continue;
          }
        }

        // 7. Persist document and items
        const saved = await this.documentRepo.create(parseResult.document, parseResult.items);
        status = 'importado';
        documentId = saved.id;
        imported++;
      } catch (err) {
        status = 'erro';
        message = err instanceof Error ? err.message : String(err);
        errors++;
      }

      details.push({
        nomeArquivo: file.name,
        status,
        mensagem: message,
        documentId
      });

      onProgress?.({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        status,
        message
      });
    }

    // 7. Save batch execution in import_records
    const recordId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `imp-${Date.now()}`;
    await this.persistImportRecord({
      id: recordId,
      companyId,
      dataImportacao: new Date().toISOString(),
      totalArquivos: files.length,
      importados: imported,
      rejeitados: duplicates + rejected,
      erros: errors,
      detalhes: details
    });

    return {
      recordId,
      totalFiles: files.length,
      imported,
      duplicates,
      rejected,
      errors,
      details
    };
  }

  private async persistImportRecord(record: ImportRecord): Promise<void> {
    try {
      const db = getDb();
      await db.execute(
        `INSERT INTO import_records (id, company_id, data_importacao, total_arquivos, importados, rejeitados, erros, detalhes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.companyId,
          record.dataImportacao,
          record.totalArquivos,
          record.importados,
          record.rejeitados,
          record.erros,
          JSON.stringify(record.detalhes)
        ]
      );
    } catch (err) {
      console.warn('Failed to persist import_records entry:', err);
    }
  }
}

export const importService = new ImportService();
