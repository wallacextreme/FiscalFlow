# FiscalFlow — Modelo de Dados

## Entidades Principais

### Company (Empresa)

Representa uma empresa/cliente cujos documentos fiscais são gerenciados.

```typescript
interface Company {
  id: string;                    // UUID v4
  cnpj: string;                 // 14 dígitos, sem formatação
  razaoSocial: string;          // Razão social
  nomeFantasia?: string;        // Nome fantasia (opcional)
  inscricaoEstadual?: string;   // Inscrição estadual
  inscricaoMunicipal?: string;  // Inscrição municipal
  endereco?: CompanyAddress;    // Endereço
  regimeTributario?: RegimeTributario;
  ativa: boolean;               // Empresa ativa/inativa
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}

interface CompanyAddress {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  codigoMunicipio?: string;     // Código IBGE
  uf?: string;                  // UF (2 caracteres)
  cep?: string;                 // 8 dígitos
}

type RegimeTributario = 
  | 'simples_nacional'
  | 'simples_nacional_excesso'
  | 'regime_normal';
```

### FiscalDocument (Documento Fiscal)

Entidade genérica que representa qualquer documento fiscal importado.

```typescript
interface FiscalDocument {
  id: string;                    // UUID v4
  companyId: string;             // FK → Company
  tipo: DocumentType;            // Tipo do documento
  chaveAcesso?: string;         // Chave de acesso (44 dígitos, quando aplicável)
  numero: string;                // Número do documento
  serie?: string;                // Série
  dataEmissao: string;           // ISO 8601
  valorTotal: number;            // Valor total do documento
  
  // Emitente
  emitenteCnpjCpf: string;      // CNPJ ou CPF do emitente
  emitenteRazaoSocial: string;
  emitenteUf?: string;
  
  // Destinatário
  destinatarioCnpjCpf?: string;
  destinatarioRazaoSocial?: string;
  destinatarioUf?: string;
  
  // Valores de impostos
  valorICMS?: number;
  valorIPI?: number;
  valorPIS?: number;
  valorCOFINS?: number;
  valorISS?: number;
  
  // Status
  situacao: DocumentSituacao;
  
  // Armazenamento
  xmlOriginal: string;           // XML completo original
  xmlHash: string;               // SHA-256 do XML
  
  // Metadados
  nfeVersao?: string;            // Versão do layout (ex: "4.00")
  naturezaOperacao?: string;
  
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

type DocumentType = 
  | 'nfe'      // NF-e (modelo 55)
  | 'nfce'     // NFC-e (modelo 65)
  | 'nfse'     // NFS-e
  | 'cte'      // CT-e (modelo 57)
  | 'sped';    // SPED Fiscal

type DocumentSituacao = 
  | 'autorizada'
  | 'cancelada'
  | 'inutilizada'
  | 'denegada'
  | 'desconhecida';
```

### DocumentItem (Item do Documento)

```typescript
interface DocumentItem {
  id: string;                    // UUID v4
  documentId: string;            // FK → FiscalDocument
  numeroItem: number;            // Número sequencial do item
  codigo?: string;               // Código do produto/serviço
  descricao: string;             // Descrição do produto/serviço
  ncm?: string;                  // NCM (8 dígitos)
  cfop?: string;                 // CFOP (4 dígitos)
  unidade?: string;              // Unidade comercial
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  
  // Impostos do item
  baseCalculoICMS?: number;
  valorICMS?: number;
  aliquotaICMS?: number;
  valorIPI?: number;
  valorPIS?: number;
  valorCOFINS?: number;
  
  cst?: string;                  // CST ou CSOSN
  origem?: string;               // Origem da mercadoria
}
```

### ImportRecord (Registro de Importação)

```typescript
interface ImportRecord {
  id: string;                    // UUID v4
  companyId: string;             // FK → Company
  dataImportacao: string;        // ISO 8601
  totalArquivos: number;         // Total de arquivos processados
  importados: number;            // Importados com sucesso
  rejeitados: number;            // Rejeitados
  erros: number;                 // Erros
  detalhes: ImportDetail[];      // Detalhes por arquivo (armazenados como JSON)
}

interface ImportDetail {
  nomeArquivo: string;
  status: 'importado' | 'duplicado' | 'erro' | 'formato_invalido';
  mensagem?: string;
  documentId?: string;           // FK → FiscalDocument (quando importado)
}
```

### SpedFile (Arquivo SPED)

```typescript
interface SpedFile {
  id: string;                    // UUID v4
  companyId: string;             // FK → Company
  tipo: SpedType;                // Tipo do SPED
  periodo: string;               // YYYYMM
  dataInicio: string;            // ISO 8601
  dataFim: string;               // ISO 8601
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  
  // Metadados
  versaoLayout: string;          // Ex: "018", "019"
  finalidade: SpedFinalidade;
  
  // Armazenamento
  conteudoOriginal: string;      // Texto original completo
  conteudoHash: string;          // SHA-256
  
  // Totais resumidos
  totalRegistros: number;
  
  createdAt: string;
  updatedAt: string;
}

type SpedType = 
  | 'efd_icms_ipi'       // SPED Fiscal
  | 'efd_contribuicoes'; // SPED Contribuições (futuro)

type SpedFinalidade = 
  | 'original'
  | 'retificadora';
```

## Relacionamentos

```
Company (1) ─── (N) FiscalDocument
Company (1) ─── (N) SpedFile
Company (1) ─── (N) ImportRecord
FiscalDocument (1) ─── (N) DocumentItem
```

## Regras de Domínio

1. **Chave de acesso é única** por empresa e tipo de documento
2. **XML original NUNCA é modificado** após importação
3. **Hash SHA-256** é calculado na importação e pode ser reverificado
4. **Deleção de empresa** requer confirmação e opcionalmente remove documentos vinculados
5. **Deleção de documento** remove itens em cascata
6. **CNPJ é armazenado sem formatação** (apenas dígitos)
7. **Valores monetários** são armazenados como `REAL` no SQLite
8. **Datas** são armazenadas como `TEXT` no formato ISO 8601
9. **UUIDs** são gerados no frontend com `crypto.randomUUID()`
