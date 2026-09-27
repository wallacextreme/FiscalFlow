import type { RouteContext } from '../router/index.ts';
import { DocumentRepository } from '../database/repositories/document.repository.ts';
import { companyService } from '../services/company.service.ts';
import type { FiscalDocument, DocumentType, DocumentSituacao } from '../types/models.ts';
import { 
  formatCurrency, 
  formatDate, 
  formatCnpjOrCpf 
} from '../utils/validators.ts';
import { toast } from '../components/toast.ts';
import { showDocumentDetailsModal } from '../components/document-modal.ts';
import { exportService } from '../services/export.service.ts';

export function renderDocumentsPage(_ctx: RouteContext, container: HTMLElement): void {
  const documentRepo = new DocumentRepository();

  let currentPage = 1;
  const pageSize = 20;
  let totalDocuments = 0;
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async function renderLayout(): Promise<void> {
    const activeCompany = await companyService.getActiveCompany();

    if (!activeCompany) {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-header__title">Documentos Fiscais</h1>
            <p class="page-header__subtitle">Consulta, validação e organização de notas fiscais eletrônicas</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione uma empresa ativa para visualizar, filtrar e auditar seus documentos fiscais.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-doc">
            Gerenciar Empresas
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Documentos Fiscais</h1>
          <p class="page-header__subtitle">
            Empresa: <strong style="color: var(--text-primary);">${activeCompany.razaoSocial}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${formatCnpjOrCpf(activeCompany.cnpj)})
            </span>
          </p>
        </div>
        <div class="page-header__actions">
          <a href="#/export" class="btn btn--secondary" id="btn-goto-export">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Central de Exportação
          </a>
          <a href="#/import" class="btn btn--primary" id="btn-import-docs">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar Arquivos
          </a>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);">
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
          <!-- Search Input -->
          <div style="flex: 2; min-width: 240px; position: relative;">
            <input 
              type="text" 
              class="input" 
              id="filter-search" 
              placeholder="Pesquisar por número, chave de acesso, CNPJ ou razão social..."
              style="padding-left: 34px;"
            />
            <svg style="position: absolute; left: 10px; top: 10px; width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          <!-- Tipo Filter -->
          <div style="flex: 1; min-width: 140px;">
            <select class="input" id="filter-type">
              <option value="">Todos os tipos</option>
              <option value="nfe">NF-e (55)</option>
              <option value="nfce">NFC-e (65)</option>
              <option value="nfse">NFS-e (Serviço)</option>
              <option value="cte">CT-e (57)</option>
            </select>
          </div>

          <!-- Situacao Filter -->
          <div style="flex: 1; min-width: 140px;">
            <select class="input" id="filter-situacao">
              <option value="">Todas as situações</option>
              <option value="autorizada">Autorizada</option>
              <option value="cancelada">Cancelada</option>
              <option value="inutilizada">Inutilizada</option>
              <option value="denegada">Denegada</option>
            </select>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn--secondary btn--sm" id="btn-clear-filters" type="button">Limpar</button>
            <button class="btn btn--secondary btn--sm" id="btn-export-filtered-csv" type="button" title="Exportar documentos filtrados para CSV">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container">
        <table class="table" id="documents-table">
          <thead>
            <tr>
              <th style="width: 110px;">Número</th>
              <th style="width: 90px;">Tipo</th>
              <th style="width: 120px;">Emissão</th>
              <th>Emitente</th>
              <th>Destinatário</th>
              <th class="text-right" style="width: 130px;">Valor Total</th>
              <th style="width: 110px;">Situação</th>
              <th style="width: 130px; text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody id="documents-tbody">
            <tr>
              <td colspan="8" style="text-align: center; padding: var(--space-8);">
                <div class="spinner spinner--lg" style="margin: 0 auto var(--space-2);"></div>
                <div style="color: var(--text-muted); font-size: 0.8125rem;">Carregando documentos fiscais...</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" id="documents-empty-state" style="display: none;">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h2 class="empty-state__title">Nenhum documento encontrado</h2>
          <p class="empty-state__description">Nenhum documento fiscal corresponde aos filtros selecionados.</p>
          <button class="btn btn--secondary btn--sm" id="btn-empty-clear" style="margin-top: var(--space-2);">Limpar Filtros</button>
        </div>

        <!-- Pagination Bar -->
        <div class="pagination" id="documents-pagination" style="display: none;">
          <div>
            Mostrando <span id="pag-showing" style="font-weight: 600; color: var(--text-primary);">0-0</span> de <span id="pag-total" style="font-weight: 600; color: var(--text-primary);">0</span> documentos
          </div>
          <div class="pagination__controls">
            <button class="btn btn--secondary btn--sm" id="btn-prev-page" disabled>Anterior</button>
            <span id="pag-current" style="font-size: 0.75rem; padding: 0 var(--space-2); color: var(--text-muted);">Página 1</span>
            <button class="btn btn--secondary btn--sm" id="btn-next-page" disabled>Próxima</button>
          </div>
        </div>
      </div>
    `;

    bindEvents();
    loadDocuments();
  }

  function bindEvents(): void {
    const searchInput = container.querySelector<HTMLInputElement>('#filter-search');
    const typeSelect = container.querySelector<HTMLSelectElement>('#filter-type');
    const situacaoSelect = container.querySelector<HTMLSelectElement>('#filter-situacao');
    const clearBtn = container.querySelector<HTMLButtonElement>('#btn-clear-filters');
    const emptyClearBtn = container.querySelector<HTMLButtonElement>('#btn-empty-clear');

    searchInput?.addEventListener('input', () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadDocuments();
      }, 250);
    });

    typeSelect?.addEventListener('change', () => {
      currentPage = 1;
      loadDocuments();
    });

    situacaoSelect?.addEventListener('change', () => {
      currentPage = 1;
      loadDocuments();
    });

    const resetFilters = () => {
      if (searchInput) searchInput.value = '';
      if (typeSelect) typeSelect.value = '';
      if (situacaoSelect) situacaoSelect.value = '';
      currentPage = 1;
      loadDocuments();
    };

    clearBtn?.addEventListener('click', resetFilters);
    emptyClearBtn?.addEventListener('click', resetFilters);

    // Export Filtered Documents to CSV
    const exportFilteredBtn = container.querySelector<HTMLButtonElement>('#btn-export-filtered-csv');
    exportFilteredBtn?.addEventListener('click', async () => {
      const activeCompany = await companyService.getActiveCompany();
      if (!activeCompany) return;

      const search = searchInput?.value.trim() || undefined;
      const tipo = (typeSelect?.value as DocumentType) || undefined;
      const situacao = (situacaoSelect?.value as DocumentSituacao) || undefined;

      try {
        exportFilteredBtn.disabled = true;
        const originalText = exportFilteredBtn.innerHTML;
        exportFilteredBtn.innerHTML = `
          <div class="spinner spinner--sm" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></div>
          Exportando...
        `;

        const result = await documentRepo.findPaginated({
          companyId: activeCompany.id,
          page: 1,
          pageSize: 10000,
          search,
          tipo,
          situacao
        });

        if (result.data.length === 0) {
          toast.warning('Nenhum documento encontrado com os filtros atuais.');
          exportFilteredBtn.innerHTML = originalText;
          exportFilteredBtn.disabled = false;
          return;
        }

        const csvString = exportService.exportDocumentsToCsv(result.data);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const cleanCnpj = activeCompany.cnpj.replace(/\D/g, '');
        const filename = `documentos_${cleanCnpj}_${new Date().toISOString().slice(0, 10)}.csv`;
        const saved = await exportService.saveBlobFile(blob, filename, [
          { name: 'Arquivo CSV', extensions: ['csv'] }
        ]);

        if (saved) {
          toast.success(`${result.data.length} documentos exportados com sucesso!`);
        }
      } catch (err) {
        console.error('Erro ao exportar documentos para CSV:', err);
        toast.error('Erro ao exportar documentos para CSV.');
      } finally {
        exportFilteredBtn.disabled = false;
        exportFilteredBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar CSV
        `;
      }
    });

    // Pagination
    container.querySelector<HTMLButtonElement>('#btn-prev-page')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadDocuments();
      }
    });

    container.querySelector<HTMLButtonElement>('#btn-next-page')?.addEventListener('click', () => {
      const maxPages = Math.ceil(totalDocuments / pageSize);
      if (currentPage < maxPages) {
        currentPage++;
        loadDocuments();
      }
    });
  }

  async function loadDocuments(): Promise<void> {
    const activeCompany = await companyService.getActiveCompany();
    if (!activeCompany) return;

    const tbody = container.querySelector<HTMLTableSectionElement>('#documents-tbody');
    const emptyState = container.querySelector<HTMLElement>('#documents-empty-state');
    const pagination = container.querySelector<HTMLElement>('#documents-pagination');
    const table = container.querySelector<HTMLElement>('#documents-table');

    const searchInput = container.querySelector<HTMLInputElement>('#filter-search');
    const typeSelect = container.querySelector<HTMLSelectElement>('#filter-type');
    const situacaoSelect = container.querySelector<HTMLSelectElement>('#filter-situacao');

    const search = searchInput?.value.trim() || undefined;
    const tipo = (typeSelect?.value as DocumentType) || undefined;
    const situacao = (situacaoSelect?.value as DocumentSituacao) || undefined;

    try {
      const result = await documentRepo.findPaginated({
        companyId: activeCompany.id,
        page: currentPage,
        pageSize,
        search,
        tipo,
        situacao
      });

      totalDocuments = result.total;

      if (!tbody) return;

      if (result.data.length === 0) {
        tbody.innerHTML = '';
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        if (pagination) pagination.style.display = 'none';
        return;
      }

      if (table) table.style.display = 'table';
      if (emptyState) emptyState.style.display = 'none';
      if (pagination) pagination.style.display = 'flex';

      // Update Pagination info
      const start = (currentPage - 1) * pageSize + 1;
      const end = Math.min(currentPage * pageSize, totalDocuments);
      const maxPages = Math.ceil(totalDocuments / pageSize);

      const pagShowing = container.querySelector<HTMLElement>('#pag-showing');
      const pagTotal = container.querySelector<HTMLElement>('#pag-total');
      const pagCurrent = container.querySelector<HTMLElement>('#pag-current');
      const btnPrev = container.querySelector<HTMLButtonElement>('#btn-prev-page');
      const btnNext = container.querySelector<HTMLButtonElement>('#btn-next-page');

      if (pagShowing) pagShowing.textContent = `${start}-${end}`;
      if (pagTotal) pagTotal.textContent = String(totalDocuments);
      if (pagCurrent) pagCurrent.textContent = `Página ${currentPage} de ${maxPages || 1}`;
      if (btnPrev) btnPrev.disabled = currentPage <= 1;
      if (btnNext) btnNext.disabled = currentPage >= maxPages;

      // Render Rows
      tbody.innerHTML = result.data.map((doc: FiscalDocument) => {
        const typeBadge = `<span class="badge badge--${doc.tipo}">${doc.tipo.toUpperCase()}</span>`;
        const situacaoBadge = `<span class="badge badge--${doc.situacao}">${doc.situacao.charAt(0).toUpperCase() + doc.situacao.slice(1)}</span>`;
        const emitenteCnpj = formatCnpjOrCpf(doc.emitenteCnpjCpf);
        const destCnpj = doc.destinatarioCnpjCpf ? formatCnpjOrCpf(doc.destinatarioCnpjCpf) : '-';
        const formattedDate = formatDate(doc.dataEmissao);

        return `
          <tr data-doc-id="${doc.id}" style="cursor: pointer;">
            <td>
              <div class="text-mono" style="font-weight: 600; color: var(--text-primary); font-size: 0.875rem;">
                ${doc.numero}
              </div>
              <div style="font-size: 0.6875rem; color: var(--text-muted);">
                Série ${doc.serie || '1'}
              </div>
            </td>
            <td>${typeBadge}</td>
            <td style="font-size: 0.8125rem;">${formattedDate}</td>
            <td>
              <div class="truncate" style="max-width: 220px; font-weight: 500;" title="${escapeHtml(doc.emitenteRazaoSocial)}">
                ${escapeHtml(doc.emitenteRazaoSocial)}
              </div>
              <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                ${emitenteCnpj}
              </div>
            </td>
            <td>
              <div class="truncate" style="max-width: 220px; font-weight: 500;" title="${escapeHtml(doc.destinatarioRazaoSocial || 'Consumidor Final')}">
                ${escapeHtml(doc.destinatarioRazaoSocial || 'Consumidor Final')}
              </div>
              <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                ${destCnpj}
              </div>
            </td>
            <td class="text-right">
              <span class="text-mono" style="font-weight: 700; color: var(--text-primary);">
                ${formatCurrency(doc.valorTotal)}
              </span>
            </td>
            <td>${situacaoBadge}</td>
            <td style="text-align: center;" onclick="event.stopPropagation();">
              <div style="display: flex; justify-content: center; gap: var(--space-1);">
                <!-- Visualizar Detalhes -->
                <button 
                  class="btn btn--secondary btn--sm btn-view-doc" 
                  data-doc-id="${doc.id}" 
                  title="Ver Detalhes do Documento"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>

                <!-- Copiar Chave -->
                ${doc.chaveAcesso ? `
                  <button 
                    class="btn btn--secondary btn--sm btn-copy-chave" 
                    data-chave="${doc.chaveAcesso}" 
                    title="Copiar Chave de Acesso"
                    style="padding: 4px 6px;"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                ` : ''}

                <!-- Baixar XML -->
                <button 
                  class="btn btn--secondary btn--sm btn-download-xml" 
                  data-doc-id="${doc.id}" 
                  title="Baixar XML Original"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach row click and button listeners
      tbody.querySelectorAll<HTMLTableRowElement>('tr[data-doc-id]').forEach(row => {
        const docId = row.getAttribute('data-doc-id');
        if (!docId) return;

        row.addEventListener('click', () => openDocumentDetails(docId));
      });

      tbody.querySelectorAll<HTMLButtonElement>('.btn-view-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const docId = btn.getAttribute('data-doc-id');
          if (docId) openDocumentDetails(docId);
        });
      });

      tbody.querySelectorAll<HTMLButtonElement>('.btn-copy-chave').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const chave = btn.getAttribute('data-chave');
          if (chave) {
            await copyToClipboard(chave, 'Chave de acesso copiada!');
          }
        });
      });

      tbody.querySelectorAll<HTMLButtonElement>('.btn-download-xml').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const docId = btn.getAttribute('data-doc-id');
          if (docId) {
            const doc = await documentRepo.findById(docId);
            if (doc) {
              downloadXmlFile(doc);
            }
          }
        });
      });

    } catch (err) {
      console.error('Failed to load documents:', err);
      toast.show('Erro ao carregar documentos fiscais.', 'error');
    }
  }

  async function openDocumentDetails(documentId: string): Promise<void> {
    await showDocumentDetailsModal(documentId, documentRepo);
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

  function downloadXmlFile(doc: FiscalDocument): void {
    const filename = `${doc.tipo.toUpperCase()}_${doc.numero}_${doc.chaveAcesso || doc.id}.xml`;
    const blob = new Blob([doc.xmlOriginal], { type: 'application/xml;charset=utf-8;' });
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
    currentPage = 1;
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
