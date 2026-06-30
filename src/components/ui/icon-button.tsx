import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, type ColorValue } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  active?: boolean;
  tintColor?: ColorValue;
};

/** Circular, hairline-bordered icon button used in screen headers. */
export function IconButton({
  icon,
  label,
  onPress,
  size = 40,
  iconSize = 18,
  active = false,
  tintColor,
}: IconButtonProps) {
  const theme = useTheme();
  const color = tintColor ?? (active ? theme.background : theme.text);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? theme.text : theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <SymbolView name={icon} size={iconSize} tintColor={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
