import { createContext, useContext, useState, type ReactNode } from 'react';

import type { Booking } from '@/domain/types';

type BookingsContextValue = {
  bookings: Booking[];
  addBooking(booking: Booking): void;
};

const BookingsContext = createContext<BookingsContextValue | null>(null);

/** Hält Buchungen im Speicher, bis das Backend angebunden ist. */
export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const addBooking = (booking: Booking) => setBookings((current) => [booking, ...current]);
  return (
    <BookingsContext.Provider value={{ bookings, addBooking }}>{children}</BookingsContext.Provider>
  );
}

export function useBookings() {
  const value = useContext(BookingsContext);
  if (!value) {
    throw new Error('useBookings muss innerhalb von BookingsProvider verwendet werden');
  }
  return value;
}
