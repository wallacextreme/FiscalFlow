/**
 * FiscalFlow — SPED Fiscal Page
 * 
 * Specialized dashboard and auditor for Brazilian SPED Fiscal (EFD ICMS/IPI) files.
 * Provides block inspection, Bloco C document totals, Bloco E ICMS tax calculations,
 * and raw positional text preview with SHA-256 verification.
 */

import type { RouteContext } from '../router/index.ts';
import { SpedRepository } from '../database/repositories/sped.repository.ts';
import { SpedParser } from '../domain/parsers/sped.parser.ts';
import { companyService } from '../services/company.service.ts';
import type { SpedFile } from '../types/models.ts';
import { 
  formatCurrency, 
  formatDate, 
  formatCnpjOrCpf 
} from '../utils/validators.ts';
import { toast } from '../components/toast.ts';
import { openModal } from '../components/modal.ts';

export function renderSpedPage(_ctx: RouteContext, container: HTMLElement): void {
  const spedRepo = new SpedRepository();
  const spedParser = new SpedParser();

  let searchFilter = '';
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async function renderLayout(): Promise<void> {
    const activeCompany = await companyService.getActiveCompany();

    if (!activeCompany) {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-header__title">SPED Fiscal</h1>
            <p class="page-header__subtitle">Escrituração Fiscal Digital (EFD ICMS/IPI) — Análise e Auditoria</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione uma empresa ativa para visualizar, analisar e auditar seus arquivos SPED Fiscal.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-sped">
            Gerenciar Empresas
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-header__title">SPED Fiscal</h1>
          <p class="page-header__subtitle">
            Escrituração Fiscal Digital (EFD ICMS/IPI) — Empresa: 
            <strong style="color: var(--text-primary);">${escapeHtml(activeCompany.razaoSocial)}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${formatCnpjOrCpf(activeCompany.cnpj)})
            </span>
          </p>
        </div>
        <div class="page-header__actions">
          <a href="#/import" class="btn btn--primary" id="btn-import-sped">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar Arquivo SPED
          </a>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);">
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
          <div style="flex: 1; min-width: 260px; position: relative;">
            <input 
              type="text" 
              class="input" 
              id="sped-filter-search" 
              placeholder="Pesquisar por período (ex: 202401), versão ou finalidade..."
              style="padding-left: 34px;"
            />
            <svg style="position: absolute; left: 10px; top: 10px; width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div>
            <button class="btn btn--secondary btn--sm" id="btn-clear-sped-filter" type="button">Limpar</button>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container">
        <table class="table" id="sped-table" style="display: none;">
          <thead>
            <tr>
              <th>Período</th>
              <th>Empresa Escriturada</th>
              <th>Layout / Finalidade</th>
              <th class="text-right">Total Registros</th>
              <th>Importado Em</th>
              <th style="text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody id="sped-tbody">
            <!-- Dynamically populated -->
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" id="sped-empty-state" style="display: none; padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
          <h2 class="empty-state__title">Nenhum arquivo SPED Fiscal encontrado</h2>
          <p class="empty-state__description">
            Importe arquivos texto EFD ICMS/IPI para auditar blocos estruturais, conferir documentos fiscais e apurações tributárias.
          </p>
          <a href="#/import" class="btn btn--primary">Importar Arquivo SPED</a>
        </div>
      </div>
    `;

    // Filter event listeners
    const searchInput = container.querySelector<HTMLInputElement>('#sped-filter-search');
    const clearBtn = container.querySelector<HTMLButtonElement>('#btn-clear-sped-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchFilter = (e.target as HTMLInputElement).value.trim().toLowerCase();
          void loadSpedList(activeCompany.id);
        }, 250);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchFilter = '';
        void loadSpedList(activeCompany.id);
      });
    }

    await loadSpedList(activeCompany.id);
  }

  async function loadSpedList(companyId: string): Promise<void> {
    const table = container.querySelector<HTMLElement>('#sped-table');
    const tbody = container.querySelector<HTMLElement>('#sped-tbody');
    const emptyState = container.querySelector<HTMLElement>('#sped-empty-state');

    if (!tbody || !table || !emptyState) return;

    try {
      const allFiles = await spedRepo.findByCompany(companyId);

      const files = allFiles.filter(file => {
        if (!searchFilter) return true;
        const term = searchFilter;
        return (
          file.periodo.toLowerCase().includes(term) ||
          file.razaoSocial.toLowerCase().includes(term) ||
          file.cnpj.includes(term) ||
          file.versaoLayout.includes(term) ||
          file.finalidade.toLowerCase().includes(term)
        );
      });

      if (files.length === 0) {
        tbody.innerHTML = '';
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
      }

      table.style.display = 'table';
      emptyState.style.display = 'none';

      tbody.innerHTML = files.map(file => {
        const periodoFormatted = formatPeriodo(file.periodo);
        const dataInicioFormatted = formatDateOnly(file.dataInicio);
        const dataFimFormatted = formatDateOnly(file.dataFim);
        const finalidadeBadge = file.finalidade === 'retificadora'
          ? '<span class="badge badge--cancelada">Retificadora</span>'
          : '<span class="badge badge--autorizada">Original</span>';

        return `
          <tr data-sped-id="${file.id}" style="cursor: pointer;">
            <td>
              <div class="badge badge--nfe" style="font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px;">
                ${periodoFormatted}
              </div>
              <div class="text-muted" style="font-size: 0.6875rem;">
                ${dataInicioFormatted} a ${dataFimFormatted}
              </div>
            </td>
            <td>
              <div class="truncate" style="max-width: 250px; font-weight: 500;" title="${escapeHtml(file.razaoSocial)}">
                ${escapeHtml(file.razaoSocial)}
              </div>
              <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                CNPJ: ${formatCnpjOrCpf(file.cnpj)} ${file.inscricaoEstadual ? `• IE: ${file.inscricaoEstadual}` : ''}
              </div>
            </td>
            <td>
              <span class="badge" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-primary);">
                v${file.versaoLayout}
              </span>
              <span style="margin-left: var(--space-1);">${finalidadeBadge}</span>
            </td>
            <td class="text-right">
              <span class="text-mono" style="font-weight: 700; color: var(--text-primary);">
                ${file.totalRegistros.toLocaleString('pt-BR')}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted);"> linhas</span>
            </td>
            <td style="font-size: 0.8125rem;">
              ${formatDate(file.createdAt)}
            </td>
            <td style="text-align: center;" onclick="event.stopPropagation();">
              <div style="display: flex; justify-content: center; gap: var(--space-1);">
                <!-- Visualizar Detalhes -->
                <button 
                  class="btn btn--secondary btn--sm btn-view-sped" 
                  data-sped-id="${file.id}" 
                  title="Auditar e Ver Detalhes do SPED"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>

                <!-- Baixar TXT -->
                <button 
                  class="btn btn--secondary btn--sm btn-download-sped" 
                  data-sped-id="${file.id}" 
                  title="Baixar Arquivo TXT Original"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>

                <!-- Excluir -->
                <button 
                  class="btn btn--secondary btn--sm btn-delete-sped" 
                  data-sped-id="${file.id}" 
                  title="Excluir Arquivo SPED"
                  style="padding: 4px 6px; color: var(--color-danger);"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Row click opens details
      tbody.querySelectorAll<HTMLTableRowElement>('tr[data-sped-id]').forEach(row => {
        row.addEventListener('click', () => {
          const spedId = row.getAttribute('data-sped-id');
          if (spedId) void openSpedDetails(spedId);
        });
      });

      // Actions event listeners
      tbody.querySelectorAll<HTMLButtonElement>('.btn-view-sped').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const spedId = btn.getAttribute('data-sped-id');
          if (spedId) void openSpedDetails(spedId);
        });
      });

      tbody.querySelectorAll<HTMLButtonElement>('.btn-download-sped').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const spedId = btn.getAttribute('data-sped-id');
          if (spedId) {
            const file = await spedRepo.findById(spedId);
            if (file) downloadSpedFile(file);
          }
        });
      });

      tbody.querySelectorAll<HTMLButtonElement>('.btn-delete-sped').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const spedId = btn.getAttribute('data-sped-id');
          if (!spedId) return;

          const file = await spedRepo.findById(spedId);
          if (!file) return;

          confirmDeleteSped(file, companyId);
        });
      });

    } catch (err) {
      console.error('Failed to load SPED files:', err);
      toast.show('Erro ao carregar arquivos SPED Fiscal.', 'error');
    }
  }

  async function openSpedDetails(spedId: string): Promise<void> {
    const file = await spedRepo.findById(spedId);
    if (!file) {
      toast.show('Arquivo SPED não encontrado.', 'error');
      return;
    }

    try {
      const parseResult = await spedParser.parse(file.conteudoOriginal, file.companyId, file.conteudoHash);
      const summary = parseResult.summary;

      const modalContent = document.createElement('div');
      modalContent.innerHTML = `
        <!-- Modal Navigation Tabs -->
        <div class="tabs-nav" id="sped-modal-tabs">
          <button class="tab-btn tab-btn--active" data-tab="tab-sped-overview">Visão Geral & Blocos</button>
          <button class="tab-btn" data-tab="tab-sped-blococ">Documentos (Bloco C)</button>
          <button class="tab-btn" data-tab="tab-sped-bloce">Apuração ICMS (Bloco E)</button>
          <button class="tab-btn" data-tab="tab-sped-txt">Arquivo Original (TXT)</button>
        </div>

        <!-- Tab 1: Overview & Blocks -->
        <div class="tab-content" id="tab-sped-overview">
          <!-- General Info Grid -->
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-card__label">Período de Escrituração</div>
              <div class="detail-card__value text-mono" style="color: var(--accent-primary);">
                ${formatPeriodo(file.periodo)}
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Data Início</div>
              <div class="detail-card__value" style="font-size: 0.875rem;">${formatDateOnly(file.dataInicio)}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Data Fim</div>
              <div class="detail-card__value" style="font-size: 0.875rem;">${formatDateOnly(file.dataFim)}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Versão Leiaute</div>
              <div class="detail-card__value text-mono">${file.versaoLayout}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Finalidade</div>
              <div class="detail-card__value">
                <span class="badge ${file.finalidade === 'retificadora' ? 'badge--cancelada' : 'badge--autorizada'}">
                  ${file.finalidade === 'retificadora' ? 'Retificadora' : 'Original'}
                </span>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Total de Registros</div>
              <div class="detail-card__value text-mono">${file.totalRegistros.toLocaleString('pt-BR')}</div>
            </div>
          </div>

          <!-- Empresa & Contabilista Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
            <!-- Empresa -->
            <div class="card" style="padding: var(--space-4);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
                Empresa Escriturada (Registro 0000)
              </div>
              <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                ${escapeHtml(file.razaoSocial)}
              </div>
              <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
                CNPJ: ${formatCnpjOrCpf(file.cnpj)}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                Inscrição Estadual: <strong>${file.inscricaoEstadual || 'Não informada'}</strong>
              </div>
            </div>

            <!-- Contabilista -->
            <div class="card" style="padding: var(--space-4);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
                Contabilista Responsável (Registro 0100)
              </div>
              ${summary.contador ? `
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                  ${escapeHtml(summary.contador.nome)}
                </div>
                <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
                  CPF/CNPJ: ${formatCnpjOrCpf(summary.contador.cpfCnpj)}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  CRC: <strong>${summary.contador.crc}</strong>
                </div>
              ` : `
                <div style="color: var(--text-muted); font-size: 0.8125rem;">
                  Dados do contador não identificados no Registro 0100 deste arquivo.
                </div>
              `}
            </div>
          </div>

          <!-- Hash SHA-256 Card -->
          <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); background-color: var(--bg-tertiary);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1);">
              <span style="font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">
                Assinatura de Integridade (SHA-256)
              </span>
              <button class="btn btn--secondary btn--sm" id="btn-modal-copy-hash" type="button" style="padding: 2px 8px; font-size: 0.75rem;">
                Copiar Hash
              </button>
            </div>
            <div class="text-mono" style="font-size: 0.75rem; color: var(--text-secondary); word-break: break-all;">
              ${file.conteudoHash}
            </div>
          </div>

          <!-- Active Blocks Grid -->
          <div class="detail-section-title">Estrutura de Blocos Escriturados</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-4);">
            ${Object.values(summary.blocos).map(b => {
              const percentage = file.totalRegistros > 0 
                ? Math.round((b.totalRegistros / file.totalRegistros) * 100) 
                : 0;

              return `
                <div class="card" style="padding: var(--space-3) var(--space-4); border: 1px solid var(--border-primary);">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1);">
                    <span class="badge" style="font-weight: 700; background: var(--bg-tertiary); color: var(--accent-primary);">
                      Bloco ${b.bloco}
                    </span>
                    <span class="text-mono text-muted" style="font-size: 0.75rem;">
                      ${percentage}% do arquivo
                    </span>
                  </div>
                  <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
                    ${escapeHtml(b.nome)}
                  </div>
                  <div class="text-mono" style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
                    ${b.totalRegistros.toLocaleString('pt-BR')} 
                    <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted);">registros</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Tab 2: Bloco C Documents -->
        <div class="tab-content" id="tab-sped-blococ" style="display: none;">
          <div class="detail-section-title">Documentos Fiscais I - Mercadorias (Registro C100)</div>
          
          <div class="detail-grid" style="margin-top: var(--space-3);">
            <div class="detail-card">
              <div class="detail-card__label">Total Notas C100</div>
              <div class="detail-card__value text-mono">${summary.documentosC100.total.toLocaleString('pt-BR')}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Valor Total das Operações</div>
              <div class="detail-card__value text-mono" style="color: var(--accent-primary);">
                ${formatCurrency(summary.documentosC100.valorTotal)}
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Total ICMS Destacado</div>
              <div class="detail-card__value text-mono" style="color: var(--color-success, #22c55e);">
                ${formatCurrency(summary.documentosC100.valorIcms)}
              </div>
            </div>
          </div>

          <div class="card" style="padding: var(--space-4); margin-top: var(--space-4); background-color: var(--bg-tertiary);">
            <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary);">
              Informações do Bloco C
            </h4>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6;">
              O Bloco C reúne todas as notas fiscais de entrada e saída de mercadorias escrituradas pela empresa no período 
              (incluindo Notas Fiscais Eletrônicas NF-e modelo 55 e NFC-e modelo 65). 
              Os totais consolidados acima representam os registros analíticos do Registro C100 identificados no arquivo digital.
            </p>
          </div>
        </div>

        <!-- Tab 3: Bloco E Apuração -->
        <div class="tab-content" id="tab-sped-bloce" style="display: none;">
          <div class="detail-section-title">Apuração Própria do ICMS (Registro E110)</div>

          ${summary.apuracaoIcms ? `
            <div class="detail-grid" style="margin-top: var(--space-3);">
              <div class="detail-card">
                <div class="detail-card__label">Total Débitos (Saídas)</div>
                <div class="detail-card__value text-mono" style="color: var(--color-danger, #ef4444);">
                  ${formatCurrency(summary.apuracaoIcms.debitos)}
                </div>
              </div>
              <div class="detail-card">
                <div class="detail-card__label">Total Créditos (Entradas)</div>
                <div class="detail-card__value text-mono" style="color: var(--color-success, #22c55e);">
                  ${formatCurrency(summary.apuracaoIcms.creditos)}
                </div>
              </div>
              <div class="detail-card">
                <div class="detail-card__label">Saldo Devedor a Recolher</div>
                <div class="detail-card__value text-mono" style="color: ${summary.apuracaoIcms.saldoDevedor > 0 ? 'var(--color-danger, #ef4444)' : 'var(--text-primary)'};">
                  ${formatCurrency(summary.apuracaoIcms.saldoDevedor)}
                </div>
              </div>
              <div class="detail-card">
                <div class="detail-card__label">Saldo Credor a Transportar</div>
                <div class="detail-card__value text-mono" style="color: ${summary.apuracaoIcms.saldoCredor > 0 ? 'var(--color-success, #22c55e)' : 'var(--text-primary)'};">
                  ${formatCurrency(summary.apuracaoIcms.saldoCredor)}
                </div>
              </div>
            </div>

            <!-- Apuração Assessment Alert -->
            <div style="margin-top: var(--space-4);">
              ${summary.apuracaoIcms.saldoDevedor > 0 ? `
                <div class="card" style="padding: var(--space-4); border-left: 4px solid var(--color-warning, #f59e0b); background: var(--bg-tertiary);">
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                    Atenção: Saldo devedor de ICMS apurado
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                    O valor de <strong>${formatCurrency(summary.apuracaoIcms.saldoDevedor)}</strong> deve ser recolhido via DARE/GNRE nos prazos legais regulamentares da SEFAZ estadual.
                  </div>
                </div>
              ` : summary.apuracaoIcms.saldoCredor > 0 ? `
                <div class="card" style="padding: var(--space-4); border-left: 4px solid var(--color-success, #22c55e); background: var(--bg-tertiary);">
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                    Saldo Credor Acumulado para o Período Seguinte
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                    O saldo credor de <strong>${formatCurrency(summary.apuracaoIcms.saldoCredor)}</strong> será transportado para dedução na apuração do próximo mês de escrituração.
                  </div>
                </div>
              ` : `
                <div class="card" style="padding: var(--space-4); background: var(--bg-tertiary);">
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                    Apuração Equilibrada
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                    Não há saldo devedor nem saldo credor a transportar apurados no Registro E110 deste período.
                  </div>
                </div>
              `}
            </div>
          ` : `
            <div class="empty-state card" style="padding: var(--space-6); margin-top: var(--space-3);">
              <h3 class="empty-state__title" style="font-size: 1rem;">Registro E110 não localizado</h3>
              <p class="empty-state__description">
                Este arquivo SPED Fiscal não possui o registro E110 de apuração própria do ICMS preenchido.
              </p>
            </div>
          `}
        </div>

        <!-- Tab 4: Raw Text Viewer -->
        <div class="tab-content" id="tab-sped-txt" style="display: none;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-2);">
            <span style="font-size: 0.8125rem; color: var(--text-muted);">
              Mostrando prévia dos primeiros 150 registros de ${file.totalRegistros.toLocaleString('pt-BR')} linhas.
            </span>
            <div style="display: flex; gap: var(--space-2);">
              <button class="btn btn--secondary btn--sm" id="btn-modal-copy-txt" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copiar Arquivo Completo
              </button>
              <button class="btn btn--secondary btn--sm" id="btn-modal-download-txt" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar TXT
              </button>
            </div>
          </div>

          <pre class="xml-code-viewer" id="sped-preview-content">${escapeHtml(getPreviewLines(file.conteudoOriginal, 150))}</pre>
        </div>
      `;

      // Tab navigation
      modalContent.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
          const tabTarget = tabBtn.getAttribute('data-tab');
          if (!tabTarget) return;

          modalContent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
          tabBtn.classList.add('tab-btn--active');

          modalContent.querySelectorAll('.tab-content').forEach(content => {
            (content as HTMLElement).style.display = content.id === tabTarget ? 'block' : 'none';
          });
        });
      });

      // Copy Hash
      modalContent.querySelector('#btn-modal-copy-hash')?.addEventListener('click', async () => {
        await copyToClipboard(file.conteudoHash, 'Hash SHA-256 copiado para a área de transferência!');
      });

      // Copy TXT
      modalContent.querySelector('#btn-modal-copy-txt')?.addEventListener('click', async () => {
        await copyToClipboard(file.conteudoOriginal, 'Conteúdo do SPED copiado com sucesso!');
      });

      // Download TXT
      modalContent.querySelector('#btn-modal-download-txt')?.addEventListener('click', () => {
        downloadSpedFile(file);
      });

      openModal({
        title: `SPED Fiscal EFD — Período ${formatPeriodo(file.periodo)} (${file.razaoSocial})`,
        content: modalContent,
        maxWidth: '920px',
        buttons: [
          {
            text: 'Fechar',
            variant: 'secondary'
          }
        ]
      });

    } catch (err) {
      console.error('Failed to parse SPED file details:', err);
      toast.show('Erro ao processar detalhes do arquivo SPED.', 'error');
    }
  }

  function confirmDeleteSped(file: SpedFile, companyId: string): void {
    const confirmContent = document.createElement('div');
    confirmContent.innerHTML = `
      <p style="margin-bottom: var(--space-3); color: var(--text-primary);">
        Tem certeza de que deseja remover o arquivo SPED Fiscal do período 
        <strong>${formatPeriodo(file.periodo)}</strong> da empresa <strong>${escapeHtml(file.razaoSocial)}</strong>?
      </p>
      <div class="card" style="padding: var(--space-3); background-color: var(--bg-tertiary); font-size: 0.8125rem; color: var(--text-secondary);">
        Registros: <strong>${file.totalRegistros.toLocaleString('pt-BR')}</strong><br/>
        Hash: <span class="text-mono" style="font-size: 0.6875rem;">${file.conteudoHash.substring(0, 32)}...</span>
      </div>
      <p style="margin-top: var(--space-3); font-size: 0.8125rem; color: var(--color-danger);">
        ⚠️ Esta ação removerá os dados de auditoria associados a este arquivo digital.
      </p>
    `;

    openModal({
      title: 'Excluir Arquivo SPED Fiscal',
      content: confirmContent,
      maxWidth: '480px',
      buttons: [
        {
          text: 'Cancelar',
          variant: 'secondary'
        },
        {
          text: 'Excluir Arquivo',
          variant: 'danger',
          onClick: async (modal) => {
            try {
              const deleted = await spedRepo.delete(file.id);
              if (deleted) {
                toast.show('Arquivo SPED excluído com sucesso.', 'success');
                modal.close();
                await loadSpedList(companyId);
              } else {
                toast.show('Não foi possível excluir o arquivo SPED.', 'error');
              }
            } catch (err) {
              console.error('Failed to delete SPED file:', err);
              toast.show('Erro ao excluir arquivo SPED.', 'error');
            }
          }
        }
      ]
    });
  }

  function downloadSpedFile(file: SpedFile): void {
    const filename = `SPED_EFD_${file.cnpj}_${file.periodo}.txt`;
    const blob = new Blob([file.conteudoOriginal], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.show(`Download iniciado: ${filename}`, 'info');
  }

  async function copyToClipboard(text: string, successMessage: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.show(successMessage, 'success');
    } catch {
      toast.show('Não foi possível copiar para a área de transferência.', 'error');
    }
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

  function getPreviewLines(content: string, maxLines: number): string {
    const lines = content.split(/\r?\n/);
    if (lines.length <= maxLines) {
      return content;
    }
    const preview = lines.slice(0, maxLines).join('\n');
    return `${preview}\n\n... [${lines.length - maxLines} linhas adicionais ocultas nesta prévia] ...`;
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
