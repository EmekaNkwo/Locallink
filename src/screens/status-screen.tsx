import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import * as Network from 'expo-network';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BatteryIndicator } from '@/components/indicators/battery-indicator';
import { SignalStrength } from '@/components/indicators/signal-strength';
import { ScreenHeader } from '@/components/screen-header';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { BottomTabInset, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { base64ToBytes, bytesToHex } from '@/lib/bytes';
import { encryptionService } from '@/services/encryption-service';
import { useBatteryStore, useCallStore, useDeviceStore } from '@/store';

function formatFingerprint(publicKeyB64: string): string {
  const hex = bytesToHex(base64ToBytes(publicKeyB64)).toUpperCase();
  return [hex.slice(0, 4), hex.slice(4, 8), hex.slice(8, 12), hex.slice(12, 16)].join('·');
}

function formatNetworkType(type?: Network.NetworkStateType): string {
  switch (type) {
    case Network.NetworkStateType.WIFI:
      return 'Wi-Fi';
    case Network.NetworkStateType.CELLULAR:
      return 'Cellular';
    case Network.NetworkStateType.ETHERNET:
      return 'Ethernet';
    case Network.NetworkStateType.BLUETOOTH:
      return 'Bluetooth';
    case Network.NetworkStateType.NONE:
      return 'Offline';
    case Network.NetworkStateType.VPN:
      return 'VPN';
    default:
      return 'Unknown';
  }
}

export function StatusScreen() {
  const theme = useTheme();
  const [keyFingerprint, setKeyFingerprint] = useState<string | null>(null);
  const [networkState, setNetworkState] = useState<Network.NetworkState | null>(null);
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const session = useCallStore((state) => state.session);
  const callStatus = useCallStore((state) => state.status);
  const batteryLevel = useBatteryStore((state) => state.level);
  const charging = useBatteryStore((state) => state.charging);
  const lowPowerMode = useBatteryStore((state) => state.lowPowerMode);
  const batteryHydrated = useBatteryStore((state) => state.hydrated);
  const pairedDevice = useDeviceStore((state) => state.pairedDevice);
  const isScanning = useDeviceStore((state) => state.isScanning);

  const isConnected = callStatus === 'active' && session !== null;
  const signal = pairedDevice?.signal ?? 0;
  const latency = session?.latencyMs ?? 0;
  const isLowBattery = batteryLevel < 20;
  const batteryLabel = batteryHydrated ? (charging ? 'Charging' : 'On battery') : 'Checking...';
  const networkLabel = networkState ? formatNetworkType(networkState.type) : 'Checking...';
  const connectionLabel = isConnected
    ? 'Connected to peer'
    : pairedDevice
      ? 'Paired, ready to call'
      : isScanning
        ? 'Looking for devices'
        : 'No device connected';
  const peerLabel = session?.peerName ?? pairedDevice?.name ?? 'None';
  const discoveryLabel = isScanning ? 'Bluetooth scanning' : pairedDevice ? 'Found by Bluetooth' : 'Idle';

  useEffect(() => {
    let mounted = true;
    void encryptionService
      .getPublicKey()
      .then((publicKey) => {
        if (mounted) setKeyFingerprint(formatFingerprint(publicKey));
      })
      .catch(() => {
        if (mounted) setKeyFingerprint(null);
      });

    void Network.getNetworkStateAsync()
      .then((state) => {
        if (mounted) setNetworkState(state);
      })
      .catch(() => {
        if (mounted) setNetworkState(null);
      });

    const networkSubscription = Network.addNetworkStateListener((state) => setNetworkState(state));

    return () => {
      mounted = false;
      networkSubscription.remove();
    };
  }, []);

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
        <ScreenHeader eyebrow="Diagnostics" title="System Status" subtitle="Live connection health" />

        <StatusCard
          index={0}
          icon={{ ios: 'wifi', android: 'wifi', web: 'wifi' }}
          title="Connection"
          pill={
            isConnected ? (
              <StatusPill label="Stable" color="success" pulse />
            ) : isScanning ? (
              <StatusPill label="Scanning" color="warning" pulse />
            ) : pairedDevice ? (
              <StatusPill label="Paired" color="success" dot={false} />
            ) : (
              <StatusPill label="Idle" color="textSecondary" dot={false} />
            )
          }>
          <Row label="Status" value={connectionLabel} accent={isConnected || pairedDevice !== null} />
          <Row label="Peer" value={peerLabel} />
          <Row label="Discovery" value={discoveryLabel} accent={isScanning} />
          {pairedDevice ? (
            <RowNode label="Peer signal">
              <SignalStrength signal={signal} />
            </RowNode>
          ) : null}
          <Row label="Latency" value={isConnected ? `${latency}ms` : '—'} accent={isConnected} />
        </StatusCard>

        <StatusCard
          index={1}
          icon={{ ios: 'battery.50', android: 'battery_std', web: 'battery_std' }}
          title="Battery"
          pill={isLowBattery ? <StatusPill label="Low" color="danger" /> : undefined}>
          <RowNode label="Level">
            <BatteryIndicator level={batteryLevel} />
          </RowNode>
          <Row label="Power" value={batteryLabel} />
          <Row label="Low Power Mode" value={lowPowerMode ? 'On' : 'Off'} accent={lowPowerMode} />
          {isLowBattery || lowPowerMode ? (
            <View style={[styles.note, { backgroundColor: `${theme.warning}14`, borderColor: `${theme.warning}55` }]}>
              <SymbolView name={{ ios: 'bolt.slash.fill', android: 'power', web: 'power' }} size={14} tintColor={theme.warning} />
              <ThemedText type="small" style={{ color: theme.warning, flex: 1 }}>
                Power saving active — prefer short push-to-talk sessions
              </ThemedText>
            </View>
          ) : null}
        </StatusCard>

        <StatusCard
          index={2}
          icon={{ ios: 'lock.shield.fill', android: 'security', web: 'security' }}
          title="Security"
          pill={<StatusPill label={keyFingerprint ? 'Ready' : 'Checking'} color={keyFingerprint ? 'success' : 'textSecondary'} dot={false} />}>
          <Row label="Local identity" value={keyFingerprint ? 'Generated' : 'Checking...'} accent={keyFingerprint !== null} />
          <Row label="Session encryption" value={session?.encrypted ? 'Active' : 'Starts after pairing'} accent={session?.encrypted} />
          <View style={[styles.fingerprintBox, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="code" themeColor="textSecondary">
              LOCAL KEY · {keyFingerprint ?? 'Checking...'}
            </ThemedText>
          </View>
        </StatusCard>

        <StatusCard
          index={3}
          icon={{ ios: 'antenna.radiowaves.left.and.right', android: 'wifi_tethering', web: 'wifi_tethering' }}
          title="Transport">
          <Row label="Discovery" value="Bluetooth LE" />
          <Row label="Call/messages" value="Local peer-to-peer" />
          <Row label="Current network" value={networkLabel} />
          <Row label="Internet" value="Not required" />
          <View style={styles.noteRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Bluetooth finds nearby devices. Voice and messages use the local peer connection, not BLE audio.
            </ThemedText>
          </View>
        </StatusCard>
      </View>
    </ScrollView>
  );
}

type StatusCardProps = {
  title: string;
  icon: SymbolViewProps['name'];
  index: number;
  pill?: ReactNode;
  children: ReactNode;
};

function StatusCard({ title, icon, index, pill, children }: StatusCardProps) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(index * 90)} style={styles.padX}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconTile, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView name={icon} size={18} tintColor={theme.tint2} />
          </View>
          <ThemedText type="smallBold" style={styles.cardTitle}>
            {title}
          </ThemedText>
          {pill}
        </View>
        <View style={styles.cardContent}>{children}</View>
      </Card>
    </Animated.View>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={accent ? { color: theme.tint2 } : undefined}>
        {value}
      </ThemedText>
    </View>
  );
}

function RowNode({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, width: '100%', gap: Spacing.two },
  padX: { paddingHorizontal: Spacing.four },
  card: { gap: Spacing.two, padding: Spacing.three },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  iconTile: { width: 36, height: 36, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 16 },
  cardContent: { gap: Spacing.one + 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two, minHeight: 28 },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: Radii.sm, padding: Spacing.two + 2, marginTop: Spacing.one },
  noteRow: { borderRadius: Radii.sm, paddingTop: Spacing.one },
  fingerprintBox: { borderRadius: Radii.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
