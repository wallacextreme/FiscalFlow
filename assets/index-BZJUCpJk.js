const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./dist-js-DtbDBZO9.js","./core-BPkSFkIs.js","./browser-sqlite-BGS-9zZU.js","./rolldown-runtime-ClPy5LxC.js","./dist-js-CyvBJpFd.js","./dist-js-DyYppoCF.js","./__vite-browser-external-5CQ71iAt.js"])))=>i.map(i=>d[i]);
import{n as Mt,r as re,t as pe}from"./rolldown-runtime-ClPy5LxC.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))l(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&l(o)}).observe(document,{childList:!0,subtree:!0});function i(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function l(s){if(s.ep)return;s.ep=!0;const a=i(s);fetch(s.href,a)}})();var ue={version:1,description:"Schema inicial do FiscalFlow",sql:`
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
`},me=[ue];function he(t){return t.split(";").map(e=>e.trim()).filter(e=>e?e.replace(/--.*$/gm,"").trim().length>0:!1)}var Ht=class{migrations;constructor(t=me){this.migrations=[...t].sort((e,i)=>e.version-i.version)}async ensureMigrationTable(t){await t.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now')),
        description TEXT
      );
    `)}async getAppliedMigrations(t){return await this.ensureMigrationTable(t),(await t.select("SELECT version, applied_at, description FROM schema_migrations ORDER BY version ASC")).map(e=>({version:e.version,appliedAt:e.applied_at,description:e.description}))}async getCurrentVersion(t){const e=await this.getAppliedMigrations(t);return e.length===0?0:Math.max(...e.map(i=>i.version))}async runMigrations(t){await this.ensureMigrationTable(t);try{await t.execute("PRAGMA foreign_keys = ON;")}catch{}const e=await this.getAppliedMigrations(t),i=new Set(e.map(a=>a.version));let l=0;for(const a of this.migrations){if(i.has(a.version))continue;console.info(`Applying migration ${a.version}: ${a.description}`);const o=he(a.sql);for(const n of o)await t.execute(n);await t.execute("INSERT INTO schema_migrations (version, description) VALUES (?, ?)",[a.version,a.description]);try{await t.execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",["schema_version",String(a.version)])}catch{}l++}const s=await this.getCurrentVersion(t);return{applied:l,currentVersion:s}}},ve="modulepreload",fe=function(t,e){return new URL(t,e).href},Qt={},It=function(e,i,l){let s=Promise.resolve();if(i&&i.length>0){let v=function(b){return Promise.all(b.map(p=>Promise.resolve(p).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))},w=function(b){return import.meta.resolve?import.meta.resolve(b):new URL(b,import.meta.url).href};const o=document.getElementsByTagName("link"),n=document.querySelector("meta[property=csp-nonce]"),u=n?.nonce||n?.getAttribute("nonce");s=v(i.map(b=>{if(b=fe(b,l),b=w(b),b in Qt)return;Qt[b]=!0;const p=b.endsWith(".css");for(let h=o.length-1;h>=0;h--){const d=o[h];if(d.href===b&&(!p||d.rel==="stylesheet"))return}const m=document.createElement("link");if(m.rel=p?"stylesheet":ve,p||(m.as="script"),m.crossOrigin="",m.href=b,u&&m.setAttribute("nonce",u),document.head.appendChild(m),p)return new Promise((h,d)=>{m.addEventListener("load",h),m.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${b}`)))})}).filter(b=>b!==void 0))}function a(o){const n=new Event("vite:preloadError",{cancelable:!0});if(n.payload=o,window.dispatchEvent(n),!n.defaultPrevented)throw o}return s.then(o=>{for(const n of o||[])n.status==="rejected"&&a(n.reason);return e().catch(a)})},_t=null,ge=class{client;constructor(t){this.client=t}async execute(t,e){const i=await this.client.execute(t,e??[]);return{rowsAffected:i.rowsAffected??0,lastInsertId:i.lastInsertId??0}}async select(t,e){return this.client.select(t,e??[])}async close(){return this.client&&typeof this.client.close=="function"?this.client.close():!0}};function At(){if(!_t)throw new Error("Database not initialized. Call initDatabase() first.");return _t}async function ye(t){if(t)return _t=t,await new Ht().runMigrations(_t),_t;if(typeof window<"u"&&"__TAURI_INTERNALS__"in window)try{const e=await It(()=>import("./dist-js-DtbDBZO9.js"),__vite__mapDeps([0,1]),import.meta.url),i=await(e.default||e).load("sqlite:fiscalflow.db");_t=new ge(i);const l=await new Ht().runMigrations(_t);return console.info(`Tauri SQLite database initialized successfully. Version: ${l.currentVersion}`),_t}catch(e){throw console.error("Failed to initialize Tauri SQL database:",e),e}try{const{initBrowserSqlite:e}=await It(async()=>{const{initBrowserSqlite:l}=await import("./browser-sqlite-BGS-9zZU.js");return{initBrowserSqlite:l}},__vite__mapDeps([2,3]),import.meta.url);_t=await e();const i=await new Ht().runMigrations(_t);return console.info(`Browser WebAssembly SQLite initialized successfully. Version: ${i.currentVersion}`),_t}catch(e){throw console.error("Failed to initialize Browser WebAssembly SQLite database:",e),e}}var be=class{currentTheme="dark";listeners=[];constructor(){this.init()}init(){if(typeof window>"u")return;const t=localStorage.getItem("fiscalflow_theme");t==="dark"||t==="light"?this.currentTheme=t:this.currentTheme="dark",this.applyTheme(this.currentTheme)}getTheme(){return this.currentTheme}setTheme(t){this.currentTheme=t,typeof window<"u"&&(localStorage.setItem("fiscalflow_theme",t),this.applyTheme(t)),this.notifyListeners()}toggleTheme(){const t=this.currentTheme==="dark"?"light":"dark";return this.setTheme(t),t}onChange(t){return this.listeners.push(t),()=>{this.listeners=this.listeners.filter(e=>e!==t)}}notifyListeners(){this.listeners.forEach(t=>t(this.currentTheme))}applyTheme(t){const e=document.documentElement;t==="light"?(e.classList.add("light"),e.classList.remove("dark"),e.setAttribute("data-theme","light")):(e.classList.add("dark"),e.classList.remove("light"),e.setAttribute("data-theme","dark"))}},Tt=new be,we=class{routes=[];currentPath="";container=null;afterNavCallbacks=[];constructor(t="main-content"){typeof window<"u"&&window.addEventListener("hashchange",()=>this.handleRouting()),this.container=typeof document<"u"?document.getElementById(t):null}setContainer(t){this.container=t}register(t,e,i,l){return this.routes.push({path:t,name:e,title:i,handler:l}),this}async navigate(t){if(typeof window>"u")return;const e=t.startsWith("#")?t:`#${t}`;window.location.hash=e,await this.handleRouting()}getCurrentPath(){return this.currentPath}onAfterNavigate(t){return this.afterNavCallbacks.push(t),()=>{this.afterNavCallbacks=this.afterNavCallbacks.filter(e=>e!==t)}}init(t="/dashboard"){typeof window>"u"||(window.location.hash?this.handleRouting():window.location.hash=`#${t}`)}async handleRouting(){if(typeof window>"u")return;const[t,e]=(window.location.hash.slice(1)||"/dashboard").split("?"),i=t.startsWith("/")?t:`/${t}`,l=new URLSearchParams(e||""),s=this.matchRoute(i),a=this.container||document.getElementById("main-content");if(!a){console.warn("Router: Container element #main-content not found");return}if(this.currentPath=i,!s){this.renderNotFound(a,i);return}a.classList.remove("page-transition"),a.offsetWidth,a.classList.add("page-transition");const o={path:i,params:s.params,query:l};try{await s.route.handler(o,a)}catch(n){console.error(`Router error handling route "${i}":`,n),a.innerHTML=`
        <div class="empty-state">
          <div class="empty-state__title">Erro ao carregar página</div>
          <div class="empty-state__description">${n instanceof Error?n.message:String(n)}</div>
          <button class="btn btn--primary" id="btn-retry-route">Recarregar</button>
        </div>
      `,a.querySelector("#btn-retry-route")?.addEventListener("click",()=>{this.handleRouting()})}this.afterNavCallbacks.forEach(n=>n(s.route,o))}matchRoute(t){for(const e of this.routes){const i=[],l=e.path.replace(/:([a-zA-Z0-9_]+)/g,(o,n)=>(i.push(n),"([^/]+)")).replace(/\//g,"\\/"),s=new RegExp(`^${l}$`),a=t.match(s);if(a){const o={};return i.forEach((n,u)=>{o[n]=decodeURIComponent(a[u+1])}),{route:e,params:o}}}return null}renderNotFound(t,e){t.innerHTML=`
      <div class="page-header">
        <div>
          <h1 class="page-header__title">404 — Página não encontrada</h1>
          <p class="page-header__subtitle">A rota "${e}" não existe.</p>
        </div>
      </div>
      <div class="empty-state">
        <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        <h2 class="empty-state__title">Página Inexistente</h2>
        <p class="empty-state__description">O recurso solicitado não pôde ser encontrado.</p>
        <a href="#/dashboard" class="btn btn--primary">Voltar para o Dashboard</a>
      </div>
    `}},Zt=new we;function Bt(t){return{id:t.id,cnpj:t.cnpj,razaoSocial:t.razao_social,nomeFantasia:t.nome_fantasia??void 0,inscricaoEstadual:t.inscricao_estadual??void 0,inscricaoMunicipal:t.inscricao_municipal??void 0,endereco:{logradouro:t.logradouro??void 0,numero:t.numero??void 0,complemento:t.complemento??void 0,bairro:t.bairro??void 0,municipio:t.municipio??void 0,codigoMunicipio:t.codigo_municipio??void 0,uf:t.uf??void 0,cep:t.cep??void 0},regimeTributario:t.regime_tributario??void 0,ativa:!!t.ativa,createdAt:t.created_at,updatedAt:t.updated_at}}var _e=class{customDb;constructor(t){this.customDb=t}get db(){return this.customDb??At()}async findById(t){const e=await this.db.select("SELECT * FROM companies WHERE id = ?",[t]);return!e||e.length===0?null:Bt(e[0])}async findByCnpj(t){const e=t.replace(/\D/g,""),i=await this.db.select("SELECT * FROM companies WHERE cnpj = ?",[e]);return!i||i.length===0?null:Bt(i[0])}async findAll(t=!1){const e=t?"SELECT * FROM companies WHERE ativa = 1 ORDER BY razao_social ASC":"SELECT * FROM companies ORDER BY razao_social ASC";return(await this.db.select(e)).map(Bt)}async search(t){const e=`%${t}%`,i=t.replace(/\D/g,"");return(await this.db.select(`SELECT * FROM companies 
       WHERE razao_social LIKE ? 
          OR nome_fantasia LIKE ? 
          OR cnpj LIKE ? 
       ORDER BY razao_social ASC`,[e,e,i?`%${i}%`:e])).map(Bt)}async create(t){const e=t.cnpj.replace(/\D/g,""),i=t.id||(typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`comp-${Date.now()}`),l=new Date().toISOString();await this.db.execute(`INSERT INTO companies (
        id, cnpj, razao_social, nome_fantasia,
        inscricao_estadual, inscricao_municipal,
        logradouro, numero, complemento, bairro, municipio, codigo_municipio, uf, cep,
        regime_tributario, ativa, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[i,e,t.razaoSocial,t.nomeFantasia??null,t.inscricaoEstadual??null,t.inscricaoMunicipal??null,t.endereco?.logradouro??null,t.endereco?.numero??null,t.endereco?.complemento??null,t.endereco?.bairro??null,t.endereco?.municipio??null,t.endereco?.codigoMunicipio??null,t.endereco?.uf??null,t.endereco?.cep?.replace(/\D/g,"")??null,t.regimeTributario??null,t.ativa!==!1?1:0,l,l]);const s=await this.findById(i);if(!s)throw new Error(`Failed to retrieve company after insert: ${i}`);return s}async update(t,e){const i=await this.findById(t);if(!i)return null;const l=e.cnpj!==void 0?e.cnpj.replace(/\D/g,""):i.cnpj,s=e.razaoSocial??i.razaoSocial,a=e.nomeFantasia!==void 0?e.nomeFantasia:i.nomeFantasia,o=e.inscricaoEstadual!==void 0?e.inscricaoEstadual:i.inscricaoEstadual,n=e.inscricaoMunicipal!==void 0?e.inscricaoMunicipal:i.inscricaoMunicipal,u={...i.endereco,...e.endereco},v=e.regimeTributario!==void 0?e.regimeTributario:i.regimeTributario,w=e.ativa!==void 0?e.ativa?1:0:i.ativa?1:0,b=new Date().toISOString();return await this.db.execute(`UPDATE companies SET 
        cnpj = ?, razao_social = ?, nome_fantasia = ?,
        inscricao_estadual = ?, inscricao_municipal = ?,
        logradouro = ?, numero = ?, complemento = ?, bairro = ?, municipio = ?, codigo_municipio = ?, uf = ?, cep = ?,
        regime_tributario = ?, ativa = ?, updated_at = ?
      WHERE id = ?`,[l,s,a??null,o??null,n??null,u.logradouro??null,u.numero??null,u.complemento??null,u.bairro??null,u.municipio??null,u.codigoMunicipio??null,u.uf??null,u.cep?u.cep.replace(/\D/g,""):null,v??null,w,b,t]),this.findById(t)}async delete(t){return(await this.db.execute("DELETE FROM companies WHERE id = ?",[t])).rowsAffected>0}};function pt(t){return t.replace(/\D/g,"")}function Gt(t){if(!t)return!1;const e=pt(t);if(e.length!==14||/^(\d)\1{13}$/.test(e))return!1;const i=[5,4,3,2,9,8,7,6,5,4,3,2];let l=0;for(let u=0;u<12;u++)l+=parseInt(e[u],10)*i[u];const s=l%11;if((s<2?0:11-s)!==parseInt(e[12],10))return!1;const a=[6,5,4,3,2,9,8,7,6,5,4,3,2];let o=0;for(let u=0;u<13;u++)o+=parseInt(e[u],10)*a[u];const n=o%11;return(n<2?0:11-n)===parseInt(e[13],10)}function Ot(t){const e=pt(t);return e.length!==14?t:e.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,"$1.$2.$3/$4-$5")}function te(t){const e=pt(t);return e.length!==8?t:e.replace(/^(\d{5})(\d{3})$/,"$1-$2")}function rt(t){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(t)}function Rt(t){if(!t)return"";const e=new Date(t);return isNaN(e.getTime())?t:new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(e)}function xe(t){const e=pt(t);return e.length!==11?t:e.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/,"$1.$2.$3-$4")}function bt(t){const e=pt(t);return e.length===14?Ot(e):e.length===11?xe(e):t}function Se(t){const e=pt(t);if(e.length<43)throw new Error("Chave de acesso incompleta para cálculo de DV (esperado 43 dígitos).");let i=0,l=2;for(let a=42;a>=0;a--)i+=parseInt(e[a],10)*l,l++,l>9&&(l=2);const s=i%11;return s===0||s===1?0:11-s}function jt(t){if(!t)return!1;const e=pt(t);return e.length!==44?!1:parseInt(e[43],10)===Se(e.substring(0,43))}function Ee(t){const e=pt(t);return e.length!==44?null:{cUF:e.substring(0,2),anoMes:e.substring(2,6),cnpj:e.substring(6,20),modelo:e.substring(20,22),serie:e.substring(22,25),numero:e.substring(25,34),tipoEmissao:e.substring(34,35),codigoNumerico:e.substring(35,43),dv:e.substring(43,44),isValida:jt(e)}}function Ce(t){const e=pt(t);return e.length!==44?t:e.replace(/(\d{4})/g,"$1 ").trim()}var ke=class{customRepository;activeCompany=null;activeCompanyListeners=[];constructor(t){this.customRepository=t}setRepository(t){this.customRepository=t}get repository(){return this.customRepository||(this.customRepository=new _e),this.customRepository}async list(t,e=!1){if(t&&t.trim().length>0){const i=await this.repository.search(t.trim());return e?i.filter(l=>l.ativa):i}return this.repository.findAll(e)}async getById(t){return this.repository.findById(t)}async getByCnpj(t){return this.repository.findByCnpj(t)}async create(t){if(!t.razaoSocial||t.razaoSocial.trim().length===0)throw new Error("A Razão Social é obrigatória.");if(!t.cnpj||t.cnpj.trim().length===0)throw new Error("O CNPJ é obrigatório.");const e=pt(t.cnpj);if(!Gt(e))throw new Error("O CNPJ informado é inválido.");if(await this.repository.findByCnpj(e))throw new Error(`Já existe uma empresa cadastrada com o CNPJ ${t.cnpj}.`);const i=await this.repository.create({id:t.id||(typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`comp-${Date.now()}`),cnpj:e,razaoSocial:t.razaoSocial.trim(),nomeFantasia:t.nomeFantasia?.trim()||void 0,inscricaoEstadual:t.inscricaoEstadual?.trim()||void 0,inscricaoMunicipal:t.inscricaoMunicipal?.trim()||void 0,endereco:t.endereco,regimeTributario:t.regimeTributario,ativa:t.ativa!==!1});return this.activeCompany||await this.setActiveCompany(i.id),i}async update(t,e){const i=await this.repository.findById(t);if(!i)throw new Error(`Empresa com ID "${t}" não encontrada.`);if(e.razaoSocial!==void 0&&e.razaoSocial.trim().length===0)throw new Error("A Razão Social não pode ser vazia.");let l=i.cnpj;if(e.cnpj!==void 0){if(l=pt(e.cnpj),!Gt(l))throw new Error("O CNPJ informado é inválido.");if(l!==i.cnpj){const a=await this.repository.findByCnpj(l);if(a&&a.id!==t)throw new Error(`Já existe outra empresa com o CNPJ ${e.cnpj}.`)}}const s=await this.repository.update(t,{...e,cnpj:l,razaoSocial:e.razaoSocial?e.razaoSocial.trim():i.razaoSocial,nomeFantasia:e.nomeFantasia!==void 0?e.nomeFantasia.trim():i.nomeFantasia});if(!s)throw new Error(`Falha ao atualizar a empresa ${t}.`);return this.activeCompany&&this.activeCompany.id===t&&(this.activeCompany=s,this.notifyActiveCompanyListeners()),s}async delete(t){const e=await this.repository.delete(t);if(e&&this.activeCompany&&this.activeCompany.id===t){const i=await this.repository.findAll(!0);i.length>0?await this.setActiveCompany(i[0].id):await this.setActiveCompany(null)}return e}async getActiveCompany(){if(this.activeCompany)return this.activeCompany;if(typeof window<"u"){const e=localStorage.getItem("fiscalflow_active_company_id");if(e){const i=await this.repository.findById(e);if(i)return this.activeCompany=i,i}}try{const e=await At().select("SELECT value FROM app_settings WHERE key = ?",["default_company_id"]);if(e&&e.length>0&&e[0].value){const i=await this.repository.findById(e[0].value);if(i)return this.activeCompany=i,i}}catch{}const t=await this.repository.findAll(!0);return t.length>0?(await this.setActiveCompany(t[0].id),t[0]):null}async clearActiveCompany(){await this.setActiveCompany(null)}async setActiveCompany(t){if(!t)return this.activeCompany=null,typeof window<"u"&&localStorage.removeItem("fiscalflow_active_company_id"),this.notifyActiveCompanyListeners(),null;const e=await this.repository.findById(t);if(!e)throw new Error(`Empresa com ID "${t}" não encontrada.`);this.activeCompany=e,typeof window<"u"&&localStorage.setItem("fiscalflow_active_company_id",e.id);try{await At().execute("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",["default_company_id",e.id])}catch{}return this.notifyActiveCompanyListeners(),e}onActiveCompanyChange(t){return this.activeCompanyListeners.push(t),()=>{this.activeCompanyListeners=this.activeCompanyListeners.filter(e=>e!==t)}}notifyActiveCompanyListeners(){this.activeCompanyListeners.forEach(t=>t(this.activeCompany))}},ct=new ke;function Lt(t){return{id:t.id,companyId:t.company_id,tipo:t.tipo,chaveAcesso:t.chave_acesso??void 0,numero:t.numero,serie:t.serie??void 0,dataEmissao:t.data_emissao,valorTotal:t.valor_total,emitenteCnpjCpf:t.emitente_cnpj_cpf,emitenteRazaoSocial:t.emitente_razao_social,emitenteUf:t.emitente_uf??void 0,destinatarioCnpjCpf:t.destinatario_cnpj_cpf??void 0,destinatarioRazaoSocial:t.destinatario_razao_social??void 0,destinatarioUf:t.destinatario_uf??void 0,valorICMS:t.valor_icms??void 0,valorIPI:t.valor_ipi??void 0,valorPIS:t.valor_pis??void 0,valorCOFINS:t.valor_cofins??void 0,valorISS:t.valor_iss??void 0,situacao:t.situacao,xmlOriginal:t.xml_original,xmlHash:t.xml_hash,nfeVersao:t.nfe_versao??void 0,naturezaOperacao:t.natureza_operacao??void 0,createdAt:t.created_at,updatedAt:t.updated_at}}function Te(t){return{id:t.id,documentId:t.document_id,numeroItem:t.numero_item,codigo:t.codigo??void 0,descricao:t.descricao,ncm:t.ncm??void 0,cfop:t.cfop??void 0,unidade:t.unidade??void 0,quantidade:t.quantidade,valorUnitario:t.valor_unitario,valorTotal:t.valor_total,baseCalculoICMS:t.base_calculo_icms??void 0,valorICMS:t.valor_icms??void 0,aliquotaICMS:t.aliquota_icms??void 0,valorIPI:t.valor_ipi??void 0,valorPIS:t.valor_pis??void 0,valorCOFINS:t.valor_cofins??void 0,cst:t.cst??void 0,origem:t.origem??void 0}}var Ft=class{customDb;constructor(t){this.customDb=t}get db(){return this.customDb??At()}async findById(t){const e=await this.db.select("SELECT * FROM fiscal_documents WHERE id = ?",[t]);return!e||e.length===0?null:Lt(e[0])}async findByChaveAcesso(t,e){const i=await this.db.select("SELECT * FROM fiscal_documents WHERE company_id = ? AND chave_acesso = ?",[t,e]);return!i||i.length===0?null:Lt(i[0])}async findByHash(t,e){const i=await this.db.select("SELECT * FROM fiscal_documents WHERE company_id = ? AND xml_hash = ?",[t,e]);return!i||i.length===0?null:Lt(i[0])}async findAllByCompany(t){return(await this.db.select("SELECT * FROM fiscal_documents WHERE company_id = ? ORDER BY data_emissao DESC, created_at DESC",[t])).map(Lt)}async findItemsByDocumentId(t){return(await this.db.select("SELECT * FROM document_items WHERE document_id = ? ORDER BY numero_item ASC",[t])).map(Te)}async create(t,e=[]){const i=t.id||(typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`doc-${Date.now()}`),l=new Date().toISOString();await this.db.execute(`INSERT INTO fiscal_documents (
        id, company_id, tipo, chave_acesso, numero, serie, data_emissao, valor_total,
        emitente_cnpj_cpf, emitente_razao_social, emitente_uf,
        destinatario_cnpj_cpf, destinatario_razao_social, destinatario_uf,
        valor_icms, valor_ipi, valor_pis, valor_cofins, valor_iss,
        situacao, xml_original, xml_hash, nfe_versao, natureza_operacao,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[i,t.companyId,t.tipo,t.chaveAcesso??null,t.numero,t.serie??null,t.dataEmissao,t.valorTotal,t.emitenteCnpjCpf,t.emitenteRazaoSocial,t.emitenteUf??null,t.destinatarioCnpjCpf??null,t.destinatarioRazaoSocial??null,t.destinatarioUf??null,t.valorICMS??null,t.valorIPI??null,t.valorPIS??null,t.valorCOFINS??null,t.valorISS??null,t.situacao,t.xmlOriginal,t.xmlHash,t.nfeVersao??null,t.naturezaOperacao??null,t.createdAt||l,t.updatedAt||l]);for(const a of e){const o=a.id||(typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`item-${Date.now()}`);await this.db.execute(`INSERT INTO document_items (
          id, document_id, numero_item, codigo, descricao, ncm, cfop, unidade,
          quantidade, valor_unitario, valor_total,
          base_calculo_icms, valor_icms, aliquota_icms, valor_ipi, valor_pis, valor_cofins,
          cst, origem
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[o,i,a.numeroItem,a.codigo??null,a.descricao,a.ncm??null,a.cfop??null,a.unidade??null,a.quantidade,a.valorUnitario,a.valorTotal,a.baseCalculoICMS??null,a.valorICMS??null,a.aliquotaICMS??null,a.valorIPI??null,a.valorPIS??null,a.valorCOFINS??null,a.cst??null,a.origem??null])}const s=await this.findById(i);if(!s)throw new Error(`Failed to retrieve document after insert: ${i}`);return s}async findPaginated(t){const e=Math.max(1,t.page??1),i=Math.max(1,Math.min(200,t.pageSize??50)),l=(e-1)*i,s=["company_id = ?"],a=[t.companyId];if(t.tipo&&(s.push("tipo = ?"),a.push(t.tipo)),t.situacao&&(s.push("situacao = ?"),a.push(t.situacao)),t.dataInicio&&(s.push("data_emissao >= ?"),a.push(t.dataInicio)),t.dataFim&&(s.push("data_emissao <= ?"),a.push(t.dataFim)),t.search){const u=`%${t.search}%`;s.push(`(
        numero LIKE ? OR 
        chave_acesso LIKE ? OR 
        emitente_razao_social LIKE ? OR 
        destinatario_razao_social LIKE ? OR 
        emitente_cnpj_cpf LIKE ? OR 
        destinatario_cnpj_cpf LIKE ?
      )`),a.push(u,u,u,u,u,u)}const o=s.join(" AND "),n=(await this.db.select(`SELECT COUNT(*) as total FROM fiscal_documents WHERE ${o}`,a))[0]?.total??0;return{data:(await this.db.select(`SELECT * FROM fiscal_documents WHERE ${o} ORDER BY data_emissao DESC, created_at DESC LIMIT ? OFFSET ?`,[...a,i,l])).map(Lt),total:n,page:e,pageSize:i,totalPages:Math.ceil(n/i)}}async delete(t){return(await this.db.execute("DELETE FROM fiscal_documents WHERE id = ?",[t])).rowsAffected>0}async getSummaryByCompany(t){const e=await this.db.select(`SELECT tipo, COUNT(*) as count, SUM(valor_total) as total_valor 
       FROM fiscal_documents 
       WHERE company_id = ? 
       GROUP BY tipo`,[t]);let i=0,l=0;const s={};for(const a of e)i+=a.count,l+=a.total_valor||0,s[a.tipo]=a.count;return{totalDocs:i,totalValor:l,byTipo:s}}};function Vt(t){return{id:t.id,companyId:t.company_id,tipo:t.tipo,periodo:t.periodo,dataInicio:t.data_inicio,dataFim:t.data_fim,cnpj:t.cnpj,razaoSocial:t.razao_social,inscricaoEstadual:t.inscricao_estadual??void 0,versaoLayout:t.versao_layout,finalidade:t.finalidade,conteudoOriginal:t.conteudo_original,conteudoHash:t.conteudo_hash,totalRegistros:t.total_registros,createdAt:t.created_at,updatedAt:t.updated_at}}var Ut=class{customDb;constructor(t){this.customDb=t}get db(){return this.customDb??At()}async findById(t){const e=await this.db.select("SELECT * FROM sped_files WHERE id = ?",[t]);return!e||e.length===0?null:Vt(e[0])}async findByHash(t,e){const i=await this.db.select("SELECT * FROM sped_files WHERE company_id = ? AND conteudo_hash = ?",[t,e]);return!i||i.length===0?null:Vt(i[0])}async findByCompany(t){return(await this.db.select("SELECT * FROM sped_files WHERE company_id = ? ORDER BY periodo DESC, data_inicio DESC",[t])).map(Vt)}async create(t){const e=t.id||(typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`sped-${Date.now()}`),i=new Date().toISOString();await this.db.execute(`INSERT INTO sped_files (
        id, company_id, tipo, periodo, data_inicio, data_fim,
        cnpj, razao_social, inscricao_estadual, versao_layout,
        finalidade, conteudo_original, conteudo_hash, total_registros,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e,t.companyId,t.tipo,t.periodo,t.dataInicio,t.dataFim,t.cnpj,t.razaoSocial,t.inscricaoEstadual??null,t.versaoLayout,t.finalidade,t.conteudoOriginal,t.conteudoHash,t.totalRegistros,t.createdAt||i,t.updatedAt||i]);const l=await this.findById(e);if(!l)throw new Error(`Failed to retrieve created SPED file: ${e}`);return l}async delete(t){return(await this.db.execute("DELETE FROM sped_files WHERE id = ?",[t])).rowsAffected>0}},Ie=class{documentRepo;spedRepo;constructor(t,e){this.documentRepo=t||new Ft,this.spedRepo=e||new Ut}async getMetrics(t,e){if(!t)throw new Error("ID da empresa é obrigatório para cálculo de métricas.");const i=pt(e||""),l=await this.documentRepo.findAllByCompany(t),s=await this.spedRepo.findByCompany(t);let a=0,o=0,n=0,u=0,v=0,w=0,b=0,p=0,m=0,h=0;const d={nfe:{count:0,totalValor:0},nfce:{count:0,totalValor:0},nfse:{count:0,totalValor:0},cte:{count:0,totalValor:0}},g={},f={},y={};for(const D of l){const E=D.situacao==="cancelada"||D.situacao==="denegada"||D.situacao==="inutilizada",R=E?0:D.valorTotal||0;a+=R,d[D.tipo]||(d[D.tipo]={count:0,totalValor:0}),d[D.tipo].count++,d[D.tipo].totalValor+=R,E||(w+=D.valorICMS||0,b+=D.valorISS||0,p+=D.valorPIS||0,m+=D.valorCOFINS||0,h+=D.valorIPI||0);const c=pt(D.emitenteCnpjCpf||""),P=pt(D.destinatarioCnpjCpf||""),J=i&&c===i,j=i&&P===i;if(J){if(u+=R,v++,P&&!E){const K=P;y[K]||(y[K]={cnpjCpf:D.destinatarioCnpjCpf||P,razaoSocial:D.destinatarioRazaoSocial||"Consumidor / Cliente",uf:D.destinatarioUf,total:0,count:0}),y[K].total+=R,y[K].count++}}else if(j){if(o+=R,n++,c&&!E){const K=c;f[K]||(f[K]={cnpjCpf:D.emitenteCnpjCpf,razaoSocial:D.emitenteRazaoSocial,uf:D.emitenteUf,total:0,count:0}),f[K].total+=R,f[K].count++}}else D.tipo==="nfce"?(u+=R,v++):(o+=R,n++);if(D.dataEmissao){const K=D.dataEmissao.substring(0,7);/^\d{4}-\d{2}$/.test(K)&&(g[K]||(g[K]={entradas:0,saidas:0,total:0,count:0}),g[K].count++,g[K].total+=R,J?g[K].saidas+=R:g[K].entradas+=R)}}const x=l.length+s.length,_=[{tipo:"nfe",label:"NF-e (Mod. 55)",count:d.nfe?.count||0,totalValor:Math.round((d.nfe?.totalValor||0)*100)/100,percentage:x>0?Math.round((d.nfe?.count||0)/x*100):0,color:"#818cf8"},{tipo:"nfce",label:"NFC-e (Mod. 65)",count:d.nfce?.count||0,totalValor:Math.round((d.nfce?.totalValor||0)*100)/100,percentage:x>0?Math.round((d.nfce?.count||0)/x*100):0,color:"#34d399"},{tipo:"nfse",label:"NFS-e (Serviços)",count:d.nfse?.count||0,totalValor:Math.round((d.nfse?.totalValor||0)*100)/100,percentage:x>0?Math.round((d.nfse?.count||0)/x*100):0,color:"#fb923c"},{tipo:"cte",label:"CT-e (Mod. 57)",count:d.cte?.count||0,totalValor:Math.round((d.cte?.totalValor||0)*100)/100,percentage:x>0?Math.round((d.cte?.count||0)/x*100):0,color:"#a855f7"},{tipo:"sped",label:"SPED Fiscal",count:s.length,totalValor:0,percentage:x>0?Math.round(s.length/x*100):0,color:"#60a5fa"}],I=Object.keys(g).sort((D,E)=>D.localeCompare(E)).map(D=>({mes:D,mesFormatado:this.formatMonthYear(D),entradas:Math.round(g[D].entradas*100)/100,saidas:Math.round(g[D].saidas*100)/100,total:Math.round(g[D].total*100)/100,count:g[D].count})),z=Object.values(f).sort((D,E)=>E.total-D.total).slice(0,5).map(D=>({...D,total:Math.round(D.total*100)/100})),T=Object.values(y).sort((D,E)=>E.total-D.total).slice(0,5).map(D=>({...D,total:Math.round(D.total*100)/100})),O=[...l].sort((D,E)=>{const R=new Date(D.dataEmissao||D.createdAt).getTime();return new Date(E.dataEmissao||E.createdAt).getTime()-R}).slice(0,8),k=s.length>0?s[0]:void 0,$=w+b+p+m+h;return{totalDocs:x,totalFiscalDocs:l.length,totalSpedFiles:s.length,totalValor:Math.round(a*100)/100,entradas:{total:Math.round(o*100)/100,count:n},saidas:{total:Math.round(u*100)/100,count:v},impostos:{icms:Math.round(w*100)/100,iss:Math.round(b*100)/100,pis:Math.round(p*100)/100,cofins:Math.round(m*100)/100,ipi:Math.round(h*100)/100,total:Math.round($*100)/100},distribuicaoTipos:_,evolucaoMensal:I,topFornecedores:z,topClientes:T,documentosRecentes:O,ultimoSped:k}}formatMonthYear(t){if(!t||t.length<7)return t;const[e,i]=t.split("-");return`${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(i,10)-1]||i}/${e}`}},ee=new Ie,ze=class{container=null;clearContainerForTesting(){this.container=null}getContainer(){return this.container||(this.container=document.getElementById("toast-container"),this.container||(this.container=document.createElement("div"),this.container.id="toast-container",this.container.className="toast-container",document.body.appendChild(this.container))),this.container}show(t,e="info",i={}){const l=this.getContainer(),s=i.duration??3500,a=document.createElement("div");a.className=`toast toast--${e}`,a.setAttribute("role","alert"),a.innerHTML=`
      <div class="toast__icon">${this.getIconSvg(e)}</div>
      <div class="toast__message">${this.escapeHtml(t)}</div>
      <button class="toast__close" aria-label="Fechar notificação">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;const o=a.querySelector(".toast__close"),n=()=>{a.style.animation="toast-slide-out 250ms ease forwards",setTimeout(()=>{a.parentElement&&a.remove()},250)};return o?.addEventListener("click",n),l.appendChild(a),s>0&&setTimeout(n,s),a}success(t,e){return this.show(t,"success",e)}error(t,e){return this.show(t,"error",e)}warning(t,e){return this.show(t,"warning",e)}info(t,e){return this.show(t,"info",e)}escapeHtml(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}getIconSvg(t){switch(t){case"success":return'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';case"error":return'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';case"warning":return'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';default:return'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}}},tt=new ze;function Nt(t){const e=document.createElement("div");e.className="modal-overlay",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true");const i=document.createElement("div");i.className="modal",t.maxWidth&&(i.style.maxWidth=t.maxWidth);const l=document.createElement("div");l.className="modal__header",l.innerHTML=`
    <h2 class="modal__title">${Ae(t.title)}</h2>
    <button class="modal__close" aria-label="Fechar janela modal">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;const s=document.createElement("div");if(s.className="modal__body",typeof t.content=="string"?s.innerHTML=t.content:s.appendChild(t.content),i.appendChild(l),i.appendChild(s),t.buttons&&t.buttons.length>0){const u=document.createElement("div");u.className="modal__footer";const v={overlay:e,modal:i,close:()=>{}};t.buttons.forEach(w=>{const b=document.createElement("button");b.className=`btn btn--${w.variant||"secondary"}`,b.textContent=w.text,w.id&&(b.id=w.id),b.addEventListener("click",async()=>{w.onClick?await w.onClick(v):v.close()}),u.appendChild(b)}),i.appendChild(u)}e.appendChild(i),document.body.appendChild(e),requestAnimationFrame(()=>{e.classList.add("modal-overlay--visible")});const a=()=>{e.classList.remove("modal-overlay--visible"),setTimeout(()=>{e.parentElement&&e.remove(),document.removeEventListener("keydown",n),t.onClose?.()},200)},o={overlay:e,modal:i,close:a};l.querySelector(".modal__close")?.addEventListener("click",a),e.addEventListener("click",u=>{u.target===e&&a()});const n=u=>{u.key==="Escape"&&a()};return document.addEventListener("keydown",n),o}function Ae(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}async function Kt(t,e){const i=e||new Ft,l=await i.findById(t);if(!l){tt.show("Documento fiscal não encontrado.","error");return}const s=await i.findItemsByDocumentId(t),a=l.chaveAcesso?Ee(l.chaveAcesso):null,o=l.chaveAcesso?jt(l.chaveAcesso):!1,n=document.createElement("div");n.innerHTML=`
    <!-- Modal Navigation Tabs -->
    <div class="tabs-nav" id="doc-modal-tabs">
      <button class="tab-btn tab-btn--active" data-tab="tab-overview">Visão Geral & Partes</button>
      <button class="tab-btn" data-tab="tab-totals">Totais & Impostos</button>
      <button class="tab-btn" data-tab="tab-items">Itens (${s.length})</button>
      <button class="tab-btn" data-tab="tab-xml">XML Original</button>
    </div>

    <!-- Tab 1: Overview & Parties -->
    <div class="tab-content" id="tab-overview">
      <!-- Chave de Acesso / Código de Verificação Card -->
      ${l.chaveAcesso?`
        <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); background-color: var(--bg-tertiary);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
            <span style="font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">
              ${pt(l.chaveAcesso).length===44?"Chave de Acesso (44 Dígitos)":"Código de Verificação / Autenticidade"}
            </span>
            ${pt(l.chaveAcesso).length===44?`
              <span class="badge ${o?"badge--autorizada":"badge--cancelada"}" style="font-size: 0.6875rem;">
                ${o?"✓ Dígito Verificador Válido (DV: "+(a?.dv||"")+")":"✗ Dígito Verificador Inválido"}
              </span>
            `:`
              <span class="badge badge--nfse" style="font-size: 0.6875rem;">
                NFS-e Autenticação
              </span>
            `}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap;">
            <span class="text-mono" style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); letter-spacing: 0.04em;">
              ${pt(l.chaveAcesso).length===44?Ce(l.chaveAcesso):l.chaveAcesso}
            </span>
            <button class="btn btn--secondary btn--sm" id="btn-modal-copy-chave" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copiar
            </button>
          </div>
        </div>
      `:""}

      <!-- General Info Grid -->
      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-card__label">Número / Série</div>
          <div class="detail-card__value text-mono">${l.numero} / ${l.serie||"1"}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Tipo</div>
          <div class="detail-card__value"><span class="badge badge--${l.tipo}">${l.tipo.toUpperCase()}</span></div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Data Emissão</div>
          <div class="detail-card__value" style="font-size: 0.8125rem;">${Rt(l.dataEmissao)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Situação</div>
          <div class="detail-card__value"><span class="badge badge--${l.situacao}">${l.situacao.toUpperCase()}</span></div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Versão Layout</div>
          <div class="detail-card__value text-mono">${l.nfeVersao||"4.00"}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Natureza Operação</div>
          <div class="detail-card__value truncate" style="font-size: 0.8125rem;" title="${zt(l.naturezaOperacao||"-")}">${zt(l.naturezaOperacao||"-")}</div>
        </div>
      </div>

      <!-- Emitente & Destinatário Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-3);">
        <!-- Emitente -->
        <div class="card" style="padding: var(--space-4);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
            Emitente
          </div>
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
            ${zt(l.emitenteRazaoSocial)}
          </div>
          <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
            CNPJ: ${bt(l.emitenteCnpjCpf)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            UF: <strong>${l.emitenteUf||"-"}</strong>
          </div>
        </div>

        <!-- Destinatário -->
        <div class="card" style="padding: var(--space-4);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
            Destinatário
          </div>
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
            ${zt(l.destinatarioRazaoSocial||"Consumidor Final")}
          </div>
          <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
            ${l.destinatarioCnpjCpf?`CNPJ/CPF: ${bt(l.destinatarioCnpjCpf)}`:"Não informado"}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            UF: <strong>${l.destinatarioUf||"-"}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Totals & Taxes -->
    <div class="tab-content" id="tab-totals" style="display: none;">
      <div class="detail-section-title">Valores Totais da Nota</div>
      <div class="detail-grid">
        <div class="detail-card" style="border-left: 3px solid var(--accent-primary);">
          <div class="detail-card__label">Valor Total da Nota</div>
          <div class="detail-card__value" style="font-size: 1.125rem; color: var(--accent-primary);">${rt(l.valorTotal)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor ICMS</div>
          <div class="detail-card__value">${rt(l.valorICMS||0)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor IPI</div>
          <div class="detail-card__value">${rt(l.valorIPI||0)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor PIS</div>
          <div class="detail-card__value">${rt(l.valorPIS||0)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card__label">Valor COFINS</div>
          <div class="detail-card__value">${rt(l.valorCOFINS||0)}</div>
        </div>
        ${l.valorISS?`
          <div class="detail-card">
            <div class="detail-card__label">Valor ISS</div>
            <div class="detail-card__value">${rt(l.valorISS)}</div>
          </div>
        `:""}
      </div>

      <div class="card" style="padding: var(--space-4); margin-top: var(--space-4); background-color: var(--bg-tertiary);">
        <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-2);">
          Hash de Integridade do Arquivo (SHA-256)
        </div>
        <div class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">
          ${l.xmlHash}
        </div>
      </div>
    </div>

    <!-- Tab 3: Items -->
    <div class="tab-content" id="tab-items" style="display: none;">
      ${s.length===0?`
        <div class="empty-state" style="padding: var(--space-6);">
          <p class="empty-state__description">Nenhum item discriminado para este documento fiscal.</p>
        </div>
      `:`
        <div style="overflow-x: auto; max-height: 400px;">
          <table class="table" style="font-size: 0.75rem;">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Código</th>
                <th>Descrição</th>
                <th>NCM</th>
                <th>CFOP</th>
                <th class="text-right">Qtd</th>
                <th>Un</th>
                <th class="text-right">Vlr Unit</th>
                <th class="text-right">Vlr Total</th>
                <th>CST</th>
                <th class="text-right">ICMS</th>
                <th class="text-right">IPI</th>
                <th class="text-right">PIS</th>
                <th class="text-right">COFINS</th>
              </tr>
            </thead>
            <tbody>
              ${s.map(u=>`
                <tr>
                  <td class="text-mono" style="font-weight: 600;">${u.numeroItem}</td>
                  <td class="text-mono text-muted">${zt(u.codigo||"-")}</td>
                  <td style="font-weight: 500; min-width: 180px;">${zt(u.descricao)}</td>
                  <td class="text-mono text-muted">${u.ncm||"-"}</td>
                  <td class="text-mono text-muted">${u.cfop||"-"}</td>
                  <td class="text-right text-mono">${u.quantidade}</td>
                  <td>${u.unidade||"UN"}</td>
                  <td class="text-right text-mono">${rt(u.valorUnitario)}</td>
                  <td class="text-right text-mono font-medium">${rt(u.valorTotal)}</td>
                  <td class="text-mono text-muted">${u.cst||"-"}</td>
                  <td class="text-right text-mono">${u.valorICMS?rt(u.valorICMS):"-"}</td>
                  <td class="text-right text-mono">${u.valorIPI?rt(u.valorIPI):"-"}</td>
                  <td class="text-right text-mono">${u.valorPIS?rt(u.valorPIS):"-"}</td>
                  <td class="text-right text-mono">${u.valorCOFINS?rt(u.valorCOFINS):"-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Tab 4: XML Original -->
    <div class="tab-content" id="tab-xml" style="display: none;">
      <div style="display: flex; justify-content: flex-end; gap: var(--space-2); margin-bottom: var(--space-2);">
        <button class="btn btn--secondary btn--sm" id="btn-modal-copy-xml">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar XML
        </button>
        <button class="btn btn--secondary btn--sm" id="btn-modal-download-xml">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Baixar XML (.xml)
        </button>
      </div>
      <pre class="xml-code-viewer"><code>${zt(l.xmlOriginal)}</code></pre>
    </div>
  `,n.querySelectorAll(".tab-btn").forEach(u=>{u.addEventListener("click",()=>{const v=u.getAttribute("data-tab");v&&(n.querySelectorAll(".tab-btn").forEach(w=>w.classList.remove("tab-btn--active")),u.classList.add("tab-btn--active"),n.querySelectorAll(".tab-content").forEach(w=>{w.style.display=w.id===v?"block":"none"}))})}),n.querySelector("#btn-modal-copy-chave")?.addEventListener("click",async()=>{l.chaveAcesso&&await ae(l.chaveAcesso,"Chave de acesso copiada!")}),n.querySelector("#btn-modal-copy-xml")?.addEventListener("click",async()=>{await ae(l.xmlOriginal,"Conteúdo XML copiado!")}),n.querySelector("#btn-modal-download-xml")?.addEventListener("click",()=>{Ne(l)}),Nt({title:`${l.tipo.toUpperCase()} nº ${l.numero} (Série ${l.serie||"1"})`,content:n,maxWidth:"850px",buttons:[{text:"Fechar",variant:"secondary"}]})}async function ae(t,e){try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(t);else{const i=document.createElement("textarea");i.value=t,i.style.position="fixed",i.style.opacity="0",document.body.appendChild(i),i.select(),document.execCommand("copy"),document.body.removeChild(i)}tt.show(e,"success")}catch{tt.show("Não foi possível copiar para a área de transferência.","error")}}function Ne(t){const e=`${t.tipo.toUpperCase()}_${t.numero}_${t.chaveAcesso||t.id}.xml`,i=new Blob([t.xmlOriginal],{type:"application/xml;charset=utf-8;"}),l=URL.createObjectURL(i),s=document.createElement("a");s.href=l,s.download=e,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(l),tt.show(`Download iniciado: ${e}`,"info")}function zt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Re(t,e){async function i(){const v=await ct.getActiveCompany();if(!v){e.innerHTML=`
        <div class="page-header">
          <div>
            <h1 class="page-header__title">Dashboard</h1>
            <p class="page-header__subtitle">Visão geral e indicadores fiscais</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione ou cadastre uma empresa ativa para visualizar seus indicadores executivos, gráficos de faturamento e auditoria fiscal.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-dash">
            Gerenciar Empresas
          </a>
        </div>
      `;return}e.innerHTML=`
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Dashboard Executivo</h1>
          <p class="page-header__subtitle">
            Empresa: <strong style="color: var(--text-primary);">${o(v.razaoSocial)}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${bt(v.cnpj)})
            </span>
          </p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--secondary" id="btn-refresh-dashboard" title="Atualizar Indicadores">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Atualizar
          </button>
          <a href="#/import" class="btn btn--primary" id="btn-quick-import">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar XML / SPED
          </a>
        </div>
      </div>

      <div id="dashboard-content" style="display: flex; flex-direction: column; gap: var(--space-5);">
        <div class="card" style="padding: var(--space-6); text-align: center; color: var(--text-muted);">
          Carregando indicadores fiscais...
        </div>
      </div>
    `;try{l(await ee.getMetrics(v.id,v.cnpj))}catch(w){console.error("Failed to load dashboard metrics:",w),tt.show("Erro ao calcular indicadores do Dashboard.","error")}e.querySelector("#btn-refresh-dashboard")?.addEventListener("click",async()=>{const w=e.querySelector("#btn-refresh-dashboard");w&&(w.disabled=!0);try{l(await ee.getMetrics(v.id,v.cnpj)),tt.show("Indicadores atualizados com sucesso.","info")}catch{tt.show("Erro ao atualizar indicadores.","error")}finally{w&&(w.disabled=!1)}})}function l(v){const w=e.querySelector("#dashboard-content");if(!w)return;const b=v.saidas.total-v.entradas.total,p=b>=0,m=v.evolucaoMensal.length>0?Math.max(...v.evolucaoMensal.map(h=>Math.max(h.entradas,h.saidas)),1):1;w.innerHTML=`
      <!-- Row 1: Top 4 KPI Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: var(--space-4);">
        <!-- Faturamento & Saídas -->
        <div class="card" style="border-left: 4px solid var(--accent-success); position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Faturamento & Saídas
            </div>
            <div style="color: var(--accent-success); background: rgba(34, 197, 94, 0.12); padding: 4px; border-radius: var(--radius-sm);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: var(--text-primary); margin-top: var(--space-2);">
            ${rt(v.saidas.total)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            <strong style="color: var(--text-secondary);">${v.saidas.count}</strong> vendas / emissões escrituradas
          </div>
        </div>

        <!-- Compras & Entradas -->
        <div class="card" style="border-left: 4px solid #60a5fa; position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Compras & Entradas
            </div>
            <div style="color: #60a5fa; background: rgba(96, 165, 250, 0.12); padding: 4px; border-radius: var(--radius-sm);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>
            </div>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: var(--text-primary); margin-top: var(--space-2);">
            ${rt(v.entradas.total)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            <strong style="color: var(--text-secondary);">${v.entradas.count}</strong> aquisições / fretes recebidos
          </div>
        </div>

        <!-- Resultado Operacional -->
        <div class="card" style="border-left: 4px solid var(--accent-primary); position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Resultado Operacional
            </div>
            <span class="badge ${p?"badge--autorizada":"badge--cancelada"}" style="font-size: 0.6875rem;">
              ${p?"Superávit":"Déficit"}
            </span>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: ${p?"var(--accent-success)":"var(--accent-danger)"}; margin-top: var(--space-2);">
            ${p?"+":""}${rt(b)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            Total Movimentado: <strong style="color: var(--text-secondary);">${rt(v.totalValor)}</strong>
          </div>
        </div>

        <!-- Tributos Destacados -->
        <div class="card" style="border-left: 4px solid #f59e0b; position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Tributos Destacados
            </div>
            <div style="color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 4px; border-radius: var(--radius-sm);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="text-mono" style="font-size: 1.625rem; font-weight: 700; color: #f59e0b; margin-top: var(--space-2);">
            ${rt(v.impostos.total)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-1);">
            ICMS: ${rt(v.impostos.icms)} • ISS: ${rt(v.impostos.iss)}
          </div>
        </div>
      </div>

      <!-- Row 2: Evolução Mensal & Distribuição de Documentos (60% / 40%) -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5);">
        <!-- Evolução Mensal -->
        <div class="card" style="padding: var(--space-5);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
            <div>
              <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Evolução Mensal (Entradas vs Saídas)
              </h2>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
                Volume financeiro escriturado por período de emissão
              </p>
            </div>
            <!-- Legend -->
            <div style="display: flex; gap: var(--space-3); font-size: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--accent-success);"></span>
                <span style="color: var(--text-secondary);">Saídas</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 10px; height: 10px; border-radius: 2px; background: #60a5fa;"></span>
                <span style="color: var(--text-secondary);">Entradas</span>
              </div>
            </div>
          </div>

          ${v.evolucaoMensal.length===0?`
            <div class="empty-state" style="padding: var(--space-6); min-height: 180px;">
              <svg class="empty-state__icon" style="width: 40px; height: 40px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              <div class="empty-state__title" style="font-size: 0.875rem;">Nenhum histórico mensal registrado</div>
              <p class="empty-state__description" style="font-size: 0.75rem;">
                Importe documentos fiscais autorizados para visualizar o gráfico temporal de compras e vendas.
              </p>
            </div>
          `:`
            <!-- Responsive Bar Chart -->
            <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding: var(--space-3) 0; border-bottom: 1px solid var(--border-primary); gap: var(--space-3);">
              ${v.evolucaoMensal.map(h=>{const d=Math.max(6,Math.round(h.saidas/m*160)),g=Math.max(6,Math.round(h.entradas/m*160));return`
                  <div style="display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 48px;" title="${h.mesFormatado}: Saídas ${rt(h.saidas)} | Entradas ${rt(h.entradas)}">
                    <div style="display: flex; align-items: flex-end; gap: 4px; height: 160px; width: 100%; justify-content: center;">
                      <!-- Barra Saídas -->
                      <div style="width: 16px; height: ${d}px; background: var(--accent-success); border-radius: 3px 3px 0 0; transition: height 300ms ease;" title="Saídas: ${rt(h.saidas)}"></div>
                      <!-- Barra Entradas -->
                      <div style="width: 16px; height: ${g}px; background: #60a5fa; border-radius: 3px 3px 0 0; transition: height 300ms ease;" title="Entradas: ${rt(h.entradas)}"></div>
                    </div>
                    <div style="margin-top: var(--space-2); font-size: 0.6875rem; color: var(--text-secondary); font-weight: 500; white-space: nowrap;">
                      ${h.mesFormatado}
                    </div>
                  </div>
                `}).join("")}
            </div>
          `}
        </div>

        <!-- Distribuição por Tipo de Documento -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Documentos por Tipo
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              ${v.totalDocs.toLocaleString("pt-BR")} registros no total
            </p>
          </div>

          <!-- Stacked Progress Bar -->
          <div style="display: flex; height: 10px; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-tertiary); margin-bottom: var(--space-4);">
            ${v.distribuicaoTipos.map(h=>`
              <div style="width: ${h.percentage}%; background: ${h.color}; transition: width 300ms ease;" title="${h.label}: ${h.count} (${h.percentage}%)"></div>
            `).join("")}
          </div>

          <!-- Types Breakdown List -->
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            ${v.distribuicaoTipos.map(h=>`
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem;">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${h.color}; flex-shrink: 0;"></span>
                  <span style="color: var(--text-primary); font-weight: 500;">${h.label}</span>
                </div>
                <div style="text-align: right;">
                  <span class="text-mono" style="font-weight: 600; color: var(--text-primary);">${h.count}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">(${h.percentage}%)</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Row 3: Composição dos Tributos & Status do SPED Fiscal (50% / 50%) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
        <!-- Composição Tributária Detalhada -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Composição dos Tributos Destacados
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Detalhamento por esfera tributária (Estadual, Municipal e Federal)
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            <!-- ICMS -->
            <div class="detail-card" style="border-left: 3px solid var(--accent-success);">
              <div class="detail-card__label">ICMS (Estadual)</div>
              <div class="detail-card__value text-mono" style="color: var(--accent-success);">
                ${rt(v.impostos.icms)}
              </div>
            </div>

            <!-- ISS -->
            <div class="detail-card" style="border-left: 3px solid #fb923c;">
              <div class="detail-card__label">ISS (Municipal)</div>
              <div class="detail-card__value text-mono" style="color: #fb923c;">
                ${rt(v.impostos.iss)}
              </div>
            </div>

            <!-- PIS / COFINS -->
            <div class="detail-card" style="border-left: 3px solid #3b82f6;">
              <div class="detail-card__label">PIS & COFINS (Federal)</div>
              <div class="detail-card__value text-mono" style="color: #3b82f6;">
                ${rt(v.impostos.pis+v.impostos.cofins)}
              </div>
            </div>

            <!-- IPI -->
            <div class="detail-card" style="border-left: 3px solid #a855f7;">
              <div class="detail-card__label">IPI (Federal)</div>
              <div class="detail-card__value text-mono" style="color: #a855f7;">
                ${rt(v.impostos.ipi)}
              </div>
            </div>
          </div>
        </div>

        <!-- Status do SPED Fiscal & Ações Rápidas -->
        <div class="card" style="padding: var(--space-5); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="margin-bottom: var(--space-4);">
              <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Auditoria & SPED Fiscal
              </h2>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
                Escrituração Fiscal Digital (EFD ICMS/IPI)
              </p>
            </div>

            ${v.ultimoSped?`
              <div class="card" style="padding: var(--space-3) var(--space-4); background: var(--bg-tertiary); margin-bottom: var(--space-3);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span class="badge badge--nfe" style="font-weight: 600;">
                    Período: ${s(v.ultimoSped.periodo)}
                  </span>
                  <span class="badge badge--autorizada">Ativo</span>
                </div>
                <div style="font-size: 0.8125rem; font-weight: 500; color: var(--text-primary);">
                  ${v.ultimoSped.totalRegistros.toLocaleString("pt-BR")} registros escriturados (v${v.ultimoSped.versaoLayout})
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                  Vigência: ${a(v.ultimoSped.dataInicio)} a ${a(v.ultimoSped.dataFim)}
                </div>
                <div class="text-mono text-muted" style="font-size: 0.6875rem; margin-top: 4px; word-break: break-all;">
                  SHA-256: ${v.ultimoSped.conteudoHash.substring(0,32)}...
                </div>
              </div>
            `:`
              <div class="card" style="padding: var(--space-3) var(--space-4); background: var(--bg-tertiary); margin-bottom: var(--space-3); color: var(--text-muted); font-size: 0.8125rem;">
                Nenhum arquivo SPED Fiscal escriturado para esta empresa ainda.
              </div>
            `}
          </div>

          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <a href="#/sped" class="btn btn--secondary btn--sm" style="flex: 1; justify-content: center;">
              Auditar SPED
            </a>
            <a href="#/import" class="btn btn--secondary btn--sm" style="flex: 1; justify-content: center;">
              Importar Lote
            </a>
            <a href="#/documents" class="btn btn--secondary btn--sm" style="flex: 1; justify-content: center;">
              Consultar Docs
            </a>
          </div>
        </div>
      </div>

      <!-- Row 4: Principais Parceiros Comerciais (Top Fornecedores & Clientes) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
        <!-- Top Fornecedores -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Principais Fornecedores (Entradas)
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Maiores volumes de compras e insumos adquiridos
            </p>
          </div>

          ${v.topFornecedores.length===0?`
            <div style="color: var(--text-muted); font-size: 0.8125rem; padding: var(--space-4); text-align: center;">
              Nenhum fornecedor registrado ainda.
            </div>
          `:`
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              ${v.topFornecedores.map((h,d)=>`
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: var(--space-3); min-width: 0;">
                    <span style="font-weight: 700; color: var(--accent-primary); font-size: 0.75rem; width: 18px;">#${d+1}</span>
                    <div style="min-width: 0;">
                      <div class="truncate" style="max-width: 220px; font-weight: 500; font-size: 0.8125rem; color: var(--text-primary);" title="${o(h.razaoSocial)}">
                        ${o(h.razaoSocial)}
                      </div>
                      <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                        ${bt(h.cnpjCpf)} ${h.uf?`• ${h.uf}`:""}
                      </div>
                    </div>
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div class="text-mono" style="font-weight: 700; font-size: 0.8125rem; color: var(--text-primary);">
                      ${rt(h.total)}
                    </div>
                    <div style="font-size: 0.6875rem; color: var(--text-muted);">
                      ${h.count} ${h.count===1?"doc":"docs"}
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Top Clientes -->
        <div class="card" style="padding: var(--space-5);">
          <div style="margin-bottom: var(--space-4);">
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Principais Clientes / Destinatários (Saídas)
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Maiores destinos de vendas e faturamento escriturado
            </p>
          </div>

          ${v.topClientes.length===0?`
            <div style="color: var(--text-muted); font-size: 0.8125rem; padding: var(--space-4); text-align: center;">
              Nenhum cliente registrado ainda.
            </div>
          `:`
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              ${v.topClientes.map((h,d)=>`
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: var(--space-3); min-width: 0;">
                    <span style="font-weight: 700; color: var(--accent-success); font-size: 0.75rem; width: 18px;">#${d+1}</span>
                    <div style="min-width: 0;">
                      <div class="truncate" style="max-width: 220px; font-weight: 500; font-size: 0.8125rem; color: var(--text-primary);" title="${o(h.razaoSocial)}">
                        ${o(h.razaoSocial)}
                      </div>
                      <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                        ${bt(h.cnpjCpf)} ${h.uf?`• ${h.uf}`:""}
                      </div>
                    </div>
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div class="text-mono" style="font-weight: 700; font-size: 0.8125rem; color: var(--text-primary);">
                      ${rt(h.total)}
                    </div>
                    <div style="font-size: 0.6875rem; color: var(--text-muted);">
                      ${h.count} ${h.count===1?"doc":"docs"}
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>

      <!-- Row 5: Documentos Fiscais Recentes (Full Width) -->
      <div class="card" style="padding: var(--space-5);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
          <div>
            <h2 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              Documentos Fiscais Recentes
            </h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">
              Últimas emissões e aquisições registradas no sistema
            </p>
          </div>
          <a href="#/documents" class="btn btn--ghost btn--sm">
            Ver todos os documentos &rarr;
          </a>
        </div>

        ${v.documentosRecentes.length===0?`
          <div class="empty-state" style="padding: var(--space-6); min-height: 160px;">
            <svg class="empty-state__icon" style="width: 40px; height: 40px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="empty-state__title" style="font-size: 0.875rem;">Nenhum documento fiscal recente</div>
            <p class="empty-state__description" style="font-size: 0.75rem;">
              Importe arquivos XML para acompanhar emissões e aquisições recentes nesta tabela.
            </p>
            <a href="#/import" class="btn btn--primary btn--sm" style="margin-top: var(--space-2);">
              Importar Documentos
            </a>
          </div>
        `:`
          <div style="overflow-x: auto;">
            <table class="table" style="font-size: 0.8125rem;">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Data Emissão</th>
                  <th>Emitente</th>
                  <th>Destinatário</th>
                  <th class="text-right">Valor Total</th>
                  <th>Situação</th>
                  <th style="text-align: center;">Ações</th>
                </tr>
              </thead>
              <tbody id="dash-recent-tbody">
                ${v.documentosRecentes.map(h=>`
                  <tr data-doc-id="${h.id}" style="cursor: pointer;">
                    <td class="text-mono" style="font-weight: 600; color: var(--text-primary);">
                      ${h.numero}
                    </td>
                    <td>
                      <span class="badge badge--${h.tipo}">${h.tipo.toUpperCase()}</span>
                    </td>
                    <td>
                      ${Rt(h.dataEmissao)}
                    </td>
                    <td>
                      <div class="truncate" style="max-width: 180px; font-weight: 500;" title="${o(h.emitenteRazaoSocial)}">
                        ${o(h.emitenteRazaoSocial)}
                      </div>
                    </td>
                    <td>
                      <div class="truncate" style="max-width: 180px; font-weight: 500;" title="${o(h.destinatarioRazaoSocial||"Consumidor Final")}">
                        ${o(h.destinatarioRazaoSocial||"Consumidor Final")}
                      </div>
                    </td>
                    <td class="text-right text-mono font-medium" style="color: var(--text-primary); font-weight: 700;">
                      ${rt(h.valorTotal)}
                    </td>
                    <td>
                      <span class="badge badge--${h.situacao}">
                        ${h.situacao.charAt(0).toUpperCase()+h.situacao.slice(1)}
                      </span>
                    </td>
                    <td style="text-align: center;" onclick="event.stopPropagation();">
                      <button 
                        class="btn btn--secondary btn--sm btn-dash-view-doc" 
                        data-doc-id="${h.id}" 
                        title="Ver Detalhes do Documento"
                        style="padding: 4px 6px;"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `,w.querySelectorAll("tr[data-doc-id]").forEach(h=>{h.addEventListener("click",()=>{const d=h.getAttribute("data-doc-id");d&&Kt(d)})}),w.querySelectorAll(".btn-dash-view-doc").forEach(h=>{h.addEventListener("click",d=>{d.stopPropagation();const g=h.getAttribute("data-doc-id");g&&Kt(g)})})}function s(v){if(v&&v.length===6){const w=v.substring(0,4);return`${v.substring(4,6)}/${w}`}return v}function a(v){if(!v)return"";if(v.length===10&&v.includes("-")){const[w,b,p]=v.split("-");return`${p}/${b}/${w}`}return Rt(v)}function o(v){return v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const n=ct.onActiveCompanyChange(()=>{i()}),u=new MutationObserver(()=>{document.body.contains(e)||(n(),u.disconnect())});u.observe(document.body,{childList:!0,subtree:!0}),i()}var Fe=pe(((t,e)=>{(function(i){typeof t=="object"&&typeof e<"u"?e.exports=i():typeof define=="function"&&define.amd?define([],i):(typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:this).JSZip=i()})(function(){return(function i(l,s,a){function o(v,w){if(!s[v]){if(!l[v]){var b=typeof Mt=="function"&&Mt;if(!w&&b)return b(v,!0);if(n)return n(v,!0);var p=new Error("Cannot find module '"+v+"'");throw p.code="MODULE_NOT_FOUND",p}var m=s[v]={exports:{}};l[v][0].call(m.exports,function(h){var d=l[v][1][h];return o(d||h)},m,m.exports,i,l,s,a)}return s[v].exports}for(var n=typeof Mt=="function"&&Mt,u=0;u<a.length;u++)o(a[u]);return o})({1:[function(i,l,s){"use strict";var a=i("./utils"),o=i("./support"),n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";s.encode=function(u){for(var v,w,b,p,m,h,d,g=[],f=0,y=u.length,x=y,_=a.getTypeOf(u)!=="string";f<u.length;)x=y-f,b=_?(v=u[f++],w=f<y?u[f++]:0,f<y?u[f++]:0):(v=u.charCodeAt(f++),w=f<y?u.charCodeAt(f++):0,f<y?u.charCodeAt(f++):0),p=v>>2,m=(3&v)<<4|w>>4,h=1<x?(15&w)<<2|b>>6:64,d=2<x?63&b:64,g.push(n.charAt(p)+n.charAt(m)+n.charAt(h)+n.charAt(d));return g.join("")},s.decode=function(u){var v,w,b,p,m,h,d=0,g=0,f="data:";if(u.substr(0,f.length)===f)throw new Error("Invalid base64 input, it looks like a data url.");var y,x=3*(u=u.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(u.charAt(u.length-1)===n.charAt(64)&&x--,u.charAt(u.length-2)===n.charAt(64)&&x--,x%1!=0)throw new Error("Invalid base64 input, bad content length.");for(y=o.uint8array?new Uint8Array(0|x):new Array(0|x);d<u.length;)v=n.indexOf(u.charAt(d++))<<2|(p=n.indexOf(u.charAt(d++)))>>4,w=(15&p)<<4|(m=n.indexOf(u.charAt(d++)))>>2,b=(3&m)<<6|(h=n.indexOf(u.charAt(d++))),y[g++]=v,m!==64&&(y[g++]=w),h!==64&&(y[g++]=b);return y}},{"./support":30,"./utils":32}],2:[function(i,l,s){"use strict";var a=i("./external"),o=i("./stream/DataWorker"),n=i("./stream/Crc32Probe"),u=i("./stream/DataLengthProbe");function v(w,b,p,m,h){this.compressedSize=w,this.uncompressedSize=b,this.crc32=p,this.compression=m,this.compressedContent=h}v.prototype={getContentWorker:function(){var w=new o(a.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new u("data_length")),b=this;return w.on("end",function(){if(this.streamInfo.data_length!==b.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),w},getCompressedWorker:function(){return new o(a.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},v.createWorkerFrom=function(w,b,p){return w.pipe(new n).pipe(new u("uncompressedSize")).pipe(b.compressWorker(p)).pipe(new u("compressedSize")).withStreamInfo("compression",b)},l.exports=v},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(i,l,s){"use strict";var a=i("./stream/GenericWorker");s.STORE={magic:"\0\0",compressWorker:function(){return new a("STORE compression")},uncompressWorker:function(){return new a("STORE decompression")}},s.DEFLATE=i("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(i,l,s){"use strict";var a=i("./utils"),o=(function(){for(var n,u=[],v=0;v<256;v++){n=v;for(var w=0;w<8;w++)n=1&n?3988292384^n>>>1:n>>>1;u[v]=n}return u})();l.exports=function(n,u){return n!==void 0&&n.length?a.getTypeOf(n)!=="string"?(function(v,w,b,p){var m=o,h=p+b;v^=-1;for(var d=p;d<h;d++)v=v>>>8^m[255&(v^w[d])];return-1^v})(0|u,n,n.length,0):(function(v,w,b,p){var m=o,h=p+b;v^=-1;for(var d=p;d<h;d++)v=v>>>8^m[255&(v^w.charCodeAt(d))];return-1^v})(0|u,n,n.length,0):0}},{"./utils":32}],5:[function(i,l,s){"use strict";s.base64=!1,s.binary=!1,s.dir=!1,s.createFolders=!0,s.date=null,s.compression=null,s.compressionOptions=null,s.comment=null,s.unixPermissions=null,s.dosPermissions=null},{}],6:[function(i,l,s){"use strict";var a=null;a=typeof Promise<"u"?Promise:i("lie"),l.exports={Promise:a}},{lie:37}],7:[function(i,l,s){"use strict";var a=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Uint32Array<"u",o=i("pako"),n=i("./utils"),u=i("./stream/GenericWorker"),v=a?"uint8array":"array";function w(b,p){u.call(this,"FlateWorker/"+b),this._pako=null,this._pakoAction=b,this._pakoOptions=p,this.meta={}}s.magic="\b\0",n.inherits(w,u),w.prototype.processChunk=function(b){this.meta=b.meta,this._pako===null&&this._createPako(),this._pako.push(n.transformTo(v,b.data),!1)},w.prototype.flush=function(){u.prototype.flush.call(this),this._pako===null&&this._createPako(),this._pako.push([],!0)},w.prototype.cleanUp=function(){u.prototype.cleanUp.call(this),this._pako=null},w.prototype._createPako=function(){this._pako=new o[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var b=this;this._pako.onData=function(p){b.push({data:p,meta:b.meta})}},s.compressWorker=function(b){return new w("Deflate",b)},s.uncompressWorker=function(){return new w("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(i,l,s){"use strict";function a(m,h){var d,g="";for(d=0;d<h;d++)g+=String.fromCharCode(255&m),m>>>=8;return g}function o(m,h,d,g,f,y){var x,_,I=m.file,z=m.compression,T=y!==v.utf8encode,O=n.transformTo("string",y(I.name)),k=n.transformTo("string",v.utf8encode(I.name)),$=I.comment,D=n.transformTo("string",y($)),E=n.transformTo("string",v.utf8encode($)),R=k.length!==I.name.length,c=E.length!==$.length,P="",J="",j="",K=I.dir,q=I.date,V={crc32:0,compressedSize:0,uncompressedSize:0};h&&!d||(V.crc32=m.crc32,V.compressedSize=m.compressedSize,V.uncompressedSize=m.uncompressedSize);var F=0;h&&(F|=8),T||!R&&!c||(F|=2048);var N=0,Q=0;K&&(N|=16),f==="UNIX"?(Q=798,N|=(function(X,nt){var ut=X;return X||(ut=nt?16893:33204),(65535&ut)<<16})(I.unixPermissions,K)):(Q=20,N|=(function(X){return 63&(X||0)})(I.dosPermissions)),x=q.getUTCHours(),x<<=6,x|=q.getUTCMinutes(),x<<=5,x|=q.getUTCSeconds()/2,_=q.getUTCFullYear()-1980,_<<=4,_|=q.getUTCMonth()+1,_<<=5,_|=q.getUTCDate(),R&&(J=a(1,1)+a(w(O),4)+k,P+="up"+a(J.length,2)+J),c&&(j=a(1,1)+a(w(D),4)+E,P+="uc"+a(j.length,2)+j);var Z="";return Z+=`
\0`,Z+=a(F,2),Z+=z.magic,Z+=a(x,2),Z+=a(_,2),Z+=a(V.crc32,4),Z+=a(V.compressedSize,4),Z+=a(V.uncompressedSize,4),Z+=a(O.length,2),Z+=a(P.length,2),{fileRecord:b.LOCAL_FILE_HEADER+Z+O+P,dirRecord:b.CENTRAL_FILE_HEADER+a(Q,2)+Z+a(D.length,2)+"\0\0\0\0"+a(N,4)+a(g,4)+O+P+D}}var n=i("../utils"),u=i("../stream/GenericWorker"),v=i("../utf8"),w=i("../crc32"),b=i("../signature");function p(m,h,d,g){u.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=h,this.zipPlatform=d,this.encodeFileName=g,this.streamFiles=m,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}n.inherits(p,u),p.prototype.push=function(m){var h=m.meta.percent||0,d=this.entriesCount,g=this._sources.length;this.accumulate?this.contentBuffer.push(m):(this.bytesWritten+=m.data.length,u.prototype.push.call(this,{data:m.data,meta:{currentFile:this.currentFile,percent:d?(h+100*(d-g-1))/d:100}}))},p.prototype.openedSource=function(m){this.currentSourceOffset=this.bytesWritten,this.currentFile=m.file.name;var h=this.streamFiles&&!m.file.dir;if(h){var d=o(m,h,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:d.fileRecord,meta:{percent:0}})}else this.accumulate=!0},p.prototype.closedSource=function(m){this.accumulate=!1;var h=this.streamFiles&&!m.file.dir,d=o(m,h,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(d.dirRecord),h)this.push({data:(function(g){return b.DATA_DESCRIPTOR+a(g.crc32,4)+a(g.compressedSize,4)+a(g.uncompressedSize,4)})(m),meta:{percent:100}});else for(this.push({data:d.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},p.prototype.flush=function(){for(var m=this.bytesWritten,h=0;h<this.dirRecords.length;h++)this.push({data:this.dirRecords[h],meta:{percent:100}});var d=this.bytesWritten-m,g=(function(f,y,x,_,I){var z=n.transformTo("string",I(_));return b.CENTRAL_DIRECTORY_END+"\0\0\0\0"+a(f,2)+a(f,2)+a(y,4)+a(x,4)+a(z.length,2)+z})(this.dirRecords.length,d,m,this.zipComment,this.encodeFileName);this.push({data:g,meta:{percent:100}})},p.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},p.prototype.registerPrevious=function(m){this._sources.push(m);var h=this;return m.on("data",function(d){h.processChunk(d)}),m.on("end",function(){h.closedSource(h.previous.streamInfo),h._sources.length?h.prepareNextSource():h.end()}),m.on("error",function(d){h.error(d)}),this},p.prototype.resume=function(){return!!u.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},p.prototype.error=function(m){var h=this._sources;if(!u.prototype.error.call(this,m))return!1;for(var d=0;d<h.length;d++)try{h[d].error(m)}catch{}return!0},p.prototype.lock=function(){u.prototype.lock.call(this);for(var m=this._sources,h=0;h<m.length;h++)m[h].lock()},l.exports=p},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(i,l,s){"use strict";var a=i("../compressions"),o=i("./ZipFileWorker");s.generateWorker=function(n,u,v){var w=new o(u.streamFiles,v,u.platform,u.encodeFileName),b=0;try{n.forEach(function(p,m){b++;var h=(function(y,x){var _=y||x,I=a[_];if(!I)throw new Error(_+" is not a valid compression method !");return I})(m.options.compression,u.compression),d=m.options.compressionOptions||u.compressionOptions||{},g=m.dir,f=m.date;m._compressWorker(h,d).withStreamInfo("file",{name:p,dir:g,date:f,comment:m.comment||"",unixPermissions:m.unixPermissions,dosPermissions:m.dosPermissions}).pipe(w)}),w.entriesCount=b}catch(p){w.error(p)}return w}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(i,l,s){"use strict";function a(){if(!(this instanceof a))return new a;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var o=new a;for(var n in this)typeof this[n]!="function"&&(o[n]=this[n]);return o}}(a.prototype=i("./object")).loadAsync=i("./load"),a.support=i("./support"),a.defaults=i("./defaults"),a.version="3.10.2",a.loadAsync=function(o,n){return new a().loadAsync(o,n)},a.external=i("./external"),l.exports=a},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(i,l,s){"use strict";var a=i("./utils"),o=i("./external"),n=i("./utf8"),u=i("./zipEntries"),v=i("./stream/Crc32Probe"),w=i("./nodejsUtils");function b(p){return new o.Promise(function(m,h){var d=p.decompressed.getContentWorker().pipe(new v);d.on("error",function(g){h(g)}).on("end",function(){d.streamInfo.crc32!==p.decompressed.crc32?h(new Error("Corrupted zip : CRC32 mismatch")):m()}).resume()})}l.exports=function(p,m){var h=this;return m=a.extend(m||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:n.utf8decode}),w.isNode&&w.isStream(p)?o.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):a.prepareContent("the loaded zip file",p,!0,m.optimizedBinaryString,m.base64).then(function(d){var g=new u(m);return g.load(d),g}).then(function(d){var g=[o.Promise.resolve(d)],f=d.files;if(m.checkCRC32)for(var y=0;y<f.length;y++)g.push(b(f[y]));return o.Promise.all(g)}).then(function(d){for(var g=d.shift(),f=g.files,y=0;y<f.length;y++){var x=f[y],_=x.fileNameStr,I=a.resolve(x.fileNameStr);h.file(I,x.decompressed,{binary:!0,optimizedBinaryString:!0,date:x.date,dir:x.dir,comment:x.fileCommentStr.length?x.fileCommentStr:null,unixPermissions:x.unixPermissions,dosPermissions:x.dosPermissions,createFolders:m.createFolders}),x.dir||(h.file(I).unsafeOriginalName=_)}return g.zipComment.length&&(h.comment=g.zipComment),h})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(i,l,s){"use strict";var a=i("../utils"),o=i("../stream/GenericWorker");function n(u,v){o.call(this,"Nodejs stream input adapter for "+u),this._upstreamEnded=!1,this._bindStream(v)}a.inherits(n,o),n.prototype._bindStream=function(u){var v=this;(this._stream=u).pause(),u.on("data",function(w){v.push({data:w,meta:{percent:0}})}).on("error",function(w){v.isPaused?this.generatedError=w:v.error(w)}).on("end",function(){v.isPaused?v._upstreamEnded=!0:v.end()})},n.prototype.pause=function(){return!!o.prototype.pause.call(this)&&(this._stream.pause(),!0)},n.prototype.resume=function(){return!!o.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},l.exports=n},{"../stream/GenericWorker":28,"../utils":32}],13:[function(i,l,s){"use strict";var a=i("readable-stream").Readable;function o(n,u,v){a.call(this,u),this._helper=n;var w=this;n.on("data",function(b,p){w.push(b)||w._helper.pause(),v&&v(p)}).on("error",function(b){w.emit("error",b)}).on("end",function(){w.push(null)})}i("../utils").inherits(o,a),o.prototype._read=function(){this._helper.resume()},l.exports=o},{"../utils":32,"readable-stream":16}],14:[function(i,l,s){"use strict";l.exports={isNode:typeof Buffer<"u",newBufferFrom:function(a,o){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(a,o);if(typeof a=="number")throw new Error('The "data" argument must not be a number');return new Buffer(a,o)},allocBuffer:function(a){if(Buffer.alloc)return Buffer.alloc(a);var o=new Buffer(a);return o.fill(0),o},isBuffer:function(a){return Buffer.isBuffer(a)},isStream:function(a){return a&&typeof a.on=="function"&&typeof a.pause=="function"&&typeof a.resume=="function"}}},{}],15:[function(i,l,s){"use strict";function a(_,I,z){var T,O=n.getTypeOf(I),k=n.extend(z||{},w);k.date=k.date||new Date,k.compression!==null&&(k.compression=k.compression.toUpperCase()),typeof k.unixPermissions=="string"&&(k.unixPermissions=parseInt(k.unixPermissions,8)),k.unixPermissions&&16384&k.unixPermissions&&(k.dir=!0),k.dosPermissions&&16&k.dosPermissions&&(k.dir=!0),k.dir&&(_=f(_)),k.createFolders&&(T=g(_))&&y.call(this,T,!0);var $=O==="string"&&k.binary===!1&&k.base64===!1;z&&z.binary!==void 0||(k.binary=!$),(I instanceof b&&I.uncompressedSize===0||k.dir||!I||I.length===0)&&(k.base64=!1,k.binary=!0,I="",k.compression="STORE",O="string");var D=null;D=I instanceof b||I instanceof u?I:h.isNode&&h.isStream(I)?new d(_,I):n.prepareContent(_,I,k.binary,k.optimizedBinaryString,k.base64);var E=new p(_,D,k);this.files[_]=E}var o=i("./utf8"),n=i("./utils"),u=i("./stream/GenericWorker"),v=i("./stream/StreamHelper"),w=i("./defaults"),b=i("./compressedObject"),p=i("./zipObject"),m=i("./generate"),h=i("./nodejsUtils"),d=i("./nodejs/NodejsStreamInputAdapter"),g=function(_){_.slice(-1)==="/"&&(_=_.substring(0,_.length-1));var I=_.lastIndexOf("/");return 0<I?_.substring(0,I):""},f=function(_){return _.slice(-1)!=="/"&&(_+="/"),_},y=function(_,I){return I=I!==void 0?I:w.createFolders,_=f(_),this.files[_]||a.call(this,_,null,{dir:!0,createFolders:I}),this.files[_]};function x(_){return Object.prototype.toString.call(_)==="[object RegExp]"}l.exports={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(_){var I,z,T;for(I in this.files)T=this.files[I],(z=I.slice(this.root.length,I.length))&&I.slice(0,this.root.length)===this.root&&_(z,T)},filter:function(_){var I=[];return this.forEach(function(z,T){_(z,T)&&I.push(T)}),I},file:function(_,I,z){if(arguments.length!==1)return _=this.root+_,a.call(this,_,I,z),this;if(x(_)){var T=_;return this.filter(function(k,$){return!$.dir&&T.test(k)})}var O=this.files[this.root+_];return O&&!O.dir?O:null},folder:function(_){if(!_)return this;if(x(_))return this.filter(function(O,k){return k.dir&&_.test(O)});var I=this.root+_,z=y.call(this,I),T=this.clone();return T.root=z.name,T},remove:function(_){_=this.root+_;var I=this.files[_];if(I||(_.slice(-1)!=="/"&&(_+="/"),I=this.files[_]),I&&!I.dir)delete this.files[_];else for(var z=this.filter(function(O,k){return k.name.slice(0,_.length)===_}),T=0;T<z.length;T++)delete this.files[z[T].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(_){var I,z={};try{if((z=n.extend(_||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:o.utf8encode})).type=z.type.toLowerCase(),z.compression=z.compression.toUpperCase(),z.type==="binarystring"&&(z.type="string"),!z.type)throw new Error("No output type specified.");n.checkSupport(z.type),z.platform!=="darwin"&&z.platform!=="freebsd"&&z.platform!=="linux"&&z.platform!=="sunos"||(z.platform="UNIX"),z.platform==="win32"&&(z.platform="DOS");var T=z.comment||this.comment||"";I=m.generateWorker(this,z,T)}catch(O){(I=new u("error")).error(O)}return new v(I,z.type||"string",z.mimeType)},generateAsync:function(_,I){return this.generateInternalStream(_).accumulate(I)},generateNodeStream:function(_,I){return(_=_||{}).type||(_.type="nodebuffer"),this.generateInternalStream(_).toNodejsStream(I)}}},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(i,l,s){"use strict";l.exports=i("stream")},{stream:void 0}],17:[function(i,l,s){"use strict";var a=i("./DataReader");function o(n){a.call(this,n);for(var u=0;u<this.data.length;u++)n[u]=255&n[u]}i("../utils").inherits(o,a),o.prototype.byteAt=function(n){return this.data[this.zero+n]},o.prototype.lastIndexOfSignature=function(n){for(var u=n.charCodeAt(0),v=n.charCodeAt(1),w=n.charCodeAt(2),b=n.charCodeAt(3),p=this.length-4;0<=p;--p)if(this.data[p]===u&&this.data[p+1]===v&&this.data[p+2]===w&&this.data[p+3]===b)return p-this.zero;return-1},o.prototype.readAndCheckSignature=function(n){var u=n.charCodeAt(0),v=n.charCodeAt(1),w=n.charCodeAt(2),b=n.charCodeAt(3),p=this.readData(4);return u===p[0]&&v===p[1]&&w===p[2]&&b===p[3]},o.prototype.readData=function(n){if(this.checkOffset(n),n===0)return[];var u=this.data.slice(this.zero+this.index,this.zero+this.index+n);return this.index+=n,u},l.exports=o},{"../utils":32,"./DataReader":18}],18:[function(i,l,s){"use strict";var a=i("../utils");function o(n){this.data=n,this.length=n.length,this.index=0,this.zero=0}o.prototype={checkOffset:function(n){this.checkIndex(this.index+n)},checkIndex:function(n){if(this.length<this.zero+n||n<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+n+"). Corrupted zip ?")},setIndex:function(n){this.checkIndex(n),this.index=n},skip:function(n){this.setIndex(this.index+n)},byteAt:function(){},readInt:function(n){var u,v=0;for(this.checkOffset(n),u=this.index+n-1;u>=this.index;u--)v=(v<<8)+this.byteAt(u);return this.index+=n,v},readString:function(n){return a.transformTo("string",this.readData(n))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var n=this.readInt(4);return new Date(Date.UTC(1980+(n>>25&127),(n>>21&15)-1,n>>16&31,n>>11&31,n>>5&63,(31&n)<<1))}},l.exports=o},{"../utils":32}],19:[function(i,l,s){"use strict";var a=i("./Uint8ArrayReader");function o(n){a.call(this,n)}i("../utils").inherits(o,a),o.prototype.readData=function(n){this.checkOffset(n);var u=this.data.slice(this.zero+this.index,this.zero+this.index+n);return this.index+=n,u},l.exports=o},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(i,l,s){"use strict";var a=i("./DataReader");function o(n){a.call(this,n)}i("../utils").inherits(o,a),o.prototype.byteAt=function(n){return this.data.charCodeAt(this.zero+n)},o.prototype.lastIndexOfSignature=function(n){return this.data.lastIndexOf(n)-this.zero},o.prototype.readAndCheckSignature=function(n){return n===this.readData(4)},o.prototype.readData=function(n){this.checkOffset(n);var u=this.data.slice(this.zero+this.index,this.zero+this.index+n);return this.index+=n,u},l.exports=o},{"../utils":32,"./DataReader":18}],21:[function(i,l,s){"use strict";var a=i("./ArrayReader");function o(n){a.call(this,n)}i("../utils").inherits(o,a),o.prototype.readData=function(n){if(this.checkOffset(n),n===0)return new Uint8Array(0);var u=this.data.subarray(this.zero+this.index,this.zero+this.index+n);return this.index+=n,u},l.exports=o},{"../utils":32,"./ArrayReader":17}],22:[function(i,l,s){"use strict";var a=i("../utils"),o=i("../support"),n=i("./ArrayReader"),u=i("./StringReader"),v=i("./NodeBufferReader"),w=i("./Uint8ArrayReader");l.exports=function(b){var p=a.getTypeOf(b);return a.checkSupport(p),p!=="string"||o.uint8array?p==="nodebuffer"?new v(b):o.uint8array?new w(a.transformTo("uint8array",b)):new n(a.transformTo("array",b)):new u(b)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(i,l,s){"use strict";s.LOCAL_FILE_HEADER="PK",s.CENTRAL_FILE_HEADER="PK",s.CENTRAL_DIRECTORY_END="PK",s.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK\x07",s.ZIP64_CENTRAL_DIRECTORY_END="PK",s.DATA_DESCRIPTOR="PK\x07\b"},{}],24:[function(i,l,s){"use strict";var a=i("./GenericWorker"),o=i("../utils");function n(u){a.call(this,"ConvertWorker to "+u),this.destType=u}o.inherits(n,a),n.prototype.processChunk=function(u){this.push({data:o.transformTo(this.destType,u.data),meta:u.meta})},l.exports=n},{"../utils":32,"./GenericWorker":28}],25:[function(i,l,s){"use strict";var a=i("./GenericWorker"),o=i("../crc32");function n(){a.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}i("../utils").inherits(n,a),n.prototype.processChunk=function(u){this.streamInfo.crc32=o(u.data,this.streamInfo.crc32||0),this.push(u)},l.exports=n},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(i,l,s){"use strict";var a=i("../utils"),o=i("./GenericWorker");function n(u){o.call(this,"DataLengthProbe for "+u),this.propName=u,this.withStreamInfo(u,0)}a.inherits(n,o),n.prototype.processChunk=function(u){if(u){var v=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=v+u.data.length}o.prototype.processChunk.call(this,u)},l.exports=n},{"../utils":32,"./GenericWorker":28}],27:[function(i,l,s){"use strict";var a=i("../utils"),o=i("./GenericWorker");function n(u){o.call(this,"DataWorker");var v=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,u.then(function(w){v.dataIsReady=!0,v.data=w,v.max=w&&w.length||0,v.type=a.getTypeOf(w),v.isPaused||v._tickAndRepeat()},function(w){v.error(w)})}a.inherits(n,o),n.prototype.cleanUp=function(){o.prototype.cleanUp.call(this),this.data=null},n.prototype.resume=function(){return!!o.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,a.delay(this._tickAndRepeat,[],this)),!0)},n.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(a.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},n.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var u=null,v=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":u=this.data.substring(this.index,v);break;case"uint8array":u=this.data.subarray(this.index,v);break;case"array":case"nodebuffer":u=this.data.slice(this.index,v)}return this.index=v,this.push({data:u,meta:{percent:this.max?this.index/this.max*100:0}})},l.exports=n},{"../utils":32,"./GenericWorker":28}],28:[function(i,l,s){"use strict";function a(o){this.name=o||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}a.prototype={push:function(o){this.emit("data",o)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(o){this.emit("error",o)}return!0},error:function(o){return!this.isFinished&&(this.isPaused?this.generatedError=o:(this.isFinished=!0,this.emit("error",o),this.previous&&this.previous.error(o),this.cleanUp()),!0)},on:function(o,n){return this._listeners[o].push(n),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(o,n){if(this._listeners[o])for(var u=0;u<this._listeners[o].length;u++)this._listeners[o][u].call(this,n)},pipe:function(o){return o.registerPrevious(this)},registerPrevious:function(o){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=o.streamInfo,this.mergeStreamInfo(),this.previous=o;var n=this;return o.on("data",function(u){n.processChunk(u)}),o.on("end",function(){n.end()}),o.on("error",function(u){n.error(u)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var o=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),o=!0),this.previous&&this.previous.resume(),!o},flush:function(){},processChunk:function(o){this.push(o)},withStreamInfo:function(o,n){return this.extraStreamInfo[o]=n,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var o in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,o)&&(this.streamInfo[o]=this.extraStreamInfo[o])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var o="Worker "+this.name;return this.previous?this.previous+" -> "+o:o}},l.exports=a},{}],29:[function(i,l,s){"use strict";var a=i("../utils"),o=i("./ConvertWorker"),n=i("./GenericWorker"),u=i("../base64"),v=i("../support"),w=i("../external"),b=null;if(v.nodestream)try{b=i("../nodejs/NodejsStreamOutputAdapter")}catch{}function p(h,d){return new w.Promise(function(g,f){var y=[],x=h._internalType,_=h._outputType,I=h._mimeType;h.on("data",function(z,T){y.push(z),d&&d(T)}).on("error",function(z){y=[],f(z)}).on("end",function(){try{g((function(z,T,O){switch(z){case"blob":return a.newBlob(a.transformTo("arraybuffer",T),O);case"base64":return u.encode(T);default:return a.transformTo(z,T)}})(_,(function(z,T){var O,k=0,$=null,D=0;for(O=0;O<T.length;O++)D+=T[O].length;switch(z){case"string":return T.join("");case"array":return Array.prototype.concat.apply([],T);case"uint8array":for($=new Uint8Array(D),O=0;O<T.length;O++)$.set(T[O],k),k+=T[O].length;return $;case"nodebuffer":return Buffer.concat(T);default:throw new Error("concat : unsupported type '"+z+"'")}})(x,y),I))}catch(z){f(z)}y=[]}).resume()})}function m(h,d,g){var f=d;switch(d){case"blob":case"arraybuffer":f="uint8array";break;case"base64":f="string"}try{this._internalType=f,this._outputType=d,this._mimeType=g,a.checkSupport(f),this._worker=h.pipe(new o(f)),h.lock()}catch(y){this._worker=new n("error"),this._worker.error(y)}}m.prototype={accumulate:function(h){return p(this,h)},on:function(h,d){var g=this;return h==="data"?this._worker.on(h,function(f){d.call(g,f.data,f.meta)}):this._worker.on(h,function(){a.delay(d,arguments,g)}),this},resume:function(){return a.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(h){if(a.checkSupport("nodestream"),this._outputType!=="nodebuffer")throw new Error(this._outputType+" is not supported by this method");return new b(this,{objectMode:this._outputType!=="nodebuffer"},h)}},l.exports=m},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(i,l,s){"use strict";if(s.base64=!0,s.array=!0,s.string=!0,s.arraybuffer=typeof ArrayBuffer<"u"&&typeof Uint8Array<"u",s.nodebuffer=typeof Buffer<"u",s.uint8array=typeof Uint8Array<"u",typeof ArrayBuffer>"u")s.blob=!1;else{var a=new ArrayBuffer(0);try{s.blob=new Blob([a],{type:"application/zip"}).size===0}catch{try{var o=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);o.append(a),s.blob=o.getBlob("application/zip").size===0}catch{s.blob=!1}}}try{s.nodestream=!!i("readable-stream").Readable}catch{s.nodestream=!1}},{"readable-stream":16}],31:[function(i,l,s){"use strict";for(var a=i("./utils"),o=i("./support"),n=i("./nodejsUtils"),u=i("./stream/GenericWorker"),v=new Array(256),w=0;w<256;w++)v[w]=252<=w?6:248<=w?5:240<=w?4:224<=w?3:192<=w?2:1;v[254]=v[254]=1;function b(){u.call(this,"utf-8 decode"),this.leftOver=null}function p(){u.call(this,"utf-8 encode")}s.utf8encode=function(m){return o.nodebuffer?n.newBufferFrom(m,"utf-8"):(function(h){var d,g,f,y,x,_=h.length,I=0;for(y=0;y<_;y++)(64512&(g=h.charCodeAt(y)))==55296&&y+1<_&&(64512&(f=h.charCodeAt(y+1)))==56320&&(g=65536+(g-55296<<10)+(f-56320),y++),I+=g<128?1:g<2048?2:g<65536?3:4;for(d=o.uint8array?new Uint8Array(I):new Array(I),y=x=0;x<I;y++)(64512&(g=h.charCodeAt(y)))==55296&&y+1<_&&(64512&(f=h.charCodeAt(y+1)))==56320&&(g=65536+(g-55296<<10)+(f-56320),y++),g<128?d[x++]=g:(g<2048?d[x++]=192|g>>>6:(g<65536?d[x++]=224|g>>>12:(d[x++]=240|g>>>18,d[x++]=128|g>>>12&63),d[x++]=128|g>>>6&63),d[x++]=128|63&g);return d})(m)},s.utf8decode=function(m){return o.nodebuffer?a.transformTo("nodebuffer",m).toString("utf-8"):(function(h){var d,g,f,y,x=h.length,_=new Array(2*x);for(d=g=0;d<x;)if((f=h[d++])<128)_[g++]=f;else if(4<(y=v[f]))_[g++]=65533,d+=y-1;else{for(f&=y===2?31:y===3?15:7;1<y&&d<x;)f=f<<6|63&h[d++],y--;1<y?_[g++]=65533:f<65536?_[g++]=f:(f-=65536,_[g++]=55296|f>>10&1023,_[g++]=56320|1023&f)}return _.length!==g&&(_.subarray?_=_.subarray(0,g):_.length=g),a.applyFromCharCode(_)})(m=a.transformTo(o.uint8array?"uint8array":"array",m))},a.inherits(b,u),b.prototype.processChunk=function(m){var h=a.transformTo(o.uint8array?"uint8array":"array",m.data);if(this.leftOver&&this.leftOver.length){if(o.uint8array){var d=h;(h=new Uint8Array(d.length+this.leftOver.length)).set(this.leftOver,0),h.set(d,this.leftOver.length)}else h=this.leftOver.concat(h);this.leftOver=null}var g=(function(y,x){var _;for((x=x||y.length)>y.length&&(x=y.length),_=x-1;0<=_&&(192&y[_])==128;)_--;return _<0||_===0?x:_+v[y[_]]>x?_:x})(h),f=h;g!==h.length&&(o.uint8array?(f=h.subarray(0,g),this.leftOver=h.subarray(g,h.length)):(f=h.slice(0,g),this.leftOver=h.slice(g,h.length))),this.push({data:s.utf8decode(f),meta:m.meta})},b.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=b,a.inherits(p,u),p.prototype.processChunk=function(m){this.push({data:s.utf8encode(m.data),meta:m.meta})},s.Utf8EncodeWorker=p},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(i,l,s){"use strict";var a=i("./support"),o=i("./base64"),n=i("./nodejsUtils"),u=i("./external");function v(d){return d}function w(d,g){for(var f=0;f<d.length;++f)g[f]=255&d.charCodeAt(f);return g}i("setimmediate"),s.newBlob=function(d,g){s.checkSupport("blob");try{return new Blob([d],{type:g})}catch{try{var f=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return f.append(d),f.getBlob(g)}catch{throw new Error("Bug : can't construct the Blob.")}}};var b={stringifyByChunk:function(d,g,f){var y=[],x=0,_=d.length;if(_<=f)return String.fromCharCode.apply(null,d);for(;x<_;)g==="array"||g==="nodebuffer"?y.push(String.fromCharCode.apply(null,d.slice(x,Math.min(x+f,_)))):y.push(String.fromCharCode.apply(null,d.subarray(x,Math.min(x+f,_)))),x+=f;return y.join("")},stringifyByChar:function(d){for(var g="",f=0;f<d.length;f++)g+=String.fromCharCode(d[f]);return g},applyCanBeUsed:{uint8array:(function(){try{return a.uint8array&&String.fromCharCode.apply(null,new Uint8Array(1)).length===1}catch{return!1}})(),nodebuffer:(function(){try{return a.nodebuffer&&String.fromCharCode.apply(null,n.allocBuffer(1)).length===1}catch{return!1}})()}};function p(d){var g=65536,f=s.getTypeOf(d),y=!0;if(f==="uint8array"?y=b.applyCanBeUsed.uint8array:f==="nodebuffer"&&(y=b.applyCanBeUsed.nodebuffer),y)for(;1<g;)try{return b.stringifyByChunk(d,f,g)}catch{g=Math.floor(g/2)}return b.stringifyByChar(d)}function m(d,g){for(var f=0;f<d.length;f++)g[f]=d[f];return g}s.applyFromCharCode=p;var h={};h.string={string:v,array:function(d){return w(d,new Array(d.length))},arraybuffer:function(d){return h.string.uint8array(d).buffer},uint8array:function(d){return w(d,new Uint8Array(d.length))},nodebuffer:function(d){return w(d,n.allocBuffer(d.length))}},h.array={string:p,array:v,arraybuffer:function(d){return new Uint8Array(d).buffer},uint8array:function(d){return new Uint8Array(d)},nodebuffer:function(d){return n.newBufferFrom(d)}},h.arraybuffer={string:function(d){return p(new Uint8Array(d))},array:function(d){return m(new Uint8Array(d),new Array(d.byteLength))},arraybuffer:v,uint8array:function(d){return new Uint8Array(d)},nodebuffer:function(d){return n.newBufferFrom(new Uint8Array(d))}},h.uint8array={string:p,array:function(d){return m(d,new Array(d.length))},arraybuffer:function(d){return d.buffer},uint8array:v,nodebuffer:function(d){return n.newBufferFrom(d)}},h.nodebuffer={string:p,array:function(d){return m(d,new Array(d.length))},arraybuffer:function(d){return h.nodebuffer.uint8array(d).buffer},uint8array:function(d){return m(d,new Uint8Array(d.length))},nodebuffer:v},s.transformTo=function(d,g){return g=g||"",d?(s.checkSupport(d),h[s.getTypeOf(g)][d](g)):g},s.resolve=function(d){for(var g=d.split("/"),f=[],y=0;y<g.length;y++){var x=g[y];x==="."||x===""&&y!==0&&y!==g.length-1||(x===".."?f.pop():f.push(x))}return f.join("/")},s.getTypeOf=function(d){if(typeof d=="string")return"string";var g=Object.prototype.toString.call(d);return g==="[object Array]"?"array":a.nodebuffer&&n.isBuffer(d)?"nodebuffer":a.uint8array&&g==="[object Uint8Array]"?"uint8array":a.arraybuffer&&g==="[object ArrayBuffer]"?"arraybuffer":void 0},s.checkSupport=function(d){if(!a[d.toLowerCase()])throw new Error(d+" is not supported by this platform")},s.MAX_VALUE_16BITS=65535,s.MAX_VALUE_32BITS=-1,s.pretty=function(d){var g,f,y="";for(f=0;f<(d||"").length;f++)y+="\\x"+((g=d.charCodeAt(f))<16?"0":"")+g.toString(16).toUpperCase();return y},s.delay=function(d,g,f){setImmediate(function(){d.apply(f||null,g||[])})},s.inherits=function(d,g){function f(){}f.prototype=g.prototype,d.prototype=new f},s.extend=function(){var d,g,f={};for(d=0;d<arguments.length;d++)for(g in arguments[d])Object.prototype.hasOwnProperty.call(arguments[d],g)&&f[g]===void 0&&(f[g]=arguments[d][g]);return f},s.prepareContent=function(d,g,f,y,x){return u.Promise.resolve(g).then(function(_){return a.blob&&(_ instanceof Blob||["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(_))!==-1)?Blob.prototype.arrayBuffer!==void 0?_.arrayBuffer():typeof FileReader<"u"?new u.Promise(function(I,z){var T=new FileReader;T.onload=function(O){I(O.target.result)},T.onerror=function(O){z(O.target.error)},T.readAsArrayBuffer(_)}):u.Promise.reject(new Error(d+" is a Blob, but we have no way of reading it.")):_}).then(function(_){var I=s.getTypeOf(_);return I?(I==="arraybuffer"?_=s.transformTo("uint8array",_):I==="string"&&(x?_=o.decode(_):f&&y!==!0&&(_=(function(z){return w(z,a.uint8array?new Uint8Array(z.length):new Array(z.length))})(_))),_):u.Promise.reject(new Error("Can't read the data of '"+d+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(i,l,s){"use strict";var a=i("./reader/readerFor"),o=i("./utils"),n=i("./signature"),u=i("./zipEntry"),v=i("./support");function w(b){this.files=[],this.loadOptions=b}w.prototype={checkSignature:function(b){if(!this.reader.readAndCheckSignature(b)){this.reader.index-=4;var p=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+o.pretty(p)+", expected "+o.pretty(b)+")")}},isSignature:function(b,p){var m=this.reader.index;this.reader.setIndex(b);var h=this.reader.readString(4)===p;return this.reader.setIndex(m),h},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var b=this.reader.readData(this.zipCommentLength),p=v.uint8array?"uint8array":"array",m=o.transformTo(p,b);this.zipComment=this.loadOptions.decodeFileName(m)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var b,p,m,h=this.zip64EndOfCentralSize-44;0<h;)b=this.reader.readInt(2),p=this.reader.readInt(4),m=this.reader.readData(p),this.zip64ExtensibleData[b]={id:b,length:p,value:m}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){for(var b=0,p;b<this.files.length;b++)p=this.files[b],this.reader.setIndex(p.localHeaderOffset),this.checkSignature(n.LOCAL_FILE_HEADER),p.readLocalPart(this.reader),p.handleUTF8(),p.processAttributes()},readCentralDir:function(){var b;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(n.CENTRAL_FILE_HEADER);)(b=new u({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(b);if(this.centralDirRecords!==this.files.length&&this.centralDirRecords!==0&&this.files.length===0)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var b=this.reader.lastIndexOfSignature(n.CENTRAL_DIRECTORY_END);if(b<0)throw this.isSignature(0,n.LOCAL_FILE_HEADER)?new Error("Corrupted zip: can't find end of central directory"):new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");this.reader.setIndex(b);var p=b;if(this.checkSignature(n.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===o.MAX_VALUE_16BITS||this.diskWithCentralDirStart===o.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===o.MAX_VALUE_16BITS||this.centralDirRecords===o.MAX_VALUE_16BITS||this.centralDirSize===o.MAX_VALUE_32BITS||this.centralDirOffset===o.MAX_VALUE_32BITS){if(this.zip64=!0,(b=this.reader.lastIndexOfSignature(n.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(b),this.checkSignature(n.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,n.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(n.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(n.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var m=this.centralDirOffset+this.centralDirSize;this.zip64&&(m+=20,m+=12+this.zip64EndOfCentralSize);var h=p-m;if(0<h)this.isSignature(p,n.CENTRAL_FILE_HEADER)||(this.reader.zero=h);else if(h<0)throw new Error("Corrupted zip: missing "+Math.abs(h)+" bytes.")},prepareReader:function(b){this.reader=a(b)},load:function(b){this.prepareReader(b),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},l.exports=w},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(i,l,s){"use strict";var a=i("./reader/readerFor"),o=i("./utils"),n=i("./compressedObject"),u=i("./crc32"),v=i("./utf8"),w=i("./compressions"),b=i("./support");function p(m,h){this.options=m,this.loadOptions=h}p.prototype={isEncrypted:function(){return(1&this.bitFlag)==1},useUTF8:function(){return(2048&this.bitFlag)==2048},readLocalPart:function(m){var h,d;if(m.skip(22),this.fileNameLength=m.readInt(2),d=m.readInt(2),this.fileName=m.readData(this.fileNameLength),m.skip(d),this.compressedSize===-1||this.uncompressedSize===-1)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if((h=(function(g){for(var f in w)if(Object.prototype.hasOwnProperty.call(w,f)&&w[f].magic===g)return w[f];return null})(this.compressionMethod))===null)throw new Error("Corrupted zip : compression "+o.pretty(this.compressionMethod)+" unknown (inner file : "+o.transformTo("string",this.fileName)+")");this.decompressed=new n(this.compressedSize,this.uncompressedSize,this.crc32,h,m.readData(this.compressedSize))},readCentralPart:function(m){this.versionMadeBy=m.readInt(2),m.skip(2),this.bitFlag=m.readInt(2),this.compressionMethod=m.readString(2),this.date=m.readDate(),this.crc32=m.readInt(4),this.compressedSize=m.readInt(4),this.uncompressedSize=m.readInt(4);var h=m.readInt(2);if(this.extraFieldsLength=m.readInt(2),this.fileCommentLength=m.readInt(2),this.diskNumberStart=m.readInt(2),this.internalFileAttributes=m.readInt(2),this.externalFileAttributes=m.readInt(4),this.localHeaderOffset=m.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");m.skip(h),this.readExtraFields(m),this.parseZIP64ExtraField(m),this.fileComment=m.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var m=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),m==0&&(this.dosPermissions=63&this.externalFileAttributes),m==3&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||this.fileNameStr.slice(-1)!=="/"||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var m=a(this.extraFields[1].value);this.uncompressedSize===o.MAX_VALUE_32BITS&&(this.uncompressedSize=m.readInt(8)),this.compressedSize===o.MAX_VALUE_32BITS&&(this.compressedSize=m.readInt(8)),this.localHeaderOffset===o.MAX_VALUE_32BITS&&(this.localHeaderOffset=m.readInt(8)),this.diskNumberStart===o.MAX_VALUE_32BITS&&(this.diskNumberStart=m.readInt(4))}},readExtraFields:function(m){var h,d,g,f=m.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});m.index+4<f;)h=m.readInt(2),d=m.readInt(2),g=m.readData(d),this.extraFields[h]={id:h,length:d,value:g};m.setIndex(f)},handleUTF8:function(){var m=b.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=v.utf8decode(this.fileName),this.fileCommentStr=v.utf8decode(this.fileComment);else{var h=this.findExtraFieldUnicodePath();if(h!==null)this.fileNameStr=h;else{var d=o.transformTo(m,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(d)}var g=this.findExtraFieldUnicodeComment();if(g!==null)this.fileCommentStr=g;else{var f=o.transformTo(m,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(f)}}},findExtraFieldUnicodePath:function(){var m=this.extraFields[28789];if(m){var h=a(m.value);return h.readInt(1)!==1||u(this.fileName)!==h.readInt(4)?null:v.utf8decode(h.readData(m.length-5))}return null},findExtraFieldUnicodeComment:function(){var m=this.extraFields[25461];if(m){var h=a(m.value);return h.readInt(1)!==1||u(this.fileComment)!==h.readInt(4)?null:v.utf8decode(h.readData(m.length-5))}return null}},l.exports=p},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(i,l,s){"use strict";function a(h,d,g){this.name=h,this.dir=g.dir,this.date=g.date,this.comment=g.comment,this.unixPermissions=g.unixPermissions,this.dosPermissions=g.dosPermissions,this._data=d,this._dataBinary=g.binary,this.options={compression:g.compression,compressionOptions:g.compressionOptions}}var o=i("./stream/StreamHelper"),n=i("./stream/DataWorker"),u=i("./utf8"),v=i("./compressedObject"),w=i("./stream/GenericWorker");a.prototype={internalStream:function(h){var d=null,g="string";try{if(!h)throw new Error("No output type specified.");var f=(g=h.toLowerCase())==="string"||g==="text";g!=="binarystring"&&g!=="text"||(g="string"),d=this._decompressWorker();var y=!this._dataBinary;y&&!f&&(d=d.pipe(new u.Utf8EncodeWorker)),!y&&f&&(d=d.pipe(new u.Utf8DecodeWorker))}catch(x){(d=new w("error")).error(x)}return new o(d,g,"")},async:function(h,d){return this.internalStream(h).accumulate(d)},nodeStream:function(h,d){return this.internalStream(h||"nodebuffer").toNodejsStream(d)},_compressWorker:function(h,d){if(this._data instanceof v&&this._data.compression.magic===h.magic)return this._data.getCompressedWorker();var g=this._decompressWorker();return this._dataBinary||(g=g.pipe(new u.Utf8EncodeWorker)),v.createWorkerFrom(g,h,d)},_decompressWorker:function(){return this._data instanceof v?this._data.getContentWorker():this._data instanceof w?this._data:new n(this._data)}};for(var b=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],p=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},m=0;m<b.length;m++)a.prototype[b[m]]=p;l.exports=a},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(i,l,s){(function(a){"use strict";var o,n,u=a.MutationObserver||a.WebKitMutationObserver;if(u){var v=0,w=new u(h),b=a.document.createTextNode("");w.observe(b,{characterData:!0}),o=function(){b.data=v=++v%2}}else if(a.setImmediate||a.MessageChannel===void 0)o="document"in a&&"onreadystatechange"in a.document.createElement("script")?function(){var d=a.document.createElement("script");d.onreadystatechange=function(){h(),d.onreadystatechange=null,d.parentNode.removeChild(d),d=null},a.document.documentElement.appendChild(d)}:function(){setTimeout(h,0)};else{var p=new a.MessageChannel;p.port1.onmessage=h,o=function(){p.port2.postMessage(0)}}var m=[];function h(){var d,g;n=!0;for(var f=m.length;f;){for(g=m,m=[],d=-1;++d<f;)g[d]();f=m.length}n=!1}l.exports=function(d){m.push(d)!==1||n||o()}}).call(this,typeof global<"u"?global:typeof self<"u"?self:typeof window<"u"?window:{})},{}],37:[function(i,l,s){"use strict";var a=i("immediate");function o(){}var n={},u=["REJECTED"],v=["FULFILLED"],w=["PENDING"];function b(f){if(typeof f!="function")throw new TypeError("resolver must be a function");this.state=w,this.queue=[],this.outcome=void 0,f!==o&&d(this,f)}function p(f,y,x){this.promise=f,typeof y=="function"&&(this.onFulfilled=y,this.callFulfilled=this.otherCallFulfilled),typeof x=="function"&&(this.onRejected=x,this.callRejected=this.otherCallRejected)}function m(f,y,x){a(function(){var _;try{_=y(x)}catch(I){return n.reject(f,I)}_===f?n.reject(f,new TypeError("Cannot resolve promise with itself")):n.resolve(f,_)})}function h(f){var y=f&&f.then;if(f&&(typeof f=="object"||typeof f=="function")&&typeof y=="function")return function(){y.apply(f,arguments)}}function d(f,y){var x=!1;function _(T){x||(x=!0,n.reject(f,T))}function I(T){x||(x=!0,n.resolve(f,T))}var z=g(function(){y(I,_)});z.status==="error"&&_(z.value)}function g(f,y){var x={};try{x.value=f(y),x.status="success"}catch(_){x.status="error",x.value=_}return x}(l.exports=b).prototype.finally=function(f){if(typeof f!="function")return this;var y=this.constructor;return this.then(function(x){return y.resolve(f()).then(function(){return x})},function(x){return y.resolve(f()).then(function(){throw x})})},b.prototype.catch=function(f){return this.then(null,f)},b.prototype.then=function(f,y){if(typeof f!="function"&&this.state===v||typeof y!="function"&&this.state===u)return this;var x=new this.constructor(o);return this.state!==w?m(x,this.state===v?f:y,this.outcome):this.queue.push(new p(x,f,y)),x},p.prototype.callFulfilled=function(f){n.resolve(this.promise,f)},p.prototype.otherCallFulfilled=function(f){m(this.promise,this.onFulfilled,f)},p.prototype.callRejected=function(f){n.reject(this.promise,f)},p.prototype.otherCallRejected=function(f){m(this.promise,this.onRejected,f)},n.resolve=function(f,y){var x=g(h,y);if(x.status==="error")return n.reject(f,x.value);var _=x.value;if(_)d(f,_);else{f.state=v,f.outcome=y;for(var I=-1,z=f.queue.length;++I<z;)f.queue[I].callFulfilled(y)}return f},n.reject=function(f,y){f.state=u,f.outcome=y;for(var x=-1,_=f.queue.length;++x<_;)f.queue[x].callRejected(y);return f},b.resolve=function(f){return f instanceof this?f:n.resolve(new this(o),f)},b.reject=function(f){var y=new this(o);return n.reject(y,f)},b.all=function(f){var y=this;if(Object.prototype.toString.call(f)!=="[object Array]")return this.reject(new TypeError("must be an array"));var x=f.length,_=!1;if(!x)return this.resolve([]);for(var I=new Array(x),z=0,T=-1,O=new this(o);++T<x;)k(f[T],T);return O;function k($,D){y.resolve($).then(function(E){I[D]=E,++z!==x||_||(_=!0,n.resolve(O,I))},function(E){_||(_=!0,n.reject(O,E))})}},b.race=function(f){var y=this;if(Object.prototype.toString.call(f)!=="[object Array]")return this.reject(new TypeError("must be an array"));var x=f.length,_=!1;if(!x)return this.resolve([]);for(var I=-1,z=new this(o);++I<x;)T=f[I],y.resolve(T).then(function(O){_||(_=!0,n.resolve(z,O))},function(O){_||(_=!0,n.reject(z,O))});var T;return z}},{immediate:36}],38:[function(i,l,s){"use strict";var a={};(0,i("./lib/utils/common").assign)(a,i("./lib/deflate"),i("./lib/inflate"),i("./lib/zlib/constants")),l.exports=a},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(i,l,s){"use strict";var a=i("./zlib/deflate"),o=i("./utils/common"),n=i("./utils/strings"),u=i("./zlib/messages"),v=i("./zlib/zstream"),w=Object.prototype.toString,b=0,p=-1,m=0,h=8;function d(f){if(!(this instanceof d))return new d(f);this.options=o.assign({level:p,method:h,chunkSize:16384,windowBits:15,memLevel:8,strategy:m,to:""},f||{});var y=this.options;y.raw&&0<y.windowBits?y.windowBits=-y.windowBits:y.gzip&&0<y.windowBits&&y.windowBits<16&&(y.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new v,this.strm.avail_out=0;var x=a.deflateInit2(this.strm,y.level,y.method,y.windowBits,y.memLevel,y.strategy);if(x!==b)throw new Error(u[x]);if(y.header&&a.deflateSetHeader(this.strm,y.header),y.dictionary){var _=typeof y.dictionary=="string"?n.string2buf(y.dictionary):w.call(y.dictionary)==="[object ArrayBuffer]"?new Uint8Array(y.dictionary):y.dictionary;if((x=a.deflateSetDictionary(this.strm,_))!==b)throw new Error(u[x]);this._dict_set=!0}}function g(f,y){var x=new d(y);if(x.push(f,!0),x.err)throw x.msg||u[x.err];return x.result}d.prototype.push=function(f,y){var x,_,I=this.strm,z=this.options.chunkSize;if(this.ended)return!1;_=y===~~y?y:y===!0?4:0,typeof f=="string"?I.input=n.string2buf(f):w.call(f)==="[object ArrayBuffer]"?I.input=new Uint8Array(f):I.input=f,I.next_in=0,I.avail_in=I.input.length;do{if(I.avail_out===0&&(I.output=new o.Buf8(z),I.next_out=0,I.avail_out=z),(x=a.deflate(I,_))!==1&&x!==b)return this.onEnd(x),!(this.ended=!0);I.avail_out!==0&&(I.avail_in!==0||_!==4&&_!==2)||(this.options.to==="string"?this.onData(n.buf2binstring(o.shrinkBuf(I.output,I.next_out))):this.onData(o.shrinkBuf(I.output,I.next_out)))}while((0<I.avail_in||I.avail_out===0)&&x!==1);return _===4?(x=a.deflateEnd(this.strm),this.onEnd(x),this.ended=!0,x===b):_!==2||(this.onEnd(b),!(I.avail_out=0))},d.prototype.onData=function(f){this.chunks.push(f)},d.prototype.onEnd=function(f){f===b&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=f,this.msg=this.strm.msg},s.Deflate=d,s.deflate=g,s.deflateRaw=function(f,y){return(y=y||{}).raw=!0,g(f,y)},s.gzip=function(f,y){return(y=y||{}).gzip=!0,g(f,y)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(i,l,s){"use strict";var a=i("./zlib/inflate"),o=i("./utils/common"),n=i("./utils/strings"),u=i("./zlib/constants"),v=i("./zlib/messages"),w=i("./zlib/zstream"),b=i("./zlib/gzheader"),p=Object.prototype.toString;function m(d){if(!(this instanceof m))return new m(d);this.options=o.assign({chunkSize:16384,windowBits:0,to:""},d||{});var g=this.options;g.raw&&0<=g.windowBits&&g.windowBits<16&&(g.windowBits=-g.windowBits,g.windowBits===0&&(g.windowBits=-15)),!(0<=g.windowBits&&g.windowBits<16)||d&&d.windowBits||(g.windowBits+=32),15<g.windowBits&&g.windowBits<48&&(15&g.windowBits)==0&&(g.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new w,this.strm.avail_out=0;var f=a.inflateInit2(this.strm,g.windowBits);if(f!==u.Z_OK)throw new Error(v[f]);this.header=new b,a.inflateGetHeader(this.strm,this.header)}function h(d,g){var f=new m(g);if(f.push(d,!0),f.err)throw f.msg||v[f.err];return f.result}m.prototype.push=function(d,g){var f,y,x,_,I,z,T=this.strm,O=this.options.chunkSize,k=this.options.dictionary,$=!1;if(this.ended)return!1;y=g===~~g?g:g===!0?u.Z_FINISH:u.Z_NO_FLUSH,typeof d=="string"?T.input=n.binstring2buf(d):p.call(d)==="[object ArrayBuffer]"?T.input=new Uint8Array(d):T.input=d,T.next_in=0,T.avail_in=T.input.length;do{if(T.avail_out===0&&(T.output=new o.Buf8(O),T.next_out=0,T.avail_out=O),(f=a.inflate(T,u.Z_NO_FLUSH))===u.Z_NEED_DICT&&k&&(z=typeof k=="string"?n.string2buf(k):p.call(k)==="[object ArrayBuffer]"?new Uint8Array(k):k,f=a.inflateSetDictionary(this.strm,z)),f===u.Z_BUF_ERROR&&$===!0&&(f=u.Z_OK,$=!1),f!==u.Z_STREAM_END&&f!==u.Z_OK)return this.onEnd(f),!(this.ended=!0);T.next_out&&(T.avail_out!==0&&f!==u.Z_STREAM_END&&(T.avail_in!==0||y!==u.Z_FINISH&&y!==u.Z_SYNC_FLUSH)||(this.options.to==="string"?(x=n.utf8border(T.output,T.next_out),_=T.next_out-x,I=n.buf2string(T.output,x),T.next_out=_,T.avail_out=O-_,_&&o.arraySet(T.output,T.output,x,_,0),this.onData(I)):this.onData(o.shrinkBuf(T.output,T.next_out)))),T.avail_in===0&&T.avail_out===0&&($=!0)}while((0<T.avail_in||T.avail_out===0)&&f!==u.Z_STREAM_END);return f===u.Z_STREAM_END&&(y=u.Z_FINISH),y===u.Z_FINISH?(f=a.inflateEnd(this.strm),this.onEnd(f),this.ended=!0,f===u.Z_OK):y!==u.Z_SYNC_FLUSH||(this.onEnd(u.Z_OK),!(T.avail_out=0))},m.prototype.onData=function(d){this.chunks.push(d)},m.prototype.onEnd=function(d){d===u.Z_OK&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=d,this.msg=this.strm.msg},s.Inflate=m,s.inflate=h,s.inflateRaw=function(d,g){return(g=g||{}).raw=!0,h(d,g)},s.ungzip=h},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(i,l,s){"use strict";var a=typeof Uint8Array<"u"&&typeof Uint16Array<"u"&&typeof Int32Array<"u";s.assign=function(u){for(var v=Array.prototype.slice.call(arguments,1);v.length;){var w=v.shift();if(w){if(typeof w!="object")throw new TypeError(w+"must be non-object");for(var b in w)w.hasOwnProperty(b)&&(u[b]=w[b])}}return u},s.shrinkBuf=function(u,v){return u.length===v?u:u.subarray?u.subarray(0,v):(u.length=v,u)};var o={arraySet:function(u,v,w,b,p){if(v.subarray&&u.subarray)u.set(v.subarray(w,w+b),p);else for(var m=0;m<b;m++)u[p+m]=v[w+m]},flattenChunks:function(u){for(var v=b=0,w=u.length,b,p,m,h;v<w;v++)b+=u[v].length;for(h=new Uint8Array(b),v=p=0,w=u.length;v<w;v++)m=u[v],h.set(m,p),p+=m.length;return h}},n={arraySet:function(u,v,w,b,p){for(var m=0;m<b;m++)u[p+m]=v[w+m]},flattenChunks:function(u){return[].concat.apply([],u)}};s.setTyped=function(u){u?(s.Buf8=Uint8Array,s.Buf16=Uint16Array,s.Buf32=Int32Array,s.assign(s,o)):(s.Buf8=Array,s.Buf16=Array,s.Buf32=Array,s.assign(s,n))},s.setTyped(a)},{}],42:[function(i,l,s){"use strict";var a=i("./common"),o=!0,n=!0;try{String.fromCharCode.apply(null,[0])}catch{o=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{n=!1}for(var u=new a.Buf8(256),v=0;v<256;v++)u[v]=252<=v?6:248<=v?5:240<=v?4:224<=v?3:192<=v?2:1;function w(b,p){if(p<65537&&(b.subarray&&n||!b.subarray&&o))return String.fromCharCode.apply(null,a.shrinkBuf(b,p));for(var m="",h=0;h<p;h++)m+=String.fromCharCode(b[h]);return m}u[254]=u[254]=1,s.string2buf=function(b){var p,m,h,d,g,f=b.length,y=0;for(d=0;d<f;d++)(64512&(m=b.charCodeAt(d)))==55296&&d+1<f&&(64512&(h=b.charCodeAt(d+1)))==56320&&(m=65536+(m-55296<<10)+(h-56320),d++),y+=m<128?1:m<2048?2:m<65536?3:4;for(p=new a.Buf8(y),d=g=0;g<y;d++)(64512&(m=b.charCodeAt(d)))==55296&&d+1<f&&(64512&(h=b.charCodeAt(d+1)))==56320&&(m=65536+(m-55296<<10)+(h-56320),d++),m<128?p[g++]=m:(m<2048?p[g++]=192|m>>>6:(m<65536?p[g++]=224|m>>>12:(p[g++]=240|m>>>18,p[g++]=128|m>>>12&63),p[g++]=128|m>>>6&63),p[g++]=128|63&m);return p},s.buf2binstring=function(b){return w(b,b.length)},s.binstring2buf=function(b){for(var p=new a.Buf8(b.length),m=0,h=p.length;m<h;m++)p[m]=b.charCodeAt(m);return p},s.buf2string=function(b,p){var m,h,d,g,f=p||b.length,y=new Array(2*f);for(m=h=0;m<f;)if((d=b[m++])<128)y[h++]=d;else if(4<(g=u[d]))y[h++]=65533,m+=g-1;else{for(d&=g===2?31:g===3?15:7;1<g&&m<f;)d=d<<6|63&b[m++],g--;1<g?y[h++]=65533:d<65536?y[h++]=d:(d-=65536,y[h++]=55296|d>>10&1023,y[h++]=56320|1023&d)}return w(y,h)},s.utf8border=function(b,p){var m;for((p=p||b.length)>b.length&&(p=b.length),m=p-1;0<=m&&(192&b[m])==128;)m--;return m<0||m===0?p:m+u[b[m]]>p?m:p}},{"./common":41}],43:[function(i,l,s){"use strict";l.exports=function(a,o,n,u){for(var v=65535&a|0,w=a>>>16&65535|0,b=0;n!==0;){for(n-=b=2e3<n?2e3:n;w=w+(v=v+o[u++]|0)|0,--b;);v%=65521,w%=65521}return v|w<<16|0}},{}],44:[function(i,l,s){"use strict";l.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(i,l,s){"use strict";var a=(function(){for(var o,n=[],u=0;u<256;u++){o=u;for(var v=0;v<8;v++)o=1&o?3988292384^o>>>1:o>>>1;n[u]=o}return n})();l.exports=function(o,n,u,v){var w=a,b=v+u;o^=-1;for(var p=v;p<b;p++)o=o>>>8^w[255&(o^n[p])];return-1^o}},{}],46:[function(i,l,s){"use strict";var a,o=i("../utils/common"),n=i("./trees"),u=i("./adler32"),v=i("./crc32"),w=i("./messages"),b=0,p=4,m=0,h=-2,d=-1,g=4,f=2,y=8,x=9,_=286,I=30,z=19,T=2*_+1,O=15,k=3,$=258,D=$+k+1,E=42,R=113,c=1,P=2,J=3,j=4;function K(r,B){return r.msg=w[B],B}function q(r){return(r<<1)-(4<r?9:0)}function V(r){for(var B=r.length;0<=--B;)r[B]=0}function F(r){var B=r.state,M=B.pending;M>r.avail_out&&(M=r.avail_out),M!==0&&(o.arraySet(r.output,B.pending_buf,B.pending_out,M,r.next_out),r.next_out+=M,B.pending_out+=M,r.total_out+=M,r.avail_out-=M,B.pending-=M,B.pending===0&&(B.pending_out=0))}function N(r,B){n._tr_flush_block(r,0<=r.block_start?r.block_start:-1,r.strstart-r.block_start,B),r.block_start=r.strstart,F(r.strm)}function Q(r,B){r.pending_buf[r.pending++]=B}function Z(r,B){r.pending_buf[r.pending++]=B>>>8&255,r.pending_buf[r.pending++]=255&B}function X(r,B){var M,C,S=r.max_chain_length,A=r.strstart,U=r.prev_length,H=r.nice_match,L=r.strstart>r.w_size-D?r.strstart-(r.w_size-D):0,W=r.window,Y=r.w_mask,G=r.prev,at=r.strstart+$,lt=W[A+U-1],ot=W[A+U];r.prev_length>=r.good_match&&(S>>=2),H>r.lookahead&&(H=r.lookahead);do if(W[(M=B)+U]===ot&&W[M+U-1]===lt&&W[M]===W[A]&&W[++M]===W[A+1]){A+=2,M++;do;while(W[++A]===W[++M]&&W[++A]===W[++M]&&W[++A]===W[++M]&&W[++A]===W[++M]&&W[++A]===W[++M]&&W[++A]===W[++M]&&W[++A]===W[++M]&&W[++A]===W[++M]&&A<at);if(C=$-(at-A),A=at-$,U<C){if(r.match_start=B,H<=(U=C))break;lt=W[A+U-1],ot=W[A+U]}}while((B=G[B&Y])>L&&--S!=0);return U<=r.lookahead?U:r.lookahead}function nt(r){var B,M,C,S,A,U,H,L,W,Y,G=r.w_size;do{if(S=r.window_size-r.lookahead-r.strstart,r.strstart>=G+(G-D)){for(o.arraySet(r.window,r.window,G,G,0),r.match_start-=G,r.strstart-=G,r.block_start-=G,B=M=r.hash_size;C=r.head[--B],r.head[B]=G<=C?C-G:0,--M;);for(B=M=G;C=r.prev[--B],r.prev[B]=G<=C?C-G:0,--M;);S+=G}if(r.strm.avail_in===0)break;if(U=r.strm,H=r.window,L=r.strstart+r.lookahead,W=S,Y=void 0,Y=U.avail_in,W<Y&&(Y=W),M=Y===0?0:(U.avail_in-=Y,o.arraySet(H,U.input,U.next_in,Y,L),U.state.wrap===1?U.adler=u(U.adler,H,Y,L):U.state.wrap===2&&(U.adler=v(U.adler,H,Y,L)),U.next_in+=Y,U.total_in+=Y,Y),r.lookahead+=M,r.lookahead+r.insert>=k)for(A=r.strstart-r.insert,r.ins_h=r.window[A],r.ins_h=(r.ins_h<<r.hash_shift^r.window[A+1])&r.hash_mask;r.insert&&(r.ins_h=(r.ins_h<<r.hash_shift^r.window[A+k-1])&r.hash_mask,r.prev[A&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=A,A++,r.insert--,!(r.lookahead+r.insert<k)););}while(r.lookahead<D&&r.strm.avail_in!==0)}function ut(r,B){for(var M,C;;){if(r.lookahead<D){if(nt(r),r.lookahead<D&&B===b)return c;if(r.lookahead===0)break}if(M=0,r.lookahead>=k&&(r.ins_h=(r.ins_h<<r.hash_shift^r.window[r.strstart+k-1])&r.hash_mask,M=r.prev[r.strstart&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=r.strstart),M!==0&&r.strstart-M<=r.w_size-D&&(r.match_length=X(r,M)),r.match_length>=k)if(C=n._tr_tally(r,r.strstart-r.match_start,r.match_length-k),r.lookahead-=r.match_length,r.match_length<=r.max_lazy_match&&r.lookahead>=k){for(r.match_length--;r.strstart++,r.ins_h=(r.ins_h<<r.hash_shift^r.window[r.strstart+k-1])&r.hash_mask,M=r.prev[r.strstart&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=r.strstart,--r.match_length!=0;);r.strstart++}else r.strstart+=r.match_length,r.match_length=0,r.ins_h=r.window[r.strstart],r.ins_h=(r.ins_h<<r.hash_shift^r.window[r.strstart+1])&r.hash_mask;else C=n._tr_tally(r,0,r.window[r.strstart]),r.lookahead--,r.strstart++;if(C&&(N(r,!1),r.strm.avail_out===0))return c}return r.insert=r.strstart<k-1?r.strstart:k-1,B===p?(N(r,!0),r.strm.avail_out===0?J:j):r.last_lit&&(N(r,!1),r.strm.avail_out===0)?c:P}function et(r,B){for(var M,C,S;;){if(r.lookahead<D){if(nt(r),r.lookahead<D&&B===b)return c;if(r.lookahead===0)break}if(M=0,r.lookahead>=k&&(r.ins_h=(r.ins_h<<r.hash_shift^r.window[r.strstart+k-1])&r.hash_mask,M=r.prev[r.strstart&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=r.strstart),r.prev_length=r.match_length,r.prev_match=r.match_start,r.match_length=k-1,M!==0&&r.prev_length<r.max_lazy_match&&r.strstart-M<=r.w_size-D&&(r.match_length=X(r,M),r.match_length<=5&&(r.strategy===1||r.match_length===k&&4096<r.strstart-r.match_start)&&(r.match_length=k-1)),r.prev_length>=k&&r.match_length<=r.prev_length){for(S=r.strstart+r.lookahead-k,C=n._tr_tally(r,r.strstart-1-r.prev_match,r.prev_length-k),r.lookahead-=r.prev_length-1,r.prev_length-=2;++r.strstart<=S&&(r.ins_h=(r.ins_h<<r.hash_shift^r.window[r.strstart+k-1])&r.hash_mask,M=r.prev[r.strstart&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=r.strstart),--r.prev_length!=0;);if(r.match_available=0,r.match_length=k-1,r.strstart++,C&&(N(r,!1),r.strm.avail_out===0))return c}else if(r.match_available){if((C=n._tr_tally(r,0,r.window[r.strstart-1]))&&N(r,!1),r.strstart++,r.lookahead--,r.strm.avail_out===0)return c}else r.match_available=1,r.strstart++,r.lookahead--}return r.match_available&&(C=n._tr_tally(r,0,r.window[r.strstart-1]),r.match_available=0),r.insert=r.strstart<k-1?r.strstart:k-1,B===p?(N(r,!0),r.strm.avail_out===0?J:j):r.last_lit&&(N(r,!1),r.strm.avail_out===0)?c:P}function it(r,B,M,C,S){this.good_length=r,this.max_lazy=B,this.nice_length=M,this.max_chain=C,this.func=S}function dt(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=y,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new o.Buf16(2*T),this.dyn_dtree=new o.Buf16(2*(2*I+1)),this.bl_tree=new o.Buf16(2*(2*z+1)),V(this.dyn_ltree),V(this.dyn_dtree),V(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new o.Buf16(O+1),this.heap=new o.Buf16(2*_+1),V(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new o.Buf16(2*_+1),V(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function st(r){var B;return r&&r.state?(r.total_in=r.total_out=0,r.data_type=f,(B=r.state).pending=0,B.pending_out=0,B.wrap<0&&(B.wrap=-B.wrap),B.status=B.wrap?E:R,r.adler=B.wrap===2?0:1,B.last_flush=b,n._tr_init(B),m):K(r,h)}function vt(r){var B=st(r);return B===m&&(function(M){M.window_size=2*M.w_size,V(M.head),M.max_lazy_match=a[M.level].max_lazy,M.good_match=a[M.level].good_length,M.nice_match=a[M.level].nice_length,M.max_chain_length=a[M.level].max_chain,M.strstart=0,M.block_start=0,M.lookahead=0,M.insert=0,M.match_length=M.prev_length=k-1,M.match_available=0,M.ins_h=0})(r.state),B}function ht(r,B,M,C,S,A){if(!r)return h;var U=1;if(B===d&&(B=6),C<0?(U=0,C=-C):15<C&&(U=2,C-=16),S<1||x<S||M!==y||C<8||15<C||B<0||9<B||A<0||g<A)return K(r,h);C===8&&(C=9);var H=new dt;return(r.state=H).strm=r,H.wrap=U,H.gzhead=null,H.w_bits=C,H.w_size=1<<H.w_bits,H.w_mask=H.w_size-1,H.hash_bits=S+7,H.hash_size=1<<H.hash_bits,H.hash_mask=H.hash_size-1,H.hash_shift=~~((H.hash_bits+k-1)/k),H.window=new o.Buf8(2*H.w_size),H.head=new o.Buf16(H.hash_size),H.prev=new o.Buf16(H.w_size),H.lit_bufsize=1<<S+6,H.pending_buf_size=4*H.lit_bufsize,H.pending_buf=new o.Buf8(H.pending_buf_size),H.d_buf=1*H.lit_bufsize,H.l_buf=3*H.lit_bufsize,H.level=B,H.strategy=A,H.method=M,vt(r)}a=[new it(0,0,0,0,function(r,B){var M=65535;for(M>r.pending_buf_size-5&&(M=r.pending_buf_size-5);;){if(r.lookahead<=1){if(nt(r),r.lookahead===0&&B===b)return c;if(r.lookahead===0)break}r.strstart+=r.lookahead,r.lookahead=0;var C=r.block_start+M;if((r.strstart===0||r.strstart>=C)&&(r.lookahead=r.strstart-C,r.strstart=C,N(r,!1),r.strm.avail_out===0)||r.strstart-r.block_start>=r.w_size-D&&(N(r,!1),r.strm.avail_out===0))return c}return r.insert=0,B===p?(N(r,!0),r.strm.avail_out===0?J:j):(r.strstart>r.block_start&&(N(r,!1),r.strm.avail_out),c)}),new it(4,4,8,4,ut),new it(4,5,16,8,ut),new it(4,6,32,32,ut),new it(4,4,16,16,et),new it(8,16,32,32,et),new it(8,16,128,128,et),new it(8,32,128,256,et),new it(32,128,258,1024,et),new it(32,258,258,4096,et)],s.deflateInit=function(r,B){return ht(r,B,y,15,8,0)},s.deflateInit2=ht,s.deflateReset=vt,s.deflateResetKeep=st,s.deflateSetHeader=function(r,B){return r&&r.state?r.state.wrap!==2?h:(r.state.gzhead=B,m):h},s.deflate=function(r,B){var M,C,S,A;if(!r||!r.state||5<B||B<0)return r?K(r,h):h;if(C=r.state,!r.output||!r.input&&r.avail_in!==0||C.status===666&&B!==p)return K(r,r.avail_out===0?-5:h);if(C.strm=r,M=C.last_flush,C.last_flush=B,C.status===E)if(C.wrap===2)r.adler=0,Q(C,31),Q(C,139),Q(C,8),C.gzhead?(Q(C,(C.gzhead.text?1:0)+(C.gzhead.hcrc?2:0)+(C.gzhead.extra?4:0)+(C.gzhead.name?8:0)+(C.gzhead.comment?16:0)),Q(C,255&C.gzhead.time),Q(C,C.gzhead.time>>8&255),Q(C,C.gzhead.time>>16&255),Q(C,C.gzhead.time>>24&255),Q(C,C.level===9?2:2<=C.strategy||C.level<2?4:0),Q(C,255&C.gzhead.os),C.gzhead.extra&&C.gzhead.extra.length&&(Q(C,255&C.gzhead.extra.length),Q(C,C.gzhead.extra.length>>8&255)),C.gzhead.hcrc&&(r.adler=v(r.adler,C.pending_buf,C.pending,0)),C.gzindex=0,C.status=69):(Q(C,0),Q(C,0),Q(C,0),Q(C,0),Q(C,0),Q(C,C.level===9?2:2<=C.strategy||C.level<2?4:0),Q(C,3),C.status=R);else{var U=y+(C.w_bits-8<<4)<<8;U|=(2<=C.strategy||C.level<2?0:C.level<6?1:C.level===6?2:3)<<6,C.strstart!==0&&(U|=32),U+=31-U%31,C.status=R,Z(C,U),C.strstart!==0&&(Z(C,r.adler>>>16),Z(C,65535&r.adler)),r.adler=1}if(C.status===69)if(C.gzhead.extra){for(S=C.pending;C.gzindex<(65535&C.gzhead.extra.length)&&(C.pending!==C.pending_buf_size||(C.gzhead.hcrc&&C.pending>S&&(r.adler=v(r.adler,C.pending_buf,C.pending-S,S)),F(r),S=C.pending,C.pending!==C.pending_buf_size));)Q(C,255&C.gzhead.extra[C.gzindex]),C.gzindex++;C.gzhead.hcrc&&C.pending>S&&(r.adler=v(r.adler,C.pending_buf,C.pending-S,S)),C.gzindex===C.gzhead.extra.length&&(C.gzindex=0,C.status=73)}else C.status=73;if(C.status===73)if(C.gzhead.name){S=C.pending;do{if(C.pending===C.pending_buf_size&&(C.gzhead.hcrc&&C.pending>S&&(r.adler=v(r.adler,C.pending_buf,C.pending-S,S)),F(r),S=C.pending,C.pending===C.pending_buf_size)){A=1;break}A=C.gzindex<C.gzhead.name.length?255&C.gzhead.name.charCodeAt(C.gzindex++):0,Q(C,A)}while(A!==0);C.gzhead.hcrc&&C.pending>S&&(r.adler=v(r.adler,C.pending_buf,C.pending-S,S)),A===0&&(C.gzindex=0,C.status=91)}else C.status=91;if(C.status===91)if(C.gzhead.comment){S=C.pending;do{if(C.pending===C.pending_buf_size&&(C.gzhead.hcrc&&C.pending>S&&(r.adler=v(r.adler,C.pending_buf,C.pending-S,S)),F(r),S=C.pending,C.pending===C.pending_buf_size)){A=1;break}A=C.gzindex<C.gzhead.comment.length?255&C.gzhead.comment.charCodeAt(C.gzindex++):0,Q(C,A)}while(A!==0);C.gzhead.hcrc&&C.pending>S&&(r.adler=v(r.adler,C.pending_buf,C.pending-S,S)),A===0&&(C.status=103)}else C.status=103;if(C.status===103&&(C.gzhead.hcrc?(C.pending+2>C.pending_buf_size&&F(r),C.pending+2<=C.pending_buf_size&&(Q(C,255&r.adler),Q(C,r.adler>>8&255),r.adler=0,C.status=R)):C.status=R),C.pending!==0){if(F(r),r.avail_out===0)return C.last_flush=-1,m}else if(r.avail_in===0&&q(B)<=q(M)&&B!==p)return K(r,-5);if(C.status===666&&r.avail_in!==0)return K(r,-5);if(r.avail_in!==0||C.lookahead!==0||B!==b&&C.status!==666){var H=C.strategy===2?(function(L,W){for(var Y;;){if(L.lookahead===0&&(nt(L),L.lookahead===0)){if(W===b)return c;break}if(L.match_length=0,Y=n._tr_tally(L,0,L.window[L.strstart]),L.lookahead--,L.strstart++,Y&&(N(L,!1),L.strm.avail_out===0))return c}return L.insert=0,W===p?(N(L,!0),L.strm.avail_out===0?J:j):L.last_lit&&(N(L,!1),L.strm.avail_out===0)?c:P})(C,B):C.strategy===3?(function(L,W){for(var Y,G,at,lt,ot=L.window;;){if(L.lookahead<=$){if(nt(L),L.lookahead<=$&&W===b)return c;if(L.lookahead===0)break}if(L.match_length=0,L.lookahead>=k&&0<L.strstart&&(G=ot[at=L.strstart-1])===ot[++at]&&G===ot[++at]&&G===ot[++at]){lt=L.strstart+$;do;while(G===ot[++at]&&G===ot[++at]&&G===ot[++at]&&G===ot[++at]&&G===ot[++at]&&G===ot[++at]&&G===ot[++at]&&G===ot[++at]&&at<lt);L.match_length=$-(lt-at),L.match_length>L.lookahead&&(L.match_length=L.lookahead)}if(L.match_length>=k?(Y=n._tr_tally(L,1,L.match_length-k),L.lookahead-=L.match_length,L.strstart+=L.match_length,L.match_length=0):(Y=n._tr_tally(L,0,L.window[L.strstart]),L.lookahead--,L.strstart++),Y&&(N(L,!1),L.strm.avail_out===0))return c}return L.insert=0,W===p?(N(L,!0),L.strm.avail_out===0?J:j):L.last_lit&&(N(L,!1),L.strm.avail_out===0)?c:P})(C,B):a[C.level].func(C,B);if(H!==J&&H!==j||(C.status=666),H===c||H===J)return r.avail_out===0&&(C.last_flush=-1),m;if(H===P&&(B===1?n._tr_align(C):B!==5&&(n._tr_stored_block(C,0,0,!1),B===3&&(V(C.head),C.lookahead===0&&(C.strstart=0,C.block_start=0,C.insert=0))),F(r),r.avail_out===0))return C.last_flush=-1,m}return B!==p?m:C.wrap<=0?1:(C.wrap===2?(Q(C,255&r.adler),Q(C,r.adler>>8&255),Q(C,r.adler>>16&255),Q(C,r.adler>>24&255),Q(C,255&r.total_in),Q(C,r.total_in>>8&255),Q(C,r.total_in>>16&255),Q(C,r.total_in>>24&255)):(Z(C,r.adler>>>16),Z(C,65535&r.adler)),F(r),0<C.wrap&&(C.wrap=-C.wrap),C.pending!==0?m:1)},s.deflateEnd=function(r){var B;return r&&r.state?(B=r.state.status)!==E&&B!==69&&B!==73&&B!==91&&B!==103&&B!==R&&B!==666?K(r,h):(r.state=null,B===R?K(r,-3):m):h},s.deflateSetDictionary=function(r,B){var M,C,S,A,U,H,L,W,Y=B.length;if(!r||!r.state||(A=(M=r.state).wrap)===2||A===1&&M.status!==E||M.lookahead)return h;for(A===1&&(r.adler=u(r.adler,B,Y,0)),M.wrap=0,Y>=M.w_size&&(A===0&&(V(M.head),M.strstart=0,M.block_start=0,M.insert=0),W=new o.Buf8(M.w_size),o.arraySet(W,B,Y-M.w_size,M.w_size,0),B=W,Y=M.w_size),U=r.avail_in,H=r.next_in,L=r.input,r.avail_in=Y,r.next_in=0,r.input=B,nt(M);M.lookahead>=k;){for(C=M.strstart,S=M.lookahead-(k-1);M.ins_h=(M.ins_h<<M.hash_shift^M.window[C+k-1])&M.hash_mask,M.prev[C&M.w_mask]=M.head[M.ins_h],M.head[M.ins_h]=C,C++,--S;);M.strstart=C,M.lookahead=k-1,nt(M)}return M.strstart+=M.lookahead,M.block_start=M.strstart,M.insert=M.lookahead,M.lookahead=0,M.match_length=M.prev_length=k-1,M.match_available=0,r.next_in=H,r.input=L,r.avail_in=U,M.wrap=A,m},s.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(i,l,s){"use strict";l.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(i,l,s){"use strict";l.exports=function(a,o){var n=a.state,u=a.next_in,v,w,b,p,m,h,d,g,f,y,x,_,I,z,T,O,k,$,D,E,R,c=a.input,P;v=u+(a.avail_in-5),w=a.next_out,P=a.output,b=w-(o-a.avail_out),p=w+(a.avail_out-257),m=n.dmax,h=n.wsize,d=n.whave,g=n.wnext,f=n.window,y=n.hold,x=n.bits,_=n.lencode,I=n.distcode,z=(1<<n.lenbits)-1,T=(1<<n.distbits)-1;t:do{x<15&&(y+=c[u++]<<x,x+=8,y+=c[u++]<<x,x+=8),O=_[y&z];e:for(;;){if(y>>>=k=O>>>24,x-=k,(k=O>>>16&255)===0)P[w++]=65535&O;else{if(!(16&k)){if((64&k)==0){O=_[(65535&O)+(y&(1<<k)-1)];continue e}if(32&k){n.mode=12;break t}a.msg="invalid literal/length code",n.mode=30;break t}$=65535&O,(k&=15)&&(x<k&&(y+=c[u++]<<x,x+=8),$+=y&(1<<k)-1,y>>>=k,x-=k),x<15&&(y+=c[u++]<<x,x+=8,y+=c[u++]<<x,x+=8),O=I[y&T];a:for(;;){if(y>>>=k=O>>>24,x-=k,!(16&(k=O>>>16&255))){if((64&k)==0){O=I[(65535&O)+(y&(1<<k)-1)];continue a}a.msg="invalid distance code",n.mode=30;break t}if(D=65535&O,x<(k&=15)&&(y+=c[u++]<<x,(x+=8)<k&&(y+=c[u++]<<x,x+=8)),m<(D+=y&(1<<k)-1)){a.msg="invalid distance too far back",n.mode=30;break t}if(y>>>=k,x-=k,(k=w-b)<D){if(d<(k=D-k)&&n.sane){a.msg="invalid distance too far back",n.mode=30;break t}if(R=f,(E=0)===g){if(E+=h-k,k<$){for($-=k;P[w++]=f[E++],--k;);E=w-D,R=P}}else if(g<k){if(E+=h+g-k,(k-=g)<$){for($-=k;P[w++]=f[E++],--k;);if(E=0,g<$){for($-=k=g;P[w++]=f[E++],--k;);E=w-D,R=P}}}else if(E+=g-k,k<$){for($-=k;P[w++]=f[E++],--k;);E=w-D,R=P}for(;2<$;)P[w++]=R[E++],P[w++]=R[E++],P[w++]=R[E++],$-=3;$&&(P[w++]=R[E++],1<$&&(P[w++]=R[E++]))}else{for(E=w-D;P[w++]=P[E++],P[w++]=P[E++],P[w++]=P[E++],2<($-=3););$&&(P[w++]=P[E++],1<$&&(P[w++]=P[E++]))}break}}break}}while(u<v&&w<p);u-=$=x>>3,y&=(1<<(x-=$<<3))-1,a.next_in=u,a.next_out=w,a.avail_in=u<v?v-u+5:5-(u-v),a.avail_out=w<p?p-w+257:257-(w-p),n.hold=y,n.bits=x}},{}],49:[function(i,l,s){"use strict";var a=i("../utils/common"),o=i("./adler32"),n=i("./crc32"),u=i("./inffast"),v=i("./inftrees"),w=1,b=2,p=0,m=-2,h=1,d=852,g=592;function f(E){return(E>>>24&255)+(E>>>8&65280)+((65280&E)<<8)+((255&E)<<24)}function y(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new a.Buf16(320),this.work=new a.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function x(E){var R;return E&&E.state?(R=E.state,E.total_in=E.total_out=R.total=0,E.msg="",R.wrap&&(E.adler=1&R.wrap),R.mode=h,R.last=0,R.havedict=0,R.dmax=32768,R.head=null,R.hold=0,R.bits=0,R.lencode=R.lendyn=new a.Buf32(d),R.distcode=R.distdyn=new a.Buf32(g),R.sane=1,R.back=-1,p):m}function _(E){var R;return E&&E.state?((R=E.state).wsize=0,R.whave=0,R.wnext=0,x(E)):m}function I(E,R){var c,P;return E&&E.state?(P=E.state,R<0?(c=0,R=-R):(c=1+(R>>4),R<48&&(R&=15)),R&&(R<8||15<R)?m:(P.window!==null&&P.wbits!==R&&(P.window=null),P.wrap=c,P.wbits=R,_(E))):m}function z(E,R){var c,P;return E?(P=new y,(E.state=P).window=null,(c=I(E,R))!==p&&(E.state=null),c):m}var T,O,k=!0;function $(E){if(k){var R;for(T=new a.Buf32(512),O=new a.Buf32(32),R=0;R<144;)E.lens[R++]=8;for(;R<256;)E.lens[R++]=9;for(;R<280;)E.lens[R++]=7;for(;R<288;)E.lens[R++]=8;for(v(w,E.lens,0,288,T,0,E.work,{bits:9}),R=0;R<32;)E.lens[R++]=5;v(b,E.lens,0,32,O,0,E.work,{bits:5}),k=!1}E.lencode=T,E.lenbits=9,E.distcode=O,E.distbits=5}function D(E,R,c,P){var J,j=E.state;return j.window===null&&(j.wsize=1<<j.wbits,j.wnext=0,j.whave=0,j.window=new a.Buf8(j.wsize)),P>=j.wsize?(a.arraySet(j.window,R,c-j.wsize,j.wsize,0),j.wnext=0,j.whave=j.wsize):(P<(J=j.wsize-j.wnext)&&(J=P),a.arraySet(j.window,R,c-P,J,j.wnext),(P-=J)?(a.arraySet(j.window,R,c-P,P,0),j.wnext=P,j.whave=j.wsize):(j.wnext+=J,j.wnext===j.wsize&&(j.wnext=0),j.whave<j.wsize&&(j.whave+=J))),0}s.inflateReset=_,s.inflateReset2=I,s.inflateResetKeep=x,s.inflateInit=function(E){return z(E,15)},s.inflateInit2=z,s.inflate=function(E,R){var c,P,J,j,K,q,V,F,N,Q,Z,X,nt,ut,et,it,dt,st,vt,ht,r,B,M,C,S=0,A=new a.Buf8(4),U=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!E||!E.state||!E.output||!E.input&&E.avail_in!==0)return m;(c=E.state).mode===12&&(c.mode=13),K=E.next_out,J=E.output,V=E.avail_out,j=E.next_in,P=E.input,q=E.avail_in,F=c.hold,N=c.bits,Q=q,Z=V,B=p;t:for(;;)switch(c.mode){case h:if(c.wrap===0){c.mode=13;break}for(;N<16;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(2&c.wrap&&F===35615){A[c.check=0]=255&F,A[1]=F>>>8&255,c.check=n(c.check,A,2,0),N=F=0,c.mode=2;break}if(c.flags=0,c.head&&(c.head.done=!1),!(1&c.wrap)||(((255&F)<<8)+(F>>8))%31){E.msg="incorrect header check",c.mode=30;break}if((15&F)!=8){E.msg="unknown compression method",c.mode=30;break}if(N-=4,r=8+(15&(F>>>=4)),c.wbits===0)c.wbits=r;else if(r>c.wbits){E.msg="invalid window size",c.mode=30;break}c.dmax=1<<r,E.adler=c.check=1,c.mode=512&F?10:12,N=F=0;break;case 2:for(;N<16;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(c.flags=F,(255&c.flags)!=8){E.msg="unknown compression method",c.mode=30;break}if(57344&c.flags){E.msg="unknown header flags set",c.mode=30;break}c.head&&(c.head.text=F>>8&1),512&c.flags&&(A[0]=255&F,A[1]=F>>>8&255,c.check=n(c.check,A,2,0)),N=F=0,c.mode=3;case 3:for(;N<32;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}c.head&&(c.head.time=F),512&c.flags&&(A[0]=255&F,A[1]=F>>>8&255,A[2]=F>>>16&255,A[3]=F>>>24&255,c.check=n(c.check,A,4,0)),N=F=0,c.mode=4;case 4:for(;N<16;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}c.head&&(c.head.xflags=255&F,c.head.os=F>>8),512&c.flags&&(A[0]=255&F,A[1]=F>>>8&255,c.check=n(c.check,A,2,0)),N=F=0,c.mode=5;case 5:if(1024&c.flags){for(;N<16;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}c.length=F,c.head&&(c.head.extra_len=F),512&c.flags&&(A[0]=255&F,A[1]=F>>>8&255,c.check=n(c.check,A,2,0)),N=F=0}else c.head&&(c.head.extra=null);c.mode=6;case 6:if(1024&c.flags&&(q<(X=c.length)&&(X=q),X&&(c.head&&(r=c.head.extra_len-c.length,c.head.extra||(c.head.extra=new Array(c.head.extra_len)),a.arraySet(c.head.extra,P,j,X,r)),512&c.flags&&(c.check=n(c.check,P,X,j)),q-=X,j+=X,c.length-=X),c.length))break t;c.length=0,c.mode=7;case 7:if(2048&c.flags){if(q===0)break t;for(X=0;r=P[j+X++],c.head&&r&&c.length<65536&&(c.head.name+=String.fromCharCode(r)),r&&X<q;);if(512&c.flags&&(c.check=n(c.check,P,X,j)),q-=X,j+=X,r)break t}else c.head&&(c.head.name=null);c.length=0,c.mode=8;case 8:if(4096&c.flags){if(q===0)break t;for(X=0;r=P[j+X++],c.head&&r&&c.length<65536&&(c.head.comment+=String.fromCharCode(r)),r&&X<q;);if(512&c.flags&&(c.check=n(c.check,P,X,j)),q-=X,j+=X,r)break t}else c.head&&(c.head.comment=null);c.mode=9;case 9:if(512&c.flags){for(;N<16;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(F!==(65535&c.check)){E.msg="header crc mismatch",c.mode=30;break}N=F=0}c.head&&(c.head.hcrc=c.flags>>9&1,c.head.done=!0),E.adler=c.check=0,c.mode=12;break;case 10:for(;N<32;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}E.adler=c.check=f(F),N=F=0,c.mode=11;case 11:if(c.havedict===0)return E.next_out=K,E.avail_out=V,E.next_in=j,E.avail_in=q,c.hold=F,c.bits=N,2;E.adler=c.check=1,c.mode=12;case 12:if(R===5||R===6)break t;case 13:if(c.last){F>>>=7&N,N-=7&N,c.mode=27;break}for(;N<3;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}switch(c.last=1&F,N-=1,3&(F>>>=1)){case 0:c.mode=14;break;case 1:if($(c),c.mode=20,R!==6)break;F>>>=2,N-=2;break t;case 2:c.mode=17;break;case 3:E.msg="invalid block type",c.mode=30}F>>>=2,N-=2;break;case 14:for(F>>>=7&N,N-=7&N;N<32;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if((65535&F)!=(F>>>16^65535)){E.msg="invalid stored block lengths",c.mode=30;break}if(c.length=65535&F,N=F=0,c.mode=15,R===6)break t;case 15:c.mode=16;case 16:if(X=c.length){if(q<X&&(X=q),V<X&&(X=V),X===0)break t;a.arraySet(J,P,j,X,K),q-=X,j+=X,V-=X,K+=X,c.length-=X;break}c.mode=12;break;case 17:for(;N<14;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(c.nlen=257+(31&F),F>>>=5,N-=5,c.ndist=1+(31&F),F>>>=5,N-=5,c.ncode=4+(15&F),F>>>=4,N-=4,286<c.nlen||30<c.ndist){E.msg="too many length or distance symbols",c.mode=30;break}c.have=0,c.mode=18;case 18:for(;c.have<c.ncode;){for(;N<3;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}c.lens[U[c.have++]]=7&F,F>>>=3,N-=3}for(;c.have<19;)c.lens[U[c.have++]]=0;if(c.lencode=c.lendyn,c.lenbits=7,M={bits:c.lenbits},B=v(0,c.lens,0,19,c.lencode,0,c.work,M),c.lenbits=M.bits,B){E.msg="invalid code lengths set",c.mode=30;break}c.have=0,c.mode=19;case 19:for(;c.have<c.nlen+c.ndist;){for(;it=(S=c.lencode[F&(1<<c.lenbits)-1])>>>16&255,dt=65535&S,!((et=S>>>24)<=N);){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(dt<16)F>>>=et,N-=et,c.lens[c.have++]=dt;else{if(dt===16){for(C=et+2;N<C;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(F>>>=et,N-=et,c.have===0){E.msg="invalid bit length repeat",c.mode=30;break}r=c.lens[c.have-1],X=3+(3&F),F>>>=2,N-=2}else if(dt===17){for(C=et+3;N<C;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}N-=et,r=0,X=3+(7&(F>>>=et)),F>>>=3,N-=3}else{for(C=et+7;N<C;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}N-=et,r=0,X=11+(127&(F>>>=et)),F>>>=7,N-=7}if(c.have+X>c.nlen+c.ndist){E.msg="invalid bit length repeat",c.mode=30;break}for(;X--;)c.lens[c.have++]=r}}if(c.mode===30)break;if(c.lens[256]===0){E.msg="invalid code -- missing end-of-block",c.mode=30;break}if(c.lenbits=9,M={bits:c.lenbits},B=v(w,c.lens,0,c.nlen,c.lencode,0,c.work,M),c.lenbits=M.bits,B){E.msg="invalid literal/lengths set",c.mode=30;break}if(c.distbits=6,c.distcode=c.distdyn,M={bits:c.distbits},B=v(b,c.lens,c.nlen,c.ndist,c.distcode,0,c.work,M),c.distbits=M.bits,B){E.msg="invalid distances set",c.mode=30;break}if(c.mode=20,R===6)break t;case 20:c.mode=21;case 21:if(6<=q&&258<=V){E.next_out=K,E.avail_out=V,E.next_in=j,E.avail_in=q,c.hold=F,c.bits=N,u(E,Z),K=E.next_out,J=E.output,V=E.avail_out,j=E.next_in,P=E.input,q=E.avail_in,F=c.hold,N=c.bits,c.mode===12&&(c.back=-1);break}for(c.back=0;it=(S=c.lencode[F&(1<<c.lenbits)-1])>>>16&255,dt=65535&S,!((et=S>>>24)<=N);){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(it&&(240&it)==0){for(st=et,vt=it,ht=dt;it=(S=c.lencode[ht+((F&(1<<st+vt)-1)>>st)])>>>16&255,dt=65535&S,!(st+(et=S>>>24)<=N);){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}F>>>=st,N-=st,c.back+=st}if(F>>>=et,N-=et,c.back+=et,c.length=dt,it===0){c.mode=26;break}if(32&it){c.back=-1,c.mode=12;break}if(64&it){E.msg="invalid literal/length code",c.mode=30;break}c.extra=15&it,c.mode=22;case 22:if(c.extra){for(C=c.extra;N<C;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}c.length+=F&(1<<c.extra)-1,F>>>=c.extra,N-=c.extra,c.back+=c.extra}c.was=c.length,c.mode=23;case 23:for(;it=(S=c.distcode[F&(1<<c.distbits)-1])>>>16&255,dt=65535&S,!((et=S>>>24)<=N);){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if((240&it)==0){for(st=et,vt=it,ht=dt;it=(S=c.distcode[ht+((F&(1<<st+vt)-1)>>st)])>>>16&255,dt=65535&S,!(st+(et=S>>>24)<=N);){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}F>>>=st,N-=st,c.back+=st}if(F>>>=et,N-=et,c.back+=et,64&it){E.msg="invalid distance code",c.mode=30;break}c.offset=dt,c.extra=15&it,c.mode=24;case 24:if(c.extra){for(C=c.extra;N<C;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}c.offset+=F&(1<<c.extra)-1,F>>>=c.extra,N-=c.extra,c.back+=c.extra}if(c.offset>c.dmax){E.msg="invalid distance too far back",c.mode=30;break}c.mode=25;case 25:if(V===0)break t;if(X=Z-V,c.offset>X){if((X=c.offset-X)>c.whave&&c.sane){E.msg="invalid distance too far back",c.mode=30;break}nt=X>c.wnext?(X-=c.wnext,c.wsize-X):c.wnext-X,X>c.length&&(X=c.length),ut=c.window}else ut=J,nt=K-c.offset,X=c.length;for(V<X&&(X=V),V-=X,c.length-=X;J[K++]=ut[nt++],--X;);c.length===0&&(c.mode=21);break;case 26:if(V===0)break t;J[K++]=c.length,V--,c.mode=21;break;case 27:if(c.wrap){for(;N<32;){if(q===0)break t;q--,F|=P[j++]<<N,N+=8}if(Z-=V,E.total_out+=Z,c.total+=Z,Z&&(E.adler=c.check=c.flags?n(c.check,J,Z,K-Z):o(c.check,J,Z,K-Z)),Z=V,(c.flags?F:f(F))!==c.check){E.msg="incorrect data check",c.mode=30;break}N=F=0}c.mode=28;case 28:if(c.wrap&&c.flags){for(;N<32;){if(q===0)break t;q--,F+=P[j++]<<N,N+=8}if(F!==(4294967295&c.total)){E.msg="incorrect length check",c.mode=30;break}N=F=0}c.mode=29;case 29:B=1;break t;case 30:B=-3;break t;case 31:return-4;default:return m}return E.next_out=K,E.avail_out=V,E.next_in=j,E.avail_in=q,c.hold=F,c.bits=N,(c.wsize||Z!==E.avail_out&&c.mode<30&&(c.mode<27||R!==4))&&D(E,E.output,E.next_out,Z-E.avail_out)?(c.mode=31,-4):(Q-=E.avail_in,Z-=E.avail_out,E.total_in+=Q,E.total_out+=Z,c.total+=Z,c.wrap&&Z&&(E.adler=c.check=c.flags?n(c.check,J,Z,E.next_out-Z):o(c.check,J,Z,E.next_out-Z)),E.data_type=c.bits+(c.last?64:0)+(c.mode===12?128:0)+(c.mode===20||c.mode===15?256:0),(Q==0&&Z===0||R===4)&&B===p&&(B=-5),B)},s.inflateEnd=function(E){if(!E||!E.state)return m;var R=E.state;return R.window&&(R.window=null),E.state=null,p},s.inflateGetHeader=function(E,R){var c;return E&&E.state?(2&(c=E.state).wrap)==0?m:((c.head=R).done=!1,p):m},s.inflateSetDictionary=function(E,R){var c,P=R.length;return E&&E.state?(c=E.state).wrap!==0&&c.mode!==11?m:c.mode===11&&o(1,R,P,0)!==c.check?-3:D(E,R,P,P)?(c.mode=31,-4):(c.havedict=1,p):m},s.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(i,l,s){"use strict";var a=i("../utils/common"),o=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],n=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],u=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],v=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];l.exports=function(w,b,p,m,h,d,g,f){var y,x,_,I,z,T,O,k,$,D=f.bits,E=0,R=0,c=0,P=0,J=0,j=0,K=0,q=0,V=0,F=0,N=null,Q=0,Z=new a.Buf16(16),X=new a.Buf16(16),nt=null,ut=0;for(E=0;E<=15;E++)Z[E]=0;for(R=0;R<m;R++)Z[b[p+R]]++;for(J=D,P=15;1<=P&&Z[P]===0;P--);if(P<J&&(J=P),P===0)return h[d++]=20971520,h[d++]=20971520,f.bits=1,0;for(c=1;c<P&&Z[c]===0;c++);for(J<c&&(J=c),E=q=1;E<=15;E++)if(q<<=1,(q-=Z[E])<0)return-1;if(0<q&&(w===0||P!==1))return-1;for(X[1]=0,E=1;E<15;E++)X[E+1]=X[E]+Z[E];for(R=0;R<m;R++)b[p+R]!==0&&(g[X[b[p+R]]++]=R);if(T=w===0?(N=nt=g,19):w===1?(N=o,Q-=257,nt=n,ut-=257,256):(N=u,nt=v,-1),E=c,z=d,K=R=F=0,_=-1,I=(V=1<<(j=J))-1,w===1&&852<V||w===2&&592<V)return 1;for(;;){for(O=E-K,$=g[R]<T?(k=0,g[R]):g[R]>T?(k=nt[ut+g[R]],N[Q+g[R]]):(k=96,0),y=1<<E-K,c=x=1<<j;h[z+(F>>K)+(x-=y)]=O<<24|k<<16|$|0,x!==0;);for(y=1<<E-1;F&y;)y>>=1;if(y!==0?(F&=y-1,F+=y):F=0,R++,--Z[E]==0){if(E===P)break;E=b[p+g[R]]}if(J<E&&(F&I)!==_){for(K===0&&(K=J),z+=c,q=1<<(j=E-K);j+K<P&&!((q-=Z[j+K])<=0);)j++,q<<=1;if(V+=1<<j,w===1&&852<V||w===2&&592<V)return 1;h[_=F&I]=J<<24|j<<16|z-d|0}}return F!==0&&(h[z+F]=E-K<<24|4194304),f.bits=J,0}},{"../utils/common":41}],51:[function(i,l,s){"use strict";l.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(i,l,s){"use strict";var a=i("../utils/common"),o=0,n=1;function u(S){for(var A=S.length;0<=--A;)S[A]=0}var v=0,w=29,b=256,p=b+1+w,m=30,h=19,d=2*p+1,g=15,f=16,y=7,x=256,_=16,I=17,z=18,T=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],O=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],k=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],$=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],D=new Array(2*(p+2));u(D);var E=new Array(2*m);u(E);var R=new Array(512);u(R);var c=new Array(256);u(c);var P=new Array(w);u(P);var J,j,K,q=new Array(m);function V(S,A,U,H,L){this.static_tree=S,this.extra_bits=A,this.extra_base=U,this.elems=H,this.max_length=L,this.has_stree=S&&S.length}function F(S,A){this.dyn_tree=S,this.max_code=0,this.stat_desc=A}function N(S){return S<256?R[S]:R[256+(S>>>7)]}function Q(S,A){S.pending_buf[S.pending++]=255&A,S.pending_buf[S.pending++]=A>>>8&255}function Z(S,A,U){S.bi_valid>f-U?(S.bi_buf|=A<<S.bi_valid&65535,Q(S,S.bi_buf),S.bi_buf=A>>f-S.bi_valid,S.bi_valid+=U-f):(S.bi_buf|=A<<S.bi_valid&65535,S.bi_valid+=U)}function X(S,A,U){Z(S,U[2*A],U[2*A+1])}function nt(S,A){for(var U=0;U|=1&S,S>>>=1,U<<=1,0<--A;);return U>>>1}function ut(S,A,U){var H,L,W=new Array(g+1),Y=0;for(H=1;H<=g;H++)W[H]=Y=Y+U[H-1]<<1;for(L=0;L<=A;L++){var G=S[2*L+1];G!==0&&(S[2*L]=nt(W[G]++,G))}}function et(S){for(var A=0;A<p;A++)S.dyn_ltree[2*A]=0;for(A=0;A<m;A++)S.dyn_dtree[2*A]=0;for(A=0;A<h;A++)S.bl_tree[2*A]=0;S.dyn_ltree[2*x]=1,S.opt_len=S.static_len=0,S.last_lit=S.matches=0}function it(S){8<S.bi_valid?Q(S,S.bi_buf):0<S.bi_valid&&(S.pending_buf[S.pending++]=S.bi_buf),S.bi_buf=0,S.bi_valid=0}function dt(S,A,U,H){var L=2*A,W=2*U;return S[L]<S[W]||S[L]===S[W]&&H[A]<=H[U]}function st(S,A,U){for(var H=S.heap[U],L=U<<1;L<=S.heap_len&&(L<S.heap_len&&dt(A,S.heap[L+1],S.heap[L],S.depth)&&L++,!dt(A,H,S.heap[L],S.depth));)S.heap[U]=S.heap[L],U=L,L<<=1;S.heap[U]=H}function vt(S,A,U){var H,L,W,Y,G=0;if(S.last_lit!==0)for(;H=S.pending_buf[S.d_buf+2*G]<<8|S.pending_buf[S.d_buf+2*G+1],L=S.pending_buf[S.l_buf+G],G++,H===0?X(S,L,A):(X(S,(W=c[L])+b+1,A),(Y=T[W])!==0&&Z(S,L-=P[W],Y),X(S,W=N(--H),U),(Y=O[W])!==0&&Z(S,H-=q[W],Y)),G<S.last_lit;);X(S,x,A)}function ht(S,A){var U,H,L,W=A.dyn_tree,Y=A.stat_desc.static_tree,G=A.stat_desc.has_stree,at=A.stat_desc.elems,lt=-1;for(S.heap_len=0,S.heap_max=d,U=0;U<at;U++)W[2*U]!==0?(S.heap[++S.heap_len]=lt=U,S.depth[U]=0):W[2*U+1]=0;for(;S.heap_len<2;)W[2*(L=S.heap[++S.heap_len]=lt<2?++lt:0)]=1,S.depth[L]=0,S.opt_len--,G&&(S.static_len-=Y[2*L+1]);for(A.max_code=lt,U=S.heap_len>>1;1<=U;U--)st(S,W,U);for(L=at;U=S.heap[1],S.heap[1]=S.heap[S.heap_len--],st(S,W,1),H=S.heap[1],S.heap[--S.heap_max]=U,S.heap[--S.heap_max]=H,W[2*L]=W[2*U]+W[2*H],S.depth[L]=(S.depth[U]>=S.depth[H]?S.depth[U]:S.depth[H])+1,W[2*U+1]=W[2*H+1]=L,S.heap[1]=L++,st(S,W,1),2<=S.heap_len;);S.heap[--S.heap_max]=S.heap[1],(function(ot,ft){var Ct,gt,kt,mt,wt,qt,St=ft.dyn_tree,Yt=ft.max_code,ce=ft.stat_desc.static_tree,de=ft.stat_desc.has_stree,le=ft.stat_desc.extra_bits,Jt=ft.stat_desc.extra_base,Dt=ft.stat_desc.max_length,Pt=0;for(mt=0;mt<=g;mt++)ot.bl_count[mt]=0;for(St[2*ot.heap[ot.heap_max]+1]=0,Ct=ot.heap_max+1;Ct<d;Ct++)Dt<(mt=St[2*St[2*(gt=ot.heap[Ct])+1]+1]+1)&&(mt=Dt,Pt++),St[2*gt+1]=mt,Yt<gt||(ot.bl_count[mt]++,wt=0,Jt<=gt&&(wt=le[gt-Jt]),qt=St[2*gt],ot.opt_len+=qt*(mt+wt),de&&(ot.static_len+=qt*(ce[2*gt+1]+wt)));if(Pt!==0){do{for(mt=Dt-1;ot.bl_count[mt]===0;)mt--;ot.bl_count[mt]--,ot.bl_count[mt+1]+=2,ot.bl_count[Dt]--,Pt-=2}while(0<Pt);for(mt=Dt;mt!==0;mt--)for(gt=ot.bl_count[mt];gt!==0;)Yt<(kt=ot.heap[--Ct])||(St[2*kt+1]!==mt&&(ot.opt_len+=(mt-St[2*kt+1])*St[2*kt],St[2*kt+1]=mt),gt--)}})(S,A),ut(W,lt,S.bl_count)}function r(S,A,U){var H,L,W=-1,Y=A[1],G=0,at=7,lt=4;for(Y===0&&(at=138,lt=3),A[2*(U+1)+1]=65535,H=0;H<=U;H++)L=Y,Y=A[2*(H+1)+1],++G<at&&L===Y||(G<lt?S.bl_tree[2*L]+=G:L!==0?(L!==W&&S.bl_tree[2*L]++,S.bl_tree[2*_]++):G<=10?S.bl_tree[2*I]++:S.bl_tree[2*z]++,W=L,lt=(G=0)===Y?(at=138,3):L===Y?(at=6,3):(at=7,4))}function B(S,A,U){var H,L,W=-1,Y=A[1],G=0,at=7,lt=4;for(Y===0&&(at=138,lt=3),H=0;H<=U;H++)if(L=Y,Y=A[2*(H+1)+1],!(++G<at&&L===Y)){if(G<lt)for(;X(S,L,S.bl_tree),--G!=0;);else L!==0?(L!==W&&(X(S,L,S.bl_tree),G--),X(S,_,S.bl_tree),Z(S,G-3,2)):G<=10?(X(S,I,S.bl_tree),Z(S,G-3,3)):(X(S,z,S.bl_tree),Z(S,G-11,7));W=L,lt=(G=0)===Y?(at=138,3):L===Y?(at=6,3):(at=7,4)}}u(q);var M=!1;function C(S,A,U,H){Z(S,(v<<1)+(H?1:0),3),(function(L,W,Y,G){it(L),G&&(Q(L,Y),Q(L,~Y)),a.arraySet(L.pending_buf,L.window,W,Y,L.pending),L.pending+=Y})(S,A,U,!0)}s._tr_init=function(S){M||((function(){var A,U,H,L,W,Y=new Array(g+1);for(L=H=0;L<w-1;L++)for(P[L]=H,A=0;A<1<<T[L];A++)c[H++]=L;for(c[H-1]=L,L=W=0;L<16;L++)for(q[L]=W,A=0;A<1<<O[L];A++)R[W++]=L;for(W>>=7;L<m;L++)for(q[L]=W<<7,A=0;A<1<<O[L]-7;A++)R[256+W++]=L;for(U=0;U<=g;U++)Y[U]=0;for(A=0;A<=143;)D[2*A+1]=8,A++,Y[8]++;for(;A<=255;)D[2*A+1]=9,A++,Y[9]++;for(;A<=279;)D[2*A+1]=7,A++,Y[7]++;for(;A<=287;)D[2*A+1]=8,A++,Y[8]++;for(ut(D,p+1,Y),A=0;A<m;A++)E[2*A+1]=5,E[2*A]=nt(A,5);J=new V(D,T,b+1,p,g),j=new V(E,O,0,m,g),K=new V(new Array(0),k,0,h,y)})(),M=!0),S.l_desc=new F(S.dyn_ltree,J),S.d_desc=new F(S.dyn_dtree,j),S.bl_desc=new F(S.bl_tree,K),S.bi_buf=0,S.bi_valid=0,et(S)},s._tr_stored_block=C,s._tr_flush_block=function(S,A,U,H){var L,W,Y=0;0<S.level?(S.strm.data_type===2&&(S.strm.data_type=(function(G){var at,lt=4093624447;for(at=0;at<=31;at++,lt>>>=1)if(1&lt&&G.dyn_ltree[2*at]!==0)return o;if(G.dyn_ltree[18]!==0||G.dyn_ltree[20]!==0||G.dyn_ltree[26]!==0)return n;for(at=32;at<b;at++)if(G.dyn_ltree[2*at]!==0)return n;return o})(S)),ht(S,S.l_desc),ht(S,S.d_desc),Y=(function(G){var at;for(r(G,G.dyn_ltree,G.l_desc.max_code),r(G,G.dyn_dtree,G.d_desc.max_code),ht(G,G.bl_desc),at=h-1;3<=at&&G.bl_tree[2*$[at]+1]===0;at--);return G.opt_len+=3*(at+1)+5+5+4,at})(S),L=S.opt_len+3+7>>>3,(W=S.static_len+3+7>>>3)<=L&&(L=W)):L=W=U+5,U+4<=L&&A!==-1?C(S,A,U,H):S.strategy===4||W===L?(Z(S,2+(H?1:0),3),vt(S,D,E)):(Z(S,4+(H?1:0),3),(function(G,at,lt,ot){var ft;for(Z(G,at-257,5),Z(G,lt-1,5),Z(G,ot-4,4),ft=0;ft<ot;ft++)Z(G,G.bl_tree[2*$[ft]+1],3);B(G,G.dyn_ltree,at-1),B(G,G.dyn_dtree,lt-1)})(S,S.l_desc.max_code+1,S.d_desc.max_code+1,Y+1),vt(S,S.dyn_ltree,S.dyn_dtree)),et(S),H&&it(S)},s._tr_tally=function(S,A,U){return S.pending_buf[S.d_buf+2*S.last_lit]=A>>>8&255,S.pending_buf[S.d_buf+2*S.last_lit+1]=255&A,S.pending_buf[S.l_buf+S.last_lit]=255&U,S.last_lit++,A===0?S.dyn_ltree[2*U]++:(S.matches++,A--,S.dyn_ltree[2*(c[U]+b+1)]++,S.dyn_dtree[2*N(A)]++),S.last_lit===S.lit_bufsize-1},s._tr_align=function(S){Z(S,2,3),X(S,x,D),(function(A){A.bi_valid===16?(Q(A,A.bi_buf),A.bi_buf=0,A.bi_valid=0):8<=A.bi_valid&&(A.pending_buf[A.pending++]=255&A.bi_buf,A.bi_buf>>=8,A.bi_valid-=8)})(S)}},{"../utils/common":41}],53:[function(i,l,s){"use strict";l.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(i,l,s){(function(a){(function(o,n){"use strict";if(!o.setImmediate){var u,v,w,b,p=1,m={},h=!1,d=o.document,g=Object.getPrototypeOf&&Object.getPrototypeOf(o);g=g&&g.setTimeout?g:o,u={}.toString.call(o.process)==="[object process]"?function(_){process.nextTick(function(){y(_)})}:(function(){if(o.postMessage&&!o.importScripts){var _=!0,I=o.onmessage;return o.onmessage=function(){_=!1},o.postMessage("","*"),o.onmessage=I,_}})()?(b="setImmediate$"+Math.random()+"$",o.addEventListener?o.addEventListener("message",x,!1):o.attachEvent("onmessage",x),function(_){o.postMessage(b+_,"*")}):o.MessageChannel?((w=new MessageChannel).port1.onmessage=function(_){y(_.data)},function(_){w.port2.postMessage(_)}):d&&"onreadystatechange"in d.createElement("script")?(v=d.documentElement,function(_){var I=d.createElement("script");I.onreadystatechange=function(){y(_),I.onreadystatechange=null,v.removeChild(I),I=null},v.appendChild(I)}):function(_){setTimeout(y,0,_)},g.setImmediate=function(_){typeof _!="function"&&(_=new Function(""+_));for(var I=new Array(arguments.length-1),z=0;z<I.length;z++)I[z]=arguments[z+1];return m[p]={callback:_,args:I},u(p),p++},g.clearImmediate=f}function f(_){delete m[_]}function y(_){if(h)setTimeout(y,0,_);else{var I=m[_];if(I){h=!0;try{(function(z){var T=z.callback,O=z.args;switch(O.length){case 0:T();break;case 1:T(O[0]);break;case 2:T(O[0],O[1]);break;case 3:T(O[0],O[1],O[2]);break;default:T.apply(n,O)}})(I)}finally{f(_),h=!1}}}}function x(_){_.source===o&&typeof _.data=="string"&&_.data.indexOf(b)===0&&y(+_.data.slice(b.length))}})(typeof self>"u"?a===void 0?this:a:self)}).call(this,typeof global<"u"?global:typeof self<"u"?self:typeof window<"u"?window:{})},{}]},{},[10])(10)})})),ie=re(Fe(),1),De=class{exportDocumentsToCsv(t){const e=[["ID","Tipo","Número","Série","Data Emissão","Chave de Acesso","Situação","Natureza Operação","Emitente CNPJ/CPF","Emitente Razão Social","Emitente UF","Destinatário CNPJ/CPF","Destinatário Razão Social","Destinatário UF","Valor Total","Valor ICMS","Valor IPI","Valor PIS","Valor COFINS","Valor ISS","Versão Layout","Hash SHA-256"].join(";")];for(const i of t){const l=[this.escapeCsv(i.id),this.escapeCsv(i.tipo.toUpperCase()),this.escapeCsv(i.numero),this.escapeCsv(i.serie||""),this.escapeCsv(i.dataEmissao),this.escapeCsv(i.chaveAcesso||""),this.escapeCsv(i.situacao),this.escapeCsv(i.naturezaOperacao||""),this.escapeCsv(i.emitenteCnpjCpf),this.escapeCsv(i.emitenteRazaoSocial),this.escapeCsv(i.emitenteUf||""),this.escapeCsv(i.destinatarioCnpjCpf||""),this.escapeCsv(i.destinatarioRazaoSocial||""),this.escapeCsv(i.destinatarioUf||""),this.formatFloatPtBr(i.valorTotal),this.formatFloatPtBr(i.valorICMS||0),this.formatFloatPtBr(i.valorIPI||0),this.formatFloatPtBr(i.valorPIS||0),this.formatFloatPtBr(i.valorCOFINS||0),this.formatFloatPtBr(i.valorISS||0),this.escapeCsv(i.nfeVersao||""),this.escapeCsv(i.xmlHash)];e.push(l.join(";"))}return"\uFEFF"+e.join(`\r
`)}exportItemsToCsv(t,e){const i=[["Documento ID","Documento Número","Documento Tipo","Item Nº","Código","Descrição","NCM","CFOP","Unidade","Quantidade","Valor Unitário","Valor Total","Base ICMS","Valor ICMS","Alíquota ICMS","Valor IPI","Valor PIS","Valor COFINS","CST","Origem"].join(";")];for(const l of t){const s=e?.get(l.documentId),a=[this.escapeCsv(l.documentId),this.escapeCsv(s?.numero||""),this.escapeCsv(s?s.tipo.toUpperCase():""),l.numeroItem.toString(),this.escapeCsv(l.codigo||""),this.escapeCsv(l.descricao),this.escapeCsv(l.ncm||""),this.escapeCsv(l.cfop||""),this.escapeCsv(l.unidade||"UN"),this.formatFloatPtBr(l.quantidade),this.formatFloatPtBr(l.valorUnitario),this.formatFloatPtBr(l.valorTotal),this.formatFloatPtBr(l.baseCalculoICMS||0),this.formatFloatPtBr(l.valorICMS||0),this.formatFloatPtBr(l.aliquotaICMS||0),this.formatFloatPtBr(l.valorIPI||0),this.formatFloatPtBr(l.valorPIS||0),this.formatFloatPtBr(l.valorCOFINS||0),this.escapeCsv(l.cst||""),this.escapeCsv(l.origem||"")];i.push(a.join(";"))}return"\uFEFF"+i.join(`\r
`)}async exportDocumentsToZip(t,e){const i=new ie.default,l=i.folder("XMLs")||i;let s=`============================================================\r
`;s+=`FiscalFlow — Manifesto de Exportação para Contabilidade\r
`,s+=`============================================================\r
`,s+=`Data da Exportação: ${new Date().toISOString()}\r
`,s+=`Total de Documentos no Pacote: ${t.length}\r
\r
`,s+=`ARQUIVOS INCLUÍDOS:\r
`,s+=`Nº | TIPO | DATA | CHAVE DE ACESSO | VALOR | HASH SHA-256\r
`,s+=`------------------------------------------------------------\r
`;for(let a=0;a<t.length;a++){const o=t[a],n=`${o.tipo.toUpperCase()}_${o.numero}_${o.chaveAcesso||o.id}.xml`;l.file(n,o.xmlOriginal),s+=`${o.numero} | ${o.tipo.toUpperCase()} | ${o.dataEmissao} | ${o.chaveAcesso||"-"} | R$ ${o.valorTotal.toFixed(2)} | ${o.xmlHash}\r
`,e?.(a+1,t.length)}return i.file("manifesto_exportacao.txt",s),await i.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}})}async exportSpedFilesToZip(t){const e=new ie.default;for(const i of t){const l=`SPED_EFD_${i.cnpj}_${i.periodo}.txt`;e.file(l,i.conteudoOriginal)}return await e.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}})}async saveBlobFile(t,e,i){try{if(typeof window<"u"&&"__TAURI_INTERNALS__"in window){const{save:l}=await It(async()=>{const{save:o}=await import("./dist-js-CyvBJpFd.js");return{save:o}},__vite__mapDeps([4,1]),import.meta.url),{writeFile:s}=await It(async()=>{const{writeFile:o}=await import("./dist-js-DyYppoCF.js");return{writeFile:o}},__vite__mapDeps([5,1]),import.meta.url),a=await l({defaultPath:e,filters:i&&i.length>0?i:[{name:"Arquivo Exportado",extensions:[e.split(".").pop()||"*"]}]});if(a){const o=await t.arrayBuffer();return await s(a,new Uint8Array(o)),a}return null}}catch(l){console.warn("Native Tauri save dialog unavailable, falling back to browser download:",l)}return this.triggerBrowserDownload(t,e),e}triggerBrowserDownload(t,e){const i=URL.createObjectURL(t),l=document.createElement("a");l.href=i,l.download=e,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(i)}escapeCsv(t){if(!t)return"";const e=String(t);return e.includes(";")||e.includes('"')||e.includes(`
`)||e.includes("\r")?`"${e.replace(/"/g,'""')}"`:e}formatFloatPtBr(t){return t==null||isNaN(t)?"0,00":t.toFixed(2).replace(".",",")}},xt=new De;function Le(t,e){const i=new Ft;let l=1;const s=20;let a=0,o=null;async function n(){const g=await ct.getActiveCompany();if(!g){e.innerHTML=`
        <div class="page-header">
          <div>
            <h1 class="page-header__title">Documentos Fiscais</h1>
            <p class="page-header__subtitle">Consulta, validação e organização de notas fiscais eletrônicas</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione uma empresa ativa para visualizar, filtrar e auditar seus documentos fiscais.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-doc">
            Gerenciar Empresas
          </a>
        </div>
      `;return}e.innerHTML=`
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Documentos Fiscais</h1>
          <p class="page-header__subtitle">
            Empresa: <strong style="color: var(--text-primary);">${g.razaoSocial}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${bt(g.cnpj)})
            </span>
          </p>
        </div>
        <div class="page-header__actions">
          <a href="#/export" class="btn btn--secondary" id="btn-goto-export">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Central de Exportação
          </a>
          <a href="#/import" class="btn btn--primary" id="btn-import-docs">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar Arquivos
          </a>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);">
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
          <!-- Search Input -->
          <div style="flex: 2; min-width: 240px; position: relative;">
            <input 
              type="text" 
              class="input" 
              id="filter-search" 
              placeholder="Pesquisar por número, chave de acesso, CNPJ ou razão social..."
              style="padding-left: 34px;"
            />
            <svg style="position: absolute; left: 10px; top: 10px; width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          <!-- Tipo Filter -->
          <div style="flex: 1; min-width: 140px;">
            <select class="input" id="filter-type">
              <option value="">Todos os tipos</option>
              <option value="nfe">NF-e (55)</option>
              <option value="nfce">NFC-e (65)</option>
              <option value="nfse">NFS-e (Serviço)</option>
              <option value="cte">CT-e (57)</option>
            </select>
          </div>

          <!-- Situacao Filter -->
          <div style="flex: 1; min-width: 140px;">
            <select class="input" id="filter-situacao">
              <option value="">Todas as situações</option>
              <option value="autorizada">Autorizada</option>
              <option value="cancelada">Cancelada</option>
              <option value="inutilizada">Inutilizada</option>
              <option value="denegada">Denegada</option>
            </select>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn--secondary btn--sm" id="btn-clear-filters" type="button">Limpar</button>
            <button class="btn btn--secondary btn--sm" id="btn-export-filtered-csv" type="button" title="Exportar documentos filtrados para CSV">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container">
        <table class="table" id="documents-table">
          <thead>
            <tr>
              <th style="width: 110px;">Número</th>
              <th style="width: 90px;">Tipo</th>
              <th style="width: 120px;">Emissão</th>
              <th>Emitente</th>
              <th>Destinatário</th>
              <th class="text-right" style="width: 130px;">Valor Total</th>
              <th style="width: 110px;">Situação</th>
              <th style="width: 130px; text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody id="documents-tbody">
            <tr>
              <td colspan="8" style="text-align: center; padding: var(--space-8);">
                <div class="spinner spinner--lg" style="margin: 0 auto var(--space-2);"></div>
                <div style="color: var(--text-muted); font-size: 0.8125rem;">Carregando documentos fiscais...</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" id="documents-empty-state" style="display: none;">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h2 class="empty-state__title">Nenhum documento encontrado</h2>
          <p class="empty-state__description">Nenhum documento fiscal corresponde aos filtros selecionados.</p>
          <button class="btn btn--secondary btn--sm" id="btn-empty-clear" style="margin-top: var(--space-2);">Limpar Filtros</button>
        </div>

        <!-- Pagination Bar -->
        <div class="pagination" id="documents-pagination" style="display: none;">
          <div>
            Mostrando <span id="pag-showing" style="font-weight: 600; color: var(--text-primary);">0-0</span> de <span id="pag-total" style="font-weight: 600; color: var(--text-primary);">0</span> documentos
          </div>
          <div class="pagination__controls">
            <button class="btn btn--secondary btn--sm" id="btn-prev-page" disabled>Anterior</button>
            <span id="pag-current" style="font-size: 0.75rem; padding: 0 var(--space-2); color: var(--text-muted);">Página 1</span>
            <button class="btn btn--secondary btn--sm" id="btn-next-page" disabled>Próxima</button>
          </div>
        </div>
      </div>
    `,u(),v()}function u(){const g=e.querySelector("#filter-search"),f=e.querySelector("#filter-type"),y=e.querySelector("#filter-situacao"),x=e.querySelector("#btn-clear-filters"),_=e.querySelector("#btn-empty-clear");g?.addEventListener("input",()=>{o&&clearTimeout(o),o=setTimeout(()=>{l=1,v()},250)}),f?.addEventListener("change",()=>{l=1,v()}),y?.addEventListener("change",()=>{l=1,v()});const I=()=>{g&&(g.value=""),f&&(f.value=""),y&&(y.value=""),l=1,v()};x?.addEventListener("click",I),_?.addEventListener("click",I);const z=e.querySelector("#btn-export-filtered-csv");z?.addEventListener("click",async()=>{const T=await ct.getActiveCompany();if(!T)return;const O=g?.value.trim()||void 0,k=f?.value||void 0,$=y?.value||void 0;try{z.disabled=!0;const D=z.innerHTML;z.innerHTML=`
          <div class="spinner spinner--sm" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></div>
          Exportando...
        `;const E=await i.findPaginated({companyId:T.id,page:1,pageSize:1e4,search:O,tipo:k,situacao:$});if(E.data.length===0){tt.warning("Nenhum documento encontrado com os filtros atuais."),z.innerHTML=D,z.disabled=!1;return}const R=xt.exportDocumentsToCsv(E.data),c=new Blob([R],{type:"text/csv;charset=utf-8;"}),P=`documentos_${T.cnpj.replace(/\D/g,"")}_${new Date().toISOString().slice(0,10)}.csv`;await xt.saveBlobFile(c,P,[{name:"Arquivo CSV",extensions:["csv"]}])&&tt.success(`${E.data.length} documentos exportados com sucesso!`)}catch(D){console.error("Erro ao exportar documentos para CSV:",D),tt.error("Erro ao exportar documentos para CSV.")}finally{z.disabled=!1,z.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar CSV
        `}}),e.querySelector("#btn-prev-page")?.addEventListener("click",()=>{l>1&&(l--,v())}),e.querySelector("#btn-next-page")?.addEventListener("click",()=>{const T=Math.ceil(a/s);l<T&&(l++,v())})}async function v(){const g=await ct.getActiveCompany();if(!g)return;const f=e.querySelector("#documents-tbody"),y=e.querySelector("#documents-empty-state"),x=e.querySelector("#documents-pagination"),_=e.querySelector("#documents-table"),I=e.querySelector("#filter-search"),z=e.querySelector("#filter-type"),T=e.querySelector("#filter-situacao"),O=I?.value.trim()||void 0,k=z?.value||void 0,$=T?.value||void 0;try{const D=await i.findPaginated({companyId:g.id,page:l,pageSize:s,search:O,tipo:k,situacao:$});if(a=D.total,!f)return;if(D.data.length===0){f.innerHTML="",_&&(_.style.display="none"),y&&(y.style.display="flex"),x&&(x.style.display="none");return}_&&(_.style.display="table"),y&&(y.style.display="none"),x&&(x.style.display="flex");const E=(l-1)*s+1,R=Math.min(l*s,a),c=Math.ceil(a/s),P=e.querySelector("#pag-showing"),J=e.querySelector("#pag-total"),j=e.querySelector("#pag-current"),K=e.querySelector("#btn-prev-page"),q=e.querySelector("#btn-next-page");P&&(P.textContent=`${E}-${R}`),J&&(J.textContent=String(a)),j&&(j.textContent=`Página ${l} de ${c||1}`),K&&(K.disabled=l<=1),q&&(q.disabled=l>=c),f.innerHTML=D.data.map(V=>{const F=`<span class="badge badge--${V.tipo}">${V.tipo.toUpperCase()}</span>`,N=`<span class="badge badge--${V.situacao}">${V.situacao.charAt(0).toUpperCase()+V.situacao.slice(1)}</span>`,Q=bt(V.emitenteCnpjCpf),Z=V.destinatarioCnpjCpf?bt(V.destinatarioCnpjCpf):"-",X=Rt(V.dataEmissao);return`
          <tr data-doc-id="${V.id}" style="cursor: pointer;">
            <td>
              <div class="text-mono" style="font-weight: 600; color: var(--text-primary); font-size: 0.875rem;">
                ${V.numero}
              </div>
              <div style="font-size: 0.6875rem; color: var(--text-muted);">
                Série ${V.serie||"1"}
              </div>
            </td>
            <td>${F}</td>
            <td style="font-size: 0.8125rem;">${X}</td>
            <td>
              <div class="truncate" style="max-width: 220px; font-weight: 500;" title="${m(V.emitenteRazaoSocial)}">
                ${m(V.emitenteRazaoSocial)}
              </div>
              <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                ${Q}
              </div>
            </td>
            <td>
              <div class="truncate" style="max-width: 220px; font-weight: 500;" title="${m(V.destinatarioRazaoSocial||"Consumidor Final")}">
                ${m(V.destinatarioRazaoSocial||"Consumidor Final")}
              </div>
              <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                ${Z}
              </div>
            </td>
            <td class="text-right">
              <span class="text-mono" style="font-weight: 700; color: var(--text-primary);">
                ${rt(V.valorTotal)}
              </span>
            </td>
            <td>${N}</td>
            <td style="text-align: center;" onclick="event.stopPropagation();">
              <div style="display: flex; justify-content: center; gap: var(--space-1);">
                <!-- Visualizar Detalhes -->
                <button 
                  class="btn btn--secondary btn--sm btn-view-doc" 
                  data-doc-id="${V.id}" 
                  title="Ver Detalhes do Documento"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>

                <!-- Copiar Chave -->
                ${V.chaveAcesso?`
                  <button 
                    class="btn btn--secondary btn--sm btn-copy-chave" 
                    data-chave="${V.chaveAcesso}" 
                    title="Copiar Chave de Acesso"
                    style="padding: 4px 6px;"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                `:""}

                <!-- Baixar XML -->
                <button 
                  class="btn btn--secondary btn--sm btn-download-xml" 
                  data-doc-id="${V.id}" 
                  title="Baixar XML Original"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `}).join(""),f.querySelectorAll("tr[data-doc-id]").forEach(V=>{const F=V.getAttribute("data-doc-id");F&&V.addEventListener("click",()=>w(F))}),f.querySelectorAll(".btn-view-doc").forEach(V=>{V.addEventListener("click",F=>{F.stopPropagation();const N=V.getAttribute("data-doc-id");N&&w(N)})}),f.querySelectorAll(".btn-copy-chave").forEach(V=>{V.addEventListener("click",async F=>{F.stopPropagation();const N=V.getAttribute("data-chave");N&&await b(N,"Chave de acesso copiada!")})}),f.querySelectorAll(".btn-download-xml").forEach(V=>{V.addEventListener("click",async F=>{F.stopPropagation();const N=V.getAttribute("data-doc-id");if(N){const Q=await i.findById(N);Q&&p(Q)}})})}catch(D){console.error("Failed to load documents:",D),tt.show("Erro ao carregar documentos fiscais.","error")}}async function w(g){await Kt(g,i)}async function b(g,f){try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(g);else{const y=document.createElement("textarea");y.value=g,y.style.position="fixed",y.style.opacity="0",document.body.appendChild(y),y.select(),document.execCommand("copy"),document.body.removeChild(y)}tt.show(f,"success")}catch{tt.show("Não foi possível copiar para a área de transferência.","error")}}function p(g){const f=`${g.tipo.toUpperCase()}_${g.numero}_${g.chaveAcesso||g.id}.xml`,y=new Blob([g.xmlOriginal],{type:"application/xml;charset=utf-8;"}),x=URL.createObjectURL(y),_=document.createElement("a");_.href=x,_.download=f,document.body.appendChild(_),_.click(),document.body.removeChild(_),URL.revokeObjectURL(x),tt.show(`Download iniciado: ${f}`,"info")}function m(g){return g.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const h=ct.onActiveCompanyChange(()=>{l=1,n()}),d=new MutationObserver(()=>{document.body.contains(e)||(h(),d.disconnect())});d.observe(document.body,{childList:!0,subtree:!0}),n()}async function Oe(t,e){e.innerHTML=`
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Empresas Cadastradas</h1>
        <p class="page-header__subtitle">Gerencie os clientes e empresas para organização e vinculação de documentos fiscais</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" id="btn-new-company">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Empresa
        </button>
      </div>
    </div>

    <!-- Search & Filter Card -->
    <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);">
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
        <div style="flex: 2; min-width: 260px; position: relative;">
          <input 
            type="text" 
            class="input" 
            id="filter-company-search" 
            placeholder="Buscar por CNPJ, Razão Social ou Nome Fantasia..."
            style="padding-left: 32px;"
          />
          <svg style="position: absolute; left: 10px; top: 10px; width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div>
          <label style="display: flex; align-items: center; gap: var(--space-2); font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" id="check-only-active" />
            Apenas ativas
          </label>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-container">
      <table class="table" id="companies-table">
        <thead>
          <tr>
            <th>CNPJ</th>
            <th>Razão Social / Nome Fantasia</th>
            <th>Município / UF</th>
            <th>Regime</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody id="companies-tbody">
          <tr>
            <td colspan="6" style="text-align: center; padding: var(--space-6); color: var(--text-muted);">
              Carregando empresas...
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div class="empty-state" id="companies-empty-state" style="display: none;">
        <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <h2 class="empty-state__title">Nenhuma empresa encontrada</h2>
        <p class="empty-state__description">Cadastre sua primeira empresa para começar a vincular e organizar seus documentos fiscais.</p>
        <button class="btn btn--primary" id="btn-empty-new-company">Cadastrar Primeira Empresa</button>
      </div>
    </div>
  `;const i=e.querySelector("#companies-tbody"),l=e.querySelector("#companies-empty-state"),s=e.querySelector("#filter-company-search"),a=e.querySelector("#check-only-active"),o=e.querySelector("#btn-new-company"),n=e.querySelector("#btn-empty-new-company");async function u(){const b=s?.value.trim()||"",p=a?.checked||!1;try{const m=await ct.list(b,p),h=await ct.getActiveCompany();m.length===0?(i.innerHTML="",l.style.display="flex"):(l.style.display="none",$t(i,m,h?.id))}catch(m){console.error("Error loading companies:",m),i.innerHTML=`<tr><td colspan="6" style="text-align: center; color: var(--accent-danger); padding: var(--space-4);">Erro ao carregar empresas: ${m instanceof Error?m.message:String(m)}</td></tr>`}}let v;s?.addEventListener("input",()=>{clearTimeout(v),v=setTimeout(u,200)}),a?.addEventListener("change",u);const w=()=>{oe(null,async()=>{await u()})};o?.addEventListener("click",w),n?.addEventListener("click",w),await u()}function $t(t,e,i){t.innerHTML=e.map(l=>{const s=i===l.id,a=Me(l.regimeTributario),o=[l.endereco?.municipio,l.endereco?.uf].filter(Boolean).join(" / ")||"—";return`
      <tr data-company-id="${l.id}" style="${s?"background-color: rgba(99, 102, 241, 0.05);":""}">
        <td class="text-mono" style="font-weight: 500;">
          ${Ot(l.cnpj)}
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: var(--space-2);">
            ${yt(l.razaoSocial)}
            ${s?'<span class="badge" style="background: rgba(99, 102, 241, 0.2); color: var(--accent-primary); font-size: 0.625rem;">Ativa</span>':""}
          </div>
          ${l.nomeFantasia?`<div style="font-size: 0.75rem; color: var(--text-muted);">${yt(l.nomeFantasia)}</div>`:""}
        </td>
        <td style="color: var(--text-secondary);">${yt(o)}</td>
        <td>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${a}</span>
        </td>
        <td>
          ${l.ativa?'<span class="badge badge--autorizada">Ativa</span>':'<span class="badge badge--cancelada">Inativa</span>'}
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: var(--space-1);">
            ${s?"":`
              <button class="btn btn--ghost btn--sm btn-select-active" data-id="${l.id}" title="Selecionar como empresa ativa">
                Selecionar
              </button>
            `}
            <button class="btn btn--ghost btn--sm btn-edit-company" data-id="${l.id}" title="Editar dados da empresa">
              Editar
            </button>
            <button class="btn btn--ghost btn--sm btn-delete-company" data-id="${l.id}" style="color: var(--accent-danger);" title="Excluir empresa">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `}).join(""),t.querySelectorAll(".btn-select-active").forEach(l=>{l.addEventListener("click",async s=>{const a=s.currentTarget.getAttribute("data-id");if(a)try{const o=await ct.setActiveCompany(a);tt.success(`Empresa "${o?.razaoSocial}" selecionada.`),$t(t,await ct.list(),a)}catch{tt.error("Erro ao selecionar empresa ativa.")}})}),t.querySelectorAll(".btn-edit-company").forEach(l=>{l.addEventListener("click",async s=>{const a=s.currentTarget.getAttribute("data-id");if(a){const o=await ct.getById(a);o&&oe(o,async()=>{$t(t,await ct.list(),(await ct.getActiveCompany())?.id)})}})}),t.querySelectorAll(".btn-delete-company").forEach(l=>{l.addEventListener("click",async s=>{const a=s.currentTarget.getAttribute("data-id");if(a){const o=await ct.getById(a);o&&Pe(o,async()=>{$t(t,await ct.list(),(await ct.getActiveCompany())?.id)})}})})}function oe(t,e){const i=!!t,l=i?"Editar Empresa":"Cadastrar Nova Empresa",s=`
    <form id="company-form" style="display: flex; flex-direction: column; gap: var(--space-4);">
      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-cnpj">CNPJ *</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-cnpj" 
            value="${t?Ot(t.cnpj):""}" 
            placeholder="00.000.000/0000-00" 
            maxlength="18"
            required 
          />
          <div class="form-error" id="err-cnpj" style="display: none;"></div>
        </div>

        <div class="form-group">
          <label class="label" for="inp-razao">Razão Social *</label>
          <input 
            type="text" 
            class="input" 
            id="inp-razao" 
            value="${t?yt(t.razaoSocial):""}" 
            placeholder="Nome oficial da empresa" 
            required 
          />
          <div class="form-error" id="err-razao" style="display: none;"></div>
        </div>
      </div>

      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-fantasia">Nome Fantasia</label>
          <input 
            type="text" 
            class="input" 
            id="inp-fantasia" 
            value="${t?.nomeFantasia?yt(t.nomeFantasia):""}" 
            placeholder="Nome fantasia (opcional)" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-regime">Regime Tributário</label>
          <select class="input" id="inp-regime">
            <option value="simples_nacional" ${t?.regimeTributario==="simples_nacional"?"selected":""}>Simples Nacional</option>
            <option value="simples_nacional_excesso" ${t?.regimeTributario==="simples_nacional_excesso"?"selected":""}>Simples Nacional - Excesso de Sublimite</option>
            <option value="regime_normal" ${t?.regimeTributario==="regime_normal"?"selected":""}>Regime Normal (Lucro Presumido / Real)</option>
          </select>
        </div>
      </div>

      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-ie">Inscrição Estadual</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-ie" 
            value="${t?.inscricaoEstadual?yt(t.inscricaoEstadual):""}" 
            placeholder="Apenas dígitos" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-im">Inscrição Municipal</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-im" 
            value="${t?.inscricaoMunicipal?yt(t.inscricaoMunicipal):""}" 
            placeholder="Apenas dígitos" 
          />
        </div>
      </div>

      <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-secondary); margin-top: var(--space-2); border-bottom: 1px solid var(--border-primary); padding-bottom: var(--space-1);">
        Endereço
      </div>

      <div class="form-row form-row--3">
        <div class="form-group">
          <label class="label" for="inp-cep">CEP</label>
          <input 
            type="text" 
            class="input text-mono" 
            id="inp-cep" 
            value="${t?.endereco?.cep?te(t.endereco.cep):""}" 
            placeholder="00000-000" 
            maxlength="9" 
          />
        </div>

        <div class="form-group" style="grid-column: span 2;">
          <label class="label" for="inp-logradouro">Logradouro</label>
          <input 
            type="text" 
            class="input" 
            id="inp-logradouro" 
            value="${t?.endereco?.logradouro?yt(t.endereco.logradouro):""}" 
            placeholder="Rua, Av, etc." 
          />
        </div>
      </div>

      <div class="form-row form-row--3">
        <div class="form-group">
          <label class="label" for="inp-numero">Número</label>
          <input 
            type="text" 
            class="input" 
            id="inp-numero" 
            value="${t?.endereco?.numero?yt(t.endereco.numero):""}" 
            placeholder="123" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-bairro">Bairro</label>
          <input 
            type="text" 
            class="input" 
            id="inp-bairro" 
            value="${t?.endereco?.bairro?yt(t.endereco.bairro):""}" 
            placeholder="Bairro" 
          />
        </div>

        <div class="form-group">
          <label class="label" for="inp-municipio">Município</label>
          <input 
            type="text" 
            class="input" 
            id="inp-municipio" 
            value="${t?.endereco?.municipio?yt(t.endereco.municipio):""}" 
            placeholder="Cidade" 
          />
        </div>
      </div>

      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="label" for="inp-uf">UF</label>
          <input 
            type="text" 
            class="input" 
            id="inp-uf" 
            value="${t?.endereco?.uf?yt(t.endereco.uf):""}" 
            placeholder="SP" 
            maxlength="2" 
            style="text-transform: uppercase;" 
          />
        </div>

        <div class="form-group" style="display: flex; align-items: flex-end; padding-bottom: var(--space-2);">
          <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: 0.8125rem; color: var(--text-primary);">
            <input type="checkbox" id="inp-ativa" ${t?t.ativa?"checked":"":"checked"} />
            Empresa Ativa
          </label>
        </div>
      </div>
    </form>
  `,a=Nt({title:l,content:s,maxWidth:"680px",buttons:[{text:"Cancelar",variant:"secondary",onClick:o=>o.close()},{text:i?"Salvar Alterações":"Cadastrar Empresa",variant:"primary",onClick:async o=>{const n=o.modal.querySelector("#company-form"),u=n.querySelector("#inp-cnpj"),v=n.querySelector("#inp-razao"),w=n.querySelector("#inp-fantasia"),b=n.querySelector("#inp-regime"),p=n.querySelector("#inp-ie"),m=n.querySelector("#inp-im"),h=n.querySelector("#inp-cep"),d=n.querySelector("#inp-logradouro"),g=n.querySelector("#inp-numero"),f=n.querySelector("#inp-bairro"),y=n.querySelector("#inp-municipio"),x=n.querySelector("#inp-uf"),_=n.querySelector("#inp-ativa"),I=n.querySelector("#err-cnpj"),z=n.querySelector("#err-razao");I.style.display="none",z.style.display="none",u.classList.remove("input--error"),v.classList.remove("input--error");const T=pt(u.value),O=v.value.trim();let k=!1;if(O||(z.textContent="Razão Social é obrigatória.",z.style.display="block",v.classList.add("input--error"),k=!0),Gt(T)||(I.textContent="CNPJ inválido (verifique os dígitos).",I.style.display="block",u.classList.add("input--error"),k=!0),k)return;const $={cnpj:T,razaoSocial:O,nomeFantasia:w.value.trim()||void 0,regimeTributario:b.value,inscricaoEstadual:p.value.trim()||void 0,inscricaoMunicipal:m.value.trim()||void 0,endereco:{cep:pt(h.value)||void 0,logradouro:d.value.trim()||void 0,numero:g.value.trim()||void 0,bairro:f.value.trim()||void 0,municipio:y.value.trim()||void 0,uf:x.value.trim().toUpperCase()||void 0},ativa:_.checked};try{i&&t?(await ct.update(t.id,$),tt.success("Empresa atualizada com sucesso.")):(await ct.create($),tt.success("Empresa cadastrada com sucesso.")),o.close(),await e()}catch(D){const E=D instanceof Error?D.message:String(D);tt.error(E)}}}]});a.modal.querySelector("#inp-cnpj")?.addEventListener("input",o=>{const n=o.target;n.value=Ot(n.value)}),a.modal.querySelector("#inp-cep")?.addEventListener("input",o=>{const n=o.target;n.value=te(n.value)})}function Pe(t,e){Nt({title:"Excluir Empresa",content:`
      <div>
        <p style="margin-bottom: var(--space-3); color: var(--text-primary);">
          Tem certeza de que deseja excluir a empresa <strong>${yt(t.razaoSocial)}</strong> (${Ot(t.cnpj)})?
        </p>
        <p style="font-size: 0.8125rem; color: var(--accent-danger);">
          Atenção: Todos os documentos fiscais e registros associados a esta empresa serão permanentemente removidos.
        </p>
      </div>
    `,buttons:[{text:"Cancelar",variant:"secondary",onClick:i=>i.close()},{text:"Excluir Definitivamente",variant:"danger",onClick:async i=>{try{await ct.delete(t.id),tt.success(`Empresa "${t.razaoSocial}" excluída.`),i.close(),await e()}catch(l){tt.error(`Erro ao excluir empresa: ${l instanceof Error?l.message:String(l)}`)}}}]})}function Me(t){switch(t){case"simples_nacional":return"Simples Nacional";case"simples_nacional_excesso":return"Simples Nac. (Excesso)";case"regime_normal":return"Regime Normal";default:return"Não informado"}}function yt(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}var Be=class{static detect(t){if(!t||t.trim().length===0)return{type:"unknown",subType:"unknown",isXml:!1,confidence:"low",error:"Arquivo vazio"};const e=t.replace(/^\uFEFF/,"").trim();if(e.startsWith("|0000|")||/^\|0000\|/m.test(e)){const o=e.match(/^\|0000\|([^|]+)\|/m);return{type:"sped",subType:"sped_efd_icms_ipi",version:o?o[1]:void 0,isXml:!1,confidence:"high"}}if(!(e.startsWith("<?xml")||e.startsWith("<")))return{type:"unknown",subType:"unknown",isXml:!1,confidence:"low",error:"Arquivo não possui formato XML nem SPED reconhecido"};const i=e.match(/<([a-zA-Z0-9_:-]+)(\s|>)/),l=i?i[1].replace(/^[a-zA-Z0-9_]+:/,""):void 0,s=e.match(/versao\s*=\s*["']([^"']+)["']/i),a=s?s[1]:void 0;if(l==="nfeProc"||l==="NFe"||e.includes("<infNFe")||e.includes("http://www.portalfiscal.inf.br/nfe")){const o=e.match(/<mod>(\d{2})<\/mod>/i);return(o?o[1]:null)==="65"||e.includes("tpAmb")&&e.includes("<mod>65</mod>")?{type:"nfce",subType:"nfce",version:a||"4.00",rootTag:l,namespace:"http://www.portalfiscal.inf.br/nfe",isXml:!0,confidence:"high"}:{type:"nfe",subType:"nfe",version:a||"4.00",rootTag:l,namespace:"http://www.portalfiscal.inf.br/nfe",isXml:!0,confidence:"high"}}return l==="cteProc"||l==="CTe"||e.includes("<infCte")||e.includes("http://www.portalfiscal.inf.br/cte")?{type:"cte",subType:"cte",version:a||"4.00",rootTag:l,namespace:"http://www.portalfiscal.inf.br/cte",isXml:!0,confidence:"high"}:e.includes("sped.fazenda.gov.br/nfse")||e.includes("<infNFSe")||e.includes("<infDPS")||e.includes("<DPS")?{type:"nfse",subType:"nfse_nacional",version:a,rootTag:l,namespace:"http://www.sped.fazenda.gov.br/nfse",isXml:!0,confidence:"high"}:e.includes("abrasf")||l==="CompNfse"||l==="ConsultarNfseResposta"||e.includes("<CompNfse")||e.includes("<tcCompNfse")||e.includes("<tcDeclaracaoPrestacaoServico")||e.includes("<Nfse")?{type:"nfse",subType:"nfse_abrasf",version:a||"2.04",rootTag:l,isXml:!0,confidence:"high"}:{type:"unknown",subType:"unknown",rootTag:l,isXml:!0,confidence:"low",error:`Estrutura XML não reconhecida (tag raiz: <${l||"desconhecida"}>)`}}},$e=class{canParse(t){return t.isXml&&t.type!=="unknown"}async parse(t,e,i,l){const s=[],a=(Z,X=t)=>{const nt=X.match(new RegExp(`<${Z}[^>]*>([^<]+)<\\/${Z}>`,"i"));return nt?nt[1].trim():null};let o;const n=t.match(/<ch[a-zA-Z0-9_]+>([0-9]{44})<\//i)||t.match(/Id=["'](?:NFe|CTe)?([0-9]{44})["']/i);n&&(o=n[1]);const u=a("nNF")||a("nCT")||a("Numero")||a("numero")||`DOC-${Date.now().toString().slice(-6)}`,v=a("serie")||a("Serie")||"1",w=a("dhEmi")||a("dEmi")||a("DataEmissao")||a("dataEmissao")||new Date().toISOString(),b=w.includes("T")?w:`${w}T00:00:00Z`,p=t.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i)||t.match(/<prestador[^>]*>([\s\S]*?)<\/prestador>/i),m=p?p[1]:t,h=a("CNPJ",m)||a("CPF",m)||"00000000000000",d=a("xNome",m)||a("razaoSocial",m)||a("xFant",m)||"Emitente não identificado",g=a("UF",m)||void 0,f=t.match(/<dest[^>]*>([\s\S]*?)<\/dest>/i)||t.match(/<tomador[^>]*>([\s\S]*?)<\/tomador>/i),y=f?f[1]:"",x=y&&(a("CNPJ",y)||a("CPF",y))||void 0,_=y&&(a("xNome",y)||a("razaoSocial",y))||void 0,I=y&&a("UF",y)||void 0,z=a("vNF")||a("vPrest")||a("vLiq")||a("ValorTotal")||a("vServ")||"0",T=parseFloat(z.replace(",","."))||0,O=a("vICMS"),k=O?parseFloat(O.replace(",",".")):void 0,$=a("vIPI"),D=$?parseFloat($.replace(",",".")):void 0,E=a("vPIS"),R=E?parseFloat(E.replace(",",".")):void 0,c=a("vCOFINS"),P=c?parseFloat(c.replace(",",".")):void 0,J=a("vISS")||a("ValorIss"),j=J?parseFloat(J.replace(",",".")):void 0;let K="autorizada";t.includes('cStat="101"')||t.includes("<cStat>101</cStat>")||t.includes("retCancNFe")?K="cancelada":t.includes('cStat="102"')||t.includes("<cStat>102</cStat>")||t.includes("inutNFe")?K="inutilizada":(t.includes('cStat="110"')||t.includes('cStat="301"'))&&(K="denegada");const q=a("natOp")||void 0,V=[],F=t.matchAll(/<det\s+nItem=["'](\d+)["']>([\s\S]*?)<\/det>/gi);for(const Z of F){const X=parseInt(Z[1],10),nt=Z[2],ut=nt.match(/<prod[^>]*>([\s\S]*?)<\/prod>/i),et=ut?ut[1]:nt,it=a("xProd",et)||`Item ${X}`,dt=a("cProd",et)||void 0,st=a("NCM",et)||void 0,vt=a("CFOP",et)||void 0,ht=a("uCom",et)||void 0,r=a("qCom",et)||"1",B=a("vUnCom",et)||"0",M=a("vProd",et)||"0";V.push({id:typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`item-${Date.now()}-${X}`,documentId:"",numeroItem:X,codigo:dt,descricao:it,ncm:st,cfop:vt,unidade:ht,quantidade:parseFloat(r.replace(",","."))||1,valorUnitario:parseFloat(B.replace(",","."))||0,valorTotal:parseFloat(M.replace(",","."))||0})}const N=typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`doc-${Date.now()}`,Q=new Date().toISOString();return{document:{id:N,companyId:e,tipo:l.type==="unknown"?"nfe":l.type,chaveAcesso:o,numero:u,serie:v,dataEmissao:b,valorTotal:T,emitenteCnpjCpf:h,emitenteRazaoSocial:d,emitenteUf:g,destinatarioCnpjCpf:x,destinatarioRazaoSocial:_,destinatarioUf:I,valorICMS:k,valorIPI:D,valorPIS:R,valorCOFINS:P,valorISS:j,situacao:K,xmlOriginal:t,xmlHash:i,nfeVersao:l.version,naturezaOperacao:q,createdAt:Q,updatedAt:Q},items:V,warnings:s}}},je=class{canParse(t){return t.isXml&&(t.type==="nfe"||t.subType==="nfe")}async parse(t,e,i){const l=[],s=(et,it=t)=>{const dt=it.match(new RegExp(`<${et}[^>]*>([^<]+)<\\/${et}>`,"i"));return dt?dt[1].trim():null},a=et=>{if(!et)return;const it=parseFloat(et.replace(",","."));return isNaN(it)?void 0:it};let o;const n=t.match(/<chNFe>([0-9]{44})<\/chNFe>/i)||t.match(/infNFe\s+[^>]*Id=["'](?:NFe)?([0-9]{44})["']/i)||t.match(/Id=["'](?:NFe)?([0-9]{44})["']/i);n?(o=pt(n[1]),jt(o)||l.push(`Chave de acesso com dígito verificador inválido: ${o}`)):l.push("Chave de acesso não localizada no XML.");let u="4.00";const v=t.match(/<infNFe\s+[^>]*versao=["']([^"']+)["']/i)||t.match(/<nfeProc\s+[^>]*versao=["']([^"']+)["']/i);v&&(u=v[1]);const w=t.match(/<ide[^>]*>([\s\S]*?)<\/ide>/i),b=w?w[1]:t,p=s("nNF",b)||"0",m=s("serie",b)||"1",h=s("natOp",b)||void 0,d=s("dhEmi",b)||s("dEmi",b)||new Date().toISOString(),g=d.includes("T")?d:`${d}T00:00:00Z`,f=t.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i),y=f?f[1]:"",x=s("CNPJ",y)||s("CPF",y)||"00000000000000",_=s("xNome",y)||"Emitente não informado",I=y.match(/<enderEmit[^>]*>([\s\S]*?)<\/enderEmit>/i),z=s("UF",I?I[1]:y)||void 0,T=t.match(/<dest[^>]*>([\s\S]*?)<\/dest>/i),O=T?T[1]:"",k=O&&(s("CNPJ",O)||s("CPF",O))||void 0,$=O&&s("xNome",O)||void 0,D=O.match(/<enderDest[^>]*>([\s\S]*?)<\/enderDest>/i),E=D?D[1]:O,R=E&&s("UF",E)||void 0,c=t.match(/<ICMSTot[^>]*>([\s\S]*?)<\/ICMSTot>/i),P=c?c[1]:t,J=a(s("vNF",P))??0,j=a(s("vICMS",P)),K=a(s("vIPI",P)),q=a(s("vPIS",P)),V=a(s("vCOFINS",P)),F=a(s("vISS",P));let N="autorizada";const Q=t.match(/<protNFe[^>]*>([\s\S]*?)<\/protNFe>/i),Z=s("cStat",Q?Q[1]:t);Z==="101"||Z==="151"||Z==="155"||t.includes("retCancNFe")||t.includes("procEventoNFe")?N="cancelada":Z==="102"||t.includes("retInutNFe")||t.includes("procInutNFe")?N="inutilizada":Z==="110"||Z==="301"||Z==="302"||Z==="303"?N="denegada":Z==="100"&&(N="autorizada");const X=[],nt=/<det\s+nItem=["'](\d+)["']>([\s\S]*?)<\/det>/gi;let ut;for(;(ut=nt.exec(t))!==null;){const et=parseInt(ut[1],10),it=ut[2],dt=it.match(/<prod[^>]*>([\s\S]*?)<\/prod>/i),st=dt?dt[1]:it,vt=s("cProd",st)||void 0,ht=s("xProd",st)||`Item ${et}`,r=s("NCM",st)||void 0,B=s("CFOP",st)||void 0,M=s("uCom",st)||void 0,C=a(s("qCom",st))??1,S=a(s("vUnCom",st))??0,A=a(s("vProd",st))??C*S,U=it.match(/<imposto[^>]*>([\s\S]*?)<\/imposto>/i),H=U?U[1]:"";let L,W,Y,G,at;const lt=H.match(/<ICMS[^>]*>([\s\S]*?)<\/ICMS>/i);if(lt){const wt=lt[1];L=s("CST",wt)||s("CSOSN",wt)||void 0,W=s("orig",wt)||void 0,Y=a(s("vBC",wt)),at=a(s("pICMS",wt)),G=a(s("vICMS",wt))}let ot;const ft=H.match(/<IPI[^>]*>([\s\S]*?)<\/IPI>/i);ft&&(ot=a(s("vIPI",ft[1])));let Ct;const gt=H.match(/<PIS[^>]*>([\s\S]*?)<\/PIS>/i);gt&&(Ct=a(s("vPIS",gt[1])));let kt;const mt=H.match(/<COFINS[^>]*>([\s\S]*?)<\/COFINS>/i);mt&&(kt=a(s("vCOFINS",mt[1]))),X.push({id:"",documentId:"",numeroItem:et,codigo:vt,descricao:ht,ncm:r,cfop:B,unidade:M,quantidade:C,valorUnitario:S,valorTotal:A,baseCalculoICMS:Y,valorICMS:G,aliquotaICMS:at,valorIPI:ot,valorPIS:Ct,valorCOFINS:kt,cst:L,origem:W})}return{document:{id:"",companyId:e,tipo:"nfe",chaveAcesso:o,numero:p,serie:m,dataEmissao:g,valorTotal:J,emitenteCnpjCpf:x,emitenteRazaoSocial:_,emitenteUf:z,destinatarioCnpjCpf:k,destinatarioRazaoSocial:$,destinatarioUf:R,valorICMS:j,valorIPI:K,valorPIS:q,valorCOFINS:V,valorISS:F,situacao:N,xmlOriginal:t,xmlHash:i,nfeVersao:u,naturezaOperacao:h,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},items:X,warnings:l}}},Ue=class{canParse(t){return t.isXml&&(t.type==="nfse"||t.subType==="nfse_nacional"||t.subType==="nfse_abrasf")}async parse(t,e,i,l){const s=[],a=($,D=t)=>{const E=D.match(new RegExp(`<${$}[^>]*>([^<]+)<\\/${$}>`,"i"));return E?E[1].trim():null},o=$=>{if(!$)return;const D=parseFloat($.replace(",","."));return isNaN(D)?void 0:D},n=l?.subType==="nfse_nacional"||t.includes("sped.fazenda.gov.br/nfse")||t.includes("<infNFSe")||t.includes("<DPS")||t.includes("<infDPS");let u="0",v="1",w=new Date().toISOString(),b,p="autorizada",m="00000000000000",h="Prestador não informado",d,g,f,y,x=0,_,I,z,T,O="Serviço prestado";if(n){u=a("nNFSe")||a("Numero")||a("nDPS")||"0",v=a("sNFSe")||a("serie")||"1";const $=a("dhEmi")||a("dEmi")||a("dhDPS")||new Date().toISOString();w=$.includes("T")?$:`${$}T00:00:00Z`;const D=t.match(/<chNFSe>([0-9]+)<\/chNFSe>/i)||t.match(/infNFSe\s+[^>]*Id=["'](?:NFS)?([a-zA-Z0-9]+)["']/i);D?b=pt(D[1])||D[1]:b=a("cVerif")||void 0,(t.includes("retCanc")||t.includes("<cancNFSe>")||t.includes('cStat="101"'))&&(p="cancelada");const E=t.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i),R=E?E[1]:t;m=a("CNPJ",R)||a("CPF",R)||"00000000000000",h=a("xNome",R)||a("xFant",R)||"Prestador de Serviço",d=a("UF",R)||void 0;const c=t.match(/<toma[^>]*>([\s\S]*?)<\/toma>/i);if(c){const q=c[1];g=a("CNPJ",q)||a("CPF",q)||void 0,f=a("xNome",q)||void 0,y=a("UF",q)||void 0}const P=t.match(/<serv[^>]*>([\s\S]*?)<\/serv>/i),J=P?P[1]:t;T=a("cServ",J)||a("cTribNac",J)||void 0,O=a("xServ",J)||"Serviço prestado";const j=t.match(/<valores[^>]*>([\s\S]*?)<\/valores>/i),K=j?j[1]:t;x=o(a("vServ",K))??o(a("vLiquida",K))??0,_=o(a("vISS",K)),I=o(a("vPIS",K)),z=o(a("vCOFINS",K))}else{u=a("Numero")||a("numero")||"0",v=a("Serie")||a("serie")||"1";const $=a("DataEmissao")||a("dataEmissao")||new Date().toISOString();w=$.includes("T")?$:`${$}T00:00:00Z`;const D=a("CodigoVerificacao"),E=t.match(/InfNfse\s+[^>]*Id=["']([^"']+)["']/i);b=D||(E?E[1]:void 0),(t.includes("<NfseCancelamento")||t.includes("<Cancelamento")||t.includes("<tcCancelamentoNfse")||t.includes("<ConfirmacaoCancelamento"))&&(p="cancelada");const R=t.match(/<PrestadorServico[^>]*>([\s\S]*?)<\/PrestadorServico>/i),c=t.match(/<DadosPrestador[^>]*>([\s\S]*?)<\/DadosPrestador>/i)||t.match(/<Prestador[^>]*>([\s\S]*?)<\/Prestador>/i),P=[R?R[1]:"",c?c[1]:""].join(" ")||t;m=a("Cnpj",P)||a("Cpf",P)||a("CNPJ",P)||a("CPF",P)||"00000000000000",h=a("RazaoSocial",P)||a("NomeFantasia",P)||a("xNome",P)||"Prestador de Serviço",d=a("Uf",P)||a("UF",P)||void 0;const J=t.match(/<TomadorServico[^>]*>([\s\S]*?)<\/TomadorServico>/i),j=t.match(/<DadosTomador[^>]*>([\s\S]*?)<\/DadosTomador>/i)||t.match(/<Tomador[^>]*>([\s\S]*?)<\/Tomador>/i),K=[J?J[1]:"",j?j[1]:""].join(" ");K.trim().length>0&&(g=a("Cnpj",K)||a("Cpf",K)||a("CNPJ",K)||a("CPF",K)||void 0,f=a("RazaoSocial",K)||a("xNome",K)||void 0,y=a("Uf",K)||a("UF",K)||void 0);const q=t.match(/<Servico[^>]*>([\s\S]*?)<\/Servico>/i),V=q?q[1]:t;T=a("ItemListaServico",V)||a("CodigoCnae",V)||void 0,O=a("Discriminacao",V)||"Serviço prestado";const F=t.match(/<Valores[^>]*>([\s\S]*?)<\/Valores>/i)||t.match(/<ValoresNfse[^>]*>([\s\S]*?)<\/ValoresNfse>/i),N=F?F[1]:t;x=o(a("ValorServicos",N))??o(a("ValorLiquidoNfse",N))??o(a("ValorTotal",N))??0,_=o(a("ValorIss",N)),I=o(a("ValorPis",N)),z=o(a("ValorCofins",N))}const k=[{id:"",documentId:"",numeroItem:1,codigo:T,descricao:O.trim(),unidade:"UN",quantidade:1,valorUnitario:x,valorTotal:x,valorPIS:I,valorCOFINS:z}];return{document:{id:"",companyId:e,tipo:"nfse",chaveAcesso:b,numero:u,serie:v,dataEmissao:w,valorTotal:x,emitenteCnpjCpf:pt(m)||m,emitenteRazaoSocial:h,emitenteUf:d,destinatarioCnpjCpf:g?pt(g):void 0,destinatarioRazaoSocial:f,destinatarioUf:y,valorISS:_,valorPIS:I,valorCOFINS:z,situacao:p,xmlOriginal:t,xmlHash:i,nfeVersao:n?"Padrão Nacional 1.00":"ABRASF 2.04",naturezaOperacao:"PRESTAÇÃO DE SERVIÇOS",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},items:k,warnings:s}}},qe=class{canParse(t){return t.isXml&&(t.type==="cte"||t.subType==="cte")}async parse(t,e,i){const l=[],s=(S,A=t)=>{const U=A.match(new RegExp(`<${S}[^>]*>([^<]+)<\\/${S}>`,"i"));return U?U[1].trim():null},a=S=>{if(!S)return;const A=parseFloat(S.replace(",","."));return isNaN(A)?void 0:A};let o;const n=t.match(/<chCTe>([0-9]{44})<\/chCTe>/i)||t.match(/infCte\s+[^>]*Id=["'](?:CTe)?([0-9]{44})["']/i)||t.match(/Id=["'](?:CTe)?([0-9]{44})["']/i);n?(o=pt(n[1]),jt(o)||l.push(`Chave de acesso do CT-e com dígito verificador inválido: ${o}`)):l.push("Chave de acesso não localizada no XML do CT-e.");let u="4.00";const v=t.match(/<infCte\s+[^>]*versao=["']([^"']+)["']/i)||t.match(/<cteProc\s+[^>]*versao=["']([^"']+)["']/i);v&&(u=v[1]);const w=t.match(/<ide[^>]*>([\s\S]*?)<\/ide>/i),b=w?w[1]:t,p=s("nCT",b)||"0",m=s("serie",b)||"1",h=s("natOp",b)||"TRANSPORTE DE CARGAS",d=s("CFOP",b)||void 0,g=s("dhEmi",b)||s("dEmi",b)||new Date().toISOString(),f=g.includes("T")?g:`${g}T00:00:00Z`,y=s("xMunIni",b)||"",x=s("UFIni",b)||"",_=s("xMunFim",b)||"",I=s("UFFim",b)||"",z=t.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i),T=z?z[1]:"",O=s("CNPJ",T)||s("CPF",T)||"00000000000000",k=s("xNome",T)||"Transportadora não informada",$=T.match(/<enderEmit[^>]*>([\s\S]*?)<\/enderEmit>/i),D=s("UF",$?$[1]:T)||void 0,E=t.match(/<dest[^>]*>([\s\S]*?)<\/dest>/i),R=E?E[1]:"",c=R&&(s("CNPJ",R)||s("CPF",R))||void 0,P=R&&s("xNome",R)||void 0,J=R.match(/<enderDest[^>]*>([\s\S]*?)<\/enderDest>/i),j=J?J[1]:R,K=j&&s("UF",j)||void 0,q=t.match(/<vPrest[^>]*>([\s\S]*?)<\/vPrest>/i),V=q?q[1]:t,F=a(s("vTPrest",V))??a(s("vRec",V))??0,N=t.match(/<imp[^>]*>([\s\S]*?)<\/imp>/i),Q=N?N[1]:t;let Z,X,nt,ut;const et=Q.match(/<ICMS[^>]*>([\s\S]*?)<\/ICMS>/i);if(et){const S=et[1];Z=s("CST",S)||void 0,X=a(s("vBC",S)),nt=a(s("pICMS",S)),ut=a(s("vICMS",S))}const it=t.match(/<infCarga[^>]*>([\s\S]*?)<\/infCarga>/i),dt=it?it[1]:"",st=s("proPred",dt)||void 0,vt=a(s("qCarga",dt))||1;let ht="autorizada";const r=t.match(/<protCTe[^>]*>([\s\S]*?)<\/protCTe>/i),B=s("cStat",r?r[1]:t);B==="101"||B==="151"||B==="155"||t.includes("retCancCTe")||t.includes("procEventoCTe")?ht="cancelada":B==="102"||t.includes("retInutCTe")?ht="inutilizada":B==="110"||B==="301"||B==="302"||B==="303"?ht="denegada":B==="100"&&(ht="autorizada");let M="PRESTAÇÃO DE SERVIÇO DE TRANSPORTE";y&&_&&(M+=` (${y}/${x} -> ${_}/${I})`),st&&(M+=` - CARGA: ${st}`);const C=[{id:"",documentId:"",numeroItem:1,codigo:d,descricao:M,cfop:d,unidade:"UN",quantidade:vt,valorUnitario:F,valorTotal:F,baseCalculoICMS:X,valorICMS:ut,aliquotaICMS:nt,cst:Z}];return{document:{id:"",companyId:e,tipo:"cte",chaveAcesso:o,numero:p,serie:m,dataEmissao:f,valorTotal:F,emitenteCnpjCpf:pt(O)||O,emitenteRazaoSocial:k,emitenteUf:D,destinatarioCnpjCpf:c?pt(c):void 0,destinatarioRazaoSocial:P,destinatarioUf:K,valorICMS:ut,situacao:ht,xmlOriginal:t,xmlHash:i,nfeVersao:u,naturezaOperacao:h,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},items:C,warnings:l}}},se=class{canParse(t){return t.type==="sped"}async parse(t,e,i){const l=[],s=t.split(/\r?\n/).filter(k=>k.trim().length>0);if(s.length===0)throw new Error("Arquivo SPED está vazio.");const a={0:"Abertura, Identificação e Referências",B:"Escrituração e Apuração do ISS (DF)",C:"Documentos Fiscais I - Mercadorias (ICMS/IPI)",D:"Documentos Fiscais II - Serviços (ICMS)",E:"Apuração do ICMS e do IPI",G:"Controle do Crédito de ICMS do Ativo Permanente (CIAP)",H:"Inventário Físico",K:"Controle da Produção e do Estoque",1:"Outras Informações",9:"Controle e Encerramento do Arquivo Digital"},o={};for(const[k,$]of Object.entries(a))o[k]={bloco:k,nome:$,totalRegistros:0};let n=!1,u="018",v="original",w="",b="",p="",m="Empresa não identificada",h="00000000000000",d,g=0,f=0,y=0,x,_;const I=k=>{if(k.length===8){const $=k.substring(0,2),D=k.substring(2,4);return`${k.substring(4,8)}-${D}-${$}`}return k},z=k=>{if(!k)return 0;const $=parseFloat(k.replace(",","."));return isNaN($)?0:$};for(let k=0;k<s.length;k++){const $=s[k];if(!$.startsWith("|"))continue;const D=$.split("|"),E=D[1];if(!E)continue;const R=E.charAt(0);if(o[R]?o[R].totalRegistros++:o[R]={bloco:R,nome:a[R]||`Bloco ${R}`,totalRegistros:1},E==="0000"){n=!0,u=D[2]||"018",v=D[3]==="1"?"retificadora":"original";const c=D[4]||"",P=D[5]||"";w=I(c),b=I(P),c.length===8?p=`${c.substring(4,8)}${c.substring(2,4)}`:p=new Date().toISOString().substring(0,7).replace("-",""),m=D[6]||"Empresa não identificada",h=pt(D[7]||D[8]||"00000000000000"),d=D[10]||void 0}E==="0100"&&(_={nome:D[2]||"",cpfCnpj:pt(D[3]||D[4]||""),crc:D[5]||""}),E==="C100"&&(g++,f+=z(D[12]),y+=z(D[22])),E==="E110"&&(x={debitos:z(D[2]),creditos:z(D[6]),saldoDevedor:z(D[13]),saldoCredor:z(D[14])})}if(!n)throw new Error("Registro 0000 de abertura do SPED Fiscal não encontrado no arquivo.");const T={};for(const[k,$]of Object.entries(o))$.totalRegistros>0&&(T[k]=$);const O={blocos:T,documentosC100:{total:g,valorTotal:Math.round(f*100)/100,valorIcms:Math.round(y*100)/100},apuracaoIcms:x,contador:_};return{spedFile:{id:"",companyId:e,tipo:"efd_icms_ipi",periodo:p,dataInicio:w,dataFim:b,cnpj:h,razaoSocial:m,inscricaoEstadual:d,versaoLayout:u,finalidade:v,conteudoOriginal:t,conteudoHash:i,totalRegistros:s.length,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},summary:O,warnings:l}}};async function He(t){if(typeof crypto<"u"&&crypto.subtle&&typeof crypto.subtle.digest=="function"){const e=new TextEncoder().encode(t),i=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(i)).map(l=>l.toString(16).padStart(2,"0")).join("")}try{const{createHash:e}=await It(async()=>{const{createHash:i}=await import("./__vite-browser-external-5CQ71iAt.js").then(l=>re(l.default,1));return{createHash:i}},__vite__mapDeps([6,3]),import.meta.url);return e("sha256").update(t,"utf8").digest("hex")}catch{throw new Error("No cryptographic provider available to compute SHA-256 hash.")}}var Ve=class{documentRepo;spedRepo;xmlParser;nfeParser;nfseParser;cteParser;spedParser;constructor(t,e,i,l,s,a){this.documentRepo=t||new Ft,this.spedRepo=s||new Ut,this.xmlParser=new $e,this.nfeParser=e||new je,this.nfseParser=i||new Ue,this.cteParser=l||new qe,this.spedParser=a||new se}async importBatch(t,e,i){if(!e)throw new Error("Nenhuma empresa selecionada para importação.");if(!t||t.length===0)throw new Error("Nenhum arquivo fornecido para importação.");const l=[];let s=0,a=0,o=0,n=0;for(let v=0;v<t.length;v++){const w=t[v];let b="erro",p,m;try{const h=await He(w.content),d=Be.detect(w.content);if(d.type==="unknown"||!d.isXml&&d.type!=="sped"){b="formato_invalido",p=d.error||"Formato de arquivo não suportado",o++,l.push({nomeArquivo:w.name,status:b,mensagem:p}),i?.({current:v+1,total:t.length,fileName:w.name,status:b,message:p});continue}if(d.type==="sped"){const x=await this.spedRepo.findByHash(e,h);if(x){b="duplicado",p=`Arquivo SPED já importado anteriormente (Período: ${x.periodo})`,a++,l.push({nomeArquivo:w.name,status:b,mensagem:p,documentId:x.id}),i?.({current:v+1,total:t.length,fileName:w.name,status:b,message:p});continue}const _=await this.spedParser.parse(w.content,e,h),I=await this.spedRepo.create(_.spedFile);b="importado",m=I.id,s++,l.push({nomeArquivo:w.name,status:b,mensagem:p,documentId:m}),i?.({current:v+1,total:t.length,fileName:w.name,status:b,message:p});continue}const g=await this.documentRepo.findByHash(e,h);if(g){b="duplicado",p=`Documento já importado anteriormente (Número: ${g.numero})`,a++,l.push({nomeArquivo:w.name,status:b,mensagem:p,documentId:g.id}),i?.({current:v+1,total:t.length,fileName:w.name,status:b,message:p});continue}let f;if(this.nfeParser.canParse(d)?f=await this.nfeParser.parse(w.content,e,h):this.nfseParser.canParse(d)?f=await this.nfseParser.parse(w.content,e,h,d):this.cteParser.canParse(d)?f=await this.cteParser.parse(w.content,e,h):f=await this.xmlParser.parse(w.content,e,h,d),f.document.chaveAcesso){const x=await this.documentRepo.findByChaveAcesso(e,f.document.chaveAcesso);if(x){b="duplicado",p=`Documento com a mesma chave de acesso já existe (Número: ${x.numero})`,a++,l.push({nomeArquivo:w.name,status:b,mensagem:p,documentId:x.id}),i?.({current:v+1,total:t.length,fileName:w.name,status:b,message:p});continue}}const y=await this.documentRepo.create(f.document,f.items);b="importado",m=y.id,s++}catch(h){b="erro",p=h instanceof Error?h.message:String(h),n++}l.push({nomeArquivo:w.name,status:b,mensagem:p,documentId:m}),i?.({current:v+1,total:t.length,fileName:w.name,status:b,message:p})}const u=typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`imp-${Date.now()}`;return await this.persistImportRecord({id:u,companyId:e,dataImportacao:new Date().toISOString(),totalArquivos:t.length,importados:s,rejeitados:a+o,erros:n,detalhes:l}),{recordId:u,totalFiles:t.length,imported:s,duplicates:a,rejected:o,errors:n,details:l}}async persistImportRecord(t){try{await At().execute(`INSERT INTO import_records (id, company_id, data_importacao, total_arquivos, importados, rejeitados, erros, detalhes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[t.id,t.companyId,t.dataImportacao,t.totalArquivos,t.importados,t.rejeitados,t.erros,JSON.stringify(t.detalhes)])}catch(e){console.warn("Failed to persist import_records entry:",e)}}},Xe=new Ve;async function We(t,e){const i=await ct.getActiveCompany();e.innerHTML=`
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Importar Documentos Fiscais</h1>
        <p class="page-header__subtitle">
          Importação em lote de arquivos XML (NF-e, NFC-e, NFS-e, CT-e) e arquivos texto SPED
        </p>
      </div>
      <div>
        ${i?`
          <div style="font-size: 0.8125rem; color: var(--text-secondary); background: var(--bg-tertiary); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary);">
            Importando para: <strong style="color: var(--accent-primary);">${Xt(i.razaoSocial)}</strong>
          </div>
        `:`
          <a href="#/companies" class="btn btn--secondary btn--sm" style="color: var(--accent-warning); border-color: var(--accent-warning);">
            ⚠️ Nenhuma empresa selecionada (clique para escolher)
          </a>
        `}
      </div>
    </div>

    <!-- Hidden native file input for universal compatibility -->
    <input type="file" id="file-input-native" multiple accept=".xml,.txt" style="display: none;" />

    <div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-5);">
      <!-- Dropzone Card -->
      <div 
        id="import-dropzone" 
        class="card" 
        style="border: 2px dashed var(--border-secondary); padding: var(--space-8); text-align: center; cursor: pointer; transition: all 150ms ease;"
      >
        <svg style="width: 56px; height: 56px; color: var(--accent-primary); margin: 0 auto var(--space-4);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <h2 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
          Arraste e solte seus arquivos XML ou TXT aqui
        </h2>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-4);">
          Clique nesta área ou utilize o botão abaixo para selecionar arquivos do seu computador
        </p>
        <div>
          <button type="button" class="btn btn--primary" id="btn-select-files">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Selecionar Arquivos no Computador
          </button>
        </div>
      </div>

      <!-- Processing Progress Container (Hidden initially) -->
      <div id="import-progress-card" class="card" style="display: none; flex-direction: column; gap: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">
          <span style="font-weight: 600; color: var(--text-primary);" id="progress-status-title">Processando arquivos...</span>
          <span id="progress-percentage" style="color: var(--text-secondary);">0%</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
          <div id="progress-bar-fill" style="width: 0%; height: 100%; background: var(--accent-primary); transition: width 150ms ease;"></div>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span id="progress-current-filename">Iniciando...</span>
          <span id="progress-fraction">0 / 0</span>
        </div>
      </div>

      <!-- Import Report Container (Hidden initially) -->
      <div id="import-report-card" class="card" style="display: none; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">Relatório de Importação</h2>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn--secondary btn--sm" id="btn-import-more">Importar Mais Arquivos</button>
            <a href="#/documents" class="btn btn--primary btn--sm">Ver Documentos</a>
          </div>
        </div>

        <!-- Metric Badges Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); text-align: center;">
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Total</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);" id="report-total">0</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border-top: 2px solid var(--accent-success);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Importados</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-success);" id="report-imported">0</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border-top: 2px solid var(--accent-warning);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Duplicados</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-warning);" id="report-duplicates">0</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border-top: 2px solid var(--accent-danger);">
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase;">Erros / Inválidos</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-danger);" id="report-errors">0</div>
          </div>
        </div>

        <!-- Details Table -->
        <div class="table-container" style="max-height: 300px; overflow-y: auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Status</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody id="report-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Supported Formats Card -->
      <div class="card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--nfe" style="margin-top: 2px;">NF-e</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">Nota Fiscal Eletrônica</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Modelo 55 e 65 (NFC-e), XML v4.00</div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--nfse" style="margin-top: 2px;">NFS-e</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">Serviço Municipal</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Padrão Nacional e ABRASF v2.04</div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--cte" style="margin-top: 2px;">CT-e</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">Conhecimento de Transporte</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Modelo 57, XML v3.00/v4.00</div>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
          <span class="badge badge--sped" style="margin-top: 2px;">SPED</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem; color: var(--text-primary);">SPED Fiscal</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">EFD ICMS/IPI em formato posicional (|)</div>
          </div>
        </div>
      </div>
    </div>
  `;const l=e.querySelector("#import-dropzone"),s=e.querySelector("#btn-select-files"),a=e.querySelector("#file-input-native"),o=e.querySelector("#import-progress-card"),n=e.querySelector("#progress-bar-fill"),u=e.querySelector("#progress-percentage"),v=e.querySelector("#progress-current-filename"),w=e.querySelector("#progress-fraction"),b=e.querySelector("#import-report-card"),p=e.querySelector("#report-total"),m=e.querySelector("#report-imported"),h=e.querySelector("#report-duplicates"),d=e.querySelector("#report-errors"),g=e.querySelector("#report-tbody"),f=e.querySelector("#btn-import-more");["dragenter","dragover"].forEach(z=>{l.addEventListener(z,T=>{T.preventDefault(),T.stopPropagation(),l.style.borderColor="var(--accent-primary)",l.style.backgroundColor="rgba(99, 102, 241, 0.04)"})}),["dragleave","drop"].forEach(z=>{l.addEventListener(z,T=>{T.preventDefault(),T.stopPropagation(),l.style.borderColor="var(--border-secondary)",l.style.backgroundColor="var(--bg-secondary)"})}),l.addEventListener("drop",async z=>{const T=z.dataTransfer?.files;T&&T.length>0&&await x(Array.from(T))}),l.addEventListener("click",z=>{z.target.closest("#btn-select-files")||y()}),s.addEventListener("click",z=>{z.stopPropagation(),y()}),a.addEventListener("change",async()=>{a.files&&a.files.length>0&&(await x(Array.from(a.files)),a.value="")}),f?.addEventListener("click",()=>{b.style.display="none",l.style.display="block"});async function y(){const z=await ct.getActiveCompany();if(!z){tt.warning("Por favor, selecione ou cadastre uma empresa antes de importar documentos.");return}if(typeof window<"u"&&"__TAURI_INTERNALS__"in window)try{const T=await It(()=>import("./dist-js-CyvBJpFd.js"),__vite__mapDeps([4,1]),import.meta.url),O=await It(()=>import("./dist-js-DyYppoCF.js"),__vite__mapDeps([5,1]),import.meta.url),k=await T.open({multiple:!0,filters:[{name:"Documentos Fiscais (*.xml, *.txt)",extensions:["xml","txt"]}]});if(k){const $=Array.isArray(k)?k:[k],D=[];for(const E of $)try{const R=await O.readTextFile(E),c=E.split(/[/\\]/).pop()||"documento.xml";D.push({name:c,content:R})}catch(R){console.warn(`Error reading file "${E}":`,R)}D.length>0&&await _(D,z.id)}return}catch(T){console.warn("Tauri dialog failed, falling back to native file input:",T)}a.click()}async function x(z){const T=await ct.getActiveCompany();if(!T){tt.warning("Por favor, selecione ou cadastre uma empresa antes de importar documentos.");return}const O=[];for(const k of z)try{const $=await k.text();O.push({name:k.name,content:$})}catch($){console.warn(`Error reading file ${k.name}:`,$)}O.length>0&&await _(O,T.id)}async function _(z,T){l.style.display="none",b.style.display="none",o.style.display="flex",n.style.width="0%",u.textContent="0%",w.textContent=`0 / ${z.length}`;try{const O=await Xe.importBatch(z,T,k=>{const $=Math.round(k.current/k.total*100);n.style.width=`${$}%`,u.textContent=`${$}%`,v.textContent=`Processando: ${k.fileName}`,w.textContent=`${k.current} / ${k.total}`});I(O),tt.success(`Importação finalizada: ${O.imported} importados, ${O.duplicates} duplicados.`)}catch(O){const k=O instanceof Error?O.message:String(O);tt.error(`Falha no processamento: ${k}`),l.style.display="block"}finally{o.style.display="none"}}function I(z){b.style.display="flex",p.textContent=String(z.totalFiles),m.textContent=String(z.imported),h.textContent=String(z.duplicates),d.textContent=String(z.rejected+z.errors),g.innerHTML=z.details.map(T=>{let O="badge--inutilizada",k="Desconhecido";switch(T.status){case"importado":O="badge--autorizada",k="Importado";break;case"duplicado":O="badge--cte",k="Duplicado";break;case"formato_invalido":O="badge--cancelada",k="Formato Inválido";break;case"erro":O="badge--cancelada",k="Erro"}return`
        <tr>
          <td style="font-weight: 500;">${Xt(T.nomeArquivo)}</td>
          <td><span class="badge ${O}">${k}</span></td>
          <td style="color: var(--text-secondary); font-size: 0.75rem;">
            ${Xt(T.mensagem||(T.status==="importado"?"Documento persistido com sucesso":""))}
          </td>
        </tr>
      `}).join("")}}function Xt(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function Ze(t,e){const i=new Ut,l=new se;let s="",a=null;async function o(){const y=await ct.getActiveCompany();if(!y){e.innerHTML=`
        <div class="page-header">
          <div>
            <h1 class="page-header__title">SPED Fiscal</h1>
            <p class="page-header__subtitle">Escrituração Fiscal Digital (EFD ICMS/IPI) — Análise e Auditoria</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione uma empresa ativa para visualizar, analisar e auditar seus arquivos SPED Fiscal.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-sped">
            Gerenciar Empresas
          </a>
        </div>
      `;return}e.innerHTML=`
      <div class="page-header">
        <div>
          <h1 class="page-header__title">SPED Fiscal</h1>
          <p class="page-header__subtitle">
            Escrituração Fiscal Digital (EFD ICMS/IPI) — Empresa: 
            <strong style="color: var(--text-primary);">${d(y.razaoSocial)}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${bt(y.cnpj)})
            </span>
          </p>
        </div>
        <div class="page-header__actions">
          <a href="#/import" class="btn btn--primary" id="btn-import-sped">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar Arquivo SPED
          </a>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4);">
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
          <div style="flex: 1; min-width: 260px; position: relative;">
            <input 
              type="text" 
              class="input" 
              id="sped-filter-search" 
              placeholder="Pesquisar por período (ex: 202401), versão ou finalidade..."
              style="padding-left: 34px;"
            />
            <svg style="position: absolute; left: 10px; top: 10px; width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div>
            <button class="btn btn--secondary btn--sm" id="btn-clear-sped-filter" type="button">Limpar</button>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container">
        <table class="table" id="sped-table" style="display: none;">
          <thead>
            <tr>
              <th>Período</th>
              <th>Empresa Escriturada</th>
              <th>Layout / Finalidade</th>
              <th class="text-right">Total Registros</th>
              <th>Importado Em</th>
              <th style="text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody id="sped-tbody">
            <!-- Dynamically populated -->
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" id="sped-empty-state" style="display: none; padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
          <h2 class="empty-state__title">Nenhum arquivo SPED Fiscal encontrado</h2>
          <p class="empty-state__description">
            Importe arquivos texto EFD ICMS/IPI para auditar blocos estruturais, conferir documentos fiscais e apurações tributárias.
          </p>
          <a href="#/import" class="btn btn--primary">Importar Arquivo SPED</a>
        </div>
      </div>
    `;const x=e.querySelector("#sped-filter-search"),_=e.querySelector("#btn-clear-sped-filter");x&&x.addEventListener("input",I=>{a&&clearTimeout(a),a=setTimeout(()=>{s=I.target.value.trim().toLowerCase(),n(y.id)},250)}),_&&_.addEventListener("click",()=>{x&&(x.value=""),s="",n(y.id)}),await n(y.id)}async function n(y){const x=e.querySelector("#sped-table"),_=e.querySelector("#sped-tbody"),I=e.querySelector("#sped-empty-state");if(!(!_||!x||!I))try{const z=(await i.findByCompany(y)).filter(T=>{if(!s)return!0;const O=s;return T.periodo.toLowerCase().includes(O)||T.razaoSocial.toLowerCase().includes(O)||T.cnpj.includes(O)||T.versaoLayout.includes(O)||T.finalidade.toLowerCase().includes(O)});if(z.length===0){_.innerHTML="",x.style.display="none",I.style.display="flex";return}x.style.display="table",I.style.display="none",_.innerHTML=z.map(T=>{const O=p(T.periodo),k=m(T.dataInicio),$=m(T.dataFim),D=T.finalidade==="retificadora"?'<span class="badge badge--cancelada">Retificadora</span>':'<span class="badge badge--autorizada">Original</span>';return`
          <tr data-sped-id="${T.id}" style="cursor: pointer;">
            <td>
              <div class="badge badge--nfe" style="font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px;">
                ${O}
              </div>
              <div class="text-muted" style="font-size: 0.6875rem;">
                ${k} a ${$}
              </div>
            </td>
            <td>
              <div class="truncate" style="max-width: 250px; font-weight: 500;" title="${d(T.razaoSocial)}">
                ${d(T.razaoSocial)}
              </div>
              <div class="text-mono text-muted" style="font-size: 0.6875rem;">
                CNPJ: ${bt(T.cnpj)} ${T.inscricaoEstadual?`• IE: ${T.inscricaoEstadual}`:""}
              </div>
            </td>
            <td>
              <span class="badge" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-primary);">
                v${T.versaoLayout}
              </span>
              <span style="margin-left: var(--space-1);">${D}</span>
            </td>
            <td class="text-right">
              <span class="text-mono" style="font-weight: 700; color: var(--text-primary);">
                ${T.totalRegistros.toLocaleString("pt-BR")}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted);"> linhas</span>
            </td>
            <td style="font-size: 0.8125rem;">
              ${Rt(T.createdAt)}
            </td>
            <td style="text-align: center;" onclick="event.stopPropagation();">
              <div style="display: flex; justify-content: center; gap: var(--space-1);">
                <!-- Visualizar Detalhes -->
                <button 
                  class="btn btn--secondary btn--sm btn-view-sped" 
                  data-sped-id="${T.id}" 
                  title="Auditar e Ver Detalhes do SPED"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>

                <!-- Baixar TXT -->
                <button 
                  class="btn btn--secondary btn--sm btn-download-sped" 
                  data-sped-id="${T.id}" 
                  title="Baixar Arquivo TXT Original"
                  style="padding: 4px 6px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>

                <!-- Excluir -->
                <button 
                  class="btn btn--secondary btn--sm btn-delete-sped" 
                  data-sped-id="${T.id}" 
                  title="Excluir Arquivo SPED"
                  style="padding: 4px 6px; color: var(--color-danger);"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `}).join(""),_.querySelectorAll("tr[data-sped-id]").forEach(T=>{T.addEventListener("click",()=>{const O=T.getAttribute("data-sped-id");O&&u(O)})}),_.querySelectorAll(".btn-view-sped").forEach(T=>{T.addEventListener("click",O=>{O.stopPropagation();const k=T.getAttribute("data-sped-id");k&&u(k)})}),_.querySelectorAll(".btn-download-sped").forEach(T=>{T.addEventListener("click",async O=>{O.stopPropagation();const k=T.getAttribute("data-sped-id");if(k){const $=await i.findById(k);$&&w($)}})}),_.querySelectorAll(".btn-delete-sped").forEach(T=>{T.addEventListener("click",async O=>{O.stopPropagation();const k=T.getAttribute("data-sped-id");if(!k)return;const $=await i.findById(k);$&&v($,y)})})}catch(z){console.error("Failed to load SPED files:",z),tt.show("Erro ao carregar arquivos SPED Fiscal.","error")}}async function u(y){const x=await i.findById(y);if(!x){tt.show("Arquivo SPED não encontrado.","error");return}try{const _=(await l.parse(x.conteudoOriginal,x.companyId,x.conteudoHash)).summary,I=document.createElement("div");I.innerHTML=`
        <!-- Modal Navigation Tabs -->
        <div class="tabs-nav" id="sped-modal-tabs">
          <button class="tab-btn tab-btn--active" data-tab="tab-sped-overview">Visão Geral & Blocos</button>
          <button class="tab-btn" data-tab="tab-sped-blococ">Documentos (Bloco C)</button>
          <button class="tab-btn" data-tab="tab-sped-bloce">Apuração ICMS (Bloco E)</button>
          <button class="tab-btn" data-tab="tab-sped-txt">Arquivo Original (TXT)</button>
        </div>

        <!-- Tab 1: Overview & Blocks -->
        <div class="tab-content" id="tab-sped-overview">
          <!-- General Info Grid -->
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-card__label">Período de Escrituração</div>
              <div class="detail-card__value text-mono" style="color: var(--accent-primary);">
                ${p(x.periodo)}
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Data Início</div>
              <div class="detail-card__value" style="font-size: 0.875rem;">${m(x.dataInicio)}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Data Fim</div>
              <div class="detail-card__value" style="font-size: 0.875rem;">${m(x.dataFim)}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Versão Leiaute</div>
              <div class="detail-card__value text-mono">${x.versaoLayout}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Finalidade</div>
              <div class="detail-card__value">
                <span class="badge ${x.finalidade==="retificadora"?"badge--cancelada":"badge--autorizada"}">
                  ${x.finalidade==="retificadora"?"Retificadora":"Original"}
                </span>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Total de Registros</div>
              <div class="detail-card__value text-mono">${x.totalRegistros.toLocaleString("pt-BR")}</div>
            </div>
          </div>

          <!-- Empresa & Contabilista Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
            <!-- Empresa -->
            <div class="card" style="padding: var(--space-4);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
                Empresa Escriturada (Registro 0000)
              </div>
              <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                ${d(x.razaoSocial)}
              </div>
              <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
                CNPJ: ${bt(x.cnpj)}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                Inscrição Estadual: <strong>${x.inscricaoEstadual||"Não informada"}</strong>
              </div>
            </div>

            <!-- Contabilista -->
            <div class="card" style="padding: var(--space-4);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; margin-bottom: var(--space-3);">
                Contabilista Responsável (Registro 0100)
              </div>
              ${_.contador?`
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                  ${d(_.contador.nome)}
                </div>
                <div class="text-mono" style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
                  CPF/CNPJ: ${bt(_.contador.cpfCnpj)}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  CRC: <strong>${_.contador.crc}</strong>
                </div>
              `:`
                <div style="color: var(--text-muted); font-size: 0.8125rem;">
                  Dados do contador não identificados no Registro 0100 deste arquivo.
                </div>
              `}
            </div>
          </div>

          <!-- Hash SHA-256 Card -->
          <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); background-color: var(--bg-tertiary);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1);">
              <span style="font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">
                Assinatura de Integridade (SHA-256)
              </span>
              <button class="btn btn--secondary btn--sm" id="btn-modal-copy-hash" type="button" style="padding: 2px 8px; font-size: 0.75rem;">
                Copiar Hash
              </button>
            </div>
            <div class="text-mono" style="font-size: 0.75rem; color: var(--text-secondary); word-break: break-all;">
              ${x.conteudoHash}
            </div>
          </div>

          <!-- Active Blocks Grid -->
          <div class="detail-section-title">Estrutura de Blocos Escriturados</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-4);">
            ${Object.values(_.blocos).map(z=>{const T=x.totalRegistros>0?Math.round(z.totalRegistros/x.totalRegistros*100):0;return`
                <div class="card" style="padding: var(--space-3) var(--space-4); border: 1px solid var(--border-primary);">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1);">
                    <span class="badge" style="font-weight: 700; background: var(--bg-tertiary); color: var(--accent-primary);">
                      Bloco ${z.bloco}
                    </span>
                    <span class="text-mono text-muted" style="font-size: 0.75rem;">
                      ${T}% do arquivo
                    </span>
                  </div>
                  <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
                    ${d(z.nome)}
                  </div>
                  <div class="text-mono" style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
                    ${z.totalRegistros.toLocaleString("pt-BR")} 
                    <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted);">registros</span>
                  </div>
                </div>
              `}).join("")}
          </div>
        </div>

        <!-- Tab 2: Bloco C Documents -->
        <div class="tab-content" id="tab-sped-blococ" style="display: none;">
          <div class="detail-section-title">Documentos Fiscais I - Mercadorias (Registro C100)</div>
          
          <div class="detail-grid" style="margin-top: var(--space-3);">
            <div class="detail-card">
              <div class="detail-card__label">Total Notas C100</div>
              <div class="detail-card__value text-mono">${_.documentosC100.total.toLocaleString("pt-BR")}</div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Valor Total das Operações</div>
              <div class="detail-card__value text-mono" style="color: var(--accent-primary);">
                ${rt(_.documentosC100.valorTotal)}
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-card__label">Total ICMS Destacado</div>
              <div class="detail-card__value text-mono" style="color: var(--color-success, #22c55e);">
                ${rt(_.documentosC100.valorIcms)}
              </div>
            </div>
          </div>

          <div class="card" style="padding: var(--space-4); margin-top: var(--space-4); background-color: var(--bg-tertiary);">
            <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary);">
              Informações do Bloco C
            </h4>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6;">
              O Bloco C reúne todas as notas fiscais de entrada e saída de mercadorias escrituradas pela empresa no período 
              (incluindo Notas Fiscais Eletrônicas NF-e modelo 55 e NFC-e modelo 65). 
              Os totais consolidados acima representam os registros analíticos do Registro C100 identificados no arquivo digital.
            </p>
          </div>
        </div>

        <!-- Tab 3: Bloco E Apuração -->
        <div class="tab-content" id="tab-sped-bloce" style="display: none;">
          <div class="detail-section-title">Apuração Própria do ICMS (Registro E110)</div>

          ${_.apuracaoIcms?`
            <div class="detail-grid" style="margin-top: var(--space-3);">
              <div class="detail-card">
                <div class="detail-card__label">Total Débitos (Saídas)</div>
                <div class="detail-card__value text-mono" style="color: var(--color-danger, #ef4444);">
                  ${rt(_.apuracaoIcms.debitos)}
                </div>
              </div>
              <div class="detail-card">
                <div class="detail-card__label">Total Créditos (Entradas)</div>
                <div class="detail-card__value text-mono" style="color: var(--color-success, #22c55e);">
                  ${rt(_.apuracaoIcms.creditos)}
                </div>
              </div>
              <div class="detail-card">
                <div class="detail-card__label">Saldo Devedor a Recolher</div>
                <div class="detail-card__value text-mono" style="color: ${_.apuracaoIcms.saldoDevedor>0?"var(--color-danger, #ef4444)":"var(--text-primary)"};">
                  ${rt(_.apuracaoIcms.saldoDevedor)}
                </div>
              </div>
              <div class="detail-card">
                <div class="detail-card__label">Saldo Credor a Transportar</div>
                <div class="detail-card__value text-mono" style="color: ${_.apuracaoIcms.saldoCredor>0?"var(--color-success, #22c55e)":"var(--text-primary)"};">
                  ${rt(_.apuracaoIcms.saldoCredor)}
                </div>
              </div>
            </div>

            <!-- Apuração Assessment Alert -->
            <div style="margin-top: var(--space-4);">
              ${_.apuracaoIcms.saldoDevedor>0?`
                <div class="card" style="padding: var(--space-4); border-left: 4px solid var(--color-warning, #f59e0b); background: var(--bg-tertiary);">
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                    Atenção: Saldo devedor de ICMS apurado
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                    O valor de <strong>${rt(_.apuracaoIcms.saldoDevedor)}</strong> deve ser recolhido via DARE/GNRE nos prazos legais regulamentares da SEFAZ estadual.
                  </div>
                </div>
              `:_.apuracaoIcms.saldoCredor>0?`
                <div class="card" style="padding: var(--space-4); border-left: 4px solid var(--color-success, #22c55e); background: var(--bg-tertiary);">
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                    Saldo Credor Acumulado para o Período Seguinte
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                    O saldo credor de <strong>${rt(_.apuracaoIcms.saldoCredor)}</strong> será transportado para dedução na apuração do próximo mês de escrituração.
                  </div>
                </div>
              `:`
                <div class="card" style="padding: var(--space-4); background: var(--bg-tertiary);">
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                    Apuração Equilibrada
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                    Não há saldo devedor nem saldo credor a transportar apurados no Registro E110 deste período.
                  </div>
                </div>
              `}
            </div>
          `:`
            <div class="empty-state card" style="padding: var(--space-6); margin-top: var(--space-3);">
              <h3 class="empty-state__title" style="font-size: 1rem;">Registro E110 não localizado</h3>
              <p class="empty-state__description">
                Este arquivo SPED Fiscal não possui o registro E110 de apuração própria do ICMS preenchido.
              </p>
            </div>
          `}
        </div>

        <!-- Tab 4: Raw Text Viewer -->
        <div class="tab-content" id="tab-sped-txt" style="display: none;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-2);">
            <span style="font-size: 0.8125rem; color: var(--text-muted);">
              Mostrando prévia dos primeiros 150 registros de ${x.totalRegistros.toLocaleString("pt-BR")} linhas.
            </span>
            <div style="display: flex; gap: var(--space-2);">
              <button class="btn btn--secondary btn--sm" id="btn-modal-copy-txt" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copiar Arquivo Completo
              </button>
              <button class="btn btn--secondary btn--sm" id="btn-modal-download-txt" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar TXT
              </button>
            </div>
          </div>

          <pre class="xml-code-viewer" id="sped-preview-content">${d(h(x.conteudoOriginal,150))}</pre>
        </div>
      `,I.querySelectorAll(".tab-btn").forEach(z=>{z.addEventListener("click",()=>{const T=z.getAttribute("data-tab");T&&(I.querySelectorAll(".tab-btn").forEach(O=>O.classList.remove("tab-btn--active")),z.classList.add("tab-btn--active"),I.querySelectorAll(".tab-content").forEach(O=>{O.style.display=O.id===T?"block":"none"}))})}),I.querySelector("#btn-modal-copy-hash")?.addEventListener("click",async()=>{await b(x.conteudoHash,"Hash SHA-256 copiado para a área de transferência!")}),I.querySelector("#btn-modal-copy-txt")?.addEventListener("click",async()=>{await b(x.conteudoOriginal,"Conteúdo do SPED copiado com sucesso!")}),I.querySelector("#btn-modal-download-txt")?.addEventListener("click",()=>{w(x)}),Nt({title:`SPED Fiscal EFD — Período ${p(x.periodo)} (${x.razaoSocial})`,content:I,maxWidth:"920px",buttons:[{text:"Fechar",variant:"secondary"}]})}catch(_){console.error("Failed to parse SPED file details:",_),tt.show("Erro ao processar detalhes do arquivo SPED.","error")}}function v(y,x){const _=document.createElement("div");_.innerHTML=`
      <p style="margin-bottom: var(--space-3); color: var(--text-primary);">
        Tem certeza de que deseja remover o arquivo SPED Fiscal do período 
        <strong>${p(y.periodo)}</strong> da empresa <strong>${d(y.razaoSocial)}</strong>?
      </p>
      <div class="card" style="padding: var(--space-3); background-color: var(--bg-tertiary); font-size: 0.8125rem; color: var(--text-secondary);">
        Registros: <strong>${y.totalRegistros.toLocaleString("pt-BR")}</strong><br/>
        Hash: <span class="text-mono" style="font-size: 0.6875rem;">${y.conteudoHash.substring(0,32)}...</span>
      </div>
      <p style="margin-top: var(--space-3); font-size: 0.8125rem; color: var(--color-danger);">
        ⚠️ Esta ação removerá os dados de auditoria associados a este arquivo digital.
      </p>
    `,Nt({title:"Excluir Arquivo SPED Fiscal",content:_,maxWidth:"480px",buttons:[{text:"Cancelar",variant:"secondary"},{text:"Excluir Arquivo",variant:"danger",onClick:async I=>{try{await i.delete(y.id)?(tt.show("Arquivo SPED excluído com sucesso.","success"),I.close(),await n(x)):tt.show("Não foi possível excluir o arquivo SPED.","error")}catch(z){console.error("Failed to delete SPED file:",z),tt.show("Erro ao excluir arquivo SPED.","error")}}}]})}function w(y){const x=`SPED_EFD_${y.cnpj}_${y.periodo}.txt`,_=new Blob([y.conteudoOriginal],{type:"text/plain;charset=utf-8;"}),I=URL.createObjectURL(_),z=document.createElement("a");z.href=I,z.download=x,document.body.appendChild(z),z.click(),document.body.removeChild(z),URL.revokeObjectURL(I),tt.show(`Download iniciado: ${x}`,"info")}async function b(y,x){try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(y);else{const _=document.createElement("textarea");_.value=y,_.style.position="fixed",_.style.opacity="0",document.body.appendChild(_),_.select(),document.execCommand("copy"),document.body.removeChild(_)}tt.show(x,"success")}catch{tt.show("Não foi possível copiar para a área de transferência.","error")}}function p(y){if(y&&y.length===6){const x=y.substring(0,4);return`${y.substring(4,6)}/${x}`}return y}function m(y){if(!y)return"";if(y.length===10&&y.includes("-")){const[x,_,I]=y.split("-");return`${I}/${_}/${x}`}return Rt(y)}function h(y,x){const _=y.split(/\r?\n/);return _.length<=x?y:`${_.slice(0,x).join(`
`)}

... [${_.length-x} linhas adicionais ocultas nesta prévia] ...`}function d(y){return y.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const g=ct.onActiveCompanyChange(()=>{o()}),f=new MutationObserver(()=>{document.body.contains(e)||(g(),f.disconnect())});f.observe(document.body,{childList:!0,subtree:!0}),o()}function Ge(t,e){const i=new Ft,l=new Ut;async function s(){const u=await ct.getActiveCompany();if(!u){e.innerHTML=`
        <div class="page-header">
          <div>
            <h1 class="page-header__title">Exportação Fiscal</h1>
            <p class="page-header__subtitle">Exportação em lote de pacotes XML, relatórios gerenciais e dados contábeis</p>
          </div>
        </div>

        <div class="empty-state card" style="padding: var(--space-8);">
          <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <h2 class="empty-state__title">Nenhuma Empresa Selecionada</h2>
          <p class="empty-state__description">
            Selecione uma empresa ativa para exportar documentos fiscais, pacotes contábeis e relatórios analíticos.
          </p>
          <a href="#/companies" class="btn btn--primary" id="btn-select-company-export">
            Gerenciar Empresas
          </a>
        </div>
      `;return}e.innerHTML=`
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Exportação Fiscal & Contábil</h1>
          <p class="page-header__subtitle">
            Empresa: <strong style="color: var(--text-primary);">${a(u.razaoSocial)}</strong>
            <span class="text-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-left: var(--space-2);">
              (${bt(u.cnpj)})
            </span>
          </p>
        </div>
      </div>

      <!-- Export Configuration & Options Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-6);">
        <!-- Card 1: Pacote XML para Contabilidade (ZIP) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid var(--accent-primary);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: var(--accent-primary); background: rgba(99, 102, 241, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Pacote XML Contábil (ZIP)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Compactação em lote dos arquivos XML originais com assinatura SHA-256 e manifesto estruturado de entrega para envio à contabilidade.
            </p>

            <!-- Filter Controls -->
            <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4);">
              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Tipo de Documento</label>
                <select class="input" id="zip-filter-type" style="width: 100%;">
                  <option value="">Todos os tipos (NF-e, NFC-e, NFS-e, CT-e)</option>
                  <option value="nfe">NF-e (Modelo 55)</option>
                  <option value="nfce">NFC-e (Modelo 65)</option>
                  <option value="nfse">NFS-e (Serviços)</option>
                  <option value="cte">CT-e (Modelo 57)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Situação</label>
                <select class="input" id="zip-filter-situacao" style="width: 100%;">
                  <option value="autorizada">Apenas Autorizadas (Padrão)</option>
                  <option value="">Todas as situações</option>
                  <option value="cancelada">Apenas Canceladas</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div id="zip-progress-container" style="display: none; margin-bottom: var(--space-3);">
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;" id="zip-progress-text">Compactando...</div>
              <div style="height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                <div id="zip-progress-bar" style="width: 0%; height: 100%; background: var(--accent-primary); transition: width 150ms ease;"></div>
              </div>
            </div>

            <button class="btn btn--primary" id="btn-export-zip" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar Pacote XML (.zip)
            </button>
          </div>
        </div>

        <!-- Card 2: Relatório Gerencial de Documentos (CSV) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid var(--accent-success);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: var(--accent-success); background: rgba(34, 197, 94, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Relatório de Documentos (CSV)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Planilha gerencial formatada em padrão brasileiro (ponto-e-vírgula e UTF-8 BOM), pronta para abertura direta no Microsoft Excel ou LibreOffice Calc.
            </p>

            <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4);">
              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Tipo de Documento</label>
                <select class="input" id="csv-filter-type" style="width: 100%;">
                  <option value="">Todos os tipos</option>
                  <option value="nfe">NF-e (Modelo 55)</option>
                  <option value="nfce">NFC-e (Modelo 65)</option>
                  <option value="nfse">NFS-e (Serviços)</option>
                  <option value="cte">CT-e (Modelo 57)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Situação</label>
                <select class="input" id="csv-filter-situacao" style="width: 100%;">
                  <option value="">Todas as situações</option>
                  <option value="autorizada">Apenas Autorizadas</option>
                  <option value="cancelada">Apenas Canceladas</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <button class="btn btn--secondary" id="btn-export-csv" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Documentos (.csv)
            </button>
          </div>
        </div>

        <!-- Card 3: Relatório Analítico de Itens (CSV) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid #fb923c;">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: #fb923c; background: rgba(251, 146, 60, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                Relatório de Itens e Produtos (CSV)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Exportação detalhada de cada item faturado ou adquirido com código de produto, descrição, classificação NCM, CFOP, quantidade, valores e tributos destacados.
            </p>
            <div class="card" style="padding: var(--space-3); background: var(--bg-tertiary); font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--space-4);">
              Ideal para conferência de estoque, apuração de créditos tributários e auditoria de compras e vendas.
            </div>
          </div>

          <div>
            <button class="btn btn--secondary" id="btn-export-items-csv" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Itens (.csv)
            </button>
          </div>
        </div>

        <!-- Card 4: Arquivos SPED Fiscal (ZIP) -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-5); border-top: 3px solid #60a5fa;">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="color: #60a5fa; background: rgba(96, 165, 250, 0.12); padding: 6px; border-radius: var(--radius-sm);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
              </div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                SPED Fiscal EFD (ZIP)
              </h2>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
              Pacote compactado contendo todos os arquivos texto originais da Escrituração Fiscal Digital (EFD ICMS/IPI) importados para esta empresa.
            </p>
            <div class="card" style="padding: var(--space-3); background: var(--bg-tertiary); font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--space-4);">
              Preserva integridade e leiaute original dos arquivos digitais para conferência com o PVA da Receita Federal.
            </div>
          </div>

          <div>
            <button class="btn btn--secondary" id="btn-export-sped-zip" style="width: 100%; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Arquivos SPED (.zip)
            </button>
          </div>
        </div>
      </div>
    `,e.querySelector("#btn-export-zip")?.addEventListener("click",async()=>{const v=e.querySelector("#btn-export-zip"),w=e.querySelector("#zip-progress-container"),b=e.querySelector("#zip-progress-bar"),p=e.querySelector("#zip-progress-text"),m=e.querySelector("#zip-filter-type")?.value||void 0,h=e.querySelector("#zip-filter-situacao")?.value||void 0;try{v&&(v.disabled=!0),w&&(w.style.display="block");const d=(await i.findPaginated({companyId:u.id,tipo:m,situacao:h,page:1,pageSize:1e4})).data;if(d.length===0){tt.show("Nenhum documento encontrado com os filtros selecionados.","warning");return}const g=await xt.exportDocumentsToZip(d,(y,x)=>{if(b&&p){const _=Math.round(y/x*100);b.style.width=`${_}%`,p.textContent=`Compactando documento ${y} de ${x} (${_}%)...`}}),f=`XMLs_${u.cnpj}_${new Date().toISOString().substring(0,10)}.zip`;await xt.saveBlobFile(g,f),tt.show(`Pacote com ${d.length} XMLs exportado com sucesso.`,"success")}catch(d){console.error("Failed to export XMLs zip:",d),tt.show("Erro ao exportar pacote XML.","error")}finally{v&&(v.disabled=!1),w&&(w.style.display="none")}}),e.querySelector("#btn-export-csv")?.addEventListener("click",async()=>{const v=e.querySelector("#btn-export-csv"),w=e.querySelector("#csv-filter-type")?.value||void 0,b=e.querySelector("#csv-filter-situacao")?.value||void 0;try{v&&(v.disabled=!0);const p=(await i.findPaginated({companyId:u.id,tipo:w,situacao:b,page:1,pageSize:1e4})).data;if(p.length===0){tt.show("Nenhum documento encontrado para exportação.","warning");return}const m=xt.exportDocumentsToCsv(p),h=new Blob([m],{type:"text/csv;charset=utf-8;"}),d=`documentos_${u.cnpj}_${new Date().toISOString().substring(0,10)}.csv`;await xt.saveBlobFile(h,d),tt.show(`Relatório com ${p.length} documentos exportado com sucesso.`,"success")}catch(p){console.error("Failed to export documents CSV:",p),tt.show("Erro ao exportar relatório CSV.","error")}finally{v&&(v.disabled=!1)}}),e.querySelector("#btn-export-items-csv")?.addEventListener("click",async()=>{const v=e.querySelector("#btn-export-items-csv");try{v&&(v.disabled=!0);const w=await i.findAllByCompany(u.id);if(w.length===0){tt.show("Nenhum documento encontrado na empresa para extrair itens.","warning");return}const b=new Map;w.forEach(g=>b.set(g.id,g));const p=[];for(const g of w){const f=await i.findItemsByDocumentId(g.id);p.push(...f)}if(p.length===0){tt.show("Nenhum item discriminado encontrado nos documentos.","warning");return}const m=xt.exportItemsToCsv(p,b),h=new Blob([m],{type:"text/csv;charset=utf-8;"}),d=`itens_produtos_${u.cnpj}_${new Date().toISOString().substring(0,10)}.csv`;await xt.saveBlobFile(h,d),tt.show(`Relatório analítico com ${p.length} itens exportado com sucesso.`,"success")}catch(w){console.error("Failed to export items CSV:",w),tt.show("Erro ao exportar relatório de itens.","error")}finally{v&&(v.disabled=!1)}}),e.querySelector("#btn-export-sped-zip")?.addEventListener("click",async()=>{const v=e.querySelector("#btn-export-sped-zip");try{v&&(v.disabled=!0);const w=await l.findByCompany(u.id);if(w.length===0){tt.show("Nenhum arquivo SPED Fiscal encontrado nesta empresa.","warning");return}const b=await xt.exportSpedFilesToZip(w),p=`SPED_EFD_${u.cnpj}_${new Date().toISOString().substring(0,10)}.zip`;await xt.saveBlobFile(b,p),tt.show(`Pacote com ${w.length} arquivos SPED exportado com sucesso.`,"success")}catch(w){console.error("Failed to export SPED files:",w),tt.show("Erro ao exportar arquivos SPED.","error")}finally{v&&(v.disabled=!1)}})}function a(u){return u.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const o=ct.onActiveCompanyChange(()=>{s()}),n=new MutationObserver(()=>{document.body.contains(e)||(o(),n.disconnect())});n.observe(document.body,{childList:!0,subtree:!0}),s()}var Ke=class{customDb;constructor(t){this.customDb=t}get db(){return this.customDb??At()}async get(t){const e=await this.db.select("SELECT key, value, updated_at FROM app_settings WHERE key = ?",[t]);return!e||e.length===0?null:e[0].value}async set(t,e){const i=new Date().toISOString();await this.db.execute(`INSERT INTO app_settings (key, value, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,[t,e,i])}async getAll(){const t=await this.db.select("SELECT key, value FROM app_settings"),e={};for(const i of t)e[i.key]=i.value;return e}async getDatabaseStats(){const[t]=await this.db.select("SELECT COUNT(*) as total FROM companies"),[e]=await this.db.select("SELECT COUNT(*) as total FROM fiscal_documents"),[i]=await this.db.select("SELECT COUNT(*) as total FROM document_items"),[l]=await this.db.select("SELECT COUNT(*) as total FROM sped_files"),[s]=await this.db.select("SELECT COUNT(*) as total FROM import_records");return{companies:t?.total||0,fiscalDocuments:e?.total||0,documentItems:i?.total||0,spedFiles:l?.total||0,importRecords:s?.total||0}}async exportBackup(){const t=await this.db.select("SELECT * FROM companies"),e=await this.db.select("SELECT * FROM fiscal_documents"),i=await this.db.select("SELECT * FROM document_items"),l=await this.db.select("SELECT * FROM sped_files"),s=await this.db.select("SELECT * FROM import_records"),a=await this.db.select("SELECT * FROM app_settings"),o=(t||[]).map(p=>({id:p.id,cnpj:p.cnpj,razaoSocial:p.razao_social,nomeFantasia:p.nome_fantasia??void 0,inscricaoEstadual:p.inscricao_estadual??void 0,inscricaoMunicipal:p.inscricao_municipal??void 0,endereco:{logradouro:p.logradouro??void 0,numero:p.numero??void 0,complemento:p.complemento??void 0,bairro:p.bairro??void 0,municipio:p.municipio??void 0,codigoMunicipio:p.codigo_municipio??void 0,uf:p.uf??void 0,cep:p.cep??void 0},regimeTributario:p.regime_tributario??void 0,ativa:!!p.ativa,createdAt:p.created_at,updatedAt:p.updated_at})),n=(e||[]).map(p=>({id:p.id,companyId:p.company_id,tipo:p.tipo,chaveAcesso:p.chave_acesso??void 0,numero:p.numero,serie:p.serie??void 0,dataEmissao:p.data_emissao,valorTotal:p.valor_total,emitenteCnpjCpf:p.emitente_cnpj_cpf,emitenteRazaoSocial:p.emitente_razao_social,emitenteUf:p.emitente_uf??void 0,destinatarioCnpjCpf:p.destinatario_cnpj_cpf??void 0,destinatarioRazaoSocial:p.destinatario_razao_social??void 0,destinatarioUf:p.destinatario_uf??void 0,valorICMS:p.valor_icms??void 0,valorIPI:p.valor_ipi??void 0,valorPIS:p.valor_pis??void 0,valorCOFINS:p.valor_cofins??void 0,valorISS:p.valor_iss??void 0,situacao:p.situacao,xmlOriginal:p.xml_original,xmlHash:p.xml_hash,nfeVersao:p.nfe_versao??void 0,naturezaOperacao:p.natureza_operacao??void 0,createdAt:p.created_at,updatedAt:p.updated_at})),u=(i||[]).map(p=>({id:p.id,documentId:p.document_id,numeroItem:p.numero_item,codigo:p.codigo??void 0,descricao:p.descricao,ncm:p.ncm??void 0,cfop:p.cfop??void 0,unidade:p.unidade??void 0,quantidade:p.quantidade,valorUnitario:p.valor_unitario,valorTotal:p.valor_total,baseCalculoICMS:p.base_calculo_icms??void 0,valorICMS:p.valor_icms??void 0,aliquotaICMS:p.aliquota_icms??void 0,valorIPI:p.valor_ipi??void 0,valorPIS:p.valor_pis??void 0,valorCOFINS:p.valor_cofins??void 0,cst:p.cst??void 0,origem:p.origem??void 0})),v=(l||[]).map(p=>({id:p.id,companyId:p.company_id,tipo:p.tipo,periodo:p.periodo,dataInicio:p.data_inicio,dataFim:p.data_fim,cnpj:p.cnpj,razaoSocial:p.razao_social,inscricaoEstadual:p.inscricao_estadual??void 0,versaoLayout:p.versao_layout,finalidade:p.finalidade,conteudoOriginal:p.conteudo_original,conteudoHash:p.conteudo_hash,totalRegistros:p.total_registros,createdAt:p.created_at,updatedAt:p.updated_at})),w=(s||[]).map(p=>({id:p.id,companyId:p.company_id,dataImportacao:p.data_importacao,totalArquivos:p.total_arquivos,importados:p.importados,rejeitados:p.rejeitados,erros:p.erros,detalhes:p.detalhes?JSON.parse(p.detalhes):[]})),b=(a||[]).map(p=>({key:p.key,value:p.value,updatedAt:p.updated_at}));return{version:1,exportedAt:new Date().toISOString(),appVersion:"1.0.0",companies:o,fiscalDocuments:n,documentItems:u,spedFiles:v,importRecords:w,appSettings:b}}async restoreBackup(t){if(!t||!t.companies||!t.fiscalDocuments)throw new Error("Arquivo de backup inválido ou formato incompatível.");await this.db.execute("DELETE FROM document_items"),await this.db.execute("DELETE FROM fiscal_documents"),await this.db.execute("DELETE FROM sped_files"),await this.db.execute("DELETE FROM import_records"),await this.db.execute("DELETE FROM companies");for(const e of t.companies)await this.db.execute(`INSERT INTO companies (
          id, cnpj, razao_social, nome_fantasia, inscricao_estadual, inscricao_municipal,
          logradouro, numero, complemento, bairro, municipio, codigo_municipio,
          uf, cep, regime_tributario, ativa, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e.id,e.cnpj,e.razaoSocial,e.nomeFantasia??null,e.inscricaoEstadual??null,e.inscricaoMunicipal??null,e.endereco?.logradouro??null,e.endereco?.numero??null,e.endereco?.complemento??null,e.endereco?.bairro??null,e.endereco?.municipio??null,e.endereco?.codigoMunicipio??null,e.endereco?.uf??null,e.endereco?.cep??null,e.regimeTributario??null,e.ativa?1:0,e.createdAt,e.updatedAt]);for(const e of t.fiscalDocuments)await this.db.execute(`INSERT INTO fiscal_documents (
          id, company_id, tipo, chave_acesso, numero, serie, data_emissao, valor_total,
          emitente_cnpj_cpf, emitente_razao_social, emitente_uf,
          destinatario_cnpj_cpf, destinatario_razao_social, destinatario_uf,
          valor_icms, valor_ipi, valor_pis, valor_cofins, valor_iss,
          situacao, xml_original, xml_hash, nfe_versao, natureza_operacao,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e.id,e.companyId,e.tipo,e.chaveAcesso??null,e.numero,e.serie??null,e.dataEmissao,e.valorTotal,e.emitenteCnpjCpf,e.emitenteRazaoSocial,e.emitenteUf??null,e.destinatarioCnpjCpf??null,e.destinatarioRazaoSocial??null,e.destinatarioUf??null,e.valorICMS??null,e.valorIPI??null,e.valorPIS??null,e.valorCOFINS??null,e.valorISS??null,e.situacao,e.xmlOriginal,e.xmlHash,e.nfeVersao??null,e.naturezaOperacao??null,e.createdAt,e.updatedAt]);if(t.documentItems)for(const e of t.documentItems)await this.db.execute(`INSERT INTO document_items (
            id, document_id, numero_item, codigo, descricao, ncm, cfop, unidade,
            quantidade, valor_unitario, valor_total,
            base_calculo_icms, valor_icms, aliquota_icms, valor_ipi, valor_pis, valor_cofins,
            cst, origem
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e.id,e.documentId,e.numeroItem,e.codigo??null,e.descricao,e.ncm??null,e.cfop??null,e.unidade??null,e.quantidade,e.valorUnitario,e.valorTotal,e.baseCalculoICMS??null,e.valorICMS??null,e.aliquotaICMS??null,e.valorIPI??null,e.valorPIS??null,e.valorCOFINS??null,e.cst??null,e.origem??null]);if(t.spedFiles)for(const e of t.spedFiles)await this.db.execute(`INSERT INTO sped_files (
            id, company_id, tipo, periodo, data_inicio, data_fim, cnpj, razao_social,
            inscricao_estadual, versao_layout, finalidade, conteudo_original, conteudo_hash,
            total_registros, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e.id,e.companyId,e.tipo,e.periodo,e.dataInicio,e.dataFim,e.cnpj,e.razaoSocial,e.inscricaoEstadual??null,e.versaoLayout,e.finalidade,e.conteudoOriginal,e.conteudoHash,e.totalRegistros,e.createdAt,e.updatedAt]);if(t.importRecords)for(const e of t.importRecords)await this.db.execute(`INSERT INTO import_records (
            id, company_id, data_importacao, total_arquivos, importados, rejeitados, erros, detalhes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[e.id,e.companyId,e.dataImportacao,e.totalArquivos,e.importados,e.rejeitados,e.erros,JSON.stringify(e.detalhes||[])]);if(t.appSettings)for(const e of t.appSettings)await this.set(e.key,e.value);return{success:!0,stats:await this.getDatabaseStats()}}async vacuum(){try{await this.db.execute("VACUUM")}catch(t){console.warn("VACUUM failed or not supported in current environment:",t)}}async clearAllData(){await this.db.execute("DELETE FROM document_items"),await this.db.execute("DELETE FROM fiscal_documents"),await this.db.execute("DELETE FROM sped_files"),await this.db.execute("DELETE FROM import_records"),await this.db.execute("DELETE FROM companies")}},Ye=new Ke,Je=class{repo;constructor(t=Ye){this.repo=t}async getPreferences(){const t=await this.repo.getAll();return{theme:t.theme||Tt.getTheme()||"dark",pageSize:parseInt(t.page_size,10)||20,notifyCancelled:t.notify_cancelled!=="false",backupReminder:t.backup_reminder==="true"}}async savePreferences(t){t.theme&&(await this.repo.set("theme",t.theme),Tt.setTheme(t.theme)),t.pageSize!==void 0&&await this.repo.set("page_size",t.pageSize.toString()),t.notifyCancelled!==void 0&&await this.repo.set("notify_cancelled",t.notifyCancelled?"true":"false"),t.backupReminder!==void 0&&await this.repo.set("backup_reminder",t.backupReminder?"true":"false")}async getDatabaseStats(){return this.repo.getDatabaseStats()}async exportBackup(){const t=await this.repo.exportBackup(),e=JSON.stringify(t,null,2),i=new Blob([e],{type:"application/json;charset=utf-8;"}),l=`fiscalflow_backup_${new Date().toISOString().slice(0,10)}.json`;return xt.saveBlobFile(i,l,[{name:"Backup FiscalFlow (*.json)",extensions:["json"]}])}async importBackup(t){let e;try{e=JSON.parse(t)}catch{throw new Error("O arquivo selecionado não contém um JSON válido.")}if(!e||!Array.isArray(e.companies)||!Array.isArray(e.fiscalDocuments))throw new Error("Estrutura de backup incompatível com o FiscalFlow.");const i=await this.repo.restoreBackup(e);e.companies.length>0?await ct.setActiveCompany(e.companies[0].id):await ct.clearActiveCompany();const l=e.appSettings?.find(s=>s.key==="theme")?.value;return(l==="dark"||l==="light")&&Tt.setTheme(l),i}async optimizeDatabase(){return await this.repo.vacuum(),this.repo.getDatabaseStats()}async resetDatabase(){await this.repo.clearAllData(),await ct.clearActiveCompany()}},Et=new Je;function Qe(t,e){async function i(){const s=await Et.getPreferences(),a=await Et.getDatabaseStats(),o=Tt.getTheme();e.innerHTML=`
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Configurações do Sistema</h1>
          <p class="page-header__subtitle">Personalização de tema, preferências operacionais, backup e manutenção de dados</p>
        </div>
      </div>

      <div style="max-width: 900px; display: flex; flex-direction: column; gap: var(--space-6);">
        
        <!-- 1. Theme and Appearance Card -->
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
            <div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">Aparência e Tema</h2>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">Escolha a paleta visual mais confortável para a sua rotina de conferência fiscal.</p>
            </div>
            <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: var(--accent-primary); font-size: 0.75rem;">Atalho: Alt + T</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <!-- Dark Theme Option -->
            <label id="theme-card-dark" style="display: flex; flex-direction: column; padding: var(--space-4); border: 2px solid ${o==="dark"?"var(--accent-primary)":"var(--border-primary)"}; border-radius: var(--radius-lg); background-color: var(--bg-tertiary); cursor: pointer; transition: all var(--transition-fast);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  <input type="radio" name="setting-theme" value="dark" ${o==="dark"?"checked":""} id="radio-theme-dark" />
                  <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9375rem;">Tema Escuro (Padrão)</span>
                </div>
                <span>🌙</span>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: var(--space-3);">
                Otimizado para baixa luminosidade, alto contraste e conforto visual prolongado.
              </p>
              <div style="display: flex; gap: 6px; padding: 6px; background: #0f172a; border-radius: var(--radius-sm); border: 1px solid #334155;">
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #1e293b;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #3b82f6;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #10b981;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #f8fafc;"></span>
              </div>
            </label>

            <!-- Light Theme Option -->
            <label id="theme-card-light" style="display: flex; flex-direction: column; padding: var(--space-4); border: 2px solid ${o==="light"?"var(--accent-primary)":"var(--border-primary)"}; border-radius: var(--radius-lg); background-color: var(--bg-tertiary); cursor: pointer; transition: all var(--transition-fast);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  <input type="radio" name="setting-theme" value="light" ${o==="light"?"checked":""} id="radio-theme-light" />
                  <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9375rem;">Tema Claro</span>
                </div>
                <span>☀️</span>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: var(--space-3);">
                Ideal para ambientes bem iluminados e telas externas com alta claridade.
              </p>
              <div style="display: flex; gap: 6px; padding: 6px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid #cbd5e1;">
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #ffffff;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #059669;"></span>
                <span style="width: 14px; height: 14px; border-radius: 50%; background: #0f172a;"></span>
              </div>
            </label>
          </div>
        </div>

        <!-- 2. System Preferences Card -->
        <div class="card">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">Preferências Operacionais</h2>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-4);">
            Ajuste o comportamento das consultas e alertas do FiscalFlow.
          </p>

          <form id="form-preferences" style="display: flex; flex-direction: column; gap: var(--space-4);">
            <!-- Page Size -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-primary);">
              <div>
                <label for="pref-page-size" style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">Quantidade de Documentos por Página</label>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Quantidade padrão de registros carregados em cada página nas tabelas de consulta.</div>
              </div>
              <select class="input" id="pref-page-size" style="width: 120px;">
                <option value="10" ${s.pageSize===10?"selected":""}>10 itens</option>
                <option value="20" ${s.pageSize===20?"selected":""}>20 itens</option>
                <option value="50" ${s.pageSize===50?"selected":""}>50 itens</option>
                <option value="100" ${s.pageSize===100?"selected":""}>100 itens</option>
              </select>
            </div>

            <!-- Notify Cancelled -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-primary);">
              <div>
                <label for="pref-notify-cancelled" style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">Alertar Documentos Cancelados / Denegados</label>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Destacar avisos visuais ao abrir ou importar documentos com status fiscal irregular.</div>
              </div>
              <input type="checkbox" id="pref-notify-cancelled" ${s.notifyCancelled?"checked":""} style="width: 18px; height: 18px; accent-color: var(--accent-primary); cursor: pointer;" />
            </div>

            <!-- Backup Reminder -->
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <label for="pref-backup-reminder" style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">Lembrete Periódico de Backup</label>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Notificar preventivamente a necessidade de exportar cópia de segurança dos dados locais.</div>
              </div>
              <input type="checkbox" id="pref-backup-reminder" ${s.backupReminder?"checked":""} style="width: 18px; height: 18px; accent-color: var(--accent-primary); cursor: pointer;" />
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: var(--space-2);">
              <button class="btn btn--primary" type="submit" id="btn-save-preferences">
                Salvar Preferências
              </button>
            </div>
          </form>
        </div>

        <!-- 3. Backup and Restore Card -->
        <div class="card">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">Cópia de Segurança e Restauração</h2>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-4);">
            Garanta a segurança patrimonial e contábil exportando o banco de dados completo ou restaurando arquivos salvos anteriormente.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <!-- Export Backup -->
            <div style="background-color: var(--bg-tertiary); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--border-primary); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <h3 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary);">Exportar Backup Completo</h3>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: var(--space-4);">
                  Gera um arquivo seguro (<code class="text-mono">.json</code>) contendo todas as empresas, documentos fiscais originais, itens, arquivos SPED e configurações.
                </p>
              </div>
              <button class="btn btn--secondary" type="button" id="btn-export-backup" style="width: 100%;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Gerar Backup (.json)
              </button>
            </div>

            <!-- Import Backup -->
            <div style="background-color: var(--bg-tertiary); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--border-primary); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <h3 style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary);">Restaurar de Backup</h3>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: var(--space-4);">
                  Restaura o estado do sistema a partir de um backup prévio. Os dados atuais serão integralmente substituídos após confirmação.
                </p>
              </div>
              <div>
                <input type="file" id="file-restore-backup" accept=".json" style="display: none;" />
                <button class="btn btn--secondary" type="button" id="btn-trigger-restore" style="width: 100%;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Carregar Arquivo de Backup
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Database Health and Maintenance Card -->
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
            <div>
              <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">Saúde e Armazenamento do Banco de Dados</h2>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">Métricas em tempo real do banco SQLite local e ferramentas de manutenção.</p>
            </div>
            <span class="badge badge--success" style="font-size: 0.75rem;">SQLite WAL Conectado</span>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-5);">
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);" id="stat-companies">${a.companies}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Empresas</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-primary); font-family: var(--font-mono);" id="stat-docs">${a.fiscalDocuments}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Documentos</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);" id="stat-items">${a.documentItems}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Itens Fiscais</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: #a855f7; font-family: var(--font-mono);" id="stat-sped">${a.spedFiles}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Arquivos SPED</div>
            </div>
            <div style="background-color: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-primary); text-align: center;">
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-secondary); font-family: var(--font-mono);" id="stat-imports">${a.importRecords}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Lotes Importados</div>
            </div>
          </div>

          <!-- Maintenance Actions -->
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border-primary);">
            <button class="btn btn--secondary" type="button" id="btn-vacuum-db" title="Reorganizar índices e recuperar espaço em disco não utilizado">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Otimizar Banco de Dados (VACUUM)
            </button>

            <button class="btn btn--danger btn--sm" type="button" id="btn-reset-db">
              Limpar Todos os Dados...
            </button>
          </div>
        </div>

        <!-- 5. App Info and Shortcuts Card -->
        <div class="card">
          <h2 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-4);">Sobre o FiscalFlow</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); font-size: 0.8125rem; margin-bottom: var(--space-4);">
            <div>
              <span style="color: var(--text-muted);">Aplicação:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">FiscalFlow Desktop</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Desenvolvedora:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">Xtreme Sistemas</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Versão:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">1.0.0 (Release Candidate)</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Mecanismo:</span>
              <strong style="color: var(--text-primary); margin-left: var(--space-2);">Tauri 2 + SQLite Nativo</strong>
            </div>
          </div>

          <h3 style="font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: var(--space-2);">Atalhos de Produtividade</h3>
          <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: 0.8125rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-primary);">
              <span style="color: var(--text-secondary);">Alternar Tema Claro / Escuro</span>
              <kbd style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary); font-family: var(--font-mono); font-size: 0.75rem;">Alt + T</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0;">
              <span style="color: var(--text-secondary);">Fechar modais e painéis de detalhes</span>
              <kbd style="background: var(--bg-tertiary); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary); font-family: var(--font-mono); font-size: 0.75rem;">Esc</kbd>
            </div>
          </div>
        </div>

      </div>
    `,l()}function l(){const s=e.querySelector("#radio-theme-dark"),a=e.querySelector("#radio-theme-light");s?.addEventListener("change",async()=>{s.checked&&(await Et.savePreferences({theme:"dark"}),tt.info("Tema escuro ativado"),i())}),a?.addEventListener("change",async()=>{a.checked&&(await Et.savePreferences({theme:"light"}),tt.info("Tema claro ativado"),i())}),e.querySelector("#form-preferences")?.addEventListener("submit",async w=>{w.preventDefault();const b=parseInt(e.querySelector("#pref-page-size")?.value,10)||20,p=e.querySelector("#pref-notify-cancelled")?.checked??!0,m=e.querySelector("#pref-backup-reminder")?.checked??!1;try{await Et.savePreferences({pageSize:b,notifyCancelled:p,backupReminder:m}),tt.success("Preferências operacionais salvas com sucesso!")}catch(h){console.error("Erro ao salvar preferências:",h),tt.error("Erro ao salvar preferências.")}});const o=e.querySelector("#btn-export-backup");o?.addEventListener("click",async()=>{try{o&&(o.disabled=!0,o.innerHTML=`
            <div class="spinner spinner--sm" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></div>
            Gerando backup...
          `),await Et.exportBackup()&&tt.success("Cópia de segurança exportada com sucesso!")}catch(w){console.error("Erro ao exportar backup:",w),tt.error("Falha ao exportar backup.")}finally{o&&(o.disabled=!1,o.innerHTML=`
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Gerar Backup (.json)
          `)}});const n=e.querySelector("#btn-trigger-restore"),u=e.querySelector("#file-restore-backup");n?.addEventListener("click",()=>{u?.click()}),u?.addEventListener("change",async()=>{const w=u.files?.[0];if(!w)return;const b=new FileReader;b.onload=()=>{const p=b.result;Nt({title:"Confirmar Restauração de Backup",maxWidth:"520px",content:`
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <div style="display: flex; align-items: flex-start; gap: var(--space-3); background: rgba(245, 158, 11, 0.1); border: 1px solid var(--accent-warning); padding: var(--space-3); border-radius: var(--radius-md);">
                <span style="font-size: 1.25rem;">⚠️</span>
                <div style="font-size: 0.8125rem; color: var(--text-primary);">
                  <strong>Atenção: Ação Destrutiva</strong><br>
                  A restauração substituirá todos os registros atuais (empresas, documentos fiscais, itens e SPED) pelos dados contidos no arquivo selecionado: <strong style="color: var(--accent-primary);">${w.name}</strong>.
                </div>
              </div>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">
                Deseja realmente prosseguir com a restauração?
              </p>
            </div>
          `,buttons:[{text:"Cancelar",variant:"secondary",onClick:m=>m.close()},{text:"Sim, Restaurar Dados",variant:"danger",onClick:async m=>{try{const h=await Et.importBackup(p);m.close(),tt.success(`Backup restaurado! ${h.stats.companies} empresa(s) e ${h.stats.fiscalDocuments} documento(s) carregados.`),i()}catch(h){console.error("Falha na restauração:",h),tt.error(h instanceof Error?h.message:"Erro ao restaurar backup.")}}}]}),u.value=""},b.readAsText(w)});const v=e.querySelector("#btn-vacuum-db");v?.addEventListener("click",async()=>{try{v&&(v.disabled=!0,v.innerHTML=`
            <div class="spinner spinner--sm" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></div>
            Otimizando...
          `),await Et.optimizeDatabase(),tt.success("Banco de dados SQLite otimizado e reindexado com sucesso!"),i()}catch(w){console.error("Erro ao otimizar banco de dados:",w),tt.error("Erro ao otimizar banco de dados.")}finally{v&&(v.disabled=!1)}}),e.querySelector("#btn-reset-db")?.addEventListener("click",()=>{Nt({title:"Limpar Todos os Dados do Sistema",maxWidth:"520px",content:`
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            <div style="display: flex; align-items: flex-start; gap: var(--space-3); background: rgba(239, 68, 68, 0.1); border: 1px solid var(--accent-danger); padding: var(--space-3); border-radius: var(--radius-md);">
              <span style="font-size: 1.25rem;">🛑</span>
              <div style="font-size: 0.8125rem; color: var(--text-primary);">
                <strong>Aviso de Segurança Crítico</strong><br>
                Esta operação apagará definitivamente todas as empresas, documentos fiscais, itens, arquivos SPED e relatórios de importação.
              </div>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary);">
              Para confirmar a limpeza completa do banco de dados, digite <strong style="color: var(--accent-danger);">CONFIRMAR</strong> abaixo:
            </p>
            <input type="text" class="input" id="input-confirm-reset" placeholder="Digite CONFIRMAR" />
          </div>
        `,buttons:[{text:"Cancelar",variant:"secondary",onClick:w=>w.close()},{text:"Apagar Tudo Definitivamente",variant:"danger",onClick:async w=>{if(w.modal.querySelector("#input-confirm-reset")?.value.trim()!=="CONFIRMAR"){tt.warning("Você precisa digitar exatamente CONFIRMAR para prosseguir.");return}try{await Et.resetDatabase(),w.close(),tt.success("Todos os dados foram excluídos. O banco foi redefinido."),i()}catch(b){console.error("Erro ao resetar banco de dados:",b),tt.error("Erro ao limpar banco de dados.")}}}]})})}i()}var ne="1.0.0";async function ta(){const t=document.getElementById("app");if(!t){console.error("FiscalFlow: #app element not found");return}ea(t);try{await ye(),console.info("FiscalFlow: SQLite database connected and migrated");try{const{seedDemoDataIfEmpty:i}=await It(async()=>{const{seedDemoDataIfEmpty:l}=await import("./demo-data-XYWOSBHV.js");return{seedDemoDataIfEmpty:l}},[],import.meta.url);await i()}catch{}}catch(i){console.warn("FiscalFlow: Database initialization notice:",i)}aa(),ia(),ra();const e=async i=>{if(oa(i),i)try{const l=await new Ft().getSummaryByCompany(i.id);Wt(i.razaoSocial,l.totalDocs)}catch{Wt(i.razaoSocial)}else Wt("Nenhuma empresa selecionada",0)};ct.onActiveCompanyChange(i=>{e(i)});try{e(await ct.getActiveCompany())}catch{}Zt.init("/dashboard"),console.info(`FiscalFlow v${ne} initialized`)}function ea(t){t.innerHTML=`
    <div class="app-body">
      <!-- Sidebar -->
      <aside class="app-sidebar" id="app-sidebar">
        <div class="app-sidebar__brand">
          <svg style="width: 24px; height: 24px; color: var(--accent-primary); flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <div>
            <div class="app-sidebar__brand-name">FiscalFlow</div>
            <div class="app-sidebar__brand-sub">Xtreme Sistemas</div>
          </div>
        </div>

        <nav class="app-sidebar__nav" id="sidebar-nav">
          <div class="app-sidebar__section-title">Principal</div>
          <a href="#/dashboard" class="app-sidebar__link" data-route="/dashboard" id="nav-dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span>Dashboard</span>
          </a>
          <a href="#/documents" class="app-sidebar__link" data-route="/documents" id="nav-documents">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Documentos</span>
          </a>
          <a href="#/companies" class="app-sidebar__link" data-route="/companies" id="nav-companies">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Empresas</span>
          </a>

          <div class="app-sidebar__section-title">Operações</div>
          <a href="#/import" class="app-sidebar__link" data-route="/import" id="nav-import">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Importar</span>
          </a>
          <a href="#/sped" class="app-sidebar__link" data-route="/sped" id="nav-sped">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            <span>SPED Fiscal</span>
          </a>
          <a href="#/export" class="app-sidebar__link" data-route="/export" id="nav-export">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Exportar</span>
          </a>

          <div class="app-sidebar__section-title">Sistema</div>
          <a href="#/settings" class="app-sidebar__link" data-route="/settings" id="nav-settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Configurações</span>
          </a>
        </nav>
      </aside>

      <!-- Main Wrapper: Header + Dynamic Page Content -->
      <div class="app-main-wrapper">
        <header class="app-header">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span class="app-header__title" id="header-page-title">Dashboard</span>
            <a href="#/companies" class="badge" id="header-active-company" style="background: rgba(99, 102, 241, 0.12); color: var(--accent-primary); text-decoration: none; cursor: pointer; text-transform: none; font-weight: 500; font-size: 0.75rem; padding: 3px 10px; border-radius: 9999px;" title="Clique para gerenciar empresas">
              + Selecionar Empresa
            </a>
          </div>

          <div class="app-header__actions">
            <!-- Theme Toggle Button -->
            <button class="btn btn--secondary btn--sm" id="btn-theme-toggle" title="Alternar tema claro/escuro (Alt + T)">
              <span id="theme-toggle-icon">🌙</span>
              <span id="theme-toggle-text" style="font-size: 0.75rem;">Tema</span>
            </button>
          </div>
        </header>

        <!-- Dynamic Content Mount -->
        <main class="app-content" id="main-content">
          <!-- Rendered by Router -->
        </main>
      </div>
    </div>

    <!-- Status Bar -->
    <footer class="app-statusbar">
      <div class="app-statusbar__left">
        <span class="status-indicator status-indicator--online" id="status-dot"></span>
        <span id="status-company">Nenhuma empresa selecionada</span>
      </div>
      <div class="app-statusbar__right">
        <span id="status-docs">0 documentos</span>
        <span>v${ne}</span>
      </div>
    </footer>

    <!-- Toast Notification Container -->
    <div class="toast-container" id="toast-container"></div>
  `}function aa(){Zt.register("/dashboard","dashboard","Dashboard",Re).register("/documents","documents","Documentos Fiscais",Le).register("/companies","companies","Empresas Cadastradas",Oe).register("/import","import","Importar Documentos",We).register("/sped","sped","SPED Fiscal",Ze).register("/export","export","Exportação Fiscal",Ge).register("/settings","settings","Configurações",Qe),Zt.onAfterNavigate(t=>{const e=document.getElementById("sidebar-nav");e&&e.querySelectorAll(".app-sidebar__link").forEach(l=>{const s=l.getAttribute("data-route");s&&t.path.startsWith(s)?l.classList.add("app-sidebar__link--active"):l.classList.remove("app-sidebar__link--active")});const i=document.getElementById("header-page-title");i&&(i.textContent=t.title)})}function ia(){const t=document.getElementById("btn-theme-toggle"),e=document.getElementById("theme-toggle-icon"),i=document.getElementById("theme-toggle-text"),l=()=>{const s=Tt.getTheme();e&&(e.textContent=s==="dark"?"🌙":"☀️"),i&&(i.textContent=s==="dark"?"Escuro":"Claro")};l(),t?.addEventListener("click",()=>{Tt.toggleTheme(),l()}),Tt.onChange(()=>{l()})}function ra(){document.addEventListener("keydown",t=>{t.altKey&&(t.key==="t"||t.key==="T")&&(t.preventDefault(),Tt.toggleTheme())})}function Wt(t,e){const i=document.getElementById("status-company");i&&(i.textContent=t||"Nenhuma empresa selecionada");const l=document.getElementById("status-docs");l&&(l.textContent=`${e??0} documentos`)}function oa(t){const e=document.getElementById("header-active-company");e&&(t?(e.textContent=`🏢 ${t.razaoSocial}`,e.setAttribute("title",`Empresa ativa: ${t.razaoSocial} (${t.cnpj}) - Clique para trocar`)):(e.textContent="+ Selecionar Empresa",e.setAttribute("title","Nenhuma empresa selecionada - Clique para gerenciar")))}document.addEventListener("DOMContentLoaded",()=>{ta().catch(console.error)});export{ct as n,Xe as t};
