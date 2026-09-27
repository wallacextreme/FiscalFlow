/**
 * FiscalFlow — Specialized NF-e (Nota Fiscal Eletrônica - Modelo 55) Parser
 * 
 * Complies with SEFAZ NF-e v4.00 specifications and FISCAL_DOCUMENTS.md.
 * Pure TypeScript implementation compatible with both Node.js and Browser/Tauri environments.
 */

import type { DocumentDetectionResult, DocumentParser, ParseResult } from './types.ts';
import type { FiscalDocument, DocumentItem, DocumentSituacao } from '../../types/models.ts';
import { cleanDigits, isValidChaveAcesso } from '../../utils/validators.ts';

export class NfeParser implements DocumentParser {
  canParse(detection: DocumentDetectionResult): boolean {
    return detection.isXml && (detection.type === 'nfe' || detection.subType === 'nfe');
  }

  async parse(content: string, companyId: string, xmlHash: string): Promise<ParseResult> {
    const warnings: string[] = [];

    // Helper regex extractors
    const extractTag = (tag: string, parentContent = content): string | null => {
      const match = parentContent.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : null;
    };

    const parseNumber = (val: string | null): number | undefined => {
      if (!val) return undefined;
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? undefined : parsed;
    };

    // 1. Chave de acesso
    let chaveAcesso: string | undefined = undefined;
    const chMatch = content.match(/<chNFe>([0-9]{44})<\/chNFe>/i) ||
                    content.match(/infNFe\s+[^>]*Id=["'](?:NFe)?([0-9]{44})["']/i) ||
                    content.match(/Id=["'](?:NFe)?([0-9]{44})["']/i);

    if (chMatch) {
      chaveAcesso = cleanDigits(chMatch[1]);
      if (!isValidChaveAcesso(chaveAcesso)) {
        warnings.push(`Chave de acesso com dígito verificador inválido: ${chaveAcesso}`);
      }
    } else {
      warnings.push('Chave de acesso não localizada no XML.');
    }

    // 2. infNFe attributes
    let nfeVersao = '4.00';
    const versaoMatch = content.match(/<infNFe\s+[^>]*versao=["']([^"']+)["']/i) ||
                        content.match(/<nfeProc\s+[^>]*versao=["']([^"']+)["']/i);
    if (versaoMatch) {
      nfeVersao = versaoMatch[1];
    }

    // 3. ide (Identificação)
    const ideMatch = content.match(/<ide[^>]*>([\s\S]*?)<\/ide>/i);
    const ideContent = ideMatch ? ideMatch[1] : content;

    const numero = extractTag('nNF', ideContent) || '0';
    const serie = extractTag('serie', ideContent) || '1';
    const naturezaOperacao = extractTag('natOp', ideContent) || undefined;

    const rawDate = extractTag('dhEmi', ideContent) || extractTag('dEmi', ideContent) || new Date().toISOString();
    const dataEmissao = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00Z`;

    // 4. emit (Emitente)
    const emitMatch = content.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i);
    const emitContent = emitMatch ? emitMatch[1] : '';

    const emitenteCnpjCpf = extractTag('CNPJ', emitContent) || extractTag('CPF', emitContent) || '00000000000000';
    const emitenteRazaoSocial = extractTag('xNome', emitContent) || 'Emitente não informado';
    
    // Address of emitente
    const enderEmitMatch = emitContent.match(/<enderEmit[^>]*>([\s\S]*?)<\/enderEmit>/i);
    const enderEmitContent = enderEmitMatch ? enderEmitMatch[1] : emitContent;
    const emitenteUf = extractTag('UF', enderEmitContent) || undefined;

    // 5. dest (Destinatário)
    const destMatch = content.match(/<dest[^>]*>([\s\S]*?)<\/dest>/i);
    const destContent = destMatch ? destMatch[1] : '';

    const destinatarioCnpjCpf = destContent ? (extractTag('CNPJ', destContent) || extractTag('CPF', destContent) || undefined) : undefined;
    const destinatarioRazaoSocial = destContent ? (extractTag('xNome', destContent) || undefined) : undefined;

    const enderDestMatch = destContent.match(/<enderDest[^>]*>([\s\S]*?)<\/enderDest>/i);
    const enderDestContent = enderDestMatch ? enderDestMatch[1] : destContent;
    const destinatarioUf = enderDestContent ? (extractTag('UF', enderDestContent) || undefined) : undefined;

    // 6. Totais (total -> ICMSTot)
    const totalMatch = content.match(/<ICMSTot[^>]*>([\s\S]*?)<\/ICMSTot>/i);
    const totalContent = totalMatch ? totalMatch[1] : content;

    const valorTotal = parseNumber(extractTag('vNF', totalContent)) ?? 0;
    const valorICMS = parseNumber(extractTag('vICMS', totalContent));
    const valorIPI = parseNumber(extractTag('vIPI', totalContent));
    const valorPIS = parseNumber(extractTag('vPIS', totalContent));
    const valorCOFINS = parseNumber(extractTag('vCOFINS', totalContent));
    const valorISS = parseNumber(extractTag('vISS', totalContent));

    // 7. Protocolo e Situação
    let situacao: DocumentSituacao = 'autorizada';
    const protMatch = content.match(/<protNFe[^>]*>([\s\S]*?)<\/protNFe>/i);
    const protContent = protMatch ? protMatch[1] : content;
    const cStat = extractTag('cStat', protContent);

    if (cStat === '101' || cStat === '151' || cStat === '155' || content.includes('retCancNFe') || content.includes('procEventoNFe')) {
      situacao = 'cancelada';
    } else if (cStat === '102' || content.includes('retInutNFe') || content.includes('procInutNFe')) {
      situacao = 'inutilizada';
    } else if (cStat === '110' || cStat === '301' || cStat === '302' || cStat === '303') {
      situacao = 'denegada';
    } else if (cStat === '100') {
      situacao = 'autorizada';
    }

    // 8. Items (det)
    const items: DocumentItem[] = [];
    const detRegex = /<det\s+nItem=["'](\d+)["']>([\s\S]*?)<\/det>/gi;
    let detMatch: RegExpExecArray | null;

    while ((detMatch = detRegex.exec(content)) !== null) {
      const numeroItem = parseInt(detMatch[1], 10);
      const detContent = detMatch[2];

      // prod
      const prodMatch = detContent.match(/<prod[^>]*>([\s\S]*?)<\/prod>/i);
      const prodContent = prodMatch ? prodMatch[1] : detContent;

      const codigo = extractTag('cProd', prodContent) || undefined;
      const descricao = extractTag('xProd', prodContent) || `Item ${numeroItem}`;
      const ncm = extractTag('NCM', prodContent) || undefined;
      const cfop = extractTag('CFOP', prodContent) || undefined;
      const unidade = extractTag('uCom', prodContent) || undefined;
      const quantidade = parseNumber(extractTag('qCom', prodContent)) ?? 1;
      const valorUnitario = parseNumber(extractTag('vUnCom', prodContent)) ?? 0;
      const valorTotalItem = parseNumber(extractTag('vProd', prodContent)) ?? (quantidade * valorUnitario);

      // imposto
      const impostoMatch = detContent.match(/<imposto[^>]*>([\s\S]*?)<\/imposto>/i);
      const impContent = impostoMatch ? impostoMatch[1] : '';

      // ICMS
      let cst: string | undefined = undefined;
      let origem: string | undefined = undefined;
      let baseCalculoICMS: number | undefined = undefined;
      let valorItemICMS: number | undefined = undefined;
      let aliquotaICMS: number | undefined = undefined;

      const icmsGroupMatch = impContent.match(/<ICMS[^>]*>([\s\S]*?)<\/ICMS>/i);
      if (icmsGroupMatch) {
        const icmsBody = icmsGroupMatch[1];
        cst = extractTag('CST', icmsBody) || extractTag('CSOSN', icmsBody) || undefined;
        origem = extractTag('orig', icmsBody) || undefined;
        baseCalculoICMS = parseNumber(extractTag('vBC', icmsBody));
        aliquotaICMS = parseNumber(extractTag('pICMS', icmsBody));
        valorItemICMS = parseNumber(extractTag('vICMS', icmsBody));
      }

      // IPI
      let valorIpiItem: number | undefined = undefined;
      const ipiGroupMatch = impContent.match(/<IPI[^>]*>([\s\S]*?)<\/IPI>/i);
      if (ipiGroupMatch) {
        valorIpiItem = parseNumber(extractTag('vIPI', ipiGroupMatch[1]));
      }

      // PIS
      let valorPisItem: number | undefined = undefined;
      const pisGroupMatch = impContent.match(/<PIS[^>]*>([\s\S]*?)<\/PIS>/i);
      if (pisGroupMatch) {
        valorPisItem = parseNumber(extractTag('vPIS', pisGroupMatch[1]));
      }

      // COFINS
      let valorCofinsItem: number | undefined = undefined;
      const cofinsGroupMatch = impContent.match(/<COFINS[^>]*>([\s\S]*?)<\/COFINS>/i);
      if (cofinsGroupMatch) {
        valorCofinsItem = parseNumber(extractTag('vCOFINS', cofinsGroupMatch[1]));
      }

      items.push({
        id: '', // Will be assigned by repository or randomUUID
        documentId: '',
        numeroItem,
        codigo,
        descricao,
        ncm,
        cfop,
        unidade,
        quantidade,
        valorUnitario,
        valorTotal: valorTotalItem,
        baseCalculoICMS,
        valorICMS: valorItemICMS,
        aliquotaICMS,
        valorIPI: valorIpiItem,
        valorPIS: valorPisItem,
        valorCOFINS: valorCofinsItem,
        cst,
        origem
      });
    }

    const document: FiscalDocument = {
      id: '',
      companyId,
      tipo: 'nfe',
      chaveAcesso,
      numero,
      serie,
      dataEmissao,
      valorTotal,
      emitenteCnpjCpf,
      emitenteRazaoSocial,
      emitenteUf,
      destinatarioCnpjCpf,
      destinatarioRazaoSocial,
      destinatarioUf,
      valorICMS,
      valorIPI,
      valorPIS,
      valorCOFINS,
      valorISS,
      situacao,
      xmlOriginal: content,
      xmlHash,
      nfeVersao,
      naturezaOperacao,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      document,
      items,
      warnings
    };
  }
}
