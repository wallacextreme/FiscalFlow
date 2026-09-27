# FiscalFlow — Arquitetura SPED

## Visão Geral

O módulo SPED suporta a leitura de arquivos da EFD ICMS/IPI (SPED Fiscal).

O formato é **texto posicional delimitado por pipe** (`|`), não XML.

## Formato do Arquivo

Cada linha é um registro, com campos separados por `|`:

```
|REGISTRO|campo1|campo2|campo3|...|
```

Exemplo:
```
|0000|019|0|01012025|31012025|EMPRESA EXEMPLO LTDA|12345678000199|SP|3550308|1234567890||55||
```

## Registros Principais para Extração

### Registro 0000 — Abertura do Arquivo

| Posição | Campo | Descrição |
|---|---|---|
| 1 | REG | "0000" |
| 2 | COD_VER | Código da versão do leiaute |
| 3 | COD_FIN | Finalidade (0=original, 1=retificadora) |
| 4 | DT_INI | Data inicial (DDMMAAAA) |
| 5 | DT_FIN | Data final (DDMMAAAA) |
| 6 | NOME | Razão social |
| 7 | CNPJ | CNPJ |
| 8 | UF | UF |
| 9 | COD_MUN | Código do município |
| 10 | IE | Inscrição estadual |

### Registro 0990 — Encerramento do Bloco 0

### Registro 9999 — Encerramento do Arquivo

| Posição | Campo | Descrição |
|---|---|---|
| 1 | REG | "9999" |
| 2 | QTD_LIN | Total de linhas do arquivo |

## Blocos e Resumo

O parser SPED extrai metadados e contabiliza registros por bloco:

```typescript
interface SpedSummary {
  // Registro 0000
  versaoLayout: string;
  finalidade: SpedFinalidade;
  dataInicio: string;
  dataFim: string;
  razaoSocial: string;
  cnpj: string;
  uf: string;
  ie: string;
  
  // Contadores
  totalRegistros: number;
  registrosPorBloco: Record<string, number>;
}
```

## Fluxo do Parser

```
Conteúdo do arquivo (string)
    ↓
Split por linhas (\n)
    ↓
Para cada linha:
    Split por | (pipe)
    Identificar registro (campo 1)
    ↓
Se registro 0000 → extrair metadados
Se registro 9999 → extrair total
Todos → contabilizar por bloco
    ↓
Retornar SpedSummary + conteúdo original
```

## Observações

- O SPED NÃO é XML — nunca usar DOMParser
- O parser deve ser tolerante a linhas malformadas
- Datas no SPED usam formato DDMMAAAA (converter para ISO)
- O conteúdo original é armazenado integralmente (pode ser grande: 10-500MB)
- Para arquivos muito grandes, considerar processamento em chunks
- A visualização no FiscalFlow é um **resumo** (não exibe todos os registros)
