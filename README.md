# FiscalFlow — Gestão & Auditoria de Documentos Fiscais Eletrônicos

[![Deploy GitHub Pages](https://img.shields.io/badge/Demo_Online-GitHub_Pages-2563eb?style=for-the-badge&logo=github&logoColor=white)](https://wallacextreme.github.io/FiscalFlow/)
[![Desktop Windows](https://img.shields.io/badge/Desktop-Windows_10%2F11_(Tauri_2)-0078d4?style=for-the-badge&logo=windows&logoColor=white)](#instalação-desktop-windows)
[![Testes Automatizados](https://img.shields.io/badge/Testes-126_Aprovados_(100%25)-10b981?style=for-the-badge&logo=vitest&logoColor=white)](#testes-automatizados)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](#engenharia-de-software)
[![ISO 25010:2023](https://img.shields.io/badge/Qualidade-ISO%2FIEC_25010%3A2023-purple?style=for-the-badge)](#qualidade-e-governança-iso)
[![ISO 9001:2026](https://img.shields.io/badge/SGQ-ISO_9001%3A2026_Aligned-darkblue?style=for-the-badge)](#qualidade-e-governança-iso)
[![Licença](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

O **FiscalFlow** é um ecossistema corporativo completo de auditoria, organização, gestão e prévia contábil de documentos fiscais eletrônicos brasileiros, desenvolvido por **Wallace Soares** ([@wallacextreme](https://github.com/wallacextreme)) para a **Xtreme Sistemas**.

Construído sob uma rigorosa arquitetura **Offline-First**, o sistema permite que escritórios de contabilidade, empresas comerciais e auditores processem milhares de notas fiscais em lote com velocidade instantânea, desduplicação criptográfica e total privacidade, sem necessidade de conexão com a internet.

---

## 🌐 Demonstração Online (GitHub Pages)

Experimente a versão web interativa com WebAssembly SQLite diretamente no seu navegador:

👉 **[Acessar Demonstração Online do FiscalFlow](https://wallacextreme.github.io/FiscalFlow/)**

> **Nota sobre o Demo Online:** Ao abrir pela primeira vez no navegador, o sistema inicializa um banco de dados relacional SQLite em WebAssembly (`sql.js`) e povoa automaticamente uma empresa de demonstração com documentos de exemplo (NF-e, NFS-e e CT-e). Você pode navegar pelo Dashboard, filtrar notas, inspecionar o modal analítico de 4 abas, gerar relatórios em CSV e testar a importação em tempo real!

---

## 🚀 Principais Diferenciais de Engenharia

1. **Arquitetura 100% Offline-First:** Opera de forma autônoma sem requisições HTTP para a nuvem. Todos os dados permanecem gravados no dispositivo do usuário, garantindo sigilo fiscal e velocidade de acesso a disco.
2. **Desduplicação Inteligente com SHA-256:** Cada arquivo importado tem seu hash criptográfico SHA-256 e sua chave de acesso de 44 dígitos verificados. O sistema impede lançamentos em duplicidade e preserva o XML original inalterado.
3. **Validação Matemática do Módulo 11 da SEFAZ:** Implementação oficial do cálculo do Dígito Verificador (DV) da Chave de Acesso para validação de autenticidade documental.
4. **Suporte Multiformato Oficial:**
   - **NF-e v4.00 (Modelo 55):** Extração completa de emitente, destinatário, itens/produtos e tributos (ICMS, IPI, PIS, COFINS).
   - **NFC-e (Modelo 65):** Notas ao consumidor.
   - **NFS-e (Serviços):** Suporte dual automático ao **Padrão Nacional (Portal Nacional / SPED)** e ao padrão **ABRASF v2.04**.
   - **CT-e v4.00 (Modelo 57):** Conhecimento de Transporte com componentes de frete e dados de carga.
   - **SPED Fiscal (EFD ICMS/IPI):** Leitura posicional dos Registros 0000, 0100 (contador/CRC), C100 (documentos mercantis) e E110 (apuração do ICMS com débitos, créditos e saldos).
5. **Central de Exportação Contábil:**
   - **Pacote XML em ZIP:** Compactação com carimbo de integridade e arquivo `manifesto_exportacao.txt` para envio ao contador.
   - **CSV Gerencial:** Formatado para o padrão brasileiro (separador `;`, vírgula decimal e UTF-8 BOM `\uFEFF` para abertura direta no Microsoft Excel sem desconfiguração de caracteres).
   - **CSV Analítico de Itens:** Exportação linha a linha de produtos com NCM, CFOP e alíquotas.
   - **ZIP SPED Fiscal:** Empacotamento de escriturações digitais originais.
6. **Dashboard Executivo em Tempo Real:** Cards de Entradas vs Saídas por correspondência de CNPJ, apuração de Superávit/Déficit operacional, gráficos mensais, distribuição por modelo e rankings Top 5 Fornecedores e Clientes.
7. **Design System & Acessibilidade:** Interface fluida com suporte nativo a Tema Escuro (*Dark Mode*) e Tema Claro (*Light Mode*), com atalho rápido de teclado `Alt + T`.

---

## 🏛️ Qualidade e Governança ISO

O FiscalFlow foi auditado e documentado seguindo os mais elevados padrões internacionais de qualidade de produto de software e gestão por processos:

| Documento Oficial | Norma | Objetivo e Conteúdo |
|---|---|---|
| 📖 **[MANUAL_DO_USUARIO.md](MANUAL_DO_USUARIO.md)** | UX Writing & Engenharia de Usabilidade | Guia operacional completo (leigo a avançado), passo a passo de instalação no Windows (.exe/.msi), guia de início rápido em 5 passos, mapeamento detalhado de todas as 10 telas/módulos, FAQ com 8 perguntas e matriz de *Troubleshooting*. |
| 📊 **[RELATORIO_QUALIDADE_ISO25010.md](RELATORIO_QUALIDADE_ISO25010.md)** | **ISO/IEC 25010:2023** (Revisão Vigente) | Avaliação técnica completa do produto de software cobrindo as **9 características de qualidade** (Adequação Funcional, Desempenho, Compatibilidade, Capacidade de Interação, Confiabilidade, Segurança, Manutenibilidade, Flexibilidade e Segurança Operacional/Safety), scorecard executivo e plano de ação priorizado. |
| 🏛️ **[SISTEMA_GESTAO_QUALIDADE_ISO9001.md](SISTEMA_GESTAO_QUALIDADE_ISO9001.md)** | **ISO 9001:2026** (Edição Vigente) | Alinhamento do SGQ da equipe de desenvolvimento em 10 blocos temáticos, 5 procedimentos operacionais padronizados (Controle de Versão, Ciclo de Desenvolvimento, Testes, Build/Release e Não Conformidades), ênfase em cultura da qualidade, ética e mudanças climáticas, e matriz de *Gap Analysis*. |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição e Finalidade |
|---|---|---|
| **Runtime Desktop** | **Tauri 2** (Rust) | Binário nativo extremamente leve, seguro e com permissões estritas de IPC (*capabilities*). |
| **Frontend Core** | **TypeScript 6** (Strict Mode) | Lógica de negócio com tipagem estática pura, desacoplada de frameworks pesados. |
| **Build & Dev** | **Vite 8** | Compilação ultra-rápida, Hot Module Replacement e geração de bundle otimizado. |
| **Estilização** | **Tailwind CSS 3** + Vanilla CSS | Design tokens semânticos, temas Dark/Light e responsividade completa. |
| **Banco de Dados (Desktop)** | **SQLite 3** (`@tauri-apps/plugin-sql`) | Persistência relacional local, transações atômicas e índices de alta velocidade. |
| **Banco de Dados (Web / Demo)** | **WebAssembly SQLite** (`sql.js`) | Execução do SQLite completo no navegador com persistência em localStorage. |
| **Manipulação de Arquivos** | **JSZip** | Geração assíncrona de pacotes ZIP compactados no padrão DEFLATE. |
| **Testes Automatizados** | **Vitest 2** + V8 Coverage | Execução de testes unitários e de integração de ciclo completo ponta a ponta. |

---

## 📂 Estrutura do Projeto

```
FiscalFlow/
├── .github/workflows/           # Pipelines de CI/CD (GitHub Actions)
├── docs/                        # Especificações arquiteturais e de requisitos
├── reports/                     # Relatórios de conclusão de fases de desenvolvimento
├── src-tauri/                   # Núcleo Desktop Tauri 2 (Rust)
│   ├── capabilities/            # Permissões mínimas de segurança IPC
│   ├── icons/                   # Ícones da aplicação em múltiplos formatos (.ico, .png)
│   ├── src/                     # Código Rust (main.rs, lib.rs)
│   ├── Cargo.toml               # Dependências e perfis de otimização Rust
│   └── tauri.conf.json          # Configurações do runtime Desktop e CSP
├── src/                         # Código-fonte da Aplicação (TypeScript)
│   ├── components/              # Modais (4 abas analíticas), toasts e componentes UI
│   ├── database/                # Conexão SQLite (Tauri + WebAssembly), migrador e repositórios
│   ├── domain/parsers/          # Parsers dedicados (NF-e, NFS-e, CT-e, SPED Fiscal)
│   ├── pages/                   # Páginas SPA (Dashboard, Documentos, Empresas, Importar, etc.)
│   ├── router/                  # Roteador SPA hash-based de alta velocidade
│   ├── services/                # Orquestração de negócio (Import, Export, Dashboard, Settings)
│   ├── types/                   # Modelos de domínio e tipos estritos
│   ├── utils/                   # Validadores matemáticos (Módulo 11, CNPJ, CPF, Moeda)
│   ├── main.ts                  # Ponto de entrada da aplicação
│   └── styles.css               # Design System com tokens e temas
├── tests/                       # Infraestrutura de Testes Automatizados
│   ├── fixtures/                # Arquivos fiscais reais para teste (XMLs e SPED)
│   ├── helpers/                 # Adaptador SQLite em memória para Vitest
│   ├── integration/             # Teste E2E de ciclo de vida fiscal completo
│   └── unit/                    # 21 suítes de testes unitários
├── MANUAL_DO_USUARIO.md         # Manual oficial do usuário final
├── RELATORIO_QUALIDADE_ISO25010.md # Relatório de Qualidade de Produto ISO/IEC 25010:2023
├── SISTEMA_GESTAO_QUALIDADE_ISO9001.md # Alinhamento ao SGQ ISO 9001:2026
├── package.json                 # Dependências e scripts npm
├── vite.config.ts               # Configuração do bundler Vite
└── vitest.config.ts             # Configuração do executor de testes
```

---

## 🧪 Testes Automatizados

O sistema conta com **126 testes automatizados** cobrindo 100% dos fluxos críticos de negócio, executados pelo **Vitest**:

```bash
# Executar suíte completa de testes
npm test

# Executar testes com relatório analítico de cobertura de código (V8)
npm run test:coverage

# Verificação estrita de tipagem TypeScript
npm run typecheck
```

### Resultados Obtidos:
- **126 testes passando em 22 suítes (0 falhas)** em ~3,8 segundos.
- **Cobertura de Repositórios:** 97.99%
- **Cobertura de Migrações DDL:** 100%
- **Cobertura de Serviços:** 86.42%
- **Cobertura de Parsers:** 84.30%
- **Cobertura de Validadores:** 84.61%
- **Verificação de Tipagem Estrita:** 0 erros no compilador TypeScript.

---

## 💻 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Para desenvolvimento desktop: [Rust](https://www.rust-lang.org/) e ferramentas de build do Windows C++

### Passos:
```bash
# 1. Clone o repositório
git clone https://github.com/wallacextreme/FiscalFlow.git
cd FiscalFlow

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento web
npm run dev

# 4. Ou inicie a aplicação Desktop nativa com Tauri 2
npm run tauri dev

# 5. Para gerar o pacote instalador Desktop de produção (.exe e .msi)
npm run tauri build
```

---

## 👤 Autor & Contato Profissional

**Wallace de Paula Soares**  
*Desenvolvedor Full Stack • Especialista Desktop & Offline-First • Graduado em ADS pela Estácio de Sá*

- **GitHub:** [@wallacextreme](https://github.com/wallacextreme)
- **LinkedIn:** [linkedin.com/in/wallacextreme](https://www.linkedin.com/in/wallacextreme)
- **Portfólio Oficial:** [wallacextreme.github.io/portfolio](https://wallacextreme.github.io/portfolio/)
- **E-mail:** [wallacextreme@hotmail.com](mailto:wallacextreme@hotmail.com)
- **TecnoService NF:** [@tecnoservicenf](https://www.instagram.com/tecnoservicenf)

---

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE) — consulte o arquivo para detalhes.
