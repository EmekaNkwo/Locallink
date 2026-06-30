import type { MessageService } from './message-service.types';
import { peerSession } from './peer-session';

import type { Message } from '@/types';

/**
 * Native WebRTC data-channel transport (PRD F3) — sub-phase 1e.
 *
 * Shares the RTCPeerConnection's ordered "chat" data channel via peer-session.
 * Inbound messages are surfaced through onReceive so the store can persist +
 * display them. Persistence/queue lives in DatabaseService.
 */
class WebRtcMessageService implements MessageService {
  async transmit(message: Message): Promise<void> {
    await peerSession.sendMessage(message);
  }

  onReceive(cb: (message: Message) => void): () => void {
    return peerSession.onMessage(cb);
  }
}

export const messageService: MessageService = new WebRtcMessageService();
