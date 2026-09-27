# FiscalFlow — Arquitetura NFS-e

## Visão Geral

O módulo NFS-e suporta dois padrões de XML:

1. **Padrão Nacional** (obrigatório a partir de 2026)
2. **ABRASF 2.04** (legado, em transição)

O parser detecta automaticamente o padrão pelo namespace do XML.

## Detecção do Padrão

| Padrão | Namespace/Indicador |
|---|---|
| Nacional | `xmlns="http://www.sped.fazenda.gov.br/nfse"` |
| ABRASF | Namespace ABRASF ou ausência do namespace Nacional |

## Padrão Nacional

### Estrutura XML Simplificada

```xml
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse">
  <infNFSe Id="NFSxxxxxxxx" versao="1.00">
    <nNFSe>...</nNFSe>           <!-- Número -->
    <CodVerif>...</CodVerif>     <!-- Código verificação -->
    <dhEmi>...</dhEmi>           <!-- Data emissão -->
    <emit>                        <!-- Prestador -->
      <CNPJ>...</CNPJ>
      <xNome>...</xNome>
      <IM>...</IM>
    </emit>
    <toma>                        <!-- Tomador -->
      <CNPJ>...</CNPJ>
      <xNome>...</xNome>
    </toma>
    <Serv>                        <!-- Serviço -->
      <cServ>...</cServ>          <!-- Código LC116 -->
      <xDescServ>...</xDescServ>  <!-- Descrição -->
      <vServ>...</vServ>          <!-- Valor -->
    </Serv>
    <valores>
      <vNFSe>...</vNFSe>          <!-- Valor total -->
      <vISS>...</vISS>
      <vIR>...</vIR>
    </valores>
  </infNFSe>
</NFSe>
```

## ABRASF 2.04

### Estrutura XML Simplificada

```xml
<CompNfse>
  <Nfse>
    <InfNfse>
      <Numero>...</Numero>
      <CodigoVerificacao>...</CodigoVerificacao>
      <DataEmissao>...</DataEmissao>
      <PrestadorServico>
        <IdentificacaoPrestador>
          <CpfCnpj><Cnpj>...</Cnpj></CpfCnpj>
        </IdentificacaoPrestador>
        <RazaoSocial>...</RazaoSocial>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador>
          <CpfCnpj><Cnpj>...</Cnpj></CpfCnpj>
        </IdentificacaoTomador>
        <RazaoSocial>...</RazaoSocial>
      </TomadorServico>
      <Servico>
        <ItemListaServico>...</ItemListaServico>
        <Discriminacao>...</Discriminacao>
        <Valores>
          <ValorServicos>...</ValorServicos>
          <ValorIss>...</ValorIss>
          <Aliquota>...</Aliquota>
        </Valores>
      </Servico>
      <ValoresNfse>
        <ValorLiquidoNfse>...</ValorLiquidoNfse>
      </ValoresNfse>
    </InfNfse>
  </Nfse>
</CompNfse>
```

## Mapeamento para Model

Ambos os padrões mapeiam para o mesmo `FiscalDocument`:

| Campo Model | Nacional | ABRASF |
|---|---|---|
| tipo | `'nfse'` | `'nfse'` |
| numero | `nNFSe` | `Numero` |
| dataEmissao | `dhEmi` | `DataEmissao` |
| emitenteCnpjCpf | `emit/CNPJ` | `PrestadorServico/.../Cnpj` |
| emitenteRazaoSocial | `emit/xNome` | `PrestadorServico/RazaoSocial` |
| destinatarioCnpjCpf | `toma/CNPJ` | `TomadorServico/.../Cnpj` |
| destinatarioRazaoSocial | `toma/xNome` | `TomadorServico/RazaoSocial` |
| valorTotal | `valores/vNFSe` | `ValoresNfse/ValorLiquidoNfse` |
| valorISS | `valores/vISS` | `Servico/Valores/ValorIss` |

## Observações

- NFS-e **não possui chave de acesso** no formato de 44 dígitos como a NF-e
- A duplicidade é verificada por: empresa + número + CNPJ prestador
- O XML original é armazenado integralmente
- Situações: depende do padrão/município (simplificar para autorizada/cancelada)
