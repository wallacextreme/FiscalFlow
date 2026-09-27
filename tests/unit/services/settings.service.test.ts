import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { SettingsRepository } from '../../../src/database/repositories/settings.repository.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';
import { SettingsService } from '../../../src/services/settings.service.ts';
import { companyService } from '../../../src/services/company.service.ts';
import { themeService } from '../../../src/services/theme.service.ts';
import { exportService } from '../../../src/services/export.service.ts';
import { setDatabase } from '../../../src/database/connection.ts';
import type { BackupData } from '../../../src/types/models.ts';

describe('SettingsService', () => {
  let db: NodeSqliteAdapter;
  let settingsRepo: SettingsRepository;
  let companyRepo: CompanyRepository;
  let service: SettingsService;

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    setDatabase(db);

    settingsRepo = new SettingsRepository(db);
    companyRepo = new CompanyRepository(db);
    service = new SettingsService(settingsRepo);

    // Mock companyRepo in companyService to use the test db
    (companyService as any).repo = companyRepo;
  });

  afterEach(async () => {
    await db.close();
    setDatabase(null);
    vi.restoreAllMocks();
  });

  it('should get default preferences correctly', async () => {
    const prefs = await service.getPreferences();
    expect(prefs.theme).toBe('dark');
    expect(prefs.pageSize).toBe(50); // From migration 001 seed
    expect(prefs.notifyCancelled).toBe(true);
    expect(prefs.backupReminder).toBe(false);
  });

  it('should save and update preferences in database and theme service', async () => {
    const themeSpy = vi.spyOn(themeService, 'setTheme');

    await service.savePreferences({
      theme: 'light',
      pageSize: 20,
      notifyCancelled: false,
      backupReminder: true
    });

    expect(themeSpy).toHaveBeenCalledWith('light');

    const updated = await service.getPreferences();
    expect(updated.theme).toBe('light');
    expect(updated.pageSize).toBe(20);
    expect(updated.notifyCancelled).toBe(false);
    expect(updated.backupReminder).toBe(true);
  });

  it('should return database statistics accurately', async () => {
    const stats = await service.getDatabaseStats();
    expect(stats.companies).toBe(0);
    expect(stats.fiscalDocuments).toBe(0);

    await companyRepo.create({
      id: 'comp-10',
      cnpj: '12345678000199',
      razaoSocial: 'Xtreme Serviços SA',
      ativa: true
    });

    const updatedStats = await service.getDatabaseStats();
    expect(updatedStats.companies).toBe(1);
  });

  it('should export backup by saving blob file', async () => {
    const saveSpy = vi.spyOn(exportService, 'saveBlobFile').mockResolvedValue('backup.json');

    const result = await service.exportBackup();
    expect(saveSpy).toHaveBeenCalled();
    expect(result).toBe('backup.json');
  });

  it('should import and restore valid backup data', async () => {
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      companies: [
        {
          id: 'imported-c1',
          cnpj: '55666777000188',
          razaoSocial: 'Imported Company LTDA',
          ativa: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      fiscalDocuments: [],
      documentItems: [],
      spedFiles: [],
      importRecords: [],
      appSettings: [
        { key: 'theme', value: 'light', updatedAt: new Date().toISOString() }
      ]
    };

    const res = await service.importBackup(JSON.stringify(backup));
    expect(res.success).toBe(true);
    expect(res.stats.companies).toBe(1);

    const activeCompany = await companyService.getActiveCompany();
    expect(activeCompany?.id).toBe('imported-c1');
    expect(activeCompany?.razaoSocial).toBe('Imported Company LTDA');
  });

  it('should reject invalid JSON or corrupted backup structures', async () => {
    await expect(service.importBackup('invalid-json')).rejects.toThrow('não contém um JSON válido');
    await expect(service.importBackup('{"invalid": true}')).rejects.toThrow('incompatível com o FiscalFlow');
  });

  it('should optimize database via vacuum', async () => {
    const stats = await service.optimizeDatabase();
    expect(stats).toBeDefined();
    expect(stats.companies).toBe(0);
  });

  it('should reset database and clear active company', async () => {
    await companyRepo.create({
      id: 'comp-to-reset',
      cnpj: '99888777000100',
      razaoSocial: 'Reset Test',
      ativa: true
    });
    await companyService.setActiveCompany('comp-to-reset');

    await service.resetDatabase();

    const stats = await service.getDatabaseStats();
    expect(stats.companies).toBe(0);

    const active = await companyService.getActiveCompany();
    expect(active).toBeNull();
  });
});
