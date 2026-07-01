import type { DiscoveredDevice } from '@/types';

export type ScanHandlers = {
  onDevice: (device: DiscoveredDevice) => void;
  onComplete?: () => void;
  /** Called when local-network discovery can't start. */
  onError?: (error: Error) => void;
};

/**
 * Device discovery + pairing boundary (PRD F1).
 * Native: Wi-Fi/LAN TCP discovery. Web: mock.
 */
export interface DiscoveryService {
  /** Begin scanning. Returns a stop function that cancels in-flight discovery. */
  scan(handlers: ScanHandlers): () => void;
  /** Confirm pairing with a PIN. Resolves true on success. */
  pair(deviceId: string, pin: string): Promise<boolean>;
}
