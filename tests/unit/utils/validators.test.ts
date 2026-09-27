import { describe, it, expect } from 'vitest';
import { 
  isValidCnpj, 
  formatCnpj, 
  formatCep, 
  formatCurrency, 
  cleanDigits,
  isValidCpf,
  formatCpf,
  formatCnpjOrCpf,
  calculateChaveAcessoDV,
  isValidChaveAcesso,
  parseChaveAcesso,
  formatChaveAcesso
} from '../../../src/utils/validators.ts';

describe('Validators & Formatters', () => {
  describe('isValidCnpj', () => {
    it('should validate official valid CNPJs', () => {
      // Valid sample CNPJs with real check digits
      expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
      expect(isValidCnpj('11222333000181')).toBe(true);
      expect(isValidCnpj('00.000.000/0001-91')).toBe(true); // Banco do Brasil
      expect(isValidCnpj('33.000.167/0001-01')).toBe(true); // Petrobras
      expect(isValidCnpj('60.746.948/0001-12')).toBe(true); // Bradesco
    });

    it('should reject invalid CNPJs with wrong check digits', () => {
      expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
      expect(isValidCnpj('11222333000180')).toBe(false);
      expect(isValidCnpj('12.345.678/0001-00')).toBe(false);
    });

    it('should reject CNPJs with repeated sequences', () => {
      expect(isValidCnpj('00000000000000')).toBe(false);
      expect(isValidCnpj('11111111111111')).toBe(false);
      expect(isValidCnpj('99999999999999')).toBe(false);
    });

    it('should reject CNPJs with invalid lengths', () => {
      expect(isValidCnpj('')).toBe(false);
      expect(isValidCnpj('123')).toBe(false);
      expect(isValidCnpj('1122233300018')).toBe(false); // 13 digits
      expect(isValidCnpj('112223330001811')).toBe(false); // 15 digits
    });
  });

  describe('formatCnpj', () => {
    it('should format 14-digit strings into CNPJ mask', () => {
      expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
      expect(formatCnpj('00000000000191')).toBe('00.000.000/0001-91');
    });

    it('should return input as-is if length is not 14', () => {
      expect(formatCnpj('123')).toBe('123');
    });
  });

  describe('formatCep', () => {
    it('should format 8-digit strings into CEP mask', () => {
      expect(formatCep('01310100')).toBe('01310-100');
    });

    it('should return input as-is if length is not 8', () => {
      expect(formatCep('123')).toBe('123');
    });
  });

  describe('cleanDigits', () => {
    it('should strip all non-numeric characters', () => {
      expect(cleanDigits('11.222.333/0001-81')).toBe('11222333000181');
      expect(cleanDigits('ABC 123 - XYZ 456')).toBe('123456');
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers to BRL currency string', () => {
      const formatted = formatCurrency(1500.50);
      expect(formatted).toContain('1.500,50');
      expect(formatted).toContain('R$');
    });
  });

  describe('isValidCpf', () => {
    it('should validate valid CPFs', () => {
      // Known valid CPFs for testing
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });

    it('should reject invalid CPFs', () => {
      expect(isValidCpf('52998224726')).toBe(false);
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('00000000000')).toBe(false);
      expect(isValidCpf('')).toBe(false);
      expect(isValidCpf('123')).toBe(false);
    });
  });

  describe('formatCpf', () => {
    it('should format 11-digit strings into CPF mask', () => {
      expect(formatCpf('52998224725')).toBe('529.982.247-25');
    });

    it('should return input as-is if length is not 11', () => {
      expect(formatCpf('12345')).toBe('12345');
    });
  });

  describe('formatCnpjOrCpf', () => {
    it('should format CNPJ if 14 digits and CPF if 11 digits', () => {
      expect(formatCnpjOrCpf('11222333000181')).toBe('11.222.333/0001-81');
      expect(formatCnpjOrCpf('52998224725')).toBe('529.982.247-25');
      expect(formatCnpjOrCpf('123')).toBe('123');
    });
  });

  describe('Chave de Acesso (NF-e, NFC-e, CT-e)', () => {
    const validChave = '35231011222333000181550010000001231123456788';
    const invalidChave = '35231011222333000181550010000001231123456780';

    it('should calculate correct Modulo 11 check digit', () => {
      const chave43 = validChave.substring(0, 43);
      expect(calculateChaveAcessoDV(chave43)).toBe(8);
    });

    it('should validate valid access keys', () => {
      expect(isValidChaveAcesso(validChave)).toBe(true);
      expect(isValidChaveAcesso(formatChaveAcesso(validChave))).toBe(true);
    });

    it('should reject invalid access keys', () => {
      expect(isValidChaveAcesso(invalidChave)).toBe(false);
      expect(isValidChaveAcesso('')).toBe(false);
      expect(isValidChaveAcesso('12345')).toBe(false);
    });

    it('should parse chave de acesso components', () => {
      const info = parseChaveAcesso(validChave);
      expect(info).not.toBeNull();
      if (!info) return;

      expect(info.cUF).toBe('35');
      expect(info.anoMes).toBe('2310');
      expect(info.cnpj).toBe('11222333000181');
      expect(info.modelo).toBe('55');
      expect(info.serie).toBe('001');
      expect(info.numero).toBe('000000123');
      expect(info.tipoEmissao).toBe('1');
      expect(info.codigoNumerico).toBe('12345678');
      expect(info.dv).toBe('8');
      expect(info.isValida).toBe(true);
    });

    it('should format 44-digit chave de acesso with spaces every 4 digits', () => {
      expect(formatChaveAcesso(validChave)).toBe(
        '3523 1011 2223 3300 0181 5500 1000 0001 2311 2345 6788'
      );
    });
  });
});
