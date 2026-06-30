export interface CallSession {
  peerName: string;
  mode: 'wifi-direct' | 'ble';
  latencyMs: number;
  encrypted: boolean;
  startedAt: number;
  selfBattery: number;
  peerBattery: number;
}
