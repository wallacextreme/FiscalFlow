import { describe, it, expect } from 'vitest';
import { sha256 } from '../../../src/utils/crypto.ts';

describe('Crypto SHA-256', () => {
  it('should compute exact SHA-256 hex string for empty string', async () => {
    const hash = await sha256('');
    // Standard empty string SHA-256
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should compute consistent hash for arbitrary XML content', async () => {
    const content = '<nfeProc versao="4.00"><NFe><infNFe Id="NFe123"/></NFe></nfeProc>';
    const hash1 = await sha256(content);
    const hash2 = await sha256(content);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different contents', async () => {
    const h1 = await sha256('Content A');
    const h2 = await sha256('Content B');
    expect(h1).not.toBe(h2);
  });
});
