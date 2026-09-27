/**
 * FiscalFlow — Hash Router
 * 
 * Simple, robust SPA Hash Router for desktop applications.
 * Handles parameters, query strings, and route transitions.
 */

export interface RouteContext {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
}

export type RouteHandler = (context: RouteContext, container: HTMLElement) => void | Promise<void>;

export interface RouteDefinition {
  path: string;
  name: string;
  title: string;
  handler: RouteHandler;
}

export class Router {
  private routes: RouteDefinition[] = [];
  private currentPath = '';
  private container: HTMLElement | null = null;
  private afterNavCallbacks: ((route: RouteDefinition, context: RouteContext) => void)[] = [];

  constructor(containerId: string = 'main-content') {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => this.handleRouting());
    }
    this.container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
  }

  setContainer(container: HTMLElement): void {
    this.container = container;
  }

  /**
   * Register a route definition
   */
  register(path: string, name: string, title: string, handler: RouteHandler): this {
    this.routes.push({ path, name, title, handler });
    return this;
  }

  /**
   * Navigate programmatically to a path
   */
  async navigate(path: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const cleanPath = path.startsWith('#') ? path : `#${path}`;
    window.location.hash = cleanPath;
    await this.handleRouting();
  }

  /**
   * Get current route path
   */
  getCurrentPath(): string {
    return this.currentPath;
  }

  /**
   * Register callback after navigation completes
   */
  onAfterNavigate(callback: (route: RouteDefinition, context: RouteContext) => void): () => void {
    this.afterNavCallbacks.push(callback);
    return () => {
      this.afterNavCallbacks = this.afterNavCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Initialize router and handle initial route
   */
  init(defaultPath: string = '/dashboard'): void {
    if (typeof window === 'undefined') return;

    if (!window.location.hash) {
      window.location.hash = `#${defaultPath}`;
    } else {
      this.handleRouting();
    }
  }

  private async handleRouting(): Promise<void> {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.slice(1) || '/dashboard';
    const [pathPart, queryPart] = hash.split('?');
    const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
    const query = new URLSearchParams(queryPart || '');

    const match = this.matchRoute(path);

    const container = this.container || document.getElementById('main-content');
    if (!container) {
      console.warn('Router: Container element #main-content not found');
      return;
    }

    this.currentPath = path;

    if (!match) {
      this.renderNotFound(container, path);
      return;
    }

    // Trigger smooth fade transition
    container.classList.remove('page-transition');
    void container.offsetWidth; // Force reflow
    container.classList.add('page-transition');

    const context: RouteContext = {
      path,
      params: match.params,
      query
    };

    try {
      await match.route.handler(context, container);
    } catch (err) {
      console.error(`Router error handling route "${path}":`, err);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">Erro ao carregar página</div>
          <div class="empty-state__description">${err instanceof Error ? err.message : String(err)}</div>
          <button class="btn btn--primary" id="btn-retry-route">Recarregar</button>
        </div>
      `;
      container.querySelector('#btn-retry-route')?.addEventListener('click', () => {
        this.handleRouting();
      });
    }

    // Notify listeners
    this.afterNavCallbacks.forEach(cb => cb(match.route, context));
  }

  private matchRoute(urlPath: string): { route: RouteDefinition; params: Record<string, string> } | null {
    for (const route of this.routes) {
      const paramNames: string[] = [];
      const regexPattern = route.path
        .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
          paramNames.push(name);
          return '([^/]+)';
        })
        .replace(/\//g, '\\/');

      const regex = new RegExp(`^${regexPattern}$`);
      const match = urlPath.match(regex);

      if (match) {
        const params: Record<string, string> = {};
        paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { route, params };
      }
    }
    return null;
  }

  private renderNotFound(container: HTMLElement, path: string): void {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-header__title">404 — Página não encontrada</h1>
          <p class="page-header__subtitle">A rota "${path}" não existe.</p>
        </div>
      </div>
      <div class="empty-state">
        <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        <h2 class="empty-state__title">Página Inexistente</h2>
        <p class="empty-state__description">O recurso solicitado não pôde ser encontrado.</p>
        <a href="#/dashboard" class="btn btn--primary">Voltar para o Dashboard</a>
      </div>
    `;
  }
}

export const router = new Router();
