import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { SettingsRepository } from '../../../src/database/repositories/settings.repository.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';
import { DocumentRepository } from '../../../src/database/repositories/document.repository.ts';
import type { BackupData } from '../../../src/types/models.ts';

describe('SettingsRepository', () => {
  let db: NodeSqliteAdapter;
  let repo: SettingsRepository;
  let companyRepo: CompanyRepository;
  let documentRepo: DocumentRepository;

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    repo = new SettingsRepository(db);
    companyRepo = new CompanyRepository(db);
    documentRepo = new DocumentRepository(db);
  });

  afterEach(async () => {
    await db.close();
  });

  it('should get default seeded settings and update them', async () => {
    const theme = await repo.get('theme');
    expect(theme).toBe('dark');

    await repo.set('theme', 'light');
    const updatedTheme = await repo.get('theme');
    expect(updatedTheme).toBe('light');

    await repo.set('custom_key', 'custom_value');
    const custom = await repo.get('custom_key');
    expect(custom).toBe('custom_value');
  });

  it('should get all settings as key-value map', async () => {
    const all = await repo.getAll();
    expect(all.theme).toBe('dark');
    expect(all.page_size).toBe('50');
    expect(all.schema_version).toBe('1');
  });

  it('should return accurate database statistics', async () => {
    const initialStats = await repo.getDatabaseStats();
    expect(initialStats.companies).toBe(0);
    expect(initialStats.fiscalDocuments).toBe(0);
    expect(initialStats.documentItems).toBe(0);

    // Create a company and a document
    await companyRepo.create({
      id: 'comp-stats-1',
      cnpj: '11222333000181',
      razaoSocial: 'Stats Test Company LTDA',
      ativa: true
    });

    await documentRepo.create({
      id: 'doc-stats-1',
      companyId: 'comp-stats-1',
      tipo: 'nfe',
      numero: '100',
      dataEmissao: '2026-03-01T10:00:00Z',
      valorTotal: 500,
      emitenteCnpjCpf: '11222333000181',
      emitenteRazaoSocial: 'Stats Test Company LTDA',
      situacao: 'autorizada',
      xmlOriginal: '<xml></xml>',
      xmlHash: 'hash-stats-1',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z'
    }, [
      {
        id: 'item-1',
        documentId: 'doc-stats-1',
        numeroItem: 1,
        descricao: 'Produto Teste',
        quantidade: 1,
        valorUnitario: 500,
        valorTotal: 500
      }
    ]);

    const updatedStats = await repo.getDatabaseStats();
    expect(updatedStats.companies).toBe(1);
    expect(updatedStats.fiscalDocuments).toBe(1);
    expect(updatedStats.documentItems).toBe(1);
  });

  it('should export full database backup with all records', async () => {
    await companyRepo.create({
      id: 'comp-bkp-1',
      cnpj: '44555666000177',
      razaoSocial: 'Backup Empresa SA',
      ativa: true
    });

    const backup = await repo.exportBackup();
    expect(backup.version).toBe(1);
    expect(backup.appVersion).toBe('1.0.0');
    expect(backup.companies.length).toBe(1);
    expect(backup.companies[0].razaoSocial).toBe('Backup Empresa SA');
    expect(backup.appSettings.length).toBeGreaterThan(0);
  });

  it('should restore a full database backup and update statistics', async () => {
    const backupToRestore: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      companies: [
        {
          id: 'restored-comp-1',
          cnpj: '77888999000122',
          razaoSocial: 'Empresa Restaurada LTDA',
          ativa: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      fiscalDocuments: [
        {
          id: 'restored-doc-1',
          companyId: 'restored-comp-1',
          tipo: 'nfe',
          numero: '999',
          dataEmissao: '2026-03-01T12:00:00Z',
          valorTotal: 1200,
          emitenteCnpjCpf: '77888999000122',
          emitenteRazaoSocial: 'Empresa Restaurada LTDA',
          situacao: 'autorizada',
          xmlOriginal: '<nfeProc></nfeProc>',
          xmlHash: 'hash-restored-999',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      documentItems: [
        {
          id: 'restored-item-1',
          documentId: 'restored-doc-1',
          numeroItem: 1,
          descricao: 'Item Restaurado',
          quantidade: 2,
          valorUnitario: 600,
          valorTotal: 1200
        }
      ],
      spedFiles: [],
      importRecords: [],
      appSettings: [
        { key: 'theme', value: 'light', updatedAt: new Date().toISOString() }
      ]
    };

    const result = await repo.restoreBackup(backupToRestore);
    expect(result.success).toBe(true);
    expect(result.stats.companies).toBe(1);
    expect(result.stats.fiscalDocuments).toBe(1);
    expect(result.stats.documentItems).toBe(1);

    const comp = await companyRepo.findById('restored-comp-1');
    expect(comp?.razaoSocial).toBe('Empresa Restaurada LTDA');

    const theme = await repo.get('theme');
    expect(theme).toBe('light');
  });

  it('should clear all data across tables', async () => {
    await companyRepo.create({
      id: 'comp-clear-1',
      cnpj: '99888777000166',
      razaoSocial: 'To Clear SA',
      ativa: true
    });

    await repo.clearAllData();
    const stats = await repo.getDatabaseStats();
    expect(stats.companies).toBe(0);
    expect(stats.fiscalDocuments).toBe(0);
  });

  it('should run vacuum without errors', async () => {
    await expect(repo.vacuum()).resolves.not.toThrow();
  });
});
