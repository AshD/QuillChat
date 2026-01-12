import { browser } from '$app/environment';
import { writable } from 'svelte/store';

import { db, type MessageRecord } from '$lib/storage/db';

type MessageMap = Record<string, MessageRecord[]>;

const messagesWritable = writable<MessageMap>({});

const loadMessages = async (conversationId: string) => {
  if (!browser) {
    return [];
  }

  const records = await db.getByIndex('messages', 'by-conversationId', conversationId);
  records.sort((a, b) => a.createdAt - b.createdAt);

  messagesWritable.update((current) => ({
    ...current,
    [conversationId]: records,
  }));

  return records;
};

const saveMessage = async (message: MessageRecord) => {
  messagesWritable.update((current) => {
    const existing = current[message.conversationId] ?? [];
    return {
      ...current,
      [message.conversationId]: [...existing, message],
    };
  });

  if (browser) {
    await db.put('messages', message);
  }
};

const saveMessages = async (conversationId: string, messages: MessageRecord[]) => {
  messagesWritable.update((current) => ({
    ...current,
    [conversationId]: messages,
  }));

  if (!browser) {
    return;
  }

  const existing = await db.getByIndex('messages', 'by-conversationId', conversationId);
  await Promise.all(existing.map((record) => db.delete('messages', record.id)));
  await db.putMany('messages', messages);
};

const clearMessages = async (conversationId: string) => {
  messagesWritable.update((current) => {
    const next = { ...current };
    delete next[conversationId];
    return next;
  });

  if (!browser) {
    return;
  }

  const existing = await db.getByIndex('messages', 'by-conversationId', conversationId);
  await Promise.all(existing.map((record) => db.delete('messages', record.id)));
};

export const messagesStore = {
  subscribe: messagesWritable.subscribe,
  load: loadMessages,
  add: saveMessage,
  setAll: saveMessages,
  clear: clearMessages,
};
