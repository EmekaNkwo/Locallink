import type { CallService } from './call-service.types';
import { peerSession } from './peer-session';

import type { CallSession } from '@/types';

/**
 * Native WebRTC audio session (PRD F2) — sub-phase 1d.
 *
 * Thin adapter over peer-session, which owns the shared RTCPeerConnection,
 * the Opus audio stream (host candidates only, no STUN/TURN) and the live
 * stats. disconnect() tears the whole session down (kill switch).
 */
class WebRtcCallService implements CallService {
  connect(_peerName: string): Promise<CallSession> {
    return peerSession.getOrCreateSession();
  }

  async disconnect(): Promise<void> {
    await peerSession.close();
  }

  onLatency(cb: (latencyMs: number) => void): () => void {
    return peerSession.onLatency(cb);
  }

  setMicEnabled(enabled: boolean): void {
    peerSession.setMicEnabled(enabled);
  }
}

export const callService: CallService = new WebRtcCallService();
