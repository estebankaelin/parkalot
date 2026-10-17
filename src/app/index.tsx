import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DayPicker } from '@/components/day-picker';
import { Screen } from '@/components/screen';
import { SpotCard } from '@/components/spot-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { PILOT_DAYS, PILOT_EVENT } from '@/config/pilot';
import { searchSpots } from '@/domain/search';
import type { IsoDay } from '@/domain/types';
import { useSpots } from '@/state/use-spot';

export default function SearchScreen() {
  const { spots, error } = useSpots();
  const [days, setDays] = useState<IsoDay[]>([PILOT_DAYS[0]]);
  const results = spots ? searchSpots(spots, PILOT_EVENT.destination, days) : [];

  return (
    <Screen>
      <View style={styles.intro}>
        <ThemedText type="subtitle">{PILOT_EVENT.name}</ThemedText>
        <ThemedText themeColor="textSecondary">
          Privaten Parkplatz in Gehdistanz zum {PILOT_EVENT.destinationLabel} buchen und ohne
          Suchen direkt hinfahren.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">An welchen Tagen?</ThemedText>
        <DayPicker days={PILOT_DAYS} selected={days} onChange={setDays} />
      </View>

      {error ? (
        <ThemedText themeColor="textSecondary">{error}</ThemedText>
      ) : !spots ? (
        <ActivityIndicator />
      ) : days.length === 0 ? (
        <ThemedText themeColor="textSecondary">Wähle mindestens einen Tag.</ThemedText>
      ) : results.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          Für diese Tage ist kein Platz mehr frei. Versuch es mit weniger Tagen.
        </ThemedText>
      ) : (
        <View style={styles.section}>
          <ThemedText type="smallBold">
            {results.length} {results.length === 1 ? 'Platz' : 'Plätze'} frei
          </ThemedText>
          {results.map((result) => (
            <SpotCard
              key={result.spot.id}
              result={result}
              destinationLabel={PILOT_EVENT.destinationLabel}
              onPress={() =>
                router.push({
                  pathname: '/spot/[id]',
                  params: { id: result.spot.id, days: days.join(',') },
                })
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
});
