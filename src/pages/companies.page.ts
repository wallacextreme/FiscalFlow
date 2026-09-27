/**
 * FiscalFlow — Companies Page
 * 
 * Full CRUD for companies with validation, search, modals, and active selection.
 */

import type { RouteContext } from '../router/index.ts';
import { companyService, type CompanyInput } from '../services/company.service.ts';
import type { Company, RegimeTributario } from '../types/models.ts';
import { formatCnpj, formatCep, cleanDigits, isValidCnpj } from '../utils/validators.ts';
import { openModal } from '../components/modal.ts';
import { toast } from '../components/toast.ts';

export async function renderCompaniesPage(_ctx: RouteContext, container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Empresas Cadastradas</h1>
        <p class="page-header__subtitle">Gerencie os clientes e empresas para organização e vinculação de documentos fiscais</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" id="btn-new-company">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Empresa
        </button>
      </div>
    </div>

    <!-- Search & Filter Card -->
    <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);">
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
        <div style="flex: 2; min-width: 260px; position: relative;">
          <input 
            type="text" 
            class="input" 
            id="filter-company-search" 
            placeholder="Buscar por CNPJ, Razão Social ou Nome Fantasia..."
            style="padding-left: 32px;"
          />
          <svg style="position: absolute; left: 10px; top: 10px; width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div>
          <label style="display: flex; align-items: center; gap: var(--space-2); font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" id="check-only-active" />
            Apenas ativas
          </label>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-container">
      <table class="table" id="companies-table">
        <thead>
          <tr>
            <th>CNPJ</th>
            <th>Razão Social / Nome Fantasia</th>
            <th>Município / UF</th>
            <th>Regime</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody id="companies-tbody">
          <tr>
            <td colspan="6" style="text-align: center; padding: var(--space-6); color: var(--text-muted);">
              Carregando empresas...
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div class="empty-state" id="companies-empty-state" style="display: none;">
        <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <h2 class="empty-state__title">Nenhuma empresa encontrada</h2>
        <p class="empty-state__description">Cadastre sua primeira empresa para começar a vincular e organizar seus documentos fiscais.</p>
        <button class="btn btn--primary" id="btn-empty-new-company">Cadastrar Primeira Empresa</button>
      </div>
    </div>
  `;

  // Attach elements and load data
  const tbody = container.querySelector('#companies-tbody') as HTMLElement;
  const emptyState = container.querySelector('#companies-empty-state') as HTMLElement;
  const searchInput = container.querySelector('#filter-company-search') as HTMLInputElement;
  const onlyActiveCheck = container.querySelector('#check-only-active') as HTMLInputElement;
  const newCompanyBtn = container.querySelector('#btn-new-company') as HTMLElement;
  const emptyNewCompanyBtn = container.querySelector('#btn-empty-new-company') as HTMLElement;

  async function loadData(): Promise<void> {
    const searchTerm = searchInput?.value.trim() || '';
    const onlyActive = onlyActiveCheck?.checked || false;

    try {
      const companies = await companyService.list(searchTerm, onlyActive);
      const activeCompany = await companyService.getActiveCompany();

      if (companies.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
      } else {
        emptyState.style.display = 'none';
        renderRows(tbody, companies, activeCompany?.id);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-danger); padding: var(--space-4);">Erro ao carregar empresas: ${err instanceof Error ? err.message : String(err)}</td></tr>`;
    }
  }

  // Event handlers
  let searchTimeout: ReturnType<typeof setTimeout>;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadData, 200);
  });

  onlyActiveCheck?.addEventListener('change', loadData);

  const openCreateModal = () => {
    showCompanyFormModal(null, async () => {
      await loadData();
    });
  };

  newCompanyBtn?.addEventListener('click', openCreateModal);
  emptyNewCompanyBtn?.addEventListener('click', openCreateModal);

  // Initial load
  await loadData();
}

/**
 * Render table rows
 */
function renderRows(tbody: HTMLElement, companies: Company[], activeId?: string): void {
  tbody.innerHTML = companies.map(company => {
    const isActiveSelected = activeId === company.id;
    const regimeLabel = formatRegime(company.regimeTributario);
    const addressStr = [company.endereco?.municipio, company.endereco?.uf].filter(Boolean).join(' / ') || '—';

    return `
      <tr data-company-id="${company.id}" style="${isActiveSelected ? 'background-color: rgba(99, 102, 241, 0.05);' : ''}">
        <td class="text-mono" style="font-weight: 500;">
          ${formatCnpj(company.cnpj)}
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: var(--space-2);">
            ${escapeHtml(company.razaoSocial)}
            ${isActiveSelected ? '<span class="badge" style="background: rgba(99, 102, 241, 0.2); color: var(--accent-primary); font-size: 0.625rem;">Ativa</span>' : ''}
          </div>
          ${company.nomeFantasia ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(company.nomeFantasia)}</div>` : ''}
        </td>
        <td style="color: var(--text-secondary);">${escapeHtml(addressStr)}</td>
        <td>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${regimeLabel}</span>
        </td>
        <td>
          ${company.ativa
            ? '<span class="badge badge--autorizada">Ativa</span>'
            : '<span class="badge badge--cancelada">Inativa</span>'
          }
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: var(--space-1);">
            ${!isActiveSelected ? `
              <button class="btn btn--ghost btn--sm btn-select-active" data-id="${company.id}" title="Selecionar como empresa ativa">
                Selecionar
              </button>
            ` : ''}
            <button class="btn btn--ghost btn--sm btn-edit-company" data-id="${company.id}" title="Editar dados da empresa">
              Editar
            </button>
            <button class="btn btn--ghost btn--sm btn-delete-company" data-id="${company.id}" style="color: var(--accent-danger);" title="Excluir empresa">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach action buttons listeners
  tbody.querySelectorAll('.btn-select-active').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        try {
          const activated = await companyService.setActiveCompany(id);
          toast.success(`Empresa "${activated?.razaoSocial}" selecionada.`);
          // Refetch rows
          const companiesList = await companyService.list();
          renderRows(tbody, companiesList, id);
        } catch (err) {
          toast.error('Erro ao selecionar empresa ativa.');
        }
      }
    });
  });

  tbody.querySelectorAll('.btn-edit-company').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        const company = await companyService.getById(id);
        if (company) {
          showCompanyFormModal(company, async () => {
            const list = await companyService.list();
            const active = await companyService.getActiveCompany();
            renderRows(tbody, list, active?.id);
          });
        }
      }
    });
  });

  tbody.querySelectorAll('.btn-delete-company').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        const company = await companyService.getById(id);
        if (company) {
          showDeleteConfirmModal(company, async () => {
            const list = await companyService.list();
            const active = await companyService.getActiveCompany();
            renderRows(tbody, list, active?.id);
          });
        }
      }
    });
  });
}

/**
 * Modal for creating or editing a company
 */
function showCompanyFormModal(company: Company | null, onSuccess: () => void | Promise<void>): void {
  const isEdit = Boolean(company);
  const title = isEdit ? 'Editar Empresa' : 'Cadastrar Nova Empresa';

  const formHtml = `
    <form id="company-form" style="display: flex; flex-direction: column; gap: var(--space-4);">
      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-cnpj">CNPJ *</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-cnpj" 
            value="${company ? formatCnpj(company.cnpj) : ''}" 
            placeholder="00.000.000/0000-00" 
            maxlength="18"
            required 
          />
          <div class="form-error" id="err-cnpj" style="display: none;"></div>
        </div>

        <div class="form-group">
          <label class="label" for="inp-razao">Razão Social *</label>
          <input 
            type="text" 
            class="input" 
            id="inp-razao" 
            value="${company ? escapeHtml(company.razaoSocial) : ''}" 
            placeholder="Nome oficial da empresa" 
            required 
          />
          <div class="form-error" id="err-razao" style="display: none;"></div>
        </div>
      </div>

      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-fantasia">Nome Fantasia</label>
          <input 
            type="text" 
            class="input" 
            id="inp-fantasia" 
            value="${company?.nomeFantasia ? escapeHtml(company.nomeFantasia) : ''}" 
            placeholder="Nome fantasia (opcional)" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-regime">Regime Tributário</label>
          <select class="input" id="inp-regime">
            <option value="simples_nacional" ${company?.regimeTributario === 'simples_nacional' ? 'selected' : ''}>Simples Nacional</option>
            <option value="simples_nacional_excesso" ${company?.regimeTributario === 'simples_nacional_excesso' ? 'selected' : ''}>Simples Nacional - Excesso de Sublimite</option>
            <option value="regime_normal" ${company?.regimeTributario === 'regime_normal' ? 'selected' : ''}>Regime Normal (Lucro Presumido / Real)</option>
          </select>
        </div>
      </div>

      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-ie">Inscrição Estadual</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-ie" 
            value="${company?.inscricaoEstadual ? escapeHtml(company.inscricaoEstadual) : ''}" 
            placeholder="Apenas dígitos" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-im">Inscrição Municipal</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-im" 
            value="${company?.inscricaoMunicipal ? escapeHtml(company.inscricaoMunicipal) : ''}" 
            placeholder="Apenas dígitos" 
          />
        </div>
      </div>

      <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-secondary); margin-top: var(--space-2); border-bottom: 1px solid var(--border-primary); padding-bottom: var(--space-1);">
        Endereço
      </div>

      <div class="form-row form-row--3">
        <div class="form-group">
          <label class="label" for="inp-cep">CEP</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-cep" 
            value="${company?.endereco?.cep ? formatCep(company.endereco.cep) : ''}" 
            placeholder="00000-000" 
            maxlength="9" 
          />
        </div>

        <div class="form-group" style="grid-column: span 2;">
          <label class="label" for="inp-logradouro">Logradouro</label>
          <input 
            type="text" 
            class="input" 
            id="inp-logradouro" 
            value="${company?.endereco?.logradouro ? escapeHtml(company.endereco.logradouro) : ''}" 
            placeholder="Rua, Av, etc." 
          />
        </div>
      </div>

      <div class="form-row form-row--3">
        <div class="form-group">
          <label class="label" for="inp-numero">Número</label>
          <input 
            type="text" 
            class="input" 
            id="inp-numero" 
            value="${company?.endereco?.numero ? escapeHtml(company.endereco.numero) : ''}" 
            placeholder="123" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-bairro">Bairro</label>
          <input 
            type="text" 
            class="input" 
            id="inp-bairro" 
            value="${company?.endereco?.bairro ? escapeHtml(company.endereco.bairro) : ''}" 
            placeholder="Bairro" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-municipio">Município</label>
          <input 
            type="text" 
            class="input" 
            id="inp-municipio" 
            value="${company?.endereco?.municipio ? escapeHtml(company.endereco.municipio) : ''}" 
            placeholder="Cidade" 
          />
        </div>
      </div>

      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-uf">UF</label>
          <input 
            type="text" 
            class="input" 
            id="inp-uf" 
            value="${company?.endereco?.uf ? escapeHtml(company.endereco.uf) : ''}" 
            placeholder="SP" 
            maxlength="2" 
            style="text-transform: uppercase;" 
          />
        </div>

        <div class="form-group" style="display: flex; align-items: flex-end; padding-bottom: var(--space-2);">
          <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: 0.8125rem; color: var(--text-primary);">
            <input type="checkbox" id="inp-ativa" ${company ? (company.ativa ? 'checked' : '') : 'checked'} />
            Empresa Ativa
          </label>
        </div>
      </div>
    </form>
  `;

  const modalInstance = openModal({
    title,
    content: formHtml,
    maxWidth: '680px',
    buttons: [
      {
        text: 'Cancelar',
        variant: 'secondary',
        onClick: (inst) => inst.close()
      },
      {
        text: isEdit ? 'Salvar Alterações' : 'Cadastrar Empresa',
        variant: 'primary',
        onClick: async (inst) => {
          const form = inst.modal.querySelector('#company-form') as HTMLFormElement;
          const cnpjInp = form.querySelector('#inp-cnpj') as HTMLInputElement;
          const razaoInp = form.querySelector('#inp-razao') as HTMLInputElement;
          const fantasiaInp = form.querySelector('#inp-fantasia') as HTMLInputElement;
          const regimeInp = form.querySelector('#inp-regime') as HTMLSelectElement;
          const ieInp = form.querySelector('#inp-ie') as HTMLInputElement;
          const imInp = form.querySelector('#inp-im') as HTMLInputElement;
          const cepInp = form.querySelector('#inp-cep') as HTMLInputElement;
          const logradouroInp = form.querySelector('#inp-logradouro') as HTMLInputElement;
          const numeroInp = form.querySelector('#inp-numero') as HTMLInputElement;
          const bairroInp = form.querySelector('#inp-bairro') as HTMLInputElement;
          const municipioInp = form.querySelector('#inp-municipio') as HTMLInputElement;
          const ufInp = form.querySelector('#inp-uf') as HTMLInputElement;
          const ativaInp = form.querySelector('#inp-ativa') as HTMLInputElement;

          const errCnpj = form.querySelector('#err-cnpj') as HTMLElement;
          const errRazao = form.querySelector('#err-razao') as HTMLElement;

          // Reset errors
          errCnpj.style.display = 'none';
          errRazao.style.display = 'none';
          cnpjInp.classList.remove('input--error');
          razaoInp.classList.remove('input--error');

          const rawCnpj = cleanDigits(cnpjInp.value);
          const rawRazao = razaoInp.value.trim();

          let hasError = false;
          if (!rawRazao) {
            errRazao.textContent = 'Razão Social é obrigatória.';
            errRazao.style.display = 'block';
            razaoInp.classList.add('input--error');
            hasError = true;
          }

          if (!isValidCnpj(rawCnpj)) {
            errCnpj.textContent = 'CNPJ inválido (verifique os dígitos).';
            errCnpj.style.display = 'block';
            cnpjInp.classList.add('input--error');
            hasError = true;
          }

          if (hasError) return;

          const inputPayload: CompanyInput = {
            cnpj: rawCnpj,
            razaoSocial: rawRazao,
            nomeFantasia: fantasiaInp.value.trim() || undefined,
            regimeTributario: regimeInp.value as RegimeTributario,
            inscricaoEstadual: ieInp.value.trim() || undefined,
            inscricaoMunicipal: imInp.value.trim() || undefined,
            endereco: {
              cep: cleanDigits(cepInp.value) || undefined,
              logradouro: logradouroInp.value.trim() || undefined,
              numero: numeroInp.value.trim() || undefined,
              bairro: bairroInp.value.trim() || undefined,
              municipio: municipioInp.value.trim() || undefined,
              uf: ufInp.value.trim().toUpperCase() || undefined
            },
            ativa: ativaInp.checked
          };

          try {
            if (isEdit && company) {
              await companyService.update(company.id, inputPayload);
              toast.success('Empresa atualizada com sucesso.');
            } else {
              await companyService.create(inputPayload);
              toast.success('Empresa cadastrada com sucesso.');
            }
            inst.close();
            await onSuccess();
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(message);
          }
        }
      }
    ]
  });

  // Apply auto-format to CNPJ input on typing
  const cnpjField = modalInstance.modal.querySelector('#inp-cnpj') as HTMLInputElement | null;
  cnpjField?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    target.value = formatCnpj(target.value);
  });

  // Apply auto-format to CEP
  const cepField = modalInstance.modal.querySelector('#inp-cep') as HTMLInputElement | null;
  cepField?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    target.value = formatCep(target.value);
  });
}

/**
 * Modal to confirm company deletion
 */
function showDeleteConfirmModal(company: Company, onSuccess: () => void | Promise<void>): void {
  openModal({
    title: 'Excluir Empresa',
    content: `
      <div>
        <p style="margin-bottom: var(--space-3); color: var(--text-primary);">
          Tem certeza de que deseja excluir a empresa <strong>${escapeHtml(company.razaoSocial)}</strong> (${formatCnpj(company.cnpj)})?
        </p>
        <p style="font-size: 0.8125rem; color: var(--accent-danger);">
          Atenção: Todos os documentos fiscais e registros associados a esta empresa serão permanentemente removidos.
        </p>
      </div>
    `,
    buttons: [
      {
        text: 'Cancelar',
        variant: 'secondary',
        onClick: (inst) => inst.close()
      },
      {
        text: 'Excluir Definitivamente',
        variant: 'danger',
        onClick: async (inst) => {
          try {
            await companyService.delete(company.id);
            toast.success(`Empresa "${company.razaoSocial}" excluída.`);
            inst.close();
            await onSuccess();
          } catch (err) {
            toast.error(`Erro ao excluir empresa: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    ]
  });
}

function formatRegime(regime?: RegimeTributario): string {
  switch (regime) {
    case 'simples_nacional':
      return 'Simples Nacional';
    case 'simples_nacional_excesso':
      return 'Simples Nac. (Excesso)';
    case 'regime_normal':
      return 'Regime Normal';
    default:
      return 'Não informado';
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
