import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type ProviderSettings = {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  temperature: number;
  customInstructions: string;
};

export type Settings = {
  providers: ProviderSettings[];
  activeProviderId: string;
  theme: 'light' | 'dark' | 'system';
};

const STORAGE_KEY = 'quillchat.settings';

const generateId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `provider-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createProvider = (overrides: Partial<ProviderSettings> = {}): ProviderSettings => ({
  id: overrides.id ?? generateId(),
  name: overrides.name ?? 'New Provider',
  baseUrl: overrides.baseUrl ?? '',
  apiKey: overrides.apiKey ?? '',
  defaultModel: overrides.defaultModel ?? 'gpt-3.5-turbo',
  temperature: overrides.temperature ?? 0.7,
  customInstructions: overrides.customInstructions ?? '',
});

const defaultSettings: Settings = {
  providers: [
    createProvider({
      id: 'default',
      name: 'Default Provider',
    }),
  ],
  activeProviderId: 'default',
  theme: 'system',
};

const normalizeProviders = (providers: ProviderSettings[] | undefined) => {
  if (!providers || providers.length === 0) {
    return defaultSettings.providers;
  }

  return providers.map((provider) => createProvider(provider));
};

const ensureActiveProvider = (settings: Settings): Settings => {
  const active =
    settings.providers.find((provider) => provider.id === settings.activeProviderId) ??
    settings.providers[0];

  if (!active) {
    return {
      ...settings,
      providers: defaultSettings.providers,
      activeProviderId: defaultSettings.activeProviderId,
    };
  }

  if (active.id !== settings.activeProviderId) {
    return {
      ...settings,
      activeProviderId: active.id,
    };
  }

  return settings;
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
    const parsed = JSON.parse(raw) as Partial<Settings> & {
      baseUrl?: string;
      apiKey?: string;
      defaultModel?: string;
      temperature?: number;
      customInstructions?: string;
    };

    if (Array.isArray(parsed.providers)) {
      return ensureActiveProvider({
        providers: normalizeProviders(parsed.providers),
        activeProviderId: parsed.activeProviderId ?? defaultSettings.activeProviderId,
        theme:
          parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system'
            ? parsed.theme
            : defaultSettings.theme,
      });
    }

    const migratedProvider = createProvider({
      id: 'default',
      name: 'Default Provider',
      baseUrl: parsed.baseUrl ?? '',
      apiKey: parsed.apiKey ?? '',
      defaultModel: parsed.defaultModel ?? defaultSettings.providers[0].defaultModel,
      temperature:
        typeof parsed.temperature === 'number'
          ? parsed.temperature
          : defaultSettings.providers[0].temperature,
      customInstructions:
        typeof parsed.customInstructions === 'string' ? parsed.customInstructions : '',
    });

    return ensureActiveProvider({
      providers: [migratedProvider],
      activeProviderId: migratedProvider.id,
      theme:
        parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system'
          ? parsed.theme
          : defaultSettings.theme,
    });
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

export const getActiveProvider = (settings: Settings) =>
  settings.providers.find((provider) => provider.id === settings.activeProviderId) ??
  settings.providers[0];

export const settingsStore = {
  subscribe: store.subscribe,
  set: (value: Settings) => {
    const normalized = ensureActiveProvider(value);
    store.set(normalized);
    persistSettings(normalized);
  },
  update: (updater: (value: Settings) => Settings) => {
    let nextValue: Settings | undefined;
    store.update((current) => {
      nextValue = ensureActiveProvider(updater(current));
      return nextValue;
    });

    if (nextValue) {
      persistSettings(nextValue);
    }
  },
  setActiveProviderId: (id: string) => {
    settingsStore.update((current) => ({
      ...current,
      activeProviderId: id,
    }));
  },
  addProvider: () => {
    settingsStore.update((current) => {
      const provider = createProvider({
        name: `Provider ${current.providers.length + 1}`,
      });
      return {
        ...current,
        providers: [...current.providers, provider],
        activeProviderId: provider.id,
      };
    });
  },
  updateProvider: (id: string, updates: Partial<ProviderSettings>) => {
    settingsStore.update((current) => ({
      ...current,
      providers: current.providers.map((provider) =>
        provider.id === id ? { ...provider, ...updates } : provider,
      ),
    }));
  },
  removeProvider: (id: string) => {
    settingsStore.update((current) => {
      const remaining = current.providers.filter((provider) => provider.id !== id);
      if (remaining.length === 0) {
        return {
          ...current,
          providers: defaultSettings.providers,
          activeProviderId: defaultSettings.activeProviderId,
        };
      }

      const nextActive =
        current.activeProviderId === id ? remaining[0].id : current.activeProviderId;
      return {
        ...current,
        providers: remaining,
        activeProviderId: nextActive,
      };
    });
  },
};
