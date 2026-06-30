import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PairButtonProps = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PairButton({ label = 'Pair', onPress, disabled = false }: PairButtonProps) {
  const theme = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        { backgroundColor: disabled ? theme.backgroundSelected : theme.tint },
      ]}>
      <ThemedText
        type="code"
        style={[styles.label, { color: disabled ? theme.textSecondary : theme.background }]}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    minWidth: 76,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
