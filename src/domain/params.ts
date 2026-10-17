import type { IsoDay } from '@/domain/types';

/** Liest die Tage aus dem Routen-Parameter "2026-11-27,2026-11-28". */
export function parseDaysParam(value: string | string[] | undefined): IsoDay[] {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  return raw
    .split(',')
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))
    .sort();
}
