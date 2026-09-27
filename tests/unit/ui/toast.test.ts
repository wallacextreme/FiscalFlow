import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toast } from '../../../src/components/toast.ts';

describe('ToastManager', () => {
  let mockBody: HTMLElement;
  let container: HTMLElement;

  beforeEach(() => {
    toast.clearContainerForTesting();
    container = {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    } as unknown as HTMLElement;

    mockBody = {
      appendChild: vi.fn()
    } as unknown as HTMLElement;

    vi.stubGlobal('document', {
      body: mockBody,
      getElementById: (id: string) => {
        if (id === 'toast-container') return container;
        return null;
      },
      createElement: (tag: string) => {
        const el: Record<string, unknown> = {
          tagName: tag.toUpperCase(),
          className: '',
          innerHTML: '',
          style: {},
          setAttribute: vi.fn(),
          querySelector: vi.fn(() => ({
            addEventListener: vi.fn()
          })),
          remove: vi.fn(),
          appendChild: vi.fn()
        };
        return el as unknown as HTMLElement;
      }
    });
  });

  it('should create success toast with correct class and role', () => {
    const el = toast.success('Operação realizada com sucesso');
    expect(el.className).toBe('toast toast--success');
    expect(el.setAttribute).toHaveBeenCalledWith('role', 'alert');
    expect(container.appendChild).toHaveBeenCalledWith(el);
  });

  it('should create error toast with correct class', () => {
    const el = toast.error('Falha ao processar arquivo');
    expect(el.className).toBe('toast toast--error');
    expect(container.appendChild).toHaveBeenCalledWith(el);
  });

  it('should create warning and info toasts', () => {
    const warnEl = toast.warning('Atenção aos dados informados');
    expect(warnEl.className).toBe('toast toast--warning');

    const infoEl = toast.info('Arquivo carregado');
    expect(infoEl.className).toBe('toast toast--info');
  });
});
