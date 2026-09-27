/**
 * FiscalFlow — Settings Service
 * 
 * Coordinates application preferences, database backups, restoration,
 * and database health / optimization operations.
 */

import { SettingsRepository, settingsRepo } from '../database/repositories/settings.repository.ts';
import { themeService } from './theme.service.ts';
import { companyService } from './company.service.ts';
import { exportService } from './export.service.ts';
import type { DatabaseStats, BackupData } from '../types/models.ts';

export interface AppPreferences {
  theme: 'dark' | 'light';
  pageSize: number;
  notifyCancelled: boolean;
  backupReminder: boolean;
}

export class SettingsService {
  private repo: SettingsRepository;

  constructor(repo: SettingsRepository = settingsRepo) {
    this.repo = repo;
  }

  /**
   * Load current application preferences
   */
  async getPreferences(): Promise<AppPreferences> {
    const rawSettings = await this.repo.getAll();

    return {
      theme: (rawSettings.theme as 'dark' | 'light') || themeService.getTheme() || 'dark',
      pageSize: parseInt(rawSettings.page_size, 10) || 20,
      notifyCancelled: rawSettings.notify_cancelled !== 'false',
      backupReminder: rawSettings.backup_reminder === 'true'
    };
  }

  /**
   * Save updated preferences to database and active theme
   */
  async savePreferences(prefs: Partial<AppPreferences>): Promise<void> {
    if (prefs.theme) {
      await this.repo.set('theme', prefs.theme);
      themeService.setTheme(prefs.theme);
    }

    if (prefs.pageSize !== undefined) {
      await this.repo.set('page_size', prefs.pageSize.toString());
    }

    if (prefs.notifyCancelled !== undefined) {
      await this.repo.set('notify_cancelled', prefs.notifyCancelled ? 'true' : 'false');
    }

    if (prefs.backupReminder !== undefined) {
      await this.repo.set('backup_reminder', prefs.backupReminder ? 'true' : 'false');
    }
  }

  /**
   * Get database statistics and counts
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    return this.repo.getDatabaseStats();
  }

  /**
   * Export complete database backup as JSON file
   */
  async exportBackup(): Promise<string | null> {
    const backupData = await this.repo.exportBackup();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const defaultFilename = `fiscalflow_backup_${dateStr}.json`;

    return exportService.saveBlobFile(blob, defaultFilename, [
      { name: 'Backup FiscalFlow (*.json)', extensions: ['json'] }
    ]);
  }

  /**
   * Import and restore database from backup JSON string
   */
  async importBackup(jsonString: string): Promise<{ success: boolean; stats: DatabaseStats }> {
    let parsed: BackupData;
    try {
      parsed = JSON.parse(jsonString) as BackupData;
    } catch {
      throw new Error('O arquivo selecionado não contém um JSON válido.');
    }

    if (!parsed || !Array.isArray(parsed.companies) || !Array.isArray(parsed.fiscalDocuments)) {
      throw new Error('Estrutura de backup incompatível com o FiscalFlow.');
    }

    const result = await this.repo.restoreBackup(parsed);

    // Refresh active company context if needed
    if (parsed.companies.length > 0) {
      await companyService.setActiveCompany(parsed.companies[0].id);
    } else {
      await companyService.clearActiveCompany();
    }

    // Apply theme from backup if present
    const backupTheme = parsed.appSettings?.find(s => s.key === 'theme')?.value;
    if (backupTheme === 'dark' || backupTheme === 'light') {
      themeService.setTheme(backupTheme);
    }

    return result;
  }

  /**
   * Run SQLite VACUUM optimization
   */
  async optimizeDatabase(): Promise<DatabaseStats> {
    await this.repo.vacuum();
    return this.repo.getDatabaseStats();
  }

  /**
   * Wipe all database tables and reset active company
   */
  async resetDatabase(): Promise<void> {
    await this.repo.clearAllData();
    await companyService.clearActiveCompany();
  }
}

export const settingsService = new SettingsService();
