import { writable } from 'svelte/store';

export type UiError = {
  id: string;
  title: string;
  message: string;
  detail?: string;
  status?: number;
  mode?: 'direct';
  conversationId?: string | null;
  actionLabel?: string;
  retry?: () => Promise<void>;
};

type UiState = {
  error: UiError | null;
};

const uiWritable = writable<UiState>({
  error: null,
});

const setError = (error: UiError) => {
  uiWritable.set({ error });
};

const clearError = () => {
  uiWritable.set({ error: null });
};

export const uiStore = {
  subscribe: uiWritable.subscribe,
  setError,
  clearError,
};
