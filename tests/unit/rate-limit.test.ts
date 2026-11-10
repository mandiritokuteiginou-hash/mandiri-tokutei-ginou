import { beforeEach, describe, expect, it } from 'vitest';
import { _resetRateLimit, rateLimit } from '../../apps/web/lib/rate-limit';
import { safeNext } from '../../apps/web/lib/safe-redirect';

beforeEach(() => _resetRateLimit());

describe('rateLimit', () => {
  it('allows up to the limit then blocks, and resets after the window', () => {
    for (let i = 0; i < 3; i++) expect(rateLimit('k', 3, 1000, 0)).toBe(true);
    expect(rateLimit('k', 3, 1000, 10)).toBe(false);
    expect(rateLimit('k', 3, 1000, 1001)).toBe(true);
  });
  it('isolates keys', () => {
    expect(rateLimit('a', 1, 1000, 0)).toBe(true);
    expect(rateLimit('b', 1, 1000, 0)).toBe(true);
  });
});

describe('safeNext (open-redirect guard)', () => {
  it('accepts relative paths only', () => {
    expect(safeNext('/admin')).toBe('/admin');
    for (const bad of [
      '//evil.com',
      'https://evil.com',
      '/\\evil.com',
      'javascript:alert(1)',
      undefined,
      42,
    ]) {
      expect(safeNext(bad)).toBe('/');
    }
  });
});
