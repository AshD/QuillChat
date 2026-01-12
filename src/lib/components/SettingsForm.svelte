<script lang="ts">
  import { settingsStore } from '$lib/stores/settings';
  import type { Settings } from '$lib/stores/settings';

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    settingsStore.update((current) => ({
      ...current,
      [key]: value,
    }));
  };
</script>

<form class="settings-form">
  <div class="field">
    <label for="base-url">Base URL</label>
    <input
      id="base-url"
      type="url"
      placeholder="https://api.example.com"
      value={$settingsStore.baseUrl}
      on:input={(event) =>
        updateSetting('baseUrl', (event.target as HTMLInputElement).value)
      }
    />
  </div>

  <div class="field">
    <label for="api-key">API Key</label>
    <input
      id="api-key"
      type="password"
      placeholder="sk-..."
      value={$settingsStore.apiKey}
      on:input={(event) =>
        updateSetting('apiKey', (event.target as HTMLInputElement).value)
      }
    />
  </div>

  <div class="field">
    <label for="default-model">Default Model</label>
    <input
      id="default-model"
      type="text"
      placeholder="gpt-3.5-turbo"
      value={$settingsStore.defaultModel}
      on:input={(event) =>
        updateSetting('defaultModel', (event.target as HTMLInputElement).value)
      }
    />
  </div>

  <div class="field">
    <label for="temperature">Temperature</label>
    <input
      id="temperature"
      type="number"
      min="0"
      max="2"
      step="0.1"
      value={$settingsStore.temperature}
      on:input={(event) =>
        updateSetting(
          'temperature',
          Number((event.target as HTMLInputElement).value)
        )
      }
    />
  </div>
</form>

<style>
  .settings-form {
    display: grid;
    gap: 1.5rem;
    padding: 2rem;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #e5eaf3;
  }

  .field {
    display: grid;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    color: #1f2a44;
  }

  input {
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1px solid #c8d0e0;
    font-size: 0.95rem;
  }

  input:focus {
    outline: none;
    border-color: #4c6fff;
    box-shadow: 0 0 0 3px rgba(76, 111, 255, 0.15);
  }
</style>
