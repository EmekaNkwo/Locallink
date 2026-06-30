import type { CallSession } from '@/types';

/**
 * Audio session boundary (PRD F2).
 * Native: react-native-webrtc (Opus, DTLS-SRTP). Web: mock.
 */
export interface CallService {
  connect(peerName: string): Promise<CallSession>;
  disconnect(): Promise<void>;
  /** Subscribe to live latency updates (ms). Returns an unsubscribe fn. */
  onLatency(cb: (latencyMs: number) => void): () => void;
  /** Enable/disable the local mic track (push-to-talk + mute). */
  setMicEnabled(enabled: boolean): void;
}
