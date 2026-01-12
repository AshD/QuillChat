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

const normalizeConversation = (conversation: ConversationRecord): ConversationRecord => {
  const title = conversation.title?.trim() || 'New Chat';
  const createdAt = conversation.createdAt ?? conversation.updatedAt ?? Date.now();
  const updatedAt = conversation.updatedAt ?? createdAt;

  return {
    ...conversation,
    title,
    createdAt,
    updatedAt,
  };
};

const loadConversations = async () => {
  if (!browser) {
    return;
  }

  const records = await db.getAll('conversations');
  const normalized = records.map((record) => normalizeConversation(record));
  normalized.sort((a, b) => b.updatedAt - a.updatedAt);
  conversationsWritable.set(normalized);

  const recordById = new Map(records.map((record) => [record.id, record]));
  const needsPersist = normalized.some((conversation) => {
    const existing = recordById.get(conversation.id);
    if (!existing) {
      return true;
    }
    return (
      conversation.title !== existing.title ||
      conversation.createdAt !== existing.createdAt ||
      conversation.updatedAt !== existing.updatedAt
    );
  });

  if (needsPersist) {
    await db.putMany('conversations', normalized);
  }
};

if (browser) {
  void loadConversations();
}

const upsertConversation = async (conversation: ConversationRecord) => {
  const normalized = normalizeConversation(conversation);
  conversationsWritable.update((current) => {
    const next = current.filter((item) => item.id !== normalized.id);
    next.unshift(normalized);
    return next;
  });

  if (browser) {
    await db.put('conversations', normalized);
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
    const normalized = conversations.map((conversation) =>
      normalizeConversation(conversation),
    );
    conversationsWritable.set(normalized);
    if (browser) {
      await db.clear('conversations');
      await db.putMany('conversations', normalized);
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
