import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { PulsingDot } from '@/components/ui/pulsing-dot';
import { RingBadge } from '@/components/ui/ring-badge';
import { BottomTabInset, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCallStore, useDeviceStore, useMessageStore } from '@/store';

export function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const pairedDevice = useDeviceStore((state) => state.pairedDevice);
  const callStatus = useCallStore((state) => state.status);
  const messages = useMessageStore((state) => state.messages);

  const peerName = pairedDevice?.name ?? 'No device paired';
  const isLinked = callStatus === 'active';
  const linkLabel = isLinked ? 'Live secure channel' : pairedDevice ? 'Ready to start call' : 'Find a nearby device';
  const networkValue = pairedDevice ? 'LAN' : '—';
  const networkStatus = pairedDevice ? 'On network' : 'No peer';
  const pairedCount = pairedDevice ? 1 : 0;
  const queuedCount = messages.filter((message) => message.status === 'queued').length;

  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: { paddingTop: Spacing.three, paddingBottom: insets.bottom },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.header}>
          <View style={styles.brandBlock}>
            <ThemedText style={styles.title}>LocalLink</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Secure nearby voice and messages
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
              label="Filters"
              onPress={() => router.push('/status')}
            />
            <IconButton
              icon={{ ios: 'plus', android: 'add', web: 'add' }}
              label="Add device"
              onPress={() => router.push('/discover')}
            />
          </View>
        </Animated.View>

        {/* Primary status cards */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)} style={styles.row}>
          <BentoCard onPress={() => router.push(pairedDevice ? '/talk' : '/discover')} label={pairedDevice ? 'Open talk session' : 'Discover devices'} style={styles.half}>
            <View style={styles.tileTop}>
              <RingBadge value={String(pairedCount)} size={44} color={pairedDevice ? theme.tint2 : theme.textSecondary} />
            </View>
            <View style={styles.tileText}>
              <ThemedText type="smallBold" style={styles.tileTitle}>
                {peerName}
              </ThemedText>
              <View style={styles.linkedRow}>
                {isLinked ? <PulsingDot color={theme.tint2} size={6} /> : null}
                <ThemedText type="small" themeColor="textSecondary">
                  {linkLabel}
                </ThemedText>
              </View>
            </View>
          </BentoCard>

          <BentoCard onPress={() => router.push('/status')} label="Open status" style={styles.half}>
            <View style={styles.signalHeader}>
              <View>
                <ThemedText type="small" themeColor="textSecondary">
                  Network
                </ThemedText>
                <Stat value={networkValue} unit="" />
              </View>
            </View>
            <View style={styles.signalDetails}>
              <MetricPill label={networkStatus} tone={pairedDevice ? 'success' : 'neutral'} />
              <MetricPill label="Wi-Fi / hotspot" />
            </View>
          </BentoCard>
        </Animated.View>

        {/* Paired device summary */}
        <Animated.View entering={FadeInDown.duration(450).delay(120)}>
          <BentoCard onPress={() => router.push('/discover')} label="Paired devices">
            <View style={styles.summaryRow}>
              <RingBadge value={String(pairedCount)} size={44} />
              <View style={styles.summaryText}>
                <ThemedText type="smallBold" style={styles.tileTitle}>
                  Paired Devices
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {pairedDevice ? pairedDevice.name : 'None paired yet'}
                </ThemedText>
              </View>
            </View>
          </BentoCard>
        </Animated.View>

        {/* Messages summary */}
        <Animated.View entering={FadeInDown.duration(450).delay(180)}>
          <BentoCard onPress={() => router.push('/messages')} label="Open messages">
            <View style={styles.messageSummary}>
              <View style={[styles.iconTile, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView name={{ ios: 'bubble.left.and.bubble.right.fill', android: 'forum', web: 'forum' }} size={20} tintColor={theme.tint2} />
              </View>
              <View style={styles.messageText}>
                <View style={styles.messageTitleRow}>
                  <ThemedText type="smallBold" style={styles.tileTitle}>
                    Messages
                  </ThemedText>
                  <MetricPill label="E2EE" tone="success" />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {pairedDevice
                    ? queuedCount > 0
                      ? `${queuedCount} queued for sync`
                      : 'Secure channel ready'
                    : 'Pair a device to start'}
                </ThemedText>
              </View>
              <View style={styles.messageCount}>
                <ThemedText style={styles.messageCountValue}>{messages.length}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  total
                </ThemedText>
              </View>
            </View>
          </BentoCard>
        </Animated.View>

        {/* Primary action */}
        <Animated.View entering={FadeInDown.duration(450).delay(240)}>
          <PressableScale
            onPress={() => router.push(pairedDevice ? '/talk' : '/discover')}
            accessibilityRole="button"
            accessibilityLabel={pairedDevice ? 'Open talk session' : 'Discover devices'}
            style={[styles.addCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={[styles.actionIcon, { backgroundColor: theme.backgroundSelected }]}>
              <SymbolView
                name={pairedDevice ? { ios: 'phone.fill', android: 'call', web: 'call' } : { ios: 'dot.radiowaves.left.and.right', android: 'wifi_tethering', web: 'wifi_tethering' }}
                size={22}
                tintColor={theme.tint2}
              />
            </View>
            <View style={styles.actionText}>
              <ThemedText type="smallBold" style={styles.tileTitle}>
                {pairedDevice ? 'Start Talk Session' : 'Find Nearby Device'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pairedDevice ? `Talk with ${pairedDevice.name}` : 'Scan the local network'}
              </ThemedText>
            </View>
          </PressableScale>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

function BentoCard({
  children,
  onPress,
  label,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  style?: object;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.bentoFill, style]}>
      <Card style={styles.bento}>{children}</Card>
    </PressableScale>
  );
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.statUnit}>
        {unit}
      </ThemedText>
    </View>
  );
}

function MetricPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' }) {
  const theme = useTheme();
  const color = tone === 'success' ? theme.tint2 : theme.textSecondary;

  return (
    <View style={[styles.metricPill, { borderColor: `${color}55`, backgroundColor: `${color}14` }]}>
      <ThemedText type="code" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  brandBlock: { flex: 1, gap: Spacing.half },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  headerActions: { flexDirection: 'row', gap: Spacing.two },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  half: { flex: 1, minWidth: 156 },
  signalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  signalDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  bentoFill: { width: '100%' },
  bento: { padding: Spacing.three, gap: Spacing.three, minHeight: 132, justifyContent: 'space-between' },
  tileTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tileText: { gap: Spacing.half },
  tileTitle: { fontSize: 17 },
  linkedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.one },
  statValue: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  statUnit: { fontSize: 15, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  summaryText: { flex: 1, gap: Spacing.half },
  messageSummary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconTile: { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  messageText: { flex: 1, gap: Spacing.half, minWidth: 0 },
  messageTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  messageCount: { alignItems: 'flex-end', minWidth: 48 },
  messageCountValue: { fontSize: 28, lineHeight: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricPill: { borderWidth: 1, borderRadius: Radii.pill, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  addCard: {
    minHeight: 76,
    borderRadius: Radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  actionIcon: { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, gap: Spacing.half },
});
