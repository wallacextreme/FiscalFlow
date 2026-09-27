import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CteParser } from '../../../src/domain/parsers/cte.parser.ts';
import type { DocumentDetectionResult } from '../../../src/domain/parsers/types.ts';

describe('CteParser', () => {
  const parser = new CteParser();
  const fixturesDir = path.resolve(__dirname, '../../fixtures/cte');

  describe('canParse', () => {
    it('should accept valid CT-e detections', () => {
      const detection: DocumentDetectionResult = {
        type: 'cte',
        subType: 'cte',
        isXml: true,
        confidence: 'high'
      };
      expect(parser.canParse(detection)).toBe(true);
    });

    it('should reject other formats', () => {
      expect(parser.canParse({
        type: 'nfe',
        subType: 'nfe',
        isXml: true,
        confidence: 'high'
      })).toBe(false);

      expect(parser.canParse({
        type: 'cte',
        subType: 'cte',
        isXml: false,
        confidence: 'low'
      })).toBe(false);
    });
  });

  describe('parse - cte_completo.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'cte_completo.xml'), 'utf-8');

    it('should extract CT-e document header, parties, and transport values', async () => {
      const result = await parser.parse(xml, 'comp-cte-1', 'hash-cte-full');
      const doc = result.document;

      expect(doc.companyId).toBe('comp-cte-1');
      expect(doc.tipo).toBe('cte');
      expect(doc.chaveAcesso).toBe('35240211222333000181570010000005011778899001');
      expect(doc.numero).toBe('501');
      expect(doc.serie).toBe('1');
      expect(doc.naturezaOperacao).toBe('PRESTACAO DE SERVICO DE TRANSPORTE');
      expect(doc.situacao).toBe('autorizada');
      expect(doc.nfeVersao).toBe('4.00');

      // Transportadora (Emitente)
      expect(doc.emitenteCnpjCpf).toBe('11222333000181');
      expect(doc.emitenteRazaoSocial).toBe('RAPIDO BRASIL TRANSPORTES RODOVIARIOS LTDA');
      expect(doc.emitenteUf).toBe('SP');

      // Destinatário
      expect(doc.destinatarioCnpjCpf).toBe('77888999000155');
      expect(doc.destinatarioRazaoSocial).toBe('COMERCIO CARIOCA DE ELETRONICOS LTDA');
      expect(doc.destinatarioUf).toBe('RJ');

      // Valores & Tributos
      expect(doc.valorTotal).toBe(2800.00);
      expect(doc.valorICMS).toBe(336.00);

      // Service item
      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.descricao).toContain('SAO PAULO/SP -> RIO DE JANEIRO/RJ');
      expect(item.descricao).toContain('EQUIPAMENTOS DE INFORMATICA');
      expect(item.valorTotal).toBe(2800.00);
      expect(item.baseCalculoICMS).toBe(2800.00);
      expect(item.aliquotaICMS).toBe(12.00);
      expect(item.valorICMS).toBe(336.00);
      expect(item.cst).toBe('00');
    });
  });

  describe('parse - cte_minimo.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'cte_minimo.xml'), 'utf-8');

    it('should parse standalone CTe root without protocol', async () => {
      const result = await parser.parse(xml, 'comp-cte-1', 'hash-cte-min');
      const doc = result.document;

      expect(doc.chaveAcesso).toBe('35240211222333000181570010000005021665544337');
      expect(doc.numero).toBe('502');
      expect(doc.valorTotal).toBe(450.00);
      expect(doc.situacao).toBe('autorizada');
      expect(doc.destinatarioCnpjCpf).toBe('52998224725');
    });
  });

  describe('parse - cte_cancelado.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'cte_cancelado.xml'), 'utf-8');

    it('should detect canceled status from protCTe cStat 101', async () => {
      const result = await parser.parse(xml, 'comp-cte-1', 'hash-cte-canc');
      expect(result.document.situacao).toBe('cancelada');
      expect(result.document.numero).toBe('503');
      expect(result.document.valorTotal).toBe(1500.00);
      expect(result.document.valorICMS).toBe(180.00);
    });
  });
});
