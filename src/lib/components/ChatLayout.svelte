<script lang="ts">
  import ConversationList from '$lib/components/ConversationList.svelte';
  import MessageComposer from '$lib/components/MessageComposer.svelte';
  import MessageList from '$lib/components/MessageList.svelte';
  import SettingsForm from '$lib/components/SettingsForm.svelte';
  import { listChatCompletionModels } from '$lib/api/models';
  import { getActiveProvider, settingsStore } from '$lib/stores/settings';

  let isSidebarCollapsed = false;
  let availableModels: string[] = [];
  let isLoadingModels = false;
  let modelError = '';
  let modelRequestId = 0;

  const toggleSidebar = () => {
    isSidebarCollapsed = !isSidebarCollapsed;
  };

  const refreshModels = async () => {
    const provider = getActiveProvider($settingsStore);
    if (!provider?.baseUrl) {
      availableModels = [];
      modelError = '';
      return;
    }

    const requestId = ++modelRequestId;
    isLoadingModels = true;
    modelError = '';
    try {
      const models = await listChatCompletionModels(provider.baseUrl, provider.apiKey);
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

  const handleProviderChange = (event: Event & { currentTarget: HTMLSelectElement }) => {
    settingsStore.setActiveProviderId(event.currentTarget.value);
  };

  const handleModelChange = (event: Event & { currentTarget: HTMLInputElement }) => {
    const provider = getActiveProvider($settingsStore);
    if (!provider) {
      return;
    }
    settingsStore.updateProvider(provider.id, { defaultModel: event.currentTarget.value });
  };

  $: activeProvider = getActiveProvider($settingsStore);
  $: hasSettings = Boolean(activeProvider?.baseUrl && activeProvider?.apiKey);
  $: providerKey = activeProvider
    ? `${activeProvider.id}-${activeProvider.baseUrl}-${activeProvider.apiKey}`
    : '';
  $: if (providerKey) {
    void refreshModels();
  }
</script>

<section class="chat-layout d-grid gap-4">
  <header class="d-flex align-items-center">
    <div class="d-flex align-items-center gap-3 flex-wrap w-100">
      <button
        type="button"
        class="archive-toggle"
        on:click={toggleSidebar}
        aria-pressed={isSidebarCollapsed}
        aria-label={isSidebarCollapsed ? 'Show archive' : 'Hide archive'}
        title={isSidebarCollapsed ? 'Show archive' : 'Hide archive'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm4 0v14h2V5H8zm4 0v14h6V5h-6z"
          />
        </svg>
      </button>
      <div class="d-flex flex-wrap gap-2 ms-auto align-items-center">
        <div class="provider-select">
          <label class="form-label text-uppercase small text-muted mb-1" for="chat-provider">
            Provider
          </label>
          <select
            id="chat-provider"
            class="form-select form-select-sm"
            value={activeProvider?.id ?? ''}
            on:change={handleProviderChange}
          >
            {#each $settingsStore.providers as provider}
              <option value={provider.id}>{provider.name}</option>
            {/each}
          </select>
        </div>
        <div class="model-select">
          <label class="form-label text-uppercase small text-muted mb-1" for="chat-model">
            Model
          </label>
          <input
            id="chat-model"
            class="form-control form-control-sm"
            list="chat-models"
            placeholder={isLoadingModels ? 'Loading models...' : 'Select a model'}
            value={activeProvider?.defaultModel ?? ''}
            on:input={handleModelChange}
          />
          <datalist id="chat-models">
            {#each availableModels as model}
              <option value={model}></option>
            {/each}
          </datalist>
          {#if modelError}
            <p class="text-muted small mt-1 mb-0">Model fetch failed: {modelError}</p>
          {/if}
        </div>
      </div>
    </div>
  </header>

  {#if !hasSettings}
    <div class="chatgpt-card setup-card">
      <div class="card-body d-grid gap-2">
        <div>
          <h2 class="h5 mb-1">Connect your model</h2>
          <p class="text-muted mb-0">
            Add your API base URL and key to start chatting with an OpenAI-compatible model.
          </p>
        </div>
        <SettingsForm />
      </div>
    </div>
  {/if}

  <div class="row g-4 workspace {isSidebarCollapsed ? 'collapsed' : ''}">
    <aside class="col-12 col-lg-4 col-xl-3 sidebar">
      <div class="chatgpt-card h-100">
        <div class="card-body d-flex flex-column gap-3">
          <div class="sidebar-toolbar d-flex justify-content-between align-items-center">
            <span class="text-uppercase text-muted small">Archive</span>
          </div>
          <ConversationList />
        </div>
      </div>
    </aside>
    <div class="col-12 col-lg-8 col-xl-9 d-flex flex-column gap-4 thread">
      <div class="chatgpt-card flex-grow-1">
        <div class="card-body d-flex flex-column gap-3 min-height-thread">
          <MessageList />
        </div>
      </div>
      <MessageComposer />
    </div>
  </div>
</section>

<style>
  .min-height-thread {
    min-height: 480px;
  }

  .archive-toggle {
    border: none;
    background: transparent;
    padding: 4px;
    border-radius: 10px;
    color: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .archive-toggle svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  .archive-toggle:hover {
    background: rgba(148, 163, 184, 0.2);
  }

  .archive-toggle:focus-visible {
    outline: 2px solid rgba(59, 130, 246, 0.6);
    outline-offset: 2px;
  }

  .workspace.collapsed .sidebar {
    display: none;
  }

  .workspace.collapsed .thread {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .setup-card {
    border-radius: 24px;
  }

  .provider-select,
  .model-select {
    min-width: 180px;
  }

  .model-select {
    max-width: 280px;
  }
</style>
