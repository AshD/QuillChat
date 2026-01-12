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

const updateMessage = async (message: MessageRecord) => {
  messagesWritable.update((current) => {
    const existing = current[message.conversationId] ?? [];
    const index = existing.findIndex((item) => item.id === message.id);
    const next =
      index === -1
        ? [...existing, message]
        : existing.map((item, idx) => (idx === index ? message : item));

    return {
      ...current,
      [message.conversationId]: next,
    };
  });

  if (browser) {
    await db.put('messages', message);
  }
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
  update: updateMessage,
  setAll: saveMessages,
  clear: clearMessages,
};
