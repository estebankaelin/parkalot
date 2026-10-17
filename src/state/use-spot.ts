import { useEffect, useState } from 'react';

import { sampleSpotsRepository } from '@/data/spots-repository';
import type { ParkingSpot } from '@/domain/types';

export function useSpots() {
  const [spots, setSpots] = useState<ParkingSpot[] | null>(null);
  useEffect(() => {
    sampleSpotsRepository.listSpots().then(setSpots);
  }, []);
  return spots;
}

export function useSpot(id: string | undefined) {
  const [spot, setSpot] = useState<ParkingSpot | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    sampleSpotsRepository.getSpot(id).then((found) => setSpot(found ?? null));
  }, [id]);
  return spot;
}
