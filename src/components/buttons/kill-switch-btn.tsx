import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type KillSwitchBtnProps = {
  onPress: () => void;
  label?: string;
};

export function KillSwitchBtn({ onPress, label = '#STOP' }: KillSwitchBtnProps) {
  const theme = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel="Emergency stop"
      accessibilityHint="Immediately terminates the active session"
      style={[styles.button, { backgroundColor: theme.danger }]}>
      <View style={styles.content}>
        <SymbolView
          name={{ ios: 'hand.raised.fill', android: 'pan_tool', web: 'pan_tool' }}
          size={18}
          tintColor="#FFFFFF"
        />
        <ThemedText type="smallBold" style={styles.label}>
          {label}
        </ThemedText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    color: '#FFFFFF',
    letterSpacing: 3,
    fontSize: 16,
    fontWeight: '800',
  },
});
