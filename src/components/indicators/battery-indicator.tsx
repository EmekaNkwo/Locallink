import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BatteryIndicatorProps = {
  level: number;
  showLabel?: boolean;
};

function getBatteryColor(level: number): ThemeColor {
  if (level < 20) return 'danger';
  if (level < 50) return 'warning';
  return 'success';
}

export function BatteryIndicator({ level, showLabel = true }: BatteryIndicatorProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, level));
  const colorKey = getBatteryColor(clamped);
  const color = theme[colorKey];

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Battery ${clamped} percent`}
      accessibilityRole="text">
      <SymbolView
        name={{
          ios: clamped < 20 ? 'battery.25' : clamped < 50 ? 'battery.50' : 'battery.100',
          android: 'battery_full',
          web: 'battery_full',
        }}
        size={18}
        tintColor={color}
      />
      {showLabel ? (
        <ThemedText type="code" style={{ color, fontSize: 12 }}>
          {clamped}%
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
