import * as SQLite from 'expo-sqlite';

import type { DatabaseService } from './database-service.types';

import type { Message } from '@/types';

const DB_NAME = 'locallink.db';

/** Native (iOS/Android) SQLite-backed persistence. */
class SqliteDatabaseService implements DatabaseService {
  /**
   * Opens the database AND creates the schema as a single unit. Every method
   * awaits this, so no query can ever run before the `messages` table exists —
   * regardless of call order or whether `init()` was invoked first.
   */
  private readonly ready: Promise<SQLite.SQLiteDatabase> = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        conversationId TEXT NOT NULL DEFAULT 'legacy',
        body TEXT NOT NULL,
        direction TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );`,
    );
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(messages)');
    if (!columns.some((column) => column.name === 'conversationId')) {
      await db.execAsync("ALTER TABLE messages ADD COLUMN conversationId TEXT NOT NULL DEFAULT 'legacy';");
    }
    return db;
  })();

  async init(): Promise<void> {
    await this.ready;
  }

  async getMessages(): Promise<Message[]> {
    const db = await this.ready;
    return db.getAllAsync<Message>('SELECT * FROM messages ORDER BY timestamp ASC');
  }

  async insertMessage(message: Message): Promise<void> {
    const db = await this.ready;
    await db.runAsync(
      'INSERT OR REPLACE INTO messages (id, conversationId, body, direction, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      message.id,
      message.conversationId,
      message.body,
      message.direction,
      message.status,
      message.timestamp,
    );
  }

  async deleteMessages(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.ready;
    const placeholders = ids.map(() => '?').join(', ');
    await db.runAsync(`DELETE FROM messages WHERE id IN (${placeholders})`, ...ids);
  }

  async updateMessageStatus(id: string, status: Message['status']): Promise<void> {
    const db = await this.ready;
    await db.runAsync('UPDATE messages SET status = ? WHERE id = ?', status, id);
  }

  async getQueuedMessages(): Promise<Message[]> {
    const db = await this.ready;
    return db.getAllAsync<Message>(
      "SELECT * FROM messages WHERE status = 'queued' ORDER BY timestamp ASC",
    );
  }

  async clear(): Promise<void> {
    const db = await this.ready;
    await db.execAsync('DELETE FROM messages');
  }
}

export const databaseService: DatabaseService = new SqliteDatabaseService();
