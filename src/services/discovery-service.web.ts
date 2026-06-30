import type { DiscoveryService, ScanHandlers } from './discovery-service.types';

import type { BleDevice } from '@/types';

const MOCK_DEVICES: BleDevice[] = [
  { id: 'dev-director', name: 'Director', signal: 88, distanceMeters: 12, paired: false, batteryLevel: 74 },
  { id: 'dev-camera-b', name: 'Camera B', signal: 64, distanceMeters: 28, paired: false, batteryLevel: 52 },
  { id: 'dev-sound-op', name: 'Sound Op', signal: 41, distanceMeters: 46, paired: false, batteryLevel: 90 },
];

/** Web/preview mock: simulates BLE advertisements over time. */
class MockDiscoveryService implements DiscoveryService {
  scan({ onDevice, onComplete }: ScanHandlers): () => void {
    const timers: ReturnType<typeof setTimeout>[] = [];
    MOCK_DEVICES.forEach((device, index) => {
      timers.push(setTimeout(() => onDevice({ ...device }), 700 + index * 650));
    });
    timers.push(setTimeout(() => onComplete?.(), 700 + MOCK_DEVICES.length * 650));

    return () => timers.forEach(clearTimeout);
  }

  pair(_deviceId: string, pin: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(pin.length === 6), 600);
    });
  }
}

export const discoveryService: DiscoveryService = new MockDiscoveryService();
