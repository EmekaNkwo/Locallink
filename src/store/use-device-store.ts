import { create } from 'zustand';

import { discoveryService } from '@/services';
import { toast } from '@/store/use-toast-store';
import type { DiscoveredDevice } from '@/types';

let stopScanFn: (() => void) | null = null;
let scanStartedAt = 0;
let finishScanTimer: ReturnType<typeof setTimeout> | null = null;

const MIN_SCAN_VISIBLE_MS = 2_000;

function clearFinishScanTimer(): void {
  if (!finishScanTimer) return;
  clearTimeout(finishScanTimer);
  finishScanTimer = null;
}

function discoveryErrorMessage(error: Error): string {
  if (/network|wifi|socket|eaddrinuse|eacces|enotconn/i.test(error.message)) {
    return 'Could not start local network discovery';
  }
  if (/permission|denied|unauthorized/i.test(error.message)) {
    return 'Local network permission is required to scan';
  }
  return 'Could not scan the local network for devices';
}

type DeviceState = {
  devices: DiscoveredDevice[];
  isScanning: boolean;
  pairedDevice: DiscoveredDevice | null;
  startScan: () => void;
  stopScan: () => void;
  pair: (device: DiscoveredDevice, pin: string) => Promise<boolean>;
};

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  isScanning: false,
  pairedDevice: null,

  startScan: () => {
    stopScanFn?.();
    clearFinishScanTimer();
    scanStartedAt = Date.now();
    set({ isScanning: true, devices: [] });
    const finishScan = (after?: () => void, stopDiscovery = true) => {
      clearFinishScanTimer();
      const elapsed = Date.now() - scanStartedAt;
      const remaining = Math.max(0, MIN_SCAN_VISIBLE_MS - elapsed);
      finishScanTimer = setTimeout(() => {
        finishScanTimer = null;
        if (stopDiscovery) {
          stopScanFn?.();
          stopScanFn = null;
        }
        set({ isScanning: false });
        after?.();
      }, remaining);
    };

    stopScanFn = discoveryService.scan({
      onDevice: (device) =>
        set((state) =>
          state.devices.some((d) => d.id === device.id)
            ? {}
            : { devices: [...state.devices, device] },
        ),
      onComplete: () => finishScan(undefined, false),
      onError: (error) => {
        if (!get().isScanning) return;
        finishScan(() => toast.error(discoveryErrorMessage(error)));
      },
    });
  },

  stopScan: () => {
    clearFinishScanTimer();
    stopScanFn?.();
    stopScanFn = null;
    set({ isScanning: false });
  },

  pair: async (device, pin) => {
    let success = false;
    try {
      success = await discoveryService.pair(device.id, pin);
    } catch {
      toast.error('Pairing failed — connection lost');
      return false;
    }
    if (success) {
      const paired = { ...device, paired: true };
      set((state) => ({
        devices: state.devices.map((d) => (d.id === device.id ? paired : d)),
        pairedDevice: paired,
      }));
      toast.success(`Paired with ${device.name}`);
    } else {
      toast.error('Pairing failed — check the PIN and try again');
    }
    return success;
  },
}));
