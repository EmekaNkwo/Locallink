import type { MessageService } from './message-service.types';

import type { Message } from '@/types';

/** Web/preview mock: simulates a data-channel round-trip. */
class MockMessageService implements MessageService {
  transmit(_message: Message): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 700);
    });
  }

  onReceive(_cb: (message: Message) => void): () => void {
    // No peer in the web preview; nothing inbound to deliver.
    return () => {};
  }
}

export const messageService: MessageService = new MockMessageService();
