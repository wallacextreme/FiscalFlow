import { describe, it, expect, beforeEach, vi } from 'vitest';
import { themeService } from '../../../src/services/theme.service.ts';

describe('ThemeService', () => {
  beforeEach(() => {
    // Setup mock localStorage and documentElement
    const store: Record<string, string> = {};
    const classList = new Set<string>();
    const attributes: Record<string, string> = {};

    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    });

    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          contains: (cls: string) => classList.has(cls)
        },
        setAttribute: (attr: string, val: string) => { attributes[attr] = val; },
        getAttribute: (attr: string) => attributes[attr] ?? null
      }
    });
  });

  it('should set and toggle themes between dark and light', () => {
    themeService.setTheme('dark');
    expect(themeService.getTheme()).toBe('dark');
    expect(localStorage.getItem('fiscalflow_theme')).toBe('dark');

    const next = themeService.toggleTheme();
    expect(next).toBe('light');
    expect(themeService.getTheme()).toBe('light');
    expect(localStorage.getItem('fiscalflow_theme')).toBe('light');

    const backToDark = themeService.toggleTheme();
    expect(backToDark).toBe('dark');
    expect(themeService.getTheme()).toBe('dark');
  });

  it('should notify registered listeners when theme changes', () => {
    const listener = vi.fn();
    const unsubscribe = themeService.onChange(listener);

    themeService.setTheme('light');
    expect(listener).toHaveBeenCalledWith('light');

    themeService.setTheme('dark');
    expect(listener).toHaveBeenCalledWith('dark');

    unsubscribe();
    themeService.setTheme('light');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
