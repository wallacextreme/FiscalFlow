import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NodeSqliteAdapter } from '../../helpers/test-sqlite-adapter.ts';
import { Migrator } from '../../../src/database/migrator.ts';
import { CompanyRepository } from '../../../src/database/repositories/company.repository.ts';
import { CompanyService } from '../../../src/services/company.service.ts';
import { setDatabase } from '../../../src/database/connection.ts';

describe('CompanyService', () => {
  let db: NodeSqliteAdapter;
  let service: CompanyService;

  beforeEach(async () => {
    db = new NodeSqliteAdapter();
    const migrator = new Migrator();
    await migrator.runMigrations(db);
    setDatabase(db);

    const repo = new CompanyRepository(db);
    service = new CompanyService(repo);
  });

  afterEach(async () => {
    await db.close();
    setDatabase(null);
  });

  it('should successfully register a company with valid CNPJ and data', async () => {
    const company = await service.create({
      id: 'comp-10',
      cnpj: '11.222.333/0001-81', // Valid check digits
      razaoSocial: 'Xtreme Tecnologia LTDA',
      nomeFantasia: 'Xtreme Tech',
      ativa: true
    });

    expect(company.id).toBe('comp-10');
    expect(company.cnpj).toBe('11222333000181');
    expect(company.razaoSocial).toBe('Xtreme Tecnologia LTDA');
  });

  it('should reject company with invalid check digits in CNPJ', async () => {
    await expect(
      service.create({
        cnpj: '11.222.333/0001-99', // Invalid check digits
        razaoSocial: 'Empresa Invalida LTDA'
      })
    ).rejects.toThrow('O CNPJ informado é inválido.');
  });

  it('should reject company with empty Razao Social', async () => {
    await expect(
      service.create({
        cnpj: '11.222.333/0001-81',
        razaoSocial: '   '
      })
    ).rejects.toThrow('A Razão Social é obrigatória.');
  });

  it('should reject company with duplicate CNPJ', async () => {
    await service.create({
      cnpj: '11.222.333/0001-81',
      razaoSocial: 'Primeira Empresa LTDA'
    });

    await expect(
      service.create({
        cnpj: '11222333000181', // Same CNPJ without mask
        razaoSocial: 'Segunda Empresa LTDA'
      })
    ).rejects.toThrow('Já existe uma empresa cadastrada com o CNPJ');
  });

  it('should search and filter companies by term and status', async () => {
    await service.create({
      cnpj: '00.000.000/0001-91',
      razaoSocial: 'Banco Central do Brasil',
      ativa: true
    });

    await service.create({
      cnpj: '33.000.167/0001-01',
      razaoSocial: 'Petróleo Brasileiro SA',
      ativa: false
    });

    // Search term
    const searchResults = await service.list('Petróleo');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].razaoSocial).toBe('Petróleo Brasileiro SA');

    // Only active filter
    const activeResults = await service.list('', true);
    expect(activeResults).toHaveLength(1);
    expect(activeResults[0].razaoSocial).toBe('Banco Central do Brasil');
  });

  it('should update company details and validate new CNPJ', async () => {
    const created = await service.create({
      cnpj: '11.222.333/0001-81',
      razaoSocial: 'Nome Inicial'
    });

    const updated = await service.update(created.id, {
      razaoSocial: 'Nome Alterado'
    });
    expect(updated.razaoSocial).toBe('Nome Alterado');

    // Updating to an invalid CNPJ should throw
    await expect(
      service.update(created.id, {
        cnpj: '00000000000000'
      })
    ).rejects.toThrow('O CNPJ informado é inválido.');
  });

  it('should delete company and clear active company if deleted', async () => {
    const created = await service.create({
      cnpj: '11.222.333/0001-81',
      razaoSocial: 'Empresa Para Deletar'
    });

    await service.setActiveCompany(created.id);
    const activeBefore = await service.getActiveCompany();
    expect(activeBefore?.id).toBe(created.id);

    const deleted = await service.delete(created.id);
    expect(deleted).toBe(true);

    const fetched = await service.getById(created.id);
    expect(fetched).toBeNull();
  });

  it('should notify subscribers when active company changes', async () => {
    const created = await service.create({
      cnpj: '11.222.333/0001-81',
      razaoSocial: 'Empresa Ativa Teste'
    });

    const listener = vi.fn();
    const unsubscribe = service.onActiveCompanyChange(listener);

    await service.setActiveCompany(created.id);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ id: created.id, razaoSocial: 'Empresa Ativa Teste' })
    );

    unsubscribe();
    await service.setActiveCompany(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
