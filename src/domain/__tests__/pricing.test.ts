import { describe, expect, it } from '@jest/globals';

import { formatChf, PLATFORM_FEE_RATE, quoteForDays } from '@/domain/pricing';

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

describe('Gebühr in der Datenbank', () => {
  it('stimmt mit PLATFORM_FEE_RATE überein', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    const migration = fs.readFileSync(
      `${__dirname}/../../../supabase/migrations/20261017120000_pilot_schema.sql`,
      'utf8',
    );
    expect(migration).toContain(`round(subtotal * ${PLATFORM_FEE_RATE})`);
  });
});
