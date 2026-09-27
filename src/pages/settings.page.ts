/**
 * FiscalFlow — Settings & Maintenance Page
 * 
 * Provides theme customization, system preferences, complete database backup
 * and restoration, database health metrics, and SQLite maintenance operations.
 */

import type { RouteContext } from '../router/index.ts';
import { settingsService } from '../services/settings.service.ts';
import { themeService } from '../services/theme.service.ts';
import { toast } from '../components/toast.ts';
import { openModal } from '../components/modal.ts';

export function renderSettingsPage(_ctx: RouteContext, container: HTMLElement): void {
  async function renderLayout(): Promise<void> {
    const prefs = await settingsService.getPreferences();
    const stats = await settingsService.getDatabaseStats();
    const currentTheme = themeService.getTheme();

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Configurações do Sistema</h1>
          <p class="page-header__subtitle">Personalização de tema, preferências operacionais, backup e manutenção de dados</p>
        </div>
      </div>

      <div style="max-width: 900px; display: flex; flex-direction: column; gap: var(--space-6);">
        
        <!-- 1. Theme and Appearance Card -->
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
            <div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">Aparência e Tema</h2>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">Escolha a paleta visual mais confortável para a sua rotina de conferência fiscal.</p>
            </div>
            <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: var(--accent-primary); font-size: 0.75rem;">Atalho: Alt + T</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <!-- Dark Theme Option -->
            <label id="theme-card-dark" style="display: flex; flex-direction: column; padding: var(--space-4); border: 2px solid ${currentTheme === 'dark' ? 'var(--accent-primary)' : 'var(--border-primary)'}; border-radius: var(--radius-lg); background-color: var(--bg-tertiary); cursor: pointer; transition: all var(--transition-fast);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  <input type="radio" name="setting-theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''} id="radio-theme-dark" />
                  <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9375rem;">Tema Escuro (Padrão)</span>
                </div>
                <span>🌙</span>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: var(--space-3);">
                Otimizado para baixa luminosidade, alto contraste e conforto visual prolongado.
              </p>
              <div style="display: flex; gap: 6px; padding: 6px; background: #0f172a; border-radius: var(--radius-sm); border: 1px solid #334155;">
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #1e293b;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #3b82f6;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #10b981;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #f8fafc;"></span>
              </div>
            </label>

            <!-- Light Theme Option -->
            <label id="theme-card-light" style="display: flex; flex-direction: column; padding: var(--space-4); border: 2px solid ${currentTheme === 'light' ? 'var(--accent-primary)' : 'var(--border-primary)'}; border-radius: var(--radius-lg); background-color: var(--bg-tertiary); cursor: pointer; transition: all var(--transition-fast);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  <input type="radio" name="setting-theme" value="light" ${currentTheme === 'light' ? 'checked' : ''} id="radio-theme-light" />
                  <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9375rem;">Tema Claro</span>
                </div>
                <span>☀️</span>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: var(--space-3);">
                Ideal para ambientes bem iluminados e telas externas com alta claridade.
              </p>
              <div style="display: flex; gap: 6px; padding: 6px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid #cbd5e1;">
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #ffffff;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #059669;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #0f172a;"></span>
              </div>
            </label>
          </div>
        </div>

        <!-- 2. System Preferences Card -->
        <div class="card">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">Preferências Operacionais</h2>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-4);">
            Ajuste o comportamento das consultas e alertas do FiscalFlow.
          </p>

          <form id="form-preferences" style="display: flex; flex-direction: column; gap: var(--space-4);">
            <!-- Page Size -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-primary);">
              <div>
                <label for="pref-page-size" style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">Quantidade de Documentos por Página</label>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Quantidade padrão de registros carregados em cada página nas tabelas de consulta.</div>
              </div>
              <select class="input" id="pref-page-size" style="width: 120px;">
                <option value="10" ${prefs.pageSize === 10 ? 'selected' : ''}>10 itens</option>
                <option value="20" ${prefs.pageSize === 20 ? 'selected' : ''}>20 itens</option>
                <option value="50" ${prefs.pageSize === 50 ? 'selected' : ''}>50 itens</option>
                <option value="100" ${prefs.pageSize === 100 ? 'selected' : ''}>100 itens</option>
              </select>
            </div>

            <!-- Notify Cancelled -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-primary);">
              <div>
                <label for="pref-notify-cancelled" style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">Alertar Documentos Cancelados / Denegados</label>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Destacar avisos visuais ao abrir ou importar documentos com status fiscal irregular.</div>
              </div>
              <input type="checkbox" id="pref-notify-cancelled" ${prefs.notifyCancelled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary); cursor: pointer;" />
            </div>

            <!-- Backup Reminder -->
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <label for="pref-backup-reminder" style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">Lembrete Periódico de Backup</label>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Notificar preventivamente a necessidade de exportar cópia de segurança dos dados locais.</div>
              </div>
              <input type="checkbox" id="pref-backup-reminder" ${prefs.backupReminder ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary); cursor: pointer;" />
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: var(--space-2);">
              <button class="btn btn--primary" type="submit" id="btn-save-preferences">
                Salvar Preferências
              </button>
            </div>
          </form>
        </div>

        <!-- 3. Backup and Restore Card -->
        <div class="card">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">Cópia de Segurança e Restauração</h2>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-4);">
            Garanta a segurança patrimonial e contábil exportando o banco de dados completo ou restaurando arquivos salvos anteriormente.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <!-- Export Backup -->
            <div style="background-color: var(--bg-tertiary); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--border-primary); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <h3 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary);">Exportar Backup Completo</h3>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: var(--space-4);">
                  Gera um arquivo seguro (<code class="text-mono">.json</code>) contendo todas as empresas, documentos fiscais originais, itens, arquivos SPED e configurações.
                </p>
              </div>
              <button class="btn btn--secondary" type="button" id="btn-export-backup" style="width: 100%;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Gerar Backup (.json)
              </button>
            </div>

            <!-- Import Backup -->
            <div style="background-color: var(--bg-tertiary); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--border-primary); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <h3 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary);">Restaurar de Backup</h3>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: var(--space-4);">
                  Restaura o estado do sistema a partir de um backup prévio. Os dados atuais serão integralmente substituídos após confirmação.
                </p>
              </div>
              <div>
                <input type="file" id="file-restore-backup" accept=".json" style="display: none;" />
                <button class="btn btn--secondary" type="button" id="btn-trigger-restore" style="width: 100%;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Carregar Arquivo de Backup
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Database Health and Maintenance Card -->
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
            <div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">Saúde e Armazenamento do Banco de Dados</h2>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">Métricas em tempo real do banco SQLite local e ferramentas de manutenção.</p>
            </div>
            <span class="badge badge--success" style="font-size: 0.75rem;">SQLite WAL Conectado</span>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-5);">
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);" id="stat-companies">${stats.companies}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Empresas</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-primary); font-family: var(--font-mono);" id="stat-docs">${stats.fiscalDocuments}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Documentos</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);" id="stat-items">${stats.documentItems}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Itens Fiscais</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: #a855f7; font-family: var(--font-mono);" id="stat-sped">${stats.spedFiles}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Arquivos SPED</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-secondary); font-family: var(--font-mono);" id="stat-imports">${stats.importRecords}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Lotes Importados</div>
            </div>
          </div>

          <!-- Maintenance Actions -->
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border-primary);">
            <button class="btn btn--secondary" type="button" id="btn-vacuum-db" title="Reorganizar índices e recuperar espaço em disco não utilizado">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Otimizar Banco de Dados (VACUUM)
            </button>

            <button class="btn btn--danger btn--sm" type="button" id="btn-reset-db">
              Limpar Todos os Dados...
            </button>
          </div>
        </div>

        <!-- 5. App Info and Shortcuts Card -->
        <div class="card">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-4);">Sobre o FiscalFlow</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); font-size: 0.8125rem; margin-bottom: var(--space-4);">
            <div>
              <span style="color: var(--text-muted);">Aplicação:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">FiscalFlow Desktop</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Desenvolvedora:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">Xtreme Sistemas</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Versão:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">1.0.0 (Release Candidate)</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Mecanismo:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">Tauri 2 + SQLite Nativo</strong>
            </div>
          </div>

          <h3 style="font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: var(--space-2);">Atalhos de Produtividade</h3>
          <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: 0.8125rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-primary);">
              <span style="color: var(--text-secondary);">Alternar Tema Claro / Escuro</span>
              <kbd style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary); font-family: var(--font-mono); font-size: 0.75rem;">Alt + T</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0;">
              <span style="color: var(--text-secondary);">Fechar modais e painéis de detalhes</span>
              <kbd style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary); font-family: var(--font-mono); font-size: 0.75rem;">Esc</kbd>
            </div>
          </div>
        </div>

      </div>
    `;

    bindEvents();
  }

  function bindEvents(): void {
    // 1. Theme toggle listeners
    const darkRadio = container.querySelector('#radio-theme-dark') as HTMLInputElement | null;
    const lightRadio = container.querySelector('#radio-theme-light') as HTMLInputElement | null;

    darkRadio?.addEventListener('change', async () => {
      if (darkRadio.checked) {
        await settingsService.savePreferences({ theme: 'dark' });
        toast.info('Tema escuro ativado');
        void renderLayout();
      }
    });

    lightRadio?.addEventListener('change', async () => {
      if (lightRadio.checked) {
        await settingsService.savePreferences({ theme: 'light' });
        toast.info('Tema claro ativado');
        void renderLayout();
      }
    });

    // 2. Preferences form submission
    const formPrefs = container.querySelector('#form-preferences') as HTMLFormElement | null;
    formPrefs?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pageSize = parseInt((container.querySelector('#pref-page-size') as HTMLSelectElement)?.value, 10) || 20;
      const notifyCancelled = (container.querySelector('#pref-notify-cancelled') as HTMLInputElement)?.checked ?? true;
      const backupReminder = (container.querySelector('#pref-backup-reminder') as HTMLInputElement)?.checked ?? false;

      try {
        await settingsService.savePreferences({
          pageSize,
          notifyCancelled,
          backupReminder
        });
        toast.success('Preferências operacionais salvas com sucesso!');
      } catch (err) {
        console.error('Erro ao salvar preferências:', err);
        toast.error('Erro ao salvar preferências.');
      }
    });

    // 3. Export Backup listener
    const btnExportBackup = container.querySelector('#btn-export-backup') as HTMLButtonElement | null;
    btnExportBackup?.addEventListener('click', async () => {
      try {
        if (btnExportBackup) {
          btnExportBackup.disabled = true;
          btnExportBackup.innerHTML = `
            <div class="spinner spinner--sm" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></div>
            Gerando backup...
          `;
        }

        const savedPath = await settingsService.exportBackup();
        if (savedPath) {
          toast.success('Cópia de segurança exportada com sucesso!');
        }
      } catch (err) {
        console.error('Erro ao exportar backup:', err);
        toast.error('Falha ao exportar backup.');
      } finally {
        if (btnExportBackup) {
          btnExportBackup.disabled = false;
          btnExportBackup.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Gerar Backup (.json)
          `;
        }
      }
    });

    // 4. Trigger Restore File Picker
    const btnTriggerRestore = container.querySelector('#btn-trigger-restore') as HTMLButtonElement | null;
    const fileRestoreInput = container.querySelector('#file-restore-backup') as HTMLInputElement | null;

    btnTriggerRestore?.addEventListener('click', () => {
      fileRestoreInput?.click();
    });

    fileRestoreInput?.addEventListener('change', async () => {
      const file = fileRestoreInput.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;

        // Open Confirmation Modal
        openModal({
          title: 'Confirmar Restauração de Backup',
          maxWidth: '520px',
          content: `
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <div style="display: flex; align-items: flex-start; gap: var(--space-3); background: rgba(245, 158, 11, 0.1); border: 1px solid var(--accent-warning); padding: var(--space-3); border-radius: var(--radius-md);">
                <span style="font-size: 1.25rem;">⚠️</span>
                <div style="font-size: 0.8125rem; color: var(--text-primary);">
                  <strong>Atenção: Ação Destrutiva</strong><br>
                  A restauração substituirá todos os registros atuais (empresas, documentos fiscais, itens e SPED) pelos dados contidos no arquivo selecionado: <strong style="color: var(--accent-primary);">${file.name}</strong>.
                </div>
              </div>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">
                Deseja realmente prosseguir com a restauração?
              </p>
            </div>
          `,
          buttons: [
            {
              text: 'Cancelar',
              variant: 'secondary',
              onClick: (modal) => modal.close()
            },
            {
              text: 'Sim, Restaurar Dados',
              variant: 'danger',
              onClick: async (modal) => {
                try {
                  const res = await settingsService.importBackup(content);
                  modal.close();
                  toast.success(`Backup restaurado! ${res.stats.companies} empresa(s) e ${res.stats.fiscalDocuments} documento(s) carregados.`);
                  void renderLayout();
                } catch (err) {
                  console.error('Falha na restauração:', err);
                  toast.error(err instanceof Error ? err.message : 'Erro ao restaurar backup.');
                }
              }
            }
          ]
        });

        // Reset input for subsequent selections
        fileRestoreInput.value = '';
      };

      reader.readAsText(file);
    });

    // 5. Database Vacuum Optimization
    const btnVacuum = container.querySelector('#btn-vacuum-db') as HTMLButtonElement | null;
    btnVacuum?.addEventListener('click', async () => {
      try {
        if (btnVacuum) {
          btnVacuum.disabled = true;
          btnVacuum.innerHTML = `
            <div class="spinner spinner--sm" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></div>
            Otimizando...
          `;
        }

        await settingsService.optimizeDatabase();
        toast.success('Banco de dados SQLite otimizado e reindexado com sucesso!');
        void renderLayout();
      } catch (err) {
        console.error('Erro ao otimizar banco de dados:', err);
        toast.error('Erro ao otimizar banco de dados.');
      } finally {
        if (btnVacuum) {
          btnVacuum.disabled = false;
        }
      }
    });

    // 6. Reset Database Action
    const btnResetDb = container.querySelector('#btn-reset-db') as HTMLButtonElement | null;
    btnResetDb?.addEventListener('click', () => {
      openModal({
        title: 'Limpar Todos os Dados do Sistema',
        maxWidth: '520px',
        content: `
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            <div style="display: flex; align-items: flex-start; gap: var(--space-3); background: rgba(239, 68, 68, 0.1); border: 1px solid var(--accent-danger); padding: var(--space-3); border-radius: var(--radius-md);">
              <span style="font-size: 1.25rem;">🛑</span>
              <div style="font-size: 0.8125rem; color: var(--text-primary);">
                <strong>Aviso de Segurança Crítico</strong><br>
                Esta operação apagará definitivamente todas as empresas, documentos fiscais, itens, arquivos SPED e relatórios de importação.
              </div>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary);">
              Para confirmar a limpeza completa do banco de dados, digite <strong style="color: var(--accent-danger);">CONFIRMAR</strong> abaixo:
            </p>
            <input type="text" class="input" id="input-confirm-reset" placeholder="Digite CONFIRMAR" />
          </div>
        `,
        buttons: [
          {
            text: 'Cancelar',
            variant: 'secondary',
            onClick: (modal) => modal.close()
          },
          {
            text: 'Apagar Tudo Definitivamente',
            variant: 'danger',
            onClick: async (modal) => {
              const input = modal.modal.querySelector('#input-confirm-reset') as HTMLInputElement | null;
              if (input?.value.trim() !== 'CONFIRMAR') {
                toast.warning('Você precisa digitar exatamente CONFIRMAR para prosseguir.');
                return;
              }

              try {
                await settingsService.resetDatabase();
                modal.close();
                toast.success('Todos os dados foram excluídos. O banco foi redefinido.');
                void renderLayout();
              } catch (err) {
                console.error('Erro ao resetar banco de dados:', err);
                toast.error('Erro ao limpar banco de dados.');
              }
            }
          }
        ]
      });
    });
  }

  void renderLayout();
}
