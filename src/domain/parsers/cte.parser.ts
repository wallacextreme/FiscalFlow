/**
 * FiscalFlow — Specialized CT-e (Conhecimento de Transporte Eletrônico - Modelo 57) Parser
 * 
 * Complies with SEFAZ CT-e v4.00 specifications and FISCAL_DOCUMENTS.md.
 */

import type { DocumentDetectionResult, DocumentParser, ParseResult } from './types.ts';
import type { FiscalDocument, DocumentItem, DocumentSituacao } from '../../types/models.ts';
import { cleanDigits, isValidChaveAcesso } from '../../utils/validators.ts';

export class CteParser implements DocumentParser {
  canParse(detection: DocumentDetectionResult): boolean {
    return detection.isXml && (detection.type === 'cte' || detection.subType === 'cte');
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
    const chMatch = content.match(/<chCTe>([0-9]{44})<\/chCTe>/i) ||
                    content.match(/infCte\s+[^>]*Id=["'](?:CTe)?([0-9]{44})["']/i) ||
                    content.match(/Id=["'](?:CTe)?([0-9]{44})["']/i);

    if (chMatch) {
      chaveAcesso = cleanDigits(chMatch[1]);
      if (!isValidChaveAcesso(chaveAcesso)) {
        warnings.push(`Chave de acesso do CT-e com dígito verificador inválido: ${chaveAcesso}`);
      }
    } else {
      warnings.push('Chave de acesso não localizada no XML do CT-e.');
    }

    // 2. infCte attributes
    let cteVersao = '4.00';
    const versaoMatch = content.match(/<infCte\s+[^>]*versao=["']([^"']+)["']/i) ||
                        content.match(/<cteProc\s+[^>]*versao=["']([^"']+)["']/i);
    if (versaoMatch) {
      cteVersao = versaoMatch[1];
    }

    // 3. ide (Identificação)
    const ideMatch = content.match(/<ide[^>]*>([\s\S]*?)<\/ide>/i);
    const ideContent = ideMatch ? ideMatch[1] : content;

    const numero = extractTag('nCT', ideContent) || '0';
    const serie = extractTag('serie', ideContent) || '1';
    const naturezaOperacao = extractTag('natOp', ideContent) || 'TRANSPORTE DE CARGAS';
    const cfop = extractTag('CFOP', ideContent) || undefined;

    const rawDate = extractTag('dhEmi', ideContent) || extractTag('dEmi', ideContent) || new Date().toISOString();
    const dataEmissao = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00Z`;

    const xMunIni = extractTag('xMunIni', ideContent) || '';
    const ufIni = extractTag('UFIni', ideContent) || '';
    const xMunFim = extractTag('xMunFim', ideContent) || '';
    const ufFim = extractTag('UFFim', ideContent) || '';

    // 4. emit (Emitente / Transportadora)
    const emitMatch = content.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i);
    const emitContent = emitMatch ? emitMatch[1] : '';

    const emitenteCnpjCpf = extractTag('CNPJ', emitContent) || extractTag('CPF', emitContent) || '00000000000000';
    const emitenteRazaoSocial = extractTag('xNome', emitContent) || 'Transportadora não informada';

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

    // 6. vPrest (Valores da Prestação do Serviço)
    const vPrestMatch = content.match(/<vPrest[^>]*>([\s\S]*?)<\/vPrest>/i);
    const vPrestContent = vPrestMatch ? vPrestMatch[1] : content;

    const valorTotal = parseNumber(extractTag('vTPrest', vPrestContent)) ?? parseNumber(extractTag('vRec', vPrestContent)) ?? 0;

    // 7. imp (Impostos / ICMS)
    const impMatch = content.match(/<imp[^>]*>([\s\S]*?)<\/imp>/i);
    const impContent = impMatch ? impMatch[1] : content;

    let cst: string | undefined = undefined;
    let baseCalculoICMS: number | undefined = undefined;
    let aliquotaICMS: number | undefined = undefined;
    let valorICMS: number | undefined = undefined;

    const icmsGroupMatch = impContent.match(/<ICMS[^>]*>([\s\S]*?)<\/ICMS>/i);
    if (icmsGroupMatch) {
      const icmsBody = icmsGroupMatch[1];
      cst = extractTag('CST', icmsBody) || undefined;
      baseCalculoICMS = parseNumber(extractTag('vBC', icmsBody));
      aliquotaICMS = parseNumber(extractTag('pICMS', icmsBody));
      valorICMS = parseNumber(extractTag('vICMS', icmsBody));
    }

    // 8. infCarga (Informações da Carga)
    const infCargaMatch = content.match(/<infCarga[^>]*>([\s\S]*?)<\/infCarga>/i);
    const infCargaContent = infCargaMatch ? infCargaMatch[1] : '';
    const proPred = extractTag('proPred', infCargaContent) || undefined;
    const qCarga = parseNumber(extractTag('qCarga', infCargaContent)) || 1;

    // 9. Protocolo e Situação
    let situacao: DocumentSituacao = 'autorizada';
    const protMatch = content.match(/<protCTe[^>]*>([\s\S]*?)<\/protCTe>/i);
    const protContent = protMatch ? protMatch[1] : content;
    const cStat = extractTag('cStat', protContent);

    if (cStat === '101' || cStat === '151' || cStat === '155' || content.includes('retCancCTe') || content.includes('procEventoCTe')) {
      situacao = 'cancelada';
    } else if (cStat === '102' || content.includes('retInutCTe')) {
      situacao = 'inutilizada';
    } else if (cStat === '110' || cStat === '301' || cStat === '302' || cStat === '303') {
      situacao = 'denegada';
    } else if (cStat === '100') {
      situacao = 'autorizada';
    }

    // 10. Service Item for CT-e
    let descricaoItem = 'PRESTAÇÃO DE SERVIÇO DE TRANSPORTE';
    if (xMunIni && xMunFim) {
      descricaoItem += ` (${xMunIni}/${ufIni} -> ${xMunFim}/${ufFim})`;
    }
    if (proPred) {
      descricaoItem += ` - CARGA: ${proPred}`;
    }

    const items: DocumentItem[] = [
      {
        id: '',
        documentId: '',
        numeroItem: 1,
        codigo: cfop,
        descricao: descricaoItem,
        cfop,
        unidade: 'UN',
        quantidade: qCarga,
        valorUnitario: valorTotal,
        valorTotal,
        baseCalculoICMS,
        valorICMS,
        aliquotaICMS,
        cst
      }
    ];

    const document: FiscalDocument = {
      id: '',
      companyId,
      tipo: 'cte',
      chaveAcesso,
      numero,
      serie,
      dataEmissao,
      valorTotal,
      emitenteCnpjCpf: cleanDigits(emitenteCnpjCpf) || emitenteCnpjCpf,
      emitenteRazaoSocial,
      emitenteUf,
      destinatarioCnpjCpf: destinatarioCnpjCpf ? cleanDigits(destinatarioCnpjCpf) : undefined,
      destinatarioRazaoSocial,
      destinatarioUf,
      valorICMS,
      situacao,
      xmlOriginal: content,
      xmlHash,
      nfeVersao: cteVersao,
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
