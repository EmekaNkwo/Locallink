import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type PulsingDotProps = {
  color: ColorValue;
  size?: number;
};

/** A live "transmitting" dot: solid core with an expanding, fading halo. */
export function PulsingDot({ color, size = 8 }: PulsingDotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false),
    );
  }, [progress]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 1.8 }],
    opacity: 0.5 * (1 - progress.value),
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[styles.halo, haloStyle, { width: size, height: size, backgroundColor: color }]}
      />
      <View style={[styles.core, { width: size, height: size, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    borderRadius: 999,
  },
  core: {
    borderRadius: 999,
  },
});
