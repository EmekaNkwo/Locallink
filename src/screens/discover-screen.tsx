import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PairButton } from '@/components/buttons';
import { DeviceCard } from '@/components/cards/device-card';
import { ScanningPulse } from '@/components/indicators/scanning-pulse';
import { PinInput } from '@/components/inputs/pin-input';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionLabel } from '@/components/ui/section-label';
import { BottomTabInset, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDeviceStore } from '@/store';
import type { BleDevice } from '@/types';

export function DiscoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const devices = useDeviceStore((state) => state.devices);
  const isScanning = useDeviceStore((state) => state.isScanning);
  const pairedDevice = useDeviceStore((state) => state.pairedDevice);
  const startScan = useDeviceStore((state) => state.startScan);
  const stopScan = useDeviceStore((state) => state.stopScan);
  const pairDevice = useDeviceStore((state) => state.pair);

  const [nearbyDiscoveryEnabled, setNearbyDiscoveryEnabled] = useState(true);
  const [pairingDevice, setPairingDevice] = useState<BleDevice | null>(null);

  useEffect(() => {
    if (!nearbyDiscoveryEnabled) {
      stopScan();
      return;
    }
    startScan();
    return () => stopScan();
  }, [nearbyDiscoveryEnabled, startScan, stopScan]);

  const retryScan = useCallback(() => {
    if (!nearbyDiscoveryEnabled) {
      setNearbyDiscoveryEnabled(true);
      return;
    }
    startScan();
  }, [nearbyDiscoveryEnabled, startScan]);

  const toggleNearbyDiscovery = useCallback((enabled: boolean) => {
    setNearbyDiscoveryEnabled(enabled);
  }, []);

  const handlePairComplete = (pin: string) => {
    if (!pairingDevice) return;
    const device = pairingDevice;
    setPairingDevice(null);
    void pairDevice(device, pin);
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: { paddingBottom: insets.bottom },
  });

  return (
    <>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentInset={insets}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
          <ScreenHeader
            eyebrow="Discovery"
            title="Nearby Devices"
            subtitle={
              nearbyDiscoveryEnabled
                ? isScanning
                  ? 'Listening for LocalLink beacons…'
                  : `${devices.length} devices in range`
                : 'Bluetooth discovery is paused'
            }
            right={
              <IconButton
                icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                label="Rescan"
                onPress={retryScan}
              />
            }
          />

          <Animated.View entering={FadeInDown.duration(450)} style={styles.padX}>
            <Card style={styles.toggleRow} padded={false}>
              <View style={[styles.toggleIcon, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={{ ios: 'antenna.radiowaves.left.and.right', android: 'sensors', web: 'sensors' }}
                  size={18}
                  tintColor={nearbyDiscoveryEnabled ? theme.tint2 : theme.textSecondary}
                />
              </View>
              <View style={styles.toggleText}>
                <ThemedText type="smallBold">Nearby Discovery</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Find nearby LocalLink devices
                </ThemedText>
              </View>
              <Switch
                value={nearbyDiscoveryEnabled}
                onValueChange={toggleNearbyDiscovery}
                trackColor={{ false: theme.backgroundSelected, true: theme.tint2 }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Nearby Discovery toggle"
              />
            </Card>
          </Animated.View>

          {!nearbyDiscoveryEnabled ? (
            <Animated.View entering={FadeIn} style={styles.emptyState}>
              <SymbolView
                name={{ ios: 'pause.circle', android: 'pause_circle', web: 'pause_circle' }}
                size={40}
                tintColor={theme.textSecondary}
              />
              <ThemedText type="smallBold">Nearby Discovery is off</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                Turn it on to scan for nearby LocalLink devices.
              </ThemedText>
              <PressableScale
                onPress={retryScan}
                accessibilityRole="button"
                accessibilityLabel="Turn on nearby discovery"
                style={[styles.retryButton, { borderColor: theme.tint }]}>
                <SymbolView
                  name={{ ios: 'dot.radiowaves.left.and.right', android: 'wifi_tethering', web: 'wifi_tethering' }}
                  size={16}
                  tintColor={theme.tint}
                />
                <ThemedText type="code" style={{ color: theme.tint, letterSpacing: 1 }}>
                  TURN ON
                </ThemedText>
              </PressableScale>
            </Animated.View>
          ) : isScanning && devices.length === 0 ? (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <ScanningPulse label="Scanning for nearby devices…" />
            </Animated.View>
          ) : devices.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.emptyState}>
              <SymbolView
                name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }}
                size={40}
                tintColor={theme.textSecondary}
              />
              <ThemedText type="smallBold">Waiting for partner device…</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                Make sure the other device has LocalLink open with Nearby Discovery enabled.
              </ThemedText>
              <PressableScale
                onPress={retryScan}
                accessibilityRole="button"
                accessibilityLabel="Retry scan"
                style={[styles.retryButton, { borderColor: theme.tint }]}>
                <SymbolView
                  name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                  size={16}
                  tintColor={theme.tint}
                />
                <ThemedText type="code" style={{ color: theme.tint, letterSpacing: 1 }}>
                  RETRY SCAN
                </ThemedText>
              </PressableScale>
            </Animated.View>
          ) : (
            <View style={styles.list}>
              <SectionLabel>In Range</SectionLabel>
              {devices.map((device, i) => (
                <Animated.View key={device.id} entering={FadeInDown.duration(420).delay(i * 80)}>
                  <DeviceCard device={device} onPair={setPairingDevice} />
                </Animated.View>
              ))}
            </View>
          )}

          {pairedDevice ? (
            <Animated.View entering={FadeInDown} style={styles.padX}>
              <Card style={styles.pairedBanner}>
                <View style={styles.pairedText}>
                  <SymbolView
                    name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                    size={20}
                    tintColor={theme.success}
                  />
                  <ThemedText type="smallBold">Paired with {pairedDevice.name}</ThemedText>
                </View>
                <PairButton label="Talk" onPress={() => router.push('/talk')} />
              </Card>
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={pairingDevice !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPairingDevice(null)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify().damping(20)} style={styles.modalWrap}>
            <Card elevated style={styles.modalContent}>
              <View style={[styles.grabber, { backgroundColor: theme.border }]} />
              <View style={[styles.modalIcon, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={{ ios: 'lock.shield.fill', android: 'shield', web: 'shield' }}
                  size={26}
                  tintColor={theme.tint}
                />
              </View>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Confirm Pairing
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                Enter the 6-digit code shown on {pairingDevice?.name}
              </ThemedText>
              <PinInput onComplete={handlePairComplete} />
              <PressableScale
                onPress={() => setPairingDevice(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancel pairing"
                style={styles.cancelButton}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancel
                </ThemedText>
              </PressableScale>
            </Card>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, width: '100%', gap: Spacing.three },
  padX: { paddingHorizontal: Spacing.four },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { flex: 1, gap: Spacing.half },
  emptyState: { alignItems: 'center', padding: Spacing.five, gap: Spacing.three },
  centerText: { textAlign: 'center' },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    marginTop: Spacing.two,
  },
  list: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  pairedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  pairedText: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: '#00040BCC', justifyContent: 'flex-end' },
  modalWrap: { padding: Spacing.three },
  modalContent: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radii.xl,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, marginBottom: Spacing.one },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  cancelButton: { minHeight: 44, justifyContent: 'center', padding: Spacing.two },
});
