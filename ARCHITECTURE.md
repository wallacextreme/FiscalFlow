# FiscalFlow — Arquitetura

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Runtime Desktop** | Tauri 2 | Binário leve, seguro, acesso nativo ao SO |
| **Frontend** | HTML + TypeScript | Tipagem estática, produtividade |
| **Estilo** | Tailwind CSS (local) | Utilitários CSS, design system consistente |
| **Banco de dados** | SQLite (via tauri-plugin-sql) | Local, leve, relacional, transacional |
| **Backend nativo** | Rust (via Tauri commands) | Para operações intensivas (parsing XML grande, hash, etc.) |
| **Build/Bundle** | Vite | Build rápido, HMR, TypeScript nativo |

## Organização do Projeto

```
FiscalFlow/
├── src/                          # Frontend (TypeScript + HTML)
│   ├── assets/                   # Ícones, fontes, imagens
│   ├── components/               # Componentes UI reutilizáveis
│   │   ├── common/               # Botões, inputs, modais, etc.
│   │   ├── layout/               # Sidebar, header, content area
│   │   └── documents/            # Componentes específicos de documentos
│   ├── domain/                   # Lógica de domínio (sem dependência de UI)
│   │   ├── models/               # Interfaces/types dos documentos fiscais
│   │   ├── parsers/              # Parsers de XML (NF-e, NFS-e, CT-e)
│   │   ├── validators/           # Validadores de documentos
│   │   └── formatters/           # Formatação de dados (moeda, CNPJ, etc.)
│   ├── services/                 # Camada de serviço (orquestração)
│   │   ├── import.service.ts     # Serviço de importação
│   │   ├── document.service.ts   # CRUD de documentos
│   │   ├── company.service.ts    # CRUD de empresas
│   │   ├── search.service.ts     # Pesquisa e filtros
│   │   └── export.service.ts     # Exportação
│   ├── database/                 # Camada de persistência
│   │   ├── connection.ts         # Conexão SQLite
│   │   ├── migrations/           # Scripts de migração
│   │   └── repositories/         # Repositories (acesso a dados)
│   ├── pages/                    # Páginas/Views da aplicação
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── companies/
│   │   ├── import/
│   │   └── settings/
│   ├── router/                   # Roteamento SPA (client-side)
│   ├── store/                    # Estado global da aplicação
│   ├── utils/                    # Utilitários genéricos
│   ├── main.ts                   # Entry point
│   └── index.css                 # Estilos globais + Tailwind
├── src-tauri/                    # Backend Rust (Tauri)
│   ├── src/
│   │   ├── main.rs               # Entry point Tauri
│   │   ├── lib.rs                # Biblioteca principal
│   │   └── commands/             # Tauri commands (Rust → Frontend)
│   ├── capabilities/             # Permissões Tauri
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/                         # Documentação do projeto
│   ├── adr/                      # Architecture Decision Records
│   ├── specifications/           # Especificações técnicas
│   └── schemas/                  # Schemas XSD de referência
├── tests/                        # Testes
│   ├── unit/                     # Testes unitários
│   ├── integration/              # Testes de integração
│   └── fixtures/                 # Arquivos de teste (XMLs de exemplo)
├── reports/                      # Relatórios de cada fase
├── index.html                    # HTML principal (Vite entry)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Camadas da Aplicação

```
┌─────────────────────────────────────────────────┐
│                    UI / Pages                    │
│         (HTML + TypeScript + Tailwind)           │
├─────────────────────────────────────────────────┤
│                   Components                     │
│          (Componentes reutilizáveis)             │
├─────────────────────────────────────────────────┤
│                    Services                      │
│        (Orquestração de operações)               │
├──────────────┬──────────────┬───────────────────┤
│   Domain     │  Validators  │    Formatters     │
│   Models     │              │                   │
├──────────────┴──────────────┴───────────────────┤
│               Parsers (XML → Model)              │
├─────────────────────────────────────────────────┤
│              Database / Repositories             │
│                   (SQLite)                       │
├─────────────────────────────────────────────────┤
│             Tauri (Runtime + IPC)                 │
│           Rust Commands (quando necessário)       │
└─────────────────────────────────────────────────┘
```

## Fluxo de Dados Principal

### Importação

```
Usuário seleciona arquivo(s) XML
         ↓
    File Dialog (Tauri plugin-dialog)
         ↓
    Leitura do arquivo (Tauri plugin-fs)
         ↓
    Detecção do tipo de documento (tag raiz do XML)
         ↓
    Parser específico (NF-e, NFS-e, CT-e)
         ↓
    Validação estrutural
         ↓
    Verificação de duplicidade (chave de acesso)
         ↓
    Cálculo do hash SHA-256
         ↓
    Persistência no SQLite (XML original + dados parseados)
         ↓
    Feedback ao usuário (sucesso/erro/duplicado)
```

### Consulta

```
Usuário aplica filtros / pesquisa
         ↓
    Search Service monta query
         ↓
    Repository executa no SQLite
         ↓
    Resultados retornam como models
         ↓
    Components renderizam a listagem
         ↓
    Usuário seleciona um documento
         ↓
    Detalhes completos são exibidos
```

## Decisões Arquiteturais

### DA-01: Vanilla TypeScript (sem framework UI)

**Decisão**: Não utilizar React, Vue, Svelte ou outro framework UI.

**Justificativa**: 
- Reduz complexidade e dependências
- Tauri 2 funciona perfeitamente com vanilla TS
- A aplicação tem uma quantidade gerenciável de views
- Melhor performance e menor bundle size
- Maior controle sobre o DOM

**Trade-off**: Mais código boilerplate para gerenciamento de estado e routing.

### DA-02: SQLite via tauri-plugin-sql

**Decisão**: Usar o plugin oficial de SQL do Tauri no frontend.

**Justificativa**:
- API simples e direta
- Suportado oficialmente pelo time Tauri
- Suficiente para operações CRUD e buscas
- Migrações manuais controladas pela aplicação

### DA-03: Parsers no Frontend (TypeScript)

**Decisão**: Parsers de XML executados no frontend em TypeScript.

**Justificativa**:
- DOMParser disponível nativamente no WebView
- XMLs fiscais são relativamente pequenos (< 1MB tipicamente)
- Evita complexidade de IPC para cada parsing
- Se performance for problema, migrar parser específico para Rust via Tauri command

### DA-04: Roteamento Client-Side Simples

**Decisão**: Router SPA customizado (hash-based).

**Justificativa**:
- Poucas rotas (dashboard, documentos, empresas, importação, configurações)
- Não justifica biblioteca de routing
- Hash-based funciona sem servidor

## Segurança

- Todos os dados permanecem locais (SQLite no app_data_dir)
- XMLs originais armazenados com hash SHA-256
- Permissões Tauri granulares (apenas plugins necessários)
- Nenhuma comunicação de rede (exceto eventual check de atualizações futuro)
- Validação de input em todas as entradas do usuário
- Sanitização de conteúdo XML antes de renderização no DOM
