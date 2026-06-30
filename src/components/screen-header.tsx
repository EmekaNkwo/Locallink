import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/ui/section-label';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Small uppercase mono kicker shown above the title. */
  eyebrow?: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, eyebrow, right }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.one + 2,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
  },
});
