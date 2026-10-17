import { SAMPLE_SPOTS } from '@/data/sample-spots';
import type { ParkingSpot } from '@/domain/types';
import { supabase } from '@/lib/supabase';

/** Schnittstelle zur Datenquelle der Parkplätze. */
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

type SpotRow = {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type: ParkingSpot['type'];
  covered: boolean;
  ev_charging: boolean;
  max_vehicle_size: ParkingSpot['maxVehicleSize'];
  price_per_day_rappen: number;
  description: string;
  host_first_name: string;
};

const SPOT_COLUMNS =
  'id, title, address, latitude, longitude, type, covered, ev_charging, max_vehicle_size, ' +
  'price_per_day_rappen, description, host_first_name';

function toSpot(row: SpotRow, freeDays: string[]): ParkingSpot {
  return {
    id: row.id,
    title: row.title,
    address: row.address,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    type: row.type,
    covered: row.covered,
    evCharging: row.ev_charging,
    maxVehicleSize: row.max_vehicle_size,
    pricePerDayRappen: row.price_per_day_rappen,
    availableDays: [...freeDays].sort(),
    description: row.description,
    hostFirstName: row.host_first_name,
  };
}

function supabaseSpotsRepository(client: NonNullable<typeof supabase>): SpotsRepository {
  async function load(id?: string) {
    let spotsQuery = client.from('spots').select(SPOT_COLUMNS);
    let daysQuery = client.from('spot_free_days').select('spot_id, day');
    if (id) {
      spotsQuery = spotsQuery.eq('id', id);
      daysQuery = daysQuery.eq('spot_id', id);
    }
    const [spots, days] = await Promise.all([
      spotsQuery.returns<SpotRow[]>(),
      daysQuery.returns<{ spot_id: string; day: string }[]>(),
    ]);
    if (spots.error) throw spots.error;
    if (days.error) throw days.error;
    return spots.data.map((row) =>
      toSpot(
        row,
        days.data.filter((d) => d.spot_id === row.id).map((d) => d.day),
      ),
    );
  }

  return {
    listSpots: () => load(),
    async getSpot(id) {
      const [spot] = await load(id);
      return spot;
    },
  };
}

export const spotsRepository: SpotsRepository = supabase
  ? supabaseSpotsRepository(supabase)
  : sampleSpotsRepository;
