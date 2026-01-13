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

  const handleSelectInput =
    (key: 'theme') =>
    (event: Event & { currentTarget: HTMLSelectElement }) => {
      updateSetting(key, event.currentTarget.value as Settings['theme']);
    };

  const handleTextAreaInput =
    (key: 'customInstructions') =>
    (event: Event & { currentTarget: HTMLTextAreaElement }) => {
      updateSetting(key, event.currentTarget.value);
    };

  const handleTemperatureInput = (event: Event & { currentTarget: HTMLInputElement }) => {
    updateSetting('temperature', Number(event.currentTarget.value));
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
        value={$settingsStore.customInstructions}
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
