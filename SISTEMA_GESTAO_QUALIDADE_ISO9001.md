# 🏛️ Sistema de Gestão da Qualidade — Alinhamento à ISO 9001:2026 — FiscalFlow

**Organização:** Xtreme Sistemas  
**Produto:** FiscalFlow — Gestão de Documentos Fiscais Eletrônicos  
**Versão do Sistema Avaliada:** 1.0.0  
**Data do Levantamento:** 27 de Setembro de 2026  
**Norma de Referência:** ABNT NBR ISO 9001:2026 (*Sistemas de Gestão da Qualidade — Requisitos*, 6ª Edição)  
**Finalidade:** Estruturação e organização da documentação de processos do time de desenvolvimento como alicerce preparatório para futura auditoria e certificação formal de SGQ.  

---

## Convenção Metodológica Deste Documento

Em estrito atendimento às boas práticas de governança e auditoria da qualidade, este documento diferencia sistematicamente dois tipos de conteúdo:

- 🔧 **EVIDÊNCIA TÉCNICA DO REPOSITÓRIO:** Procedimentos, regras e convenções comprováveis diretamente a partir do código-fonte, scripts, testes e especificações técnicas existentes no repositório.
- 📝 **DEFINIÇÃO ORGANIZACIONAL REQUERIDA:** Itens corporativos, diretrizes estratégicas e compromissos institucionais que dependem exclusivamente de deliberação da alta direção e dos gestores da Xtreme Sistemas. Para estes itens, **não foram criadas respostas fictícias**; em vez disso, são fornecidos modelos estruturados, perguntas orientadoras e checklists para preenchimento formal pela organização.

---

## Sumário

- [1. Introdução e Escopo](#1-introdução-e-escopo)
- [2. Contexto da Organização (Cláusula 4)](#2-contexto-da-organização-cláusula-4)
- [3. Liderança e Política da Qualidade (Cláusula 5)](#3-liderança-e-política-da-qualidade-cláusula-5)
- [4. Planejamento — Riscos, Oportunidades e Objetivos da Qualidade (Cláusula 6)](#4-planejamento--riscos-oportunidades-e-objetivos-da-qualidade-cláusula-6)
- [5. Apoio — Recursos, Competência, Comunicação e Informação Documentada (Cláusula 7)](#5-apoio--recursos-competência-comunicação-e-informação-documentada-cláusula-7)
- [6. Operação — Desenvolvimento, Testes e Entrega (Cláusula 8)](#6-operação--desenvolvimento-testes-e-entrega-cláusula-8)
- [7. Avaliação de Desempenho (Cláusula 9)](#7-avaliação-de-desempenho-cláusula-9)
- [8. Melhoria (Cláusula 10)](#8-melhoria-cláusula-10)
- [9. Matriz de Aderência (Gap Analysis) — ISO 9001:2026](#9-matriz-de-aderência-gap-analysis--iso-90012026)
- [10. Aviso Importante sobre Certificação ISO 9001](#10-aviso-importante-sobre-certificação-iso-9001)

---

## 1. Introdução e Escopo

### 1.1. Propósito
Este documento constitui o referencial de alinhamento dos processos de engenharia, desenvolvimento, homologação e manutenção do produto **FiscalFlow** aos requisitos da norma internacional **ISO 9001:2026**.

A edição de 2026 da ISO 9001 manteve a Estrutura Harmonizada (*Harmonized Structure*) das normas de gestão, introduzindo novos refinamentos essenciais:
- Exigência explícita do fomento a uma **Cultura da Qualidade e Comportamento Ético** pela alta liderança.
- Inclusão formal da relevância de **Fatores Climáticos e Sustentabilidade** na análise de contexto organizacional (Cláusulas 4.1 e 4.2).
- Separação formal e detalhada entre **Gestão de Riscos** e **Gestão de Oportunidades** (Cláusula 6.1).
- Monitoramento e comunicação aprimorados no **Planejamento de Mudanças** (Cláusula 6.3).

### 1.2. Escopo Técnico Identificado
- **Produto Coberto:** Software aplicativo FiscalFlow (aplicação desktop Windows baseada em Tauri 2 e núcleo web).
- **Domínio de Aplicação:** Gestão, conferência, auditoria analítica e exportação contábil de Documentos Fiscais Eletrônicos (NF-e, NFC-e, NFS-e, CT-e) e Escrituração Fiscal Digital (SPED EFD ICMS/IPI) para o mercado brasileiro.

---

## 2. Contexto da Organização (Cláusula 4)

### 2.1. 🔧 Descrição Técnica do Produto e Partes Interessadas de Engenharia

Com base nos artefatos `PROJECT_VISION.md`, `REQUIREMENTS.md` e `ARCHITECTURE.md`, o produto atende às seguintes características contextuais:
- **Natureza Operacional:** Sistema de alta performance voltado para processamento local de documentos fiscais estruturados (XML e TXT delimitado).
- **Arquitetura Crítica:** Operação integralmente *Offline-First* (independente de infraestrutura de nuvem para a operação central), armazenando dados exclusivamente no dispositivo do cliente através do banco relacional SQLite local (`src/database/connection.ts`).
- **Partes Interessadas Técnicas Mapeadas:**
  1. *Operadores Contábeis e Fiscais:* Exigem velocidade de importação, desduplicação confiável e integridade nos cálculos tributários.
  2. *Contadores e Auditores Externos:* Necessitam de pacotes de dados padronizados (ZIP com manifesto de entrega e planilhas CSV com formatação brasileira UTF-8 BOM).
  3. *Administradores de TI Corporativos:* Demandam instaladores autônomos (.msi / .exe), isolamento de permissões do sistema operacional e ausência de tráfego de rede não autorizado.
  4. *Fisco Estadual e Federal (SEFAZ / Receita Federal):* Entidades reguladoras cujos manuais técnicos (MOC NF-e, Guia Prático da EFD, Lei Complementar 116) ditam a conformidade das regras de negócio do software.

---

### 2.2. 📝 Checklist de Contexto Estratégico e Mudanças Climáticas

*(A ser formalizado e validado pela Diretoria da Xtreme Sistemas)*

#### Questionário de Análise Estratégica:
- [ ] **Ambiente de Negócios:** Quais são as ameaças de mercado (concorrentes de software fiscal em nuvem, alterações legislativas na Reforma Tributária) e forças internas da Xtreme Sistemas?
- [ ] **Requisitos Regulatórios e Legais:** Quais normas além do Código Tributário Nacional e Manuais da SEFAZ impactam a organização (ex.: LGPD — Lei Geral de Proteção de Dados, Marco Civil da Internet)?
- [ ] **Consideração de Fatores Climáticos e Sustentabilidade (ISO 9001:2026 - Cláusula 4.1/4.2):**
  - *Pergunta 1:* A mudança climática é um fator relevante para a operação da Xtreme Sistemas e para a continuidade dos serviços prestados aos clientes do FiscalFlow?
  - *Análise de Apoio ao Time:* Por ser uma aplicação *Offline-First* executada localmente, o FiscalFlow não depende de servidores em datacenters remotos suscetíveis a cortes de energia por eventos climáticos extremos. No entanto, o hardware dos clientes e os postos de trabalho dos desenvolvedores estão sujeitos a tais fatores.
  - *Deliberação da Direção:* Definir se a organização adotará políticas formais de redução de pegada de carbono (trabalho remoto sustentável, eficiência energética de servidores de build).
- [ ] **Escopo Formal do SGQ:** Delimitar as fronteiras físicas e operacionais do Sistema de Gestão da Qualidade (ex.: "Desenvolvimento, suporte e manutenção do software FiscalFlow").

---

## 3. Liderança e Política da Qualidade (Cláusula 5)

### 3.1. 📝 Compromisso da Liderança, Cultura da Qualidade e Ética

A edição ISO 9001:2026 exige que a liderança atue como guardiã ativa da cultura da qualidade e dos preceitos éticos da organização.

#### Modelo Orientador para a Direção da Xtreme Sistemas:

```markdown
### DECLARAÇÃO DE COMPROMISSO DA ALTA DIREÇÃO
A Alta Direção da Xtreme Sistemas declara seu compromisso em:
1. Assegurar os recursos necessários (ferramental técnico, estações de trabalho, capacitação contínua) para o ciclo de vida do FiscalFlow.
2. Promover ativamente uma cultura de qualidade onde cada colaborador é responsável pela excelência e rigor fiscal do produto.
3. Fomentar um ambiente ético inegociável, assegurando total sigilo, privacidade dos dados fiscais dos clientes e conformidade legal com a legislação tributária brasileira.
4. Manter o foco contínuo na satisfação do usuário e na melhoria contínua dos processos de engenharia.

Data de Aprovação: ___/___/2026
Assinatura da Diretoria: _________________________________________
```

---

### 3.2. 📝 Modelo em Branco de Política da Qualidade

*(Este espaço deve ser preenchido pela Alta Direção da Xtreme Sistemas; não utilize textos genéricos não deliberados)*

```markdown
┌────────────────────────────────────────────────────────────────────────────┐
│                    POLÍTICA DA QUALIDADE — XTREME SISTEMAS                 │
├────────────────────────────────────────────────────────────────────────────┤
│ A Xtreme Sistemas tem como compromisso fornecer soluções tecnológicas de   │
│ gestão fiscal caracterizadas por:                                          │
│                                                                            │
│ 1. [Inserir compromisso de conformidade legal e rigor contábil]            │
│ 2. [Inserir compromisso com confiabilidade, segurança e privacidade]       │
│ 3. [Inserir compromisso com capacitação da equipe e excelência técnica]    │
│ 4. [Inserir compromisso de melhoria contínua dos processos do SGQ]         │
│                                                                            │
│ Esta política é comunicada, compreendida e aplicada em toda a organização. │
│                                                                            │
│ Aprovado por: _____________________________ Data: ___/___/2026             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Planejamento — Riscos, Oportunidades e Objetivos da Qualidade (Cláusula 6)

### 4.1. 🔧 Riscos Técnicos Observáveis no Repositório

Com base na auditoria do código-fonte e infraestrutura, foram mapeados os seguintes riscos de engenharia de produto:

| Risco Técnico Identificado | Evidência no Código | Impacto Potencial | Mitigação Atual / Recomendada |
|---|---|---|---|
| **Dependência do WebView2 no Windows** | `src-tauri/tauri.conf.json` e `Cargo.toml` | Telas em branco em Windows legados ou desatualizados sem o runtime da Microsoft. | Documentado no Manual do Usuário; mitigar com empacotamento de verificador automático no `.msi`. |
| **Ausência de Fallback de Banco na Web** | `src/database/connection.ts` (linha 40) | Falha em operações com banco ao rodar em navegador fora do runtime Tauri. | Desenvolver adapter IndexedDB / SQLite-WASM para execução web/PWA completa. |
| **Impossibilidade de Medir Cobertura** | `package.json` (`npm run test:coverage` falha) | Falta de visibilidade de trechos de código não testados. | Adicionar `@vitest/coverage-v8` nas dependências de desenvolvimento. |
| **Chamadas Externas de Fontes no CSP** | `src-tauri/tauri.conf.json` (linha 25) | Dependência de conexão de rede externa para carregar fontes do Google. | Embutir arquivos `.woff2` localmente em `src/assets/fonts/`. |
| **Ausência de Repositório Git Local** | Erro fatal de terminal `fatal: not a git repository` | Falta de rastreabilidade de commits, autores e branches na estação local. | Inicializar repositório Git corporativo com proteção de branches e convenção padronizada. |

---

### 4.2. 🔧 Oportunidades Técnicas Mapeadas

- **Aceleração do SPED:** Delegar a leitura de arquivos SPED gigantescos (acima de 500 MB) ao núcleo Rust via Tauri Command assíncrono.
- **Expansão para PWA Instalável:** Registrar formalmente um manifesto web e service worker, habilitando distribuição sem necessidade de instalador desktop.
- **Preparação para a Reforma Tributária (IBS/CBS):** A arquitetura modular dos parsers (`src/domain/parsers/`) permite acoplar com facilidade os novos tributos da reforma quando seus schemas forem regulamentados.

---

### 4.3. 📝 Objetivos da Qualidade da Organização

*(A ser deliberado e preenchido pela gerência do projeto com metas numéricas mensuráveis)*

| Objetivo da Qualidade | Indicador de Medição | Meta Proposta | Frequência de Avaliação | Responsável |
|---|---|---|---|---|
| Garantir estabilidade do código | Taxa de testes automatizados aprovados | 100% de sucesso contínuo | A cada compilação de release | Time de QA |
| Eliminar erros de tipagem estática | Ocorrências no `npm run typecheck` | 0 erros | Diária | Líder Técnico |
| Atingir alta cobertura de código | Cobertura reportada pelo Vitest | Definir meta (ex: > 80%) | Semanal | Time de Desenvolvimento |
| Minimizar rejeições de importação por bug | Taxa de chamados de suporte de parser | < 1% dos lotes | Mensal | Suporte Técnico |
| *(Definir objetivo de satisfação do cliente)* | NPS ou pesquisa periódica | A definir pela liderança | Trimestral | Gestão de Qualidade |

---

## 5. Apoio — Recursos, Competência, Comunicação e Informação Documentada (Cláusula 7)

### 5.1. 🔧 Procedimento de Controle de Informação Documentada

**Objetivo:** Padronizar a criação, revisão, armazenamento e controle de versões de todos os artefatos técnicos do FiscalFlow.

- **Codificação e Estrutura Identificada:**
  - Especificações e decisões arquiteturais são redigidas em Markdown na raiz e na pasta `docs/` (`ARCHITECTURE.md`, `SECURITY.md`, `REQUIREMENTS.md`, `PROJECT_STATE.md`).
  - Relatórios de encerramento de fase são versionados em `reports/` (`PHASE_11_REPORT.md`, `PHASE_12_REPORT.md`, `PHASE_13_REPORT.md`).
  - Esquemas de dados são documentados em `DATABASE_SCHEMA.md` e espelhados em migrações versionadas numericamente em `src/database/migrations/001_initial.ts`.
- **Regras de Controle:**
  1. Nenhum arquivo de especificação técnica pode ser excluído sem registro formal de justificativa.
  2. Qualquer alteração em banco de dados exige criação de novo script de migração sequencial (`002_*.ts`, etc.) em estrita observância à tabela de controle `schema_migrations`.
  3. A versão do produto deve ser mantida sincronizada de forma simultânea nos arquivos: `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` e constante `APP_VERSION` em `src/main.ts`.

---

### 5.2. 📝 Matriz de Competências e Plano de Capacitação da Equipe

*(Espaço em branco para a organização preencher os requisitos de seus colaboradores)*

| Papel / Função | Competências e Conhecimentos Exigidos | Meio de Comprovação | Necessidade de Treinamento |
|---|---|---|---|
| **Desenvolvedor Frontend** | TypeScript estrito, DOM API, CSS/Tailwind, SPA Router | Portfólio / Avaliação técnica | A definir pela liderança |
| **Desenvolvedor Rust/Desktop** | Linguagem Rust, Tauri 2, IPC, segurança de sistemas | Código revisado / Certificação | A definir pela liderança |
| **Analista Fiscal / QA** | Legislação de NF-e, NFS-e, CT-e, SPED EFD, Módulo 11 | Graduação Contábil / Experiência | A definir pela liderança |
| **Gestor da Qualidade** | Norma ISO 9001:2026, auditoria de processos, PDCA | Certificado de Auditor Interno | A definir pela liderança |

---

## 6. Operação — Desenvolvimento, Testes e Entrega (Cláusula 8)

Com base nas práticas identificadas no repositório, formalizam-se os seguintes procedimentos operacionais:

### 6.1. 🔧 Procedimento de Controle de Versão (PR-OP-01)
- **Objetivo:** Garantir a integridade, rastreabilidade e identificação inequívoca de cada liberação do FiscalFlow.
- **Entradas:** Código-fonte e artefatos de configuração.
- **Etapas Observadas no Repositório:**
  1. Adoção da convenção de Versionamento Semântico (*Semantic Versioning* — SemVer: `MAJOR.MINOR.PATCH`).
  2. Atualização sincronizada da versão `1.0.0` nos manifestos `package.json`, `Cargo.toml`, `tauri.conf.json` e `src/main.ts`.
  3. *Observação de Auditoria:* Como a estação local não continha histórico `.git`, o time de desenvolvimento deve instituir o versionamento obrigatório em repositório central com tags Git correspondentes a cada versão (`v1.0.0`).
- **Saídas:** Versão unificada e auditável.
- **Responsável:** Líder Técnico / Gerente de Configuração.

---

### 6.2. 🔧 Procedimento de Design e Desenvolvimento (PR-OP-02)
- **Objetivo:** Estruturar o ciclo de vida de desenvolvimento em fases com critérios de aceite claros.
- **Entradas:** Requisitos funcionais e regulamentações tributárias (`REQUIREMENTS.md`, `OFFICIAL_SOURCES.md`).
- **Etapas Observadas no Repositório:**
  1. Ciclo sequencial e controlado em 13 fases planejadas (`IMPLEMENTATION_PLAN.md` e `PROJECT_STATE.md`): Fundação ➔ Banco de Dados ➔ Layout ➔ Empresas ➔ Importação ➔ NF-e ➔ NFS-e ➔ CT-e ➔ SPED ➔ Dashboard ➔ Exportação ➔ Configurações ➔ Testes e QA Final.
  2. Implementação com base em desacoplamento arquitetural: separação estrita de Parsers (`src/domain/parsers/`), Repositórios (`src/database/repositories/`), Serviços de negócio (`src/services/`) e Visualização (`src/pages/`).
  3. Emissão de Relatório de Conclusão de Fase com validação explícita de escopo (`reports/PHASE_*.md`).
- **Saídas:** Módulos funcionais testados e documentados.
- **Responsável:** Time de Desenvolvimento de Software.

---

### 6.3. 🔧 Procedimento de Testes e Validação da Qualidade (PR-OP-03)
- **Objetivo:** Assegurar que nenhuma versão do sistema contenha erros de tipagem estática, quebras de contrato de dados ou falhas em regras fiscais.
- **Entradas:** Código-fonte modificado e suíte de testes.
- **Etapas Observadas no Repositório:**
  1. *Etapa 1 — Análise Estática de Tipagem:* Execução obrigatória de `npm run typecheck` (`tsc --noEmit`). Critério de aceite: 0 erros de compilação estrita.
  2. *Etapa 2 — Execução da Suíte de Testes Automatizados:* Execução de `npm test` (`vitest run`). Critério de aceite: 100% de aprovação (atualmente 126 testes distribuídos em 22 suítes, cobrindo validações matemáticas de CNPJ/CPF, Chave de Acesso Módulo 11, parsers de todos os leiautes e teste de integração E2E `tests/integration/full-lifecycle.test.ts`).
  3. *Etapa 3 — Validação de Fixtures Oficiais:* Uso de arquivos fiscais representativos de casos reais em `tests/fixtures/`.
- **Saídas:** Relatório de execução aprovado com zero falhas.
- **Responsável:** Engenheiro de QA / Desenvolvedor executor.

---

### 6.4. 🔧 Procedimento de Build, Empacotamento e Release (PR-OP-04)
- **Objetivo:** Gerar instaladores executáveis e pacotes de distribuição seguros e auditáveis para os usuários finais.
- **Entradas:** Código validado nos procedimentos de teste.
- **Etapas Observadas no Repositório:**
  1. Geração do bundle estático web otimizado: `npm run build` (executa `tsc && vite build`, gerando arquivos minificados em `dist/`).
  2. Compilação do binário nativo em Rust com perfil otimizado para produção: `cargo build --release` em `src-tauri/`.
  3. Empacotamento do instalador Windows: execução de `npm run tauri build` com alvos configurados para executável `.exe` e pacote de diretiva corporativa `.msi`.
  4. Geração de ícones em múltiplos formatos e tamanhos para integração perfeita com o shell do Windows (`src-tauri/icons/`).
- **Saídas:** Arquivos instaladores gerados em `src-tauri/target/release/bundle/`.
- **Responsável:** Time de Release / DevOps.

---

### 6.5. 🔧 Procedimento de Tratamento de Não Conformidades no Produto (PR-OP-05)
- **Objetivo:** Identificar, registrar, conter e prevenir a recorrência de arquivos corrompidos ou inconsistências operacionais.
- **Entradas:** Arquivos submetidos à importação ou relatos de erro.
- **Etapas Observadas no Repositório:**
  1. Detecção e segregação automática de arquivos inconsistentes durante a rotina de importação em lote (`src/services/import.service.ts`).
  2. Armazenamento da mensagem de erro e do status na tabela `import_records`.
  3. Exibição transparente ao operador através do relatório pós-importação com discriminação entre **Importados**, **Duplicados** e **Erros** (`src/pages/import.page.ts`).
  4. Proteção contra corrupção do banco de dados: exclusão idempotente e reversão de transações incompletas.
- **Saídas:** Relatório de não conformidades de entrada e banco de dados íntegro.
- **Responsável:** Time de Suporte e Engenharia.

---

## 7. Avaliação de Desempenho (Cláusula 9)

### 7.1. 🔧 Métricas Técnicas Atualmente Disponíveis no Repositório

O monitoramento do desempenho técnico do FiscalFlow é evidenciado pelos seguintes registros operacionais:
- **Taxa de Sucesso em Testes Automatizados:** 100% de aprovação (126 testes de 126 executados no Vitest, com tempo médio de execução de ~3,8 segundos).
- **Conformidade de Tipagem:** 0 erros reportados pelo compilador TypeScript em modo strict (`npm run typecheck`).
- **Idempotência de Banco de Dados:** Suíte `tests/unit/database/migrator.test.ts` valida a capacidade do migrador executar múltiplas vezes sem corrupção ou duplicidade de esquema.
- **Estatísticas de Integridade em Tempo Real:** O módulo de configurações (`src/services/settings.service.ts`) apura contagens de entidades cadastradas e oferece ferramenta de medição da saúde da base SQLite.

---

### 7.2. 📝 Processos a Serem Instituídos pela Organização

*(Itens obrigatórios da ISO 9001:2026 que não podem ser inferidos do código e requerem implementação formal pela Xtreme Sistemas)*

- [ ] **Pesquisa de Satisfação de Clientes e Usuários (Cláusula 9.1.2):**  
  *Ação Requerida:* Elaborar formulário de avaliação periódica (ex: pesquisa semestral de usabilidade e confiabilidade) aplicado aos contadores e clientes usuários do FiscalFlow.
- [ ] **Programa de Auditoria Interna da Qualidade (Cláusula 9.2):**  
  *Ação Requerida:* Definir cronograma anual de auditorias internas conduzidas por auditores capacitados e independentes dos processos auditados, com registro formal de relatórios de auditoria.
- [ ] **Análise Crítica pela Direção (Cláusula 9.3):**  
  *Ação Requerida:* Realizar reuniões documentadas da Alta Direção para avaliar os resultados dos indicadores da qualidade, status das ações corretivas, feedback de clientes e adequação de recursos.

---

## 8. Melhoria (Cláusula 10)

### 8.1. 🔧 Evidências de Melhoria Contínua Identificadas no Repositório
- **Adaptação Evolutiva a Normas Federais:** Evolução planejada e implementada para suporte dual de NFS-e (transição do padrão legado ABRASF para o novo Padrão Nacional / SPED) em `src/domain/parsers/nfse.parser.ts`.
- **Evolução de Usabilidade Baseada em Feedback:** Incorporação de alternância de tema escuro/claro e atalho de teclado `Alt+T` (`src/services/theme.service.ts`), atendendo a demandas de conforto visual em jornadas de auditoria extensas.
- **Manutenção Preventiva de Banco de Dados:** Criação de comando direto de `VACUUM` exposto ao usuário final para prevenção de degradação temporal de desempenho.

---

### 8.2. 📝 Modelo Estruturado de Ação Corretiva (RNC / CAPA)

*(Para uso da equipe na gestão de incidentes, bugs e desvios de processo)*

```markdown
┌────────────────────────────────────────────────────────────────────────────┐
│              RELATÓRIO DE NÃO CONFORMIDADE E AÇÃO CORRETIVA                │
├────────────────────────────────────────────────────────────────────────────┤
│ Número do Registro: RNC-2026-____                 Data: ___/___/2026       │
│ Origem: [ ] Auditoria Interna  [ ] Chamado de Cliente  [ ] Falha de Teste  │
├────────────────────────────────────────────────────────────────────────────┤
│ 1. DESCRIÇÃO DA NÃO CONFORMIDADE (O que ocorreu, onde e qual o impacto):   │
│ __________________________________________________________________________ │
│                                                                            │
│ 2. AÇÃO DE CONTENÇÃO IMEDIATA (Disposição imediata):                       │
│ __________________________________________________________________________ │
│                                                                            │
│ 3. ANÁLISE DE CAUSA RAIZ (Aplicação dos 5 Porquês ou Diagrama de Ishikawa):│
│ Por quê 1: _______________________________________________________________ │
│ Por quê 2: _______________________________________________________________ │
│ Por quê 3: _______________________________________________________________ │
│ Causa Raiz Identificada: ________________________________________________ │
│                                                                            │
│ 4. PLANO DE AÇÃO CORRETIVA (O que será feito para evitar repetição):       │
│ Ação: ____________________________________________________________________ │
│ Responsável: _______________________________ Prazo: ___/___/2026           │
│                                                                            │
│ 5. VERIFICAÇÃO DA EFICÁCIA (Realizada após decorrido o prazo da ação):     │
│ [ ] Eficaz — Não conformidade não recorreu                                 │
│ [ ] Ineficaz — Nova RNC aberta sob número: __________                     │
│ Avaliado por: ______________________________ Data: ___/___/2026            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Matriz de Aderência (Gap Analysis) — ISO 9001:2026

A tabela a seguir apresenta o grau de conformidade e prontidão dos requisitos do SGQ frente à norma **ISO 9001:2026**:

| Cláusula ISO 9001:2026 | Resumo do Requisito | Situação Atual | Observações e Evidências |
|---|---|---|---|
| **4.1 / 4.2** | Contexto da organização e partes interessadas | 🟡 **Parcialmente Coberto** | Escopo técnico, arquitetura e partes interessadas de software mapeadas; requer validação formal de estratégia e impacto climático pela direção. |
| **4.3 / 4.4** | Escopo do SGQ e processos | 🟢 **Documentado via Código** | Processos de ciclo de desenvolvimento, arquitetura em camadas e persistência descritos tecnicamente. |
| **5.1 / 5.2** | Liderança, cultura da qualidade e política | 🔴 **Requer Definição Organizacional** | Não inferível do repositório; modelo estruturado disponibilizado para preenchimento pela liderança. |
| **6.1** | Ações para abordar riscos e oportunidades | 🟢 **Documentado via Código** | Riscos técnicos de software e oportunidades mapeados; requer consolidação formal com riscos de negócio. |
| **6.2** | Objetivos da qualidade e planejamento | 🟡 **Parcialmente Coberto** | Metas técnicas definidas (0 erros no typecheck, 100% testes); metas de negócio a serem formalizadas. |
| **6.3** | Planejamento de mudanças | 🟢 **Documentado via Código** | Migrações de banco DDL controladas (`schema_migrations`) e fases de entrega registradas. |
| **7.1** | Recursos e infraestrutura | 🟢 **Documentado via Código** | Stack tecnológica declarada (Node.js, Vite, Rust, Tauri 2, SQLite). |
| **7.2 / 7.3** | Competência e conscientização | 🔴 **Requer Definição Organizacional** | Matriz de competências requer preenchimento pelo setor de recursos humanos / gestão. |
| **7.5** | Informação documentada | 🟢 **Documentado via Código** | Especificações, relatórios de fase e código-fonte padronizados e versionados. |
| **8.1 / 8.2** | Planejamento operacional e requisitos | 🟢 **Documentado via Código** | Requisitos funcionais (RF) e não funcionais (RNF) exaustivamente descritos em `REQUIREMENTS.md`. |
| **8.3** | Projeto e desenvolvimento de software | 🟢 **Documentado via Código** | Ciclo de 13 fases cumprido, tipagem estrita, suítes de teste Vitest e fixtures oficiais validadas. |
| **8.4** | Controle de processos e serviços externos | 🟡 **Parcialmente Coberto** | Dependências de terceiros listadas e auditadas em `DEPENDENCIES_AND_LICENSES.md`; requer política de homologação de fornecedores. |
| **8.5 / 8.6** | Produção, liberação e entrega | 🟢 **Documentado via Código** | Procedimento de build e empacotamento Windows (.exe e .msi) totalmente automatizado. |
| **8.7** | Controle de saídas não conformes | 🟢 **Documentado via Código** | Tratamento e segregação de erros de importação em `ImportService` e tabela `import_records`. |
| **9.1** | Monitoramento, medição e análise | 🟢 **Documentado via Código** | Suíte de testes automatizados e contagem de saúde da base em `SettingsService`. |
| **9.1.2** | Satisfação do cliente | 🔴 **Requer Definição Organizacional** | Requer instituição de pesquisa formal periódica com os usuários do sistema. |
| **9.2** | Auditoria interna | 🔴 **Requer Definição Organizacional** | Requer criação de programa e cronograma formal de auditoria interna da qualidade. |
| **9.3** | Análise crítica pela direção | 🔴 **Requer Definição Organizacional** | Requer atas de reuniões periódicas da alta administração para revisão dos resultados do SGQ. |
| **10.1 / 10.2**| Não conformidade e ação corretiva | 🟡 **Parcialmente Coberto** | Tratamento de erros técnicos ativo; requer adoção institucional do modelo formal de RNC/CAPA. |
| **10.3** | Melhoria contínua | 🟢 **Documentado via Código** | Evidenciada pela transição para novas legislações fiscais (NFS-e Nacional) e refatorações registradas. |

---

## 10. Aviso Importante sobre Certificação ISO 9001

> [!IMPORTANT]  
> **Declaração de Isenção sobre Certificação de Sistemas de Gestão:**  
> O presente documento tem a finalidade exclusiva de **organizar, formalizar e mapear as evidências técnicas e procedimentos de engenharia de software** do projeto FiscalFlow em alinhamento aos critérios da norma internacional **ISO 9001:2026**.  
> A existência deste manual de processos e matriz de conformidade **não constitui, sob nenhuma hipótese, uma certificação ISO 9001**.  
> A certificação oficial de um Sistema de Gestão da Qualidade exige a efetiva implementação de todos os processos organizacionais na rotina da empresa ao longo do tempo, culminando em processo formal de auditoria externa independente conduzido por um **Organismo Certificador Credenciado (OCC)** reconhecido pelo INMETRO ou entidade internacional de acreditação correspondente.

---
*Documento de Sistema de Gestão da Qualidade elaborado conforme a ISO 9001:2026 para o projeto FiscalFlow — Xtreme Sistemas.*
