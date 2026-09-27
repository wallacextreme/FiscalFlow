/**
 * FiscalFlow — Main Entry Point
 * 
 * Sets up the application layout, theme service, SPA router, and database lifecycle.
 */

import { initDatabase } from './database/connection.ts';
import { themeService } from './services/theme.service.ts';
import { router } from './router/index.ts';
import { renderDashboardPage } from './pages/dashboard.page.ts';
import { renderDocumentsPage } from './pages/documents.page.ts';
import { renderCompaniesPage } from './pages/companies.page.ts';
import { renderImportPage } from './pages/import.page.ts';
import { renderSpedPage } from './pages/sped.page.ts';
import { renderExportPage } from './pages/export.page.ts';
import { renderSettingsPage } from './pages/settings.page.ts';

import { companyService } from './services/company.service.ts';
import { DocumentRepository } from './database/repositories/document.repository.ts';
import type { Company } from './types/models.ts';

// Application version
const APP_VERSION = '1.0.0';

/**
 * Initialize the application
 */
async function initApp(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) {
    console.error('FiscalFlow: #app element not found');
    return;
  }

  // Render the persistent main shell (Sidebar, Header, Main Content, Status Bar)
  renderLayout(app);

  // Initialize SQLite database (Desktop Tauri or Browser WebAssembly)
  try {
    await initDatabase();
    console.info('FiscalFlow: SQLite database connected and migrated');

    // Auto-seed demo company and documents if empty (perfect for online demo / GitHub Pages)
    try {
      const { seedDemoDataIfEmpty } = await import('./utils/demo-data.ts');
      await seedDemoDataIfEmpty();
    } catch {
      // Ignore
    }
  } catch (err) {
    console.warn('FiscalFlow: Database initialization notice:', err);
  }

  // Setup routes
  setupRoutes();

  // Setup theme toggle & keyboard shortcuts
  setupThemeToggle();
  setupKeyboardShortcuts();

  // Setup active company listener & load initial active company
  const refreshStatus = async (company: Company | null) => {
    updateHeaderActiveCompany(company);
    if (company) {
      try {
        const docRepo = new DocumentRepository();
        const summary = await docRepo.getSummaryByCompany(company.id);
        updateStatusBar(company.razaoSocial, summary.totalDocs);
      } catch {
        updateStatusBar(company.razaoSocial);
      }
    } else {
      updateStatusBar('Nenhuma empresa selecionada', 0);
    }
  };

  companyService.onActiveCompanyChange((company) => {
    void refreshStatus(company);
  });

  try {
    const initialCompany = await companyService.getActiveCompany();
    void refreshStatus(initialCompany);
  } catch {
    // DB not ready or empty
  }

  // Initialize router
  router.init('/dashboard');

  console.info(`FiscalFlow v${APP_VERSION} initialized`);
}

/**
 * Render the main application layout shell
 */
function renderLayout(container: HTMLElement): void {
  container.innerHTML = `
    <div class="app-body">
      <!-- Sidebar -->
      <aside class="app-sidebar" id="app-sidebar">
        <div class="app-sidebar__brand">
          <svg style="width: 24px; height: 24px; color: var(--accent-primary); flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <div>
            <div class="app-sidebar__brand-name">FiscalFlow</div>
            <div class="app-sidebar__brand-sub">Xtreme Sistemas</div>
          </div>
        </div>

        <nav class="app-sidebar__nav" id="sidebar-nav">
          <div class="app-sidebar__section-title">Principal</div>
          <a href="#/dashboard" class="app-sidebar__link" data-route="/dashboard" id="nav-dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span>Dashboard</span>
          </a>
          <a href="#/documents" class="app-sidebar__link" data-route="/documents" id="nav-documents">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Documentos</span>
          </a>
          <a href="#/companies" class="app-sidebar__link" data-route="/companies" id="nav-companies">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Empresas</span>
          </a>

          <div class="app-sidebar__section-title">Operações</div>
          <a href="#/import" class="app-sidebar__link" data-route="/import" id="nav-import">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Importar</span>
          </a>
          <a href="#/sped" class="app-sidebar__link" data-route="/sped" id="nav-sped">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            <span>SPED Fiscal</span>
          </a>
          <a href="#/export" class="app-sidebar__link" data-route="/export" id="nav-export">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Exportar</span>
          </a>

          <div class="app-sidebar__section-title">Sistema</div>
          <a href="#/settings" class="app-sidebar__link" data-route="/settings" id="nav-settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Configurações</span>
          </a>
        </nav>
      </aside>

      <!-- Main Wrapper: Header + Dynamic Page Content -->
      <div class="app-main-wrapper">
        <header class="app-header">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span class="app-header__title" id="header-page-title">Dashboard</span>
            <a href="#/companies" class="badge" id="header-active-company" style="background: rgba(99, 102, 241, 0.12); color: var(--accent-primary); text-decoration: none; cursor: pointer; text-transform: none; font-weight: 500; font-size: 0.75rem; padding: 3px 10px; border-radius: 9999px;" title="Clique para gerenciar empresas">
              + Selecionar Empresa
            </a>
          </div>

          <div class="app-header__actions">
            <!-- Theme Toggle Button -->
            <button class="btn btn--secondary btn--sm" id="btn-theme-toggle" title="Alternar tema claro/escuro (Alt + T)">
              <span id="theme-toggle-icon">🌙</span>
              <span id="theme-toggle-text" style="font-size: 0.75rem;">Tema</span>
            </button>
          </div>
        </header>

        <!-- Dynamic Content Mount -->
        <main class="app-content" id="main-content">
          <!-- Rendered by Router -->
        </main>
      </div>
    </div>

    <!-- Status Bar -->
    <footer class="app-statusbar">
      <div class="app-statusbar__left">
        <span class="status-indicator status-indicator--online" id="status-dot"></span>
        <span id="status-company">Nenhuma empresa selecionada</span>
      </div>
      <div class="app-statusbar__right">
        <span id="status-docs">0 documentos</span>
        <span>v${APP_VERSION}</span>
      </div>
    </footer>

    <!-- Toast Notification Container -->
    <div class="toast-container" id="toast-container"></div>
  `;
}

/**
 * Configure router table and event hooks
 */
function setupRoutes(): void {
  router
    .register('/dashboard', 'dashboard', 'Dashboard', renderDashboardPage)
    .register('/documents', 'documents', 'Documentos Fiscais', renderDocumentsPage)
    .register('/companies', 'companies', 'Empresas Cadastradas', renderCompaniesPage)
    .register('/import', 'import', 'Importar Documentos', renderImportPage)
    .register('/sped', 'sped', 'SPED Fiscal', renderSpedPage)
    .register('/export', 'export', 'Exportação Fiscal', renderExportPage)
    .register('/settings', 'settings', 'Configurações', renderSettingsPage);

  // Synchronize sidebar active state and header title on navigation
  router.onAfterNavigate((route) => {
    const nav = document.getElementById('sidebar-nav');
    if (nav) {
      nav.querySelectorAll('.app-sidebar__link').forEach(link => {
        const linkRoute = link.getAttribute('data-route');
        if (linkRoute && route.path.startsWith(linkRoute)) {
          link.classList.add('app-sidebar__link--active');
        } else {
          link.classList.remove('app-sidebar__link--active');
        }
      });
    }

    const titleEl = document.getElementById('header-page-title');
    if (titleEl) {
      titleEl.textContent = route.title;
    }
  });
}

/**
 * Configure Theme Toggle button
 */
function setupThemeToggle(): void {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  const iconEl = document.getElementById('theme-toggle-icon');
  const textEl = document.getElementById('theme-toggle-text');

  const updateUI = () => {
    const theme = themeService.getTheme();
    if (iconEl) iconEl.textContent = theme === 'dark' ? '🌙' : '☀️';
    if (textEl) textEl.textContent = theme === 'dark' ? 'Escuro' : 'Claro';
  };

  updateUI();

  toggleBtn?.addEventListener('click', () => {
    themeService.toggleTheme();
    updateUI();
  });

  themeService.onChange(() => {
    updateUI();
  });
}

/**
 * Setup global keyboard shortcuts
 */
function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Alt + T: Toggle Theme
    if (e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      themeService.toggleTheme();
    }
  });
}

/**
 * Update the status bar with current info
 */
export function updateStatusBar(companyName?: string, docCount?: number): void {
  const statusCompany = document.getElementById('status-company');
  if (statusCompany) {
    statusCompany.textContent = companyName || 'Nenhuma empresa selecionada';
  }

  const statusDocs = document.getElementById('status-docs');
  if (statusDocs) {
    statusDocs.textContent = `${docCount ?? 0} documentos`;
  }
}

/**
 * Update the header active company badge
 */
export function updateHeaderActiveCompany(company: Company | null): void {
  const badgeEl = document.getElementById('header-active-company');
  if (badgeEl) {
    if (company) {
      badgeEl.textContent = `🏢 ${company.razaoSocial}`;
      badgeEl.setAttribute('title', `Empresa ativa: ${company.razaoSocial} (${company.cnpj}) - Clique para trocar`);
    } else {
      badgeEl.textContent = '+ Selecionar Empresa';
      badgeEl.setAttribute('title', 'Nenhuma empresa selecionada - Clique para gerenciar');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(console.error);
});
