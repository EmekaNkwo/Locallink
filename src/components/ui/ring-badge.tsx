import { StyleSheet, View, type ColorValue } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type RingBadgeProps = {
  value: string | number;
  size?: number;
  color?: ColorValue;
  thickness?: number;
};

/** Outlined circular badge with a centered value (e.g. routine index). */
export function RingBadge({ value, size = 48, color, thickness = 2 }: RingBadgeProps) {
  const theme = useTheme();
  const ringColor = color ?? theme.text;

  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: ringColor },
      ]}>
      <ThemedText style={[styles.value, { fontSize: size * 0.36 }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '700',
  },
});
