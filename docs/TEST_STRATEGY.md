# FiscalFlow — Estratégia de Testes

## Tipos de Testes

### Testes Unitários

**Ferramenta**: Vitest

**Cobertura mínima**: Parsers, validators, formatters, repositories.

| Módulo | O que testar |
|---|---|
| `parsers/nfe.parser.ts` | Parsing de XML NF-e com dados reais, campos opcionais, XMLs malformados |
| `parsers/nfse.parser.ts` | Parsing de NFS-e Padrão Nacional e ABRASF |
| `parsers/cte.parser.ts` | Parsing de CT-e |
| `parsers/sped.parser.ts` | Parsing de SPED (linhas posicionais) |
| `parsers/detector.ts` | Detecção automática de tipo de documento |
| `validators/xml.validator.ts` | Validação estrutural de XMLs |
| `validators/chave-acesso.ts` | Validação de dígito verificador |
| `formatters/currency.ts` | Formatação de moeda |
| `formatters/cnpj.ts` | Formatação/validação de CNPJ/CPF |
| `formatters/date.ts` | Formatação de datas |
| `domain/models/*` | Type guards, construtores |

### Testes de Integração

**Cobertura**: Services + Repositories + SQLite.

| Cenário | O que testar |
|---|---|
| Importar NF-e | Parsing + validação + inserção no banco + verificação |
| Importar duplicado | Rejeição de XML com mesma chave de acesso |
| Busca por CNPJ | Service → Repository → SQLite → resultado |
| CRUD de empresa | Criar, listar, editar, excluir |
| Paginação | Offset/limit corretos |
| Filtros combinados | Tipo + data + empresa |

### Testes de Fixtures

Manter XMLs de exemplo em `tests/fixtures/`:

| Fixture | Descrição |
|---|---|
| `nfe_completa.xml` | NF-e v4.00 completa com todos os campos |
| `nfe_minima.xml` | NF-e v4.00 apenas com campos obrigatórios |
| `nfe_cancelada.xml` | NF-e cancelada (evento de cancelamento) |
| `nfe_multiplos_itens.xml` | NF-e com muitos itens |
| `nfse_padrao_nacional.xml` | NFS-e Padrão Nacional |
| `nfse_abrasf.xml` | NFS-e ABRASF 2.04 |
| `cte_completo.xml` | CT-e completo |
| `sped_efd.txt` | SPED EFD ICMS/IPI |
| `xml_invalido.xml` | XML malformado |
| `xml_nao_fiscal.xml` | XML válido mas não fiscal |

### Testes Manuais / Visuais

Para cada tela da aplicação:

1. Verificar renderização correta
2. Verificar responsividade (redimensionar janela)
3. Verificar estados vazios
4. Verificar loading states
5. Verificar estados de erro
6. Verificar interações (cliques, formulários)
7. Screenshots para documentação

## Execução

```bash
# Testes unitários
npm run test

# Testes com cobertura
npm run test:coverage

# TypeScript check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```

## Critérios de Qualidade

- ✅ Zero erros TypeScript (`tsc --noEmit`)
- ✅ Testes unitários passando
- ✅ Testes de integração passando
- ✅ Build sem erros
- ✅ Sem console.error no runtime
- ✅ Sem warnings relevantes no build

## Fixtures vs Mocks

- **Fixtures**: Arquivos XML/TXT reais usados para testes de parser
- **Mocks**: Proibidos como substitutos de implementação real
- **Test doubles**: Permitidos apenas para isolar dependências externas (ex: SQLite em testes unitários puros)
