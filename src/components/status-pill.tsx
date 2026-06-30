import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PulsingDot } from '@/components/ui/pulsing-dot';
import { Radii, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatusPillProps = {
  label: string;
  color?: ThemeColor;
  dot?: boolean;
  /** Animate the dot as a live "transmitting" pulse. */
  pulse?: boolean;
};

export function StatusPill({ label, color = 'tint', dot = true, pulse = false }: StatusPillProps) {
  const theme = useTheme();
  const accent = theme[color];

  return (
    <View style={[styles.pill, { borderColor: `${accent}55`, backgroundColor: `${accent}1F` }]}>
      {dot &&
        (pulse ? (
          <PulsingDot color={accent} size={7} />
        ) : (
          <View style={[styles.dot, { backgroundColor: accent }]} />
        ))}
      <ThemedText type="code" style={[styles.label, { color: accent }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    borderWidth: 1,
    minHeight: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
