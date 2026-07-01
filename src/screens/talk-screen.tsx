import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KillSwitchBtn } from '@/components/buttons';
import { BatteryIndicator } from '@/components/indicators/battery-indicator';
import { LiveBars } from '@/components/indicators/live-bars';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toast, useCallStore, useDeviceStore } from '@/store';

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TalkScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const session = useCallStore((state) => state.session);
  const isTalking = useCallStore((state) => state.isTalking);
  const isMuted = useCallStore((state) => state.isMuted);
  const isSpeaker = useCallStore((state) => state.isSpeaker);
  const startCall = useCallStore((state) => state.startCall);
  const endCall = useCallStore((state) => state.endCall);
  const setTalking = useCallStore((state) => state.setTalking);
  const toggleMute = useCallStore((state) => state.toggleMute);
  const toggleSpeaker = useCallStore((state) => state.toggleSpeaker);
  const pairedDevice = useDeviceStore((state) => state.pairedDevice);

  const [now, setNow] = useState(() => Date.now());
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  const peerName = session?.peerName ?? pairedDevice?.name ?? 'Director';
  const mode = session?.mode ?? 'local-network';
  const latencyMs = session?.latencyMs ?? 0;
  const selfBattery = session?.selfBattery ?? 0;
  const peerBattery = session?.peerBattery ?? 0;
  const startedAt = session?.startedAt;
  const elapsed = startedAt ? now - startedAt : 0;

  const pttScale = useSharedValue(1);
  const ringProgress = useSharedValue(0);

  useEffect(() => {
    if (useCallStore.getState().status === 'idle') {
      void startCall(pairedDevice?.name ?? 'Director');
    }
  }, [startCall, pairedDevice]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTalking) {
      ringProgress.set(
        withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1, false),
      );
    } else {
      ringProgress.set(withTiming(0, { duration: 200 }));
    }
  }, [isTalking, ringProgress]);

  const onPttPressIn = useCallback(() => {
    setTalking(true);
    pttScale.set(withSpring(0.94, { damping: 15, stiffness: 300 }));
  }, [pttScale, setTalking]);

  const onPttPressOut = useCallback(() => {
    setTalking(false);
    pttScale.set(withSpring(1, { damping: 12, stiffness: 200 }));
  }, [pttScale, setTalking]);

  const pttStyle = useAnimatedStyle(() => ({ transform: [{ scale: pttScale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ringProgress.value * 0.4 }],
    opacity: (1 - ringProgress.value) * 0.6,
  }));

  const handleKill = () => {
    setShowKillConfirm(false);
    void endCall();
    toast.error('Emergency stop — all sessions terminated');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.three }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <PressableScale
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close talk session"
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}>
            <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={22} tintColor={theme.text} />
          </PressableScale>
          <StatusPill label="Encrypted · P2P" color="success" pulse />
          <View style={styles.iconButton} />
        </View>

        {/* Peer identity */}
        <View style={styles.peerBlock}>
          <View style={[styles.avatar, { backgroundColor: theme.tint2 }]}>
            <ThemedText style={[styles.avatarText, { color: theme.background }]}>
              {peerName.charAt(0)}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.peerName}>
            {peerName}
          </ThemedText>
          <ThemedText type="code" themeColor="textSecondary" style={styles.metaLine}>
            {session ? `${mode === 'local-network' ? 'LOCAL NETWORK' : mode} · ${latencyMs}MS` : 'CONNECTING…'}
          </ThemedText>
          <ThemedText type="title" style={[styles.timer, { color: theme.tint }]}>
            {formatDuration(elapsed)}
          </ThemedText>
        </View>

        {/* PTT */}
        <View style={styles.pttSection}>
          <View style={styles.waveSlot}>
            {isTalking ? (
              <LiveBars color={theme.tint2} count={9} height={34} />
            ) : (
              <ThemedText type="code" themeColor="textSecondary">
                HOLD TO TRANSMIT
              </ThemedText>
            )}
          </View>

          <View style={styles.pttWrap}>
            <Animated.View
              pointerEvents="none"
              style={[styles.pttRing, ringStyle, { borderColor: theme.tint2 }]}
            />
            <Animated.View style={pttStyle}>
              <PressableScale
                scaleTo={1}
                onPressIn={onPttPressIn}
                onPressOut={onPttPressOut}
                accessibilityRole="button"
                accessibilityLabel="Push to talk"
                accessibilityHint="Hold to transmit audio"
                accessibilityState={{ selected: isTalking }}
                style={[
                  styles.pttButton,
                  isTalking
                    ? { backgroundColor: theme.tint2 }
                    : { backgroundColor: theme.backgroundElement, borderColor: theme.tint2, borderWidth: 2 },
                ]}>
                <SymbolView
                  name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
                  size={52}
                  tintColor={isTalking ? theme.background : theme.tint2}
                />
              </PressableScale>
            </Animated.View>
          </View>

          <ThemedText type="code" style={{ color: isTalking ? theme.tint2 : theme.textSecondary, letterSpacing: 2 }}>
            {isTalking ? 'TRANSMITTING' : 'PUSH TO TALK'}
          </ThemedText>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <ControlButton
            label="Mute"
            active={isMuted}
            icon={{ ios: isMuted ? 'mic.slash.fill' : 'mic.fill', android: 'mic_off', web: 'mic_off' }}
            onPress={toggleMute}
          />
          <ControlButton
            label="Speaker"
            active={isSpeaker}
            icon={{ ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }}
            onPress={toggleSpeaker}
          />
          <ControlButton
            label="Chat"
            icon={{ ios: 'bubble.left.fill', android: 'chat', web: 'chat' }}
            onPress={() => router.push('/messages')}
          />
        </View>

        {/* Battery + kill */}
        <Card padded={false} style={styles.batteryCard}>
          <View style={styles.batterySide}>
            <ThemedText type="code" themeColor="textSecondary">
              YOU
            </ThemedText>
            <BatteryIndicator level={selfBattery} />
          </View>
          <View style={[styles.batteryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.batterySide}>
            <ThemedText type="code" themeColor="textSecondary">
              {peerName.toUpperCase()}
            </ThemedText>
            <BatteryIndicator level={peerBattery} />
          </View>
        </Card>

        <KillSwitchBtn onPress={() => setShowKillConfirm(true)} />
      </View>

      <Modal visible={showKillConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalWrap}>
            <Card elevated style={styles.modalContent}>
              <View style={[styles.modalIcon, { backgroundColor: `${theme.danger}22` }]}>
                <SymbolView name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }} size={28} tintColor={theme.danger} />
              </View>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Emergency Stop
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                This immediately terminates the session and disconnects all encrypted streams.
              </ThemedText>
              <KillSwitchBtn onPress={handleKill} label="CONFIRM STOP" />
              <PressableScale
                onPress={() => setShowKillConfirm(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={styles.cancelButton}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancel
                </ThemedText>
              </PressableScale>
            </Card>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

type ControlButtonProps = {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  active?: boolean;
};

function ControlButton({ label, icon, onPress, active = false }: ControlButtonProps) {
  const theme = useTheme();
  return (
    <View style={styles.control}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        style={[
          styles.controlButton,
          {
            backgroundColor: active ? theme.tint2 : theme.backgroundElement,
            borderColor: active ? theme.tint2 : theme.border,
          },
        ]}>
        <SymbolView name={icon} size={24} tintColor={active ? theme.background : theme.text} />
      </PressableScale>
      <ThemedText type="code" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.four, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  peerBlock: { alignItems: 'center', gap: Spacing.two },
  avatar: { width: 84, height: 84, borderRadius: Radii.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  avatarText: { color: '#04141B', fontSize: 36, fontWeight: '800' },
  peerName: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  metaLine: { letterSpacing: 1.5 },
  timer: { fontSize: 44, fontWeight: '800', letterSpacing: 1, marginTop: Spacing.one, fontVariant: ['tabular-nums'] },
  pttSection: { alignItems: 'center', gap: Spacing.three },
  waveSlot: { height: 34, alignItems: 'center', justifyContent: 'center' },
  pttWrap: { alignItems: 'center', justifyContent: 'center', width: 180, height: 180 },
  pttRing: { position: 'absolute', width: 168, height: 168, borderRadius: 90, borderWidth: 2 },
  pttButton: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.five },
  control: { alignItems: 'center', gap: Spacing.one + 2 },
  controlButton: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  batteryCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three },
  batterySide: { flex: 1, alignItems: 'center', gap: Spacing.one },
  batteryDivider: { width: 1, height: 32 },
  modalOverlay: { flex: 1, backgroundColor: '#00040BCC', justifyContent: 'center', padding: Spacing.four },
  modalWrap: {},
  modalContent: { alignItems: 'center', gap: Spacing.three, padding: Spacing.four, borderRadius: Radii.xl },
  modalIcon: { width: 56, height: 56, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  centerText: { textAlign: 'center' },
  cancelButton: { minHeight: 44, justifyContent: 'center', padding: Spacing.two },
});
