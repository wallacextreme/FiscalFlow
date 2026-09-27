# FiscalFlow — Segurança

## Princípios

1. **Dados locais**: Todos os dados permanecem no dispositivo do usuário
2. **Sem comunicação externa**: A aplicação não faz requisições HTTP
3. **Integridade**: XMLs originais protegidos por hash SHA-256
4. **Permissões mínimas**: Apenas os plugins Tauri necessários são habilitados
5. **Sanitização**: Todo conteúdo dinâmico é sanitizado antes de renderização

## Ameaças e Mitigações

| Ameaça | Mitigação |
|---|---|
| XML malicioso (XXE, billion laughs) | DOMParser do browser é seguro contra XXE por padrão; validar tamanho máximo de arquivo |
| XSS via conteúdo do XML | Sanitizar dados do XML antes de inserir no DOM; usar `textContent` em vez de `innerHTML` |
| SQL Injection | Usar parâmetros em todas as queries SQLite (nunca concatenar strings) |
| Corrupção do banco | Transações atômicas; WAL mode; backup |
| Arquivo modificado pós-importação | Verificação de hash SHA-256 sob demanda |
| Acesso não autorizado ao banco | Arquivo SQLite protegido pelo SO (permissões do usuário) |

## Boas Práticas de Implementação

### DOM

```typescript
// ✅ CORRETO — usa textContent
element.textContent = xmlData.razaoSocial;

// ❌ ERRADO — vulnerável a XSS
element.innerHTML = xmlData.razaoSocial;
```

### SQL

```typescript
// ✅ CORRETO — parâmetros
await db.execute(
  'INSERT INTO companies (id, cnpj, razao_social) VALUES ($1, $2, $3)',
  [id, cnpj, razaoSocial]
);

// ❌ ERRADO — concatenação
await db.execute(
  `INSERT INTO companies (id, cnpj, razao_social) VALUES ('${id}', '${cnpj}', '${razaoSocial}')`
);
```

### Arquivos

- Validar tamanho máximo de arquivo antes de ler (ex: 50MB para XML, 500MB para SPED)
- Verificar extensão/conteúdo antes de processar
- Não executar conteúdo de arquivos importados
- Não seguir referências externas (DTD, XInclude, etc.)

## Permissões Tauri (Capabilities)

```json
{
  "permissions": [
    "core:default",
    "sql:default",
    "dialog:allow-open",
    "dialog:allow-message",
    "dialog:allow-ask",
    "dialog:allow-confirm",
    "fs:allow-read-text-file",
    "fs:allow-read-file",
    "clipboard-manager:allow-write-text",
    "shell:allow-open"
  ]
}
```

Permissões **NÃO incluídas** (propositalmente):
- `fs:allow-write-file` — a aplicação não escreve arquivos no filesystem (dados vão para SQLite)
- `http:*` — nenhuma comunicação de rede
- `notification:*` — desnecessário

## Certificados Digitais

Na versão 1.0, o FiscalFlow **NÃO** manipula certificados digitais (A1/A3).

Ele é um leitor/organizador de documentos fiscais, não um emissor.

Caso no futuro seja necessário suporte a certificados:
- Criar ADR específico
- Seguir SECURITY.md atualizado
- Nunca armazenar senhas em texto puro
- Nunca expor chaves privadas em logs
