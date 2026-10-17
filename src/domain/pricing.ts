import type { PriceQuote } from '@/domain/types';

/** 15 % pro Buchung, zahlt der Mieter (Entscheid vom 17.10.2026). */
export const PLATFORM_FEE_RATE = 0.15;

export function quoteForDays(pricePerDayRappen: number, days: number): PriceQuote {
  if (!Number.isInteger(pricePerDayRappen) || pricePerDayRappen < 0) {
    throw new Error('pricePerDayRappen muss eine positive ganze Zahl sein');
  }
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('Es muss mindestens ein Tag gebucht werden');
  }
  const subtotalRappen = pricePerDayRappen * days;
  const feeRappen = Math.round(subtotalRappen * PLATFORM_FEE_RATE);
  return { days, subtotalRappen, feeRappen, totalRappen: subtotalRappen + feeRappen };
}

export function formatChf(rappen: number): string {
  const francs = Math.floor(rappen / 100);
  const cents = String(rappen % 100).padStart(2, '0');
  return `CHF ${francs}.${cents}`;
}
