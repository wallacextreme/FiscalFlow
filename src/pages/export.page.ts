/**
 * FiscalFlow — Export Page
 * 
 * Central hub for fiscal document and data exports:
 * - XML packages in ZIP for accounting delivery
 * - Managerial fiscal documents CSV reports
 * - Analytical line-items CSV reports
 * - SPED Fiscal digital bookkeeping archives
 */

import type { RouteContext } from '../router/index.ts';
import { DocumentRepository } from '../database/repositories/document.repository.ts';
import { SpedRepository } from '../database/repositories/sped.repository.ts';
import { companyService } from '../services/company.service.ts';
import { exportService } from '../services/export.service.ts';
import type { DocumentType, DocumentSituacao, FiscalDocument } from '../types/models.ts';
import { formatCnpjOrCpf } from '../utils/validators.ts';
import { toast } from '../components/toast.ts';

export function renderExportPage(_ctx: RouteContext, container: HTMLElement): void {
  const documentRepo = new DocumentRepository();
  const spedRepo = new SpedRepository();

  async function renderLayout(): Promise<void> {
    const activeCompany = await companyService.getActiveCompany();

    if (!activeCompany) {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-header__title">Exportação Fiscal</h1>
            <p class="page-header__subtitle">Exportação em lote de pacotes XML, relatórios gerenciais e dados contábeis</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione uma empresa ativa para exportar documentos fiscais, pacotes contábeis e relatórios analíticos.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-export">
            Gerenciar Empresas
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Exportação Fiscal & Contábil</h1>
          <p class="page-header__subtitle">
            Empresa: <strong style="color: var(--text-primary);">${escapeHtml(activeCompany.razaoSocial)}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${formatCnpjOrCpf(activeCompany.cnpj)})
            </span>
          </p>
        </div>
      </div>

      <!-- Export Configuration & Options Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-6);">
        <!-- Card 1: Pacote XML para Contabilidade (ZIP) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid var(--accent-primary);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: var(--accent-primary); background: rgba(99, 102, 241, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Pacote XML Contábil (ZIP)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Compactação em lote dos arquivos XML originais com assinatura SHA-256 e manifesto estruturado de entrega para envio à contabilidade.
            </p>

            <!-- Filter Controls -->
            <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4);">
              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Tipo de Documento</label>
                <select class="input" id="zip-filter-type" style="width: 100%;">
                  <option value="">Todos os tipos (NF-e, NFC-e, NFS-e, CT-e)</option>
                  <option value="nfe">NF-e (Modelo 55)</option>
                  <option value="nfce">NFC-e (Modelo 65)</option>
                  <option value="nfse">NFS-e (Serviços)</option>
                  <option value="cte">CT-e (Modelo 57)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Situação</label>
                <select class="input" id="zip-filter-situacao" style="width: 100%;">
                  <option value="autorizada">Apenas Autorizadas (Padrão)</option>
                  <option value="">Todas as situações</option>
                  <option value="cancelada">Apenas Canceladas</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div id="zip-progress-container" style="display: none; margin-bottom: var(--space-3);">
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;" id="zip-progress-text">Compactando...</div>
              <div style="height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                <div id="zip-progress-bar" style="width: 0%; height: 100%; background: var(--accent-primary); transition: width 150ms ease;"></div>
              </div>
            </div>

            <button class="btn btn--primary" id="btn-export-zip" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar Pacote XML (.zip)
            </button>
          </div>
        </div>

        <!-- Card 2: Relatório Gerencial de Documentos (CSV) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid var(--accent-success);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: var(--accent-success); background: rgba(34, 197, 94, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Relatório de Documentos (CSV)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Planilha gerencial formatada em padrão brasileiro (ponto-e-vírgula e UTF-8 BOM), pronta para abertura direta no Microsoft Excel ou LibreOffice Calc.
            </p>

            <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4);">
              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Tipo de Documento</label>
                <select class="input" id="csv-filter-type" style="width: 100%;">
                  <option value="">Todos os tipos</option>
                  <option value="nfe">NF-e (Modelo 55)</option>
                  <option value="nfce">NFC-e (Modelo 65)</option>
                  <option value="nfse">NFS-e (Serviços)</option>
                  <option value="cte">CT-e (Modelo 57)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Situação</label>
                <select class="input" id="csv-filter-situacao" style="width: 100%;">
                  <option value="">Todas as situações</option>
                  <option value="autorizada">Apenas Autorizadas</option>
                  <option value="cancelada">Apenas Canceladas</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <button class="btn btn--secondary" id="btn-export-csv" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Documentos (.csv)
            </button>
          </div>
        </div>

        <!-- Card 3: Relatório Analítico de Itens (CSV) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid #fb923c;">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: #fb923c; background: rgba(251, 146, 60, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Relatório de Itens e Produtos (CSV)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Exportação detalhada de cada item faturado ou adquirido com código de produto, descrição, classificação NCM, CFOP, quantidade, valores e tributos destacados.
            </p>
            <div class="card" style="padding: var(--space-3); background: var(--bg-tertiary); font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--space-4);">
              Ideal para conferência de estoque, apuração de créditos tributários e auditoria de compras e vendas.
            </div>
          </div>

          <div>
            <button class="btn btn--secondary" id="btn-export-items-csv" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Itens (.csv)
            </button>
          </div>
        </div>

        <!-- Card 4: Arquivos SPED Fiscal (ZIP) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid #60a5fa;">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: #60a5fa; background: rgba(96, 165, 250, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                SPED Fiscal EFD (ZIP)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Pacote compactado contendo todos os arquivos texto originais da Escrituração Fiscal Digital (EFD ICMS/IPI) importados para esta empresa.
            </p>
            <div class="card" style="padding: var(--space-3); background: var(--bg-tertiary); font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--space-4);">
              Preserva integridade e leiaute original dos arquivos digitais para conferência com o PVA da Receita Federal.
            </div>
          </div>

          <div>
            <button class="btn btn--secondary" id="btn-export-sped-zip" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Arquivos SPED (.zip)
            </button>
          </div>
        </div>
      </div>
    `;

    // 1. Export ZIP Listener
    container.querySelector('#btn-export-zip')?.addEventListener('click', async () => {
      const btn = container.querySelector<HTMLButtonElement>('#btn-export-zip');
      const progressContainer = container.querySelector<HTMLElement>('#zip-progress-container');
      const progressBar = container.querySelector<HTMLElement>('#zip-progress-bar');
      const progressText = container.querySelector<HTMLElement>('#zip-progress-text');
      const tipo = (container.querySelector('#zip-filter-type') as HTMLSelectElement)?.value as DocumentType || undefined;
      const situacao = (container.querySelector('#zip-filter-situacao') as HTMLSelectElement)?.value as DocumentSituacao || undefined;

      try {
        if (btn) btn.disabled = true;
        if (progressContainer) progressContainer.style.display = 'block';

        const filterResult = await documentRepo.findPaginated({
          companyId: activeCompany.id,
          tipo,
          situacao,
          page: 1,
          pageSize: 10000
        });

        const docs = filterResult.data;
        if (docs.length === 0) {
          toast.show('Nenhum documento encontrado com os filtros selecionados.', 'warning');
          return;
        }

        const zipBlob = await exportService.exportDocumentsToZip(docs, (current, total) => {
          if (progressBar && progressText) {
            const pct = Math.round((current / total) * 100);
            progressBar.style.width = `${pct}%`;
            progressText.textContent = `Compactando documento ${current} de ${total} (${pct}%)...`;
          }
        });

        const filename = `XMLs_${activeCompany.cnpj}_${new Date().toISOString().substring(0, 10)}.zip`;
        await exportService.saveBlobFile(zipBlob, filename);
        toast.show(`Pacote com ${docs.length} XMLs exportado com sucesso.`, 'success');
      } catch (err) {
        console.error('Failed to export XMLs zip:', err);
        toast.show('Erro ao exportar pacote XML.', 'error');
      } finally {
        if (btn) btn.disabled = false;
        if (progressContainer) progressContainer.style.display = 'none';
      }
    });

    // 2. Export Documents CSV Listener
    container.querySelector('#btn-export-csv')?.addEventListener('click', async () => {
      const btn = container.querySelector<HTMLButtonElement>('#btn-export-csv');
      const tipo = (container.querySelector('#csv-filter-type') as HTMLSelectElement)?.value as DocumentType || undefined;
      const situacao = (container.querySelector('#csv-filter-situacao') as HTMLSelectElement)?.value as DocumentSituacao || undefined;

      try {
        if (btn) btn.disabled = true;

        const filterResult = await documentRepo.findPaginated({
          companyId: activeCompany.id,
          tipo,
          situacao,
          page: 1,
          pageSize: 10000
        });

        const docs = filterResult.data;
        if (docs.length === 0) {
          toast.show('Nenhum documento encontrado para exportação.', 'warning');
          return;
        }

        const csvContent = exportService.exportDocumentsToCsv(docs);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `documentos_${activeCompany.cnpj}_${new Date().toISOString().substring(0, 10)}.csv`;

        await exportService.saveBlobFile(blob, filename);
        toast.show(`Relatório com ${docs.length} documentos exportado com sucesso.`, 'success');
      } catch (err) {
        console.error('Failed to export documents CSV:', err);
        toast.show('Erro ao exportar relatório CSV.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    // 3. Export Line Items CSV Listener
    container.querySelector('#btn-export-items-csv')?.addEventListener('click', async () => {
      const btn = container.querySelector<HTMLButtonElement>('#btn-export-items-csv');

      try {
        if (btn) btn.disabled = true;

        const docs = await documentRepo.findAllByCompany(activeCompany.id);
        if (docs.length === 0) {
          toast.show('Nenhum documento encontrado na empresa para extrair itens.', 'warning');
          return;
        }

        const docMap = new Map<string, FiscalDocument>();
        docs.forEach(d => docMap.set(d.id, d));

        // Fetch items for all documents
        const allItems = [];
        for (const doc of docs) {
          const items = await documentRepo.findItemsByDocumentId(doc.id);
          allItems.push(...items);
        }

        if (allItems.length === 0) {
          toast.show('Nenhum item discriminado encontrado nos documentos.', 'warning');
          return;
        }

        const csvContent = exportService.exportItemsToCsv(allItems, docMap);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `itens_produtos_${activeCompany.cnpj}_${new Date().toISOString().substring(0, 10)}.csv`;

        await exportService.saveBlobFile(blob, filename);
        toast.show(`Relatório analítico com ${allItems.length} itens exportado com sucesso.`, 'success');
      } catch (err) {
        console.error('Failed to export items CSV:', err);
        toast.show('Erro ao exportar relatório de itens.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    // 4. Export SPED ZIP Listener
    container.querySelector('#btn-export-sped-zip')?.addEventListener('click', async () => {
      const btn = container.querySelector<HTMLButtonElement>('#btn-export-sped-zip');

      try {
        if (btn) btn.disabled = true;

        const speds = await spedRepo.findByCompany(activeCompany.id);
        if (speds.length === 0) {
          toast.show('Nenhum arquivo SPED Fiscal encontrado nesta empresa.', 'warning');
          return;
        }

        const zipBlob = await exportService.exportSpedFilesToZip(speds);
        const filename = `SPED_EFD_${activeCompany.cnpj}_${new Date().toISOString().substring(0, 10)}.zip`;

        await exportService.saveBlobFile(zipBlob, filename);
        toast.show(`Pacote com ${speds.length} arquivos SPED exportado com sucesso.`, 'success');
      } catch (err) {
        console.error('Failed to export SPED files:', err);
        toast.show('Erro ao exportar arquivos SPED.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Active company listener
  const unsubscribe = companyService.onActiveCompanyChange(() => {
    void renderLayout();
  });

  // Ensure subscription cleanup
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      unsubscribe();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  void renderLayout();
}
