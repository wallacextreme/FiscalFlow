import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SpedParser } from '../../../src/domain/parsers/sped.parser.ts';

describe('SpedParser', () => {
  const parser = new SpedParser();
  const fixturesDir = path.resolve(__dirname, '../../fixtures/sped');

  describe('parse - sped_fiscal_completo.txt', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'sped_fiscal_completo.txt'), 'utf-8');

    it('should extract Registro 0000 header and company info', async () => {
      const result = await parser.parse(content, 'comp-sped-1', 'hash-sped-full');
      const file = result.spedFile;

      expect(file.companyId).toBe('comp-sped-1');
      expect(file.tipo).toBe('efd_icms_ipi');
      expect(file.versaoLayout).toBe('018');
      expect(file.finalidade).toBe('original');
      expect(file.dataInicio).toBe('2024-01-01');
      expect(file.dataFim).toBe('2024-01-31');
      expect(file.periodo).toBe('202401');
      expect(file.cnpj).toBe('11222333000181');
      expect(file.razaoSocial).toBe('ALPHA COMERCIO DE ELETRONICOS LTDA');
      expect(file.inscricaoEstadual).toBe('123456789111');
      expect(file.totalRegistros).toBeGreaterThan(30);
    });

    it('should calculate block statistics and register counts', async () => {
      const result = await parser.parse(content, 'comp-sped-1', 'hash-sped-full');
      const summary = result.summary;

      // Check blocks exist
      expect(summary.blocos['0']).toBeDefined();
      expect(summary.blocos['C']).toBeDefined();
      expect(summary.blocos['D']).toBeDefined();
      expect(summary.blocos['E']).toBeDefined();
      expect(summary.blocos['9']).toBeDefined();

      expect(summary.blocos['C'].totalRegistros).toBe(6);
    });

    it('should extract C100 fiscal documents and E110 ICMS calculation', async () => {
      const result = await parser.parse(content, 'comp-sped-1', 'hash-sped-full');
      const summary = result.summary;

      // C100
      expect(summary.documentosC100.total).toBe(1);
      expect(summary.documentosC100.valorTotal).toBe(10050.00);
      expect(summary.documentosC100.valorIcms).toBe(1728.00);

      // E110
      expect(summary.apuracaoIcms).toBeDefined();
      expect(summary.apuracaoIcms?.debitos).toBe(1728.00);
      expect(summary.apuracaoIcms?.creditos).toBe(500.00);
      expect(summary.apuracaoIcms?.saldoDevedor).toBe(1228.00);

      // Contador
      expect(summary.contador).toBeDefined();
      expect(summary.contador?.nome).toBe('CONTADOR RESPONSAVEL');
      expect(summary.contador?.crc).toBe('SP-123456');
    });
  });

  describe('parse - sped_fiscal_minimo.txt', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'sped_fiscal_minimo.txt'), 'utf-8');

    it('should parse minimal SPED file', async () => {
      const result = await parser.parse(content, 'comp-sped-1', 'hash-sped-min');
      expect(result.spedFile.versaoLayout).toBe('019');
      expect(result.spedFile.dataInicio).toBe('2024-02-01');
      expect(result.spedFile.dataFim).toBe('2024-02-29');
      expect(result.spedFile.periodo).toBe('202402');
      expect(result.summary.documentosC100.total).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw error for empty content', async () => {
      await expect(parser.parse('', 'comp-1', 'hash')).rejects.toThrow('Arquivo SPED está vazio');
    });

    it('should throw error when Registro 0000 is missing', async () => {
      const invalidContent = '|C001|0|\n|C990|2|\n|9999|3|';
      await expect(parser.parse(invalidContent, 'comp-1', 'hash')).rejects.toThrow('Registro 0000');
    });
  });
});
