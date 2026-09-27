import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';

describe('CompanyRepository', () => {
  let db: NodeSqliteAdapter;
  let repo: CompanyRepository;

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    repo = new CompanyRepository(db);
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and retrieve a company by id', async () => {
    const created = await repo.create({
      id: 'comp-1',
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'Xtreme Sistemas LTDA',
      nomeFantasia: 'Xtreme Sistemas',
      endereco: {
        logradouro: 'Av. Paulista',
        numero: '1000',
        municipio: 'São Paulo',
        uf: 'SP',
        cep: '01310-100'
      },
      regimeTributario: 'simples_nacional',
      ativa: true
    });

    expect(created.id).toBe('comp-1');
    expect(created.cnpj).toBe('12345678000190'); // Stored clean numeric
    expect(created.razaoSocial).toBe('Xtreme Sistemas LTDA');
    expect(created.endereco?.municipio).toBe('São Paulo');

    const retrieved = await repo.findById('comp-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.cnpj).toBe('12345678000190');
    expect(retrieved?.razaoSocial).toBe('Xtreme Sistemas LTDA');
  });

  it('should find company by formatted or raw CNPJ', async () => {
    await repo.create({
      id: 'comp-2',
      cnpj: '98765432000112',
      razaoSocial: 'Empresa Teste SA',
      ativa: true
    });

    const foundByRaw = await repo.findByCnpj('98765432000112');
    expect(foundByRaw?.id).toBe('comp-2');

    const foundByFormatted = await repo.findByCnpj('98.765.432/0001-12');
    expect(foundByFormatted?.id).toBe('comp-2');
  });

  it('should reject duplicate CNPJ', async () => {
    await repo.create({
      id: 'comp-a',
      cnpj: '11111111000111',
      razaoSocial: 'Empresa A',
      ativa: true
    });

    await expect(
      repo.create({
        id: 'comp-b',
        cnpj: '11.111.111/0001-11',
        razaoSocial: 'Empresa B',
        ativa: true
      })
    ).rejects.toThrow();
  });

  it('should filter active companies', async () => {
    await repo.create({
      id: 'comp-active',
      cnpj: '22222222000122',
      razaoSocial: 'Empresa Ativa',
      ativa: true
    });

    await repo.create({
      id: 'comp-inactive',
      cnpj: '33333333000133',
      razaoSocial: 'Empresa Inativa',
      ativa: false
    });

    const all = await repo.findAll(false);
    expect(all).toHaveLength(2);

    const onlyActive = await repo.findAll(true);
    expect(onlyActive).toHaveLength(1);
    expect(onlyActive[0].id).toBe('comp-active');
  });

  it('should search by name or CNPJ', async () => {
    await repo.create({
      id: 'comp-search',
      cnpj: '44444444000144',
      razaoSocial: 'Distribuidora Central do Brasil',
      nomeFantasia: 'Central Sul',
      ativa: true
    });

    const byRazao = await repo.search('Central');
    expect(byRazao).toHaveLength(1);

    const byFantasia = await repo.search('Sul');
    expect(byFantasia).toHaveLength(1);

    const byCnpj = await repo.search('44444444');
    expect(byCnpj).toHaveLength(1);
  });

  it('should update company details', async () => {
    await repo.create({
      id: 'comp-update',
      cnpj: '55555555000155',
      razaoSocial: 'Nome Antigo LTDA',
      ativa: true
    });

    const updated = await repo.update('comp-update', {
      razaoSocial: 'Nome Novo SA',
      ativa: false
    });

    expect(updated?.razaoSocial).toBe('Nome Novo SA');
    expect(updated?.ativa).toBe(false);

    const refetched = await repo.findById('comp-update');
    expect(refetched?.razaoSocial).toBe('Nome Novo SA');
  });

  it('should delete company', async () => {
    await repo.create({
      id: 'comp-delete',
      cnpj: '66666666000166',
      razaoSocial: 'Empresa Deletar',
      ativa: true
    });

    const deleted = await repo.delete('comp-delete');
    expect(deleted).toBe(true);

    const notFound = await repo.findById('comp-delete');
    expect(notFound).toBeNull();
  });
});
