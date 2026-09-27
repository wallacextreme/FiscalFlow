/**
 * FiscalFlow — Import Page
 * 
 * Interactive file import with drag & drop, file picker, real-time progress, and detailed summary.
 */

import type { RouteContext } from '../router/index.ts';
import { importService, type FileToImport, type ImportSummary } from '../services/import.service.ts';
import { companyService } from '../services/company.service.ts';
import { toast } from '../components/toast.ts';

export async function renderImportPage(_ctx: RouteContext, container: HTMLElement): Promise<void> {
  const activeCompany = await companyService.getActiveCompany();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Importar Documentos Fiscais</h1>
        <p class="page-header__subtitle">
          Importação em lote de arquivos XML (NF-e, NFC-e, NFS-e, CT-e) e arquivos texto SPED
        </p>
      </div>
      <div>
        ${activeCompany ? `
          <div style="font-size: 0.8125rem; color: var(--text-secondary); background: var(--bg-tertiary); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary);">
            Importando para: <strong style="color: var(--accent-primary);">${escapeHtml(activeCompany.razaoSocial)}</strong>
          </div>
        ` : `
          <a href="#/companies" class="btn btn--secondary btn--sm" style="color: var(--accent-warning); border-color: var(--accent-warning);">
            ⚠️ Nenhuma empresa selecionada (clique para escolher)
          </a>
        `}
      </div>
    </div>

    <!-- Hidden native file input for universal compatibility -->
    <input type="file" id="file-input-native" multiple accept=".xml,.txt" style="display: none;" />

    <div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-5);">
      <!-- Dropzone Card -->
      <div 
        id="import-dropzone" 
        class="card" 
        style="border: 2px dashed var(--border-secondary); padding: var(--space-8); text-align: center; cursor: pointer; transition: all 150ms ease;"
      >
        <svg style="width: 56px; height: 56px; color: var(--accent-primary); margin: 0 auto var(--space-4);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <h2 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
          Arraste e solte seus arquivos XML ou TXT aqui
        </h2>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-4);">
          Clique nesta área ou utilize o botão abaixo para selecionar arquivos do seu computador
        </p>
        <div>
          <button type="button" class="btn btn--primary" id="btn-select-files">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Selecionar Arquivos no Computador
          </button>
        </div>
      </div>

      <!-- Processing Progress Container (Hidden initially) -->
      <div id="import-progress-card" class="card" style="display: none; flex-direction: column; gap: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">
          <span style="font-weight: 600; color: var(--text-primary);" id="progress-status-title">Processando arquivos...</span>
          <span id="progress-percentage" style="color: var(--text-secondary);">0%</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
          <div id="progress-bar-fill" style="width: 0%; height: 100%; background: var(--accent-primary); transition: width 150ms ease;"></div>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span id="progress-current-filename">Iniciando...</span>
          <span id="progress-fraction">0 / 0</span>
        </div>
      </div>

      <!-- Import Report Container (Hidden initially) -->
      <div id="import-report-card" class="card" style="display: none; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">Relatório de Importação</h2>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn--secondary btn--sm" id="btn-import-more">Importar Mais Arquivos</button>
            <a href="#/documents" class="btn btn--primary btn--sm">Ver Documentos</a>
          </div>
        </div>

        <!-- Metric Badges Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); text-align: center;">
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Total</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);" id="report-total">0</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border-top: 2px solid var(--accent-success);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Importados</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-success);" id="report-imported">0</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border-top: 2px solid var(--accent-warning);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Duplicados</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-warning);" id="report-duplicates">0</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border-top: 2px solid var(--accent-danger);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Erros / Inválidos</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-danger);" id="report-errors">0</div>
          </div>
        </div>

        <!-- Details Table -->
        <div class="table-container" style="max-height: 300px; overflow-y: auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Status</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody id="report-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Supported Formats Card -->
      <div class="card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--nfe" style="margin-top: 2px;">NF-e</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">Nota Fiscal Eletrônica</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Modelo 55 e 65 (NFC-e), XML v4.00</div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--nfse" style="margin-top: 2px;">NFS-e</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">Serviço Municipal</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Padrão Nacional e ABRASF v2.04</div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--cte" style="margin-top: 2px;">CT-e</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">Conhecimento de Transporte</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Modelo 57, XML v3.00/v4.00</div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--sped" style="margin-top: 2px;">SPED</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">SPED Fiscal</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">EFD ICMS/IPI em formato posicional (|)</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  const dropzone = container.querySelector('#import-dropzone') as HTMLElement;
  const btnSelectFiles = container.querySelector('#btn-select-files') as HTMLElement;
  const nativeFileInput = container.querySelector('#file-input-native') as HTMLInputElement;
  const progressCard = container.querySelector('#import-progress-card') as HTMLElement;
  const progressBarFill = container.querySelector('#progress-bar-fill') as HTMLElement;
  const progressPercentage = container.querySelector('#progress-percentage') as HTMLElement;
  const progressFilename = container.querySelector('#progress-current-filename') as HTMLElement;
  const progressFraction = container.querySelector('#progress-fraction') as HTMLElement;

  const reportCard = container.querySelector('#import-report-card') as HTMLElement;
  const reportTotal = container.querySelector('#report-total') as HTMLElement;
  const reportImported = container.querySelector('#report-imported') as HTMLElement;
  const reportDuplicates = container.querySelector('#report-duplicates') as HTMLElement;
  const reportErrors = container.querySelector('#report-errors') as HTMLElement;
  const reportTbody = container.querySelector('#report-tbody') as HTMLElement;
  const btnImportMore = container.querySelector('#btn-import-more') as HTMLElement;

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = 'var(--accent-primary)';
      dropzone.style.backgroundColor = 'rgba(99, 102, 241, 0.04)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = 'var(--border-secondary)';
      dropzone.style.backgroundColor = 'var(--bg-secondary)';
    });
  });

  dropzone.addEventListener('drop', async (e: DragEvent) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleBrowserFiles(Array.from(files));
    }
  });

  dropzone.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#btn-select-files')) return;
    openFilePicker();
  });

  btnSelectFiles.addEventListener('click', (e) => {
    e.stopPropagation();
    openFilePicker();
  });

  nativeFileInput.addEventListener('change', async () => {
    if (nativeFileInput.files && nativeFileInput.files.length > 0) {
      await handleBrowserFiles(Array.from(nativeFileInput.files));
      nativeFileInput.value = ''; // Reset input
    }
  });

  btnImportMore?.addEventListener('click', () => {
    reportCard.style.display = 'none';
    dropzone.style.display = 'block';
  });

  /**
   * Open File Picker (Tauri native dialog if available, else HTML input)
   */
  async function openFilePicker(): Promise<void> {
    const currentCompany = await companyService.getActiveCompany();
    if (!currentCompany) {
      toast.warning('Por favor, selecione ou cadastre uma empresa antes de importar documentos.');
      return;
    }

    // Try Tauri Dialog plugin
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const dialogPlugin = await import('@tauri-apps/plugin-dialog');
        const fsPlugin = await import('@tauri-apps/plugin-fs');

        const selected = await dialogPlugin.open({
          multiple: true,
          filters: [{ name: 'Documentos Fiscais (*.xml, *.txt)', extensions: ['xml', 'txt'] }]
        });

        if (selected) {
          const paths = Array.isArray(selected) ? selected : [selected];
          const filesToImport: FileToImport[] = [];

          for (const filePath of paths) {
            try {
              const content = await fsPlugin.readTextFile(filePath);
              const name = filePath.split(/[/\\]/).pop() || 'documento.xml';
              filesToImport.push({ name, content });
            } catch (readErr) {
              console.warn(`Error reading file "${filePath}":`, readErr);
            }
          }

          if (filesToImport.length > 0) {
            await executeImport(filesToImport, currentCompany.id);
          }
        }
        return;
      } catch (tauriErr) {
        console.warn('Tauri dialog failed, falling back to native file input:', tauriErr);
      }
    }

    // Standard Browser file input fallback
    nativeFileInput.click();
  }

  /**
   * Process browser File objects from drop or input
   */
  async function handleBrowserFiles(files: File[]): Promise<void> {
    const currentCompany = await companyService.getActiveCompany();
    if (!currentCompany) {
      toast.warning('Por favor, selecione ou cadastre uma empresa antes de importar documentos.');
      return;
    }

    const filesToImport: FileToImport[] = [];
    for (const file of files) {
      try {
        const content = await file.text();
        filesToImport.push({ name: file.name, content });
      } catch (err) {
        console.warn(`Error reading file ${file.name}:`, err);
      }
    }

    if (filesToImport.length > 0) {
      await executeImport(filesToImport, currentCompany.id);
    }
  }

  /**
   * Run the import process with progress update
   */
  async function executeImport(files: FileToImport[], companyId: string): Promise<void> {
    dropzone.style.display = 'none';
    reportCard.style.display = 'none';
    progressCard.style.display = 'flex';

    progressBarFill.style.width = '0%';
    progressPercentage.textContent = '0%';
    progressFraction.textContent = `0 / ${files.length}`;

    try {
      const summary = await importService.importBatch(files, companyId, (progress) => {
        const percent = Math.round((progress.current / progress.total) * 100);
        progressBarFill.style.width = `${percent}%`;
        progressPercentage.textContent = `${percent}%`;
        progressFilename.textContent = `Processando: ${progress.fileName}`;
        progressFraction.textContent = `${progress.current} / ${progress.total}`;
      });

      // Show summary report
      renderReport(summary);
      toast.success(`Importação finalizada: ${summary.imported} importados, ${summary.duplicates} duplicados.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha no processamento: ${msg}`);
      dropzone.style.display = 'block';
    } finally {
      progressCard.style.display = 'none';
    }
  }

  /**
   * Render final import report card
   */
  function renderReport(summary: ImportSummary): void {
    reportCard.style.display = 'flex';
    reportTotal.textContent = String(summary.totalFiles);
    reportImported.textContent = String(summary.imported);
    reportDuplicates.textContent = String(summary.duplicates);
    reportErrors.textContent = String(summary.rejected + summary.errors);

    reportTbody.innerHTML = summary.details.map(d => {
      let badgeClass = 'badge--inutilizada';
      let statusLabel = 'Desconhecido';

      switch (d.status) {
        case 'importado':
          badgeClass = 'badge--autorizada';
          statusLabel = 'Importado';
          break;
        case 'duplicado':
          badgeClass = 'badge--cte';
          statusLabel = 'Duplicado';
          break;
        case 'formato_invalido':
          badgeClass = 'badge--cancelada';
          statusLabel = 'Formato Inválido';
          break;
        case 'erro':
          badgeClass = 'badge--cancelada';
          statusLabel = 'Erro';
          break;
      }

      return `
        <tr>
          <td style="font-weight: 500;">${escapeHtml(d.nomeArquivo)}</td>
          <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
          <td style="color: var(--text-secondary); font-size: 0.75rem;">
            ${escapeHtml(d.mensagem || (d.status === 'importado' ? 'Documento persistido com sucesso' : ''))}
          </td>
        </tr>
      `;
    }).join('');
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
