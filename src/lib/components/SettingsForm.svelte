<script lang="ts">
  import { settingsStore } from '$lib/stores/settings';
  import type { Settings } from '$lib/stores/settings';

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    settingsStore.update((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleTextInput =
    (key: 'baseUrl' | 'apiKey' | 'defaultModel') =>
    (event: Event & { currentTarget: HTMLInputElement }) => {
      updateSetting(key, event.currentTarget.value);
    };

  const handleTemperatureInput = (event: Event & { currentTarget: HTMLInputElement }) => {
    updateSetting('temperature', Number(event.currentTarget.value));
  };

  const handleCheckboxInput =
    (key: 'useProxy') =>
    (event: Event & { currentTarget: HTMLInputElement }) => {
      updateSetting(key, event.currentTarget.checked);
    };
</script>

<form class="settings-form chatgpt-card">
  <div class="card-body d-grid gap-3">
    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="base-url">Base URL</label>
      <input
        id="base-url"
        class="form-control form-control-lg"
        type="url"
        placeholder="https://api.example.com"
        value={$settingsStore.baseUrl}
        on:input={handleTextInput('baseUrl')}
      />
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="api-key">API Key</label>
      <input
        id="api-key"
        class="form-control form-control-lg"
        type="password"
        placeholder="sk-..."
        value={$settingsStore.apiKey}
        on:input={handleTextInput('apiKey')}
      />
    </div>

    <div class="field">
      <label class="form-label text-uppercase small text-muted" for="default-model">Default Model</label>
      <input
        id="default-model"
        class="form-control form-control-lg"
        type="text"
        placeholder="gpt-3.5-turbo"
        value={$settingsStore.defaultModel}
        on:input={handleTextInput('defaultModel')}
      />
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
        value={$settingsStore.temperature}
        on:input={handleTemperatureInput}
      />
    </div>

    <div class="form-check form-switch mt-2">
      <input
        id="use-proxy"
        class="form-check-input"
        type="checkbox"
        role="switch"
        checked={$settingsStore.useProxy}
        on:change={handleCheckboxInput('useProxy')}
      />
      <label class="form-check-label" for="use-proxy">
        Use proxy server for requests
      </label>
    </div>
  </div>
</form>

<style>
  .settings-form {
    border-radius: 1rem;
  }
</style>
