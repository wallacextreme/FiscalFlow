/**
 * FiscalFlow — Theme Service
 * 
 * Manages Dark/Light mode theme switching and persistence.
 * Default is dark mode per UI/UX specification.
 */

export type Theme = 'dark' | 'light';

class ThemeService {
  private currentTheme: Theme = 'dark';
  private listeners: ((theme: Theme) => void)[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('fiscalflow_theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      this.currentTheme = saved;
    } else {
      this.currentTheme = 'dark'; // Dark mode is default
    }

    this.applyTheme(this.currentTheme);
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fiscalflow_theme', theme);
      this.applyTheme(theme);
    }
    this.notifyListeners();
  }

  /**
   * Toggle between dark and light mode
   */
  toggleTheme(): Theme {
    const nextTheme: Theme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Subscribe to theme changes
   */
  onChange(callback: (theme: Theme) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.currentTheme));
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    }
  }
}

export const themeService = new ThemeService();
