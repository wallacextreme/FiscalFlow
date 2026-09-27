import { companyService } from '../services/company.service.ts';
import { importService } from '../services/import.service.ts';

const SAMPLE_NFE = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe35231011222333000181550010000001231123456788" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>12345678</cNF>
        <natOp>VENDA DE MERCADORIA</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1024</nNF>
        <dhEmi>2026-09-15T14:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>8</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>FiscalFlow 1.0</verProc>
      </ide>
      <emit>
        <CNPJ>11222333000181</CNPJ>
        <xNome>XTREME DISTRIBUIDORA DE TECNOLOGIA LTDA</xNome>
        <xFant>XTREME TECH</xFant>
        <enderEmit>
          <xLgr>AV PAULISTA</xLgr>
          <nro>1000</nro>
          <xCpl>SALA 501</xCpl>
          <xBairro>BELA VISTA</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01310100</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderEmit>
        <IE>123456789111</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>44555666000172</CNPJ>
        <xNome>BETA INDUSTRIA E COMERCIO SA</xNome>
        <enderDest>
          <xLgr>RUA DAS FLORES</xLgr>
          <nro>500</nro>
          <xBairro>CENTRO</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>987654321000</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>SRV-001</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>SERVIDOR CORPORATIVO XEON 64GB SSD NVME 2TB</xProd>
          <NCM>84715010</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>4500.0000</vUnCom>
          <vProd>9000.00</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>2.0000</qTrib>
          <vUnTrib>4500.0000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>9000.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>1620.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>9000.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>148.50</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>9000.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>684.00</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>9000.00</vBC>
          <vICMS>1620.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>9000.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>148.50</vPIS>
          <vCOFINS>684.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>9000.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

const SAMPLE_NFSE = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infNFSe Id="NFS3550308260911222333000181000000000000001">
    <nNFSe>2026045</nNFSe>
    <cVerif>X8Y9Z0W1</cVerif>
    <dhEmi>2026-09-18T10:30:00-03:00</dhEmi>
    <emit>
      <CNPJ>11222333000181</CNPJ>
      <xNome>XTREME DISTRIBUIDORA DE TECNOLOGIA LTDA</xNome>
      <IM>12345678</IM>
      <enderEmit>
        <xLgr>AV PAULISTA</xLgr>
        <nro>1000</nro>
        <xBairro>BELA VISTA</xBairro>
        <cMun>3550308</cMun>
        <xMun>SAO PAULO</xMun>
        <UF>SP</UF>
        <CEP>01310100</CEP>
      </enderEmit>
    </emit>
    <toma>
      <CNPJ>77888999000144</CNPJ>
      <xNome>DELTA LOGISTICA INTEGRADA SA</xNome>
      <enderToma>
        <xLgr>AV DAS NACOES UNIDAS</xLgr>
        <nro>14200</nro>
        <xBairro>BROOKLIN</xBairro>
        <cMun>3550308</cMun>
        <xMun>SAO PAULO</xMun>
        <UF>SP</UF>
        <CEP>04794000</CEP>
      </enderToma>
    </toma>
    <serv>
      <cServ>01.07</cServ>
      <xServ>CONSULTORIA FISCAL AVANCADA E AUDITORIA DE SISTEMAS</xServ>
    </serv>
    <valores>
      <vServ>6800.00</vServ>
      <vDescIncond>0.00</vDescIncond>
      <vDescCond>0.00</vDescCond>
      <vISSRet>0.00</vISSRet>
      <trib>
        <issqn>
          <vBC>6800.00</vBC>
          <pAliq>5.00</pAliq>
          <vISSQN>340.00</vISSQN>
        </issqn>
      </trib>
      <vLiquido>6800.00</vLiquido>
    </valores>
  </infNFSe>
</NFSe>`;

const SAMPLE_CTE = `<?xml version="1.0" encoding="UTF-8"?>
<cteProc xmlns="http://www.portalfiscal.inf.br/cte" versao="4.00">
  <CTe xmlns="http://www.portalfiscal.inf.br/cte">
    <infCte Id="CTe35260911222333000181570010000000421123456784" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cCT>12345678</cCT>
        <CFOP>5353</CFOP>
        <natOp>PRESTACAO DE SERVICO DE TRANSPORTE INTERMUNICIPAL</natOp>
        <mod>57</mod>
        <serie>1</serie>
        <nCT>42</nCT>
        <dhEmi>2026-09-20T08:15:00-03:00</dhEmi>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>4</cDV>
        <tpAmb>1</tpAmb>
        <tpCTe>0</tpCTe>
        <procEmi>0</procEmi>
        <verProc>FiscalFlow 1.0</verProc>
      </ide>
      <emit>
        <CNPJ>99888777000166</CNPJ>
        <IE>112233445566</IE>
        <xNome>EXPRESSO RAPIDO TRANSPORTE LTDA</xNome>
        <xFant>EXPRESSO CARGAS</xFant>
        <enderEmit>
          <xLgr>RODOVIA ANHANGUERA KM 18</xLgr>
          <nro>S/N</nro>
          <xBairro>DISTRITO INDUSTRIAL</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>05112000</CEP>
        </enderEmit>
      </emit>
      <rem>
        <CNPJ>11222333000181</CNPJ>
        <IE>123456789111</IE>
        <xNome>XTREME DISTRIBUIDORA DE TECNOLOGIA LTDA</xNome>
      </rem>
      <dest>
        <CNPJ>44555666000172</CNPJ>
        <IE>987654321000</IE>
        <xNome>BETA INDUSTRIA E COMERCIO SA</xNome>
      </dest>
      <vPrest>
        <vTPrest>1250.00</vTPrest>
        <vRec>1250.00</vRec>
      </vPrest>
      <imp>
        <ICMS>
          <ICMS00>
            <CST>00</CST>
            <vBC>1250.00</vBC>
            <pICMS>12.00</pICMS>
            <vICMS>150.00</vICMS>
          </ICMS00>
        </ICMS>
      </imp>
    </infCte>
  </CTe>
</cteProc>`;

/**
 * Automatically seeds sample data if no companies exist
 * (ideal for first-time visitors on GitHub Pages or portfolio demos)
 */
export async function seedDemoDataIfEmpty(): Promise<boolean> {
  try {
    const existing = await companyService.list();
    if (existing.length > 0) {
      return false;
    }

    console.info('FiscalFlow: Seeding demonstration company and sample documents...');

    // 1. Create demonstration company
    const company = await companyService.create({
      cnpj: '11.222.333/0001-81',
      razaoSocial: 'Xtreme Distribuidora de Tecnologia Ltda',
      nomeFantasia: 'Xtreme Tech Demo',
      inscricaoEstadual: '123.456.789.111',
      inscricaoMunicipal: '12345678',
      regimeTributario: 'regime_normal',
      endereco: {
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: 'Conjunto 501',
        bairro: 'Bela Vista',
        municipio: 'São Paulo',
        uf: 'SP',
        cep: '01310-100'
      },
      ativa: true
    });

    await companyService.setActiveCompany(company.id);

    // 2. Import sample documents
    await importService.importBatch([
      { name: 'nfe_servidor_corporativo.xml', content: SAMPLE_NFE },
      { name: 'nfse_consultoria_ti.xml', content: SAMPLE_NFSE },
      { name: 'cte_transporte_cargas.xml', content: SAMPLE_CTE }
    ], company.id);

    console.info('FiscalFlow: Demo environment seeded with 3 sample documents!');
    return true;
  } catch (err) {
    console.warn('FiscalFlow: Could not seed demo data:', err);
    return false;
  }
}
