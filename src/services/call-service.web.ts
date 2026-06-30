import type { CallService } from './call-service.types';

import type { CallSession } from '@/types';

/** Web/preview mock: fakes a connection handshake + live latency. */
class MockCallService implements CallService {
  private latencyTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(latencyMs: number) => void>();

  connect(peerName: string): Promise<CallSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session: CallSession = {
          peerName,
          mode: 'wifi-direct',
          latencyMs: 48,
          encrypted: true,
          startedAt: Date.now(),
          selfBattery: 82,
          peerBattery: 74,
        };
        this.startLatencyLoop();
        resolve(session);
      }, 900);
    });
  }

  async disconnect(): Promise<void> {
    if (this.latencyTimer) {
      clearInterval(this.latencyTimer);
      this.latencyTimer = null;
    }
  }

  onLatency(cb: (latencyMs: number) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  setMicEnabled(_enabled: boolean): void {
    // No-op in the web preview (no real mic track).
  }

  private startLatencyLoop(): void {
    if (this.latencyTimer) return;
    let tick = 0;
    this.latencyTimer = setInterval(() => {
      tick += 1;
      const latency = 65 + Math.round(Math.sin(tick / 2) * 25);
      this.listeners.forEach((cb) => cb(latency));
    }, 2000);
  }
}

export const callService: CallService = new MockCallService();
