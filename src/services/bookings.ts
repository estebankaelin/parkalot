import { SAMPLE_ACCESS_INSTRUCTIONS } from '@/data/sample-spots';
import { quoteForDays } from '@/domain/pricing';
import type { Booking, IsoDay, ParkingSpot } from '@/domain/types';
import { ensureSession, supabase } from '@/lib/supabase';
import { payWithPaymentSheet } from '@/services/payment-sheet';

export type BookingRequest = {
  spot: ParkingSpot;
  days: IsoDay[];
  licensePlate: string;
};

export type BookingResult =
  | { status: 'booked'; bookingId: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export type BookingService = {
  /** Reserviert die Tage, lässt bezahlen und gibt die Buchungs-ID zurück. */
  book(request: BookingRequest): Promise<BookingResult>;
  getBooking(id: string): Promise<Booking | undefined>;
  /** Nur für bestätigte, eigene Buchungen. */
  getAccessInstructions(bookingId: string): Promise<string | undefined>;
  /** Wird im UI angezeigt, solange keine echte Zahlung angebunden ist. */
  isTestMode: boolean;
};

/** Ohne Backend: Buchungen im Speicher, keine Belastung. */
function localBookingService(): BookingService {
  const bookings = new Map<string, Booking>();
  return {
    isTestMode: true,
    async book({ spot, days, licensePlate }) {
      const id = `test_${Date.now().toString(36)}`;
      bookings.set(id, {
        id,
        spotId: spot.id,
        days,
        licensePlate,
        quote: quoteForDays(spot.pricePerDayRappen, days.length),
        status: 'bestaetigt',
        createdAt: new Date().toISOString(),
      });
      return { status: 'booked', bookingId: id };
    },
    async getBooking(id) {
      return bookings.get(id);
    },
    async getAccessInstructions(bookingId) {
      const booking = bookings.get(bookingId);
      return booking && SAMPLE_ACCESS_INSTRUCTIONS[booking.spotId];
    },
  };
}

type BookingRow = {
  id: string;
  spot_id: string;
  days: string[];
  license_plate: string;
  subtotal_rappen: number;
  fee_rappen: number;
  total_rappen: number;
  status: Booking['status'];
  created_at: string;
};

const BOOKING_COLUMNS =
  'id, spot_id, days, license_plate, subtotal_rappen, fee_rappen, total_rappen, status, created_at';

/** Liest die Fehlermeldung aus der Antwort der Edge Function. */
async function functionErrorMessage(error: unknown): Promise<string | undefined> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.json !== 'function') return undefined;
  const body = await context.json().catch(() => undefined);
  return typeof body?.error === 'string' ? body.error : undefined;
}

function supabaseBookingService(client: NonNullable<typeof supabase>): BookingService {
  return {
    isTestMode: false,
    async book({ spot, days, licensePlate }) {
      try {
        await ensureSession(client);
      } catch (err) {
        console.error(err);
        return { status: 'error', message: 'Anmeldung fehlgeschlagen. Bitte versuch es nochmals.' };
      }

      const { data, error } = await client.functions.invoke<{
        bookingId: string;
        clientSecret: string;
      }>('create-booking', { body: { spotId: spot.id, days, licensePlate } });
      if (error || !data) {
        return {
          status: 'error',
          message:
            (await functionErrorMessage(error)) ??
            'Die Buchung hat nicht geklappt. Bitte versuch es nochmals.',
        };
      }

      const payment = await payWithPaymentSheet(data.clientSecret, data.bookingId);
      if (payment.status === 'paid') return { status: 'booked', bookingId: data.bookingId };
      // Eine unbezahlte Reservation verfällt nach 30 Minuten von selbst.
      return payment;
    },
    async getBooking(id) {
      const { data, error } = await client
        .from('bookings')
        .select(BOOKING_COLUMNS)
        .eq('id', id)
        .returns<BookingRow[]>()
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      return {
        id: data.id,
        spotId: data.spot_id,
        days: data.days,
        licensePlate: data.license_plate,
        quote: {
          days: data.days.length,
          subtotalRappen: data.subtotal_rappen,
          feeRappen: data.fee_rappen,
          totalRappen: data.total_rappen,
        },
        status: data.status,
        createdAt: data.created_at,
      };
    },
    async getAccessInstructions(bookingId) {
      const { data, error } = await client.rpc('booking_access_instructions', {
        p_booking_id: bookingId,
      });
      if (error) throw error;
      return typeof data === 'string' ? data : undefined;
    },
  };
}

export const bookingService: BookingService = supabase
  ? supabaseBookingService(supabase)
  : localBookingService();
