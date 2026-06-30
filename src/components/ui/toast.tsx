import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { MaxContentWidth, Radii, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToastStore, type Toast, type ToastType } from '@/store/use-toast-store';

const ICONS: Record<ToastType, SymbolViewProps['name']> = {
  success: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  error: { ios: 'exclamationmark.triangle.fill', android: 'error', web: 'error' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
};

const ACCENT: Record<ToastType, ThemeColor> = {
  success: 'success',
  error: 'danger',
  info: 'tint2',
};

function ToastItem({ item }: { item: Toast }) {
  const theme = useTheme();
  const dismiss = useToastStore((state) => state.dismiss);
  const accent = theme[ACCENT[item.type]];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, dismiss]);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(200)}
      exiting={FadeOutUp.duration(220)}
      layout={LinearTransition.springify().damping(20)}
      style={styles.itemWrap}>
      <PressableScale
        scaleTo={0.97}
        onPress={() => dismiss(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.type} notification: ${item.message}. Tap to dismiss.`}
        style={[styles.toast, { backgroundColor: theme.surfaceElevated, borderColor: `${accent}55` }]}>
        <View style={[styles.iconTile, { backgroundColor: `${accent}1F` }]}>
          <SymbolView name={ICONS[item.type]} size={18} tintColor={accent} />
        </View>
        <ThemedText type="smallBold" style={styles.message} numberOfLines={2}>
          {item.message}
        </ThemedText>
      </PressableScale>
    </Animated.View>
  );
}

/** Mount once near the app root to render queued toasts above all screens. */
export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingTop: insets.top + Spacing.two }]}>
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    zIndex: 1000,
  },
  itemWrap: {
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.four * 2,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
    minHeight: 56,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
});
