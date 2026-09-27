/**
 * FiscalFlow — Document Details Modal Component
 * 
 * Reusable modal for full inspection of NF-e, NFC-e, NFS-e and CT-e documents.
 * Renders 4 tabs: Overview & Parties, Totals & Taxes, Items, and Original XML.
 */

import { DocumentRepository } from '../database/repositories/document.repository.ts';
import type { FiscalDocument } from '../types/models.ts';
import { 
  formatCurrency, 
  formatDate, 
  formatCnpjOrCpf, 
  formatChaveAcesso, 
  isValidChaveAcesso, 
  parseChaveAcesso,
  cleanDigits
} from '../utils/validators.ts';
import { toast } from './toast.ts';
import { openModal } from './modal.ts';

export async function showDocumentDetailsModal(
  documentId: string, 
  customRepo?: DocumentRepository
): Promise<void> {
  const documentRepo = customRepo || new DocumentRepository();
  const doc = await documentRepo.findById(documentId);
  if (!doc) {
    toast.show('Documento fiscal não encontrado.', 'error');
    return;
  }

  const items = await documentRepo.findItemsByDocumentId(documentId);

  const chaveInfo = doc.chaveAcesso ? parseChaveAcesso(doc.chaveAcesso) : null;
  const isDvValid = doc.chaveAcesso ? isValidChaveAcesso(doc.chaveAcesso) : false;

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <!-- Modal Navigation Tabs -->
    <div class="tabs-nav" id="doc-modal-tabs">
      <button class="tab-btn tab-btn--active" data-tab="tab-overview">Visão Geral & Partes</button>
      <button class="tab-btn" data-tab="tab-totals">Totais & Impostos</button>
      <button class="tab-btn" data-tab="tab-items">Itens (${items.length})</button>
      <button class="tab-btn" data-tab="tab-xml">XML Original</button>
    </div>

    <!-- Tab 1: Overview & Parties -->
    <div class="tab-content" id="tab-overview">
      <!-- Chave de Acesso / Código de Verificação Card -->
      ${doc.chaveAcesso ? `
        <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); background-color: var(--bg-tertiary);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
            <span style="font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">
              ${cleanDigits(doc.chaveAcesso).length === 44 ? 'Chave de Acesso (44 Dígitos)' : 'Código de Verificação / Autenticidade'}
            </span>
            ${cleanDigits(doc.chaveAcesso).length === 44 ? `
              <span class="badge ${isDvValid ? 'badge--autorizada' : 'badge--cancelada'}" style="font-size: 0.6875rem;">
                ${isDvValid ? '✓ Dígito Verificador Válido (DV: ' + (chaveInfo?.dv || '') + ')' : '✗ Dígito Verificador Inválido'}
              </span>
            ` : `
              <span class="badge badge--nfse" style="font-size: 0.6875rem;">
                NFS-e Autenticação
              </span>
            `}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap;">
            <span class="text-mono" style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); letter-spacing: 0.04em;">
              ${cleanDigits(doc.chaveAcesso).length === 44 ? formatChaveAcesso(doc.chaveAcesso) : doc.chaveAcesso}
            </span>
            <button class="btn btn--secondary btn--sm" id="btn-modal-copy-chave" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copiar
            </button>
          </div>
        </div>
      ` : ''}

      <!-- General Info Grid -->
      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-card__label">Número / Série</div>
          <div class="detail-card__value text-mono">${doc.numero} / ${doc.serie || '1'}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Tipo</div>
          <div class="detail-card__value"><span class="badge badge--${doc.tipo}">${doc.tipo.toUpperCase()}</span></div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Data Emissão</div>
          <div class="detail-card__value" style="font-size: 0.8125rem;">${formatDate(doc.dataEmissao)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Situação</div>
          <div class="detail-card__value"><span class="badge badge--${doc.situacao}">${doc.situacao.toUpperCase()}</span></div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Versão Layout</div>
          <div class="detail-card__value text-mono">${doc.nfeVersao || '4.00'}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Natureza Operação</div>
          <div class="detail-card__value truncate" style="font-size: 0.8125rem;" title="${escapeHtml(doc.naturezaOperacao || '-')}">${escapeHtml(doc.naturezaOperacao || '-')}</div>
        </div>
      </div>

      <!-- Emitente & Destinatário Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-3);">
        <!-- Emitente -->
        <div class="card" style="padding: var(--space-4);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
            Emitente
          </div>
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
            ${escapeHtml(doc.emitenteRazaoSocial)}
          </div>
          <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
            CNPJ: ${formatCnpjOrCpf(doc.emitenteCnpjCpf)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            UF: <strong>${doc.emitenteUf || '-'}</strong>
          </div>
        </div>

        <!-- Destinatário -->
        <div class="card" style="padding: var(--space-4);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
            Destinatário
          </div>
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
            ${escapeHtml(doc.destinatarioRazaoSocial || 'Consumidor Final')}
          </div>
          <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
            ${doc.destinatarioCnpjCpf ? `CNPJ/CPF: ${formatCnpjOrCpf(doc.destinatarioCnpjCpf)}` : 'Não informado'}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            UF: <strong>${doc.destinatarioUf || '-'}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Totals & Taxes -->
    <div class="tab-content" id="tab-totals" style="display: none;">
      <div class="detail-section-title">Valores Totais da Nota</div>
      <div class="detail-grid">
        <div class="detail-card" style="border-left: 3px solid var(--accent-primary);">
          <div class="detail-card__label">Valor Total da Nota</div>
          <div class="detail-card__value" style="font-size: 1.125rem; color: var(--accent-primary);">${formatCurrency(doc.valorTotal)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor ICMS</div>
          <div class="detail-card__value">${formatCurrency(doc.valorICMS || 0)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor IPI</div>
          <div class="detail-card__value">${formatCurrency(doc.valorIPI || 0)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor PIS</div>
          <div class="detail-card__value">${formatCurrency(doc.valorPIS || 0)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor COFINS</div>
          <div class="detail-card__value">${formatCurrency(doc.valorCOFINS || 0)}</div>
        </div>
        ${doc.valorISS ? `
          <div class="detail-card">
            <div class="detail-card__label">Valor ISS</div>
            <div class="detail-card__value">${formatCurrency(doc.valorISS)}</div>
          </div>
        ` : ''}
      </div>

      <div class="card" style="padding: var(--space-4); margin-top: var(--space-4); background-color: var(--bg-tertiary);">
        <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-2);">
          Hash de Integridade do Arquivo (SHA-256)
        </div>
        <div class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">
          ${doc.xmlHash}
        </div>
      </div>
    </div>

    <!-- Tab 3: Items -->
    <div class="tab-content" id="tab-items" style="display: none;">
      ${items.length === 0 ? `
        <div class="empty-state" style="padding: var(--space-6);">
          <p class="empty-state__description">Nenhum item discriminado para este documento fiscal.</p>
        </div>
      ` : `
        <div style="overflow-x: auto; max-height: 400px;">
          <table class="table" style="font-size: 0.75rem;">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Código</th>
                <th>Descrição</th>
                <th>NCM</th>
                <th>CFOP</th>
                <th class="text-right">Qtd</th>
                <th>Un</th>
                <th class="text-right">Vlr Unit</th>
                <th class="text-right">Vlr Total</th>
                <th>CST</th>
                <th class="text-right">ICMS</th>
                <th class="text-right">IPI</th>
                <th class="text-right">PIS</th>
                <th class="text-right">COFINS</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td class="text-mono" style="font-weight: 600;">${item.numeroItem}</td>
                  <td class="text-mono text-muted">${escapeHtml(item.codigo || '-')}</td>
                  <td style="font-weight: 500; min-width: 180px;">${escapeHtml(item.descricao)}</td>
                  <td class="text-mono text-muted">${item.ncm || '-'}</td>
                  <td class="text-mono text-muted">${item.cfop || '-'}</td>
                  <td class="text-right text-mono">${item.quantidade}</td>
                  <td>${item.unidade || 'UN'}</td>
                  <td class="text-right text-mono">${formatCurrency(item.valorUnitario)}</td>
                  <td class="text-right text-mono font-medium">${formatCurrency(item.valorTotal)}</td>
                  <td class="text-mono text-muted">${item.cst || '-'}</td>
                  <td class="text-right text-mono">${item.valorICMS ? formatCurrency(item.valorICMS) : '-'}</td>
                  <td class="text-right text-mono">${item.valorIPI ? formatCurrency(item.valorIPI) : '-'}</td>
                  <td class="text-right text-mono">${item.valorPIS ? formatCurrency(item.valorPIS) : '-'}</td>
                  <td class="text-right text-mono">${item.valorCOFINS ? formatCurrency(item.valorCOFINS) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Tab 4: XML Original -->
    <div class="tab-content" id="tab-xml" style="display: none;">
      <div style="display: flex; justify-content: flex-end; gap: var(--space-2); margin-bottom: var(--space-2);">
        <button class="btn btn--secondary btn--sm" id="btn-modal-copy-xml">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar XML
        </button>
        <button class="btn btn--secondary btn--sm" id="btn-modal-download-xml">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Baixar XML (.xml)
        </button>
      </div>
      <pre class="xml-code-viewer"><code>${escapeHtml(doc.xmlOriginal)}</code></pre>
    </div>
  `;

  // Tab switching logic
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

  // Modal Copy Chave
  modalContent.querySelector('#btn-modal-copy-chave')?.addEventListener('click', async () => {
    if (doc.chaveAcesso) {
      await copyToClipboard(doc.chaveAcesso, 'Chave de acesso copiada!');
    }
  });

  // Modal Copy XML
  modalContent.querySelector('#btn-modal-copy-xml')?.addEventListener('click', async () => {
    await copyToClipboard(doc.xmlOriginal, 'Conteúdo XML copiado!');
  });

  // Modal Download XML
  modalContent.querySelector('#btn-modal-download-xml')?.addEventListener('click', () => {
    downloadXmlFile(doc);
  });

  openModal({
    title: `${doc.tipo.toUpperCase()} nº ${doc.numero} (Série ${doc.serie || '1'})`,
    content: modalContent,
    maxWidth: '850px',
    buttons: [
      {
        text: 'Fechar',
        variant: 'secondary'
      }
    ]
  });
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
