import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DayPicker } from '@/components/day-picker';
import { PriceSummary } from '@/components/price-summary';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PILOT_DAYS, PILOT_EVENT } from '@/config/pilot';
import { distanceMeters, walkingMinutes } from '@/domain/geo';
import { SPOT_TYPE_LABEL, VEHICLE_SIZE_LABEL } from '@/domain/labels';
import { parseDaysParam } from '@/domain/params';
import { formatChf, quoteForDays } from '@/domain/pricing';
import type { IsoDay } from '@/domain/types';
import { useSpot } from '@/state/use-spot';

export default function SpotScreen() {
  const params = useLocalSearchParams<{ id: string; days?: string }>();
  const spot = useSpot(params.id);
  const [days, setDays] = useState<IsoDay[]>(() => parseDaysParam(params.days));

  if (spot === undefined) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }
  if (spot === null) {
    return (
      <Screen>
        <ThemedText>Dieser Parkplatz existiert nicht mehr.</ThemedText>
      </Screen>
    );
  }

  const bookableDays = days.filter((day) => spot.availableDays.includes(day));
  const unavailable = PILOT_DAYS.filter((day) => !spot.availableDays.includes(day));
  const minutes = walkingMinutes(distanceMeters(spot.coordinates, PILOT_EVENT.destination));
  const details = [
    SPOT_TYPE_LABEL[spot.type],
    spot.covered ? 'gedeckt' : 'nicht gedeckt',
    spot.evCharging ? 'mit Ladestation' : null,
    VEHICLE_SIZE_LABEL[spot.maxVehicleSize],
  ].filter(Boolean);

  return (
    <Screen
      footer={
        <PrimaryButton
          title={bookableDays.length ? 'Weiter zur Buchung' : 'Tage wählen'}
          disabled={!bookableDays.length}
          onPress={() =>
            router.push({
              pathname: '/checkout/[id]',
              params: { id: spot.id, days: bookableDays.join(',') },
            })
          }
        />
      }>
      <View style={styles.section}>
        <ThemedText type="subtitle">{spot.title}</ThemedText>
        <ThemedText themeColor="textSecondary">{spot.address}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {minutes} Min. zu Fuss zum {PILOT_EVENT.destinationLabel}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.box}>
        <ThemedText>{spot.description}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {details.join(' · ')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Angeboten von {spot.hostFirstName}
        </ThemedText>
      </ThemedView>

      <View style={styles.section}>
        <ThemedText type="smallBold">
          Tage wählen ({formatChf(spot.pricePerDayRappen)} pro Tag)
        </ThemedText>
        <DayPicker
          days={PILOT_DAYS}
          selected={bookableDays}
          unavailable={unavailable}
          onChange={setDays}
        />
      </View>

      {bookableDays.length > 0 && (
        <ThemedView type="backgroundElement" style={styles.box}>
          <PriceSummary quote={quoteForDays(spot.pricePerDayRappen, bookableDays.length)} />
        </ThemedView>
      )}
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
});
