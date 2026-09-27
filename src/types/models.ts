/**
 * FiscalFlow — Domain Models and Types
 * 
 * Based on DATA_MODEL.md specification
 */

export interface CompanyAddress {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  codigoMunicipio?: string;     // Código IBGE (7 dígitos)
  uf?: string;                  // UF (2 caracteres)
  cep?: string;                 // 8 dígitos numéricos
}

export type RegimeTributario = 
  | 'simples_nacional'
  | 'simples_nacional_excesso'
  | 'regime_normal';

export interface Company {
  id: string;                    // UUID v4
  cnpj: string;                 // 14 dígitos sem formatação
  razaoSocial: string;          // Razão social
  nomeFantasia?: string;        // Nome fantasia
  inscricaoEstadual?: string;   // Inscrição estadual
  inscricaoMunicipal?: string;  // Inscrição municipal
  endereco?: CompanyAddress;    // Endereço detalhado
  regimeTributario?: RegimeTributario;
  ativa: boolean;               // Empresa ativa/inativa
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}

export type DocumentType = 
  | 'nfe'      // NF-e (modelo 55)
  | 'nfce'     // NFC-e (modelo 65)
  | 'nfse'     // NFS-e (serviço)
  | 'cte'      // CT-e (modelo 57)
  | 'sped';    // SPED Fiscal

export type DocumentSituacao = 
  | 'autorizada'
  | 'cancelada'
  | 'inutilizada'
  | 'denegada'
  | 'desconhecida';

export interface FiscalDocument {
  id: string;                    // UUID v4
  companyId: string;             // FK -> Company
  tipo: DocumentType;            // Tipo do documento
  chaveAcesso?: string;         // Chave de acesso (44 dígitos quando aplicável)
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
  
  // Impostos
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

export interface DocumentItem {
  id: string;                    // UUID v4
  documentId: string;            // FK -> FiscalDocument
  numeroItem: number;            // Número sequencial do item
  codigo?: string;               // Código do produto/serviço
  descricao: string;             // Descrição do produto/serviço
  ncm?: string;                  // NCM (8 dígitos)
  cfop?: string;                 // CFOP (4 dígitos)
  unidade?: string;              // Unidade comercial (UN, CX, KG, etc)
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

export type ImportStatus = 'importado' | 'duplicado' | 'erro' | 'formato_invalido';

export interface ImportDetail {
  nomeArquivo: string;
  status: ImportStatus;
  mensagem?: string;
  documentId?: string;           // FK -> FiscalDocument (quando importado)
}

export interface ImportRecord {
  id: string;                    // UUID v4
  companyId: string;             // FK -> Company
  dataImportacao: string;        // ISO 8601
  totalArquivos: number;         // Total de arquivos processados
  importados: number;            // Importados com sucesso
  rejeitados: number;            // Rejeitados (duplicados ou formatos inválidos)
  erros: number;                 // Erros de parsing ou processamento
  detalhes: ImportDetail[];      // Detalhes por arquivo
}

export type SpedType = 'efd_icms_ipi' | 'efd_contribuicoes';
export type SpedFinalidade = 'original' | 'retificadora';

export interface SpedFile {
  id: string;                    // UUID v4
  companyId: string;             // FK -> Company
  tipo: SpedType;
  periodo: string;               // YYYYMM
  dataInicio: string;            // ISO 8601
  dataFim: string;               // ISO 8601
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  versaoLayout: string;
  finalidade: SpedFinalidade;
  conteudoOriginal: string;
  conteudoHash: string;
  totalRegistros: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface SchemaMigration {
  version: number;
  appliedAt: string;
  description?: string;
}

export interface DatabaseStats {
  companies: number;
  fiscalDocuments: number;
  documentItems: number;
  spedFiles: number;
  importRecords: number;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appVersion: string;
  companies: Company[];
  fiscalDocuments: FiscalDocument[];
  documentItems: DocumentItem[];
  spedFiles: SpedFile[];
  importRecords: ImportRecord[];
  appSettings: AppSetting[];
}
