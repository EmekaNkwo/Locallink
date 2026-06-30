import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type LiveBarsProps = {
  color: ColorValue;
  count?: number;
  height?: number;
  active?: boolean;
};

/** Audio-style equalizer used to signal a live / active connection. */
export function LiveBars({ color, count = 5, height = 22, active = true }: LiveBarsProps) {
  return (
    <View style={[styles.row, { height }]}>
      {Array.from({ length: count }, (_, i) => (
        <Bar key={i} color={color} index={i} maxHeight={height} active={active} />
      ))}
    </View>
  );
}

function Bar({
  color,
  index,
  maxHeight,
  active,
}: {
  color: ColorValue;
  index: number;
  maxHeight: number;
  active: boolean;
}) {
  const value = useSharedValue(0.3);

  useEffect(() => {
    if (!active) {
      value.set(withTiming(0.18, { duration: 250 }));
      return;
    }
    const peak = 0.55 + ((index * 37) % 45) / 100;
    const duration = 360 + ((index * 53) % 260);
    value.set(
      withDelay(
        index * 90,
        withRepeat(
          withSequence(
            withTiming(peak, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.22, { duration, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        ),
      ),
    );
  }, [active, index, value]);

  const style = useAnimatedStyle(() => ({ height: maxHeight * value.value }));

  return <Animated.View style={[styles.bar, style, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
  },
});
