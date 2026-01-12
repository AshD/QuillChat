import { browser } from '$app/environment';

const DB_NAME = 'quillchat';
const DB_VERSION = 1;

export type ConversationRecord = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type MessageRecord = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
  createdAt: number;
};

type StoreName = 'conversations' | 'messages';

type StoreMap = {
  conversations: ConversationRecord;
  messages: MessageRecord;
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionToPromise = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (!browser) {
    return Promise.reject(new Error('IndexedDB is not available during SSR.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains('conversations')) {
          database.createObjectStore('conversations', { keyPath: 'id' });
        }

        if (!database.objectStoreNames.contains('messages')) {
          const store = database.createObjectStore('messages', { keyPath: 'id' });
          store.createIndex('by-conversationId', 'conversationId', {
            unique: false,
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
};

const withStore = async <N extends StoreName, R>(
  storeName: N,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<R> | R,
): Promise<R> => {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, mode);
  const store = transaction.objectStore(storeName);
  const result = await callback(store);
  await transactionToPromise(transaction);
  return result;
};

export const db = {
  async getAll<N extends StoreName>(storeName: N): Promise<StoreMap[N][]> {
    return withStore(storeName, 'readonly', (store) =>
      requestToPromise(store.getAll()),
    );
  },
  async getByIndex<N extends StoreName>(
    storeName: N,
    indexName: string,
    key: IDBValidKey,
  ): Promise<StoreMap[N][]> {
    return withStore(storeName, 'readonly', (store) => {
      const index = store.index(indexName);
      return requestToPromise(index.getAll(key));
    });
  },
  async put<N extends StoreName>(storeName: N, value: StoreMap[N]): Promise<void> {
    await withStore(storeName, 'readwrite', (store) => {
      store.put(value);
      return undefined;
    });
  },
  async putMany<N extends StoreName>(
    storeName: N,
    values: StoreMap[N][],
  ): Promise<void> {
    await withStore(storeName, 'readwrite', async (store) => {
      await Promise.all(values.map((value) => requestToPromise(store.put(value))));
      return undefined;
    });
  },
  async clear(storeName: StoreName): Promise<void> {
    await withStore(storeName, 'readwrite', (store) =>
      requestToPromise(store.clear()),
    );
  },
  async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    await withStore(storeName, 'readwrite', (store) =>
      requestToPromise(store.delete(key)),
    );
  },
};
