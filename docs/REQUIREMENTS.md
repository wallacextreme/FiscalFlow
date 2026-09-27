# FiscalFlow — Requisitos

## RF — Requisitos Funcionais

### RF-01: Gestão de Empresas

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01.1 | Cadastrar empresa (CNPJ, razão social, nome fantasia, IE, IM, endereço, regime tributário) | Alta |
| RF-01.2 | Editar dados da empresa | Alta |
| RF-01.3 | Excluir empresa (com confirmação e sem documentos vinculados, ou com opção de exclusão em cascata) | Alta |
| RF-01.4 | Listar empresas cadastradas | Alta |
| RF-01.5 | Pesquisar empresa por CNPJ ou razão social | Média |
| RF-01.6 | Definir empresa padrão/ativa | Média |

### RF-02: Importação de Documentos

| ID | Requisito | Prioridade |
|---|---|---|
| RF-02.1 | Importar arquivo XML individual via seleção de arquivo | Alta |
| RF-02.2 | Importar múltiplos XMLs de um diretório | Alta |
| RF-02.3 | Importar via drag and drop | Alta |
| RF-02.4 | Detectar automaticamente o tipo de documento (NF-e, NFS-e, CT-e) pelo conteúdo XML | Alta |
| RF-02.5 | Validar estrutura XML antes de importar | Alta |
| RF-02.6 | Rejeitar arquivos duplicados (mesma chave de acesso) | Alta |
| RF-02.7 | Exibir progresso da importação | Média |
| RF-02.8 | Exibir relatório pós-importação (importados, rejeitados, erros) | Média |
| RF-02.9 | Armazenar XML original sem modificação (hash SHA-256) | Alta |
| RF-02.10 | Importar arquivos SPED (formato texto posicional) | Média |

### RF-03: Visualização de Documentos

| ID | Requisito | Prioridade |
|---|---|---|
| RF-03.1 | Listar documentos importados com paginação | Alta |
| RF-03.2 | Exibir detalhes do documento (emitente, destinatário, itens, totais, impostos) | Alta |
| RF-03.3 | Visualizar XML original formatado | Média |
| RF-03.4 | Gerar visualização DANFE (representação visual da NF-e) | Média |
| RF-03.5 | Visualizar dados de cada item da nota | Alta |
| RF-03.6 | Exibir informações complementares | Média |

### RF-04: Pesquisa e Filtros

| ID | Requisito | Prioridade |
|---|---|---|
| RF-04.1 | Pesquisar por chave de acesso | Alta |
| RF-04.2 | Pesquisar por número da nota | Alta |
| RF-04.3 | Pesquisar por CNPJ/CPF (emitente ou destinatário) | Alta |
| RF-04.4 | Filtrar por tipo de documento (NF-e, NFS-e, CT-e) | Alta |
| RF-04.5 | Filtrar por período (data de emissão) | Alta |
| RF-04.6 | Filtrar por empresa | Alta |
| RF-04.7 | Filtrar por situação (autorizada, cancelada, inutilizada) | Média |
| RF-04.8 | Pesquisar por nome/descrição de produto | Média |
| RF-04.9 | Pesquisar por valor (faixa de valores) | Média |
| RF-04.10 | Ordenação por colunas | Média |

### RF-05: Validação de Documentos

| ID | Requisito | Prioridade |
|---|---|---|
| RF-05.1 | Validar estrutura XML contra schema XSD | Média |
| RF-05.2 | Validar campos obrigatórios | Média |
| RF-05.3 | Validar dígito verificador de chave de acesso | Alta |
| RF-05.4 | Exibir resultado de validação com lista de problemas encontrados | Média |
| RF-05.5 | Verificar integridade do XML armazenado (hash SHA-256) | Média |

### RF-06: Exportação

| ID | Requisito | Prioridade |
|---|---|---|
| RF-06.1 | Exportar lista de documentos em CSV | Média |
| RF-06.2 | Exportar detalhes do documento em PDF | Baixa |
| RF-06.3 | Exportar XML original | Média |
| RF-06.4 | Exportar relatório de importação | Baixa |

### RF-07: Dashboard

| ID | Requisito | Prioridade |
|---|---|---|
| RF-07.1 | Exibir quantidade de documentos por tipo | Média |
| RF-07.2 | Exibir valor total por período | Média |
| RF-07.3 | Exibir documentos recentes | Média |
| RF-07.4 | Exibir estatísticas por empresa | Baixa |

### RF-08: Configurações

| ID | Requisito | Prioridade |
|---|---|---|
| RF-08.1 | Configurar diretório padrão de importação | Baixa |
| RF-08.2 | Configurar tema (claro/escuro) | Baixa |
| RF-08.3 | Configurar backup do banco de dados | Baixa |

---

## RNF — Requisitos Não-Funcionais

### RNF-01: Desempenho

| ID | Requisito |
|---|---|
| RNF-01.1 | Importação de 100 XMLs deve completar em menos de 30 segundos |
| RNF-01.2 | Listagem de documentos com paginação deve carregar em menos de 500ms |
| RNF-01.3 | Pesquisa por texto deve retornar resultados em menos de 1 segundo |
| RNF-01.4 | Aplicação deve iniciar em menos de 3 segundos |

### RNF-02: Usabilidade

| ID | Requisito |
|---|---|
| RNF-02.1 | Interface deve ser responsiva (adaptar-se a diferentes tamanhos de janela) |
| RNF-02.2 | Interface deve seguir padrões de aplicações desktop (menus, atalhos, etc.) |
| RNF-02.3 | Feedback visual para todas as operações (loading, sucesso, erro) |
| RNF-02.4 | Mensagens de erro devem ser claras e orientar o usuário |

### RNF-03: Segurança

| ID | Requisito |
|---|---|
| RNF-03.1 | Dados armazenados exclusivamente no dispositivo local |
| RNF-03.2 | XMLs originais devem ser preservados sem alteração |
| RNF-03.3 | Hash SHA-256 para verificação de integridade |
| RNF-03.4 | Nenhuma comunicação externa sem consentimento explícito |

### RNF-04: Confiabilidade

| ID | Requisito |
|---|---|
| RNF-04.1 | Operações no banco devem ser atômicas (transações) |
| RNF-04.2 | Importação com erro parcial não deve corromper dados existentes |
| RNF-04.3 | Backup e restore do banco de dados |

### RNF-05: Manutenibilidade

| ID | Requisito |
|---|---|
| RNF-05.1 | Código organizado em camadas (UI, serviços, domínio, persistência) |
| RNF-05.2 | Separação clara entre parser de documentos e lógica de negócio |
| RNF-05.3 | Testes unitários para parsers e validadores |
| RNF-05.4 | Documentação técnica atualizada |

### RNF-06: Compatibilidade

| ID | Requisito |
|---|---|
| RNF-06.1 | Windows 10+ (64-bit) como plataforma prioritária |
| RNF-06.2 | NF-e versão 4.00 (layout vigente) |
| RNF-06.3 | NFS-e Padrão Nacional e ABRASF 2.04 (período de transição) |
| RNF-06.4 | SPED Fiscal EFD ICMS/IPI (leiaute versão 018/019) |
