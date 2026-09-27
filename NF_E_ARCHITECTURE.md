# FiscalFlow — Arquitetura NF-e

## Visão Geral

O módulo NF-e é responsável por parsear, validar, armazenar e exibir Notas Fiscais Eletrônicas no formato XML versão 4.00.

## Estrutura XML da NF-e v4.00

### Documento com protocolo (`<nfeProc>`)

```xml
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe..." versao="4.00">
      <ide>...</ide>        <!-- Identificação -->
      <emit>...</emit>      <!-- Emitente -->
      <dest>...</dest>      <!-- Destinatário -->
      <det nItem="1">       <!-- Item 1 -->
        <prod>...</prod>
        <imposto>...</imposto>
      </det>
      <total>
        <ICMSTot>...</ICMSTot>
      </total>
      <transp>...</transp>  <!-- Transporte -->
      <cobr>...</cobr>      <!-- Cobrança -->
      <infAdic>...</infAdic><!-- Info adicional -->
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <chNFe>...</chNFe>    <!-- Chave de acesso -->
      <dhRecbto>...</dhRecbto>
      <nProt>...</nProt>    <!-- Número do protocolo -->
      <cStat>100</cStat>    <!-- Status (100 = autorizada) -->
    </infProt>
  </protNFe>
</nfeProc>
```

## Fluxo do Parser

```
XML string
    ↓
DOMParser.parseFromString()
    ↓
Verificar tag raiz (nfeProc ou NFe)
    ↓
Extrair namespace
    ↓
Navegar pela árvore DOM
    ↓
Extrair campos → FiscalDocument + DocumentItem[]
```

## Mapeamento de Campos

### Identificação (`ide`)

| Tag XML | Campo Model | Tipo |
|---|---|---|
| `cUF` | (usado na chave) | string |
| `cNF` | (usado na chave) | string |
| `natOp` | naturezaOperacao | string |
| `mod` | (modelo 55 = NF-e) | string |
| `serie` | serie | string |
| `nNF` | numero | string |
| `dhEmi` | dataEmissao | string (ISO) |
| `tpNF` | (0=entrada, 1=saída) | string |
| `idDest` | (destino da operação) | string |
| `cMunFG` | (município do fato gerador) | string |
| `tpEmis` | (tipo de emissão) | string |
| `finNFe` | (finalidade) | string |

### Emitente (`emit`)

| Tag XML | Campo Model | Tipo |
|---|---|---|
| `CNPJ` | emitenteCnpjCpf | string |
| `CPF` | emitenteCnpjCpf | string |
| `xNome` | emitenteRazaoSocial | string |
| `enderEmit/UF` | emitenteUf | string |

### Destinatário (`dest`)

| Tag XML | Campo Model | Tipo |
|---|---|---|
| `CNPJ` | destinatarioCnpjCpf | string |
| `CPF` | destinatarioCnpjCpf | string |
| `xNome` | destinatarioRazaoSocial | string |
| `enderDest/UF` | destinatarioUf | string |

### Produto (`det/prod`)

| Tag XML | Campo Model | Tipo |
|---|---|---|
| `cProd` | codigo | string |
| `xProd` | descricao | string |
| `NCM` | ncm | string |
| `CFOP` | cfop | string |
| `uCom` | unidade | string |
| `qCom` | quantidade | number |
| `vUnCom` | valorUnitario | number |
| `vProd` | valorTotal | number |

### Totais (`total/ICMSTot`)

| Tag XML | Campo Model | Tipo |
|---|---|---|
| `vBC` | (base cálculo ICMS) | number |
| `vICMS` | valorICMS | number |
| `vIPI` | valorIPI | number |
| `vPIS` | valorPIS | number |
| `vCOFINS` | valorCOFINS | number |
| `vNF` | valorTotal | number |

### Protocolo (`protNFe/infProt`)

| Tag XML | Campo Model | Tipo |
|---|---|---|
| `chNFe` | chaveAcesso | string |
| `cStat` | (determina situacao) | string |

## Chave de Acesso

44 dígitos: `cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)`

### Validação do Dígito Verificador

Algoritmo: Módulo 11, pesos 2-9 (da direita para a esquerda).

```
Se resto = 0 ou 1 → DV = 0
Senão → DV = 11 - resto
```

## Situações

| cStat | Situação |
|---|---|
| 100 | Autorizada |
| 101 | Cancelamento homologado |
| 110, 301, 302 | Denegada |
| Evento cancelamento | Cancelada |
| Inutilização | Inutilizada |
| Outros/ausente | Desconhecida |
