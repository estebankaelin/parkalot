import type { Coordinates } from '@/domain/types';

const EARTH_RADIUS_METERS = 6_371_000;
/** Gemütliches Gehtempo, etwa 4.8 km/h. */
const WALKING_METERS_PER_MINUTE = 80;

export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / WALKING_METERS_PER_MINUTE));
}
