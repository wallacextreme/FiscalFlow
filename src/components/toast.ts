/**
 * FiscalFlow — Toast Notification System
 * 
 * Provides temporary notification toasts (success, error, warning, info)
 * matching UI_UX.md design specifications.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number; // milliseconds, default 3500
}

class ToastManager {
  private container: HTMLElement | null = null;

  clearContainerForTesting(): void {
    this.container = null;
  }

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  show(message: string, type: ToastType = 'info', options: ToastOptions = {}): HTMLElement {
    const container = this.getContainer();
    const duration = options.duration ?? 3500;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');

    const iconSvg = this.getIconSvg(type);

    toast.innerHTML = `
      <div class="toast__icon">${iconSvg}</div>
      <div class="toast__message">${this.escapeHtml(message)}</div>
      <button class="toast__close" aria-label="Fechar notificação">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast__close');
    const dismiss = () => {
      toast.style.animation = 'toast-slide-out 250ms ease forwards';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 250);
    };

    closeBtn?.addEventListener('click', dismiss);

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return toast;
  }

  success(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'error', options);
  }

  warning(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'warning', options);
  }

  info(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'info', options);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getIconSvg(type: ToastType): string {
    switch (type) {
      case 'success':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
      case 'error':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      case 'warning':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      case 'info':
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }
  }
}

export const toast = new ToastManager();
