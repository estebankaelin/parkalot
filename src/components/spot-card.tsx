import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { walkingMinutes } from '@/domain/geo';
import { SPOT_TYPE_LABEL } from '@/domain/labels';
import { formatChf } from '@/domain/pricing';
import type { SpotResult } from '@/domain/search';
import { useTheme } from '@/hooks/use-theme';

type SpotCardProps = {
  result: SpotResult;
  destinationLabel: string;
  onPress(): void;
};

export function SpotCard({ result, destinationLabel, onPress }: SpotCardProps) {
  const theme = useTheme();
  const { spot, distanceMeters } = result;
  const features = [
    SPOT_TYPE_LABEL[spot.type],
    spot.covered ? 'gedeckt' : null,
    spot.evCharging ? 'E-Laden' : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={styles.title}>
          {spot.title}
        </ThemedText>
        <ThemedText type="smallBold">{formatChf(spot.pricePerDayRappen)}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {walkingMinutes(distanceMeters)} Min. zu Fuss zum {destinationLabel} · pro Tag
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {features.join(' · ')}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
});
