import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { shortDayLabel } from '@/domain/days';
import type { IsoDay } from '@/domain/types';
import { useTheme } from '@/hooks/use-theme';

type DayPickerProps = {
  days: IsoDay[];
  selected: IsoDay[];
  onChange(selected: IsoDay[]): void;
  /** Tage, die angezeigt, aber nicht wählbar sind. */
  unavailable?: IsoDay[];
};

export function DayPicker({ days, selected, onChange, unavailable = [] }: DayPickerProps) {
  const theme = useTheme();

  const toggle = (day: IsoDay) => {
    const next = selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day];
    onChange(next.sort());
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((day) => {
        const isSelected = selected.includes(day);
        const isUnavailable = unavailable.includes(day);
        return (
          <Pressable
            key={day}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled: isUnavailable }}
            disabled={isUnavailable}
            onPress={() => toggle(day)}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? theme.accent : theme.backgroundElement },
              isUnavailable && styles.unavailable,
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: isSelected ? theme.onAccent : theme.text }}>
              {shortDayLabel(day)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  unavailable: {
    opacity: 0.35,
  },
});
