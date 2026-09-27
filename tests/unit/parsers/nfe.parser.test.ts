import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { NfeParser } from '../../../src/domain/parsers/nfe.parser.ts';
import type { DocumentDetectionResult } from '../../../src/domain/parsers/types.ts';

describe('NfeParser', () => {
  const parser = new NfeParser();
  const fixturesDir = path.resolve(__dirname, '../../fixtures/nfe');

  describe('canParse', () => {
    it('should accept valid NF-e detections', () => {
      const detection: DocumentDetectionResult = {
        type: 'nfe',
        subType: 'nfe',
        isXml: true,
        confidence: 'high'
      };
      expect(parser.canParse(detection)).toBe(true);
    });

    it('should reject non-xml or other document types', () => {
      expect(parser.canParse({
        type: 'cte',
        subType: 'cte',
        isXml: true,
        confidence: 'high'
      })).toBe(false);

      expect(parser.canParse({
        type: 'nfe',
        subType: 'nfe',
        isXml: false,
        confidence: 'low'
      })).toBe(false);
    });
  });

  describe('parse - nfe_completa.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nfe_completa.xml'), 'utf-8');

    it('should extract document header, identification and parties', async () => {
      const result = await parser.parse(xml, 'comp-123', 'hash-abc');
      const doc = result.document;

      expect(doc.companyId).toBe('comp-123');
      expect(doc.xmlHash).toBe('hash-abc');
      expect(doc.tipo).toBe('nfe');
      expect(doc.chaveAcesso).toBe('35231011222333000181550010000001231123456788');
      expect(doc.numero).toBe('123');
      expect(doc.serie).toBe('1');
      expect(doc.naturezaOperacao).toBe('VENDA DE MERCADORIA');
      expect(doc.dataEmissao).toContain('2023-10-15');
      expect(doc.situacao).toBe('autorizada');
      expect(doc.nfeVersao).toBe('4.00');

      // Emitente
      expect(doc.emitenteCnpjCpf).toBe('11222333000181');
      expect(doc.emitenteRazaoSocial).toBe('ALPHA COMERCIO DE ELETRONICOS LTDA');
      expect(doc.emitenteUf).toBe('SP');

      // Destinatário
      expect(doc.destinatarioCnpjCpf).toBe('44555666000172');
      expect(doc.destinatarioRazaoSocial).toBe('BETA INDUSTRIA E COMERCIO SA');
      expect(doc.destinatarioUf).toBe('SP');

      // Totais
      expect(doc.valorTotal).toBe(10050.00);
      expect(doc.valorICMS).toBe(1728.00);
      expect(doc.valorIPI).toBe(450.00);
      expect(doc.valorPIS).toBe(158.40);
      expect(doc.valorCOFINS).toBe(729.60);

      expect(result.warnings.length).toBe(0);
    });

    it('should extract all item details and taxes', async () => {
      const result = await parser.parse(xml, 'comp-123', 'hash-abc');
      expect(result.items.length).toBe(2);

      const item1 = result.items[0];
      expect(item1.numeroItem).toBe(1);
      expect(item1.codigo).toBe('NOTE-001');
      expect(item1.descricao).toBe('NOTEBOOK CORPORATIVO I7 16GB 512GB SSD');
      expect(item1.ncm).toBe('84713012');
      expect(item1.cfop).toBe('5102');
      expect(item1.unidade).toBe('UN');
      expect(item1.quantidade).toBe(2);
      expect(item1.valorUnitario).toBe(4500);
      expect(item1.valorTotal).toBe(9000);
      expect(item1.cst).toBe('00');
      expect(item1.baseCalculoICMS).toBe(9000);
      expect(item1.aliquotaICMS).toBe(18);
      expect(item1.valorICMS).toBe(1620);
      expect(item1.valorIPI).toBe(450);
      expect(item1.valorPIS).toBe(148.50);
      expect(item1.valorCOFINS).toBe(684.00);

      const item2 = result.items[1];
      expect(item2.numeroItem).toBe(2);
      expect(item2.codigo).toBe('MOUSE-002');
      expect(item2.descricao).toBe('MOUSE SEM FIO OPTICO RECARREGAVEL');
      expect(item2.quantidade).toBe(5);
      expect(item2.valorUnitario).toBe(120);
      expect(item2.valorTotal).toBe(600);
      expect(item2.valorICMS).toBe(108);
      expect(item2.valorPIS).toBe(9.90);
      expect(item2.valorCOFINS).toBe(45.60);
    });
  });

  describe('parse - nfe_minima.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nfe_minima.xml'), 'utf-8');

    it('should parse standalone NFe root without protocol', async () => {
      const result = await parser.parse(xml, 'comp-123', 'hash-xyz');
      const doc = result.document;

      expect(doc.chaveAcesso).toBe('35231011222333000181550010000001241876543219');
      expect(doc.numero).toBe('124');
      expect(doc.valorTotal).toBe(29.90);
      expect(doc.destinatarioCnpjCpf).toBe('52998224725'); // CPF
      expect(doc.destinatarioRazaoSocial).toBe('CONSUMIDOR FINAL');
      expect(doc.situacao).toBe('autorizada');

      expect(result.items.length).toBe(1);
      expect(result.items[0].codigo).toBe('CABO-001');
      expect(result.items[0].cst).toBe('102'); // CSOSN 102
    });
  });

  describe('parse - nfe_cancelada.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nfe_cancelada.xml'), 'utf-8');

    it('should detect cancelada status from protNFe cStat 101', async () => {
      const result = await parser.parse(xml, 'comp-123', 'hash-canc');
      expect(result.document.situacao).toBe('cancelada');
      expect(result.document.numero).toBe('125');
    });
  });

  describe('parse - nfe_multiplos_itens.xml', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nfe_multiplos_itens.xml'), 'utf-8');

    it('should correctly parse all 5 items and header totals', async () => {
      const result = await parser.parse(xml, 'comp-123', 'hash-multi');
      expect(result.items.length).toBe(5);
      expect(result.document.valorTotal).toBe(9120.00);

      const descriptions = result.items.map(i => i.descricao);
      expect(descriptions).toEqual([
        'TECLADO MECANICO RGB',
        'MONITOR 27 POL 144HZ IPS',
        'HEADSET GAMER 7.1 SURROUND',
        'WEBCAM FULL HD 1080P COM MICROFONE',
        'CABO DE REDE CAT6 10 METROS'
      ]);
    });
  });
});
