import { describe, it, expect } from 'vitest';

describe('FiscalFlow Foundation', () => {
  it('should confirm the test framework is working', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have correct app version format', () => {
    const version = '0.1.0';
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
