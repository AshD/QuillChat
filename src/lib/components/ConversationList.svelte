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

<section class="conversation-list d-grid gap-3">
  <header class="d-flex justify-content-between align-items-start gap-3">
    <div>
      <h2 class="h6 text-uppercase text-muted mb-1">Conversations</h2>
      <p class="text-muted small mb-0">Pick up where you left off.</p>
    </div>
    <button class="btn btn-success btn-sm rounded-pill" type="button" on:click={createConversation}>
      New chat
    </button>
  </header>

  <div class="list d-grid gap-2">
    {#if $conversationsStore.length === 0}
      <div class="empty border border-dashed rounded-4 text-center p-4 text-muted bg-light">
        <p class="mb-2">No conversations yet.</p>
        <button type="button" class="btn btn-outline-success btn-sm rounded-pill" on:click={createConversation}>
          Start one
        </button>
      </div>
    {:else}
      {#each $conversationsStore as conversation (conversation.id)}
        <div
          class="conversation-row d-flex align-items-center justify-content-between gap-3 p-3 border rounded-4 bg-white {conversation.id ===
          $currentConversationIdStore
            ? 'active'
            : ''}"
        >
          <button
            class="select btn btn-link text-start text-decoration-none flex-grow-1 p-0 text-body"
            type="button"
            on:click={() => selectConversation(conversation.id)}
          >
            <div class="d-flex justify-content-between align-items-center gap-3">
              <div>
                <h3 class="h6 mb-1 fw-semibold">{conversation.title}</h3>
                <span class="text-muted small">{formatTimestamp(conversation.updatedAt)}</span>
              </div>
              <span class="meta text-uppercase text-muted small">Updated</span>
            </div>
          </button>
          <button
            class="btn btn-outline-secondary btn-sm rounded-circle icon-button"
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
  .conversation-row.active {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
  }

  .conversation-row.active .select,
  .conversation-row.active .select h3,
  .conversation-row.active .select span,
  .conversation-row.active .select .meta {
    color: #047857;
  }

  .border-dashed {
    border-style: dashed;
  }

  .icon-button {
    border: none;
  }

  .icon-button:focus {
    box-shadow: none;
  }
</style>
