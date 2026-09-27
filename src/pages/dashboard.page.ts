/**
 * FiscalFlow — Executive Dashboard Page
 * 
 * Real-time executive dashboard for active company:
 * - Top KPI metrics (Inputs, Outputs, Net Result, Taxes)
 * - Monthly financial trend chart (Entradas vs Saídas)
 * - Document distribution by model (NF-e, NFC-e, NFS-e, CT-e, SPED)
 * - Tax breakdown (ICMS, ISS, PIS/COFINS, IPI)
 * - Partner rankings (Top 5 Suppliers & Top 5 Clients)
 * - Recent fiscal documents with interactive details modal
 * - SPED Fiscal integration and quick actions
 */

import type { RouteContext } from '../router/index.ts';
import { companyService } from '../services/company.service.ts';
import { dashboardService, type DashboardMetrics } from '../services/dashboard.service.ts';
import { showDocumentDetailsModal } from '../components/document-modal.ts';
import { 
  formatCurrency, 
  formatDate, 
  formatCnpjOrCpf 
} from '../utils/validators.ts';
import { toast } from '../components/toast.ts';

export function renderDashboardPage(_ctx: RouteContext, container: HTMLElement): void {
  async function renderLayout(): Promise<void> {
    const activeCompany = await companyService.getActiveCompany();

    if (!activeCompany) {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-header__title">Dashboard</h1>
            <p class="page-header__subtitle">Visão geral e indicadores fiscais</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione ou cadastre uma empresa ativa para visualizar seus indicadores executivos, gráficos de faturamento e auditoria fiscal.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-dash">
            Gerenciar Empresas
          </a>
        </div>
      `;
      return;
    }

    // Show initial loading skeleton
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Dashboard Executivo</h1>
          <p class="page-header__subtitle">
            Empresa: <strong style="color: var(--text-primary);">${escapeHtml(activeCompany.razaoSocial)}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${formatCnpjOrCpf(activeCompany.cnpj)})
            </span>
          </p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--secondary" id="btn-refresh-dashboard" title="Atualizar Indicadores">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Atualizar
          </button>
          <a href="#/import" class="btn btn--primary" id="btn-quick-import">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar XML / SPED
          </a>
        </div>
      </div>

      <div id="dashboard-content" style="display: flex; flex-direction: column; gap: var(--space-5);">
        <div class="card" style="padding: var(--space-6); text-align: center; color: var(--text-muted);">
          Carregando indicadores fiscais...
        </div>
      </div>
    `;

    try {
      const metrics = await dashboardService.getMetrics(activeCompany.id, activeCompany.cnpj);
      renderDashboardContent(metrics);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      toast.show('Erro ao calcular indicadores do Dashboard.', 'error');
    }

    // Refresh button event listener
    container.querySelector('#btn-refresh-dashboard')?.addEventListener('click', async () => {
      const btn = container.querySelector<HTMLButtonElement>('#btn-refresh-dashboard');
      if (btn) btn.disabled = true;
      try {
        const metrics = await dashboardService.getMetrics(activeCompany.id, activeCompany.cnpj);
        renderDashboardContent(metrics);
        toast.show('Indicadores atualizados com sucesso.', 'info');
      } catch {
        toast.show('Erro ao atualizar indicadores.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function renderDashboardContent(metrics: DashboardMetrics): void {
    const content = container.querySelector<HTMLElement>('#dashboard-content');
    if (!content) return;

    const netResult = metrics.saidas.total - metrics.entradas.total;
    const isNetPositive = netResult >= 0;

    // Monthly chart max value for proportional heights
    const maxMonthlyVal = metrics.evolucaoMensal.length > 0
      ? Math.max(...metrics.evolucaoMensal.map(m => Math.max(m.entradas, m.saidas)), 1)
      : 1;

    content.innerHTML = `
      <!-- Row 1: Top 4 KPI Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: var(--space-4);">
        <!-- Faturamento & Saídas -->
        <div class="card" style="border-left: 4px solid var(--accent-success); position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Faturamento & Saídas
            </div>
            <div style="color: var(--accent-success); background: rgba(34, 197, 94, 0.12); padding: 4px; border-radius: var(--radius-sm);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: var(--text-primary); margin-top: var(--space-2);">
            ${formatCurrency(metrics.saidas.total)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            <strong style="color: var(--text-secondary);">${metrics.saidas.count}</strong> vendas / emissões escrituradas
          </div>
        </div>

        <!-- Compras & Entradas -->
        <div class="card" style="border-left: 4px solid #60a5fa; position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Compras & Entradas
            </div>
            <div style="color: #60a5fa; background: rgba(96, 165, 250, 0.12); padding: 4px; border-radius: var(--radius-sm);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>
            </div>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: var(--text-primary); margin-top: var(--space-2);">
            ${formatCurrency(metrics.entradas.total)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            <strong style="color: var(--text-secondary);">${metrics.entradas.count}</strong> aquisições / fretes recebidos
          </div>
        </div>

        <!-- Resultado Operacional -->
        <div class="card" style="border-left: 4px solid var(--accent-primary); position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Resultado Operacional
            </div>
            <span class="badge ${isNetPositive ? 'badge--autorizada' : 'badge--cancelada'}" style="font-size: 0.6875rem;">
              ${isNetPositive ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: ${isNetPositive ? 'var(--accent-success)' : 'var(--accent-danger)'}; margin-top: var(--space-2);">
            ${isNetPositive ? '+' : ''}${formatCurrency(netResult)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            Total Movimentado: <strong style="color: var(--text-secondary);">${formatCurrency(metrics.totalValor)}</strong>
          </div>
        </div>

        <!-- Tributos Destacados -->
        <div class="card" style="border-left: 4px solid #f59e0b; position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Tributos Destacados
            </div>
            <div style="color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 4px; border-radius: var(--radius-sm);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: #f59e0b; margin-top: var(--space-2);">
            ${formatCurrency(metrics.impostos.total)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            ICMS: ${formatCurrency(metrics.impostos.icms)} • ISS: ${formatCurrency(metrics.impostos.iss)}
          </div>
        </div>
      </div>

      <!-- Row 2: Evolução Mensal & Distribuição de Documentos (60% / 40%) -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5);">
        <!-- Evolução Mensal -->
        <div class="card" style="padding: var(--space-5);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
            <div>
              <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Evolução Mensal (Entradas vs Saídas)
              </h2>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
                Volume financeiro escriturado por período de emissão
              </p>
            </div>
            <!-- Legend -->
            <div style="display: flex; gap: var(--space-3); font-size: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--accent-success);"></span>
                <span style="color: var(--text-secondary);">Saídas</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 10px; height: 10px; border-radius: 2px; background: #60a5fa;"></span>
                <span style="color: var(--text-secondary);">Entradas</span>
              </div>
            </div>
          </div>

          ${metrics.evolucaoMensal.length === 0 ? `
            <div class="empty-state" style="padding: var(--space-6); min-height: 180px;">
              <svg class="empty-state__icon" style="width: 40px; height: 40px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              <div class="empty-state__title" style="font-size: 0.875rem;">Nenhum histórico mensal registrado</div>
              <p class="empty-state__description" style="font-size: 0.75rem;">
                Importe documentos fiscais autorizados para visualizar o gráfico temporal de compras e vendas.
              </p>
            </div>
          ` : `
            <!-- Responsive Bar Chart -->
            <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding: var(--space-3) 0; border-bottom: 1px solid var(--border-primary); gap: var(--space-3);">
              ${metrics.evolucaoMensal.map(m => {
                const heightSaidas = Math.max(6, Math.round((m.saidas / maxMonthlyVal) * 160));
                const heightEntradas = Math.max(6, Math.round((m.entradas / maxMonthlyVal) * 160));

                return `
                  <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 48px;" title="${m.mesFormatado}: Saídas ${formatCurrency(m.saidas)} | Entradas ${formatCurrency(m.entradas)}">
                    <div style="display: flex; align-items: flex-end; gap: 4px; height: 160px; width: 100%; justify-content: center;">
                      <!-- Barra Saídas -->
                      <div style="width: 16px; height: ${heightSaidas}px; background: var(--accent-success); border-radius: 3px 3px 0 0; transition: height 300ms ease;" title="Saídas: ${formatCurrency(m.saidas)}"></div>
                      <!-- Barra Entradas -->
                      <div style="width: 16px; height: ${heightEntradas}px; background: #60a5fa; border-radius: 3px 3px 0 0; transition: height 300ms ease;" title="Entradas: ${formatCurrency(m.entradas)}"></div>
                    </div>
                    <div style="margin-top: var(--space-2); font-size: 0.6875rem; color: var(--text-secondary); font-weight: 500; white-space: nowrap;">
                      ${m.mesFormatado}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Distribuição por Tipo de Documento -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Documentos por Tipo
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              ${metrics.totalDocs.toLocaleString('pt-BR')} registros no total
            </p>
          </div>

          <!-- Stacked Progress Bar -->
          <div style="display: flex; height: 10px; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-tertiary); margin-bottom: var(--space-4);">
            ${metrics.distribuicaoTipos.map(t => `
              <div style="width: ${t.percentage}%; background: ${t.color}; transition: width 300ms ease;" title="${t.label}: ${t.count} (${t.percentage}%)"></div>
            `).join('')}
          </div>

          <!-- Types Breakdown List -->
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            ${metrics.distribuicaoTipos.map(t => `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem;">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${t.color}; flex-shrink: 0;"></span>
                  <span style="color: var(--text-primary); font-weight: 500;">${t.label}</span>
                </div>
                <div style="text-align: right;">
                  <span class="text-mono" style="font-weight: 600; color: var(--text-primary);">${t.count}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">(${t.percentage}%)</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Row 3: Composição dos Tributos & Status do SPED Fiscal (50% / 50%) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
        <!-- Composição Tributária Detalhada -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Composição dos Tributos Destacados
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Detalhamento por esfera tributária (Estadual, Municipal e Federal)
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            <!-- ICMS -->
            <div class="detail-card" style="border-left: 3px solid var(--accent-success);">
              <div class="detail-card__label">ICMS (Estadual)</div>
              <div class="detail-card__value text-mono" style="color: var(--accent-success);">
                ${formatCurrency(metrics.impostos.icms)}
              </div>
            </div>

            <!-- ISS -->
            <div class="detail-card" style="border-left: 3px solid #fb923c;">
              <div class="detail-card__label">ISS (Municipal)</div>
              <div class="detail-card__value text-mono" style="color: #fb923c;">
                ${formatCurrency(metrics.impostos.iss)}
              </div>
            </div>

            <!-- PIS / COFINS -->
            <div class="detail-card" style="border-left: 3px solid #3b82f6;">
              <div class="detail-card__label">PIS & COFINS (Federal)</div>
              <div class="detail-card__value text-mono" style="color: #3b82f6;">
                ${formatCurrency(metrics.impostos.pis + metrics.impostos.cofins)}
              </div>
            </div>

            <!-- IPI -->
            <div class="detail-card" style="border-left: 3px solid #a855f7;">
              <div class="detail-card__label">IPI (Federal)</div>
              <div class="detail-card__value text-mono" style="color: #a855f7;">
                ${formatCurrency(metrics.impostos.ipi)}
              </div>
            </div>
          </div>
        </div>

        <!-- Status do SPED Fiscal & Ações Rápidas -->
        <div class="card" style="padding: var(--space-5); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="margin-bottom: var(--space-4);">
              <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Auditoria & SPED Fiscal
              </h2>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
                Escrituração Fiscal Digital (EFD ICMS/IPI)
              </p>
            </div>

            ${metrics.ultimoSped ? `
              <div class="card" style="padding: var(--space-3) var(--space-4); background: var(--bg-tertiary); margin-bottom: var(--space-3);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span class="badge badge--nfe" style="font-weight: 600;">
                    Período: ${formatPeriodo(metrics.ultimoSped.periodo)}
                  </span>
                  <span class="badge badge--autorizada">Ativo</span>
                </div>
                <div style="font-size: 0.8125rem; font-weight: 500; color: var(--text-primary);">
                  ${metrics.ultimoSped.totalRegistros.toLocaleString('pt-BR')} registros escriturados (v${metrics.ultimoSped.versaoLayout})
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                  Vigência: ${formatDateOnly(metrics.ultimoSped.dataInicio)} a ${formatDateOnly(metrics.ultimoSped.dataFim)}
                </div>
                <div class="text-mono text-muted" style="font-size: 0.6875rem; margin-top: 4px; word-break: break-all;">
                  SHA-256: ${metrics.ultimoSped.conteudoHash.substring(0, 32)}...
                </div>
              </div>
            ` : `
              <div class="card" style="padding: var(--space-3) var(--space-4); background: var(--bg-tertiary); margin-bottom: var(--space-3); color: var(--text-muted); font-size: 0.8125rem;">
                Nenhum arquivo SPED Fiscal escriturado para esta empresa ainda.
              </div>
            `}
          </div>

          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <a href="#/sped" class="btn btn--secondary btn--sm" style="flex: 1; justify-content: center;">
              Auditar SPED
            </a>
            <a href="#/import" class="btn btn--secondary btn--sm" style="flex: 1; justify-content: center;">
              Importar Lote
            </a>
            <a href="#/documents" class="btn btn--secondary btn--sm" style="flex: 1; justify-content: center;">
              Consultar Docs
            </a>
          </div>
        </div>
      </div>

      <!-- Row 4: Principais Parceiros Comerciais (Top Fornecedores & Clientes) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
        <!-- Top Fornecedores -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Principais Fornecedores (Entradas)
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Maiores volumes de compras e insumos adquiridos
            </p>
          </div>

          ${metrics.topFornecedores.length === 0 ? `
            <div style="color: var(--text-muted); font-size: 0.8125rem; padding: var(--space-4); text-align: center;">
              Nenhum fornecedor registrado ainda.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              ${metrics.topFornecedores.map((f, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: var(--space-3); min-width: 0;">
                    <span style="font-weight: 700; color: var(--accent-primary); font-size: 0.75rem; width: 18px;">#${i + 1}</span>
                    <div style="min-width: 0;">
                      <div class="truncate" style="max-width: 220px; font-weight: 500; font-size: 0.8125rem; color: var(--text-primary);" title="${escapeHtml(f.razaoSocial)}">
                        ${escapeHtml(f.razaoSocial)}
                      </div>
                      <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                        ${formatCnpjOrCpf(f.cnpjCpf)} ${f.uf ? `• ${f.uf}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div class="text-mono" style="font-weight: 700; font-size: 0.8125rem; color: var(--text-primary);">
                      ${formatCurrency(f.total)}
                    </div>
                    <div style="font-size: 0.6875rem; color: var(--text-muted);">
                      ${f.count} ${f.count === 1 ? 'doc' : 'docs'}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Top Clientes -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Principais Clientes / Destinatários (Saídas)
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Maiores destinos de vendas e faturamento escriturado
            </p>
          </div>

          ${metrics.topClientes.length === 0 ? `
            <div style="color: var(--text-muted); font-size: 0.8125rem; padding: var(--space-4); text-align: center;">
              Nenhum cliente registrado ainda.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              ${metrics.topClientes.map((c, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: var(--space-3); min-width: 0;">
                    <span style="font-weight: 700; color: var(--accent-success); font-size: 0.75rem; width: 18px;">#${i + 1}</span>
                    <div style="min-width: 0;">
                      <div class="truncate" style="max-width: 220px; font-weight: 500; font-size: 0.8125rem; color: var(--text-primary);" title="${escapeHtml(c.razaoSocial)}">
                        ${escapeHtml(c.razaoSocial)}
                      </div>
                      <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                        ${formatCnpjOrCpf(c.cnpjCpf)} ${c.uf ? `• ${c.uf}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div class="text-mono" style="font-weight: 700; font-size: 0.8125rem; color: var(--text-primary);">
                      ${formatCurrency(c.total)}
                    </div>
                    <div style="font-size: 0.6875rem; color: var(--text-muted);">
                      ${c.count} ${c.count === 1 ? 'doc' : 'docs'}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Row 5: Documentos Fiscais Recentes (Full Width) -->
      <div class="card" style="padding: var(--space-5);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
          <div>
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Documentos Fiscais Recentes
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Últimas emissões e aquisições registradas no sistema
            </p>
          </div>
          <a href="#/documents" class="btn btn--ghost btn--sm">
            Ver todos os documentos &rarr;
          </a>
        </div>

        ${metrics.documentosRecentes.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-6); min-height: 160px;">
            <svg class="empty-state__icon" style="width: 40px; height: 40px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="empty-state__title" style="font-size: 0.875rem;">Nenhum documento fiscal recente</div>
            <p class="empty-state__description" style="font-size: 0.75rem;">
              Importe arquivos XML para acompanhar emissões e aquisições recentes nesta tabela.
            </p>
            <a href="#/import" class="btn btn--primary btn--sm" style="margin-top: var(--space-2);">
              Importar Documentos
            </a>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="table" style="font-size: 0.8125rem;">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Data Emissão</th>
                  <th>Emitente</th>
                  <th>Destinatário</th>
                  <th class="text-right">Valor Total</th>
                  <th>Situação</th>
                  <th style="text-align: center;">Ações</th>
                </tr>
              </thead>
              <tbody id="dash-recent-tbody">
                ${metrics.documentosRecentes.map(doc => `
                  <tr data-doc-id="${doc.id}" style="cursor: pointer;">
                    <td class="text-mono" style="font-weight: 600; color: var(--text-primary);">
                      ${doc.numero}
                    </td>
                    <td>
                      <span class="badge badge--${doc.tipo}">${doc.tipo.toUpperCase()}</span>
                    </td>
                    <td>
                      ${formatDate(doc.dataEmissao)}
                    </td>
                    <td>
                      <div class="truncate" style="max-width: 180px; font-weight: 500;" title="${escapeHtml(doc.emitenteRazaoSocial)}">
                        ${escapeHtml(doc.emitenteRazaoSocial)}
                      </div>
                    </td>
                    <td>
                      <div class="truncate" style="max-width: 180px; font-weight: 500;" title="${escapeHtml(doc.destinatarioRazaoSocial || 'Consumidor Final')}">
                        ${escapeHtml(doc.destinatarioRazaoSocial || 'Consumidor Final')}
                      </div>
                    </td>
                    <td class="text-right text-mono font-medium" style="color: var(--text-primary); font-weight: 700;">
                      ${formatCurrency(doc.valorTotal)}
                    </td>
                    <td>
                      <span class="badge badge--${doc.situacao}">
                        ${doc.situacao.charAt(0).toUpperCase() + doc.situacao.slice(1)}
                      </span>
                    </td>
                    <td style="text-align: center;" onclick="event.stopPropagation();">
                      <button 
                        class="btn btn--secondary btn--sm btn-dash-view-doc" 
                        data-doc-id="${doc.id}" 
                        title="Ver Detalhes do Documento"
                        style="padding: 4px 6px;"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    // Row clicks and view buttons to open modal
    content.querySelectorAll<HTMLTableRowElement>('tr[data-doc-id]').forEach(row => {
      row.addEventListener('click', () => {
        const docId = row.getAttribute('data-doc-id');
        if (docId) void showDocumentDetailsModal(docId);
      });
    });

    content.querySelectorAll<HTMLButtonElement>('.btn-dash-view-doc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const docId = btn.getAttribute('data-doc-id');
        if (docId) void showDocumentDetailsModal(docId);
      });
    });
  }

  function formatPeriodo(periodo: string): string {
    if (periodo && periodo.length === 6) {
      const year = periodo.substring(0, 4);
      const month = periodo.substring(4, 6);
      return `${month}/${year}`;
    }
    return periodo;
  }

  function formatDateOnly(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.length === 10 && dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return formatDate(dateStr);
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Subscribe to active company changes
  const unsubscribe = companyService.onActiveCompanyChange(() => {
    void renderLayout();
  });

  // Ensure subscription cleanup when page unmounts
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      unsubscribe();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  void renderLayout();
}
