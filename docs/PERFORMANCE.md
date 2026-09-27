# FiscalFlow — Performance

## Metas de Desempenho

| Operação | Meta | Medição |
|---|---|---|
| Início da aplicação | < 3s | Do clique até UI interativa |
| Importação de 1 XML | < 500ms | Parsing + validação + inserção |
| Importação de 100 XMLs | < 30s | Lote completo |
| Listagem paginada (50 itens) | < 500ms | Query + renderização |
| Pesquisa por texto | < 1s | Query + renderização |
| Troca de página/rota | < 200ms | Navegação interna |
| Abertura de detalhes | < 300ms | Carregar dados + renderizar |

## Estratégias

### Paginação

Todas as listagens devem usar paginação no banco:

```sql
SELECT * FROM fiscal_documents 
WHERE company_id = ? 
ORDER BY data_emissao DESC 
LIMIT ? OFFSET ?
```

Nunca carregar todos os documentos de uma vez.

### Importação em Lote

Importação de múltiplos arquivos deve usar transação única:

```typescript
await db.execute('BEGIN TRANSACTION');
try {
  for (const file of files) {
    // parse, validate, insert
  }
  await db.execute('COMMIT');
} catch (error) {
  await db.execute('ROLLBACK');
  throw error;
}
```

### Índices

Os índices definidos em `DATABASE_SCHEMA.md` cobrem as queries mais frequentes:
- Busca por chave de acesso
- Filtro por tipo de documento
- Filtro por data de emissão
- Busca por CNPJ (emitente/destinatário)
- Filtro por situação

### Renderização

- Usar `document.createDocumentFragment()` para inserção em lote de elementos DOM
- Evitar re-renderização completa — atualizar apenas o necessário
- Tabelas com muitos registros: renderizar apenas a página atual

### XML Parsing

- Para arquivos até ~1MB: DOMParser no frontend (aceitável)
- Para arquivos maiores (SPED): processar com streaming se necessário
- Se performance de parsing se tornar problema: migrar parser para Rust command

## Anti-patterns a Evitar

1. ❌ `SELECT * FROM fiscal_documents` sem LIMIT
2. ❌ Parsing de todos os XMLs armazenados para gerar uma listagem
3. ❌ Re-parsing do XML toda vez que o usuário abre um documento
4. ❌ Listeners DOM duplicados após navegação
5. ❌ Recarregamento de dados que já estão em memória
6. ❌ Queries sem WHERE em tabelas grandes
