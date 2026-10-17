import { describe, expect, it } from '@jest/globals';

import { PILOT_DAYS, PILOT_EVENT } from '@/config/pilot';
import { SAMPLE_SPOTS } from '@/data/sample-spots';
import { daysBetween, shortDayLabel } from '@/domain/days';
import { distanceMeters, walkingMinutes } from '@/domain/geo';
import { normalizeSwissPlate } from '@/domain/license-plate';
import { parseDaysParam } from '@/domain/params';
import { searchSpots } from '@/domain/search';

describe('Pilot-Tage', () => {
  it('umfasst den ganzen Markt vom 27.11. bis 6.12.2026', () => {
    expect(PILOT_DAYS).toHaveLength(10);
    expect(PILOT_DAYS[0]).toBe('2026-11-27');
    expect(PILOT_DAYS.at(-1)).toBe('2026-12-06');
  });

  it('zeigt Wochentag und Datum', () => {
    expect(shortDayLabel('2026-11-27')).toBe('Fr 27.11.');
  });

  it('funktioniert über den Monatswechsel', () => {
    expect(daysBetween('2026-11-30', '2026-12-01')).toEqual(['2026-11-30', '2026-12-01']);
  });
});

describe('searchSpots', () => {
  it('zeigt nur Plätze, die an allen gewählten Tagen frei sind', () => {
    const results = searchSpots(SAMPLE_SPOTS, PILOT_EVENT.destination, ['2026-11-27', '2026-11-28']);
    for (const { spot } of results) {
      expect(spot.availableDays).toEqual(expect.arrayContaining(['2026-11-27', '2026-11-28']));
    }
    expect(results.map((r) => r.spot.id)).not.toContain('beispiel-2');
  });

  it('sortiert nach Distanz zum Ziel', () => {
    const results = searchSpots(SAMPLE_SPOTS, PILOT_EVENT.destination, ['2026-11-28']);
    const distances = results.map((r) => r.distanceMeters);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });
});

describe('Distanz', () => {
  it('berechnet rund 111 m pro 0.001 Grad Breite', () => {
    const d = distanceMeters({ latitude: 47, longitude: 8 }, { latitude: 47.001, longitude: 8 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it('rechnet mindestens eine Minute Fussweg', () => {
    expect(walkingMinutes(10)).toBe(1);
    expect(walkingMinutes(400)).toBe(5);
  });
});

describe('Eingaben', () => {
  it('normalisiert Schweizer Kontrollschilder', () => {
    expect(normalizeSwissPlate('sz12345')).toBe('SZ 12345');
    expect(normalizeSwissPlate(' LU 1 ')).toBe('LU 1');
    expect(normalizeSwissPlate('12345')).toBeNull();
  });

  it('ignoriert ungültige Tage im Routen-Parameter', () => {
    expect(parseDaysParam('2026-11-28,kaputt,2026-11-27')).toEqual(['2026-11-27', '2026-11-28']);
  });
});
