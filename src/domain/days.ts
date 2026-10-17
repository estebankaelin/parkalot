import type { IsoDay } from '@/domain/types';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function parse(day: IsoDay): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function format(date: Date): IsoDay {
  return date.toISOString().slice(0, 10);
}

/** Alle Tage von `from` bis und mit `to`. */
export function daysBetween(from: IsoDay, to: IsoDay): IsoDay[] {
  const result: IsoDay[] = [];
  for (let d = parse(from); d <= parse(to); d.setUTCDate(d.getUTCDate() + 1)) {
    result.push(format(d));
  }
  return result;
}

/** z.B. "Fr 27.11." */
export function shortDayLabel(day: IsoDay): string {
  const date = parse(day);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()}.${date.getUTCMonth() + 1}.`;
}
