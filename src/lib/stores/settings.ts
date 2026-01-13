import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Settings = {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  temperature: number;
  useProxy: boolean;
  theme: 'light' | 'dark' | 'system';
  customInstructions: string;
};

const STORAGE_KEY = 'quillchat.settings';

const defaultSettings: Settings = {
  baseUrl: '',
  apiKey: '',
  defaultModel: 'gpt-3.5-turbo',
  temperature: 0.7,
  useProxy: false,
  theme: 'system',
  customInstructions: '',
};

const loadSettings = (): Settings => {
  if (!browser) {
    return defaultSettings;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...defaultSettings,
      ...parsed,
      temperature:
        typeof parsed.temperature === 'number'
          ? parsed.temperature
          : defaultSettings.temperature,
      useProxy:
        typeof parsed.useProxy === 'boolean'
          ? parsed.useProxy
          : defaultSettings.useProxy,
      theme:
        parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system'
          ? parsed.theme
          : defaultSettings.theme,
      customInstructions:
        typeof parsed.customInstructions === 'string'
          ? parsed.customInstructions
          : defaultSettings.customInstructions,
    };
  } catch {
    return defaultSettings;
  }
};

const store = writable<Settings>(loadSettings());

const persistSettings = (value: Settings) => {
  if (!browser) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const settingsStore = {
  subscribe: store.subscribe,
  set: (value: Settings) => {
    store.set(value);
    persistSettings(value);
  },
  update: (updater: (value: Settings) => Settings) => {
    let nextValue: Settings | undefined;
    store.update((current) => {
      nextValue = updater(current);
      return nextValue;
    });

    if (nextValue) {
      persistSettings(nextValue);
    }
  },
};
