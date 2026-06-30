import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PinInputProps = {
  length?: number;
  onComplete: (pin: string) => void;
};

export function PinInput({ length = 6, onComplete }: PinInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    setValue(digits);
    if (digits.length === length) {
      onComplete(digits);
    }
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
      accessibilityLabel={`Enter ${length} digit PIN`}>
      <View style={styles.boxes}>
        {Array.from({ length }, (_, index) => (
          <PinBox
            key={index}
            filled={index < value.length}
            active={index === value.length}
          />
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        accessibilityLabel="PIN entry field"
        autoFocus
      />
    </Pressable>
  );
}

function PinBox({ filled, active }: { filled: boolean; active: boolean }) {
  const theme = useTheme();
  const pop = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    pop.set(filled ? withSequence(withSpring(1.12, { damping: 9 }), withSpring(1)) : withSpring(0));
  }, [filled, pop]);

  useEffect(() => {
    glow.set(withTiming(active ? 1 : 0, { duration: 200 }));
  }, [active, glow]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + Math.min(pop.value, 1) * 0.15 + Math.max(pop.value - 1, 0) }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: Math.min(pop.value, 1),
    transform: [{ scale: Math.min(pop.value, 1) }],
  }));

  const borderColor = filled ? theme.tint2 : active ? theme.text : theme.border;

  return (
    <Animated.View
      style={[
        styles.box,
        boxStyle,
        { borderColor, backgroundColor: theme.surfaceElevated },
      ]}>
      <Animated.View style={[styles.dot, dotStyle, { backgroundColor: theme.tint2 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  boxes: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  box: {
    width: 46,
    height: 56,
    borderRadius: Radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
