/**
 * FiscalFlow — Dashboard Service
 * 
 * Aggregates fiscal metrics, tax totals, inputs vs outputs,
 * partner rankings, monthly trends, and document distributions.
 */

import { DocumentRepository } from '../database/repositories/document.repository.ts';
import { SpedRepository } from '../database/repositories/sped.repository.ts';
import type { FiscalDocument, SpedFile, DocumentType } from '../types/models.ts';
import { cleanDigits } from '../utils/validators.ts';

export interface PartnerSummary {
  cnpjCpf: string;
  razaoSocial: string;
  uf?: string;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  mes: string;             // YYYY-MM
  mesFormatado: string;    // Ex: Jan/2026
  entradas: number;
  saidas: number;
  total: number;
  count: number;
}

export interface TypeDistribution {
  tipo: DocumentType | 'sped';
  label: string;
  count: number;
  totalValor: number;
  percentage: number;
  color: string;
}

export interface DashboardMetrics {
  totalDocs: number;
  totalFiscalDocs: number;
  totalSpedFiles: number;
  totalValor: number;
  entradas: {
    total: number;
    count: number;
  };
  saidas: {
    total: number;
    count: number;
  };
  impostos: {
    icms: number;
    iss: number;
    pis: number;
    cofins: number;
    ipi: number;
    total: number;
  };
  distribuicaoTipos: TypeDistribution[];
  evolucaoMensal: MonthlyTrend[];
  topFornecedores: PartnerSummary[];
  topClientes: PartnerSummary[];
  documentosRecentes: FiscalDocument[];
  ultimoSped?: SpedFile;
}

export class DashboardService {
  private documentRepo: DocumentRepository;
  private spedRepo: SpedRepository;

  constructor(documentRepo?: DocumentRepository, spedRepo?: SpedRepository) {
    this.documentRepo = documentRepo || new DocumentRepository();
    this.spedRepo = spedRepo || new SpedRepository();
  }

  /**
   * Calculate comprehensive executive dashboard metrics for a company
   */
  async getMetrics(companyId: string, companyCnpj: string): Promise<DashboardMetrics> {
    if (!companyId) {
      throw new Error('ID da empresa é obrigatório para cálculo de métricas.');
    }

    const cleanCompanyCnpj = cleanDigits(companyCnpj || '');

    // 1. Fetch fiscal documents and SPED files
    const documents = await this.documentRepo.findAllByCompany(companyId);
    const spedFiles = await this.spedRepo.findByCompany(companyId);

    // 2. Base counters
    let totalValor = 0;
    let totalEntradas = 0;
    let countEntradas = 0;
    let totalSaidas = 0;
    let countSaidas = 0;

    let totalIcms = 0;
    let totalIss = 0;
    let totalPis = 0;
    let totalCofins = 0;
    let totalIpi = 0;

    const byTipoCounts: Record<string, { count: number; totalValor: number }> = {
      nfe: { count: 0, totalValor: 0 },
      nfce: { count: 0, totalValor: 0 },
      nfse: { count: 0, totalValor: 0 },
      cte: { count: 0, totalValor: 0 }
    };

    const monthlyMap: Record<string, { entradas: number; saidas: number; total: number; count: number }> = {};
    const suppliersMap: Record<string, PartnerSummary> = {};
    const clientsMap: Record<string, PartnerSummary> = {};

    for (const doc of documents) {
      const isCancelled = doc.situacao === 'cancelada' || doc.situacao === 'denegada' || doc.situacao === 'inutilizada';
      const docValor = isCancelled ? 0 : (doc.valorTotal || 0);

      totalValor += docValor;

      // Group by document type
      if (!byTipoCounts[doc.tipo]) {
        byTipoCounts[doc.tipo] = { count: 0, totalValor: 0 };
      }
      byTipoCounts[doc.tipo].count++;
      byTipoCounts[doc.tipo].totalValor += docValor;

      // Taxes (only for non-cancelled)
      if (!isCancelled) {
        totalIcms += doc.valorICMS || 0;
        totalIss += doc.valorISS || 0;
        totalPis += doc.valorPIS || 0;
        totalCofins += doc.valorCOFINS || 0;
        totalIpi += doc.valorIPI || 0;
      }

      // Direction: Entrada vs Saída based on company CNPJ
      const cleanEmitente = cleanDigits(doc.emitenteCnpjCpf || '');
      const cleanDestinatario = cleanDigits(doc.destinatarioCnpjCpf || '');

      const isSaida = cleanCompanyCnpj && cleanEmitente === cleanCompanyCnpj;
      const isEntrada = cleanCompanyCnpj && cleanDestinatario === cleanCompanyCnpj;

      if (isSaida) {
        totalSaidas += docValor;
        countSaidas++;

        // Partner is Destinatário (Cliente)
        if (cleanDestinatario && !isCancelled) {
          const clientKey = cleanDestinatario;
          if (!clientsMap[clientKey]) {
            clientsMap[clientKey] = {
              cnpjCpf: doc.destinatarioCnpjCpf || cleanDestinatario,
              razaoSocial: doc.destinatarioRazaoSocial || 'Consumidor / Cliente',
              uf: doc.destinatarioUf,
              total: 0,
              count: 0
            };
          }
          clientsMap[clientKey].total += docValor;
          clientsMap[clientKey].count++;
        }
      } else if (isEntrada) {
        totalEntradas += docValor;
        countEntradas++;

        // Partner is Emitente (Fornecedor)
        if (cleanEmitente && !isCancelled) {
          const supplierKey = cleanEmitente;
          if (!suppliersMap[supplierKey]) {
            suppliersMap[supplierKey] = {
              cnpjCpf: doc.emitenteCnpjCpf,
              razaoSocial: doc.emitenteRazaoSocial,
              uf: doc.emitenteUf,
              total: 0,
              count: 0
            };
          }
          suppliersMap[supplierKey].total += docValor;
          suppliersMap[supplierKey].count++;
        }
      } else {
        // Default classification if neither directly matches company CNPJ
        // For instance, NF-e emitidas por padrão contam como saídas se tipo for nfce/nfe
        if (doc.tipo === 'nfce') {
          totalSaidas += docValor;
          countSaidas++;
        } else {
          totalEntradas += docValor;
          countEntradas++;
        }
      }

      // Monthly Trend (YYYY-MM)
      if (doc.dataEmissao) {
        const ym = doc.dataEmissao.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          if (!monthlyMap[ym]) {
            monthlyMap[ym] = { entradas: 0, saidas: 0, total: 0, count: 0 };
          }
          monthlyMap[ym].count++;
          monthlyMap[ym].total += docValor;
          if (isSaida) {
            monthlyMap[ym].saidas += docValor;
          } else {
            monthlyMap[ym].entradas += docValor;
          }
        }
      }
    }

    // 3. Document types distribution
    const totalAllDocs = documents.length + spedFiles.length;
    const distribuicaoTipos: TypeDistribution[] = [
      {
        tipo: 'nfe',
        label: 'NF-e (Mod. 55)',
        count: byTipoCounts['nfe']?.count || 0,
        totalValor: Math.round((byTipoCounts['nfe']?.totalValor || 0) * 100) / 100,
        percentage: totalAllDocs > 0 ? Math.round(((byTipoCounts['nfe']?.count || 0) / totalAllDocs) * 100) : 0,
        color: '#818cf8' // Indigo
      },
      {
        tipo: 'nfce',
        label: 'NFC-e (Mod. 65)',
        count: byTipoCounts['nfce']?.count || 0,
        totalValor: Math.round((byTipoCounts['nfce']?.totalValor || 0) * 100) / 100,
        percentage: totalAllDocs > 0 ? Math.round(((byTipoCounts['nfce']?.count || 0) / totalAllDocs) * 100) : 0,
        color: '#34d399' // Green
      },
      {
        tipo: 'nfse',
        label: 'NFS-e (Serviços)',
        count: byTipoCounts['nfse']?.count || 0,
        totalValor: Math.round((byTipoCounts['nfse']?.totalValor || 0) * 100) / 100,
        percentage: totalAllDocs > 0 ? Math.round(((byTipoCounts['nfse']?.count || 0) / totalAllDocs) * 100) : 0,
        color: '#fb923c' // Orange
      },
      {
        tipo: 'cte',
        label: 'CT-e (Mod. 57)',
        count: byTipoCounts['cte']?.count || 0,
        totalValor: Math.round((byTipoCounts['cte']?.totalValor || 0) * 100) / 100,
        percentage: totalAllDocs > 0 ? Math.round(((byTipoCounts['cte']?.count || 0) / totalAllDocs) * 100) : 0,
        color: '#a855f7' // Purple
      },
      {
        tipo: 'sped',
        label: 'SPED Fiscal',
        count: spedFiles.length,
        totalValor: 0,
        percentage: totalAllDocs > 0 ? Math.round((spedFiles.length / totalAllDocs) * 100) : 0,
        color: '#60a5fa' // Blue
      }
    ];

    // 4. Monthly Trend sorted chronologically
    const evolucaoMensal: MonthlyTrend[] = Object.keys(monthlyMap)
      .sort((a, b) => a.localeCompare(b))
      .map(mes => ({
        mes,
        mesFormatado: this.formatMonthYear(mes),
        entradas: Math.round(monthlyMap[mes].entradas * 100) / 100,
        saidas: Math.round(monthlyMap[mes].saidas * 100) / 100,
        total: Math.round(monthlyMap[mes].total * 100) / 100,
        count: monthlyMap[mes].count
      }));

    // 5. Top Partners sorted by financial total
    const topFornecedores: PartnerSummary[] = Object.values(suppliersMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(s => ({ ...s, total: Math.round(s.total * 100) / 100 }));

    const topClientes: PartnerSummary[] = Object.values(clientsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(c => ({ ...c, total: Math.round(c.total * 100) / 100 }));

    // 6. Recent documents
    const sortedDocs = [...documents].sort((a, b) => {
      const dateA = new Date(a.dataEmissao || a.createdAt).getTime();
      const dateB = new Date(b.dataEmissao || b.createdAt).getTime();
      return dateB - dateA;
    });
    const documentosRecentes = sortedDocs.slice(0, 8);

    // 7. Latest SPED file
    const ultimoSped = spedFiles.length > 0 ? spedFiles[0] : undefined;

    const totalImpostos = totalIcms + totalIss + totalPis + totalCofins + totalIpi;

    return {
      totalDocs: totalAllDocs,
      totalFiscalDocs: documents.length,
      totalSpedFiles: spedFiles.length,
      totalValor: Math.round(totalValor * 100) / 100,
      entradas: {
        total: Math.round(totalEntradas * 100) / 100,
        count: countEntradas
      },
      saidas: {
        total: Math.round(totalSaidas * 100) / 100,
        count: countSaidas
      },
      impostos: {
        icms: Math.round(totalIcms * 100) / 100,
        iss: Math.round(totalIss * 100) / 100,
        pis: Math.round(totalPis * 100) / 100,
        cofins: Math.round(totalCofins * 100) / 100,
        ipi: Math.round(totalIpi * 100) / 100,
        total: Math.round(totalImpostos * 100) / 100
      },
      distribuicaoTipos,
      evolucaoMensal,
      topFornecedores,
      topClientes,
      documentosRecentes,
      ultimoSped
    };
  }

  private formatMonthYear(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const [year, month] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const idx = parseInt(month, 10) - 1;
    const name = months[idx] || month;
    return `${name}/${year}`;
  }
}

export const dashboardService = new DashboardService();
