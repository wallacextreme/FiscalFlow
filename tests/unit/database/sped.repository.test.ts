import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';
import { SpedRepository } from '../../../src/database/repositories/sped.repository.ts';
import type { SpedFile } from '../../../src/types/models.ts';

describe('SpedRepository', () => {
  let db: NodeSqliteAdapter;
  let companyRepo: CompanyRepository;
  let spedRepo: SpedRepository;
  const companyId = 'company-sped-test';

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    companyRepo = new CompanyRepository(db);
    spedRepo = new SpedRepository(db);

    await companyRepo.create({
      id: companyId,
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Teste Sped LTDA',
      ativa: true
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should insert and retrieve a SPED file record', async () => {
    const file: SpedFile = {
      id: 'sped-test-1',
      companyId,
      tipo: 'efd_icms_ipi',
      periodo: '202401',
      dataInicio: '2024-01-01',
      dataFim: '2024-01-31',
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Teste Sped LTDA',
      inscricaoEstadual: '123456789',
      versaoLayout: '018',
      finalidade: 'original',
      conteudoOriginal: '|0000|018|0|01012024|31012024|...',
      conteudoHash: 'hash-sped-123',
      totalRegistros: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await spedRepo.create(file);
    expect(saved.id).toBe('sped-test-1');
    expect(saved.periodo).toBe('202401');

    const retrieved = await spedRepo.findById('sped-test-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.cnpj).toBe('11222333000181');
    expect(retrieved?.versaoLayout).toBe('018');
  });

  it('should find by hash and find all by company', async () => {
    await spedRepo.create({
      id: 'sped-1',
      companyId,
      tipo: 'efd_icms_ipi',
      periodo: '202401',
      dataInicio: '2024-01-01',
      dataFim: '2024-01-31',
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Teste Sped LTDA',
      versaoLayout: '018',
      finalidade: 'original',
      conteudoOriginal: 'content 1',
      conteudoHash: 'hash-1',
      totalRegistros: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await spedRepo.create({
      id: 'sped-2',
      companyId,
      tipo: 'efd_icms_ipi',
      periodo: '202402',
      dataInicio: '2024-02-01',
      dataFim: '2024-02-29',
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Teste Sped LTDA',
      versaoLayout: '018',
      finalidade: 'original',
      conteudoOriginal: 'content 2',
      conteudoHash: 'hash-2',
      totalRegistros: 75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const byHash = await spedRepo.findByHash(companyId, 'hash-2');
    expect(byHash?.id).toBe('sped-2');

    const list = await spedRepo.findByCompany(companyId);
    expect(list).toHaveLength(2);
    expect(list[0].periodo).toBe('202402'); // Sorted DESC
  });

  it('should delete SPED file by id', async () => {
    await spedRepo.create({
      id: 'sped-del',
      companyId,
      tipo: 'efd_icms_ipi',
      periodo: '202401',
      dataInicio: '2024-01-01',
      dataFim: '2024-01-31',
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Teste Sped LTDA',
      versaoLayout: '018',
      finalidade: 'original',
      conteudoOriginal: 'content',
      conteudoHash: 'hash-del',
      totalRegistros: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const deleted = await spedRepo.delete('sped-del');
    expect(deleted).toBe(true);

    const found = await spedRepo.findById('sped-del');
    expect(found).toBeNull();
  });
});
