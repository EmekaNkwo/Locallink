import type { DatabaseService } from './database-service.types';

import type { Message } from '@/types';

const STORAGE_KEY = 'locallink:messages';

/** Web fallback: in-memory list mirrored to localStorage (keeps preview working). */
class WebDatabaseService implements DatabaseService {
  private messages: Message[] = [];

  async init(): Promise<void> {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      this.messages = raw
        ? (JSON.parse(raw) as Message[]).map((message) => ({
            ...message,
            conversationId: message.conversationId ?? 'legacy',
          }))
        : [];
    } catch {
      this.messages = [];
    }
  }

  private persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
      }
    } catch {
      // ignore quota / unavailable storage
    }
  }

  async getMessages(): Promise<Message[]> {
    return [...this.messages].sort((a, b) => a.timestamp - b.timestamp);
  }

  async insertMessage(message: Message): Promise<void> {
    const index = this.messages.findIndex((m) => m.id === message.id);
    if (index >= 0) this.messages[index] = message;
    else this.messages.push(message);
    this.persist();
  }

  async deleteMessages(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const idsToDelete = new Set(ids);
    this.messages = this.messages.filter((message) => !idsToDelete.has(message.id));
    this.persist();
  }

  async updateMessageStatus(id: string, status: Message['status']): Promise<void> {
    const message = this.messages.find((m) => m.id === id);
    if (message) {
      message.status = status;
      this.persist();
    }
  }

  async getQueuedMessages(): Promise<Message[]> {
    return this.messages.filter((m) => m.status === 'queued');
  }

  async clear(): Promise<void> {
    this.messages = [];
    this.persist();
  }
}

export const databaseService: DatabaseService = new WebDatabaseService();
