<script lang="ts">
  import type { MessageRecord } from '$lib/storage/db';
  import { currentConversationIdStore } from '$lib/stores/conversations';
  import { messagesStore } from '$lib/stores/messages';
  import { uiStore, type UiError } from '$lib/stores/ui';

  let currentMessages: MessageRecord[] = [];
  let activeError: UiError | null = null;

  $: if ($currentConversationIdStore) {
    void messagesStore.load($currentConversationIdStore);
  }

  $: currentMessages = $currentConversationIdStore
    ? $messagesStore[$currentConversationIdStore] ?? []
    : [];

  $: activeError =
    $uiStore.error &&
    ($uiStore.error.conversationId ?? null) === $currentConversationIdStore
      ? $uiStore.error
      : null;

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
</script>

<section class="message-list">
  <header>
    <h2>Messages</h2>
    <p>Conversation history appears here.</p>
  </header>

  {#if activeError}
    <div class="error-banner">
      <div>
        <strong>{activeError.title}</strong>
        <p>{activeError.message}</p>
        {#if activeError.mode || activeError.status}
          <p class="context">
            {#if activeError.mode}
              {activeError.mode === 'proxy' ? 'Proxy mode' : 'Direct mode'}
            {/if}
            {#if activeError.status}
              {activeError.mode ? ' · ' : ''}Status {activeError.status}
            {/if}
          </p>
        {/if}
        {#if activeError.detail}
          <p class="detail">{activeError.detail}</p>
        {/if}
      </div>
      <div class="actions">
        {#if activeError.retry}
          <button type="button" on:click={() => void activeError.retry?.()}>
            {activeError.actionLabel ?? 'Retry'}
          </button>
        {/if}
        <button type="button" class="ghost" on:click={() => uiStore.clearError()}>
          Dismiss
        </button>
      </div>
    </div>
  {/if}

  <div class="messages">
    {#if !$currentConversationIdStore}
      <div class="empty">Select or start a conversation to begin chatting.</div>
    {:else if currentMessages.length === 0}
      <div class="empty">No messages yet. Say hello!</div>
    {:else}
      {#each currentMessages as message (message.id)}
        <article class="message {message.role}">
          <div class="meta">
            <span class="role">{message.role}</span>
            <span>{formatTime(message.createdAt)}</span>
          </div>
          <p>{message.content}</p>
        </article>
      {/each}
    {/if}
  </div>
</section>

<style>
  .message-list {
    display: grid;
    gap: 1rem;
    flex: 1;
    min-height: 0;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  h2 {
    margin: 0;
  }

  p {
    margin: 0;
    color: #667085;
  }

  .messages {
    display: grid;
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .error-banner {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 14px;
    border: 1px solid #f2c94c;
    background: #fffbeb;
    color: #7a5200;
  }

  .error-banner strong {
    display: block;
    font-size: 0.95rem;
    color: #7a5200;
  }

  .error-banner p {
    margin: 0.35rem 0 0;
  }

  .error-banner .context {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #a87000;
  }

  .error-banner .detail {
    font-size: 0.8rem;
    color: #946200;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .error-banner button {
    border: none;
    background: #f2c94c;
    color: #5c3d00;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    font-weight: 600;
  }

  .error-banner button.ghost {
    background: transparent;
    border: 1px solid #f2c94c;
  }

  .message {
    padding: 1rem;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e5eaf3;
  }

  .message.user {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .message.assistant {
    background: #ecfdf3;
    border-color: #b7ebc6;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #667085;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .message p {
    margin: 0.5rem 0 0;
    white-space: pre-wrap;
  }

  .empty {
    padding: 2rem;
    border-radius: 12px;
    border: 1px dashed #c8d0e0;
    text-align: center;
    color: #667085;
  }
</style>
