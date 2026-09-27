/**
 * FiscalFlow — Specialized NFS-e (Nota Fiscal de Serviços Eletrônica) Parser
 * 
 * Supports both:
 * 1. Padrão Nacional (Portal NFS-e Nacional / DPS / SPED)
 * 2. Padrão ABRASF (v2.04 / v2.01 / v2.00 / v1.00)
 * 
 * Complies with FISCAL_DOCUMENTS.md and FORMAT_SUPPORT_MATRIX.md.
 */

import type { DocumentDetectionResult, DocumentParser, ParseResult } from './types.ts';
import type { FiscalDocument, DocumentItem, DocumentSituacao } from '../../types/models.ts';
import { cleanDigits } from '../../utils/validators.ts';

export class NfseParser implements DocumentParser {
  canParse(detection: DocumentDetectionResult): boolean {
    return detection.isXml && (
      detection.type === 'nfse' || 
      detection.subType === 'nfse_nacional' || 
      detection.subType === 'nfse_abrasf'
    );
  }

  async parse(
    content: string, 
    companyId: string, 
    xmlHash: string, 
    detection?: DocumentDetectionResult
  ): Promise<ParseResult> {
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

    // Determine layout: Padrão Nacional vs ABRASF
    const isNacional = 
      detection?.subType === 'nfse_nacional' ||
      content.includes('sped.fazenda.gov.br/nfse') || 
      content.includes('<infNFSe') || 
      content.includes('<DPS') ||
      content.includes('<infDPS');

    let numero = '0';
    let serie = '1';
    let dataEmissao = new Date().toISOString();
    let chaveAcesso: string | undefined = undefined;
    let situacao: DocumentSituacao = 'autorizada';

    let emitenteCnpjCpf = '00000000000000';
    let emitenteRazaoSocial = 'Prestador não informado';
    let emitenteUf: string | undefined = undefined;

    let destinatarioCnpjCpf: string | undefined = undefined;
    let destinatarioRazaoSocial: string | undefined = undefined;
    let destinatarioUf: string | undefined = undefined;

    let valorTotal = 0;
    let valorISS: number | undefined = undefined;
    let valorPIS: number | undefined = undefined;
    let valorCOFINS: number | undefined = undefined;

    let codigoServico: string | undefined = undefined;
    let descricaoServico = 'Serviço prestado';

    if (isNacional) {
      // ==========================================
      // PADRÃO NACIONAL (Portal NFS-e Nacional)
      // ==========================================
      numero = extractTag('nNFSe') || extractTag('Numero') || extractTag('nDPS') || '0';
      serie = extractTag('sNFSe') || extractTag('serie') || '1';

      const rawDate = extractTag('dhEmi') || extractTag('dEmi') || extractTag('dhDPS') || new Date().toISOString();
      dataEmissao = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00Z`;

      // Chave de acesso / Código de verificação
      const chMatch = content.match(/<chNFSe>([0-9]+)<\/chNFSe>/i) ||
                      content.match(/infNFSe\s+[^>]*Id=["'](?:NFS)?([a-zA-Z0-9]+)["']/i);
      if (chMatch) {
        chaveAcesso = cleanDigits(chMatch[1]) || chMatch[1];
      } else {
        chaveAcesso = extractTag('cVerif') || undefined;
      }

      // Situação
      if (content.includes('retCanc') || content.includes('<cancNFSe>') || content.includes('cStat="101"')) {
        situacao = 'cancelada';
      }

      // Prestador (emit)
      const emitMatch = content.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i);
      const emitContent = emitMatch ? emitMatch[1] : content;

      emitenteCnpjCpf = extractTag('CNPJ', emitContent) || extractTag('CPF', emitContent) || '00000000000000';
      emitenteRazaoSocial = extractTag('xNome', emitContent) || extractTag('xFant', emitContent) || 'Prestador de Serviço';
      emitenteUf = extractTag('UF', emitContent) || undefined;

      // Tomador (toma)
      const tomaMatch = content.match(/<toma[^>]*>([\s\S]*?)<\/toma>/i);
      if (tomaMatch) {
        const tomaContent = tomaMatch[1];
        destinatarioCnpjCpf = extractTag('CNPJ', tomaContent) || extractTag('CPF', tomaContent) || undefined;
        destinatarioRazaoSocial = extractTag('xNome', tomaContent) || undefined;
        destinatarioUf = extractTag('UF', tomaContent) || undefined;
      }

      // Serviço (serv)
      const servMatch = content.match(/<serv[^>]*>([\s\S]*?)<\/serv>/i);
      const servContent = servMatch ? servMatch[1] : content;
      codigoServico = extractTag('cServ', servContent) || extractTag('cTribNac', servContent) || undefined;
      descricaoServico = extractTag('xServ', servContent) || 'Serviço prestado';

      // Valores (valores)
      const valMatch = content.match(/<valores[^>]*>([\s\S]*?)<\/valores>/i);
      const valContent = valMatch ? valMatch[1] : content;

      valorTotal = parseNumber(extractTag('vServ', valContent)) ?? parseNumber(extractTag('vLiquida', valContent)) ?? 0;
      valorISS = parseNumber(extractTag('vISS', valContent));
      valorPIS = parseNumber(extractTag('vPIS', valContent));
      valorCOFINS = parseNumber(extractTag('vCOFINS', valContent));

    } else {
      // ==========================================
      // PADRÃO ABRASF (v2.04 / v2.01 / v2.00 / v1.00)
      // ==========================================
      numero = extractTag('Numero') || extractTag('numero') || '0';
      serie = extractTag('Serie') || extractTag('serie') || '1';

      const rawDate = extractTag('DataEmissao') || extractTag('dataEmissao') || new Date().toISOString();
      dataEmissao = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00Z`;

      // Código de verificação / Id
      const codVerif = extractTag('CodigoVerificacao');
      const idMatch = content.match(/InfNfse\s+[^>]*Id=["']([^"']+)["']/i);
      chaveAcesso = codVerif || (idMatch ? idMatch[1] : undefined);

      // Cancelamento
      if (
        content.includes('<NfseCancelamento') || 
        content.includes('<Cancelamento') || 
        content.includes('<tcCancelamentoNfse') ||
        content.includes('<ConfirmacaoCancelamento')
      ) {
        situacao = 'cancelada';
      }

      // Prestador
      const prestServicoMatch = content.match(/<PrestadorServico[^>]*>([\s\S]*?)<\/PrestadorServico>/i);
      const prestMatch = content.match(/<DadosPrestador[^>]*>([\s\S]*?)<\/DadosPrestador>/i) ||
                         content.match(/<Prestador[^>]*>([\s\S]*?)<\/Prestador>/i);
      const prestContent = [prestServicoMatch ? prestServicoMatch[1] : '', prestMatch ? prestMatch[1] : ''].join(' ') || content;

      emitenteCnpjCpf = extractTag('Cnpj', prestContent) || extractTag('Cpf', prestContent) || 
                        extractTag('CNPJ', prestContent) || extractTag('CPF', prestContent) || '00000000000000';
      emitenteRazaoSocial = extractTag('RazaoSocial', prestContent) || extractTag('NomeFantasia', prestContent) ||
                            extractTag('xNome', prestContent) || 'Prestador de Serviço';
      emitenteUf = extractTag('Uf', prestContent) || extractTag('UF', prestContent) || undefined;

      // Tomador
      const tomaServicoMatch = content.match(/<TomadorServico[^>]*>([\s\S]*?)<\/TomadorServico>/i);
      const tomaMatch = content.match(/<DadosTomador[^>]*>([\s\S]*?)<\/DadosTomador>/i) ||
                        content.match(/<Tomador[^>]*>([\s\S]*?)<\/Tomador>/i);
      const tomaContent = [tomaServicoMatch ? tomaServicoMatch[1] : '', tomaMatch ? tomaMatch[1] : ''].join(' ');

      if (tomaContent.trim().length > 0) {
        destinatarioCnpjCpf = extractTag('Cnpj', tomaContent) || extractTag('Cpf', tomaContent) ||
                              extractTag('CNPJ', tomaContent) || extractTag('CPF', tomaContent) || undefined;
        destinatarioRazaoSocial = extractTag('RazaoSocial', tomaContent) || extractTag('xNome', tomaContent) || undefined;
        destinatarioUf = extractTag('Uf', tomaContent) || extractTag('UF', tomaContent) || undefined;
      }

      // Serviço
      const servMatch = content.match(/<Servico[^>]*>([\s\S]*?)<\/Servico>/i);
      const servContent = servMatch ? servMatch[1] : content;

      codigoServico = extractTag('ItemListaServico', servContent) || extractTag('CodigoCnae', servContent) || undefined;
      descricaoServico = extractTag('Discriminacao', servContent) || 'Serviço prestado';

      // Valores
      const valMatch = content.match(/<Valores[^>]*>([\s\S]*?)<\/Valores>/i) ||
                       content.match(/<ValoresNfse[^>]*>([\s\S]*?)<\/ValoresNfse>/i);
      const valContent = valMatch ? valMatch[1] : content;

      valorTotal = parseNumber(extractTag('ValorServicos', valContent)) ?? 
                   parseNumber(extractTag('ValorLiquidoNfse', valContent)) ?? 
                   parseNumber(extractTag('ValorTotal', valContent)) ?? 0;

      valorISS = parseNumber(extractTag('ValorIss', valContent));
      valorPIS = parseNumber(extractTag('ValorPis', valContent));
      valorCOFINS = parseNumber(extractTag('ValorCofins', valContent));
    }

    // Build DocumentItem for the service
    const items: DocumentItem[] = [
      {
        id: '',
        documentId: '',
        numeroItem: 1,
        codigo: codigoServico,
        descricao: descricaoServico.trim(),
        unidade: 'UN',
        quantidade: 1,
        valorUnitario: valorTotal,
        valorTotal: valorTotal,
        valorPIS,
        valorCOFINS
      }
    ];

    const document: FiscalDocument = {
      id: '',
      companyId,
      tipo: 'nfse',
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
      valorISS,
      valorPIS,
      valorCOFINS,
      situacao,
      xmlOriginal: content,
      xmlHash,
      nfeVersao: isNacional ? 'Padrão Nacional 1.00' : 'ABRASF 2.04',
      naturezaOperacao: 'PRESTAÇÃO DE SERVIÇOS',
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
