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
import { testPaymentService } from '@/services/payments';
import { useBookings } from '@/state/bookings';
import { useSpot } from '@/state/use-spot';

const payments = testPaymentService;

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ id: string; days?: string }>();
  const spot = useSpot(params.id);
  const days = parseDaysParam(params.days);
  const { addBooking } = useBookings();
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
    const result = await payments.pay(quote);
    setPaying(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const bookingId = result.reference;
    addBooking({
      id: bookingId,
      spotId: spot.id,
      days,
      licensePlate: normalizedPlate,
      quote,
      status: 'bestaetigt',
      createdAt: new Date().toISOString(),
    });
    router.replace({ pathname: '/booking/[id]', params: { id: bookingId } });
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

      {payments.isTestMode && (
        <ThemedText type="small" themeColor="textSecondary">
          Testmodus: Es wird kein Geld belastet. Stripe wird als Nächstes angebunden.
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
