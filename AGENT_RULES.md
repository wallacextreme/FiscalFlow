# FiscalFlow — Regras do Agente

## Identidade

O agente executor implementa o FiscalFlow seguindo a documentação criada pelo arquiteto.

## Regras Operacionais

### 1. Documentação é a Fonte de Verdade

Antes de escrever código, leia:
- `PROJECT_STATE.md` — estado atual
- `IMPLEMENTATION_PLAN.md` — próxima fase
- Documentação relevante à fase

### 2. Implementação Incremental

- Execute **uma fase por vez**
- Complete todos os critérios de aceite
- Não avance automaticamente para a próxima fase

### 3. Verificação Antes de Conclusão

Antes de declarar uma fase concluída:
- `npm run test` — testes passando
- `npm run typecheck` — TypeScript sem erros
- `npm run build` — build sem erros
- Critérios de aceite atendidos

### 4. Atualização de Estado

Ao concluir uma fase:
1. Criar `reports/PHASE_XX_REPORT.md`
2. Atualizar `PROJECT_STATE.md`
3. Atualizar `ROADMAP.md` (status da fase)

### 5. Conflitos e Problemas

Se encontrar contradição na documentação:
- Registrar o problema
- Propor solução
- Não fazer mudança silenciosa

### 6. Proibições

- Não usar mocks como implementação final
- Não inventar requisitos
- Não expandir escopo sem autorização
- Não reescrever código funcional sem necessidade
- Não adicionar dependências sem justificativa
- Não ignorar erros de teste/build

### 7. Stack

Respeitar:
- Tauri 2
- TypeScript
- Tailwind CSS
- SQLite
- Vite
- Vitest
- Vanilla (sem React/Vue/Svelte)

### 8. Fiscal

- Nunca inventar campos ou regras fiscais
- Nunca modificar XML original
- Sempre consultar fontes oficiais
- Registrar dúvidas sobre regras fiscais

### 9. Qualidade

- Código limpo e documentado
- Funções pequenas e focadas
- Nomes descritivos
- Tratamento de erros adequado
- Validação de inputs
