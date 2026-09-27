# FiscalFlow — Matriz de Suporte a Formatos

## Versão 1.0

| Formato | Tipo | Versão | Parser | Importação | Visualização | Validação | Exportação | Fase |
|---|---|---|---|---|---|---|---|---|
| NF-e XML | XML | 4.00 | TS (DOMParser) | ✅ | ✅ | ✅ Schema | ✅ CSV/XML | Fase 06 |
| NFC-e XML | XML | 4.00 | TS (DOMParser) | ✅ | ✅ | ✅ Schema | ✅ CSV/XML | Fase 06 |
| NFS-e Padrão Nacional | XML | - | TS (DOMParser) | ✅ | ✅ | ✅ Básica | ✅ CSV/XML | Fase 07 |
| NFS-e ABRASF 2.04 | XML | 2.04 | TS (DOMParser) | ✅ | ✅ | ✅ Básica | ✅ CSV/XML | Fase 07 |
| CT-e XML | XML | 4.00 | TS (DOMParser) | ✅ | ✅ | ✅ Básica | ✅ CSV/XML | Fase 08 |
| SPED EFD ICMS/IPI | TXT | 018/019 | TS (linha a linha) | ✅ | ✅ Resumo | ❌ | ✅ CSV | Fase 09 |

## Legenda

- **✅**: Suportado
- **❌**: Não suportado nesta versão
- **Schema**: Validação contra XSD oficial
- **Básica**: Validação estrutural (campos obrigatórios, formatos)

## Detecção Automática

A detecção do tipo de documento é feita automaticamente durante a importação:

1. Verificar se é XML (inicia com `<?xml` ou `<`)
2. Se XML → identificar tag raiz e namespace
3. Se texto posicional (pipe-delimited) → verificar registro `|0000|` → SPED

## Extensões de Arquivo Aceitas

| Extensão | Tipos esperados |
|---|---|
| `.xml` | NF-e, NFC-e, NFS-e, CT-e |
| `.txt` | SPED |
| Sem extensão | Detecção pelo conteúdo |
