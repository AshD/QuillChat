<script lang="ts">
  import ConversationList from '$lib/components/ConversationList.svelte';
  import MessageComposer from '$lib/components/MessageComposer.svelte';
  import MessageList from '$lib/components/MessageList.svelte';
</script>

<section class="chat-layout">
  <header>
    <h1>Chat Workspace</h1>
    <p>Start shaping the conversation flow for QuillChat.</p>
  </header>

  <div class="workspace">
    <aside class="sidebar">
      <ConversationList />
    </aside>
    <div class="thread">
      <MessageList />
      <MessageComposer />
    </div>
  </div>
</section>

<style>
  .chat-layout {
    display: grid;
    gap: 1.5rem;
  }

  header {
    display: grid;
    gap: 0.5rem;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    gap: 1.5rem;
    align-items: stretch;
  }

  .sidebar {
    border-radius: 16px;
    border: 1px solid #e5eaf3;
    padding: 1.25rem;
    background: #f8fafc;
    min-height: 480px;
  }

  .thread {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 480px;
  }
</style>
