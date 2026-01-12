<script lang="ts">
  import type { ConversationRecord } from '$lib/storage/db';
  import { conversationsStore, currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';

  const createConversation = () => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const conversation: ConversationRecord = {
      id,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
    };

    conversationsStore.upsert(conversation);
    currentConversationIdStore.set(id);
  };

  const selectConversation = (conversationId: string) => {
    currentConversationIdStore.set(conversationId);
  };

  const removeConversation = async (conversationId: string) => {
    await conversationsStore.remove(conversationId);
    await messagesStore.clear(conversationId);
  };

  const formatTimestamp = (value: number) =>
    new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

  $: if (!$currentConversationIdStore && $conversationsStore.length > 0) {
    currentConversationIdStore.set($conversationsStore[0].id);
  }
</script>

<section class="conversation-list">
  <header>
    <div>
      <h2>Conversations</h2>
      <p>Pick up where you left off.</p>
    </div>
    <button class="new" type="button" on:click={createConversation}>New</button>
  </header>

  <div class="list">
    {#if $conversationsStore.length === 0}
      <div class="empty">
        <p>No conversations yet.</p>
        <button type="button" on:click={createConversation}>Start one</button>
      </div>
    {:else}
      {#each $conversationsStore as conversation (conversation.id)}
        <div
          class="row {conversation.id === $currentConversationIdStore
            ? 'active'
            : ''}"
        >
          <button
            class="select"
            type="button"
            on:click={() => selectConversation(conversation.id)}
          >
            <div>
              <h3>{conversation.title}</h3>
              <span>{formatTimestamp(conversation.updatedAt)}</span>
            </div>
            <span class="meta">Updated</span>
          </button>
          <button
            class="delete"
            type="button"
            on:click={() => removeConversation(conversation.id)}
            aria-label="Delete conversation"
          >
            ✕
          </button>
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
  .conversation-list {
    display: grid;
    gap: 1rem;
    height: 100%;
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  h2 {
    margin: 0;
  }

  p {
    margin: 0.25rem 0 0;
    color: #667085;
  }

  .new {
    background: #4c6fff;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 600;
  }

  .list {
    display: grid;
    gap: 0.75rem;
    overflow-y: auto;
  }

  .row {
    border: 1px solid #e5eaf3;
    border-radius: 12px;
    background: #fff;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  .row.active {
    border-color: #4c6fff;
    box-shadow: 0 0 0 3px rgba(76, 111, 255, 0.1);
  }

  .select {
    background: transparent;
    border: none;
    text-align: left;
    padding: 0.75rem 0.75rem 0.75rem 1rem;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
    align-items: center;
  }

  .row h3 {
    margin: 0;
    font-size: 0.95rem;
  }

  .row span {
    color: #667085;
    font-size: 0.8rem;
  }

  .meta {
    color: #94a3b8;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .delete {
    border: none;
    background: transparent;
    color: #94a3b8;
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
  }

  .empty {
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px dashed #c8d0e0;
    color: #667085;
    text-align: center;
    display: grid;
    gap: 0.75rem;
  }

  .empty button {
    border: none;
    background: #e5eaf3;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-weight: 600;
  }
</style>
