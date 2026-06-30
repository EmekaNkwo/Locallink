export interface Message {
  id: string;
  /** Stable peer/session bucket this message belongs to. */
  conversationId: string;
  body: string;
  direction: 'sent' | 'received';
  status: 'queued' | 'sent' | 'delivered';
  timestamp: number;
}
