import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '../../../src/router/index.ts';

describe('Router', () => {
  let router: Router;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { hash: '#/dashboard' },
      addEventListener: vi.fn()
    });

    const classList = new Set<string>();
    mockContainer = {
      innerHTML: '',
      classList: {
        add: (c: string) => classList.add(c),
        remove: (c: string) => classList.delete(c),
        contains: (c: string) => classList.has(c)
      },
      offsetWidth: 100,
      querySelector: vi.fn()
    } as unknown as HTMLElement;

    router = new Router('main-content');
    router.setContainer(mockContainer);
  });

  it('should register routes and navigate correctly to static paths', async () => {
    const handler = vi.fn();
    router.register('/test', 'test', 'Test Title', handler);

    await router.navigate('/test');
    expect(window.location.hash).toBe('#/test');
    expect(router.getCurrentPath()).toBe('/test');
    expect(handler).toHaveBeenCalled();
  });

  it('should match dynamic route parameters', async () => {
    let capturedId = '';
    router.register('/documents/:id', 'doc-detail', 'Detalhes', (ctx) => {
      capturedId = ctx.params.id;
    });

    await router.navigate('/documents/doc-12345');
    expect(capturedId).toBe('doc-12345');
  });

  it('should execute onAfterNavigate callbacks', async () => {
    const navCallback = vi.fn();
    router.register('/dashboard', 'dash', 'Dashboard', () => {});
    router.onAfterNavigate(navCallback);

    await router.navigate('/dashboard');
    expect(navCallback).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/dashboard', name: 'dash' }),
      expect.objectContaining({ path: '/dashboard' })
    );
  });

  it('should render 404 when route is not registered', async () => {
    await router.navigate('/unknown-route');
    expect(mockContainer.innerHTML).toContain('404 — Página não encontrada');
  });
});
