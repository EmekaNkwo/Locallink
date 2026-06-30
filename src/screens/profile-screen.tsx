import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KillSwitchBtn } from '@/components/buttons';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionLabel } from '@/components/ui/section-label';
import { BottomTabInset, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { base64ToBytes, bytesToHex } from '@/lib/bytes';
import { encryptionService } from '@/services/encryption-service';

function formatFingerprint(publicKeyB64: string): string {
  const hex = bytesToHex(base64ToBytes(publicKeyB64)).toUpperCase();
  return [hex.slice(0, 4), hex.slice(4, 8), hex.slice(8, 12), hex.slice(12, 16)].join('·');
}

type SettingRow = {
  id: string;
  label: string;
  description: string;
  defaultValue: boolean;
};

const SETTINGS: SettingRow[] = [
  { id: 'audio-only', label: 'Audio-only on Low Battery', description: 'Disable video when below 20%', defaultValue: true },
  { id: 'wifi-direct', label: 'Wi-Fi Direct', description: 'Prefer local IP when in range', defaultValue: true },
  { id: 'notifications', label: 'Notifications', description: 'Alert on incoming messages', defaultValue: false },
];

export function ProfileScreen() {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.id, s.defaultValue])),
  );
  const [keyFingerprint, setKeyFingerprint] = useState<string | 'unavailable' | null>(null);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const deviceName = Device.deviceName ?? Device.modelName ?? 'This device';

  const toggleSetting = (id: string) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
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

  useEffect(() => {
    let mounted = true;
    void encryptionService
      .getPublicKey()
      .then((publicKey) => {
        if (mounted) setKeyFingerprint(formatFingerprint(publicKey));
      })
      .catch(() => {
        if (mounted) setKeyFingerprint('unavailable');
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }, contentPlatformStyle]}>
      <View style={styles.container}>
        <ScreenHeader eyebrow="Identity" title="Profile" subtitle="Device identity & settings" />

        <Animated.View entering={FadeInDown.duration(450)} style={styles.padX}>
          <Card style={styles.identityCard}>
            <View style={[styles.avatar, { backgroundColor: theme.tint2 }]}>
              <ThemedText style={[styles.avatarText, { color: theme.background }]}>
                {deviceName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.identityText}>
              <ThemedText type="smallBold" style={styles.deviceName}>
                {deviceName}
              </ThemedText>
              <View style={styles.keyRow}>
                <SymbolView name={{ ios: 'key.fill', android: 'vpn_key', web: 'vpn_key' }} size={11} tintColor={theme.tint} />
                <ThemedText type="code" themeColor="textSecondary">
                  {keyFingerprint === 'unavailable' ? 'Identity key unavailable' : keyFingerprint ?? 'Checking identity key...'}
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(90)} style={styles.section}>
          <SectionLabel>Settings</SectionLabel>
          <Card padded={false}>
            {SETTINGS.map((setting, i) => (
              <View
                key={setting.id}
                style={[
                  styles.settingRow,
                  i < SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}>
                <View style={styles.settingText}>
                  <ThemedText type="smallBold">{setting.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {setting.description}
                  </ThemedText>
                </View>
                <Switch
                  value={settings[setting.id]}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: theme.backgroundSelected, true: theme.tint2 }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={setting.label}
                />
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(180)} style={styles.section}>
          <SectionLabel style={{ color: theme.danger }}>Danger Zone</SectionLabel>
          <Card style={[styles.dangerCard, { borderColor: `${theme.danger}55` }]}>
            <PressableScale
              onPress={() =>
                Alert.alert('Reset Keys', 'This will invalidate all paired sessions.', [
                  { text: 'Cancel' },
                  { text: 'Reset', style: 'destructive' },
                ])
              }
              accessibilityRole="button"
              accessibilityLabel="Reset encryption keys"
              style={styles.dangerRow}>
              <View style={styles.dangerLeft}>
                <SymbolView name={{ ios: 'key.slash.fill', android: 'vpn_key_off', web: 'vpn_key_off' }} size={18} tintColor={theme.danger} />
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  Reset Encryption Keys
                </ThemedText>
              </View>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={theme.danger} />
            </PressableScale>
            <KillSwitchBtn
              onPress={() => Alert.alert('Kill Switch', 'Emergency disconnect triggered.', [{ text: 'OK' }])}
              label="KILL SWITCH"
            />
          </Card>
        </Animated.View>

        <ThemedText type="code" themeColor="textSecondary" style={styles.footer}>
          LOCALLINK v{version} · SECURE OFFLINE COMMS
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  container: { maxWidth: MaxContentWidth, width: '100%', gap: Spacing.three },
  padX: { paddingHorizontal: Spacing.four },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  avatar: { width: 60, height: 60, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#04141B', fontSize: 26, fontWeight: '800' },
  identityText: { flex: 1, gap: Spacing.one + 2 },
  deviceName: { fontSize: 20, fontWeight: '800' },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  section: { gap: Spacing.three, paddingHorizontal: Spacing.four },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, padding: Spacing.three, minHeight: 56 },
  settingText: { flex: 1, gap: Spacing.half },
  dangerCard: { gap: Spacing.three, padding: Spacing.three },
  dangerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  dangerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  footer: { textAlign: 'center', paddingVertical: Spacing.four, letterSpacing: 1 },
});
