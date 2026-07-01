export interface CallSession {
  peerName: string;
  mode: 'local-network';
  latencyMs: number;
  encrypted: boolean;
  startedAt: number;
  selfBattery: number;
  peerBattery: number;
}
