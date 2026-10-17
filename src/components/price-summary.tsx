import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatChf, PLATFORM_FEE_RATE } from '@/domain/pricing';
import type { PriceQuote } from '@/domain/types';

export function PriceSummary({ quote }: { quote: PriceQuote }) {
  return (
    <View style={styles.container}>
      <Row label={`Parkplatz, ${quote.days} ${quote.days === 1 ? 'Tag' : 'Tage'}`} value={quote.subtotalRappen} />
      <Row label={`Servicegebühr (${Math.round(PLATFORM_FEE_RATE * 100)} %)`} value={quote.feeRappen} />
      <Row label="Total" value={quote.totalRappen} bold />
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  const type = bold ? 'smallBold' : 'small';
  return (
    <View style={styles.row}>
      <ThemedText type={type}>{label}</ThemedText>
      <ThemedText type={type}>{formatChf(value)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
