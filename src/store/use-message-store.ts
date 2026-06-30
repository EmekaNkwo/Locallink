import { create } from 'zustand';

import { databaseService, messageService } from '@/services';
import { toast } from '@/store/use-toast-store';
import type { Message } from '@/types';

let inboundUnsub: (() => void) | null = null;

const LEGACY_MOCK_MESSAGE_IDS = ['m1', 'm2', 'm3'];

type MessageState = {
  messages: Message[];
  activeConversationId: string | null;
  isOffline: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  send: (body: string) => Promise<void>;
  setOffline: (offline: boolean) => void;
  syncQueue: () => Promise<void>;
};

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  activeConversationId: null,
  isOffline: false,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      await databaseService.init();
      await databaseService.deleteMessages(LEGACY_MOCK_MESSAGE_IDS);
      const messages = await databaseService.getMessages();
      set({ messages, hydrated: true });
    } catch {
      toast.error('Could not load saved messages');
      return;
    }

    inboundUnsub?.();
    inboundUnsub = messageService.onReceive((incoming) => {
      void (async () => {
        const conversationId = get().activeConversationId;
        if (!conversationId) return;
        const scopedIncoming: Message = { ...incoming, conversationId };
        if (get().messages.some((m) => m.id === incoming.id)) return;
        await databaseService.insertMessage(scopedIncoming).catch(() => {});
        set((state) => ({ messages: [...state.messages, scopedIncoming] }));
      })();
    });
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
  },

  send: async (body) => {
    const conversationId = get().activeConversationId;
    if (!conversationId) {
      toast.error('Pair with a nearby device before sending a message');
      return;
    }
    const offline = get().isOffline;
    const message: Message = {
      id: `m-${Date.now()}`,
      conversationId,
      body,
      direction: 'sent',
      status: offline ? 'queued' : 'sent',
      timestamp: Date.now(),
    };
    await databaseService.insertMessage(message);
    set((state) => ({ messages: [...state.messages, message] }));
    if (offline) {
      toast.info('Offline — message queued for delivery');
      return;
    }

    try {
      await messageService.transmit(message);
      await databaseService.updateMessageStatus(message.id, 'delivered');
      set((state) => ({
        messages: state.messages.map((m) => (m.id === message.id ? { ...m, status: 'delivered' } : m)),
      }));
    } catch {
      await databaseService.updateMessageStatus(message.id, 'queued');
      set((state) => ({
        messages: state.messages.map((m) => (m.id === message.id ? { ...m, status: 'queued' } : m)),
      }));
      toast.error('Message failed to send — queued for retry');
    }
  },

  setOffline: (offline) => {
    set({ isOffline: offline });
    if (offline) {
      toast.info('Offline mode on — messages will be queued');
    } else {
      void get().syncQueue();
    }
  },

  syncQueue: async () => {
    const queued = await databaseService.getQueuedMessages();
    if (queued.length === 0) return;

    let synced = 0;
    await Promise.all(
      queued.map(async (m) => {
        try {
          await messageService.transmit(m);
          await databaseService.updateMessageStatus(m.id, 'delivered');
          synced += 1;
          set((state) => ({
            messages: state.messages.map((x) => (x.id === m.id ? { ...x, status: 'delivered' } : x)),
          }));
        } catch {
          // remains queued for the next sync attempt
        }
      }),
    );

    if (synced > 0) {
      toast.success(`Synced ${synced} queued message${synced > 1 ? 's' : ''}`);
    }
    if (synced < queued.length) {
      toast.error('Some messages could not be synced');
    }
  },
}));
