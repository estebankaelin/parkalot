import { PILOT_DAYS } from '@/config/pilot';
import type { ParkingSpot } from '@/domain/types';

/**
 * Beispieldaten für die Entwicklung. Keine echten Anbieter oder Adressen.
 * Für den Pilot werden die Plätze im Backoffice erfasst.
 */
export const SAMPLE_SPOTS: ParkingSpot[] = [
  {
    id: 'beispiel-1',
    title: 'Garagenplatz nahe Hauptstrasse',
    address: 'Beispieladresse 1, 8840 Einsiedeln',
    coordinates: { latitude: 47.1281, longitude: 8.7488 },
    type: 'garage',
    covered: true,
    evCharging: false,
    maxVehicleSize: 'mittel',
    pricePerDayRappen: 2000,
    availableDays: PILOT_DAYS,
    description: 'Einzelgarage im Hinterhof, ruhige Zufahrt.',
    hostFirstName: 'Sandra',
  },
  {
    id: 'beispiel-2',
    title: 'Aussenplatz beim Mehrfamilienhaus',
    address: 'Beispieladresse 2, 8840 Einsiedeln',
    coordinates: { latitude: 47.1245, longitude: 8.7551 },
    type: 'aussen',
    covered: false,
    evCharging: false,
    maxVehicleSize: 'gross',
    pricePerDayRappen: 1500,
    availableDays: PILOT_DAYS.filter((_, i) => i % 2 === 0),
    description: 'Markierter Platz Nr. 7, auch für Kleinbusse.',
    hostFirstName: 'Marco',
  },
  {
    id: 'beispiel-3',
    title: 'Tiefgaragenplatz mit Ladestation',
    address: 'Beispieladresse 3, 8840 Einsiedeln',
    coordinates: { latitude: 47.1302, longitude: 8.7442 },
    type: 'tiefgarage',
    covered: true,
    evCharging: true,
    maxVehicleSize: 'mittel',
    pricePerDayRappen: 2800,
    availableDays: PILOT_DAYS,
    description: 'Tiefgarage mit Wallbox, Strom inklusive.',
    hostFirstName: 'Nadia',
  },
  {
    id: 'beispiel-4',
    title: 'Firmenparkplatz am Wochenende',
    address: 'Beispieladresse 4, 8840 Einsiedeln',
    coordinates: { latitude: 47.1229, longitude: 8.7597 },
    type: 'aussen',
    covered: false,
    evCharging: false,
    maxVehicleSize: 'gross',
    pricePerDayRappen: 1200,
    availableDays: PILOT_DAYS.filter((day) => {
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      return weekday === 0 || weekday === 6;
    }),
    description: 'Firmenareal, an Samstagen und Sonntagen frei.',
    hostFirstName: 'Beispiel AG',
  },
];

/** Zugangsinfo, die erst nach der Buchung angezeigt wird. */
export const SAMPLE_ACCESS_INSTRUCTIONS: Record<string, string> = {
  'beispiel-1': 'Garagentor Nr. 3, Code wird nach der Buchung per SMS gesendet.',
  'beispiel-2': 'Platz Nr. 7 links neben dem Eingang.',
  'beispiel-3': 'Einfahrt über Rampe, Platz 14. Tor öffnet mit Code.',
  'beispiel-4': 'Plätze 20 bis 25, Schranke ist am Wochenende offen.',
};
