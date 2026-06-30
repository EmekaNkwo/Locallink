import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  /** Use the slightly lighter elevated surface. */
  elevated?: boolean;
  bordered?: boolean;
  radius?: number;
  padded?: boolean;
};

/** Flat surface card — neutral fill with a hairline border. No shadows. */
export function Card({
  elevated = false,
  bordered = true,
  radius = Radii.lg,
  padded = true,
  style,
  ...rest
}: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        { borderRadius: radius, backgroundColor: elevated ? theme.surfaceElevated : theme.surface },
        bordered ? { borderWidth: 1, borderColor: theme.border } : null,
        padded ? styles.padded : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  padded: {
    padding: Spacing.four,
  },
});
