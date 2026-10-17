import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { PriceSummary } from '@/components/price-summary';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { shortDayLabel } from '@/domain/days';
import { normalizeSwissPlate } from '@/domain/license-plate';
import { parseDaysParam } from '@/domain/params';
import { quoteForDays } from '@/domain/pricing';
import { useTheme } from '@/hooks/use-theme';
import { bookingService } from '@/services/bookings';
import { useSpot } from '@/state/use-spot';

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ id: string; days?: string }>();
  const spot = useSpot(params.id);
  const days = parseDaysParam(params.days);
  const theme = useTheme();
  const [plate, setPlate] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (spot === undefined) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }
  if (spot === null || days.length === 0) {
    return (
      <Screen>
        <ThemedText>Diese Buchung ist nicht mehr möglich. Bitte starte die Suche neu.</ThemedText>
      </Screen>
    );
  }

  const quote = quoteForDays(spot.pricePerDayRappen, days.length);
  const normalizedPlate = normalizeSwissPlate(plate);

  const pay = async () => {
    if (!normalizedPlate) return;
    setPaying(true);
    setError(null);
    const result = await bookingService.book({ spot, days, licensePlate: normalizedPlate });
    setPaying(false);
    if (result.status === 'error') {
      setError(result.message);
      return;
    }
    if (result.status === 'booked') {
      router.replace({ pathname: '/booking/[id]', params: { id: result.bookingId } });
    }
  };

  return (
    <Screen
      footer={
        <PrimaryButton
          title={paying ? 'Zahlung läuft …' : 'Jetzt bezahlen'}
          disabled={!normalizedPlate || paying}
          onPress={pay}
        />
      }>
      <View style={styles.section}>
        <ThemedText type="subtitle">{spot.title}</ThemedText>
        <ThemedText themeColor="textSecondary">{days.map(shortDayLabel).join(', ')}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Kontrollschild</ThemedText>
        <TextInput
          value={plate}
          onChangeText={setPlate}
          placeholder="z.B. SZ 12345"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        {plate.length > 0 && !normalizedPlate && (
          <ThemedText type="small" themeColor="textSecondary">
            Bitte Kanton und Nummer eingeben, z.B. SZ 12345.
          </ThemedText>
        )}
      </View>

      <ThemedView type="backgroundElement" style={styles.box}>
        <PriceSummary quote={quote} />
      </ThemedView>

      {bookingService.isTestMode && (
        <ThemedText type="small" themeColor="textSecondary">
          Testmodus mit Beispieldaten: Es wird kein Geld belastet.
        </ThemedText>
      )}
      {error && <ThemedText type="small">{error}</ThemedText>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  input: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  box: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
