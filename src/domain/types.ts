export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type SpotType = 'garage' | 'tiefgarage' | 'carport' | 'aussen';

export type VehicleSize = 'klein' | 'mittel' | 'gross';

/** Ein Tag im Format YYYY-MM-DD (Ortszeit Schweiz). */
export type IsoDay = string;

export type ParkingSpot = {
  id: string;
  title: string;
  address: string;
  coordinates: Coordinates;
  type: SpotType;
  covered: boolean;
  evCharging: boolean;
  maxVehicleSize: VehicleSize;
  /** Tagespreis in Rappen, den die Anbieterin festlegt. */
  pricePerDayRappen: number;
  availableDays: IsoDay[];
  description: string;
  /** Wird erst nach bezahlter Buchung angezeigt. */
  accessInstructions: string;
  hostFirstName: string;
};

export type PriceQuote = {
  days: number;
  /** Betrag, den die Anbieterin erhält. */
  subtotalRappen: number;
  /** Plattformgebühr, zahlt der Mieter zusätzlich. */
  feeRappen: number;
  totalRappen: number;
};

export type BookingStatus = 'bestaetigt' | 'storniert';

export type Booking = {
  id: string;
  spotId: string;
  days: IsoDay[];
  licensePlate: string;
  quote: PriceQuote;
  status: BookingStatus;
  createdAt: string;
};
