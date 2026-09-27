/**
 * FiscalFlow — Document Type Detector
 * 
 * Automatically detects Brazilian fiscal document formats (NF-e, NFC-e, NFS-e, CT-e, SPED)
 * based on file content, root tags, and namespaces.
 */

import type { DocumentDetectionResult } from './types.ts';

export class DocumentDetector {
  /**
   * Detect document type and sub-type from text content
   */
  static detect(rawContent: string): DocumentDetectionResult {
    if (!rawContent || rawContent.trim().length === 0) {
      return {
        type: 'unknown',
        subType: 'unknown',
        isXml: false,
        confidence: 'low',
        error: 'Arquivo vazio'
      };
    }

    // Strip Byte Order Mark (BOM) and leading whitespace
    const content = rawContent.replace(/^\uFEFF/, '').trim();

    // 1. Check for SPED Fiscal (pipe-delimited text starting with |0000|)
    if (content.startsWith('|0000|') || /^\|0000\|/m.test(content)) {
      const match = content.match(/^\|0000\|([^|]+)\|/m);
      const version = match ? match[1] : undefined;

      return {
        type: 'sped',
        subType: 'sped_efd_icms_ipi',
        version,
        isXml: false,
        confidence: 'high'
      };
    }

    // 2. Check for XML
    const isXml = content.startsWith('<?xml') || content.startsWith('<');
    if (!isXml) {
      return {
        type: 'unknown',
        subType: 'unknown',
        isXml: false,
        confidence: 'low',
        error: 'Arquivo não possui formato XML nem SPED reconhecido'
      };
    }

    // Extract root element and namespace using tolerant regex
    const rootTagMatch = content.match(/<([a-zA-Z0-9_:-]+)(\s|>)/);
    const rootTag = rootTagMatch ? rootTagMatch[1].replace(/^[a-zA-Z0-9_]+:/, '') : undefined;

    // Check version attribute if present (e.g. versao="4.00")
    const versionMatch = content.match(/versao\s*=\s*["']([^"']+)["']/i);
    const version = versionMatch ? versionMatch[1] : undefined;

    // A. NF-e / NFC-e Check
    // Typical tags: <nfeProc>, <NFe>, <infNFe>
    if (
      rootTag === 'nfeProc' || 
      rootTag === 'NFe' || 
      content.includes('<infNFe') ||
      content.includes('http://www.portalfiscal.inf.br/nfe')
    ) {
      // Differentiate between NF-e (mod 55) and NFC-e (mod 65)
      // Check <mod>65</mod> or chave de acesso containing mod 65
      const modMatch = content.match(/<mod>(\d{2})<\/mod>/i);
      const mod = modMatch ? modMatch[1] : null;

      if (mod === '65' || content.includes('tpAmb') && content.includes('<mod>65</mod>')) {
        return {
          type: 'nfce',
          subType: 'nfce',
          version: version || '4.00',
          rootTag,
          namespace: 'http://www.portalfiscal.inf.br/nfe',
          isXml: true,
          confidence: 'high'
        };
      }

      return {
        type: 'nfe',
        subType: 'nfe',
        version: version || '4.00',
        rootTag,
        namespace: 'http://www.portalfiscal.inf.br/nfe',
        isXml: true,
        confidence: 'high'
      };
    }

    // B. CT-e Check (Conhecimento de Transporte Eletrônico)
    // Typical tags: <cteProc>, <CTe>, <infCte>
    if (
      rootTag === 'cteProc' || 
      rootTag === 'CTe' || 
      content.includes('<infCte') ||
      content.includes('http://www.portalfiscal.inf.br/cte')
    ) {
      return {
        type: 'cte',
        subType: 'cte',
        version: version || '4.00',
        rootTag,
        namespace: 'http://www.portalfiscal.inf.br/cte',
        isXml: true,
        confidence: 'high'
      };
    }

    // C. NFS-e Check (Nota Fiscal de Serviços Eletrônica)
    // Padrão Nacional:
    if (
      content.includes('sped.fazenda.gov.br/nfse') || 
      content.includes('<infNFSe') || 
      content.includes('<infDPS') || 
      content.includes('<DPS')
    ) {
      return {
        type: 'nfse',
        subType: 'nfse_nacional',
        version,
        rootTag,
        namespace: 'http://www.sped.fazenda.gov.br/nfse',
        isXml: true,
        confidence: 'high'
      };
    }

    // Padrão ABRASF:
    if (
      content.includes('abrasf') || 
      rootTag === 'CompNfse' || 
      rootTag === 'ConsultarNfseResposta' || 
      content.includes('<CompNfse') || 
      content.includes('<tcCompNfse') || 
      content.includes('<tcDeclaracaoPrestacaoServico') ||
      content.includes('<Nfse')
    ) {
      return {
        type: 'nfse',
        subType: 'nfse_abrasf',
        version: version || '2.04',
        rootTag,
        isXml: true,
        confidence: 'high'
      };
    }

    // D. Unrecognized XML structure
    return {
      type: 'unknown',
      subType: 'unknown',
      rootTag,
      isXml: true,
      confidence: 'low',
      error: `Estrutura XML não reconhecida (tag raiz: <${rootTag || 'desconhecida'}>)`
    };
  }
}
