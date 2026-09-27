/**
 * FiscalFlow — Specialized SPED Fiscal (EFD ICMS/IPI) Parser
 * 
 * Positional text parser for Brazilian SPED Fiscal (Leiaute 018/019).
 * Extracts Registro 0000, block statistics, fiscal documents and tax calculations.
 */

import type { SpedFile, SpedType, SpedFinalidade } from '../../types/models.ts';
import { cleanDigits } from '../../utils/validators.ts';

export interface SpedBlockInfo {
  bloco: string;
  nome: string;
  totalRegistros: number;
}

export interface SpedAnalysisSummary {
  blocos: Record<string, SpedBlockInfo>;
  documentosC100: {
    total: number;
    valorTotal: number;
    valorIcms: number;
  };
  apuracaoIcms?: {
    debitos: number;
    creditos: number;
    saldoDevedor: number;
    saldoCredor: number;
  };
  contador?: {
    nome: string;
    cpfCnpj: string;
    crc: string;
  };
}

export interface SpedParseResult {
  spedFile: SpedFile;
  summary: SpedAnalysisSummary;
  warnings: string[];
}

export class SpedParser {
  canParse(detection: { type: string }): boolean {
    return detection.type === 'sped';
  }

  /**
   * Parse SPED EFD ICMS/IPI positional text file
   */
  async parse(content: string, companyId: string, contentHash: string): Promise<SpedParseResult> {
    const warnings: string[] = [];
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error('Arquivo SPED está vazio.');
    }

    const blockDescriptions: Record<string, string> = {
      '0': 'Abertura, Identificação e Referências',
      'B': 'Escrituração e Apuração do ISS (DF)',
      'C': 'Documentos Fiscais I - Mercadorias (ICMS/IPI)',
      'D': 'Documentos Fiscais II - Serviços (ICMS)',
      'E': 'Apuração do ICMS e do IPI',
      'G': 'Controle do Crédito de ICMS do Ativo Permanente (CIAP)',
      'H': 'Inventário Físico',
      'K': 'Controle da Produção e do Estoque',
      '1': 'Outras Informações',
      '9': 'Controle e Encerramento do Arquivo Digital'
    };

    const blocos: Record<string, SpedBlockInfo> = {};
    for (const [key, desc] of Object.entries(blockDescriptions)) {
      blocos[key] = { bloco: key, nome: desc, totalRegistros: 0 };
    }

    let reg0000Found = false;
    let versaoLayout = '018';
    let finalidade: SpedFinalidade = 'original';
    let dataInicio = '';
    let dataFim = '';
    let periodo = '';
    let razaoSocial = 'Empresa não identificada';
    let cnpj = '00000000000000';
    let inscricaoEstadual: string | undefined = undefined;

    let c100Count = 0;
    let c100ValorTotal = 0;
    let c100ValorIcms = 0;

    let apuracaoIcms: SpedAnalysisSummary['apuracaoIcms'] = undefined;
    let contador: SpedAnalysisSummary['contador'] = undefined;

    const parseSpedDate = (val: string): string => {
      if (val.length === 8) {
        // DDMMAAAA -> YYYY-MM-DD
        const day = val.substring(0, 2);
        const month = val.substring(2, 4);
        const year = val.substring(4, 8);
        return `${year}-${month}-${day}`;
      }
      return val;
    };

    const parseSpedFloat = (val?: string): number => {
      if (!val) return 0;
      const num = parseFloat(val.replace(',', '.'));
      return isNaN(num) ? 0 : num;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith('|')) continue;

      const fields = line.split('|');
      const reg = fields[1];
      if (!reg) continue;

      // Count block
      const blockLetter = reg.charAt(0);
      if (blocos[blockLetter]) {
        blocos[blockLetter].totalRegistros++;
      } else {
        blocos[blockLetter] = {
          bloco: blockLetter,
          nome: blockDescriptions[blockLetter] || `Bloco ${blockLetter}`,
          totalRegistros: 1
        };
      }

      // Registro 0000: Abertura do Arquivo
      if (reg === '0000') {
        reg0000Found = true;
        versaoLayout = fields[2] || '018';
        finalidade = fields[3] === '1' ? 'retificadora' : 'original';

        const rawDtIni = fields[4] || '';
        const rawDtFin = fields[5] || '';
        dataInicio = parseSpedDate(rawDtIni);
        dataFim = parseSpedDate(rawDtFin);

        if (rawDtIni.length === 8) {
          // YYYYMM
          periodo = `${rawDtIni.substring(4, 8)}${rawDtIni.substring(2, 4)}`;
        } else {
          periodo = new Date().toISOString().substring(0, 7).replace('-', '');
        }

        razaoSocial = fields[6] || 'Empresa não identificada';
        cnpj = cleanDigits(fields[7] || fields[8] || '00000000000000');
        inscricaoEstadual = fields[10] || undefined;
      }

      // Registro 0100: Dados do Contabilista
      if (reg === '0100') {
        contador = {
          nome: fields[2] || '',
          cpfCnpj: cleanDigits(fields[3] || fields[4] || ''),
          crc: fields[5] || ''
        };
      }

      // Registro C100: Documento - Nota Fiscal
      if (reg === 'C100') {
        c100Count++;
        c100ValorTotal += parseSpedFloat(fields[12]); // VL_DOC
        c100ValorIcms += parseSpedFloat(fields[22]);  // VL_ICMS
      }

      // Registro E110: Apuração do ICMS - Operações Próprias
      if (reg === 'E110') {
        apuracaoIcms = {
          debitos: parseSpedFloat(fields[2]),      // VL_TOT_DEBITOS
          creditos: parseSpedFloat(fields[6]),     // VL_TOT_CREDITOS
          saldoDevedor: parseSpedFloat(fields[13]), // VL_SLD_DEVEDOR
          saldoCredor: parseSpedFloat(fields[14])   // VL_SLD_CREDOR_TRANSPORTAR
        };
      }
    }

    if (!reg0000Found) {
      throw new Error('Registro 0000 de abertura do SPED Fiscal não encontrado no arquivo.');
    }

    // Filter out blocks with 0 registers
    const activeBlocks: Record<string, SpedBlockInfo> = {};
    for (const [key, b] of Object.entries(blocos)) {
      if (b.totalRegistros > 0) {
        activeBlocks[key] = b;
      }
    }

    const summary: SpedAnalysisSummary = {
      blocos: activeBlocks,
      documentosC100: {
        total: c100Count,
        valorTotal: Math.round(c100ValorTotal * 100) / 100,
        valorIcms: Math.round(c100ValorIcms * 100) / 100
      },
      apuracaoIcms,
      contador
    };

    const spedFile: SpedFile = {
      id: '',
      companyId,
      tipo: 'efd_icms_ipi' as SpedType,
      periodo,
      dataInicio,
      dataFim,
      cnpj,
      razaoSocial,
      inscricaoEstadual,
      versaoLayout,
      finalidade,
      conteudoOriginal: content,
      conteudoHash: contentHash,
      totalRegistros: lines.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      spedFile,
      summary,
      warnings
    };
  }
}
