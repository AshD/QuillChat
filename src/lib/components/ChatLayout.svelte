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
  <header class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
    <div>
      <h1 class="h3 mb-1">Chat Client</h1>
      <p class="text-muted mb-0">The deployed QuillChat workspace lives right here.</p>
    </div>
    <div class="d-flex align-items-center gap-3 flex-wrap">
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm rounded-pill"
        on:click={toggleSidebar}
        aria-pressed={isSidebarCollapsed}
      >
        {isSidebarCollapsed ? 'Show archive' : 'Hide archive'}
      </button>
      <div class="d-flex align-items-center gap-2">
        <span class="status-dot"></span>
        <span class="text-muted small">All systems ready</span>
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
        <div class="card-body">
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

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
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
