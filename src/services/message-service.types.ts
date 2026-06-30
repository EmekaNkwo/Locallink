import type { Message } from '@/types';

/**
 * Message transport boundary (PRD F3).
 * Native: WebRTC data channel. Web: mock. Persistence/queue lives in DatabaseService.
 */
export interface MessageService {
  /**
   * Transmit a message to the peer. Resolves once acknowledged ("delivered").
   * Rejects if the link is down so the caller can queue it.
   */
  transmit(message: Message): Promise<void>;
  /**
   * Subscribe to inbound messages from the peer (data channel). Returns an
   * unsubscribe fn. Messages arrive with direction 'received'.
   */
  onReceive(cb: (message: Message) => void): () => void;
}
