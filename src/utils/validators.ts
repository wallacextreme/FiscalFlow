/**
 * FiscalFlow — Validation and Formatting Utilities
 */

/**
 * Remove any non-digit character
 */
export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validates Brazilian CNPJ according to Receita Federal check digit algorithm
 */
export function isValidCnpj(cnpj: string): boolean {
  if (!cnpj) return false;

  const clean = cleanDigits(cnpj);

  // Must have exactly 14 digits
  if (clean.length !== 14) return false;

  // Reject all known invalid sequence with identical digits (00000000000000, 11111111111111, etc.)
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Validate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(clean[i], 10) * weights1[i];
  }
  const remainder1 = sum1 % 11;
  const digit1 = remainder1 < 2 ? 0 : 11 - remainder1;

  if (digit1 !== parseInt(clean[12], 10)) return false;

  // Validate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(clean[i], 10) * weights2[i];
  }
  const remainder2 = sum2 % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;

  return digit2 === parseInt(clean[13], 10);
}

/**
 * Format CNPJ as 00.000.000/0000-00
 */
export function formatCnpj(cnpj: string): string {
  const clean = cleanDigits(cnpj);
  if (clean.length !== 14) return cnpj;

  return clean.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Format CEP as 00000-000
 */
export function formatCep(cep: string): string {
  const clean = cleanDigits(cep);
  if (clean.length !== 8) return cep;

  return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Format Currency to BRL (R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Format ISO Date (YYYY-MM-DD or ISO 8601) to DD/MM/YYYY
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

/**
 * Format ISO Date and Time to DD/MM/YYYY HH:mm
 */
export function formatDateTime(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Validates Brazilian CPF according to Receita Federal check digit algorithm
 */
export function isValidCpf(cpf: string): boolean {
  if (!cpf) return false;

  const clean = cleanDigits(cpf);
  if (clean.length !== 11) return false;

  // Reject sequences of identical digits
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // First check digit
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(clean[i], 10) * (10 - i);
  }
  let rem1 = (sum1 * 10) % 11;
  if (rem1 === 10 || rem1 === 11) rem1 = 0;
  if (rem1 !== parseInt(clean[9], 10)) return false;

  // Second check digit
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(clean[i], 10) * (11 - i);
  }
  let rem2 = (sum2 * 10) % 11;
  if (rem2 === 10 || rem2 === 11) rem2 = 0;
  return rem2 === parseInt(clean[10], 10);
}

/**
 * Format CPF as 000.000.000-00
 */
export function formatCpf(cpf: string): string {
  const clean = cleanDigits(cpf);
  if (clean.length !== 11) return cpf;
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Format either CNPJ or CPF depending on clean length
 */
export function formatCnpjOrCpf(value: string): string {
  const clean = cleanDigits(value);
  if (clean.length === 14) return formatCnpj(clean);
  if (clean.length === 11) return formatCpf(clean);
  return value;
}

/**
 * Calculate Modulo 11 check digit for Brazilian fiscal access key (43 digits -> 1 digit DV)
 */
export function calculateChaveAcessoDV(chave43: string): number {
  const clean = cleanDigits(chave43);
  if (clean.length < 43) {
    throw new Error('Chave de acesso incompleta para cálculo de DV (esperado 43 dígitos).');
  }

  let sum = 0;
  let weight = 2;

  // Right to left from position 42 down to 0
  for (let i = 42; i >= 0; i--) {
    sum += parseInt(clean[i], 10) * weight;
    weight++;
    if (weight > 9) {
      weight = 2;
    }
  }

  const remainder = sum % 11;
  return (remainder === 0 || remainder === 1) ? 0 : 11 - remainder;
}

/**
 * Validate 44-digit Brazilian fiscal access key (NF-e, NFC-e, CT-e)
 */
export function isValidChaveAcesso(chave: string): boolean {
  if (!chave) return false;
  const clean = cleanDigits(chave);
  if (clean.length !== 44) return false;

  const expectedDV = parseInt(clean[43], 10);
  const calculatedDV = calculateChaveAcessoDV(clean.substring(0, 43));

  return expectedDV === calculatedDV;
}

export interface ChaveAcessoInfo {
  cUF: string;
  anoMes: string;
  cnpj: string;
  modelo: string;
  serie: string;
  numero: string;
  tipoEmissao: string;
  codigoNumerico: string;
  dv: string;
  isValida: boolean;
}

/**
 * Parse composition of a 44-digit access key
 */
export function parseChaveAcesso(chave: string): ChaveAcessoInfo | null {
  const clean = cleanDigits(chave);
  if (clean.length !== 44) return null;

  return {
    cUF: clean.substring(0, 2),
    anoMes: clean.substring(2, 6),
    cnpj: clean.substring(6, 20),
    modelo: clean.substring(20, 22),
    serie: clean.substring(22, 25),
    numero: clean.substring(25, 34),
    tipoEmissao: clean.substring(34, 35),
    codigoNumerico: clean.substring(35, 43),
    dv: clean.substring(43, 44),
    isValida: isValidChaveAcesso(clean)
  };
}

/**
 * Format 44-digit access key in groups of 4:
 * 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000
 */
export function formatChaveAcesso(chave: string): string {
  const clean = cleanDigits(chave);
  if (clean.length !== 44) return chave;
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}
