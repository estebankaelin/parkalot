import { distanceMeters } from '@/domain/geo';
import type { Coordinates, IsoDay, ParkingSpot } from '@/domain/types';

export type SpotResult = {
  spot: ParkingSpot;
  distanceMeters: number;
};

/** Plätze, die an allen gewählten Tagen frei sind, nächstgelegene zuerst. */
export function searchSpots(
  spots: ParkingSpot[],
  destination: Coordinates,
  days: IsoDay[],
): SpotResult[] {
  return spots
    .filter((spot) => days.every((day) => spot.availableDays.includes(day)))
    .map((spot) => ({ spot, distanceMeters: distanceMeters(spot.coordinates, destination) }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
