import { daysBetween } from '@/domain/days';
import type { Coordinates } from '@/domain/types';

export const PILOT_EVENT = {
  name: 'Einsiedler Weihnachtsmarkt',
  // Daten laut myswitzerland.com, vor dem Launch mit dem OK Weihnachtsmarkt bestätigen.
  firstDay: '2026-11-27',
  lastDay: '2026-12-06',
  destinationLabel: 'Klosterplatz',
  // Ungefähre Lage des Klosterplatzes Einsiedeln.
  destination: { latitude: 47.1266, longitude: 8.7517 } satisfies Coordinates,
};

export const PILOT_DAYS = daysBetween(PILOT_EVENT.firstDay, PILOT_EVENT.lastDay);
