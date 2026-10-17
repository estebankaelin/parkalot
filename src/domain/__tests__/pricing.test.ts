import { describe, expect, it } from '@jest/globals';

import { formatChf, quoteForDays } from '@/domain/pricing';

describe('quoteForDays', () => {
  it('rechnet 15 % Servicegebühr auf den Mieterpreis', () => {
    expect(quoteForDays(2000, 3)).toEqual({
      days: 3,
      subtotalRappen: 6000,
      feeRappen: 900,
      totalRappen: 6900,
    });
  });

  it('rundet die Gebühr auf ganze Rappen', () => {
    expect(quoteForDays(1333, 1).feeRappen).toBe(200);
  });

  it('verlangt mindestens einen Tag', () => {
    expect(() => quoteForDays(2000, 0)).toThrow();
  });
});

describe('formatChf', () => {
  it('formatiert Rappen als Franken', () => {
    expect(formatChf(6900)).toBe('CHF 69.00');
    expect(formatChf(1505)).toBe('CHF 15.05');
  });
});
