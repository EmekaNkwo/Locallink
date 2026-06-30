import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type SectionLabelProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

/** Minimal uppercase, letter-spaced caption used as a quiet section heading. */
export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <ThemedText type="code" themeColor="textSecondary" style={[styles.label, style]}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 11,
  },
});
