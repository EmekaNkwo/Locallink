import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type SignalStrengthProps = {
  signal: number;
  bars?: number;
};

export function SignalStrength({ signal, bars = 4 }: SignalStrengthProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, signal));
  const activeBars = Math.max(1, Math.ceil((clamped / 100) * bars));

  return (
    <View style={styles.container} accessibilityLabel={`Signal strength ${clamped} percent`}>
      {Array.from({ length: bars }, (_, index) => {
        const isActive = index < activeBars;
        const height = 5 + index * 4;
        return (
          <View
            key={index}
            style={[
              styles.bar,
              { height, backgroundColor: isActive ? theme.tint2 : theme.backgroundSelected },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 18,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
