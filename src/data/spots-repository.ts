import { SAMPLE_SPOTS } from '@/data/sample-spots';
import type { ParkingSpot } from '@/domain/types';

/** Schnittstelle zur Datenquelle. Später durch das Backend ersetzt. */
export type SpotsRepository = {
  listSpots(): Promise<ParkingSpot[]>;
  getSpot(id: string): Promise<ParkingSpot | undefined>;
};

export const sampleSpotsRepository: SpotsRepository = {
  async listSpots() {
    return SAMPLE_SPOTS;
  },
  async getSpot(id) {
    return SAMPLE_SPOTS.find((spot) => spot.id === id);
  },
};
