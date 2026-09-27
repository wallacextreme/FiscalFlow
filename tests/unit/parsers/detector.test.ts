import { describe, it, expect } from 'vitest';
import { DocumentDetector } from '../../../src/domain/parsers/detector.ts';

describe('DocumentDetector', () => {
  it('should detect NF-e (Modelo 55)', () => {
    const nfeXml = `<?xml version="1.0" encoding="UTF-8"?>
      <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <NFe><infNFe Id="NFe35240111222333000181550010000000011000000015">
          <ide><mod>55</mod><nNF>1</nNF></ide>
        </infNFe></NFe>
      </nfeProc>`;

    const res = DocumentDetector.detect(nfeXml);
    expect(res.type).toBe('nfe');
    expect(res.subType).toBe('nfe');
    expect(res.version).toBe('4.00');
    expect(res.isXml).toBe(true);
    expect(res.confidence).toBe('high');
  });

  it('should detect NFC-e (Modelo 65)', () => {
    const nfceXml = `<?xml version="1.0" encoding="UTF-8"?>
      <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
        <NFe><infNFe Id="NFe35240111222333000181650010000000011000000015">
          <ide><mod>65</mod><nNF>1</nNF></ide>
        </infNFe></NFe>
      </nfeProc>`;

    const res = DocumentDetector.detect(nfceXml);
    expect(res.type).toBe('nfce');
    expect(res.subType).toBe('nfce');
    expect(res.isXml).toBe(true);
  });

  it('should detect CT-e (Modelo 57)', () => {
    const cteXml = `<?xml version="1.0" encoding="UTF-8"?>
      <cteProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/cte">
        <CTe><infCte Id="CTe35240111222333000181570010000000011000000015">
          <ide><nCT>1</nCT></ide>
        </infCte></CTe>
      </cteProc>`;

    const res = DocumentDetector.detect(cteXml);
    expect(res.type).toBe('cte');
    expect(res.subType).toBe('cte');
    expect(res.isXml).toBe(true);
  });

  it('should detect NFS-e Padrão Nacional', () => {
    const nfseNacional = `<?xml version="1.0" encoding="UTF-8"?>
      <NFSe xmlns="http://www.sped.fazenda.gov.br/nfse">
        <infNFSe Id="NFS35240111222333000181">
          <numero>123</numero>
        </infNFSe>
      </NFSe>`;

    const res = DocumentDetector.detect(nfseNacional);
    expect(res.type).toBe('nfse');
    expect(res.subType).toBe('nfse_nacional');
    expect(res.isXml).toBe(true);
  });

  it('should detect NFS-e Padrão ABRASF', () => {
    const nfseAbrasf = `<?xml version="1.0" encoding="UTF-8"?>
      <CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
        <Nfse>
          <InfNfse>
            <Numero>456</Numero>
          </InfNfse>
        </Nfse>
      </CompNfse>`;

    const res = DocumentDetector.detect(nfseAbrasf);
    expect(res.type).toBe('nfse');
    expect(res.subType).toBe('nfse_abrasf');
    expect(res.isXml).toBe(true);
  });

  it('should detect SPED Fiscal EFD ICMS/IPI', () => {
    const spedContent = `|0000|018|0|01012026|31012026|EMPRESA EXEMPLO LTDA|11222333000181||SP|3550308|||A|1|
|0001|0|
|9999|3|`;

    const res = DocumentDetector.detect(spedContent);
    expect(res.type).toBe('sped');
    expect(res.subType).toBe('sped_efd_icms_ipi');
    expect(res.version).toBe('018');
    expect(res.isXml).toBe(false);
  });

  it('should return unknown for empty or arbitrary files', () => {
    expect(DocumentDetector.detect('').type).toBe('unknown');
    expect(DocumentDetector.detect('Hello world, this is a plain text file').type).toBe('unknown');
    expect(DocumentDetector.detect('<html><body>Not fiscal</body></html>').type).toBe('unknown');
  });
});
