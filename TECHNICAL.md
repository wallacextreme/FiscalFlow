# FiscalFlow — Especificação Técnica

## Tecnologias e Versões

| Tecnologia | Versão | Uso |
|---|---|---|
| Tauri | 2.x (latest stable) | Runtime desktop |
| Rust | stable (latest) | Backend nativo |
| Node.js | 20+ LTS | Build tooling |
| TypeScript | 5.x | Linguagem frontend |
| Vite | 6.x | Bundler |
| Tailwind CSS | 3.x | Estilos |
| SQLite | 3.x (via plugin) | Banco de dados |

## Plugins Tauri

| Plugin | Uso |
|---|---|
| `@tauri-apps/plugin-sql` | Acesso SQLite |
| `@tauri-apps/plugin-dialog` | File picker, confirmações |
| `@tauri-apps/plugin-fs` | Leitura de arquivos |
| `@tauri-apps/plugin-shell` | Abrir arquivos externamente |
| `@tauri-apps/plugin-clipboard-manager` | Copiar chave de acesso |

## Parsing de XML

### Estratégia

Utilizar `DOMParser` nativo do WebView para parsing de XMLs fiscais.

```typescript
const parser = new DOMParser();
const doc = parser.parseFromString(xmlContent, 'text/xml');
```

### Detecção de Tipo

| Tag Raiz | Tipo |
|---|---|
| `nfeProc` ou `NFe` | NF-e |
| `CompNfse` ou `nfse` (namespace sped.fazenda) | NFS-e Padrão Nacional |
| `CompNfse` (namespace ABRASF) | NFS-e ABRASF |
| `cteProc` ou `CTe` | CT-e |
| `nfceProc` | NFC-e |

### Extração de Dados

Cada parser extrai os dados para um modelo tipado TypeScript. O XML original é armazenado separadamente e NUNCA modificado.

## Gerenciamento de Estado

### Estado Global (Store)

Um store simples baseado em eventos:

```typescript
interface AppState {
  currentCompany: Company | null;
  currentRoute: string;
  theme: 'light' | 'dark';
  loading: boolean;
}
```

### Padrão de Comunicação

```
UI Event → Service → Repository → SQLite
                                     ↓
UI Update ← Service ← Repository ← Result
```

Comunicação via callbacks/promises. Sem necessidade de RxJS ou similar.

## Formatação de Dados

### Valores Monetários

- Armazenados como `REAL` no SQLite (precisão decimal nativa)
- Formatados via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Parsing de XML preserva o valor decimal como string, converte para number apenas na inserção

### CNPJ/CPF

- Armazenados SEM formatação (apenas dígitos)
- Formatados para exibição via função utilitária
- Pesquisa funciona com ou sem formatação

### Datas

- Armazenadas como `TEXT` no SQLite no formato ISO 8601
- Formatadas para exibição via `Intl.DateTimeFormat('pt-BR')`
- Parsing preserva o formato original do XML

### Chave de Acesso (NF-e)

- 44 dígitos numéricos
- Armazenada sem espaços ou formatação
- Exibida com espaçamento a cada 4 dígitos
- Validação do dígito verificador (módulo 11)

## Build e Distribuição

### Desenvolvimento

```bash
npm run tauri dev    # Desenvolvimento com HMR
```

### Produção

```bash
npm run tauri build  # Gera instalador Windows (.msi / .exe)
```

### Estrutura de Build

```
target/
└── release/
    └── bundle/
        ├── msi/           # Instalador MSI
        └── nsis/          # Instalador NSIS (.exe)
```
