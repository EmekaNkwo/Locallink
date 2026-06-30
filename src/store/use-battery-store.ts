import { create } from 'zustand';
import * as Battery from 'expo-battery';

type BatteryState = {
  level: number;
  charging: boolean;
  lowPowerMode: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLevel: (level: number) => void;
  setCharging: (charging: boolean) => void;
};

// `level` is a 0-100 percentage to match BatteryIndicator.
let batteryUnsubscribers: (() => void)[] = [];

function batteryLevelToPercent(level: number): number {
  if (level < 0) return 0;
  return Math.max(0, Math.min(100, Math.round(level * 100)));
}

function isCharging(state: Battery.BatteryState): boolean {
  return state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
}

export const useBatteryStore = create<BatteryState>((set, get) => ({
  level: 0,
  charging: false,
  lowPowerMode: false,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;

    try {
      const powerState = await Battery.getPowerStateAsync();
      set({
        level: batteryLevelToPercent(powerState.batteryLevel),
        charging: isCharging(powerState.batteryState),
        lowPowerMode: powerState.lowPowerMode,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
      return;
    }

    batteryUnsubscribers.forEach((unsubscribe) => unsubscribe());
    const levelSubscription = Battery.addBatteryLevelListener(({ batteryLevel }) =>
      set({ level: batteryLevelToPercent(batteryLevel) }),
    );
    const stateSubscription = Battery.addBatteryStateListener(({ batteryState }) =>
      set({ charging: isCharging(batteryState) }),
    );
    const lowPowerSubscription = Battery.addLowPowerModeListener(({ lowPowerMode }) =>
      set({ lowPowerMode }),
    );

    batteryUnsubscribers = [
      () => levelSubscription.remove(),
      () => stateSubscription.remove(),
      () => lowPowerSubscription.remove(),
    ];
  },
  setLevel: (level) => set({ level }),
  setCharging: (charging) => set({ charging }),
}));
