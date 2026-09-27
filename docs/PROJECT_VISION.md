# FiscalFlow — Visão do Projeto

## Empresa

**Xtreme Sistemas**

## Nome

**FiscalFlow**

## Descrição

FiscalFlow é uma aplicação desktop para **gestão, consulta, validação e organização de documentos fiscais eletrônicos brasileiros**.

O sistema permite que contadores, analistas fiscais e empresas importem, visualizem, pesquisem e validem documentos fiscais (NF-e, NFS-e, CT-e, SPED) de forma eficiente, segura e offline.

## Público-alvo

| Perfil | Necessidade |
|---|---|
| Escritórios de contabilidade | Gerenciar documentos fiscais de múltiplos clientes |
| Departamentos fiscais de empresas | Controle interno de notas recebidas e emitidas |
| Analistas tributários | Consulta rápida e validação de XMLs fiscais |
| Auditores | Verificação de integridade e conformidade de documentos |

## Proposta de Valor

1. **Offline-first**: funciona sem dependência de internet após instalação
2. **Desktop nativo**: performance e integração com o sistema operacional via Tauri 2
3. **Multi-formato**: suporte a NF-e, NFS-e, CT-e, SPED Fiscal (EFD ICMS/IPI)
4. **Importação em massa**: arrastar e soltar ou selecionar múltiplos XMLs
5. **Busca avançada**: pesquisa por chave, CNPJ, data, valor, produto
6. **Validação**: verificação estrutural dos XMLs contra schemas oficiais
7. **Visualização DANFE**: geração de representação visual do documento fiscal
8. **Exportação**: CSV, PDF, relatórios
9. **Segurança**: dados locais, sem envio para servidores externos
10. **Multi-empresa**: suporte a múltiplas empresas/clientes

## O que NÃO é

- **NÃO é um emissor de notas fiscais** (não emite NF-e, NFS-e, etc.)
- **NÃO faz comunicação com SEFAZ** (não transmite, não consulta status)
- **NÃO é um ERP** (não gerencia estoque, financeiro, etc.)
- **NÃO é um sistema contábil** (não faz escrituração contábil)

## Modelo de Distribuição

Aplicação desktop instalável para Windows (prioritário), com possibilidade futura de Linux e macOS.

## Licenciamento

Proprietário — Xtreme Sistemas.
