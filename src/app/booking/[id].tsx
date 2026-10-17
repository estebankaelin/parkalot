import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';

import { PriceSummary } from '@/components/price-summary';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { shortDayLabel } from '@/domain/days';
import type { Booking, Coordinates } from '@/domain/types';
import { bookingService } from '@/services/bookings';
import { useSpot } from '@/state/use-spot';

/** So lange warten wir auf die Bestätigung von Stripe, bevor wir aufgeben. */
const CONFIRMATION_POLL_MS = 2000;
const CONFIRMATION_POLL_ATTEMPTS = 15;

function directionsUrl({ latitude, longitude }: Coordinates) {
  const destination = `${latitude},${longitude}`;
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/** Lädt die Buchung und wartet, bis die Zahlung bestätigt ist. */
function useConfirmedBooking(id: string | undefined) {
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [accessInstructions, setAccessInstructions] = useState<string>();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async (attempt: number) => {
      try {
        const found = await bookingService.getBooking(id);
        if (cancelled) return;
        setBooking(found ?? null);
        if (found?.status === 'bestaetigt') {
          const access = await bookingService.getAccessInstructions(id);
          if (!cancelled) setAccessInstructions(access);
        } else if (found?.status === 'ausstehend' && attempt < CONFIRMATION_POLL_ATTEMPTS) {
          timer = setTimeout(() => load(attempt + 1), CONFIRMATION_POLL_MS);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setBooking(null);
      }
    };

    load(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  return { booking, accessInstructions };
}

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { booking, accessInstructions } = useConfirmedBooking(id);
  const spot = useSpot(booking?.spotId);

  if (booking === undefined || (booking && spot === undefined)) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!booking || !spot) {
    return (
      <Screen>
        <ThemedText>Buchung nicht gefunden.</ThemedText>
        <PrimaryButton title="Zur Suche" onPress={() => router.dismissTo('/')} />
      </Screen>
    );
  }

  const title =
    booking.status === 'bestaetigt'
      ? 'Dein Platz ist gebucht'
      : booking.status === 'ausstehend'
        ? 'Zahlung wird bestätigt …'
        : 'Buchung storniert';

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {booking.status === 'bestaetigt' && (
            <PrimaryButton
              title="Route zum Parkplatz"
              onPress={() => Linking.openURL(directionsUrl(spot.coordinates))}
            />
          )}
          <PrimaryButton title="Fertig" onPress={() => router.dismissTo('/')} />
        </View>
      }>
      <View style={styles.section}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {spot.title}, {booking.days.map(shortDayLabel).join(', ')} für {booking.licensePlate}
        </ThemedText>
      </View>

      {booking.status === 'bestaetigt' && (
        <ThemedView type="backgroundElement" style={styles.box}>
          <ThemedText type="smallBold">So kommst du rein</ThemedText>
          <ThemedText>{accessInstructions ?? 'Zugangsinfo wird geladen …'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {spot.address}
          </ThemedText>
        </ThemedView>
      )}

      {booking.status === 'ausstehend' && (
        <ThemedText themeColor="textSecondary">
          Das dauert meist nur wenige Sekunden. Falls es länger geht, schau später nochmals hier
          rein.
        </ThemedText>
      )}

      <ThemedView type="backgroundElement" style={styles.box}>
        <PriceSummary quote={booking.quote} />
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  box: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
  },
});
