/**
 * FiscalFlow — Cryptographic Utilities
 * 
 * Provides SHA-256 calculation for XML and SPED integrity verification and deduplication.
 */

/**
 * Compute SHA-256 hexadecimal hash of a string content
 */
export async function sha256(content: string): Promise<string> {
  // 1. Try Web Crypto API (supported in browser, Tauri, and modern Node)
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 2. Node.js fallback (for test environments)
  try {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(content, 'utf8').digest('hex');
  } catch {
    throw new Error('No cryptographic provider available to compute SHA-256 hash.');
  }
}
