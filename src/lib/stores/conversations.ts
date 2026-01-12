import { browser } from '$app/environment';
import { writable } from 'svelte/store';

import { db, type ConversationRecord } from '$lib/storage/db';

const SELECTED_CONVERSATION_KEY = 'quillchat.currentConversationId';

const loadSelectedConversation = (): string | null => {
  if (!browser) {
    return null;
  }

  return localStorage.getItem(SELECTED_CONVERSATION_KEY);
};

const persistSelectedConversation = (conversationId: string | null) => {
  if (!browser) {
    return;
  }

  if (conversationId) {
    localStorage.setItem(SELECTED_CONVERSATION_KEY, conversationId);
  } else {
    localStorage.removeItem(SELECTED_CONVERSATION_KEY);
  }
};

const conversationsWritable = writable<ConversationRecord[]>([]);
const currentConversationIdWritable = writable<string | null>(loadSelectedConversation());

const loadConversations = async () => {
  if (!browser) {
    return;
  }

  const records = await db.getAll('conversations');
  records.sort((a, b) => b.updatedAt - a.updatedAt);
  conversationsWritable.set(records);
};

if (browser) {
  void loadConversations();
}

const upsertConversation = async (conversation: ConversationRecord) => {
  conversationsWritable.update((current) => {
    const next = current.filter((item) => item.id !== conversation.id);
    next.unshift(conversation);
    return next;
  });

  if (browser) {
    await db.put('conversations', conversation);
  }
};

const removeConversation = async (conversationId: string) => {
  conversationsWritable.update((current) =>
    current.filter((conversation) => conversation.id !== conversationId),
  );

  if (browser) {
    await db.delete('conversations', conversationId);
  }

  currentConversationIdWritable.update((currentId) => {
    if (currentId === conversationId) {
      persistSelectedConversation(null);
      return null;
    }
    return currentId;
  });
};

export const conversationsStore = {
  subscribe: conversationsWritable.subscribe,
  reload: loadConversations,
  upsert: upsertConversation,
  remove: removeConversation,
  setAll: async (conversations: ConversationRecord[]) => {
    conversationsWritable.set(conversations);
    if (browser) {
      await db.clear('conversations');
      await db.putMany('conversations', conversations);
    }
  },
};

export const currentConversationIdStore = {
  subscribe: currentConversationIdWritable.subscribe,
  set: (conversationId: string | null) => {
    currentConversationIdWritable.set(conversationId);
    persistSelectedConversation(conversationId);
  },
};
