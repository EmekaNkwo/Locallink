import type { BleDevice } from '@/types';

export type ScanHandlers = {
  onDevice: (device: BleDevice) => void;
  onComplete?: () => void;
  /** Called when discovery can't start (e.g. Bluetooth unavailable/off). */
  onError?: (error: Error) => void;
};

/**
 * Device discovery + pairing boundary (PRD F1).
 * Native: react-native-ble-lite (advertise + scan). Web: mock.
 */
export interface DiscoveryService {
  /** Begin scanning. Returns a stop function that cancels in-flight discovery. */
  scan(handlers: ScanHandlers): () => void;
  /** Confirm pairing with a PIN. Resolves true on success. */
  pair(deviceId: string, pin: string): Promise<boolean>;
}
