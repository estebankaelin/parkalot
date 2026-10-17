import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { PriceSummary } from '@/components/price-summary';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { shortDayLabel } from '@/domain/days';
import type { Coordinates } from '@/domain/types';
import { useBookings } from '@/state/bookings';
import { useSpot } from '@/state/use-spot';

function directionsUrl({ latitude, longitude }: Coordinates) {
  const destination = `${latitude},${longitude}`;
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings } = useBookings();
  const booking = bookings.find((b) => b.id === id);
  const spot = useSpot(booking?.spotId);

  if (!booking || !spot) {
    return (
      <Screen>
        <ThemedText>Buchung nicht gefunden.</ThemedText>
        <PrimaryButton title="Zur Suche" onPress={() => router.dismissTo('/')} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            title="Route zum Parkplatz"
            onPress={() => Linking.openURL(directionsUrl(spot.coordinates))}
          />
          <PrimaryButton title="Fertig" onPress={() => router.dismissTo('/')} />
        </View>
      }>
      <View style={styles.section}>
        <ThemedText type="subtitle">Dein Platz ist gebucht</ThemedText>
        <ThemedText themeColor="textSecondary">
          {spot.title}, {booking.days.map(shortDayLabel).join(', ')} für {booking.licensePlate}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.box}>
        <ThemedText type="smallBold">So kommst du rein</ThemedText>
        <ThemedText>{spot.accessInstructions}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {spot.address}
        </ThemedText>
      </ThemedView>

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
