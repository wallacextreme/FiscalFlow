# FiscalFlow — Documentos Fiscais

## Tipos de Documentos Suportados

### NF-e — Nota Fiscal Eletrônica (Modelo 55)

**Versão suportada**: 4.00

**Fonte oficial**: Portal Nacional NF-e (https://www.nfe.fazenda.gov.br/)

**Estrutura XML**:
- Tag raiz: `<nfeProc>` (nota com protocolo de autorização) ou `<NFe>` (nota sem protocolo)
- Namespace: `http://www.portalfiscal.inf.br/nfe`

**Grupos principais para extração**:

| Grupo | Tag | Dados |
|---|---|---|
| Identificação | `ide` | Número, série, data emissão, natureza operação, tipo (entrada/saída) |
| Emitente | `emit` | CNPJ, razão social, IE, endereço, CRT |
| Destinatário | `dest` | CNPJ/CPF, razão social, IE, endereço |
| Produtos | `det` | Lista de itens (produto, imposto) |
| Produto | `prod` | Código, descrição, NCM, CFOP, unidade, quantidade, valor |
| ICMS | `ICMS` | CST/CSOSN, base cálculo, alíquota, valor |
| IPI | `IPI` | CST, base cálculo, alíquota, valor |
| PIS | `PIS` | CST, base cálculo, alíquota, valor |
| COFINS | `COFINS` | CST, base cálculo, alíquota, valor |
| Totais | `ICMSTot` | Total produtos, ICMS, IPI, PIS, COFINS, valor nota |
| Transporte | `transp` | Modalidade frete, transportador |
| Cobrança | `cobr` | Fatura, duplicatas |
| Info. Complementar | `infAdic` | Informações adicionais |
| Protocolo | `protNFe` | Protocolo de autorização, data, status |

**Chave de acesso**: 44 dígitos, composição:
```
cUF (2) + AAMM (4) + CNPJ (14) + mod (2) + serie (3) + nNF (9) + tpEmis (1) + cNF (8) + cDV (1)
```

**Situações possíveis**:
- Autorizada (cStat = 100)
- Cancelada (evento de cancelamento)
- Inutilizada (inutNFe)
- Denegada (cStat = 110, 301, 302)

---

### NFS-e — Nota Fiscal de Serviço Eletrônica

#### Padrão Nacional (a partir de 2026)

**Fonte oficial**: Portal NFS-e Nacional (https://www.gov.br/nfse/)

**Estrutura XML**:
- Namespace: `http://www.sped.fazenda.gov.br/nfse`
- Tag identificadora: `infNFSe` com atributo `Id` iniciando com "NFS"

**Dados principais**:

| Campo | Descrição |
|---|---|
| Número | Número da NFS-e |
| Código verificação | Código de verificação da nota |
| Data emissão | Data/hora de emissão |
| Prestador | CNPJ, razão social, inscrição municipal |
| Tomador | CNPJ/CPF, razão social |
| Serviço | Código LC116, descrição, valor |
| ISS | Base cálculo, alíquota, valor |
| Valor total | Valor total da nota |

#### ABRASF 2.04 (legado, em transição)

**Estrutura XML**:
- Tag raiz: `<CompNfse>` com namespace ABRASF
- Modelo 2.04

**Dados principais**: Similares ao Padrão Nacional, com tags diferentes.

> **IMPORTANTE**: O parser deve detectar automaticamente se o XML é Padrão Nacional ou ABRASF baseado no namespace.

---

### CT-e — Conhecimento de Transporte Eletrônico (Modelo 57)

**Versão suportada**: 4.00

**Fonte oficial**: Portal Nacional CT-e (https://www.cte.fazenda.gov.br/)

**Estrutura XML**:
- Tag raiz: `<cteProc>` ou `<CTe>`
- Namespace: `http://www.portalfiscal.inf.br/cte`

**Dados principais**:

| Grupo | Tag | Dados |
|---|---|---|
| Identificação | `ide` | Número, série, data emissão, modal, tipo serviço |
| Emitente | `emit` | CNPJ, razão social, IE |
| Remetente | `rem` | CNPJ/CPF, razão social |
| Destinatário | `dest` | CNPJ/CPF, razão social |
| Valores | `vPrest` | Valor total prestação, componentes de valor |
| Impostos | `imp` | ICMS, valor |
| Info. Carga | `infCarga` | Valor carga, peso |

---

### SPED Fiscal — EFD ICMS/IPI

**Versão suportada**: Leiaute 018/019

**Fonte oficial**: Portal SPED (https://www.gov.br/sped/)

**Formato**: Texto posicional (não XML), delimitado por pipe (`|`)

**Estrutura de blocos**:

| Bloco | Conteúdo |
|---|---|
| 0 | Abertura, identificação, referências |
| C | Documentos fiscais mercadorias (NF-e) |
| D | Documentos fiscais serviços |
| E | Apuração ICMS e IPI |
| G | CIAP |
| H | Inventário |
| K | Produção e estoque |
| 1 | Outras informações |
| 9 | Encerramento |

**Registro principal**: `0000` (abertura do arquivo)
```
|0000|versao_layout|tipo_escrituracao|dt_ini|dt_fin|razao_social|cnpj|...
```

> **IMPORTANTE**: O parser SPED é fundamentalmente diferente dos parsers XML. Ele lê arquivo texto linha a linha, identifica o registro pelo identificador e extrai campos por posição.

---

## Regras Gerais de Parsing

1. **NUNCA modificar o XML/texto original**
2. **NUNCA inventar campos** que não existem no documento
3. **NUNCA assumir** que um campo existe — sempre verificar presença
4. **Tratar campos opcionais** como potencialmente ausentes
5. **Preservar valores numéricos** como strings durante o parsing, converter apenas na persistência
6. **Registrar** campos não reconhecidos sem gerar erro (tolerância)
7. **Validar namespace/tag raiz** antes de tentar parsing específico
