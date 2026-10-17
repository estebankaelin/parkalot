import type { SpotType, VehicleSize } from '@/domain/types';

export const SPOT_TYPE_LABEL: Record<SpotType, string> = {
  garage: 'Garage',
  tiefgarage: 'Tiefgarage',
  carport: 'Carport',
  aussen: 'Aussenplatz',
};

export const VEHICLE_SIZE_LABEL: Record<VehicleSize, string> = {
  klein: 'Kleinwagen',
  mittel: 'bis Mittelklasse',
  gross: 'auch grosse Fahrzeuge',
};
