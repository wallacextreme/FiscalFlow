# FiscalFlow — Arquitetura de Assinatura Digital

## Visão Geral

O FiscalFlow v1.0 **NÃO implementa** assinatura digital.

## Justificativa

O FiscalFlow é um **leitor/organizador** de documentos fiscais, não um emissor.

Documentos importados já vêm assinados digitalmente pela origem (sistema emissor + SEFAZ).

## Escopo Futuro

Se no futuro for necessário:

1. **Validação de assinatura digital** — verificar se a assinatura XML-DSig do documento é válida
2. **Certificados A1/A3** — para eventual consulta de status na SEFAZ

Essas funcionalidades requerem:
- ADR específico
- Análise de segurança
- Possivelmente implementação em Rust (manipulação de certificados)
- Seguir rigorosamente as regras de SECURITY.md

## Regras Absolutas (para qualquer versão futura)

1. **NUNCA** armazenar senha de certificado em texto puro
2. **NUNCA** expor chave privada em logs ou console
3. **NUNCA** criar assinatura digital falsa ou de teste em produção
4. **NUNCA** afirmar validade jurídica de uma assinatura sem base técnica
5. **SEMPRE** usar criptografia adequada (bibliotecas auditadas)
