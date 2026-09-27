import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { NfseParser } from '../../../src/domain/parsers/nfse.parser.ts';
import type { DocumentDetectionResult } from '../../../src/domain/parsers/types.ts';

describe('NfseParser', () => {
  const parser = new NfseParser();
  const fixturesDir = path.resolve(__dirname, '../../fixtures/nfse');

  describe('canParse', () => {
    it('should accept valid NFS-e detections', () => {
      const detectionNac: DocumentDetectionResult = {
        type: 'nfse',
        subType: 'nfse_nacional',
        isXml: true,
        confidence: 'high'
      };
      expect(parser.canParse(detectionNac)).toBe(true);

      const detectionAbr: DocumentDetectionResult = {
        type: 'nfse',
        subType: 'nfse_abrasf',
        isXml: true,
        confidence: 'high'
      };
      expect(parser.canParse(detectionAbr)).toBe(true);
    });

    it('should reject other formats', () => {
      expect(parser.canParse({
        type: 'nfe',
        subType: 'nfe',
        isXml: true,
        confidence: 'high'
      })).toBe(false);

      expect(parser.canParse({
        type: 'nfse',
        subType: 'nfse_nacional',
        isXml: false,
        confidence: 'low'
      })).toBe(false);
    });
  });

  describe('parse - nfse_nacional.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nfse_nacional.xml'), 'utf-8');

    it('should parse Padrão Nacional NFS-e fields correctly', async () => {
      const result = await parser.parse(xml, 'comp-100', 'hash-nacional');
      const doc = result.document;

      expect(doc.companyId).toBe('comp-100');
      expect(doc.tipo).toBe('nfse');
      expect(doc.numero).toBe('2024001');
      expect(doc.situacao).toBe('autorizada');
      expect(doc.nfeVersao).toBe('Padrão Nacional 1.00');

      // Emitente (Prestador)
      expect(doc.emitenteCnpjCpf).toBe('11222333000181');
      expect(doc.emitenteRazaoSocial).toBe('TECH CONSULTORIA EM TI LTDA');
      expect(doc.emitenteUf).toBe('SP');

      // Tomador
      expect(doc.destinatarioCnpjCpf).toBe('44555666000172');
      expect(doc.destinatarioRazaoSocial).toBe('CLIENTE CORPORATIVO SA');
      expect(doc.destinatarioUf).toBe('SP');

      // Valores & Impostos
      expect(doc.valorTotal).toBe(5000.00);
      expect(doc.valorISS).toBe(250.00);
      expect(doc.valorPIS).toBe(32.50);
      expect(doc.valorCOFINS).toBe(150.00);

      // Service item
      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.codigo).toBe('01.07');
      expect(item.descricao).toBe('SUPORTE TECNICO E DESENVOLVIMENTO DE SOFTWARE EM NUVEM');
      expect(item.valorTotal).toBe(5000.00);
      expect(item.valorPIS).toBe(32.50);
      expect(item.valorCOFINS).toBe(150.00);
    });
  });

  describe('parse - nfse_abrasf.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nfse_abrasf.xml'), 'utf-8');

    it('should parse ABRASF v2.04 fields correctly', async () => {
      const result = await parser.parse(xml, 'comp-100', 'hash-abrasf');
      const doc = result.document;

      expect(doc.companyId).toBe('comp-100');
      expect(doc.tipo).toBe('nfse');
      expect(doc.numero).toBe('12345');
      expect(doc.chaveAcesso).toBe('9F8E7D6C5B');
      expect(doc.situacao).toBe('autorizada');
      expect(doc.nfeVersao).toBe('ABRASF 2.04');

      // Prestador
      expect(doc.emitenteCnpjCpf).toBe('11222333000181');
      expect(doc.emitenteRazaoSocial).toBe('ALPHA CONSULTORIA E SERVICOS DIGITAIS LTDA');
      expect(doc.emitenteUf).toBe('SP');

      // Tomador
      expect(doc.destinatarioCnpjCpf).toBe('44555666000172');
      expect(doc.destinatarioRazaoSocial).toBe('EMPRESA PARCEIRA COMERCIAL LTDA');
      expect(doc.destinatarioUf).toBe('PR');

      // Valores & Impostos
      expect(doc.valorTotal).toBe(3500.00);
      expect(doc.valorISS).toBe(105.00);
      expect(doc.valorPIS).toBe(22.75);
      expect(doc.valorCOFINS).toBe(105.00);

      // Service item
      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.codigo).toBe('17.01');
      expect(item.descricao).toBe('ASSESSORIA TECNICA E CONSULTORIA EMPRESARIAL');
      expect(item.valorTotal).toBe(3500.00);
    });
  });

  describe('parse - nfse_abrasf_cancelada.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nfse_abrasf_cancelada.xml'), 'utf-8');

    it('should detect canceled ABRASF NFS-e with NfseCancelamento tag', async () => {
      const result = await parser.parse(xml, 'comp-100', 'hash-canc');
      expect(result.document.situacao).toBe('cancelada');
      expect(result.document.numero).toBe('99999');
      expect(result.document.valorTotal).toBe(1200.00);
      expect(result.document.valorISS).toBe(36.00);
    });
  });
});
