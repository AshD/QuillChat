<script lang="ts">
  import ConversationList from '$lib/components/ConversationList.svelte';
  import MessageComposer from '$lib/components/MessageComposer.svelte';
  import MessageList from '$lib/components/MessageList.svelte';
  import SettingsForm from '$lib/components/SettingsForm.svelte';
  import { settingsStore } from '$lib/stores/settings';

  let isSidebarCollapsed = false;

  const toggleSidebar = () => {
    isSidebarCollapsed = !isSidebarCollapsed;
  };

  $: hasSettings = Boolean($settingsStore.baseUrl && $settingsStore.apiKey);
</script>

<section class="chat-layout d-grid gap-4">
  <header class="d-flex justify-content-end align-items-center">
    {#if isSidebarCollapsed}
      <button
        type="button"
        class="archive-toggle"
        on:click={toggleSidebar}
        aria-pressed={isSidebarCollapsed}
        aria-label="Show archive"
        title="Show archive"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v10h14V7H5zm4 2h2v6H9V9zm4 0h2v6h-2V9z"
          />
        </svg>
      </button>
    {/if}
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
            <button
              type="button"
              class="archive-toggle"
              on:click={toggleSidebar}
              aria-pressed={isSidebarCollapsed}
              aria-label="Hide archive"
              title="Hide archive"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v10h14V7H5zm4 2h2v6H9V9zm4 0h2v6h-2V9z"
                />
              </svg>
            </button>
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
</style>
