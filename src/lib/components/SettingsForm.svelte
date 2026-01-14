<script lang="ts">
  import { listChatCompletionModels } from '$lib/api/models';
  import { getActiveProvider, settingsStore } from '$lib/stores/settings';
  import type { ProviderSettings, Settings } from '$lib/stores/settings';

  let availableModels: string[] = [];
  let isLoadingModels = false;
  let modelError = '';
  let modelRequestId = 0;

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    settingsStore.update((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateProvider = (updates: Partial<ProviderSettings>) => {
    const activeProvider = getActiveProvider($settingsStore);
    if (!activeProvider) {
      return;
    }
    settingsStore.updateProvider(activeProvider.id, updates);
  };

  const handleProviderTextInput =
    (key: 'name' | 'baseUrl' | 'apiKey' | 'defaultModel') =>
    (event: Event & { currentTarget: HTMLInputElement }) => {
      updateProvider({ [key]: event.currentTarget.value });
    };

  const handleSelectInput =
    (key: 'theme' | 'activeProviderId') =>
    (event: Event & { currentTarget: HTMLSelectElement }) => {
      if (key === 'activeProviderId') {
        settingsStore.setActiveProviderId(event.currentTarget.value);
        return;
      }
      updateSetting(key, event.currentTarget.value as Settings['theme']);
    };

  const handleTextAreaInput =
    (key: 'customInstructions') =>
    (event: Event & { currentTarget: HTMLTextAreaElement }) => {
      updateProvider({ [key]: event.currentTarget.value });
    };

  const handleTemperatureInput = (event: Event & { currentTarget: HTMLInputElement }) => {
    updateProvider({ temperature: Number(event.currentTarget.value) });
  };

  const refreshModels = async () => {
    if (!activeProvider?.apiKey) {
      availableModels = [];
      modelError = '';
      return;
    }

    const requestId = ++modelRequestId;
    isLoadingModels = true;
    modelError = '';
    try {
      const models = await listChatCompletionModels('https://api.openai.com', activeProvider.apiKey);
      if (requestId !== modelRequestId) {
        return;
      }
      availableModels = models;
    } catch (error) {
      if (requestId !== modelRequestId) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch models.';
      modelError = message;
      availableModels = [];
    } finally {
      if (requestId === modelRequestId) {
        isLoadingModels = false;
      }
    }
  };

  const addProvider = () => {
    settingsStore.addProvider();
  };

  const removeProvider = () => {
    const activeProvider = getActiveProvider($settingsStore);
    if (!activeProvider) {
      return;
    }
    settingsStore.removeProvider(activeProvider.id);
  };

  $: activeProvider = getActiveProvider($settingsStore);
  $: providerKey = activeProvider ? `${activeProvider.id}-${activeProvider.apiKey}` : '';
  $: if (providerKey) {
    void refreshModels();
  }
</script>

<form class="settings-form chatgpt-card">
  <div class="card-body d-grid gap-3">
    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="provider-select">
        Provider
      </label>
      <div class="d-flex flex-column flex-md-row gap-2 align-items-md-center">
        <select
          id="provider-select"
          class="form-select form-select-lg flex-grow-1"
          value={$settingsStore.activeProviderId}
          on:change={handleSelectInput('activeProviderId')}
        >
          {#each $settingsStore.providers as provider}
            <option value={provider.id}>{provider.name}</option>
          {/each}
        </select>
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-secondary btn-lg"
            on:click={addProvider}
          >
            Add
          </button>
          <button
            type="button"
            class="btn btn-outline-danger btn-lg"
            on:click={removeProvider}
            disabled={$settingsStore.providers.length <= 1}
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="provider-name">
        Provider name
      </label>
      <input
        id="provider-name"
        class="form-control form-control-lg"
        type="text"
        placeholder="Acme AI"
        value={activeProvider?.name ?? ''}
        on:input={handleProviderTextInput('name')}
      />
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="base-url">Base URL</label>
      <input
        id="base-url"
        class="form-control form-control-lg"
        type="url"
        placeholder="https://api.example.com"
        value={activeProvider?.baseUrl ?? ''}
        on:input={handleProviderTextInput('baseUrl')}
      />
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="api-key">API Key</label>
      <input
        id="api-key"
        class="form-control form-control-lg"
        type="password"
        placeholder="sk-..."
        value={activeProvider?.apiKey ?? ''}
        on:input={handleProviderTextInput('apiKey')}
      />
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="default-model">Default Model</label>
      <input
        id="default-model"
        class="form-control form-control-lg"
        type="text"
        list="settings-models"
        placeholder={isLoadingModels ? 'Loading models...' : 'gpt-3.5-turbo'}
        value={activeProvider?.defaultModel ?? ''}
        on:input={handleProviderTextInput('defaultModel')}
      />
      <datalist id="settings-models">
        {#each availableModels as model}
          <option value={model}></option>
        {/each}
      </datalist>
      {#if isLoadingModels}
        <p class="text-muted small mt-1 mb-0">Loading models…</p>
      {:else if modelError}
        <p class="text-muted small mt-1 mb-0">Model fetch failed: {modelError}</p>
      {/if}
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="temperature">Temperature</label>
      <input
        id="temperature"
        class="form-control form-control-lg"
        type="number"
        min="0"
        max="2"
        step="0.1"
        value={activeProvider?.temperature ?? 0.7}
        on:input={handleTemperatureInput}
      />
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="theme">Theme</label>
      <select
        id="theme"
        class="form-select form-select-lg"
        value={$settingsStore.theme}
        on:change={handleSelectInput('theme')}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="custom-instructions">
        Custom instructions (system prompt)
      </label>
      <textarea
        id="custom-instructions"
        class="form-control form-control-lg"
        rows="4"
        placeholder="Add system-level guidance for every chat."
        value={activeProvider?.customInstructions ?? ''}
        on:input={handleTextAreaInput('customInstructions')}
      ></textarea>
      <p class="text-muted small mb-0">
        This text is sent as the first system message for each new request.
      </p>
    </div>
  </div>
</form>

<style>
  .settings-form {
    border-radius: 1rem;
  }
</style>
