# FiscalFlow — UI/UX

## Filosofia

A interface do FiscalFlow deve parecer um **software desktop profissional**, não um website.

Inspirações visuais: VS Code, Figma, Linear, Notion.

## Design System

### Tema

**Dark mode como padrão** (com opção de light mode).

### Cores (Dark Mode)

```css
:root {
  /* Fundo */
  --bg-primary: #0f1117;       /* Fundo principal */
  --bg-secondary: #1a1d27;     /* Sidebar, cards */
  --bg-tertiary: #242836;      /* Inputs, áreas elevadas */
  --bg-hover: #2d3248;         /* Hover states */
  
  /* Texto */
  --text-primary: #e4e7ef;     /* Texto principal */
  --text-secondary: #8b92a8;   /* Texto secundário */
  --text-muted: #5c6378;       /* Texto desabilitado */
  
  /* Acentuação */
  --accent-primary: #6366f1;   /* Ações primárias (indigo) */
  --accent-primary-hover: #818cf8;
  --accent-success: #22c55e;   /* Sucesso */
  --accent-warning: #f59e0b;   /* Alerta */
  --accent-danger: #ef4444;    /* Erro/perigo */
  --accent-info: #3b82f6;      /* Informação */
  
  /* Bordas */
  --border-primary: #2d3248;
  --border-secondary: #3d4460;
  
  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

### Tipografia

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.8125rem;  /* 13px */
--font-size-base: 0.875rem; /* 14px — base para desktop */
--font-size-lg: 1rem;       /* 16px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
```

### Espaçamento

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
```

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header (título da página, ações, busca global)             │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │              Content Area                        │
│          │                                                  │
│ - Dashboard              (Listagens, formulários,           │
│ - Documentos              detalhes, modais)                 │
│ - Empresas                                                  │
│ - Importar                                                  │
│ - SPED                                                      │
│ - Configurações                                             │
│          │                                                  │
│          │                                                  │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│  Status Bar (empresa ativa, total de docs, versão)          │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar

- Largura fixa: ~220px
- Itens com ícone + texto
- Item ativo destacado
- Empresa ativa exibida no topo
- Collapsible em telas menores

### Header

- Título da página atual
- Ações contextuais (ex: botão "Importar" na tela de documentos)
- Campo de busca global

### Content Area

- Área principal de conteúdo
- Padding interno consistente
- Scroll independente do sidebar

### Status Bar

- Informações rápidas: empresa ativa, total de documentos, versão
- Altura fixa: ~28px

## Componentes

### Tabelas

- Headers fixos
- Colunas alinhadas (texto à esquerda, valores à direita)
- Hover nas linhas
- Zebra striping sutil
- Paginação no rodapé
- Indicador de ordenação

### Botões

| Tipo | Uso |
|---|---|
| Primary | Ação principal (ex: Importar, Salvar) |
| Secondary | Ação secundária (ex: Cancelar, Voltar) |
| Danger | Ação destrutiva (ex: Excluir) |
| Ghost | Ação terciária (ex: links de ação em tabelas) |
| Icon | Ação com ícone apenas (ex: fechar modal) |

### Modais

- Overlay escuro semi-transparente
- Centralizado vertical e horizontalmente
- Animação de entrada/saída
- Botão de fechar (X)
- Footer com botões de ação

### Inputs

- Altura padrão: 36px
- Border radius: var(--radius-md)
- Placeholder com cor muted
- Focus com borda accent
- Estado de erro com borda danger

### Badges/Tags

- Tipo de documento (NF-e, NFS-e, CT-e, SPED)
- Situação (autorizada = verde, cancelada = vermelho, etc.)
- Cores distintas por tipo

### Estados

| Estado | Visual |
|---|---|
| Loading | Spinner ou skeleton |
| Vazio | Ilustração + mensagem + call to action |
| Erro | Mensagem clara + ação de retry |
| Sucesso | Toast notification temporária |

## Ícones

Usar ícones SVG inline (Lucide Icons ou similar).

Não adicionar biblioteca pesada de ícones. Copiar os SVGs necessários diretamente.

## Responsividade

- Janela mínima: 1024x600
- Sidebar recolhível
- Tabelas com scroll horizontal quando necessário
- Formulários ajustam-se ao espaço disponível

## Acessibilidade

- Contraste adequado (WCAG AA)
- Labels em todos os campos
- Focus visible em todos os interativos
- Navegação por teclado (Tab, Enter, Escape)
- `role` e `aria-*` quando apropriado

## Animações

- Transições de rota: fade 150ms
- Hover: transition 150ms
- Modais: fade + scale 200ms
- Toasts: slide in/out 300ms
- Loading spinners: CSS animation (não GIF)

Preferir `transform` e `opacity` para animações (GPU-accelerated).
