import type { Message } from '@/types';

/**
 * Persistence boundary for messages + the offline queue (PRD FR-3.2 / FR-3.3).
 * Backed by SQLite on native and an in-memory/localStorage store on web.
 */
export interface DatabaseService {
  init(): Promise<void>;
  getMessages(): Promise<Message[]>;
  insertMessage(message: Message): Promise<void>;
  deleteMessages(ids: string[]): Promise<void>;
  updateMessageStatus(id: string, status: Message['status']): Promise<void>;
  getQueuedMessages(): Promise<Message[]>;
  clear(): Promise<void>;
}
