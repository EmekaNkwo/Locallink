import { StyleSheet, View, type ColorValue } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityGridProps = {
  months?: string[];
  rows?: number;
  colsPerMonth?: number;
  color?: ColorValue;
};

/**
 * Sparse dot-grid "heatmap" of recent activity. Pattern is deterministic
 * (index-derived) so it stays pure across renders.
 */
export function ActivityGrid({
  months = ['Jan', 'Feb', 'Mar'],
  rows = 5,
  colsPerMonth = 7,
  color,
}: ActivityGridProps) {
  const theme = useTheme();
  const dotColor = color ?? theme.text;
  const cols = months.length * colsPerMonth;

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        {months.map((m) => (
          <ThemedText key={m} type="code" themeColor="textSecondary" style={styles.month}>
            {m}
          </ThemedText>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: rows }, (_, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: cols }, (_, c) => {
              const hot = (r * 7 + c * 13) % 17 === 0;
              const warm = (r * 5 + c * 11) % 9 === 0;
              const opacity = hot ? 1 : warm ? 0.45 : 0.14;
              return (
                <View
                  key={c}
                  style={[styles.dot, { backgroundColor: dotColor, opacity }]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  month: {
    fontSize: 11,
  },
  grid: {
    gap: 7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
