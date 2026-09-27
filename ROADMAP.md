# FiscalFlow — Roadmap

## Versão 1.0

### Fase 01 — Fundação do Projeto ✅
Scaffolding Tauri 2 + Vite + TypeScript + Tailwind CSS. Configuração base.

### Fase 02 — Banco de Dados e Migrações ✅
Conexão SQLite, schema inicial, sistema de migrações, repositories base.

### Fase 03 — Design System e Layout ✅
CSS do design system, layout principal (sidebar, header, content area, status bar), router SPA.

### Fase 04 — Gestão de Empresas ✅
CRUD completo de empresas. Formulários, listagem, edição, exclusão.

### Fase 05 — Infraestrutura de Importação ✅
Sistema de importação genérico: file picker, detecção de tipo, pipeline de processamento, feedback.

### Fase 06 — NF-e ✅
Parser de NF-e, importação de NF-e, listagem, detalhes, itens, validação, busca.

### Fase 07 — NFS-e ✅
Parser de NFS-e (Padrão Nacional + ABRASF), importação, listagem, detalhes.

### Fase 08 — CT-e ✅
Parser de CT-e, importação, listagem, detalhes.

### Fase 09 — SPED Fiscal ✅
Parser de SPED EFD ICMS/IPI, importação de arquivos texto, visualização resumida.

### Fase 10 — Dashboard ✅
Estatísticas, totais por período, gráficos simples, documentos recentes.

### Fase 11 — Exportação ✅
Exportação CSV, exportação XML original, exportação de relatórios.

### Fase 12 — Configurações e Polish ✅
Configurações da aplicação, tema light/dark, backup, refinamento de UX.

### Fase 13 — Testes e QA Final ✅
Cobertura de testes completa, testes de regressão, correções finais.

---

## Legenda

- ✏️ = Planejado
- 🔧 = Em andamento
- ✅ = Concluído

## Observações

- Cada fase produz um relatório (`reports/PHASE_XX_REPORT.md`)
- `PROJECT_STATE.md` é atualizado ao final de cada fase
- Fases são executadas sequencialmente
- Não avançar para a próxima fase sem a anterior estar validada
