import type { Migration } from '../types.ts';

export const migration001: Migration = {
  version: 1,
  description: 'Schema inicial do FiscalFlow',
  sql: `
-- ============================================================
-- Tabela: companies
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    cnpj TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    municipio TEXT,
    codigo_municipio TEXT,
    uf TEXT,
    cep TEXT,
    regime_tributario TEXT,
    ativa INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_razao_social ON companies(razao_social);

-- ============================================================
-- Tabela: fiscal_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS fiscal_documents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('nfe', 'nfce', 'nfse', 'cte', 'sped')),
    chave_acesso TEXT,
    numero TEXT NOT NULL,
    serie TEXT,
    data_emissao TEXT NOT NULL,
    valor_total REAL NOT NULL DEFAULT 0,
    
    -- Emitente
    emitente_cnpj_cpf TEXT NOT NULL,
    emitente_razao_social TEXT NOT NULL,
    emitente_uf TEXT,
    
    -- Destinatário
    destinatario_cnpj_cpf TEXT,
    destinatario_razao_social TEXT,
    destinatario_uf TEXT,
    
    -- Impostos
    valor_icms REAL,
    valor_ipi REAL,
    valor_pis REAL,
    valor_cofins REAL,
    valor_iss REAL,
    
    -- Status
    situacao TEXT NOT NULL DEFAULT 'autorizada' 
        CHECK(situacao IN ('autorizada', 'cancelada', 'inutilizada', 'denegada', 'desconhecida')),
    
    -- Armazenamento
    xml_original TEXT NOT NULL,
    xml_hash TEXT NOT NULL,
    
    -- Metadados
    nfe_versao TEXT,
    natureza_operacao TEXT,
    
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscal_documents_chave 
    ON fiscal_documents(company_id, chave_acesso) WHERE chave_acesso IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_company 
    ON fiscal_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_tipo 
    ON fiscal_documents(tipo);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_data 
    ON fiscal_documents(data_emissao);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_emitente 
    ON fiscal_documents(emitente_cnpj_cpf);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_destinatario 
    ON fiscal_documents(destinatario_cnpj_cpf);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_numero 
    ON fiscal_documents(numero);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_valor 
    ON fiscal_documents(valor_total);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_situacao 
    ON fiscal_documents(situacao);

-- ============================================================
-- Tabela: document_items
-- ============================================================
CREATE TABLE IF NOT EXISTS document_items (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    numero_item INTEGER NOT NULL,
    codigo TEXT,
    descricao TEXT NOT NULL,
    ncm TEXT,
    cfop TEXT,
    unidade TEXT,
    quantidade REAL NOT NULL DEFAULT 0,
    valor_unitario REAL NOT NULL DEFAULT 0,
    valor_total REAL NOT NULL DEFAULT 0,
    
    -- Impostos do item
    base_calculo_icms REAL,
    valor_icms REAL,
    aliquota_icms REAL,
    valor_ipi REAL,
    valor_pis REAL,
    valor_cofins REAL,
    
    cst TEXT,
    origem TEXT,
    
    FOREIGN KEY (document_id) REFERENCES fiscal_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_items_document 
    ON document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_document_items_descricao 
    ON document_items(descricao);
CREATE INDEX IF NOT EXISTS idx_document_items_ncm 
    ON document_items(ncm);
CREATE INDEX IF NOT EXISTS idx_document_items_cfop 
    ON document_items(cfop);

-- ============================================================
-- Tabela: import_records
-- ============================================================
CREATE TABLE IF NOT EXISTS import_records (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    data_importacao TEXT NOT NULL DEFAULT (datetime('now')),
    total_arquivos INTEGER NOT NULL DEFAULT 0,
    importados INTEGER NOT NULL DEFAULT 0,
    rejeitados INTEGER NOT NULL DEFAULT 0,
    erros INTEGER NOT NULL DEFAULT 0,
    detalhes TEXT,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_import_records_company 
    ON import_records(company_id);
CREATE INDEX IF NOT EXISTS idx_import_records_data 
    ON import_records(data_importacao);

-- ============================================================
-- Tabela: sped_files
-- ============================================================
CREATE TABLE IF NOT EXISTS sped_files (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('efd_icms_ipi', 'efd_contribuicoes')),
    periodo TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    data_fim TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    inscricao_estadual TEXT,
    versao_layout TEXT NOT NULL,
    finalidade TEXT NOT NULL DEFAULT 'original' 
        CHECK(finalidade IN ('original', 'retificadora')),
    conteudo_original TEXT NOT NULL,
    conteudo_hash TEXT NOT NULL,
    total_registros INTEGER NOT NULL DEFAULT 0,
    
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sped_files_company 
    ON sped_files(company_id);
CREATE INDEX IF NOT EXISTS idx_sped_files_periodo 
    ON sped_files(periodo);
CREATE INDEX IF NOT EXISTS idx_sped_files_tipo 
    ON sped_files(tipo);

-- ============================================================
-- Tabela: app_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'dark');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('default_company_id', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('page_size', '50');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('schema_version', '1');
`
};
