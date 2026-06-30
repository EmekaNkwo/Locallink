import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Message } from '@/types';

type MessageCardProps = {
  message: Message;
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function statusIcon(status: Message['status']): SymbolViewProps['name'] {
  switch (status) {
    case 'queued':
      return { ios: 'clock', android: 'schedule', web: 'schedule' };
    case 'sent':
      return { ios: 'checkmark', android: 'check', web: 'check' };
    case 'delivered':
      return { ios: 'checkmark.circle.fill', android: 'done_all', web: 'done_all' };
  }
}

export function MessageCard({ message }: MessageCardProps) {
  const theme = useTheme();
  const isSent = message.direction === 'sent';
  const metaColor = isSent ? theme.background : theme.textSecondary;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).mass(0.6)}
      style={[styles.wrapper, isSent ? styles.sentWrapper : styles.receivedWrapper]}>
      <View
        style={[
          styles.bubble,
          isSent
            ? { backgroundColor: theme.tint, borderBottomRightRadius: Radii.sm }
            : {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                borderWidth: 1,
                borderBottomLeftRadius: Radii.sm,
              },
        ]}>
        <ThemedText type="default" style={isSent ? { color: theme.background } : undefined}>
          {message.body}
        </ThemedText>
        <View style={styles.footer}>
          <ThemedText type="code" style={[styles.meta, { color: metaColor }]}>
            {formatTime(message.timestamp)}
          </ThemedText>
          {isSent ? (
            <SymbolView name={statusIcon(message.status)} size={11} tintColor={metaColor} />
          ) : (
            <SymbolView
              name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
              size={9}
              tintColor={metaColor}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  sentWrapper: {
    alignItems: 'flex-end',
  },
  receivedWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.one,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  meta: {
    fontSize: 10,
  },
});
