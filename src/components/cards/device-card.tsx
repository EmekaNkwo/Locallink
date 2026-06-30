import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { PairButton } from '@/components/buttons';
import { BatteryIndicator } from '@/components/indicators/battery-indicator';
import { SignalStrength } from '@/components/indicators/signal-strength';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BleDevice } from '@/types';

type DeviceCardProps = {
  device: BleDevice;
  onPair: (device: BleDevice) => void;
};

export function DeviceCard({ device, onPair }: DeviceCardProps) {
  const theme = useTheme();

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: device.paired ? theme.tint2 : theme.backgroundSelected },
          ]}>
          <SymbolView
            name={{ ios: 'antenna.radiowaves.left.and.right', android: 'cell_tower', web: 'cell_tower' }}
            size={20}
            tintColor={device.paired ? theme.background : theme.textSecondary}
          />
        </View>

        <View style={styles.info}>
          <ThemedText type="smallBold" style={styles.name}>
            {device.name}
          </ThemedText>
          <View style={styles.meta}>
            <SignalStrength signal={device.signal} />
            <ThemedText type="code" themeColor="textSecondary">
              {device.distanceMeters.toFixed(0)}m
            </ThemedText>
            {device.batteryLevel !== undefined ? (
              <BatteryIndicator level={device.batteryLevel} />
            ) : null}
          </View>
        </View>

        {device.paired ? (
          <StatusPill label="Paired" color="tint2" dot={false} />
        ) : (
          <PairButton label="Pair" onPress={() => onPair(device)} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.one + 2,
  },
  name: {
    fontSize: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
});
