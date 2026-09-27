# FiscalFlow — Arquitetura PDF

## Visão Geral

O FiscalFlow pode gerar representações visuais de documentos fiscais (DANFE) em formato PDF.

**Importante**: Esta funcionalidade é de prioridade MÉDIA e será implementada nas fases finais.

## Escopo v1.0

Na versão 1.0, a geração de PDF será limitada a:

1. **Visualização DANFE simplificada** — representação visual dos dados da NF-e em tela (HTML/CSS)
2. **Exportação de detalhes** — dados do documento formatados em layout imprimível

## Abordagem

### DANFE em Tela (HTML)

Em vez de gerar PDF real, renderizar uma visualização HTML que:
- Apresenta os dados no layout visual do DANFE
- Pode ser impressa via `window.print()` (CSS `@media print`)
- Não requer biblioteca de geração de PDF

### Futura Geração de PDF

Se for necessário gerar PDF real (download):
- Avaliar `jsPDF` ou geração via Rust (wkhtmltopdf, printpdf crate)
- Criar ADR antes de implementar
- Não adicionar dependência sem justificativa

## Princípios

1. PDF/DANFE é sempre um **DERIVADO** do documento original
2. O XML original nunca é alterado
3. A visualização é **informativa**, não tem validade jurídica
4. O DANFE gerado pelo FiscalFlow é para consulta interna, não para impressão fiscal oficial
