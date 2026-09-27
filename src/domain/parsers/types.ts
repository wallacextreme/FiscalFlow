/**
 * FiscalFlow — Parser Domain Types
 */

import type { FiscalDocument, DocumentItem, DocumentType } from '../../types/models.ts';

export type DetectedSubType = 
  | 'nfe'
  | 'nfce'
  | 'nfse_nacional'
  | 'nfse_abrasf'
  | 'cte'
  | 'sped_efd_icms_ipi'
  | 'unknown';

export interface DocumentDetectionResult {
  type: DocumentType | 'unknown';
  subType: DetectedSubType;
  version?: string;
  rootTag?: string;
  namespace?: string;
  isXml: boolean;
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

export interface ParseResult {
  document: FiscalDocument;
  items: DocumentItem[];
  warnings: string[];
}

export interface DocumentParser {
  canParse(detection: DocumentDetectionResult): boolean;
  parse(content: string, companyId: string, xmlHash: string): Promise<ParseResult>;
}
