# FiscalFlow — Dependências e Licenças

## Dependências de Produção (Frontend)

| Pacote | Versão | Propósito | Licença |
|---|---|---|---|
| `@tauri-apps/api` | ^2.x | API principal Tauri | MIT |
| `@tauri-apps/plugin-sql` | ^2.x | Acesso SQLite | MIT |
| `@tauri-apps/plugin-dialog` | ^2.x | File picker, confirmações | MIT |
| `@tauri-apps/plugin-fs` | ^2.x | Leitura de arquivos | MIT |
| `@tauri-apps/plugin-clipboard-manager` | ^2.x | Copiar texto | MIT |
| `@tauri-apps/plugin-shell` | ^2.x | Abrir arquivos externamente | MIT |
| `jszip` | ^3.x | Compactação em lote de arquivos XML para exportação contábil | MIT |

## Dependências de Desenvolvimento (Frontend)

| Pacote | Versão | Propósito | Licença |
|---|---|---|---|
| `typescript` | ^5.x | Linguagem | Apache-2.0 |
| `vite` | ^6.x | Bundler | MIT |
| `@tauri-apps/cli` | ^2.x | CLI Tauri | MIT |
| `tailwindcss` | ^3.x | CSS utilities | MIT |
| `postcss` | ^8.x | CSS processing | MIT |
| `autoprefixer` | ^10.x | CSS vendor prefixes | MIT |
| `vitest` | ^2.x | Test runner | MIT |

## Dependências Rust (Backend)

| Crate | Versão | Propósito | Licença |
|---|---|---|---|
| `tauri` | ^2.x | Framework Tauri | MIT |
| `tauri-plugin-sql` | ^2.x (features: sqlite) | SQLite plugin | MIT |
| `tauri-plugin-dialog` | ^2.x | Dialog plugin | MIT |
| `tauri-plugin-fs` | ^2.x | FS plugin | MIT |
| `tauri-plugin-clipboard-manager` | ^2.x | Clipboard plugin | MIT |
| `tauri-plugin-shell` | ^2.x | Shell plugin | MIT |
| `serde` | ^1.x | Serialização | MIT/Apache-2.0 |
| `serde_json` | ^1.x | JSON | MIT/Apache-2.0 |

## Política de Dependências

1. **Preferir APIs nativas** do browser/Tauri antes de adicionar dependência
2. **Justificar** cada nova dependência adicionada
3. **Verificar licença** — apenas MIT, Apache-2.0, BSD são aceitas
4. **Verificar manutenção** — pacotes abandonados não devem ser adicionados
5. **Verificar segurança** — `npm audit` deve estar limpo
6. **Minimizar dependências** — quanto menos, melhor

## Dependências NÃO utilizadas (e por quê)

| Pacote | Por que não |
|---|---|
| React/Vue/Svelte | Complexidade desnecessária para o escopo |
| Electron | Tauri é mais leve e seguro |
| better-sqlite3 | Tauri plugin-sql é suficiente |
| moment.js | Intl.DateTimeFormat nativo é suficiente |
| lodash | Funções nativas do ES2020+ são suficientes |
| axios | Não há comunicação HTTP |
