# FiscalFlow — Plano de Implementação

## Fase 01 — Fundação do Projeto

### Objetivo
Criar a estrutura base do projeto Tauri 2 com Vite, TypeScript e Tailwind CSS.

### Escopo

1. Inicializar projeto Tauri 2 com Vite + TypeScript (vanilla, sem React/Vue)
2. Configurar Tailwind CSS
3. Instalar e configurar plugins Tauri necessários:
   - `@tauri-apps/plugin-sql` (SQLite)
   - `@tauri-apps/plugin-dialog` (file picker)
   - `@tauri-apps/plugin-fs` (leitura de arquivos)
   - `@tauri-apps/plugin-clipboard-manager` (copiar texto)
   - `@tauri-apps/plugin-shell` (abrir arquivos)
4. Configurar `capabilities/default.json` com permissões
5. Configurar `tsconfig.json` com strict mode
6. Configurar Vitest para testes
7. Criar scripts npm: `dev`, `build`, `test`, `typecheck`, `lint`
8. Criar `index.html` com placeholder
9. Criar `main.ts` com inicialização básica
10. Verificar que `npm run tauri dev` funciona

### Arquivos Esperados

```
FiscalFlow/
├── src/
│   ├── main.ts
│   └── index.css
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── capabilities/
│   │   └── default.json
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── vitest.config.ts
```

### Critérios de Aceite

- [ ] `npm install` executa sem erros
- [ ] `npm run tauri dev` abre a janela da aplicação
- [ ] TypeScript strict mode ativado
- [ ] Tailwind CSS funcional
- [ ] Vitest configurado e executável
- [ ] Plugins Tauri instalados (Rust crates + npm packages)
- [ ] Capabilities configuradas

### Riscos

- Versão do Rust não compatível → verificar `rustup update`
- Dependências do Tauri no Windows (WebView2) → normalmente já instalado no Windows 10+

---

## Fase 02 — Banco de Dados e Migrações

### Objetivo
Estabelecer conexão SQLite, criar schema inicial e implementar o sistema de migrações.

### Escopo

1. Criar `src/database/connection.ts` — inicialização do banco SQLite
2. Criar `src/database/migrations/001_initial.ts` — SQL do schema inicial
3. Criar `src/database/migrator.ts` — executor de migrações
4. Criar `src/database/repositories/company.repository.ts` — CRUD base
5. Criar `src/database/repositories/document.repository.ts` — CRUD base
6. Testar criação do banco e execução das migrações

### Critérios de Aceite

- [ ] Banco SQLite criado no `app_data_dir`
- [ ] Todas as tabelas criadas conforme `DATABASE_SCHEMA.md`
- [ ] Migrações registradas na tabela `schema_migrations`
- [ ] Repositories básicos funcionais (insert, select)
- [ ] Testes unitários para migrator

---

## Fase 03 — Design System e Layout

### Objetivo
Implementar o design system CSS e o layout principal da aplicação.

### Escopo

1. Implementar design tokens em `src/index.css` (cores, tipografia, espaçamento)
2. Criar componentes CSS para: botões, inputs, tabelas, badges, cards, modais
3. Implementar layout principal: sidebar, header, content area, status bar
4. Implementar router SPA hash-based (`src/router/`)
5. Criar páginas vazias (placeholder) para cada rota
6. Implementar navegação entre páginas via sidebar
7. Implementar tema dark/light toggle (CSS custom properties)
8. Adicionar fonte Inter (Google Fonts ou local)

### Critérios de Aceite

- [ ] Layout renderiza corretamente
- [ ] Sidebar com links funcionais
- [ ] Navegação entre páginas funcional
- [ ] Design tokens aplicados consistentemente
- [ ] Dark mode como padrão
- [ ] Responsivo (redimensionar janela não quebra layout)
- [ ] Fonte Inter carregada

---

## Fase 04 — Gestão de Empresas

### Objetivo
Implementar CRUD completo de empresas.

### Escopo

1. `src/pages/companies/` — página de listagem + formulário
2. `src/services/company.service.ts` — lógica de negócio
3. Formulário de cadastro (CNPJ, razão social, etc.)
4. Validação de CNPJ
5. Listagem com pesquisa
6. Edição inline ou modal
7. Exclusão com confirmação
8. Empresa ativa exibida na status bar
9. Testes para company.service e company.repository

### Critérios de Aceite

- [ ] Cadastrar empresa com dados válidos
- [ ] Rejeitar CNPJ inválido
- [ ] Rejeitar CNPJ duplicado
- [ ] Listar empresas
- [ ] Pesquisar por CNPJ ou razão social
- [ ] Editar dados
- [ ] Excluir empresa (com confirmação)
- [ ] Empresa ativa selecionável
- [ ] Dados persistem após reload

---

## Fase 05 — Infraestrutura de Importação

### Objetivo
Criar o pipeline genérico de importação de documentos fiscais.

### Escopo

1. `src/services/import.service.ts` — orquestração de importação
2. `src/domain/parsers/detector.ts` — detecção de tipo de documento pelo conteúdo
3. File picker integrado com Tauri plugin-dialog
4. Drag and drop zone
5. Cálculo de hash SHA-256
6. Pipeline: ler arquivo → detectar tipo → delegar ao parser → validar → persistir
7. Tela de importação (`src/pages/import/`)
8. Barra de progresso
9. Relatório pós-importação
10. Testes para detector e pipeline

### Critérios de Aceite

- [ ] File picker funcional (selecionar .xml e .txt)
- [ ] Drag and drop funcional
- [ ] Detecção automática de tipo de documento
- [ ] Hash SHA-256 calculado para cada arquivo
- [ ] Progresso exibido durante importação
- [ ] Relatório final com contagem (importados/rejeitados/erros)
- [ ] Arquivos inválidos rejeitados com mensagem clara
- [ ] Pipeline preparado para receber parsers específicos

---

## Fase 06 — NF-e

### Objetivo
Implementar parser, importação, visualização e busca de NF-e.

### Sub-fases

#### 06.1 — Parser NF-e
- `src/domain/parsers/nfe.parser.ts`
- Extração de todos os campos conforme `FISCAL_DOCUMENTS.md`
- Suporte a `<nfeProc>` e `<NFe>` como raiz

#### 06.2 — Fixtures
- Criar XMLs de teste em `tests/fixtures/`
- NF-e completa, mínima, cancelada, múltiplos itens

#### 06.3 — Integração com Importação
- Conectar parser ao pipeline de importação
- Persistência no banco (fiscal_documents + document_items)
- Rejeição de duplicados

#### 06.4 — Listagem
- `src/pages/documents/` — listagem paginada
- Colunas: número, série, emitente, destinatário, valor, data, situação
- Filtros: tipo, período, empresa, situação
- Busca por chave de acesso, CNPJ, número

#### 06.5 — Detalhes
- Página/modal de detalhes do documento
- Dados do emitente, destinatário, totais, impostos
- Lista de itens
- XML original formatado
- Botão copiar chave de acesso

#### 06.6 — Validação
- Validação do dígito verificador da chave de acesso
- Validação estrutural (campos obrigatórios presentes)

#### 06.7 — Testes
- Testes unitários para parser
- Testes de integração para importação completa
- Testes de validação

### Critérios de Aceite

- [ ] Parser extrai corretamente dados de NF-e v4.00
- [ ] Importação funcional com persistência
- [ ] Duplicados rejeitados
- [ ] Listagem paginada funcional
- [ ] Filtros e busca funcionais
- [ ] Detalhes exibem todos os dados
- [ ] Itens do documento exibidos
- [ ] XML original visualizável
- [ ] Validação de chave de acesso
- [ ] Testes passando

---

## Fase 07 — NFS-e

Escopo similar à Fase 06, adaptado para NFS-e (Padrão Nacional + ABRASF).

### Critérios de Aceite
- [ ] Parser NFS-e Padrão Nacional funcional
- [ ] Parser NFS-e ABRASF funcional
- [ ] Detecção automática do padrão
- [ ] Importação, listagem e detalhes

---

## Fase 08 — CT-e

Escopo similar à Fase 06, adaptado para CT-e.

### Critérios de Aceite
- [ ] Parser CT-e funcional
- [ ] Importação, listagem e detalhes

---

## Fase 09 — SPED Fiscal

### Objetivo
Implementar parser de SPED EFD ICMS/IPI e visualização resumida.

### Critérios de Aceite
- [ ] Parser de arquivo texto posicional funcional
- [ ] Extração de registro 0000 (identificação)
- [ ] Resumo de blocos
- [ ] Importação e visualização resumida

---

## Fase 10 — Dashboard

### Critérios de Aceite
- [ ] Total de documentos por tipo
- [ ] Valor total por período
- [ ] Documentos recentes
- [ ] Estatísticas por empresa

---

## Fase 11 — Exportação

### Critérios de Aceite
- [ ] Exportação CSV da listagem
- [ ] Exportação do XML original
- [ ] Download do arquivo exportado

---

## Fase 12 — Configurações e Polish

### Critérios de Aceite
- [ ] Alternância dark/light mode
- [ ] Backup do banco de dados
- [ ] Refinamento visual
- [ ] Correção de issues encontrados

---

## Fase 13 — Testes e QA Final

### Critérios de Aceite
- [ ] Cobertura de testes completa (parsers, services, repositories)
- [ ] Testes de regressão executados
- [ ] Build sem erros
- [ ] TypeCheck sem erros
- [ ] Aplicação funcional end-to-end
