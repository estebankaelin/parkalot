import { useEffect, useState } from 'react';

import { spotsRepository } from '@/data/spots-repository';
import type { ParkingSpot } from '@/domain/types';

export const LOAD_ERROR = 'Die Parkplätze konnten nicht geladen werden. Prüfe deine Verbindung.';

/** null während des Ladens. */
export function useSpots() {
  const [spots, setSpots] = useState<ParkingSpot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    spotsRepository.listSpots().then(setSpots, (err) => {
      console.error(err);
      setError(LOAD_ERROR);
    });
  }, []);
  return { spots, error };
}

/** undefined während des Ladens, null wenn es den Platz nicht gibt. */
export function useSpot(id: string | undefined) {
  const [spot, setSpot] = useState<ParkingSpot | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    spotsRepository.getSpot(id).then(
      (found) => setSpot(found ?? null),
      (err) => {
        console.error(err);
        setSpot(null);
      },
    );
  }, [id]);
  return spot;
}
