import type { ReactNode } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Pressable with a springy scale + subtle dim on press. The primary tactile
 * primitive used across cards, tiles, and buttons so every touch feels alive.
 */
export function PressableScale({
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    scale.set(withSpring(scaleTo, { damping: 18, stiffness: 320, mass: 0.5 }));
    opacity.set(withTiming(0.9, { duration: 90 }));
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scale.set(withSpring(1, { damping: 14, stiffness: 220, mass: 0.6 }));
    opacity.set(withTiming(1, { duration: 140 }));
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ opacity: disabled ? 0.4 : 1 }, animatedStyle, style]}>
      {children}
    </AnimatedPressable>
  );
}
