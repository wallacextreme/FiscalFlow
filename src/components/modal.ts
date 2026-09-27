/**
 * FiscalFlow — Modal Component
 * 
 * Reusable modal dialog with focus management, backdrop clicking,
 * and keyboard Escape closing.
 */

export interface ModalButton {
  text: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick?: (modal: ModalInstance) => void | Promise<void>;
  id?: string;
}

export interface ModalOptions {
  title: string;
  content: string | HTMLElement;
  buttons?: ModalButton[];
  maxWidth?: string;
  onClose?: () => void;
}

export interface ModalInstance {
  overlay: HTMLElement;
  modal: HTMLElement;
  close: () => void;
}

export function openModal(options: ModalOptions): ModalInstance {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const modal = document.createElement('div');
  modal.className = 'modal';
  if (options.maxWidth) {
    modal.style.maxWidth = options.maxWidth;
  }

  // Header
  const header = document.createElement('div');
  header.className = 'modal__header';
  header.innerHTML = `
    <h2 class="modal__title">${escapeHtml(options.title)}</h2>
    <button class="modal__close" aria-label="Fechar janela modal">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  // Body
  const body = document.createElement('div');
  body.className = 'modal__body';
  if (typeof options.content === 'string') {
    body.innerHTML = options.content;
  } else {
    body.appendChild(options.content);
  }

  modal.appendChild(header);
  modal.appendChild(body);

  // Footer (optional)
  if (options.buttons && options.buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal__footer';

    const instanceRef: ModalInstance = {
      overlay,
      modal,
      close: () => {}
    };

    options.buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `btn btn--${btn.variant || 'secondary'}`;
      button.textContent = btn.text;
      if (btn.id) button.id = btn.id;

      button.addEventListener('click', async () => {
        if (btn.onClick) {
          await btn.onClick(instanceRef);
        } else {
          instanceRef.close();
        }
      });

      footer.appendChild(button);
    });

    modal.appendChild(footer);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Force reflow and show with animation
  requestAnimationFrame(() => {
    overlay.classList.add('modal-overlay--visible');
  });

  const close = () => {
    overlay.classList.remove('modal-overlay--visible');
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
      document.removeEventListener('keydown', handleKeyDown);
      options.onClose?.();
    }, 200);
  };

  const instance: ModalInstance = { overlay, modal, close };

  // Setup close events
  const closeBtn = header.querySelector('.modal__close');
  closeBtn?.addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  return instance;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
