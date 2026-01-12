<script lang="ts">
  import ConversationList from '$lib/components/ConversationList.svelte';
  import MessageComposer from '$lib/components/MessageComposer.svelte';
  import MessageList from '$lib/components/MessageList.svelte';

  let isSidebarCollapsed = false;

  const toggleSidebar = () => {
    isSidebarCollapsed = !isSidebarCollapsed;
  };
</script>

<section class="chat-layout d-grid gap-4">
  <header class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
    <div>
      <h1 class="h3 mb-1">Chat Workspace</h1>
      <p class="text-muted mb-0">A calm, focused space for crafting responses.</p>
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
</style>
