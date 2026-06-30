import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScanningPulseProps = {
  label?: string;
  size?: number;
};

const RING_COUNT = 3;

export function ScanningPulse({ label = 'Scanning…', size = 168 }: ScanningPulseProps) {
  const theme = useTheme();

  return (
    <View style={styles.container} accessibilityLabel={label}>
      <View style={[styles.radar, { width: size, height: size }]}>
        {/* static radar grid rings for depth */}
        {[1, 0.66, 0.33].map((scale) => (
          <View
            key={scale}
            style={[
              styles.gridRing,
              {
                width: size * scale,
                height: size * scale,
                borderColor: theme.border,
              },
            ]}
          />
        ))}

        {/* expanding sonar pulses */}
        {Array.from({ length: RING_COUNT }, (_, i) => (
          <PulseRing key={i} size={size} color={theme.tint2} delay={i * 900} />
        ))}

        {/* roaming blips */}
        <Blip color={theme.tint2} delay={400} x={size * 0.28} y={-size * 0.18} />
        <Blip color={theme.tint2} delay={1400} x={-size * 0.22} y={size * 0.2} />

        <CoreDot color={theme.tint2} />
      </View>
      {label ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

function PulseRing({ size, color, delay }: { size: number; color: string; delay: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.ease) }), -1, false),
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.2 + progress.value * 0.8 }],
    opacity: (1 - progress.value) * 0.7,
  }));

  return (
    <Animated.View
      style={[styles.pulseRing, style, { width: size, height: size, borderColor: color }]}
    />
  );
}

function CoreDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.set(
      withRepeat(
        withSequence(
          withTiming(1.25, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={[styles.core, style, { backgroundColor: color }]} />;
}

function Blip({ color, delay, x, y }: { color: string; delay: number; x: number; y: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(1, { duration: 800 }),
            withTiming(0, { duration: 600 }),
          ),
          -1,
          false,
        ),
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: x }, { translateY: y }, { scale: 0.5 + progress.value * 0.5 }],
  }));

  return <Animated.View style={[styles.blip, style, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  radar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  core: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  blip: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    textAlign: 'center',
  },
});
