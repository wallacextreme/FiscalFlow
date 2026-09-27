/**
 * FiscalFlow — Base XML / Fallback Parser
 * 
 * Extracts essential fiscal document fields from XML documents.
 */

import type { DocumentDetectionResult, ParseResult } from './types.ts';
import type { FiscalDocument, DocumentItem, DocumentSituacao } from '../../types/models.ts';

export class BaseXmlParser {
  canParse(detection: DocumentDetectionResult): boolean {
    return detection.isXml && detection.type !== 'unknown';
  }

  async parse(content: string, companyId: string, xmlHash: string, detection: DocumentDetectionResult): Promise<ParseResult> {
    const warnings: string[] = [];

    // Helper regex extractors (safe in both browser and node)
    const extractTag = (tag: string, parentContent = content): string | null => {
      const match = parentContent.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : null;
    };

    // 1. Chave de acesso
    let chaveAcesso: string | undefined = undefined;
    const chMatch = content.match(/<ch[a-zA-Z0-9_]+>([0-9]{44})<\//i) ||
                    content.match(/Id=["'](?:NFe|CTe)?([0-9]{44})["']/i);
    if (chMatch) {
      chaveAcesso = chMatch[1];
    }

    // 2. Número e Série
    const numero = extractTag('nNF') || extractTag('nCT') || extractTag('Numero') || extractTag('numero') || `DOC-${Date.now().toString().slice(-6)}`;
    const serie = extractTag('serie') || extractTag('Serie') || '1';

    // 3. Data de emissão
    const rawDate = extractTag('dhEmi') || extractTag('dEmi') || extractTag('DataEmissao') || extractTag('dataEmissao') || new Date().toISOString();
    const dataEmissao = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00Z`;

    // 4. Emitente
    const emitMatch = content.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i) ||
                      content.match(/<prestador[^>]*>([\s\S]*?)<\/prestador>/i);
    const emitContent = emitMatch ? emitMatch[1] : content;

    const emitenteCnpjCpf = extractTag('CNPJ', emitContent) || extractTag('CPF', emitContent) || '00000000000000';
    const emitenteRazaoSocial = extractTag('xNome', emitContent) || extractTag('razaoSocial', emitContent) || extractTag('xFant', emitContent) || 'Emitente não identificado';
    const emitenteUf = extractTag('UF', emitContent) || undefined;

    // 5. Destinatário
    const destMatch = content.match(/<dest[^>]*>([\s\S]*?)<\/dest>/i) ||
                      content.match(/<tomador[^>]*>([\s\S]*?)<\/tomador>/i);
    const destContent = destMatch ? destMatch[1] : '';

    const destinatarioCnpjCpf = destContent ? (extractTag('CNPJ', destContent) || extractTag('CPF', destContent) || undefined) : undefined;
    const destinatarioRazaoSocial = destContent ? (extractTag('xNome', destContent) || extractTag('razaoSocial', destContent) || undefined) : undefined;
    const destinatarioUf = destContent ? (extractTag('UF', destContent) || undefined) : undefined;

    // 6. Valores
    const rawValor = extractTag('vNF') || extractTag('vPrest') || extractTag('vLiq') || extractTag('ValorTotal') || extractTag('vServ') || '0';
    const valorTotal = parseFloat(rawValor.replace(',', '.')) || 0;

    const rawIcms = extractTag('vICMS');
    const valorICMS = rawIcms ? parseFloat(rawIcms.replace(',', '.')) : undefined;

    const rawIpi = extractTag('vIPI');
    const valorIPI = rawIpi ? parseFloat(rawIpi.replace(',', '.')) : undefined;

    const rawPis = extractTag('vPIS');
    const valorPIS = rawPis ? parseFloat(rawPis.replace(',', '.')) : undefined;

    const rawCofins = extractTag('vCOFINS');
    const valorCOFINS = rawCofins ? parseFloat(rawCofins.replace(',', '.')) : undefined;

    const rawIss = extractTag('vISS') || extractTag('ValorIss');
    const valorISS = rawIss ? parseFloat(rawIss.replace(',', '.')) : undefined;

    // 7. Situação
    let situacao: DocumentSituacao = 'autorizada';
    if (content.includes('cStat="101"') || content.includes('<cStat>101</cStat>') || content.includes('retCancNFe')) {
      situacao = 'cancelada';
    } else if (content.includes('cStat="102"') || content.includes('<cStat>102</cStat>') || content.includes('inutNFe')) {
      situacao = 'inutilizada';
    } else if (content.includes('cStat="110"') || content.includes('cStat="301"')) {
      situacao = 'denegada';
    }

    // 8. Natureza da Operação
    const naturezaOperacao = extractTag('natOp') || undefined;

    // 9. Items extraction (basic)
    const items: DocumentItem[] = [];
    const itemMatches = content.matchAll(/<det\s+nItem=["'](\d+)["']>([\s\S]*?)<\/det>/gi);
    for (const match of itemMatches) {
      const nItem = parseInt(match[1], 10);
      const detContent = match[2];

      const prodMatch = detContent.match(/<prod[^>]*>([\s\S]*?)<\/prod>/i);
      const prodContent = prodMatch ? prodMatch[1] : detContent;

      const descricao = extractTag('xProd', prodContent) || `Item ${nItem}`;
      const codigo = extractTag('cProd', prodContent) || undefined;
      const ncm = extractTag('NCM', prodContent) || undefined;
      const cfop = extractTag('CFOP', prodContent) || undefined;
      const unidade = extractTag('uCom', prodContent) || undefined;
      const qCom = extractTag('qCom', prodContent) || '1';
      const vUnCom = extractTag('vUnCom', prodContent) || '0';
      const vProd = extractTag('vProd', prodContent) || '0';

      items.push({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${nItem}`,
        documentId: '', // Set by repository
        numeroItem: nItem,
        codigo,
        descricao,
        ncm,
        cfop,
        unidade,
        quantidade: parseFloat(qCom.replace(',', '.')) || 1,
        valorUnitario: parseFloat(vUnCom.replace(',', '.')) || 0,
        valorTotal: parseFloat(vProd.replace(',', '.')) || 0
      });
    }

    const docId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}`;
    const now = new Date().toISOString();

    const document: FiscalDocument = {
      id: docId,
      companyId,
      tipo: detection.type === 'unknown' ? 'nfe' : detection.type,
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
      nfeVersao: detection.version,
      naturezaOperacao,
      createdAt: now,
      updatedAt: now
    };

    return { document, items, warnings };
  }
}
